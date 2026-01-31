import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StartQuizAttemptDto {
  @ApiProperty({ example: 'ABC123DEF456', description: 'Quiz token' })
  @IsNotEmpty()
  @IsString()
  quizToken: string;

  @ApiProperty({ example: 'John Doe', description: 'Participant name' })
  @IsNotEmpty()
  @IsString()
  participantName: string;

  @ApiProperty({ example: 'john@gms.com', description: 'Participant email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'NIJ001', description: 'Nomor Induk Jemaat (NIJ)' })
  @IsNotEmpty()
  @IsString()
  nij: string;

  @ApiPropertyOptional({
    example: 'SRV001',
    description: 'Servo Number peserta',
  })
  @IsOptional()
  @IsString()
  servoNumber?: string;

  @ApiProperty({
    example: 'art_ministry',
    description: 'Service key/jenis pelayanan peserta',
  })
  @IsNotEmpty()
  @IsString()
  serviceKey: string;
}

export class SubmitAnswerDto {
  @ApiProperty({ example: 1, description: 'Question ID' })
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @ApiProperty({ example: 'Paris', description: 'User answer' })
  @IsNotEmpty()
  @IsString()
  answer: string;
}

export class CreateAttemptDto {
  @ApiProperty({ example: 1, description: 'Quiz ID' })
  @IsNotEmpty()
  @IsNumber()
  quizId: number;

  @ApiProperty({ example: 'John Doe', description: 'Participant name' })
  @IsNotEmpty()
  @IsString()
  participantName: string;

  @ApiProperty({ example: 'john@gms.com', description: 'Participant email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'NIJ001', description: 'Nomor Induk Jemaat (NIJ)' })
  @IsNotEmpty()
  @IsString()
  nij: string;

  @ApiPropertyOptional({
    example: 'SRV001',
    description: 'Servo Number peserta',
  })
  @IsOptional()
  @IsString()
  servoNumber?: string;

  @ApiProperty({
    example: 'art_ministry',
    description: 'Service key/jenis pelayanan peserta',
  })
  @IsNotEmpty()
  @IsString()
  serviceKey: string;

  @ApiProperty({
    type: [SubmitAnswerDto],
    description: 'Array of answers',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

export class UpdateAttemptDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Participant name' })
  @IsOptional()
  @IsString()
  participantName?: string;

  @ApiPropertyOptional({
    example: 'jane@gms.com',
    description: 'Participant email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'NIJ002',
    description: 'Nomor Induk Jemaat (NIJ)',
  })
  @IsOptional()
  @IsString()
  nij?: string;

  @ApiPropertyOptional({ example: 85, description: 'Quiz score' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Completion date',
  })
  @IsOptional()
  completedAt?: Date;
}

export class AttemptResponseDto {
  @ApiProperty({ example: 1, description: 'Attempt ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Quiz ID' })
  quizId: number;

  @ApiProperty({ example: 'John Doe', description: 'Participant name' })
  participantName: string;

  @ApiProperty({ example: 'john@gms.com', description: 'Participant email' })
  email: string;

  @ApiProperty({ example: 'NIJ001', description: 'Nomor Induk Jemaat (NIJ)' })
  nij: string;

  @ApiPropertyOptional({
    example: 'SRV001',
    description: 'Servo Number peserta',
  })
  servoNumber?: string;

  @ApiPropertyOptional({
    example: 'art_ministry',
    description: 'Service key/jenis pelayanan peserta',
  })
  serviceKey?: string;

  @ApiProperty({ example: 85, description: 'Quiz score' })
  score: number;

  @ApiProperty({
    example: true,
    description: 'Whether participant passed the quiz',
  })
  passed: boolean;

  @ApiProperty({
    example: '2024-01-01T10:00:00.000Z',
    description: 'Start time',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Completion time',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Submission time',
  })
  submittedAt?: Date;

  @ApiProperty({
    example: '2024-01-01T10:00:00.000Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: {
      id: 1,
      title: 'JavaScript Quiz',
      serviceType: 'web-development',
    },
    description: 'Quiz details',
  })
  quiz?: any;
}
