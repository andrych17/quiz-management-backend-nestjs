import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizImage } from '../entities/quiz-image.entity';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionResponseDto,
  QuestionDetailResponseDto,
} from '../dto/question.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { FileUploadService } from './file-upload.service';
import { DebugLogger } from '../lib/debug-logger';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizImage)
    private quizImageRepository: Repository<QuizImage>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionDetailResponseDto> {
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

      // Exclude images and base64 from question creation
      const {
        images,
        imageBase64,
        imageOriginalName,
        imageAltText,
        imageSequence,
        imagesBase64,
        ...questionData
      } = createQuestionDto;
      const question = this.questionRepository.create(questionData);
      const savedQuestion = await this.questionRepository.save(question);

      // Handle multiple images upload (new multi-image support)
      let savedImages = [];
      if (imagesBase64 && imagesBase64.length > 0) {
        try {
          for (let i = 0; i < imagesBase64.length; i++) {
            const imgData = imagesBase64[i];
            const sequence = imgData.sequence || i + 1;

            // Check if image with this sequence already exists
            const existingImage = await this.quizImageRepository.findOne({
              where: { questionId: savedQuestion.id, sequence },
            });

            // If exists, delete old image from R2 first
            if (existingImage) {
              await this.fileUploadService.deleteImage(existingImage.fileName);
              await this.quizImageRepository.delete({ id: existingImage.id });
            }

            const fileInfo = await this.fileUploadService.uploadFromBase64(
              imgData.imageBase64,
              imgData.originalName || `question_image_${sequence}.jpg`,
              `question/${savedQuestion.id}`,
            );

            const imageRecord = this.quizImageRepository.create({
              questionId: savedQuestion.id,
              sequence: sequence,
              fileName: fileInfo.fileName,
              originalName: fileInfo.originalName,
              mimeType: fileInfo.mimeType,
              fileSize: fileInfo.fileSize,
              altText: imgData.altText,
              isActive: true,
            });

            savedImages.push(await this.quizImageRepository.save(imageRecord));
          }
        } catch (uploadError) {
          // If any image upload fails, delete the question and all saved images
          await this.questionRepository.remove(savedQuestion);
          throw new BadRequestException(
            `Gagal upload gambar: ${uploadError.message}`,
          );
        }
      }
      // Fallback to single image upload (backward compatibility)
      else if (imageBase64) {
        try {
          const sequence = imageSequence || 1;

          // Check if image with this sequence already exists
          const existingImage = await this.quizImageRepository.findOne({
            where: { questionId: savedQuestion.id, sequence },
          });

          // If exists, delete old image from R2 first
          if (existingImage) {
            await this.fileUploadService.deleteImage(existingImage.fileName);
            await this.quizImageRepository.delete({ id: existingImage.id });
          }

          const fileInfo = await this.fileUploadService.uploadFromBase64(
            imageBase64,
            imageOriginalName || 'question_image.jpg',
            `question/${savedQuestion.id}`,
          );

          const imageRecord = this.quizImageRepository.create({
            questionId: savedQuestion.id,
            sequence: sequence,
            fileName: fileInfo.fileName,
            originalName: fileInfo.originalName,
            mimeType: fileInfo.mimeType,
            fileSize: fileInfo.fileSize,
            altText: imageAltText,
            isActive: true,
          });

          savedImages = [await this.quizImageRepository.save(imageRecord)];
        } catch (uploadError) {
          // If image upload fails, delete the question and throw error
          await this.questionRepository.remove(savedQuestion);
          throw new BadRequestException(
            `Gagal upload gambar: ${uploadError.message}`,
          );
        }
      }
      // Handle pre-uploaded images (advanced usage)
      else if (images && images.length > 0) {
        const questionImages = images.map((imageData) =>
          this.quizImageRepository.create({
            questionId: savedQuestion.id,
            fileName: imageData.fileName,
            originalName: imageData.originalName,
            mimeType: imageData.mimeType,
            fileSize: imageData.fileSize,
            altText: imageData.altText,
            isActive: true,
          }),
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

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionDetailResponseDto> {
    const question = await this.questionRepository.findOne({ where: { id } });

    if (!question) {
      throw new NotFoundException(ERROR_MESSAGES.RECORD_NOT_FOUND);
    }

    // Prepare update data excluding images and base64
    const {
      images,
      imageBase64,
      imageOriginalName,
      imageAltText,
      imageSequence,
      imagesBase64,
      deleteImageIds,
      ...questionData
    } = updateQuestionDto;

    // Update question basic data
    await this.questionRepository.update(id, questionData);

    // Handle image deletions first (before adding new ones)
    if (deleteImageIds && deleteImageIds.length > 0) {
      for (const imageId of deleteImageIds) {
        try {
          // Find the image
          const image = await this.quizImageRepository.findOne({
            where: { id: imageId, questionId: id },
          });

          if (image) {
            // Delete from storage
            try {
              await this.fileUploadService.deleteImage(image.fileName);
              DebugLogger.debug(
                'QuestionService',
                `Deleted image file: ${image.fileName}`,
              );
            } catch (error) {
              DebugLogger.error(
                'QuestionService',
                'Failed to delete image file',
                error.message,
              );
            }

            // Delete from database
            await this.quizImageRepository.delete({ id: imageId });
            DebugLogger.debug(
              'QuestionService',
              `Deleted image record: ${imageId}`,
            );
          }
        } catch (error) {
          DebugLogger.error(
            'QuestionService',
            `Failed to delete image ${imageId}`,
            error.message,
          );
        }
      }
    }

    // Handle multiple images upload (new multi-image support)
    if (imagesBase64 && imagesBase64.length > 0) {
      try {
        // Handle each image with sequence
        for (let i = 0; i < imagesBase64.length; i++) {
          const imgData = imagesBase64[i];
          const sequence = imgData.sequence || i + 1;

          // Check if image with this sequence already exists
          const existingImage = await this.quizImageRepository.findOne({
            where: { questionId: id, sequence },
          });

          // If exists, delete old image from R2 first
          if (existingImage) {
            await this.fileUploadService.deleteImage(existingImage.fileName);
            await this.quizImageRepository.delete({ id: existingImage.id });
          }

          // Upload new image
          const fileInfo = await this.fileUploadService.uploadFromBase64(
            imgData.imageBase64,
            imgData.originalName || `question_image_${sequence}.jpg`,
            `question/${id}`,
          );

          const imageRecord = this.quizImageRepository.create({
            questionId: id,
            sequence: sequence,
            fileName: fileInfo.fileName,
            originalName: fileInfo.originalName,
            mimeType: fileInfo.mimeType,
            fileSize: fileInfo.fileSize,
            altText: imgData.altText,
            isActive: true,
          });

          await this.quizImageRepository.save(imageRecord);
        }
      } catch (uploadError) {
        throw new BadRequestException(
          `Gagal upload gambar: ${uploadError.message}`,
        );
      }
    }
    // Fallback to single image upload (backward compatibility)
    else if (imageBase64) {
      try {
        const sequence = imageSequence || 1;

        // Check if image with this sequence already exists
        const existingImage = await this.quizImageRepository.findOne({
          where: { questionId: id, sequence },
        });

        // If exists, delete old image from R2 first
        if (existingImage) {
          await this.fileUploadService.deleteImage(existingImage.fileName);
          await this.quizImageRepository.delete({ id: existingImage.id });
        }

        // Upload new image
        const fileInfo = await this.fileUploadService.uploadFromBase64(
          imageBase64,
          imageOriginalName || 'question_image.jpg',
          `question/${id}`,
        );

        const imageRecord = this.quizImageRepository.create({
          questionId: id,
          sequence: sequence,
          fileName: fileInfo.fileName,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          fileSize: fileInfo.fileSize,
          altText: imageAltText,
          isActive: true,
        });

        await this.quizImageRepository.save(imageRecord);
      } catch (uploadError) {
        throw new BadRequestException(
          `Gagal upload gambar: ${uploadError.message}`,
        );
      }
    }
    // Handle pre-uploaded images update (advanced usage)
    else if (images !== undefined) {
      // Delete existing images
      await this.quizImageRepository.delete({ questionId: id });

      // Create new images if provided
      if (images.length > 0) {
        const newImages = images.map((imageData) =>
          this.quizImageRepository.create({
            questionId: id,
            fileName: imageData.fileName,
            originalName: imageData.originalName,
            mimeType: imageData.mimeType,
            fileSize: imageData.fileSize,
            altText: imageData.altText,
            isActive: true,
          }),
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

    // Check if quiz has attempts - cannot delete question if quiz has been taken
    const quiz = await this.quizRepository.findOne({
      where: { id: question.quizId },
      relations: ['attempts'],
    });

    if (quiz && quiz.attempts && quiz.attempts.length > 0) {
      throw new BadRequestException(
        `Pertanyaan tidak dapat dihapus karena quiz sudah dikerjakan oleh ${quiz.attempts.length} peserta.`,
      );
    }

    // Delete all images from storage for this question
    const images = await this.quizImageRepository.find({
      where: { questionId: id },
    });

    for (const image of images) {
      try {
        await this.fileUploadService.deleteImage(image.fileName);
        DebugLogger.debug(
          'QuestionService',
          `Deleted image: ${image.fileName}`,
        );
      } catch (error) {
        DebugLogger.error(
          'QuestionService',
          `Failed to delete image: ${image.fileName}`,
          error.message,
        );
      }
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
        { order: i + 1 },
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

  async findByQuizIdWithImages(quizId: number): Promise<any[]> {
    const questions = await this.questionRepository.find({
      where: { quizId },
      order: { order: 'ASC' },
    });

    // Get images for all questions
    const questionsWithImages = await Promise.all(
      questions.map(async (question) => {
        const images = await this.quizImageRepository.find({
          where: { questionId: question.id, isActive: true },
          order: { createdAt: 'ASC' },
        });

        return {
          ...question,
          images,
        };
      }),
    );

    return questionsWithImages;
  }

  async getQuestionCount(quizId: number): Promise<number> {
    return this.questionRepository.count({ where: { quizId } });
  }

  /**
   * Delete specific image from a question by image ID
   */
  async deleteQuestionImage(
    questionId: number,
    imageId: number,
  ): Promise<{ message: string }> {
    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Find the image
    const image = await this.quizImageRepository.findOne({
      where: { id: imageId, questionId },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this question');
    }

    // Delete from storage
    try {
      await this.fileUploadService.deleteImage(image.fileName);
      DebugLogger.debug('QuestionService', `Deleted image: ${image.fileName}`);
    } catch (error) {
      DebugLogger.error(
        'QuestionService',
        'Failed to delete image file',
        error.message,
      );
    }

    // Delete from database
    await this.quizImageRepository.delete({ id: imageId });

    return { message: SUCCESS_MESSAGES.DELETED('Question image') };
  }
}
