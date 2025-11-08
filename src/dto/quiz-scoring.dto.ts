import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateQuizScoringDto {
  @ApiProperty({ example: 1, description: 'Quiz ID' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiProperty({ example: 'Standard Scoring', description: 'Scoring template name' })
  @IsNotEmpty()
  @IsString()
  scoringName: string;

  @ApiPropertyOptional({ example: 10, description: 'Points awarded for correct answers (default: 10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  correctAnswerPoints?: number;

  @ApiPropertyOptional({ example: 0, description: 'Points deducted for incorrect answers (default: 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  incorrectAnswerPenalty?: number;

  @ApiPropertyOptional({ example: 0, description: 'Points deducted for unanswered questions (default: 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unansweredPenalty?: number;

  @ApiPropertyOptional({ example: 0, description: 'Bonus points (default: 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusPoints?: number;

  @ApiPropertyOptional({ example: 1.0, description: 'Score multiplier (default: 1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplier?: number;

  @ApiPropertyOptional({ example: false, description: 'Enable time bonus (default: false)' })
  @IsOptional()
  @IsBoolean()
  timeBonusEnabled?: boolean;

  @ApiPropertyOptional({ example: 0.1, description: 'Bonus points per second saved (default: 0.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeBonusPerSecond?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum possible score (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({ example: 0, description: 'Minimum possible score (optional)' })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ example: 70, description: 'Passing score (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the scoring template is active (default: true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateQuizScoringDto {
  @ApiPropertyOptional({ example: 'Advanced Scoring', description: 'Scoring template name' })
  @IsOptional()
  @IsString()
  scoringName?: string;

  @ApiPropertyOptional({ example: 15, description: 'Points awarded for correct answers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  correctAnswerPoints?: number;

  @ApiPropertyOptional({ example: 2, description: 'Points deducted for incorrect answers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  incorrectAnswerPenalty?: number;

  @ApiPropertyOptional({ example: 1, description: 'Points deducted for unanswered questions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unansweredPenalty?: number;

  @ApiPropertyOptional({ example: 5, description: 'Bonus points' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonusPoints?: number;

  @ApiPropertyOptional({ example: 1.5, description: 'Score multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplier?: number;

  @ApiPropertyOptional({ example: true, description: 'Enable time bonus' })
  @IsOptional()
  @IsBoolean()
  timeBonusEnabled?: boolean;

  @ApiPropertyOptional({ example: 0.2, description: 'Bonus points per second saved' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeBonusPerSecond?: number;

  @ApiPropertyOptional({ example: 150, description: 'Maximum possible score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum possible score' })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ example: 80, description: 'Passing score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the scoring template is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class QuizScoringResponseDto {
  @ApiProperty({ example: 1, description: 'Scoring template ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({ example: 'Standard Scoring', description: 'Scoring template name' })
  scoringName: string;

  @ApiProperty({ example: 10, description: 'Points awarded for correct answers' })
  correctAnswerPoints: number;

  @ApiProperty({ example: 0, description: 'Points deducted for incorrect answers' })
  incorrectAnswerPenalty: number;

  @ApiProperty({ example: 0, description: 'Points deducted for unanswered questions' })
  unansweredPenalty: number;

  @ApiProperty({ example: 0, description: 'Bonus points' })
  bonusPoints: number;

  @ApiProperty({ example: 1.0, description: 'Score multiplier' })
  multiplier: number;

  @ApiProperty({ example: false, description: 'Enable time bonus' })
  timeBonusEnabled: boolean;

  @ApiProperty({ example: 0.0, description: 'Bonus points per second saved' })
  timeBonusPerSecond: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum possible score' })
  maxScore?: number;

  @ApiPropertyOptional({ example: 0, description: 'Minimum possible score' })
  minScore?: number;

  @ApiPropertyOptional({ example: 70, description: 'Passing score' })
  passingScore?: number;

  @ApiProperty({ example: true, description: 'Whether the scoring template is active' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  updatedBy?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}

export class CalculateScoreDto {
  @ApiProperty({ example: 1, description: 'Attempt ID' })
  @IsNotEmpty()
  @IsNumber()
  attemptId: number;

  @ApiProperty({ example: 1, description: 'Quiz scoring template ID' })
  @IsNotEmpty()
  @IsNumber()
  scoringId: number;

  @ApiPropertyOptional({ example: 300, description: 'Time spent in seconds (for time bonus calculation)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number;
}