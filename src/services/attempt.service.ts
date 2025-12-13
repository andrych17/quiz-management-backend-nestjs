import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Attempt } from '../entities/attempt.entity';
import { AttemptAnswer } from '../entities/attempt-answer.entity';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import {
  CreateAttemptDto,
  UpdateAttemptDto,
  AttemptResponseDto,
} from '../dto/attempt.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { ConfigService } from './config.service';

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
    private readonly configService: ConfigService,
  ) {}

  async create(
    createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    try {
      // If no answers provided, just create initial attempt (for start quiz)
      if (!createAttemptDto.answers || createAttemptDto.answers.length === 0) {
        return this.startQuizAttempt(createAttemptDto);
      }

      // Regular flow with answers (for submit quiz)
      return this.submitQuizAttempt(createAttemptDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  private async startQuizAttempt(
    createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findOne({
      where: { id: createAttemptDto.quizId },
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

    // Create initial attempt (no answers, no score yet)
    const attempt = this.attemptRepository.create({
      quizId: createAttemptDto.quizId,
      participantName: createAttemptDto.participantName,
      email: createAttemptDto.email,
      nij: createAttemptDto.nij,
      startedAt: new Date(),
      // No score, no completion time yet
    });

    const savedAttempt = await this.attemptRepository.save(attempt);
    return this.findOne(savedAttempt.id);
  }

  async findByEmailAndQuiz(email: string, quizId: number) {
    return await this.attemptRepository.findOne({
      where: {
        email: email,
        quizId: quizId,
      },
      relations: ['quiz'],
    });
  }

  async findByNijEmailAndQuiz(nij: string, email: string, quizId: number) {
    return await this.attemptRepository.findOne({
      where: {
        nij: nij,
        email: email,
        quizId: quizId,
      },
      relations: ['quiz'],
    });
  }

  async findByNijAndQuiz(nij: string, quizId: number) {
    return await this.attemptRepository.findOne({
      where: {
        nij: nij,
        quizId: quizId,
      },
      relations: ['quiz'],
    });
  }

  private async submitQuizAttempt(
    createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    // Verify quiz exists and load scoring templates
    const quiz = await this.quizRepository.findOne({
      where: { id: createAttemptDto.quizId },
      relations: ['questions', 'scoringTemplates'],
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
      const question = quiz.questions.find(
        (q) => q.id === answerDto.questionId,
      );
      if (!question) continue;

      const isCorrect = question.correctAnswer === answerDto.answer;
      if (isCorrect) correctAnswers++;

      const attemptAnswer = this.attemptAnswerRepository.create({
        attemptId: savedAttempt.id,
        questionId: answerDto.questionId,
        answerText: answerDto.answer,
      });

      await this.attemptAnswerRepository.save(attemptAnswer);
    }

    // Update attempt with score and completion time using scoring templates
    const incorrectAnswers = totalQuestions - correctAnswers;

    // Gunakan scoring system dari quiz (IPK mode atau percentage mode)
    let finalScore = 0;
    let grade = 'F';
    let passed = false;

    if (quiz.scoringTemplates && quiz.scoringTemplates.length > 0) {
      // Mode IPK: Cari nilai berdasarkan jumlah benar
      const matchingTemplate = quiz.scoringTemplates.find(
        (template) =>
          correctAnswers >= template.minScore &&
          correctAnswers <= template.maxScore,
      );

      if (matchingTemplate) {
        finalScore = matchingTemplate.correctAnswerPoints; // Nilai akhir (70, 80, 90, dll)
        grade = matchingTemplate.scoringName; // Grade (A, B, C, dll)
      } else {
        // Fallback ke persentase jika tidak ada template yang cocok
        finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      }
    } else {
      // Mode default: gunakan persentase
      finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    }

    passed = finalScore >= (quiz.passingScore || 70);

    await this.attemptRepository.update(savedAttempt.id, {
      score: finalScore,
      grade: grade,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      passed,
      completedAt: new Date(),
      submittedAt: new Date(),
    });

    return this.findOne(savedAttempt.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    email?: string,
    quizId?: number,
    sortBy: string = 'submittedAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (email) {
      whereCondition.email = email;
    }

    if (quizId) {
      whereCondition.quizId = quizId;
    }

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      'participantName',
      'email',
      'score',
      'submittedAt',
      'createdAt',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'submittedAt';
    const validSortOrder =
      sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';

    // Build order object
    const orderOptions: any = {};
    orderOptions[validSortBy] = validSortOrder;

    const [attempts, total] = await this.attemptRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: orderOptions,
      relations: ['quiz'],
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
      relations: ['quiz', 'answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    return attempt;
  }

  async update(
    id: number,
    updateAttemptDto: UpdateAttemptDto,
  ): Promise<AttemptResponseDto> {
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
      relations: ['quiz', 'answers', 'answers.question'],
      order: { createdAt: 'DESC' },
    });

    if (attempts.length === 0) {
      return { data: [], message: 'No attempts found for this quiz' };
    }

    // Format data for CSV export
    const csvData = attempts.map((attempt) => ({
      'Attempt ID': attempt.id,
      'Participant Name': attempt.participantName,
      'Participant Email': attempt.email,
      NIJ: attempt.nij,
      'Quiz Title': attempt.quiz.title,
      Score: attempt.score,
      Passed: attempt.passed ? 'Yes' : 'No',
      'Started At': attempt.startedAt.toISOString(),
      'Completed At': attempt.completedAt?.toISOString() || 'Not completed',
      'Submitted At': attempt.submittedAt?.toISOString() || 'Not submitted',
      'Total Questions': attempt.answers.length,
      'Correct Answers': attempt.answers.filter((a) => a.answerText === a.question?.correctAnswer).length,
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

  async findAllWithFilter(
    page: number = 1,
    limit: number = 10,
    search?: string,
    serviceKey?: string,
    locationKey?: string,
    quizId?: number,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;
    
    // Build query - simplified tanpa leftJoinAndSelect answers
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz');

    // Filter by quiz if specified
    if (quizId) {
      queryBuilder.where('attempt.quizId = :quizId', { quizId });
    }

    // Filter by service
    if (serviceKey && serviceKey !== 'all_services' && !serviceKey.startsWith('all_')) {
      queryBuilder.andWhere('quiz.serviceKey = :serviceKey', { serviceKey });
    }

    // Filter by location
    if (locationKey && locationKey !== 'all_locations' && !locationKey.startsWith('all_')) {
      queryBuilder.andWhere('quiz.locationKey = :locationKey', { locationKey });
    }

    // Search by participant name, email, or quiz title
    if (search) {
      queryBuilder.andWhere(
        '(UPPER(attempt.participantName) LIKE UPPER(:search) OR ' +
        'UPPER(attempt.email) LIKE UPPER(:search) OR ' +
        'UPPER(attempt.nij) LIKE UPPER(:search) OR ' +
        'UPPER(quiz.title) LIKE UPPER(:search))',
        { search: `%${search}%` }
      );
    }

    // Date range filter
    if (startDate) {
      queryBuilder.andWhere('attempt.startedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      queryBuilder.andWhere('attempt.startedAt <= :endDate', { endDate: new Date(endDate) });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const attempts = await queryBuilder
      .orderBy('attempt.startedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Get config mappings for display names
    const mappings = await this.configService.getMappings();

    // Transform data with display names - simplified response
    const transformedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      participantName: attempt.participantName,
      email: attempt.email,
      nij: attempt.nij,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || 'Unknown Quiz',
      serviceKey: attempt.quiz?.serviceKey,
      serviceName: attempt.quiz?.serviceKey 
        ? mappings.services.mapping[attempt.quiz.serviceKey] || attempt.quiz.serviceKey 
        : 'No Service',
      locationKey: attempt.quiz?.locationKey,
      locationName: attempt.quiz?.locationKey 
        ? mappings.locations.mapping[attempt.quiz.locationKey] || attempt.quiz.locationKey 
        : 'No Location',
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      grade: attempt.grade,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      items: transformedAttempts,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getAttemptWithAnswers(attemptId: number) {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['quiz', 'answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Sort answers by question order
    const sortedAnswers = attempt.answers?.sort((a, b) => (a.question?.order || 0) - (b.question?.order || 0)) || [];

    return {
      id: attempt.id,
      participantName: attempt.participantName,
      email: attempt.email,
      nij: attempt.nij,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        serviceKey: attempt.quiz.serviceKey,
        serviceName: attempt.quiz.serviceKey 
          ? mappings.services.mapping[attempt.quiz.serviceKey] || attempt.quiz.serviceKey 
          : 'No Service',
        locationKey: attempt.quiz.locationKey,
        locationName: attempt.quiz.locationKey 
          ? mappings.locations.mapping[attempt.quiz.locationKey] || attempt.quiz.locationKey 
          : 'No Location',
        passingScore: attempt.quiz.passingScore,
      },
      score: attempt.score,
      grade: attempt.grade,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
      answers: sortedAnswers.map((answer, index) => ({
        id: answer.id,
        questionNumber: index + 1,
        questionText: answer.question?.questionText || 'Question not found',
        questionType: answer.question?.questionType || 'unknown',
        questionOptions: answer.question?.options || [],
        answerText: answer.answerText,
        correctAnswer: answer.question?.correctAnswer || '',
        isCorrect: answer.answerText === answer.question?.correctAnswer,
      })),
      summary: {
        totalQuestions: sortedAnswers.length,
        correctAnswers: sortedAnswers.filter(a => a.answerText === a.question?.correctAnswer).length,
        wrongAnswers: sortedAnswers.filter(a => a.answerText !== a.question?.correctAnswer).length,
        scorePercentage: attempt.quiz?.questions?.length 
          ? Math.round((sortedAnswers.filter(a => a.answerText === a.question?.correctAnswer).length / attempt.quiz.questions.length) * 100)
          : 0,
      },
    };
  }
}
