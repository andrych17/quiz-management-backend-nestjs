import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, IsEnum } from 'class-validator';

export class CreateQuizImageDto {
  @ApiProperty({ example: 1, description: 'Quiz ID' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiProperty({ example: 'quiz_image_123.jpg', description: 'Generated file name' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'My Quiz Image.jpg', description: 'Original uploaded file name' })
  @IsNotEmpty()
  @IsString()
  originalName: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 1048576, description: 'File size in bytes' })
  @IsNotEmpty()
  @IsNumber()
  fileSize: number;

  @ApiProperty({ example: '/uploads/quiz-images/quiz_image_123.jpg', description: 'File storage path' })
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @ApiPropertyOptional({ example: 'Quiz cover image showing JavaScript concepts', description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the image is active (default: true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateQuizImageDto {
  @ApiPropertyOptional({ example: 'Updated quiz image alt text', description: 'Updated alt text' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the image is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class QuizImageResponseDto {
  @ApiProperty({ example: 1, description: 'Image ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({ example: 'quiz_image_123.jpg', description: 'Generated file name' })
  fileName: string;

  @ApiProperty({ example: 'My Quiz Image.jpg', description: 'Original uploaded file name' })
  originalName: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  mimeType: string;

  @ApiProperty({ example: 1048576, description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ example: '/uploads/quiz-images/quiz_image_123.jpg', description: 'File storage path' })
  filePath: string;

  @ApiPropertyOptional({ example: 'Quiz cover image', description: 'Alt text for accessibility' })
  altText?: string;

  @ApiProperty({ example: true, description: 'Whether the image is active' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  updatedBy?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Quiz details',
    example: {
      id: 1,
      title: 'JavaScript Basics',
      description: 'Test your knowledge'
    }
  })
  quiz?: any;
}

export class UploadQuizImageDto {
  @ApiProperty({ example: 1, description: 'Quiz ID to associate the image with' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiPropertyOptional({ example: 'Quiz cover image', description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}