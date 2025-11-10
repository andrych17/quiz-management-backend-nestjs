import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, IsNumber, IsEnum } from 'class-validator';

export enum ServiceType {
  SERVICE_MANAGEMENT = 'service-management',
  NETWORK_MANAGEMENT = 'network-management',
  DATABASE_ADMIN = 'database-admin',
  SYSTEM_ADMIN = 'system-admin',
  WEB_DEVELOPMENT = 'web-development',
  MOBILE_DEVELOPMENT = 'mobile-development',
  DATA_SCIENCE = 'data-science',
  CYBERSECURITY = 'cybersecurity',
  CLOUD_COMPUTING = 'cloud-computing',
  DEVOPS = 'devops',
}

export enum QuizType {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export class CreateQuizDto {
  @ApiProperty({ example: 'JavaScript Basics', description: 'Quiz title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Test your knowledge of JavaScript fundamentals', description: 'Quiz description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    example: 'web-development', 
    description: 'Service type for the quiz',
    enum: ServiceType,
    enumName: 'ServiceType'
  })
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ 
    example: 'scheduled', 
    description: 'Quiz type: scheduled (has fixed schedule) or manual (started by admin)',
    enum: QuizType,
    enumName: 'QuizType',
    default: QuizType.SCHEDULED
  })
  @IsOptional()
  @IsEnum(QuizType)
  quizType?: QuizType;

  @ApiPropertyOptional({ example: 'jakarta_pusat', description: 'Location key from config items (location group)' })
  @IsOptional()
  @IsString()
  locationKey?: string;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key from config items (SM, AM, dll)' })
  @IsOptional()
  @IsString()
  serviceKey?: string;

  @ApiPropertyOptional({ example: 70, description: 'Passing score percentage (default: 70)' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ example: 5, description: 'Questions per page (default: 5)' })
  @IsOptional()
  @IsNumber()
  questionsPerPage?: number;

  @ApiPropertyOptional({ example: 120, description: 'Quiz duration in minutes (null = no time limit)' })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the quiz is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T08:00:00.000Z', description: 'Quiz start date and time' })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz end date and time' })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional({ example: 'https://quiz.gms.com/q/ABC123', description: 'Short URL for public sharing (legacy)' })
  @IsOptional()
  @IsString()
  quizLink?: string;

  @ApiPropertyOptional({ example: 'https://quiz.gms.com/quiz/javascript-basics-ABC123', description: 'Normal URL for quiz access' })
  @IsOptional()
  @IsString()
  normalUrl?: string;

  @ApiPropertyOptional({ example: 'https://tinyurl.com/quiz-js-basics', description: 'Short URL for easy sharing' })
  @IsOptional()
  @IsString()
  shortUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Quiz scoring templates to create',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        minScore: { type: 'number' },
        maxScore: { type: 'number' },
        grade: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  @IsOptional()
  scoringTemplates?: Array<{
    minScore: number;
    maxScore: number;
    grade: string;
    description?: string;
  }>;


}

export class UpdateQuizDto {
  @ApiPropertyOptional({ example: 'JavaScript Advanced', description: 'Quiz title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Advanced JavaScript concepts', description: 'Quiz description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'javascript-advanced', description: 'URL slug (auto-generated from title)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ 
    example: 'web-development', 
    description: 'Service type for the quiz',
    enum: ServiceType,
    enumName: 'ServiceType'
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ 
    example: 'scheduled', 
    description: 'Quiz type: scheduled (has fixed schedule) or manual (started by admin)',
    enum: QuizType,
    enumName: 'QuizType'
  })
  @IsOptional()
  @IsEnum(QuizType)
  quizType?: QuizType;

  @ApiPropertyOptional({ example: 'jakarta_pusat', description: 'Location key from config items (location group)' })
  @IsOptional()
  @IsString()
  locationKey?: string;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key from config items (SM, AM, dll)' })
  @IsOptional()
  @IsString()
  serviceKey?: string;

  @ApiPropertyOptional({ example: 70, description: 'Passing score percentage' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ example: 5, description: 'Questions per page' })
  @IsOptional()
  @IsNumber()
  questionsPerPage?: number;

