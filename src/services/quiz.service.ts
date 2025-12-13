import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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
  ) {}

  // Helper method to get full image URL from file server
  private getFullImageUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath; // Already full URL
    return `${APP_URLS.FILE_SERVER_URL}/${filePath}`;
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
            createQuizDto.scoringTemplates.map(t => t.correctAnswers)
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
              `Quiz memiliki ${totalQuestions} soal, harus ada template untuk 0 sampai ${totalQuestions} jawaban benar.`
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
      let savedQuestions = [];
      if (createQuizDto.questions && createQuizDto.questions.length > 0) {
        console.log('Creating questions:', createQuizDto.questions.map((q, index) => ({
          index,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          correctAnswerLength: q.correctAnswer ? q.correctAnswer.length : 'undefined',
          questionType: q.questionType
        })));
        
        for (let i = 0; i < createQuizDto.questions.length; i++) {
          const questionData = createQuizDto.questions[i];
          
          // Text and essay questions don't need correct answers (open-ended)
          const isOpenEnded = questionData.questionType === 'text' || questionData.questionType === 'essay';
          if (!isOpenEnded && (!questionData.correctAnswer || questionData.correctAnswer.trim() === '')) {
            throw new BadRequestException(`Question ${i + 1}: correctAnswer is required and cannot be empty`);
          }
          
          // Convert questionType to match enum values
          let questionType: string = questionData.questionType;
          if (questionType === 'essay') {
            questionType = 'text'; // Map essay to text
          } else if (questionType.includes('_')) {
            questionType = questionType.replace('_', '-'); // Convert multiple_choice to multiple-choice
          }
          
          const question = this.questionRepository.create({
            quizId: savedQuiz.id,
            questionText: questionData.questionText,
            questionType: questionType as any,
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer ? questionData.correctAnswer.trim() : '',
            order: questionData.order ?? i + 1, // Auto-generate order if not provided
          });
          
          const savedQuestion = await this.questionRepository.save(question);
          console.log(`Saved question ${i + 1}:`, {
            id: savedQuestion.id,
            correctAnswer: savedQuestion.correctAnswer,
            questionText: savedQuestion.questionText.substring(0, 50) + '...'
          });
          
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
      console.error('Quiz creation error:', error);
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

    // Transform questions to include options and correct answers
    const questions = quiz.questions
      ? quiz.questions.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          order: question.order,
          options: question.options,
          correctAnswer: question.correctAnswer,
        }))
      : [];

    return {
      ...quiz,
      questions,
      assignedUsers,
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
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

      // Delete existing questions (cascade will delete related data)
      if (quiz.questions && quiz.questions.length > 0) {
        await this.questionRepository.delete({ quizId: id });
      }

      // Create new questions
      if (questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const questionData = questions[i];
          
          // Handle correctAnswer properly - now using correctAnswer (singular)
          let correctAnswer = '';
          if (questionData.correctAnswer) {
            correctAnswer = String(questionData.correctAnswer).trim();
          }
          
          // Essay questions don't need correct answers (check both questionType and correctAnswer content)
          const isEssayQuestion = questionData.questionType === 'essay' || 
                                 questionData.questionType === 'text' || 
                                 correctAnswer === 'essay';
          
          if (!isEssayQuestion && !correctAnswer) {
            throw new BadRequestException(`Question ${i + 1}: correctAnswer is required and cannot be empty`);
          }
          
          // For essay questions, clear the correctAnswer
          if (isEssayQuestion) {
            correctAnswer = '';
          }

          // Convert questionType to match enum values
          let questionType: string = questionData.questionType;
          if (questionType === 'essay') {
            questionType = 'text'; // Map essay to text
          } else if (questionType.includes('_')) {
            questionType = questionType.replace('_', '-'); // Convert multiple_choice to multiple-choice
          }

          const question = this.questionRepository.create({
            quizId: id,
            questionText: questionData.questionText,
            questionType: questionType as any,
            options: questionData.options || [],
            correctAnswer: correctAnswer,
            order: questionData.order || i + 1,
          });

          const savedQuestion = await this.questionRepository.save(question);
          console.log(`Updated question ${i + 1}:`, {
            id: savedQuestion.id,
            correctAnswer: savedQuestion.correctAnswer,
            questionText: savedQuestion.questionText.substring(0, 50) + '...'
          });
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
            scoringTemplates.map(t => t.correctAnswers)
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
              `Quiz memiliki ${totalQuestions} soal, harus ada template untuk 0 sampai ${totalQuestions} jawaban benar.`
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
      relations: ['questions', 'scoringTemplates']
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Validation: Quiz must have at least one question
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new BadRequestException('Quiz tidak dapat dipublish karena belum memiliki soal. Silakan tambahkan minimal satu soal terlebih dahulu.');
    }

    // Validation: Quiz must have at least one scoring template
    if (!quiz.scoringTemplates || quiz.scoringTemplates.length === 0) {
      throw new BadRequestException('Quiz tidak dapat dipublish karena belum memiliki template penilaian. Silakan tambahkan template penilaian terlebih dahulu.');
    }

    // Generate URLs when publishing (same as generate link)
    let updateData: any = { 
      isPublished: true, 
      isActive: true 
    };

    // Generate URLs if not already generated
    if (!quiz.normalUrl || !quiz.shortUrl) {
      if (quiz.slug && quiz.token) {
        const urls = await this.urlGeneratorService.generateQuizUrls(
          quiz.slug, 
          quiz.token, 
          quiz.id
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

    await this.quizRepository.update(id, { isPublished: false, isActive: false });
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
      relations: ['attempts']
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
    
    console.log(`=== REGENERATE LINK FOR QUIZ ${id} ===`);
    console.log('Old token:', quiz.token);
    console.log('New token:', newToken);
    console.log('=========================================');

    // Generate URLs with new token
    if (quiz.slug) {
      const urls = await this.urlGeneratorService.generateQuizUrls(
        quiz.slug,
        newToken,
        quiz.id,
        customAlias, // Pass custom alias if provided
      );

      // Update quiz with new token and URLs, and publish it
      await this.quizRepository.update(id, {
        token: newToken,
        normalUrl: urls.normalUrl,
        shortUrl: urls.shortUrl,
        isPublished: true,
        isActive: true,
        updatedBy: userInfo?.email || userInfo?.name || 'system',
      });

      return urls;
    } else {
      throw new BadRequestException(
        'Quiz must have slug to generate link',
      );
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
        (template) => template.correctAnswers === correctAnswers
      );

      if (matchingTemplate) {
        // Score = correctAnswers × points
        score = correctAnswers * (matchingTemplate.points || 1);
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
    // Images are now handled at question level
    // Remove correctAnswer from questions for public access (security)
    const publicQuestions = quiz.questions?.map(q => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

    const transformedQuiz = {
      ...quiz,
      questions: publicQuestions, // Questions without correct answers
      images: [], // Images are now at question level
      quizLink: quiz.shortUrl || quiz.normalUrl || quiz.quizLink, // Prioritize shortUrl (TinyURL)
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
}
