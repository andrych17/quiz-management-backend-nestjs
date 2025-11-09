import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 1, description: 'Quiz ID this question belongs to' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiProperty({ example: 'What is the capital of France?', description: 'Question text' })
  @IsNotEmpty()
  @IsString()
  questionText: string;

  @ApiProperty({ 
    example: 'multiple-choice', 
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text']
  })
  @IsNotEmpty()
  @IsString()
  questionType: 'multiple-choice' | 'multiple-select' | 'text';

  @ApiPropertyOptional({ 
    example: ['Paris', 'London', 'Berlin', 'Madrid'], 
    description: 'Array of possible answers (not required for text questions)' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: 'Paris', description: 'Correct answer' })
  @IsNotEmpty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional({ example: 1, description: 'Question order in quiz' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ 
    description: 'Question images to create',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        fileSize: { type: 'number' },
        filePath: { type: 'string' },
        altText: { type: 'string' }
      }
    }
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
  @ApiPropertyOptional({ example: 'What is the capital of Italy?', description: 'Question text' })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({ 
    example: 'multiple-choice', 
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text']
  })
  @IsOptional()
  @IsString()
  questionType?: 'multiple-choice' | 'multiple-select' | 'text';

  @ApiPropertyOptional({ 
    example: ['Rome', 'Milan', 'Naples', 'Turin'], 
    description: 'Array of possible answers' 
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
    description: 'Question images to update (will replace existing images)',
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
        altText: { type: 'string' }
      }
    }
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

  @ApiProperty({ example: 'What is the capital of France?', description: 'Question text' })
  questionText: string;

  @ApiProperty({ 
    example: 'multiple-choice', 
    description: 'Type of question',
    enum: ['multiple-choice', 'multiple-select', 'text']
  })
  questionType: 'multiple-choice' | 'multiple-select' | 'text';

  @ApiProperty({ 
    example: ['Paris', 'London', 'Berlin', 'Madrid'], 
    description: 'Array of possible answers' 
  })
  options: string[];

  @ApiProperty({ example: 'Paris', description: 'Correct answer' })
  correctAnswer: string;

  @ApiProperty({ example: 1, description: 'Question order in quiz' })
  order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
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
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  images?: any[];
}