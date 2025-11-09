import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizImage } from '../entities/quiz-image.entity';
import { CreateQuestionDto, UpdateQuestionDto, QuestionResponseDto, QuestionDetailResponseDto } from '../dto/question.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizImage)
    private quizImageRepository: Repository<QuizImage>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<QuestionDetailResponseDto> {
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

      // Exclude images from question creation
      const { images, ...questionData } = createQuestionDto;
      const question = this.questionRepository.create(questionData);
      const savedQuestion = await this.questionRepository.save(question);

      // Handle images
      let savedImages = [];
      if (images && images.length > 0) {
        const questionImages = images.map(imageData => 
          this.quizImageRepository.create({
            questionId: savedQuestion.id,
            fileName: imageData.fileName,
            originalName: imageData.originalName,
            mimeType: imageData.mimeType,
            fileSize: imageData.fileSize,
            filePath: imageData.filePath,
            altText: imageData.altText,
            isActive: true,
          })
        );
        savedImages = await this.quizImageRepository.save(questionImages);
      }

      return {
        ...savedQuestion,
        images: savedImages,
      } as QuestionDetailResponseDto;
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

  async findOne(id: number): Promise<QuestionDetailResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['quiz'],
    });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    // Get question images
    const images = await this.quizImageRepository.find({
      where: { questionId: id, isActive: true },
      order: { createdAt: 'ASC' },
    });

    return {
      ...question,
      images,
    } as QuestionDetailResponseDto;
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<QuestionDetailResponseDto> {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    // Prepare update data excluding images
    const { images, ...questionData } = updateQuestionDto;

    // Update question basic data
    await this.questionRepository.update(id, questionData);

    // Handle images update
    if (images !== undefined) {
      // Delete existing images
      await this.quizImageRepository.delete({ questionId: id });
      
      // Create new images if provided
      if (images.length > 0) {
        const newImages = images.map(imageData => 
          this.quizImageRepository.create({
            questionId: id,
            fileName: imageData.fileName,
            originalName: imageData.originalName,
            mimeType: imageData.mimeType,
            fileSize: imageData.fileSize,
            filePath: imageData.filePath,
            altText: imageData.altText,
            isActive: true,
          })
        );
        await this.quizImageRepository.save(newImages);
      }
    }

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