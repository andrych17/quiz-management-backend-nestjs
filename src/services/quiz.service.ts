import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { CreateQuizDto, UpdateQuizDto, QuizResponseDto, ServiceType } from '../dto/quiz.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { generateSlug, generateToken } from '../lib/utils';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(createQuizDto: CreateQuizDto): Promise<QuizResponseDto> {
    try {
      const slug = generateSlug(createQuizDto.title);
      const token = generateToken();

      const quiz = this.quizRepository.create({
        ...createQuizDto,
        slug,
        token,
        isActive: createQuizDto.isActive ?? true,
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
  ) {
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
      relations: ['questions', 'attempts'],
    });

    return {
      data: quizzes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<QuizResponseDto> {
    const quiz = await this.quizRepository.findOne({
      where: { id },
      relations: ['questions', 'attempts', 'images', 'location'],
    });

    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
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
      relations: ['questions'],
    });
  }
}