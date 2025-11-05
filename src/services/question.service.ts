import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuestionDto, UpdateQuestionDto, QuestionResponseDto } from '../dto/question.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<QuestionResponseDto> {
    try {
      // Verify quiz exists
      const quiz = await this.quizRepository.findOne({
        where: { id: createQuestionDto.quizId },
      });

      if (!quiz) {
        throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
      }

      // Get next order number if not provided
      if (!createQuestionDto.order) {
        const lastQuestion = await this.questionRepository.findOne({
          where: { quizId: createQuestionDto.quizId },
          order: { order: 'DESC' },
        });
        createQuestionDto.order = lastQuestion ? lastQuestion.order + 1 : 1;
      }

      const question = this.questionRepository.create(createQuestionDto);
      return await this.questionRepository.save(question);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async findAll(page: number = 1, limit: number = 10, quizId?: number) {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (quizId) {
      whereCondition.quizId = quizId;
    }

    const [questions, total] = await this.questionRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { order: 'ASC', createdAt: 'DESC' },
      relations: ['quiz'],
    });

    return {
      data: questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['quiz'],
    });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    return question;
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    await this.questionRepository.update(id, updateQuestionDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    await this.questionRepository.remove(question);
    return { message: SUCCESS_MESSAGES.DELETED('Question') };
  }

  async reorderQuestions(quizId: number, questionIds: number[]) {
    // Verify quiz exists
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException(ERROR_MESSAGES.QUIZ_NOT_FOUND);
    }

    // Update order for each question
    for (let i = 0; i < questionIds.length; i++) {
      await this.questionRepository.update(
        { id: questionIds[i], quizId },
        { order: i + 1 }
      );
    }

    return { message: SUCCESS_MESSAGES.UPDATED('Question order') };
  }

  async findByQuizId(quizId: number): Promise<Question[]> {
    return this.questionRepository.find({
      where: { quizId },
      order: { order: 'ASC' },
    });
  }

  async getQuestionCount(quizId: number): Promise<number> {
    return this.questionRepository.count({ where: { quizId } });
  }
}