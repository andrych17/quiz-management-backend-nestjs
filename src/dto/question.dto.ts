import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 1, description: 'Quiz ID this question belongs to' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'Question text',
  })
  @IsNotEmpty()
  @IsString()
  questionText: string;

  @ApiProperty({
    example: 'multiple-choice',
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text', 'true-false'],
  })
  @IsNotEmpty()
  @IsString()
  questionType: 'multiple-choice' | 'multiple-select' | 'text' | 'true-false';

  @ApiPropertyOptional({
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    description: 'Array of possible answers (not required for text questions)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Paris', description: 'Correct answer' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 1, description: 'Question order in quiz' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KG...',
    description:
      'Base64 encoded image (max 5MB). Will be auto-uploaded to file storage.',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({
    example: 'question_image.jpg',
    description: 'Original filename for uploaded image',
  })
  @IsOptional()
  @IsString()
  imageOriginalName?: string;

  @ApiPropertyOptional({
    example: 'Question diagram showing process flow',
    description: 'Alt text for uploaded image',
  })
  @IsOptional()
  @IsString()
  imageAltText?: string;

  @ApiPropertyOptional({
    description: 'Array of base64 images for multi-image support (max 5MB each)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        imageBase64: { type: 'string', description: 'Base64 encoded image' },
        originalName: { type: 'string', description: 'Original filename' },
        altText: { type: 'string', description: 'Alt text for image' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  imagesBase64?: Array<{
    imageBase64: string;
    originalName?: string;
    altText?: string;
  }>;

  @ApiPropertyOptional({
    description:
      'Pre-uploaded question images (advanced usage - normally use imageBase64)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        fileSize: { type: 'number' },
        filePath: { type: 'string' },
        altText: { type: 'string' },
      },
    },
  })
  @IsOptional()
  images?: Array<{
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    altText?: string;
  }>;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    example: 'What is the capital of Italy?',
    description: 'Question text',
  })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({
    example: 'multiple-choice',
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text', 'true-false'],
  })
  @IsOptional()
  @IsString()
  questionType?: 'multiple-choice' | 'multiple-select' | 'text' | 'true-false';

  @ApiPropertyOptional({
    example: ['Rome', 'Milan', 'Naples', 'Turin'],
    description: 'Array of possible answers',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Rome', description: 'Correct answer' })
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 2, description: 'Question order in quiz' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,iVBORw0KG...',
    description: 'Base64 encoded image (max 5MB). Will replace existing image.',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({
    example: 'question_image.jpg',
    description: 'Original filename for uploaded image',
  })
  @IsOptional()
  @IsString()
  imageOriginalName?: string;

  @ApiPropertyOptional({
    example: 'Updated diagram',
    description: 'Alt text for uploaded image',
  })
  @IsOptional()
  @IsString()
  imageAltText?: string;

  @ApiPropertyOptional({
    description: 'Array of base64 images for multi-image support (max 5MB each). Will replace all existing images.',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        imageBase64: { type: 'string', description: 'Base64 encoded image' },
        originalName: { type: 'string', description: 'Original filename' },
        altText: { type: 'string', description: 'Alt text for image' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  imagesBase64?: Array<{
    imageBase64: string;
    originalName?: string;
    altText?: string;
  }>;

  @ApiPropertyOptional({
    description:
      'Pre-uploaded question images (advanced usage - normally use imageBase64)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        fileName: { type: 'string' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        fileSize: { type: 'number' },
        filePath: { type: 'string' },
        altText: { type: 'string' },
      },
    },
  })
  @IsOptional()
  images?: Array<{
    id?: number;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    altText?: string;
  }>;
}

export class QuestionResponseDto {
  @ApiProperty({ example: 1, description: 'Question ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({
    example: 'What is the capital of France?',
    description: 'Question text',
  })
  questionText: string;

  @ApiProperty({
    example: 'multiple-choice',
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text', 'true-false'],
  })
  questionType: 'multiple-choice' | 'multiple-select' | 'text' | 'true-false';

  @ApiProperty({
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    description: 'Array of possible answers',
  })
  options: string[];

  @ApiProperty({ example: 'Paris', description: 'Correct answer' })
  correctAnswer: string;

  @ApiProperty({ example: 1, description: 'Question order in quiz' })
  order: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;
}

export class QuestionDetailResponseDto extends QuestionResponseDto {
  @ApiPropertyOptional({
    description: 'Question images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        fileName: { type: 'string' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        fileSize: { type: 'number' },
        filePath: { type: 'string' },
        altText: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  images?: any[];
}
