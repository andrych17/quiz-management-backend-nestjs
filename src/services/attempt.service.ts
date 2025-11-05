import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt } from '../entities/attempt.entity';
import { AttemptAnswer } from '../entities/attempt-answer.entity';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { CreateAttemptDto, UpdateAttemptDto, AttemptResponseDto } from '../dto/attempt.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

@Injectable()
export class AttemptService {
  constructor(
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
    @InjectRepository(AttemptAnswer)
    private attemptAnswerRepository: Repository<AttemptAnswer>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(createAttemptDto: CreateAttemptDto): Promise<AttemptResponseDto> {
    try {
      // Verify quiz exists
      const quiz = await this.quizRepository.findOne({
        where: { id: createAttemptDto.quizId },
        relations: ['questions'],
      });

      if (!quiz) {
        throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
      }

      // Check if participant already attempted this quiz
      const existingAttempt = await this.attemptRepository.findOne({
        where: {
          email: createAttemptDto.email,
          quizId: createAttemptDto.quizId,
        },
      });

      if (existingAttempt) {
        throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_SUBMISSION);
      }

      // Create attempt
      const attempt = this.attemptRepository.create({
        quizId: createAttemptDto.quizId,
        participantName: createAttemptDto.participantName,
        email: createAttemptDto.email,
        nij: createAttemptDto.nij,
        startedAt: new Date(),
      });

      const savedAttempt = await this.attemptRepository.save(attempt);

      // Process answers and calculate score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      for (const answerDto of createAttemptDto.answers) {
        const question = quiz.questions.find(q => q.id === answerDto.questionId);
        if (!question) continue;

        const isCorrect = question.correctAnswer === answerDto.answer;
        if (isCorrect) correctAnswers++;

        const attemptAnswer = this.attemptAnswerRepository.create({
          attemptId: savedAttempt.id,
          questionId: answerDto.questionId,
          answer: answerDto.answer,
          isCorrect,
        });

        await this.attemptAnswerRepository.save(attemptAnswer);
      }

      // Update attempt with score and completion time
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= (quiz.passingScore || 70);
      
      await this.attemptRepository.update(savedAttempt.id, {
        score,
        passed,
        completedAt: new Date(),
        submittedAt: new Date(),
      });

      return this.findOne(savedAttempt.id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    email?: string,
    quizId?: number,
  ) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (email) {
      whereCondition.email = email;
    }

    if (quizId) {
      whereCondition.quizId = quizId;
    }

    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'quiz'],
    });

    return {
      data: attempts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<AttemptResponseDto> {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ['user', 'quiz', 'answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    return attempt;
  }

  async update(id: number, updateAttemptDto: UpdateAttemptDto): Promise<AttemptResponseDto> {
    const attempt = await this.attemptRepository.findOne({ where: { id } });

    if (!attempt) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    await this.attemptRepository.update(id, updateAttemptDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const attempt = await this.attemptRepository.findOne({ where: { id } });

    if (!attempt) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    await this.attemptRepository.remove(attempt);
    return { message: SUCCESS_MESSAGES.DELETED('Attempt') };
  }

  async getAnswers(id: number) {
    const attempt = await this.attemptRepository.findOne({
      where: { id },
      relations: ['answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    return attempt.answers.sort((a, b) => a.question.order - b.question.order);
  }

  async exportAttempts(quizId: number) {
    const attempts = await this.attemptRepository.find({
      where: { quizId },
      relations: ['user', 'quiz', 'answers', 'answers.question'],
      order: { createdAt: 'DESC' },
    });

    if (attempts.length === 0) {
      return { data: [], message: 'No attempts found for this quiz' };
    }

    // Format data for CSV export
    const csvData = attempts.map(attempt => ({
      'Attempt ID': attempt.id,
      'Participant Name': attempt.participantName,
      'Participant Email': attempt.email,
      'NIJ': attempt.nij,
      'Quiz Title': attempt.quiz.title,
      'Score': attempt.score,
      'Passed': attempt.passed ? 'Yes' : 'No',
      'Started At': attempt.startedAt.toISOString(),
      'Completed At': attempt.completedAt?.toISOString() || 'Not completed',
      'Submitted At': attempt.submittedAt?.toISOString() || 'Not submitted',
      'Total Questions': attempt.answers.length,
      'Correct Answers': attempt.answers.filter(a => a.isCorrect).length,
    }));

    return {
      data: csvData,
      filename: `quiz-${quizId}-attempts-${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  async getAttemptsByEmail(email: string): Promise<Attempt[]> {
    return this.attemptRepository.find({
      where: { email },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAttemptsByQuiz(quizId: number): Promise<Attempt[]> {
    return this.attemptRepository.find({
      where: { quizId },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }
}