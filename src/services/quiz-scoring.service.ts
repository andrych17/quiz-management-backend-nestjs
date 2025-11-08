import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizScoring } from '../entities/quiz-scoring.entity';
import { Quiz } from '../entities/quiz.entity';
import { Attempt } from '../entities/attempt.entity';
import { AttemptAnswer } from '../entities/attempt-answer.entity';
import { CreateQuizScoringDto, UpdateQuizScoringDto, CalculateScoreDto } from '../dto/quiz-scoring.dto';

@Injectable()
export class QuizScoringService {
  constructor(
    @InjectRepository(QuizScoring)
    private quizScoringRepository: Repository<QuizScoring>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Attempt)
    private attemptRepository: Repository<Attempt>,
    @InjectRepository(AttemptAnswer)
    private attemptAnswerRepository: Repository<AttemptAnswer>,
  ) {}

  async create(createQuizScoringDto: CreateQuizScoringDto): Promise<QuizScoring> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findOne({
      where: { id: createQuizScoringDto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${createQuizScoringDto.quizId} not found`);
    }

    // Check if scoring name already exists for this quiz
    const existingScoring = await this.quizScoringRepository.findOne({
      where: {
        quizId: createQuizScoringDto.quizId,
        scoringName: createQuizScoringDto.scoringName,
      },
    });

    if (existingScoring) {
      throw new BadRequestException(
        `Scoring template with name '${createQuizScoringDto.scoringName}' already exists for this quiz`
      );
    }

    const quizScoring = this.quizScoringRepository.create({
      ...createQuizScoringDto,
      correctAnswerPoints: createQuizScoringDto.correctAnswerPoints ?? 10,
      incorrectAnswerPenalty: createQuizScoringDto.incorrectAnswerPenalty ?? 0,
      unansweredPenalty: createQuizScoringDto.unansweredPenalty ?? 0,
      bonusPoints: createQuizScoringDto.bonusPoints ?? 0,
      multiplier: createQuizScoringDto.multiplier ?? 1.0,
      timeBonusEnabled: createQuizScoringDto.timeBonusEnabled ?? false,
      timeBonusPerSecond: createQuizScoringDto.timeBonusPerSecond ?? 0.0,
      isActive: createQuizScoringDto.isActive ?? true,
    });

    return await this.quizScoringRepository.save(quizScoring);
  }

  async findAll(): Promise<QuizScoring[]> {
    return await this.quizScoringRepository.find({
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByQuizId(quizId: number): Promise<QuizScoring[]> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    return await this.quizScoringRepository.find({
      where: { quizId },
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<QuizScoring> {
    const quizScoring = await this.quizScoringRepository.findOne({
      where: { id },
      relations: ['quiz'],
    });

    if (!quizScoring) {
      throw new NotFoundException(`Quiz scoring template with ID ${id} not found`);
    }

    return quizScoring;
  }

  async update(id: number, updateQuizScoringDto: UpdateQuizScoringDto): Promise<QuizScoring> {
    const quizScoring = await this.findOne(id);

    // Check if scoring name conflicts (if updating name)
    if (updateQuizScoringDto.scoringName && updateQuizScoringDto.scoringName !== quizScoring.scoringName) {
      const existingScoring = await this.quizScoringRepository.findOne({
        where: {
          quizId: quizScoring.quizId,
          scoringName: updateQuizScoringDto.scoringName,
        },
      });

      if (existingScoring) {
        throw new BadRequestException(
          `Scoring template with name '${updateQuizScoringDto.scoringName}' already exists for this quiz`
        );
      }
    }

    Object.assign(quizScoring, updateQuizScoringDto);
    return await this.quizScoringRepository.save(quizScoring);
  }

  async remove(id: number): Promise<void> {
    const quizScoring = await this.findOne(id);
    await this.quizScoringRepository.remove(quizScoring);
  }

  async setActiveScoring(quizId: number, scoringId: number): Promise<QuizScoring> {
    // Deactivate all other scoring templates for this quiz
    await this.quizScoringRepository.createQueryBuilder()
      .update(QuizScoring)
      .set({ isActive: false })
      .where('quizId = :quizId AND id != :scoringId', { quizId, scoringId })
      .execute();

    // Activate the selected scoring template
    const result = await this.quizScoringRepository.update(
      { id: scoringId },
      { isActive: true }
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Quiz scoring template with ID ${scoringId} not found`);
    }

    return await this.findOne(scoringId);
  }

  async calculateScore(calculateScoreDto: CalculateScoreDto): Promise<{
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    breakdown: {
      correctAnswers: number;
      incorrectAnswers: number;
      unansweredQuestions: number;
      correctPoints: number;
      incorrectPenalty: number;
      unansweredPenalty: number;
      bonusPoints: number;
      timeBonus: number;
      finalScore: number;
    };
    passed: boolean;
  }> {
    const { attemptId, scoringId, timeSpentSeconds } = calculateScoreDto;

    // Get scoring template
    const scoring = await this.findOne(scoringId);

    // Get attempt with answers and quiz details
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['quiz', 'quiz.questions', 'answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    const quiz = attempt.quiz;
    const totalQuestions = quiz.questions.length;
    const answeredQuestions = attempt.answers.length;
    
    // Count correct answers
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    
    for (const answer of attempt.answers) {
      if (answer.selectedAnswer === answer.question.correctAnswer) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }
    }

    const unansweredQuestions = totalQuestions - answeredQuestions;

    // Calculate points
    const correctPoints = correctAnswers * scoring.correctAnswerPoints;
    const incorrectPenalty = incorrectAnswers * scoring.incorrectAnswerPenalty;
    const unansweredPenalty = unansweredQuestions * scoring.unansweredPenalty;
    
    // Calculate time bonus
    let timeBonus = 0;
    if (scoring.timeBonusEnabled && timeSpentSeconds) {
      // Assume quiz has a time limit (you can add this to quiz entity later)
      const estimatedTimeLimit = totalQuestions * 60; // 1 minute per question
      const timeSaved = Math.max(0, estimatedTimeLimit - timeSpentSeconds);
      timeBonus = timeSaved * scoring.timeBonusPerSecond;
    }

    // Calculate base score
    let baseScore = correctPoints - incorrectPenalty - unansweredPenalty + scoring.bonusPoints + timeBonus;
    
    // Apply multiplier
    let finalScore = baseScore * scoring.multiplier;

    // Apply min/max constraints
    if (scoring.minScore !== null && finalScore < scoring.minScore) {
      finalScore = scoring.minScore;
    }
    if (scoring.maxScore !== null && finalScore > scoring.maxScore) {
      finalScore = scoring.maxScore;
    }

    // Ensure final score is not negative
    finalScore = Math.max(0, finalScore);

    // Calculate max possible score
    const maxPossibleScore = scoring.maxScore || (totalQuestions * scoring.correctAnswerPoints * scoring.multiplier);
    
    // Calculate percentage
    const percentage = maxPossibleScore > 0 ? (finalScore / maxPossibleScore) * 100 : 0;
    
    // Determine if passed
    const passingThreshold = scoring.passingScore || quiz.passingScore;
    const passed = finalScore >= passingThreshold;

    return {
      totalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
      maxPossibleScore,
      percentage: Math.round(percentage * 100) / 100,
      breakdown: {
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        correctPoints,
        incorrectPenalty,
        unansweredPenalty,
        bonusPoints: scoring.bonusPoints,
        timeBonus: Math.round(timeBonus * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100,
      },
      passed,
    };
  }

  async getActiveScoring(quizId: number): Promise<QuizScoring | null> {
    return await this.quizScoringRepository.findOne({
      where: {
        quizId,
        isActive: true,
      },
      relations: ['quiz'],
    });
  }
}