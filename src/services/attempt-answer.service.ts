import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttemptAnswer } from '../entities/attempt-answer.entity';
import { Attempt } from '../entities/attempt.entity';
import { Question } from '../entities/question.entity';
import { CreateAttemptAnswerDto, UpdateAttemptAnswerDto } from '../dto/attempt-answer.dto';

@Injectable()
export class AttemptAnswerService {
  constructor(
    @InjectRepository(AttemptAnswer)
    private attemptAnswerRepository: Repository<AttemptAnswer>,
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(createAttemptAnswerDto: CreateAttemptAnswerDto): Promise<AttemptAnswer> {
    // Verify attempt exists
    const attempt = await this.attemptRepository.findOne({
      where: { id: createAttemptAnswerDto.attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${createAttemptAnswerDto.attemptId} not found`);
    }

    // Verify question exists and belongs to the quiz
    const question = await this.questionRepository.findOne({
      where: { 
        id: createAttemptAnswerDto.questionId,
        quizId: attempt.quizId 
      },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID ${createAttemptAnswerDto.questionId} not found in this quiz`
      );
    }

    // Check if answer already exists for this attempt and question
    const existingAnswer = await this.attemptAnswerRepository.findOne({
      where: {
        attemptId: createAttemptAnswerDto.attemptId,
        questionId: createAttemptAnswerDto.questionId,
      },
    });

    if (existingAnswer) {
      throw new BadRequestException(
        `Answer already exists for attempt ${createAttemptAnswerDto.attemptId} and question ${createAttemptAnswerDto.questionId}`
      );
    }

    const attemptAnswer = this.attemptAnswerRepository.create({
      attemptId: createAttemptAnswerDto.attemptId,
      questionId: createAttemptAnswerDto.questionId,
      answer: createAttemptAnswerDto.selectedAnswer,
      isCorrect: createAttemptAnswerDto.selectedAnswer === question.correctAnswer,
    });

    return await this.attemptAnswerRepository.save(attemptAnswer);
  }

  async findAll(): Promise<AttemptAnswer[]> {
    return await this.attemptAnswerRepository.find({
      relations: ['attempt', 'question'],
      order: { id: 'DESC' },
    });
  }

  async findByAttemptId(attemptId: number): Promise<AttemptAnswer[]> {
    const attempt = await this.attemptRepository.findOne({ where: { id: attemptId } });
    
    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    return await this.attemptAnswerRepository.find({
      where: { attemptId },
      relations: ['question'],
      order: { id: 'ASC' },
    });
  }

  async findByQuestionId(questionId: number): Promise<AttemptAnswer[]> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return await this.attemptAnswerRepository.find({
      where: { questionId },
      relations: ['attempt'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AttemptAnswer> {
    const attemptAnswer = await this.attemptAnswerRepository.findOne({
      where: { id },
      relations: ['attempt', 'question'],
    });

    if (!attemptAnswer) {
      throw new NotFoundException(`Attempt answer with ID ${id} not found`);
    }

    return attemptAnswer;
  }

  async update(id: number, updateAttemptAnswerDto: UpdateAttemptAnswerDto): Promise<AttemptAnswer> {
    const attemptAnswer = await this.findOne(id);

    if (updateAttemptAnswerDto.selectedAnswer) {
      attemptAnswer.answer = updateAttemptAnswerDto.selectedAnswer;
      // Recheck if answer is correct
      const question = await this.questionRepository.findOne({ where: { id: attemptAnswer.questionId } });
      if (question) {
        attemptAnswer.isCorrect = updateAttemptAnswerDto.selectedAnswer === question.correctAnswer;
      }
    }

    return await this.attemptAnswerRepository.save(attemptAnswer);
  }

  async remove(id: number): Promise<void> {
    const attemptAnswer = await this.findOne(id);
    await this.attemptAnswerRepository.remove(attemptAnswer);
  }

  async removeByAttemptId(attemptId: number): Promise<void> {
    const answers = await this.findByAttemptId(attemptId);
    if (answers.length > 0) {
      await this.attemptAnswerRepository.remove(answers);
    }
  }

  async getAnswersByAttemptAndQuiz(attemptId: number, quizId: number): Promise<AttemptAnswer[]> {
    return await this.attemptAnswerRepository
      .createQueryBuilder('aa')
      .innerJoin('aa.attempt', 'attempt')
      .innerJoin('aa.question', 'question')
      .where('aa.attemptId = :attemptId', { attemptId })
      .andWhere('attempt.quizId = :quizId', { quizId })
      .andWhere('question.quizId = :quizId', { quizId })
      .getMany();
  }

  async countCorrectAnswers(attemptId: number): Promise<number> {
    const result = await this.attemptAnswerRepository
      .createQueryBuilder('aa')
      .innerJoin('aa.question', 'question')
      .where('aa.attemptId = :attemptId', { attemptId })
      .andWhere('aa.selectedAnswer = question.correctAnswer')
      .getCount();

    return result;
  }

  async getAnswerStatistics(questionId: number): Promise<{
    totalAnswers: number;
    correctAnswers: number;
    incorrectAnswers: number;
    answerDistribution: { answer: string; count: number }[];
  }> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    const answers = await this.attemptAnswerRepository.find({
      where: { questionId },
    });

    const totalAnswers = answers.length;
    const correctAnswers = answers.filter(a => a.answer === question.correctAnswer).length;
    const incorrectAnswers = totalAnswers - correctAnswers;

    // Calculate answer distribution
    const distribution = answers.reduce((acc, answer) => {
      const existing = acc.find(d => d.answer === answer.answer);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ answer: answer.answer, count: 1 });
      }
      return acc;
    }, [] as { answer: string; count: number }[]);

    return {
      totalAnswers,
      correctAnswers,
      incorrectAnswers,
      answerDistribution: distribution,
    };
  }
}