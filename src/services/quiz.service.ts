import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Quiz, QuizType } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { QuizImage } from '../entities/quiz-image.entity';
import { QuizScoring } from '../entities/quiz-scoring.entity';
import { CreateQuizDto, UpdateQuizDto, QuizResponseDto, ServiceType, StartManualQuizDto } from '../dto/quiz.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { APP_URLS } from '../constants/app.constants';
import { generateSlug, generateToken } from '../lib/utils';
import { ApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuizImage)
    private readonly quizImageRepository: Repository<QuizImage>,
    @InjectRepository(QuizScoring)
    private readonly quizScoringRepository: Repository<QuizScoring>,
  ) {}

  // Helper method to get full image URL from file server
  private getFullImageUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath; // Already full URL
    return `${APP_URLS.FILE_SERVER_URL}/${filePath}`;
  }

  async create(createQuizDto: CreateQuizDto): Promise<QuizResponseDto> {
    try {
      const slug = generateSlug(createQuizDto.title);
      const token = generateToken();

      // Set default quizType to SCHEDULED if not provided
      const quizType = createQuizDto.quizType || QuizType.SCHEDULED;

      // Validation based on quiz type
      if (quizType === QuizType.SCHEDULED) {
        // Scheduled quiz should have both start and end dates
        if (!createQuizDto.startDateTime || !createQuizDto.endDateTime) {
          throw new BadRequestException('Scheduled quiz must have both startDateTime and endDateTime');
        }
      } else if (quizType === QuizType.MANUAL) {
        // Manual quiz should have duration but no fixed dates (will be set when started)
        if (!createQuizDto.durationMinutes) {
          throw new BadRequestException('Manual quiz must have durationMinutes specified');
        }
      }

      const quiz = this.quizRepository.create({
        ...createQuizDto,
        slug,
        token,
        quizType,
        isActive: createQuizDto.isActive ?? true,
        isPublished: quizType === QuizType.SCHEDULED, // Auto-publish scheduled quizzes
      });

      const savedQuiz = await this.quizRepository.save(quiz);
      return savedQuiz as QuizResponseDto;
    } catch (error) {
      throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
  ): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (search) {
      whereCondition.title = Like(`%${search}%`);
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    const [quizzes, total] = await this.quizRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['questions', 'attempts', 'images', 'scoringTemplates', 'location'],
    });

    // Transform images to include full URLs for all quizzes
    const transformedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      images: quiz.images?.map(image => ({
        ...image,
        fullUrl: this.getFullImageUrl(image.filePath),
      })) || []
    }));

    return ResponseFactory.paginated(
      transformedQuizzes,
      total,
      page,
      limit,
      search ? `Found ${total} quizzes matching "${search}"` : 'Quizzes retrieved successfully'
    );
  }

  async findOne(id: number): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions', 'attempts', 'images', 'scoringTemplates', 'location'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Transform images to include full URLs
    if (quiz.images && quiz.images.length > 0) {
      quiz.images = quiz.images.map(image => ({
        ...image,
        fullUrl: this.getFullImageUrl(image.filePath),
      }));
    }

    return quiz as QuizResponseDto;
  }

  async update(id: number, updateQuizDto: UpdateQuizDto): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Update slug if title is changed
    if (updateQuizDto.title && updateQuizDto.title !== quiz.title) {
      updateQuizDto.slug = generateSlug(updateQuizDto.title);
    }

    await this.quizRepository.update(id, updateQuizDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    await this.quizRepository.remove(quiz);
    return { message: SUCCESS_MESSAGES.DELETED('Quiz') };
  }

  async getQuestions(id: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    return quiz.questions.sort((a, b) => a.order - b.order);
  }

  async getAttempts(id: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['attempts', 'attempts.user'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    return quiz.attempts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async duplicate(id: number): Promise<QuizResponseDto> {
    const originalQuiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!originalQuiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    const duplicatedQuiz = this.quizRepository.create({
      title: `${originalQuiz.title} (Copy)`,
      description: originalQuiz.description,
      slug: generateSlug(`${originalQuiz.title} (Copy)`),
      token: generateToken(),
      isActive: false, // Start as inactive
      serviceType: originalQuiz.serviceType,
      locationId: originalQuiz.locationId,
      passingScore: originalQuiz.passingScore,
      questionsPerPage: originalQuiz.questionsPerPage,
      startDateTime: originalQuiz.startDateTime,
      endDateTime: originalQuiz.endDateTime,
      quizLink: `https://quiz.gms.com/q/${generateToken()}`, // Generate new link
    });

    const savedQuiz = await this.quizRepository.save(duplicatedQuiz);

    // Duplicate questions
    for (const question of originalQuiz.questions) {
      const duplicatedQuestion = this.questionRepository.create({
        quizId: savedQuiz.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        correctAnswer: question.correctAnswer,
        order: question.order,
      });
      await this.questionRepository.save(duplicatedQuestion);
    }

    return this.findOne(savedQuiz.id);
  }

  async publish(id: number): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    await this.quizRepository.update(id, { isActive: true });
    return this.findOne(id);
  }

  async unpublish(id: number): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    await this.quizRepository.update(id, { isActive: false });
    return this.findOne(id);
  }

  async findByToken(token: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { token, isActive: true },
      relations: ['questions', 'images', 'scoringTemplates'],
    });
  }

  // Image management methods (akan dipanggil dari quiz controller)
  async uploadQuizImage(quizId: number, imageData: { imageUrl: string; altText?: string; order?: number }) {
    const quiz = await this.findOne(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // TODO: Implement image URL association with quiz
    // For now, just validate the quiz exists and return success
    // Images will be handled via external file server URLs in quiz metadata or separate table
    
    console.log(`Image associated with quiz ${quizId}:`, imageData);

    // Return updated quiz (for now without actual image data)
    return this.findOne(quizId);
  }

  // Scoring calculation method (akan dipanggil saat submit test)
  async calculateScore(quizId: number, correctAnswers: number, totalQuestions: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['scoringTemplates'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Cari grade berdasarkan scoring templates
    let grade = 'F';
    let gradeDescription = 'Below expectations';

    if (quiz.scoringTemplates && quiz.scoringTemplates.length > 0) {
      const matchingTemplate = quiz.scoringTemplates.find(template => 
        score >= template.minScore && score <= template.maxScore
      );
      
      if (matchingTemplate) {
        grade = matchingTemplate.grade;
        gradeDescription = matchingTemplate.description;
      }
    } else {
      // Default grading jika tidak ada template
      if (score >= quiz.passingScore) {
        grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
        gradeDescription = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : 'Satisfactory';
      }
    }

    return {
      score,
      grade,
      gradeDescription,
      passed: score >= quiz.passingScore,
      passingScore: quiz.passingScore,
    };
  }

  // Template management methods
  async getQuizTemplates(
    page: number = 1,
    limit: number = 10,
    search?: string,
    serviceType?: ServiceType,
  ): Promise<ApiResponse<any>> {
    const skip = (page - 1) * limit;
    const whereCondition: any = {
      isPublished: true, // Only published quizzes can be used as templates
    };

    if (search) {
      whereCondition.title = Like(`%${search}%`);
    }

    if (serviceType) {
      whereCondition.serviceType = serviceType;
    }

    const [quizzes, total] = await this.quizRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['questions', 'images', 'scoringTemplates', 'location'],
    });

    return ResponseFactory.paginated(
      quizzes,
      total,
      page,
      limit,
      search 
        ? `Found ${total} quiz templates matching "${search}"` 
        : 'Quiz templates retrieved successfully'
    );
  }

  async getQuizTemplatePreview(id: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: [
        'questions', 
        'images', 
        'scoringTemplates', 
        'location'
      ],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz template not found');
    }

    // Return detailed preview with statistics
    return {
      ...quiz,
      statistics: {
        totalQuestions: quiz.questions?.length || 0,
        totalImages: quiz.images?.length || 0,
        scoringRulesCount: quiz.scoringTemplates?.length || 0,
        hasTimeLimit: !!quiz.durationMinutes,
      },
    };
  }

  async copyQuizTemplate(
    sourceId: number, 
    copyData: {
      title: string;
      description?: string;
      serviceType?: ServiceType;
      locationId?: number;
    }
  ): Promise<QuizResponseDto> {
    // Get source quiz with all relations
    const sourceQuiz = await this.quizRepository.findOne({
      where: { id: sourceId },
      relations: ['questions', 'images', 'scoringTemplates'],
    });

    if (!sourceQuiz) {
      throw new NotFoundException('Source quiz template not found');
    }

    try {
      // Create new quiz based on template
      const slug = generateSlug(copyData.title);
      const token = generateToken();

      const newQuiz = this.quizRepository.create({
        title: copyData.title,
        description: copyData.description || sourceQuiz.description,
        slug,
        token,
        serviceType: copyData.serviceType || sourceQuiz.serviceType,
        locationId: copyData.locationId || sourceQuiz.locationId,
        
        // Copy all settings from source
        passingScore: sourceQuiz.passingScore,
        questionsPerPage: sourceQuiz.questionsPerPage,
        durationMinutes: sourceQuiz.durationMinutes,
        
        // Set as draft initially
        isActive: true,
        isPublished: false,
        
        // Copy date settings (admin can modify later)
        startDateTime: sourceQuiz.startDateTime,
        endDateTime: sourceQuiz.endDateTime,
      });

      const savedQuiz = await this.quizRepository.save(newQuiz);

      // Copy questions (if any)
      if (sourceQuiz.questions && sourceQuiz.questions.length > 0) {
        const copiedQuestions = sourceQuiz.questions.map(question => ({
          ...question,
          id: undefined, // Let database generate new ID
          quizId: savedQuiz.id,
          quiz: savedQuiz,
        }));

        await this.questionRepository.save(copiedQuestions);
      }

      // Copy images (if any) - Create references pointing to external file server
      if (sourceQuiz.images && sourceQuiz.images.length > 0) {
        const copiedImages = sourceQuiz.images.map(image =>
          this.quizImageRepository.create({
            quizId: savedQuiz.id,
            fileName: image.fileName,
            originalName: `${image.originalName} (Copy)`,
            mimeType: image.mimeType,
            fileSize: image.fileSize,
            filePath: image.filePath, // Keep same path for external file server
            altText: image.altText,
            isActive: true,
          })
        );
        await this.quizImageRepository.save(copiedImages);
      }
      
      // TODO: Copy scoring templates (if any) - Based on current QuizScoring entity structure
      if (sourceQuiz.scoringTemplates && sourceQuiz.scoringTemplates.length > 0) {
        const copiedScoring = sourceQuiz.scoringTemplates.map(scoring => ({
          quizId: savedQuiz.id,
          scoringName: `${scoring.scoringName} (Copy)`,
          correctAnswerPoints: scoring.correctAnswerPoints,
          incorrectAnswerPenalty: scoring.incorrectAnswerPenalty,
          unansweredPenalty: scoring.unansweredPenalty,
          bonusPoints: scoring.bonusPoints,
          multiplier: scoring.multiplier,
          timeBonusEnabled: scoring.timeBonusEnabled,
          timeBonusPerSecond: scoring.timeBonusPerSecond,
          maxScore: scoring.maxScore,
          minScore: scoring.minScore,
          passingScore: scoring.passingScore,
          isActive: scoring.isActive,
        }));

        await this.quizScoringRepository.save(copiedScoring);
      }

      // Return the complete new quiz with all relations
      return this.findOne(savedQuiz.id);

    } catch (error) {
      throw new BadRequestException('Failed to copy quiz template: ' + error.message);
    }
  }

  // Start manual quiz
  async startManualQuiz(
    quizId: number, 
    startData?: { startDateTime?: string; durationMinutes?: number }
  ): Promise<QuizResponseDto> {
    // Get quiz
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['questions', 'images', 'scoringTemplates', 'location'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }



    // Only allow manual start for MANUAL type quizzes
    if (quiz.quizType !== QuizType.MANUAL) {
      throw new BadRequestException('Only manual quizzes can be started manually. This quiz is scheduled.');
    }

    // Calculate start and end times
    const startDateTime = startData?.startDateTime 
      ? new Date(startData.startDateTime)
      : new Date(); // Default to now

    const durationMinutes = startData?.durationMinutes || quiz.durationMinutes;
    
    if (!durationMinutes) {
      throw new BadRequestException('Duration is required for manual quiz start');
    }

    const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));

    // Update quiz with start/end times and publish it
    await this.quizRepository.update(quizId, {
      startDateTime,
      endDateTime,
      durationMinutes,
      isPublished: true,
    });

    // Return updated quiz
    return this.findOne(quizId);
  }
}