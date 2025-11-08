import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsEmail, IsDateString } from 'class-validator';
import { SessionStatus } from '../entities/user-quiz-session.entity';

export class StartQuizSessionDto {
  @ApiProperty({ example: 1, description: 'Quiz ID to start' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiPropertyOptional({ example: 1, description: 'User ID (for registered users)' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @ApiPropertyOptional({ example: 'NIJ12345', description: 'User identifier (NIJ, employee ID, etc.)' })
  @IsOptional()
  @IsString()
  userIdentifier?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ 
    example: SessionStatus.PAUSED, 
    description: 'Session status',
    enum: SessionStatus 
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  sessionStatus?: SessionStatus;

  @ApiPropertyOptional({ example: 1800, description: 'Time spent in seconds' })
  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;

  @ApiPropertyOptional({ example: 600, description: 'Remaining time in seconds' })
  @IsOptional()
  @IsNumber()
  remainingSeconds?: number;

  @ApiPropertyOptional({ example: { currentQuestionIndex: 5, answeredCount: 3 }, description: 'Session metadata' })
  @IsOptional()
  metadata?: any;
}

export class UserQuizSessionResponseDto {
  @ApiProperty({ example: 1, description: 'Session ID' })
  id: number;

  @ApiPropertyOptional({ example: 1, description: 'User ID' })
  userId?: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({ example: 'sess_abc123xyz', description: 'Unique session token' })
  sessionToken: string;

  @ApiProperty({ example: SessionStatus.ACTIVE, description: 'Session status', enum: SessionStatus })
  sessionStatus: SessionStatus;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z', description: 'When user started the quiz' })
  startedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T10:30:00.000Z', description: 'When user paused (if applicable)' })
  pausedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T10:35:00.000Z', description: 'When user resumed (if applicable)' })
  resumedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T11:00:00.000Z', description: 'When user completed the quiz' })
  completedAt?: Date;

  @ApiPropertyOptional({ example: '2024-01-01T12:00:00.000Z', description: 'When the session expires' })
  expiresAt?: Date;

  @ApiProperty({ example: 1800, description: 'Total time spent in seconds' })
  timeSpentSeconds: number;

  @ApiPropertyOptional({ example: 600, description: 'Remaining time in seconds' })
  remainingSeconds?: number;

  @ApiPropertyOptional({ example: { progress: 50, currentQuestion: 5 }, description: 'Session metadata' })
  metadata?: any;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  userEmail: string;

  @ApiPropertyOptional({ example: 'NIJ12345', description: 'User identifier' })
  userIdentifier?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Session creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Quiz details',
    example: {
      id: 1,
      title: 'JavaScript Basics',
      durationMinutes: 120
    }
  })
  quiz?: any;

  @ApiPropertyOptional({ 
    description: 'User details',
    example: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
  user?: any;

  // Computed properties
  @ApiProperty({ example: false, description: 'Whether session is expired' })
  isExpired: boolean;

  @ApiProperty({ example: true, description: 'Whether session is active' })
  isActive: boolean;

  @ApiProperty({ example: 1800, description: 'Total elapsed seconds since start' })
  totalElapsedSeconds: number;
}

export class ResumeSessionDto {
  @ApiProperty({ example: 'sess_abc123xyz', description: 'Session token to resume' })
  @IsNotEmpty()
  @IsString()
  sessionToken: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email for verification' })
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;
}

export class SessionTimeUpdateDto {
  @ApiProperty({ example: 'sess_abc123xyz', description: 'Session token' })
  @IsNotEmpty()
  @IsString()
  sessionToken: string;

  @ApiProperty({ example: 300, description: 'Additional time spent in seconds' })
  @IsNotEmpty()
  @IsNumber()
  additionalTimeSeconds: number;

  @ApiPropertyOptional({ example: { currentQuestion: 8, totalAnswered: 5 }, description: 'Updated metadata' })
  @IsOptional()
  metadata?: any;
}