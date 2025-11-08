import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateAttemptAnswerDto {
  @ApiProperty({ example: 1, description: 'Attempt ID' })
  @IsNotEmpty()
  @IsNumber()
  attemptId: number;

  @ApiProperty({ example: 1, description: 'Question ID' })
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @ApiProperty({ example: 'A', description: 'Selected answer (A, B, C, D, or text for open questions)' })
  @IsNotEmpty()
  @IsString()
  selectedAnswer: string;

  @ApiPropertyOptional({ example: '2024-01-01T10:30:00.000Z', description: 'When the answer was given' })
  @IsOptional()
  @IsDateString()
  answeredAt?: string;
}

export class UpdateAttemptAnswerDto {
  @ApiPropertyOptional({ example: 'B', description: 'Updated selected answer' })
  @IsOptional()
  @IsString()
  selectedAnswer?: string;

  @ApiPropertyOptional({ example: '2024-01-01T10:35:00.000Z', description: 'Updated answer timestamp' })
  @IsOptional()
  @IsDateString()
  answeredAt?: string;
}

export class AttemptAnswerResponseDto {
  @ApiProperty({ example: 1, description: 'Answer ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Attempt ID' })
  attemptId: number;

  @ApiProperty({ example: 1, description: 'Question ID' })
  questionId: number;

  @ApiProperty({ example: 'A', description: 'Selected answer' })
  selectedAnswer: string;

  @ApiProperty({ example: '2024-01-01T10:30:00.000Z', description: 'When the answer was given' })
  answeredAt: Date;

  @ApiPropertyOptional({ 
    description: 'Question details',
    example: {
      id: 1,
      questionText: 'What is JavaScript?',
      correctAnswer: 'A'
    }
  })
  question?: any;

  @ApiPropertyOptional({ 
    description: 'Attempt details',
    example: {
      id: 1,
      quizId: 1,
      participantName: 'John Doe'
    }
  })
  attempt?: any;
}