  @ApiPropertyOptional({ example: 90, description: 'Quiz duration in minutes (null = no time limit)' })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the quiz is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the quiz is published' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T08:00:00.000Z', description: 'Quiz start date and time' })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz end date and time' })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional({ example: 'https://quiz.gms.com/q/ABC123', description: 'Short URL for public sharing (legacy)' })
  @IsOptional()
  @IsString()
  quizLink?: string;

  @ApiPropertyOptional({ example: 'https://quiz.gms.com/quiz/javascript-advanced-XYZ789', description: 'Normal URL for quiz access' })
  @IsOptional()
  @IsString()
  normalUrl?: string;

  @ApiPropertyOptional({ example: 'https://tinyurl.com/quiz-js-advanced', description: 'Short URL for easy sharing' })
  @IsOptional()
  @IsString()
  shortUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Quiz scoring templates to update (will replace existing templates)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        minScore: { type: 'number' },
        maxScore: { type: 'number' },
        grade: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  @IsOptional()
  scoringTemplates?: Array<{
    id?: number;
    minScore: number;
    maxScore: number;
    grade: string;
    description?: string;
  }>;


}

export class QuizResponseDto {
  @ApiProperty({ example: 1, description: 'Quiz ID' })
  id: number;

  @ApiProperty({ example: 'JavaScript Basics', description: 'Quiz title' })
  title: string;

  @ApiProperty({ example: 'Test your knowledge of JavaScript fundamentals', description: 'Quiz description' })
  description: string;

  @ApiProperty({ example: 'javascript-basics', description: 'URL slug' })
  slug: string;

  @ApiProperty({ example: 'ABC123DEF', description: 'Quiz token' })
  token: string;

  @ApiProperty({ example: 'web-development', description: 'Service type' })
  serviceType: ServiceType;

  @ApiProperty({ example: 'scheduled', description: 'Quiz type (scheduled or manual)' })
  quizType: QuizType;

  @ApiPropertyOptional({ example: 'jakarta_pusat', description: 'Location key' })
  locationKey?: string;

  @ApiPropertyOptional({ 
    example: { id: 1, key: 'jakarta_pusat', value: 'Jakarta Pusat' }, 
    description: 'Location details' 
  })
  location?: any;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key' })
  serviceKey?: string;

  @ApiPropertyOptional({ 
    example: { id: 1, key: 'sm', value: 'Service Management' }, 
    description: 'Service details' 
  })
  service?: any;

  @ApiProperty({ example: 70, description: 'Passing score percentage' })
  passingScore: number;

  @ApiProperty({ example: 5, description: 'Questions per page' })
  questionsPerPage: number;

  @ApiPropertyOptional({ example: 120, description: 'Quiz duration in minutes (null = no time limit)' })
  durationMinutes?: number;

  @ApiProperty({ example: true, description: 'Whether the quiz is active' })
  isActive: boolean;

  @ApiProperty({ example: true, description: 'Whether the quiz is published' })
  isPublished: boolean;

  @ApiProperty({ example: '2024-01-01T08:00:00.000Z', description: 'Quiz start date and time' })
  startDateTime: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz end date and time' })
  endDateTime: Date;

  @ApiProperty({ example: 'https://quiz.gms.com/q/ABC123', description: 'Short URL for public sharing (legacy)' })
  quizLink: string;

  @ApiPropertyOptional({ example: 'https://quiz.gms.com/quiz/javascript-basics-ABC123', description: 'Normal URL for quiz access' })
  normalUrl?: string;

  @ApiPropertyOptional({ example: 'https://tinyurl.com/quiz-js-basics', description: 'Short URL for easy sharing' })
  shortUrl?: string;

  @ApiProperty({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'Quiz images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        imageUrl: { type: 'string' },
        altText: { type: 'string' },
        order: { type: 'number' }
      }
    }
  })
  images?: any[];

  @ApiPropertyOptional({ 
    description: 'Quiz scoring templates',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        minScore: { type: 'number' },
        maxScore: { type: 'number' },
        grade: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  scoringTemplates?: any[];
}

export class QuizDetailResponseDto extends QuizResponseDto {
  @ApiPropertyOptional({ 
    description: 'Quiz questions',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        questionText: { type: 'string' },
        questionType: { type: 'string' },
        isRequired: { type: 'boolean' },
        order: { type: 'number' },
        points: { type: 'number' },
        options: { type: 'array' },
        correctAnswers: { type: 'array' }
      }
    }
  })
  questions?: any[];

  @ApiPropertyOptional({ 
    description: 'Assigned users (auto-assigned based on service and location)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        assignedAt: { type: 'string', format: 'date-time' },
        assignmentType: { type: 'string', description: 'Assignment type (auto/manual)' },
        isActive: { type: 'boolean' }
      }
    }
  })
  assignedUsers?: any[];
}

export class StartManualQuizDto {
  @ApiPropertyOptional({ example: '2024-01-01T08:00:00.000Z', description: 'Custom start date and time (default: now)' })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({ example: 120, description: 'Override quiz duration in minutes' })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}