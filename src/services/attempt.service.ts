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
import * as ExcelJS from 'exceljs';
import { DebugLogger } from '../lib/debug-logger';

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
      // Check if attempt is still within the valid time window
      if (existingAttempt.endDateTime) {
        const now = new Date();
        if (now > existingAttempt.endDateTime) {
          throw new BadRequestException(
            'Quiz attempt time has expired. Please contact administrator.',
          );
        }
      }

      // If already submitted, don't allow restart
      if (existingAttempt.submittedAt) {
        throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_SUBMISSION);
      }

      // Allow resume - return existing attempt
      return this.findOne(existingAttempt.id);
    }

    // Calculate start and end date time
    const startDateTime = new Date();
    let endDateTime: Date | null = null;

    if (quiz.durationMinutes) {
      endDateTime = new Date(
        startDateTime.getTime() + quiz.durationMinutes * 60000,
      );
    }

    // Create initial attempt (no answers, no score yet)
    const attempt = this.attemptRepository.create({
      quizId: createAttemptDto.quizId,
      participantName: createAttemptDto.participantName,
      email: createAttemptDto.email,
      nij: createAttemptDto.nij,
      servoNumber: createAttemptDto.servoNumber,
      serviceKey: createAttemptDto.serviceKey,
      startedAt: new Date(),
      startDateTime: startDateTime,
      endDateTime: endDateTime,
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

    let savedAttempt: Attempt;

    if (existingAttempt) {
      // Check if attempt time has expired
      if (existingAttempt.endDateTime) {
        const now = new Date();
        if (now > existingAttempt.endDateTime) {
          throw new BadRequestException(
            'Quiz attempt time has expired. Submission not allowed.',
          );
        }
      }

      // If already submitted, don't allow resubmission
      if (existingAttempt.submittedAt) {
        throw new BadRequestException(ERROR_MESSAGES.DUPLICATE_SUBMISSION);
      }

      // Use existing attempt for submission
      savedAttempt = existingAttempt;
    } else {
      // Calculate start and end date time for new attempt
      const startDateTime = new Date();
      let endDateTime: Date | null = null;

      if (quiz.durationMinutes) {
        endDateTime = new Date(
          startDateTime.getTime() + quiz.durationMinutes * 60000,
        );
      }

      // Create new attempt
      const attempt = this.attemptRepository.create({
        quizId: createAttemptDto.quizId,
        participantName: createAttemptDto.participantName,
        email: createAttemptDto.email,
        nij: createAttemptDto.nij,
        servoNumber: createAttemptDto.servoNumber,
        serviceKey: createAttemptDto.serviceKey,
        startedAt: new Date(),
        startDateTime: startDateTime,
        endDateTime: endDateTime,
      });

      savedAttempt = await this.attemptRepository.save(attempt);
    }

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

    // Gunakan scoring system dari quiz (IPK mode atau standard points mode)
    let finalScore = 0;
    let grade = 'F';
    let passed = false;

    DebugLogger.debug('AttemptService', 'Calculating score', {
      correctAnswers,
      totalQuestions,
      hasScoringTemplates: quiz.scoringTemplates?.length > 0,
      scoringTemplatesCount: quiz.scoringTemplates?.length || 0,
    });

    if (quiz.scoringTemplates && quiz.scoringTemplates.length > 0) {
      // Mode IQ/Custom Scoring: Cari nilai berdasarkan jumlah benar
      const matchingTemplate = quiz.scoringTemplates.find(
        (template) => template.correctAnswers === correctAnswers,
      );

      DebugLogger.debug('AttemptService', 'Searching for matching template', {
        correctAnswers,
        matchingTemplate: matchingTemplate
          ? {
              id: matchingTemplate.id,
              correctAnswers: matchingTemplate.correctAnswers,
              points: matchingTemplate.points,
            }
          : null,
      });

      if (matchingTemplate) {
        finalScore = matchingTemplate.points; // Nilai akhir dari tabel konversi (73, 74, 72, dll)
        DebugLogger.success('AttemptService', 'Using scoring template', {
          finalScore,
        });
      } else {
        // Fallback ke standard scoring (0-100) jika tidak ada template yang cocok
        finalScore = Math.round((correctAnswers / totalQuestions) * 100);
        DebugLogger.warn('AttemptService', 'No matching template, using fallback', {
          finalScore,
        });
      }
    } else {
      // Mode default: gunakan standard scoring (0-100)
      finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      DebugLogger.debug('AttemptService', 'No scoring templates, using default', {
        finalScore,
      });
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

  async exportAttemptsToExcel(
    quizId?: number,
    serviceKey?: string,
    locationKey?: string,
  ): Promise<Buffer> {
    DebugLogger.service('AttemptService', 'exportAttemptsToExcel', {
      quizId,
      serviceKey,
      locationKey,
    });

    // Build query with filters
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz');

    if (quizId) {
      queryBuilder.andWhere('attempt.quizId = :quizId', { quizId });
    }

    if (
      serviceKey &&
      serviceKey !== 'all_services' &&
      !serviceKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.serviceKey = :serviceKey', { serviceKey });
    }

    if (
      locationKey &&
      locationKey !== 'all_locations' &&
      !locationKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.locationKey = :locationKey', { locationKey });
    }

    const attempts = await queryBuilder
      .orderBy('attempt.submittedAt', 'DESC')
      .getMany();

    if (attempts.length === 0) {
      throw new NotFoundException(
        'No attempts found with the specified filters',
      );
    }

    DebugLogger.debug(
      'AttemptService',
      `Exporting ${attempts.length} attempts to Excel`,
    );

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quiz Results');

    // Set column headers (removed Grade)
    worksheet.columns = [
      { header: 'Participant Name', key: 'participantName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'NIJ', key: 'nij', width: 15 },
      { header: 'Quiz Title', key: 'quizTitle', width: 30 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Correct Answers', key: 'correctAnswers', width: 18 },
      { header: 'Total Questions', key: 'totalQuestions', width: 18 },
      { header: 'Passed', key: 'passed', width: 10 },
      { header: 'Started At', key: 'startedAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    attempts.forEach((attempt) => {
      const row = worksheet.addRow({
        participantName: attempt.participantName,
        email: attempt.email,
        nij: attempt.nij,
        quizTitle: attempt.quiz?.title || 'Unknown Quiz',
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        passed: attempt.passed ? 'Yes' : 'No',
        startedAt: attempt.startedAt
          ? new Date(attempt.startedAt).toLocaleString('id-ID')
          : '-',
        completedAt: attempt.completedAt
          ? new Date(attempt.completedAt).toLocaleString('id-ID')
          : '-',
      });

      // Conditional formatting for passed status
      const passedCell = row.getCell('passed');
      if (attempt.passed) {
        passedCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' }, // Light green
        };
        passedCell.font = { color: { argb: 'FF006100' } }; // Dark green
      } else {
        passedCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }, // Light red
        };
        passedCell.font = { color: { argb: 'FF9C0006' } }; // Dark red
      }
    });

    // Add title row
    worksheet.insertRow(1, [
      'Quiz Results Export',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 14 };
    titleRow.height = 25;

    // Add summary row
    const summaryRowIndex = worksheet.rowCount + 2;
    worksheet.getCell(`A${summaryRowIndex}`).value = 'Summary:';
    worksheet.getCell(`B${summaryRowIndex}`).value =
      `Total Attempts: ${attempts.length}`;
    worksheet.getCell(`D${summaryRowIndex}`).value =
      `Passed: ${attempts.filter((a) => a.passed).length}`;
    worksheet.getCell(`F${summaryRowIndex}`).value =
      `Failed: ${attempts.filter((a) => !a.passed).length}`;

    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.font = { bold: true };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const bufferData = Buffer.from(buffer);
    DebugLogger.success('AttemptService', `Excel file generated successfully`, {
      attemptCount: attempts.length,
      bufferSize: bufferData.byteLength,
    });
    return bufferData;
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
    quizName?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build query - simplified tanpa leftJoinAndSelect answers
    const queryBuilder = this.attemptRepository
      .createQueryBuilder('attempt')
      .leftJoinAndSelect('attempt.quiz', 'quiz');

    // Filter by quiz ID if specified
    if (quizId) {
      queryBuilder.andWhere('attempt.quizId = :quizId', { quizId });
    }

    // Filter by quiz name/title if specified
    if (quizName) {
      queryBuilder.andWhere('UPPER(quiz.title) LIKE UPPER(:quizName)', {
        quizName: `%${quizName}%`,
      });
    }

    // Filter by service
    if (
      serviceKey &&
      serviceKey !== 'all_services' &&
      !serviceKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.serviceKey = :serviceKey', { serviceKey });
    }

    // Filter by location
    if (
      locationKey &&
      locationKey !== 'all_locations' &&
      !locationKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.locationKey = :locationKey', { locationKey });
    }

    // Search by participant name, email, or quiz title
    if (search) {
      queryBuilder.andWhere(
        '(UPPER(attempt.participantName) LIKE UPPER(:search) OR ' +
          'UPPER(attempt.email) LIKE UPPER(:search) OR ' +
          'UPPER(attempt.nij) LIKE UPPER(:search) OR ' +
          'UPPER(quiz.title) LIKE UPPER(:search))',
        { search: `%${search}%` },
      );
    }

    // Date range filter
    if (startDate) {
      queryBuilder.andWhere('attempt.startedAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      queryBuilder.andWhere('attempt.startedAt <= :endDate', {
        endDate: new Date(endDate),
      });
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
      servoNumber: attempt.servoNumber,
      serviceKey: attempt.serviceKey,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || 'Unknown Quiz',
      quizServiceKey: attempt.quiz?.serviceKey,
      quizServiceName: attempt.quiz?.serviceKey
        ? mappings.services.mapping[attempt.quiz.serviceKey] ||
          attempt.quiz.serviceKey
        : 'No Service',
      locationKey: attempt.quiz?.locationKey,
      locationName: attempt.quiz?.locationKey
        ? mappings.locations.mapping[attempt.quiz.locationKey] ||
          attempt.quiz.locationKey
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

    // Fetch all questions for this quiz to ensure we show unanswered ones too
    const questions = await this.questionRepository.find({
      where: { quizId: attempt.quizId },
      order: { order: 'ASC' },
    });

    // Create a map of answers for quick lookup
    const answersMap = new Map();
    if (attempt.answers) {
      attempt.answers.forEach((answer) => {
        if (answer.questionId) {
          answersMap.set(answer.questionId, answer);
        }
      });
    }

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Map all questions to answers (or placeholder if no answer)
    const detailedAnswers = questions.map((question, index) => {
      const answer = answersMap.get(question.id);

      // If answer exists, use it; otherwise return "unanswered" state
      const answerText = answer ? answer.answerText : null;
      const isCorrect = answerText === question.correctAnswer;
      const isSkipped =
        answerText === null || answerText === undefined || answerText === '';

      return {
        id: answer ? answer.id : null,
        questionId: question.id,
        questionNumber: index + 1,
        questionText: question.questionText,
        questionType: question.questionType,
        questionOptions: question.options || [],
        answerText: isSkipped ? 'No answer provided' : answerText,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect && !isSkipped,
        isSkipped: isSkipped,
      };
    });

    return {
      id: attempt.id,
      participantName: attempt.participantName,
      email: attempt.email,
      nij: attempt.nij,
      servoNumber: attempt.servoNumber,
      serviceKey: attempt.serviceKey,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        serviceKey: attempt.quiz.serviceKey,
        serviceName: attempt.quiz.serviceKey
          ? mappings.services.mapping[attempt.quiz.serviceKey] ||
            attempt.quiz.serviceKey
          : 'No Service',
        locationKey: attempt.quiz.locationKey,
        locationName: attempt.quiz.locationKey
          ? mappings.locations.mapping[attempt.quiz.locationKey] ||
            attempt.quiz.locationKey
          : 'No Location',
        passingScore: attempt.quiz.passingScore,
        createdAt: attempt.quiz.createdAt,
        completedAt: attempt.completedAt,
      },
      score: attempt.score,
      grade: attempt.grade,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
      answers: detailedAnswers,
      summary: {
        totalQuestions: questions.length,
        correctAnswers: detailedAnswers.filter((a) => a.isCorrect).length,
        wrongAnswers: detailedAnswers.filter(
          (a) => !a.isCorrect && !a.isSkipped,
        ).length,
        skippedAnswers: detailedAnswers.filter((a) => a.isSkipped).length,
        score: attempt.score,
      },
    };
  }
}
