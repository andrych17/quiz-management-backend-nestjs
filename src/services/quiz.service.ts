import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { QuizImage } from '../entities/quiz-image.entity';
import { QuizScoring } from '../entities/quiz-scoring.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { User } from '../entities/user.entity';
import {
  CreateQuizDto,
  UpdateQuizDto,
  QuizResponseDto,
  QuizDetailResponseDto,
} from '../dto/quiz.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { APP_URLS } from '../constants/app.constants';
import { generateSlug, generateToken, generateUniqueToken } from '../lib/utils';
import { UrlGeneratorService } from './url-generator.service';
import { AutoAssignmentService } from './auto-assignment.service';
import { ConfigService } from './config.service';
import { FileUploadService } from './file-upload.service';
import { R2StorageService } from './r2-storage.service';
import { DebugLogger } from '../lib/debug-logger';

interface UserInfo {
  id?: number;
  email?: string;
  name?: string;
  role?: string;
}

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
    @InjectRepository(UserQuizAssignment)
    private readonly userQuizAssignmentRepository: Repository<UserQuizAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly urlGeneratorService: UrlGeneratorService,
    private readonly autoAssignmentService: AutoAssignmentService,
    private readonly configService: ConfigService,
    private readonly fileUploadService: FileUploadService,
    private readonly r2StorageService: R2StorageService,
  ) {}

  // Helper method to get full image URL from file server
  private getFullImageUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath; // Already full URL
    return `${APP_URLS.FILE_SERVER_URL}/${filePath}`;
  }

  // Helper method to check if image file is still used by other questions
  private async isImageStillInUse(
    fileName: string,
    excludeImageId?: number,
  ): Promise<boolean> {
    const whereClause: any = {
      fileName,
      isActive: true,
    };

    if (excludeImageId) {
      whereClause.id = Not(excludeImageId); // Exclude current image being deleted
    }

    const count = await this.quizImageRepository.count({
      where: whereClause,
    });

    return count > 0;
  }

  // Helper method to safely delete image from R2 storage
  private async safeDeleteImageFile(
    fileName: string,
    excludeImageId?: number,
  ): Promise<void> {
    // Check if file is still used by other quiz_images records
    const stillInUse = await this.isImageStillInUse(fileName, excludeImageId);

    if (stillInUse) {
      DebugLogger.debug(
        'QuizService',
        `Skipping delete for ${fileName} - still in use by other questions`,
      );
      return;
    }

    // Safe to delete from R2
    try {
      await this.r2StorageService.deleteFile(fileName);
      DebugLogger.debug('QuizService', `Deleted image from R2: ${fileName}`);
    } catch (error) {
      DebugLogger.error(
        'QuizService',
        `Failed to delete image ${fileName}`,
        error.message,
      );
    }
  }

  async create(
    createQuizDto: CreateQuizDto,
    userInfo?: UserInfo,
  ): Promise<any> {
    try {
      const slug = generateSlug(createQuizDto.title);
      const token = generateToken();

      const quiz = this.quizRepository.create({
        title: createQuizDto.title,
        description: createQuizDto.description,
        slug,
        token,
        locationKey: createQuizDto.locationKey,
        serviceKey: createQuizDto.serviceKey,
        passingScore: createQuizDto.passingScore,
        questionsPerPage: createQuizDto.questionsPerPage,
        durationMinutes: createQuizDto.durationMinutes,
        isActive: createQuizDto.isActive ?? true,
        isPublished: false, // Default to not published
        startDateTime: createQuizDto.startDateTime
          ? new Date(createQuizDto.startDateTime)
          : null,
        endDateTime: createQuizDto.endDateTime
          ? new Date(createQuizDto.endDateTime)
          : null,
        quizLink: createQuizDto.quizLink,
        createdBy: userInfo?.email || userInfo?.name || 'system',
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      const savedQuiz = await this.quizRepository.save(quiz);

      // Generate URLs for the quiz
      if (savedQuiz.slug && savedQuiz.token) {
        const urls = await this.urlGeneratorService.generateQuizUrls(
          savedQuiz.slug,
          savedQuiz.token,
          savedQuiz.id,
        ); // Update quiz with generated URLs
        await this.quizRepository.update(savedQuiz.id, {
          normalUrl: urls.normalUrl,
          shortUrl: urls.shortUrl,
        });

        savedQuiz.normalUrl = urls.normalUrl;
        savedQuiz.shortUrl = urls.shortUrl;
      }

      // Auto-assign admin users based on service and location
      if (savedQuiz.serviceKey || savedQuiz.locationKey) {
        await this.autoAssignmentService.autoAssignUsersToQuiz(
          savedQuiz.id,
          savedQuiz.serviceKey,
          savedQuiz.locationKey,
          'system',
        );
      }

      // Handle scoring templates (untuk grade range A, B, C, dll)
      let savedScoringTemplates = [];
      if (
        createQuizDto.scoringTemplates &&
        createQuizDto.scoringTemplates.length > 0
      ) {
        // Validasi: pastikan scoring templates mencakup semua kemungkinan correctAnswers
        const totalQuestions = createQuizDto.questions?.length || 0;
        if (totalQuestions > 0) {
          const correctAnswersSet = new Set(
            createQuizDto.scoringTemplates.map((t) => t.correctAnswers),
          );

          // Check apakah ada yang terlewat
          const missing = [];
          for (let i = 0; i <= totalQuestions; i++) {
            if (!correctAnswersSet.has(i)) {
              missing.push(i);
            }
          }

          if (missing.length > 0) {
            throw new BadRequestException(
              `Template penilaian tidak lengkap. Belum ada template untuk: ${missing.join(', ')} jawaban benar. ` +
                `Quiz memiliki ${totalQuestions} soal, harus ada template untuk 0 sampai ${totalQuestions} jawaban benar.`,
            );
          }
        }

        const scoringTemplates = createQuizDto.scoringTemplates.map(
          (templateData) =>
            this.quizScoringRepository.create({
              quizId: savedQuiz.id,
              correctAnswers: templateData.correctAnswers,
              points: templateData.points || 1,
              isActive: true,
              createdBy: userInfo?.email || userInfo?.name || 'system',
              updatedBy: userInfo?.email || userInfo?.name || 'system',
            }),
        );

        savedScoringTemplates =
          await this.quizScoringRepository.save(scoringTemplates);
      }

      // Handle questions creation
      const savedQuestions = [];
      if (createQuizDto.questions && createQuizDto.questions.length > 0) {
        DebugLogger.debug(
          'QuizService',
          `Creating ${createQuizDto.questions.length} questions for quiz`,
        );

        for (let i = 0; i < createQuizDto.questions.length; i++) {
          const questionData = createQuizDto.questions[i];

          // Text questions don't need correct answers (open-ended)
          const isOpenEnded = questionData.questionType === 'text';
          if (
            !isOpenEnded &&
            (!questionData.correctAnswer ||
              questionData.correctAnswer.trim() === '')
          ) {
            throw new BadRequestException(
              `Question ${i + 1}: correctAnswer is required and cannot be empty`,
            );
          }

          // Convert questionType to match enum values
          let questionType: string = questionData.questionType;
          if (questionType.includes('_')) {
            questionType = questionType.replace('_', '-'); // Convert multiple_choice to multiple-choice
          }

          const question = this.questionRepository.create({
            quizId: savedQuiz.id,
            questionText: questionData.questionText,
            questionType: questionType as any,
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer
              ? questionData.correctAnswer.trim()
              : '',
            order: questionData.order ?? i + 1, // Auto-generate order if not provided
          });

          const savedQuestion = await this.questionRepository.save(question);
          DebugLogger.debug('QuizService', `Saved question ${i + 1}`, {
            id: savedQuestion.id,
          });

          // Handle question images (multiple images support)
          if (
            questionData.imagesBase64 &&
            questionData.imagesBase64.length > 0
          ) {
            try {
              for (
                let imgIdx = 0;
                imgIdx < questionData.imagesBase64.length;
                imgIdx++
              ) {
                const imgData = questionData.imagesBase64[imgIdx];
                const imgSequence = imgData.sequence || imgIdx + 1;

                // Check if this is new base64 data
                const isBase64 =
                  imgData.imageBase64 &&
                  imgData.imageBase64.startsWith('data:');

                if (isBase64) {
                  // Upload new image to storage
                  const fileInfo =
                    await this.fileUploadService.uploadFromBase64(
                      imgData.imageBase64,
                      imgData.originalName ||
                        `question_image_${imgSequence}.jpg`,
                      `question/${savedQuestion.id}`,
                    );

                  // Create new image record
                  const imageRecord = this.quizImageRepository.create({
                    questionId: savedQuestion.id,
                    sequence: imgSequence,
                    fileName: fileInfo.fileName,
                    originalName: fileInfo.originalName,
                    mimeType: fileInfo.mimeType,
                    fileSize: fileInfo.fileSize,
                    altText: imgData.altText,
                    isActive: true,
                  });

                  await this.quizImageRepository.save(imageRecord);
                  DebugLogger.debug(
                    'QuizService',
                    `Created image seq ${imgSequence} for question ${i + 1}`,
                  );
                }
              }
              DebugLogger.debug(
                'QuizService',
                `Processed ${questionData.imagesBase64.length} images for question ${i + 1}`,
              );
            } catch (uploadError) {
              DebugLogger.error(
                'QuizService',
                `Failed to upload images for question ${i + 1}`,
                uploadError.message,
              );
              throw new BadRequestException(
                `Question ${i + 1}: Gagal upload gambar - ${uploadError.message}`,
              );
            }
          }
          // Fallback to single image upload (backward compatibility)
          else if (questionData.imageBase64) {
            try {
              const imgSequence = questionData.imageSequence || 1;

              // Check if this is new base64 data
              const isBase64 = questionData.imageBase64.startsWith('data:');

              if (isBase64) {
                // Upload new image to storage
                const fileInfo = await this.fileUploadService.uploadFromBase64(
                  questionData.imageBase64,
                  questionData.imageOriginalName || 'question_image.jpg',
                  `question/${savedQuestion.id}`,
                );

                // Create new image record
                const imageRecord = this.quizImageRepository.create({
                  questionId: savedQuestion.id,
                  sequence: imgSequence,
                  fileName: fileInfo.fileName,
                  originalName: fileInfo.originalName,
                  mimeType: fileInfo.mimeType,
                  fileSize: fileInfo.fileSize,
                  altText: questionData.imageAltText,
                  isActive: true,
                });

                await this.quizImageRepository.save(imageRecord);
                DebugLogger.debug(
                  'QuizService',
                  `Created single image for question ${i + 1}`,
                );
              }
            } catch (uploadError) {
              DebugLogger.error(
                'QuizService',
                `Failed to upload single image for question ${i + 1}`,
                uploadError.message,
              );
              throw new BadRequestException(
                `Question ${i + 1}: Gagal upload gambar - ${uploadError.message}`,
              );
            }
          }

          savedQuestions.push(savedQuestion);
        }
      }

      // Get auto-assigned users
      const users = await this.userQuizAssignmentRepository.find({
        where: { quizId: savedQuiz.id, isActive: true },
        relations: ['user'],
      });

      const assignedUsers = users.map((assignment) => ({
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role,
        assignedAt: assignment.createdAt,
        assignmentType: assignment.assignedBy === 'system' ? 'auto' : 'manual',
        isActive: assignment.isActive,
      }));

      return {
        success: true,
        message: 'Quiz created successfully',
        data: {
          ...savedQuiz,
          questions: savedQuestions,
          images: [], // Images are now handled at question level
          scoringTemplates: savedScoringTemplates,
          assignedUsers,
        },
      };
    } catch (error) {
      DebugLogger.error('QuizService', 'Quiz creation error', error.message);
      return {
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: 'DATABASE_ERROR',
        data: {
          title: createQuizDto.title,
          originalError: error.message,
        },
      };
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {
      isActive: isActive !== undefined ? isActive : true, // Default to true if not specified
    };

    if (search) {
      whereCondition.title = Like(`%${search}%`);
    }

    const [quizzes, total] = await this.quizRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['questions', 'attempts', 'scoringTemplates'],
    });

    // Images are now at question level
    const transformedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      images: [],
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      items: transformedQuizzes,
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

  async findAllWithDisplayNames(
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
  ) {
    // Get quiz data using existing method
    const quizData = await this.findAll(page, limit, search, isActive);

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Enhance quiz data with display names
    const enhancedQuizzes = quizData.items.map((quiz) => ({
      ...quiz,
      serviceName: quiz.serviceKey
        ? mappings.services.mapping[quiz.serviceKey] || quiz.serviceKey
        : null,
      locationName: quiz.locationKey
        ? mappings.locations.mapping[quiz.locationKey] || quiz.locationKey
        : null,
    }));

    return {
      items: enhancedQuizzes,
      pagination: quizData.pagination,
    };
  }

  async findAllForUser(
    userId: number,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
    serviceKey?: string,
    locationKey?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const skip = (page - 1) * limit;

    // Get user information for filtering
    const user = await this.userRepository.findOne({ where: { id: userId } });

    // Build query based on user role
    const queryBuilder = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.questions', 'questions')
      .leftJoinAndSelect('quiz.attempts', 'attempts')
      .leftJoinAndSelect('quiz.scoringTemplates', 'scoringTemplates');

    // Superadmin sees all quizzes
    if (userRole === 'superadmin') {
      // No additional filtering needed
    }
    // Admin sees only assigned quizzes
    else if (userRole === 'admin') {
      queryBuilder
        .innerJoin('quiz.userAssignments', 'userAssignments')
        .where('userAssignments.userId = :userId', { userId })
        .andWhere('userAssignments.isActive = :isAssignmentActive', {
          isAssignmentActive: true,
        });
    }
    // Regular users see published and active quizzes only
    else {
      queryBuilder
        .where('quiz.isPublished = :isPublished', { isPublished: true })
        .andWhere('quiz.isActive = :isActiveQuiz', { isActiveQuiz: true });

      // For regular users, apply user's service and location restrictions
      if (user?.serviceKey) {
        queryBuilder.andWhere('quiz.serviceKey = :userServiceKey', {
          userServiceKey: user.serviceKey,
        });
      }
      if (user?.locationKey) {
        queryBuilder.andWhere('quiz.locationKey = :userLocationKey', {
          userLocationKey: user.locationKey,
        });
      }
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(UPPER(quiz.title) LIKE UPPER(:search) OR UPPER(quiz.description) LIKE UPPER(:search))',
        { search: `%${search}%` },
      );
    }

    // Apply active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('quiz.isActive = :isActive', { isActive });
    }

    // Apply service filter (ignore "all_services" and similar values)
    if (
      serviceKey &&
      serviceKey !== 'all_services' &&
      !serviceKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.serviceKey = :serviceKey', { serviceKey });
    }

    // Apply location filter (ignore "all_locations" and similar values)
    if (
      locationKey &&
      locationKey !== 'all_locations' &&
      !locationKey.startsWith('all_')
    ) {
      queryBuilder.andWhere('quiz.locationKey = :locationKey', { locationKey });
    }

    // Validate sortBy field to prevent SQL injection
    const allowedSortFields = [
      'title',
      'startDateTime',
      'endDateTime',
      'createdAt',
      'updatedAt',
      'passingScore',
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const validSortOrder =
      sortOrder === 'ASC' || sortOrder === 'DESC' ? sortOrder : 'DESC';

    // Apply pagination and ordering
    const [quizzes, total] = await queryBuilder
      .orderBy(`quiz.${validSortBy}`, validSortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Images are now at question level
    const transformedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      images: [],
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      items: transformedQuizzes,
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

  async findOne(id: number): Promise<QuizDetailResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions', 'scoringTemplates'],
      order: {
        questions: {
          order: 'ASC',
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Load images for each question
    let questionsWithImages = [];
    if (quiz.questions && quiz.questions.length > 0) {
      questionsWithImages = await Promise.all(
        quiz.questions.map(async (question) => {
          const images = await this.quizImageRepository.find({
            where: { questionId: question.id, isActive: true },
          });
          return {
            id: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            order: question.order,
            options: question.options,
            correctAnswer: question.correctAnswer,
            images: images.map((img) => ({
              id: img.id,
              fileName: img.fileName,
              originalName: img.originalName,
              mimeType: img.mimeType,
              fileSize: img.fileSize,
              altText: img.altText,
              downloadUrl: `/api/files/${img.fileName}`,
            })),
          };
        }),
      );
    }

    // Get config mappings for service and location names
    const mappings = await this.configService.getMappings();

    // Get assigned users (admins who can access this quiz)
    const assignments = await this.userQuizAssignmentRepository.find({
      where: { quizId: id, isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const assignedUsers = assignments.map((assignment) => ({
      id: assignment.user.id,
      name: assignment.user.name,
      email: assignment.user.email,
      role: assignment.user.role,
      assignedAt: assignment.createdAt,
      isActive: assignment.isActive,
    }));

    return {
      ...quiz,
      questions: questionsWithImages,
      assignedUsers,
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
      serviceName: quiz.serviceKey
        ? mappings.services.mapping[quiz.serviceKey] || quiz.serviceKey
        : null,
      locationName: quiz.locationKey
        ? mappings.locations.mapping[quiz.locationKey] || quiz.locationKey
        : null,
    } as QuizDetailResponseDto;
  }

  async update(
    id: number,
    updateQuizDto: UpdateQuizDto,
    userInfo?: UserInfo,
  ): Promise<QuizDetailResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['attempts', 'questions', 'scoringTemplates'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Prepare update data excluding relational fields
    const { scoringTemplates, questions, ...quizData } = updateQuizDto;

    // Update slug if title is changed
    if (updateQuizDto.title && updateQuizDto.title !== quiz.title) {
      quizData.slug = generateSlug(updateQuizDto.title);
    }

    // Update quiz basic data
    await this.quizRepository.update(id, {
      ...quizData,
      updatedBy: userInfo?.email || userInfo?.name || 'system',
    });

    // Handle questions update
    if (questions !== undefined) {
      // Check if quiz has attempts - cannot edit questions if quiz has been taken
      if (quiz.attempts && quiz.attempts.length > 0) {
        throw new BadRequestException(
          'Tidak dapat mengubah soal untuk quiz yang sudah dikerjakan oleh peserta. ' +
            'Hal ini untuk menjaga keadilan dan integritas hasil quiz yang sudah ada.',
        );
      }

      // Smart update: Match by ID (if provided), update existing, create new, delete removed
      const existingQuestions = quiz.questions || [];
      const incomingIds = questions.filter((q) => q.id).map((q) => q.id);
      const existingIdsMap = new Map(existingQuestions.map((q) => [q.id, q]));

      // 1. Delete questions that are no longer in the incoming data (only if they have ID)
      for (const existingQuestion of existingQuestions) {
        // Only delete if incoming data has IDs and this question's ID is not included
        if (
          incomingIds.length > 0 &&
          !incomingIds.includes(existingQuestion.id)
        ) {
          // Delete images - check if still in use first
          const images = await this.quizImageRepository.find({
            where: { questionId: existingQuestion.id },
          });

          for (const image of images) {
            // Safe delete - only delete from R2 if no other question uses this file
            await this.safeDeleteImageFile(image.fileName, image.id);
          }

          await this.quizImageRepository.delete({
            questionId: existingQuestion.id,
          });
          await this.questionRepository.delete({ id: existingQuestion.id });
          DebugLogger.debug(
            'QuizService',
            `Deleted question ID ${existingQuestion.id}`,
          );
        }
      }

      // 2. Update existing or create new questions
      if (questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          // Match by ID if provided, otherwise it's a new question
          const existingQuestion = questionData.id
            ? existingIdsMap.get(questionData.id)
            : null;

          // Handle correctAnswer properly - now using correctAnswer (singular)
          let correctAnswer = '';
          if (questionData.correctAnswer) {
            correctAnswer = String(questionData.correctAnswer).trim();
          }

          // Text questions don't need correct answers (check both questionType and correctAnswer content)
          const isTextQuestion =
            questionData.questionType === 'text' || correctAnswer === 'text';

          if (!isTextQuestion && !correctAnswer) {
            throw new BadRequestException(
              `Question ${i + 1}: correctAnswer is required and cannot be empty`,
            );
          }

          // For text questions, clear the correctAnswer
          if (isTextQuestion) {
            correctAnswer = '';
          }

          // Convert questionType to match enum values
          let questionType: string = questionData.questionType;
          if (questionType.includes('_')) {
            questionType = questionType.replace('_', '-'); // Convert multiple_choice to multiple-choice
          }

          let savedQuestion;

          if (existingQuestion) {
            // UPDATE existing question
            existingQuestion.questionText = questionData.questionText;
            existingQuestion.questionType = questionType as any;
            existingQuestion.options = questionData.options || [];
            existingQuestion.correctAnswer = correctAnswer;
            existingQuestion.order = questionData.order || i + 1;

            savedQuestion =
              await this.questionRepository.save(existingQuestion);
            DebugLogger.debug(
              'QuizService',
              `Updated question ${i + 1} (ID: ${savedQuestion.id})`,
            );
          } else {
            // CREATE new question
            const question = this.questionRepository.create({
              quizId: id,
              questionText: questionData.questionText,
              questionType: questionType as any,
              options: questionData.options || [],
              correctAnswer: correctAnswer,
              order: questionData.order || i + 1,
            });

            savedQuestion = await this.questionRepository.save(question);
            DebugLogger.debug(
              'QuizService',
              `Created new question ${i + 1} (ID: ${savedQuestion.id})`,
            );
          }

          // Handle images update: match by sequence for images (within this question)
          const existingImages = await this.quizImageRepository.find({
            where: { questionId: savedQuestion.id },
            order: { sequence: 'ASC' },
          });
          const existingImagesMap = new Map(
            existingImages.map((img) => [img.sequence, img]),
          );

          // Handle multiple images upload (new multi-image support)
          if (
            questionData.imagesBase64 &&
            questionData.imagesBase64.length > 0
          ) {
            try {
              // CHANGED: Only add/update images in incoming data, do NOT delete existing images
              // This allows incremental image uploads (e.g., upload image 3 without sending images 1 & 2)

              // Update or create images
              for (
                let imgIdx = 0;
                imgIdx < questionData.imagesBase64.length;
                imgIdx++
              ) {
                const imgData = questionData.imagesBase64[imgIdx];
                const imgSequence = imgData.sequence || imgIdx + 1;
                const existingImage = existingImagesMap.get(imgSequence);

                // Check if this is new base64 data or existing image reference
                const isBase64 =
                  imgData.imageBase64 &&
                  imgData.imageBase64.startsWith('data:');

                if (isBase64) {
                  // Delete old image file from R2 if updating (safe delete)
                  if (existingImage) {
                    await this.safeDeleteImageFile(
                      existingImage.fileName,
                      existingImage.id,
                    );
                  }

                  // Upload new image to storage
                  const fileInfo =
                    await this.fileUploadService.uploadFromBase64(
                      imgData.imageBase64,
                      imgData.originalName ||
                        `question_image_${imgSequence}.jpg`,
                      `question/${savedQuestion.id}`,
                    );

                  if (existingImage) {
                    // UPDATE existing image record
                    existingImage.fileName = fileInfo.fileName;
                    existingImage.originalName = fileInfo.originalName;
                    existingImage.mimeType = fileInfo.mimeType;
                    existingImage.fileSize = fileInfo.fileSize;
                    existingImage.altText = imgData.altText;
                    existingImage.sequence = imgSequence;

                    await this.quizImageRepository.save(existingImage);
                    DebugLogger.debug(
                      'QuizService',
                      `Updated image seq ${imgSequence} for question ${i + 1}`,
                    );
                  } else {
                    // CREATE new image record
                    const imageRecord = this.quizImageRepository.create({
                      questionId: savedQuestion.id,
                      sequence: imgSequence,
                      fileName: fileInfo.fileName,
                      originalName: fileInfo.originalName,
                      mimeType: fileInfo.mimeType,
                      fileSize: fileInfo.fileSize,
                      altText: imgData.altText,
                      isActive: true,
                    });

                    await this.quizImageRepository.save(imageRecord);
                    DebugLogger.debug(
                      'QuizService',
                      `Created new image seq ${imgSequence} for question ${i + 1}`,
                    );
                  }
                } else if (existingImage) {
                  // Keep existing image, just update metadata if needed
                  if (imgData.altText !== undefined) {
                    existingImage.altText = imgData.altText;
                    await this.quizImageRepository.save(existingImage);
                    DebugLogger.debug(
                      'QuizService',
                      `Updated metadata for image seq ${imgSequence}`,
                    );
                  }
                } else if (imgData.fileName) {
                  // Reference to existing image from another question - create new record
                  const imageRecord = this.quizImageRepository.create({
                    questionId: savedQuestion.id,
                    sequence: imgSequence,
                    fileName: imgData.fileName,
                    originalName: imgData.originalName || 'existing_image.jpg',
                    mimeType: imgData.mimeType || 'image/jpeg',
                    fileSize: imgData.fileSize || 0,
                    altText: imgData.altText,
                    isActive: true,
                  });

                  await this.quizImageRepository.save(imageRecord);
                  DebugLogger.debug(
                    'QuizService',
                    `Reused existing image for question ${i + 1}`,
                  );
                }
              }
              DebugLogger.debug(
                'QuizService',
                `Processed ${questionData.imagesBase64.length} images for question ${i + 1}`,
              );
            } catch (uploadError) {
              DebugLogger.error(
                'QuizService',
                `Failed to upload images for question ${i + 1}`,
                uploadError.message,
              );
              throw new BadRequestException(
                `Question ${i + 1}: Gagal upload gambar - ${uploadError.message}`,
              );
            }
          }
          // Fallback to single image upload (backward compatibility)
          else if (questionData.imageBase64) {
            try {
              const imgSequence = questionData.imageSequence || 1;
              const existingImage = existingImagesMap.get(imgSequence);

              // Check if this is new base64 data or existing image reference
              const isBase64 = questionData.imageBase64.startsWith('data:');

              if (isBase64) {
                // Delete old image file from R2 if updating (safe delete)
                if (existingImage) {
                  await this.safeDeleteImageFile(
                    existingImage.fileName,
                    existingImage.id,
                  );
                }

                // Upload new image to storage
                const fileInfo = await this.fileUploadService.uploadFromBase64(
                  questionData.imageBase64,
                  questionData.imageOriginalName || 'question_image.jpg',
                  `question/${savedQuestion.id}`,
                );

                if (existingImage) {
                  // UPDATE existing image record
                  existingImage.fileName = fileInfo.fileName;
                  existingImage.originalName = fileInfo.originalName;
                  existingImage.mimeType = fileInfo.mimeType;
                  existingImage.fileSize = fileInfo.fileSize;
                  existingImage.altText = questionData.imageAltText;

                  await this.quizImageRepository.save(existingImage);
                  DebugLogger.debug(
                    'QuizService',
                    `Updated single image for question ${i + 1}`,
                  );
                } else {
                  // CREATE new image record
                  const imageRecord = this.quizImageRepository.create({
                    questionId: savedQuestion.id,
                    sequence: imgSequence,
                    fileName: fileInfo.fileName,
                    originalName: fileInfo.originalName,
                    mimeType: fileInfo.mimeType,
                    fileSize: fileInfo.fileSize,
                    altText: questionData.imageAltText,
                    isActive: true,
                  });

                  await this.quizImageRepository.save(imageRecord);
                  DebugLogger.debug(
                    'QuizService',
                    `Created single image for question ${i + 1}`,
                  );
                }
              } else if (existingImage) {
                // Keep existing image, update metadata
                if (questionData.imageAltText !== undefined) {
                  existingImage.altText = questionData.imageAltText;
                  await this.quizImageRepository.save(existingImage);
                }
              } else if (questionData.imageFileName) {
                // Reference to existing image - create new record
                const imageRecord = this.quizImageRepository.create({
                  questionId: savedQuestion.id,
                  sequence: imgSequence,
                  fileName: questionData.imageFileName,
                  originalName:
                    questionData.imageOriginalName || 'existing_image.jpg',
                  mimeType: questionData.imageMimeType || 'image/jpeg',
                  fileSize: questionData.imageFileSize || 0,
                  altText: questionData.imageAltText,
                  isActive: true,
                });

                await this.quizImageRepository.save(imageRecord);
                DebugLogger.debug(
                  'QuizService',
                  `Reused existing single image for question ${i + 1}`,
                );
              }
            } catch (uploadError) {
              DebugLogger.error(
                'QuizService',
                `Failed to upload image for question ${i + 1}`,
                uploadError.message,
              );
              throw new BadRequestException(
                `Question ${i + 1}: Gagal upload gambar - ${uploadError.message}`,
              );
            }
          }
        }
      }
    }

    // Handle scoring templates update (grade range)
    if (scoringTemplates !== undefined) {
      // Check if quiz has attempts - cannot edit scoring if quiz has been taken
      if (quiz.attempts && quiz.attempts.length > 0) {
        throw new BadRequestException(
          'Tidak dapat mengubah template penilaian untuk quiz yang sudah dikerjakan oleh peserta. ' +
            'Hal ini untuk menjaga keadilan dan integritas hasil quiz yang sudah ada.',
        );
      }

      // Validasi: pastikan scoring templates mencakup semua kemungkinan correctAnswers
      if (scoringTemplates.length > 0) {
        const totalQuestions = quiz.questions?.length || 0;
        if (totalQuestions > 0) {
          const correctAnswersSet = new Set(
            scoringTemplates.map((t) => t.correctAnswers),
          );

          // Check apakah ada yang terlewat
          const missing = [];
          for (let i = 0; i <= totalQuestions; i++) {
            if (!correctAnswersSet.has(i)) {
              missing.push(i);
            }
          }

          if (missing.length > 0) {
            throw new BadRequestException(
              `Template penilaian tidak lengkap. Belum ada template untuk: ${missing.join(', ')} jawaban benar. ` +
                `Quiz memiliki ${totalQuestions} soal, harus ada template untuk 0 sampai ${totalQuestions} jawaban benar.`,
            );
          }
        }
      }

      // Delete existing scoring templates
      await this.quizScoringRepository.delete({ quizId: id });

      // Create new scoring templates if provided
      if (scoringTemplates.length > 0) {
        const newScoringTemplates = scoringTemplates.map((templateData) =>
          this.quizScoringRepository.create({
            quizId: id,
            correctAnswers: templateData.correctAnswers,
            points: templateData.points || 1,
            isActive: true,
            createdBy: userInfo?.email || userInfo?.name || 'system',
            updatedBy: userInfo?.email || userInfo?.name || 'system',
          }),
        );
        await this.quizScoringRepository.save(newScoringTemplates);
      }
    }

    // Auto-assignment will be triggered automatically by service/location changes
    // No manual assignment handling needed since we use auto-assignment only

    return this.findOne(id);
  }

  async publish(id: number): Promise<QuizDetailResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions', 'scoringTemplates'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Validation: Quiz must have at least one question
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new BadRequestException(
        'Quiz tidak dapat dipublish karena belum memiliki soal. Silakan tambahkan minimal satu soal terlebih dahulu.',
      );
    }

    // Validation: Quiz must have at least one scoring template
    if (!quiz.scoringTemplates || quiz.scoringTemplates.length === 0) {
      throw new BadRequestException(
        'Quiz tidak dapat dipublish karena belum memiliki template penilaian. Silakan tambahkan template penilaian terlebih dahulu.',
      );
    }

    // Generate URLs when publishing (same as generate link)
    const updateData: any = {
      isPublished: true,
      isActive: true,
    };

    // Generate URLs if not already generated
    if (!quiz.normalUrl || !quiz.shortUrl) {
      if (quiz.slug && quiz.token) {
        const urls = await this.urlGeneratorService.generateQuizUrls(
          quiz.slug,
          quiz.token,
          quiz.id,
        );

        updateData.normalUrl = urls.normalUrl;
        updateData.shortUrl = urls.shortUrl;
      }
    }

    await this.quizRepository.update(id, updateData);
    return this.findOne(id);
  }

  async unpublish(id: number): Promise<QuizDetailResponseDto> {
    const quiz = await this.quizRepository.findOne({ where: { id } });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    await this.quizRepository.update(id, {
      isPublished: false,
      isActive: false,
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions', 'attempts'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Check if quiz has attempts - cannot delete if quiz has been taken
    if (quiz.attempts && quiz.attempts.length > 0) {
      throw new BadRequestException(
        `Quiz tidak dapat dihapus karena sudah ada ${quiz.attempts.length} peserta yang mengerjakan. Anda dapat menonaktifkan quiz dengan unpublish.`,
      );
    }

    // Delete all images - check if still in use by other questions first
    if (quiz.questions && quiz.questions.length > 0) {
      for (const question of quiz.questions) {
        const images = await this.quizImageRepository.find({
          where: { questionId: question.id },
        });

        for (const image of images) {
          // Safe delete - only delete from R2 if no other question uses this file
          await this.safeDeleteImageFile(image.fileName, image.id);
        }
      }
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

    // Load images for each question
    const questionsWithImages = await Promise.all(
      quiz.questions
        .sort((a, b) => a.order - b.order)
        .map(async (question) => {
          const images = await this.quizImageRepository.find({
            where: { questionId: question.id, isActive: true },
          });
          return {
            ...question,
            images: images.map((img) => ({
              id: img.id,
              sequence: img.sequence,
              fileName: img.fileName,
              originalName: img.originalName,
              mimeType: img.mimeType,
              fileSize: img.fileSize,
              altText: img.altText,
              downloadUrl: `/api/files/${img.fileName}`,
            })),
          };
        }),
    );

    return questionsWithImages;
  }

  async getAttempts(id: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['attempts', 'attempts.user'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    return quiz.attempts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async generateLink(
    id: number,
    customAlias?: string,
    userInfo?: UserInfo,
  ): Promise<{
    normalUrl: string;
    shortUrl: string;
  }> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['attempts'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Check if quiz has attempts - cannot regenerate link if quiz has been taken
    if (quiz.attempts && quiz.attempts.length > 0) {
      throw new BadRequestException(
        'Tidak dapat membuat ulang link untuk quiz yang sudah dikerjakan oleh peserta. ' +
          'Hal ini untuk memastikan hasil quiz tetap valid dan menghindari kebingungan peserta.',
      );
    }

    // Always regenerate token for new link (based on datetime)
    const newToken = generateUniqueToken();

    DebugLogger.debug('QuizService', `Regenerating link for quiz ${id}`, {
      oldToken: quiz.token,
      newToken,
    });

    // Generate URLs with new token
    if (quiz.slug) {
      const urls = await this.urlGeneratorService.generateQuizUrls(
        quiz.slug,
        newToken,
        quiz.id,
        customAlias, // Pass custom alias if provided
      );

      // Update quiz with new token and URLs
      await this.quizRepository.update(id, {
        token: newToken,
        normalUrl: urls.normalUrl,
        shortUrl: urls.shortUrl,
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      return urls;
    } else {
      throw new BadRequestException('Quiz must have slug to generate link');
    }
  }

  async findByToken(token: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({
      where: { token, isActive: true },
      relations: ['questions', 'scoringTemplates'],
    });
  }

  // Scoring calculation method (dipanggil saat submit test)
  async calculateScore(
    quizId: number,
    correctAnswers: number,
    totalQuestions: number,
  ) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['scoringTemplates'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz tidak ditemukan');
    }

    // Hitung persentase skor
    const percentageScore =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // Hitung score berdasarkan jumlah jawaban benar
    let score = 0;
    let gradeDescription = `${correctAnswers} Benar`;

    if (quiz.scoringTemplates && quiz.scoringTemplates.length > 0) {
      // Mode scoring template: Cari berdasarkan correctAnswers
      const matchingTemplate = quiz.scoringTemplates.find(
        (template) => template.correctAnswers === correctAnswers,
      );

      if (matchingTemplate) {
        // Score langsung dari tabel konversi (IQ scoring: 73, 74, 72, dll)
        score = matchingTemplate.points;
        gradeDescription = `${correctAnswers} Benar`;
      } else {
        // Jika tidak ada template yang cocok, gunakan default (1 point per jawaban)
        score = correctAnswers;
        gradeDescription = `${correctAnswers} Benar`;
      }
    } else {
      // Mode default: 1 point per jawaban benar
      score = correctAnswers;
      gradeDescription = `${correctAnswers} Benar`;
    }

    // Tentukan apakah lulus berdasarkan passing score
    const passed = score >= quiz.passingScore;

    return {
      score: score, // Nilai akhir dari scoring template
      percentageScore, // Persentase untuk referensi
      gradeDescription, // Deskripsi berformat "X Benar"
      passed,
      passingScore: quiz.passingScore,
      correctAnswers,
      totalQuestions,
      detail: {
        benar: correctAnswers,
        salah: totalQuestions - correctAnswers,
        total: totalQuestions,
        sistemPenilaian:
          quiz.scoringTemplates && quiz.scoringTemplates.length > 0
            ? 'Scoring Template'
            : 'Point System',
      },
    };
  }

  async findByTokenPublic(token: string): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: {
        token,
        isActive: true,
        isPublished: true, // Only published quizzes are accessible publicly
      },
      relations: ['questions', 'scoringTemplates'],
    });

    if (!quiz) {
      throw new NotFoundException(
        'Quiz not found or not published for public access',
      );
    }

    // Get config mappings for service and location names
    const mappings = await this.configService.getMappings();

    // Load images for each question and remove correctAnswer for security
    const publicQuestions = await Promise.all(
      quiz.questions?.map(async (q) => {
        const images = await this.quizImageRepository.find({
          where: { questionId: q.id, isActive: true },
        });
        const { correctAnswer, ...questionWithoutAnswer } = q;
        return {
          ...questionWithoutAnswer,
          images: images.map((img) => ({
            id: img.id,
            sequence: img.sequence,
            fileName: img.fileName,
            originalName: img.originalName,
            mimeType: img.mimeType,
            fileSize: img.fileSize,
            altText: img.altText,
            downloadUrl: `/api/files/${img.fileName}`,
          })),
        };
      }) || [],
    );

    const transformedQuiz = {
      ...quiz,
      questions: publicQuestions, // Questions without correct answers but with images
      images: [], // Images are now at question level
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
      serviceName: quiz.serviceKey
        ? mappings.services.mapping[quiz.serviceKey] || quiz.serviceKey
        : null,
      locationName: quiz.locationKey
        ? mappings.locations.mapping[quiz.locationKey] || quiz.locationKey
        : null,
    };

    return transformedQuiz;
  }

  async getQuizzesWithMappings(
    userId: number,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    serviceKey?: string,
    locationKey?: string,
  ) {
    // Get quiz data using existing method
    const quizData = await this.findAllForUser(
      userId,
      userRole,
      page,
      limit,
      undefined,
      undefined,
      serviceKey,
      locationKey,
    );

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Simply return combined data without complex mapping for now
    return {
      ...quizData,
      mappings: mappings,
    };
  }

  async findAllForUserWithDisplayNames(
    userId: number,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
    serviceKey?: string,
    locationKey?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    // Get quiz data using existing method
    const quizData = await this.findAllForUser(
      userId,
      userRole,
      page,
      limit,
      search,
      isActive,
      serviceKey,
      locationKey,
      sortBy,
      sortOrder,
    );

    // Get config mappings
    const mappings = await this.configService.getMappings();

    // Enhance quiz data with display names
    const enhancedQuizzes = quizData.items.map((quiz) => ({
      ...quiz,
      serviceName: quiz.serviceKey
        ? mappings.services.mapping[quiz.serviceKey] || quiz.serviceKey
        : null,
      locationName: quiz.locationKey
        ? mappings.locations.mapping[quiz.locationKey] || quiz.locationKey
        : null,
    }));

    return {
      items: enhancedQuizzes,
      pagination: quizData.pagination,
    };
  }

  async copyQuizWithImages(
    templateId: number,
    newTitle: string,
    newLocationKey?: string,
    newServiceKey?: string,
    userInfo?: UserInfo,
  ): Promise<any> {
    try {
      // Load template quiz dengan semua relasi
      const templateQuiz = await this.quizRepository.findOne({
        where: { id: templateId },
        relations: ['questions', 'scoringTemplates'],
      });

      if (!templateQuiz) {
        throw new NotFoundException('Template quiz tidak ditemukan');
      }

      // Generate slug dan token untuk quiz baru
      const slug = generateSlug(newTitle);
      const token = generateToken();

      // Create quiz baru dari template
      const newQuiz = this.quizRepository.create({
        title: newTitle,
        description: templateQuiz.description,
        slug,
        token,
        locationKey: newLocationKey ?? templateQuiz.locationKey, // Use new location or fallback to template
        serviceKey: newServiceKey ?? templateQuiz.serviceKey, // Use new service or fallback to template
        passingScore: templateQuiz.passingScore,
        questionsPerPage: templateQuiz.questionsPerPage,
        durationMinutes: templateQuiz.durationMinutes,
        isActive: true,
        isPublished: false,
        startDateTime: null,
        endDateTime: null,
        quizLink: null,
        createdBy: userInfo?.email || userInfo?.name || 'system',
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      const savedQuiz = await this.quizRepository.save(newQuiz);

      // Generate URLs untuk quiz baru
      if (savedQuiz.slug && savedQuiz.token) {
        const urls = await this.urlGeneratorService.generateQuizUrls(
          savedQuiz.slug,
          savedQuiz.token,
          savedQuiz.id,
        );
        await this.quizRepository.update(savedQuiz.id, {
          normalUrl: urls.normalUrl,
          shortUrl: urls.shortUrl,
        });
        savedQuiz.normalUrl = urls.normalUrl;
        savedQuiz.shortUrl = urls.shortUrl;
      }

      // Copy scoring templates
      const newScoringTemplates = [];
      if (templateQuiz.scoringTemplates && templateQuiz.scoringTemplates.length > 0) {
        for (const template of templateQuiz.scoringTemplates) {
          const newTemplate = this.quizScoringRepository.create({
            quizId: savedQuiz.id,
            correctAnswers: template.correctAnswers,
            points: template.points,
            isActive: template.isActive,
            createdBy: userInfo?.email || userInfo?.name || 'system',
            updatedBy: userInfo?.email || userInfo?.name || 'system',
          });
          const savedTemplate = await this.quizScoringRepository.save(newTemplate);
          newScoringTemplates.push(savedTemplate);
        }
      }

      // Copy questions dan images
      const newQuestions = [];
      if (templateQuiz.questions && templateQuiz.questions.length > 0) {
        for (let i = 0; i < templateQuiz.questions.length; i++) {
          const templateQuestion = templateQuiz.questions[i];

          // Create question baru
          const newQuestion = this.questionRepository.create({
            quizId: savedQuiz.id,
            questionText: templateQuestion.questionText,
            questionType: templateQuestion.questionType,
            options: templateQuestion.options,
            correctAnswer: templateQuestion.correctAnswer,
            order: templateQuestion.order,
          });

          const savedQuestion = await this.questionRepository.save(newQuestion);

          // Load images dari template question
          const templateImages = await this.quizImageRepository.find({
            where: { questionId: templateQuestion.id, isActive: true },
            order: { sequence: 'ASC' },
          });

          // Copy images - reuse same file (share image) instead of duplicating
          if (templateImages && templateImages.length > 0) {
            for (const templateImage of templateImages) {
              try {
                // Create image record baru yang merujuk ke file yang sama
                // Ini lebih efisien daripada copy file - save storage & lebih cepat
                const newImage = this.quizImageRepository.create({
                  questionId: savedQuestion.id,
                  sequence: templateImage.sequence,
                  fileName: templateImage.fileName, // Reuse file yang sama
                  originalName: templateImage.originalName,
                  mimeType: templateImage.mimeType,
                  fileSize: templateImage.fileSize,
                  altText: templateImage.altText,
                  isActive: true,
                });

                await this.quizImageRepository.save(newImage);
                DebugLogger.debug(
                  'QuizService',
                  `Reused image ${templateImage.fileName} for question ${i + 1}, sequence ${templateImage.sequence}`,
                );
              } catch (error) {
                DebugLogger.error(
                  'QuizService',
                  `Failed to create image record for question ${i + 1}`,
                  error.message,
                );
                // Continue dengan question lain jika ada error
              }
            }
          }

          newQuestions.push(savedQuestion);
        }
      }

      // Auto-assign admin users berdasarkan service dan location
      if (savedQuiz.serviceKey || savedQuiz.locationKey) {
        await this.autoAssignmentService.autoAssignUsersToQuiz(
          savedQuiz.id,
          savedQuiz.serviceKey,
          savedQuiz.locationKey,
          'system',
        );
      }

      // Get auto-assigned users
      const users = await this.userQuizAssignmentRepository.find({
        where: { quizId: savedQuiz.id, isActive: true },
        relations: ['user'],
      });

      const assignedUsers = users.map((assignment) => ({
        id: assignment.user.id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role,
        assignedAt: assignment.createdAt,
        assignmentType: assignment.assignedBy === 'system' ? 'auto' : 'manual',
        isActive: assignment.isActive,
      }));

      // Load images for each question in response
      const questionsWithImages = await Promise.all(
        newQuestions.map(async (question) => {
          const images = await this.quizImageRepository.find({
            where: { questionId: question.id, isActive: true },
            order: { sequence: 'ASC' },
          });
          return {
            ...question,
            images: images.map((img) => ({
              id: img.id,
              sequence: img.sequence,
              fileName: img.fileName,
              originalName: img.originalName,
              mimeType: img.mimeType,
              fileSize: img.fileSize,
              altText: img.altText,
              downloadUrl: `/api/files/${img.fileName}`,
            })),
          };
        }),
      );

      return {
        success: true,
        message: 'Quiz berhasil dicopy dengan semua gambar',
        data: {
          ...savedQuiz,
          questions: questionsWithImages,
          scoringTemplates: newScoringTemplates,
          assignedUsers,
          copiedFrom: {
            id: templateQuiz.id,
            title: templateQuiz.title,
          },
        },
      };
    } catch (error) {
      DebugLogger.error('QuizService', 'Copy quiz error', error.message);
      throw new BadRequestException(
        `Gagal copy quiz: ${error.message}`,
      );
    }
  }
}
