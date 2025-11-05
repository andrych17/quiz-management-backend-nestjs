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
  question: string;

  @ApiProperty({ 
    example: ['Paris', 'London', 'Berlin', 'Madrid'], 
    description: 'Array of possible answers' 
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ example: 'Paris', description: 'Correct answer' })
  @IsNotEmpty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional({ example: 1, description: 'Question order in quiz' })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'What is the capital of Italy?', description: 'Question text' })
  @IsOptional()
  @IsString()
  question?: string;

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
}

export class QuestionResponseDto {
  @ApiProperty({ example: 1, description: 'Question ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({ example: 'What is the capital of France?', description: 'Question text' })
  question: string;

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