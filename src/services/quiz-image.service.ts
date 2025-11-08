import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizImage } from '../entities/quiz-image.entity';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuizImageDto, UpdateQuizImageDto } from '../dto/quiz-image.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizImageService {
  constructor(
    @InjectRepository(QuizImage)
    private quizImageRepository: Repository<QuizImage>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
  ) {}

  async create(createQuizImageDto: CreateQuizImageDto): Promise<QuizImage> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findOne({
      where: { id: createQuizImageDto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${createQuizImageDto.quizId} not found`);
    }

    // Check if quiz already has an image
    const existingImage = await this.quizImageRepository.findOne({
      where: { quizId: createQuizImageDto.quizId },
    });

    if (existingImage) {
      throw new BadRequestException(
        `Quiz ${createQuizImageDto.quizId} already has an image. Use update or replace instead.`
      );
    }

    const quizImage = this.quizImageRepository.create({
      ...createQuizImageDto,
      isActive: createQuizImageDto.isActive ?? true,
    });

    return await this.quizImageRepository.save(quizImage);
  }

  async findAll(): Promise<QuizImage[]> {
    return await this.quizImageRepository.find({
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByQuizId(quizId: number): Promise<QuizImage | null> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    return await this.quizImageRepository.findOne({
      where: { quizId },
      relations: ['quiz'],
    });
  }

  async findOne(id: number): Promise<QuizImage> {
    const quizImage = await this.quizImageRepository.findOne({
      where: { id },
      relations: ['quiz'],
    });

    if (!quizImage) {
      throw new NotFoundException(`Quiz image with ID ${id} not found`);
    }

    return quizImage;
  }

  async update(id: number, updateQuizImageDto: UpdateQuizImageDto): Promise<QuizImage> {
    const quizImage = await this.findOne(id);

    Object.assign(quizImage, updateQuizImageDto);
    return await this.quizImageRepository.save(quizImage);
  }

  async remove(id: number): Promise<void> {
    const quizImage = await this.findOne(id);
    
    // Delete the physical file
    try {
      if (fs.existsSync(quizImage.filePath)) {
        fs.unlinkSync(quizImage.filePath);
      }
    } catch (error) {
      console.warn(`Could not delete file: ${quizImage.filePath}`, error);
    }

    await this.quizImageRepository.remove(quizImage);
  }

  async removeByQuizId(quizId: number): Promise<void> {
    const quizImage = await this.findByQuizId(quizId);
    if (quizImage) {
      await this.remove(quizImage.id);
    }
  }

  async replaceQuizImage(quizId: number, createQuizImageDto: Omit<CreateQuizImageDto, 'quizId'>): Promise<QuizImage> {
    // Remove existing image if exists
    await this.removeByQuizId(quizId);

    // Create new image
    return await this.create({
      ...createQuizImageDto,
      quizId,
    });
  }

  async getImageUrl(id: number): Promise<string> {
    const quizImage = await this.findOne(id);
    
    // Return the file path (you may want to prepend base URL in production)
    return quizImage.filePath;
  }

  async getImageByQuizUrl(quizId: number): Promise<string | null> {
    const quizImage = await this.findByQuizId(quizId);
    
    if (!quizImage || !quizImage.isActive) {
      return null;
    }

    return quizImage.filePath;
  }

  generateFileName(originalName: string, quizId: number): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `quiz_${quizId}_${timestamp}_${random}${extension}`;
  }

  getUploadPath(): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'quiz-images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    return uploadDir;
  }

  validateImageFile(file: any): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      );
    }

    return true;
  }

  async getImageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    averageSize: number;
    imagesByType: { type: string; count: number }[];
  }> {
    const images = await this.quizImageRepository.find();
    
    const totalImages = images.length;
    const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);
    const averageSize = totalImages > 0 ? totalSize / totalImages : 0;

    const typeMap = new Map<string, number>();
    images.forEach(img => {
      const count = typeMap.get(img.mimeType) || 0;
      typeMap.set(img.mimeType, count + 1);
    });

    const imagesByType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      totalImages,
      totalSize,
      averageSize: Math.round(averageSize),
      imagesByType,
    };
  }
}