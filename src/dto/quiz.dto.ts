import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateQuestionForQuizDto {
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
  @IsString({ message: 'correctAnswer must be a string' })
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 1, description: 'Question order in quiz' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    description: 'Base64 encoded image for the question',
  })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({
    description: 'Original filename of the uploaded image',
  })
  @IsOptional()
  @IsString()
  imageOriginalName?: string;

  @ApiPropertyOptional({
    description: 'Alt text for the image',
  })
  @IsOptional()
  @IsString()
  imageAltText?: string;

  @ApiPropertyOptional({
    description: 'Sequence number for single image',
  })
  @IsOptional()
  @IsNumber()
  imageSequence?: number;

  @ApiPropertyOptional({
    description: 'Array of multiple images for the question',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  imagesBase64?: Array<{
    imageBase64: string;
    originalName?: string;
    altText?: string;
    sequence?: number;
  }>;
}

export class CreateScoringTemplateForQuizDto {
  @ApiProperty({ example: 0, description: 'Jumlah jawaban benar' })
  @IsNotEmpty()
  @IsNumber()
  correctAnswers: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Point per jawaban benar (default 1, score = correctAnswers × points)',
  })
  @IsOptional()
  @IsNumber()
  points?: number;
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'JavaScript Basics', description: 'Quiz title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Test your knowledge of JavaScript fundamentals',
    description: 'Quiz description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: 'jakarta_pusat',
    description: 'Location key from config items (location group)',
  })
  @IsOptional()
  @IsString()
  locationKey?: string;

  @ApiPropertyOptional({
    example: 'sm',
    description: 'Service key from config items (SM, AM, dll)',
  })
  @IsOptional()
  @IsString()
  serviceKey?: string;

  @ApiPropertyOptional({
    example: 70,
    description: 'Passing score percentage (default: 70)',
  })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Questions per page (default: 5)',
  })
  @IsOptional()
  @IsNumber()
  questionsPerPage?: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Quiz duration in minutes (null = no time limit)',
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the quiz is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Quiz start date and time',
  })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Quiz end date and time',
  })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional({
    example: 'https://quiz.gms.com/q/ABC123',
    description: 'Short URL for public sharing (legacy)',
  })
  @IsOptional()
  @IsString()
  quizLink?: string;

  @ApiPropertyOptional({
    example: 'https://quiz.gms.com/quiz/javascript-basics-ABC123',
    description: 'Normal URL for quiz access',
  })
  @IsOptional()
  @IsString()
  normalUrl?: string;

  @ApiPropertyOptional({
    example: 'https://tinyurl.com/quiz-js-basics',
    description: 'Short URL for easy sharing',
  })
  @IsOptional()
  @IsString()
  shortUrl?: string;

  @ApiPropertyOptional({
    description: 'Quiz scoring templates to create',
    type: [CreateScoringTemplateForQuizDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScoringTemplateForQuizDto)
  scoringTemplates?: CreateScoringTemplateForQuizDto[];

  @ApiPropertyOptional({
    description: 'Questions to create for this quiz',
    type: [CreateQuestionForQuizDto],
  })
  @IsOptional()
  @IsArray({ message: 'questions must be an array' })
  @ValidateNested({ each: true, message: 'Each question must be valid' })
  @Type(() => CreateQuestionForQuizDto)
  questions?: CreateQuestionForQuizDto[];
}

export class UpdateQuizDto {
  @ApiPropertyOptional({
    example: 'JavaScript Advanced',
    description: 'Quiz title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Advanced JavaScript concepts',
    description: 'Quiz description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'javascript-advanced',
    description: 'URL slug (auto-generated from title)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    example: 'jakarta_pusat',
    description: 'Location key from config items (location group)',
  })
  @IsOptional()
  @IsString()
  locationKey?: string;

  @ApiPropertyOptional({
    example: 'sm',
    description: 'Service key from config items (SM, AM, dll)',
  })
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

  @ApiPropertyOptional({
    example: 90,
    description: 'Quiz duration in minutes (null = no time limit)',
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the quiz is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Quiz start date and time',
  })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Quiz end date and time',
  })
  @IsOptional()
  @IsDateString()
  endDateTime?: string;

  @ApiPropertyOptional({
    example: 'https://quiz.gms.com/q/ABC123',
    description: 'Short URL for public sharing (legacy)',
  })
  @IsOptional()
  @IsString()
  quizLink?: string;

  @ApiPropertyOptional({
    example: 'https://quiz.gms.com/quiz/javascript-advanced-XYZ789',
    description: 'Normal URL for quiz access',
  })
  @IsOptional()
  @IsString()
  normalUrl?: string;

  @ApiPropertyOptional({
    example: 'https://tinyurl.com/quiz-js-advanced',
    description: 'Short URL for easy sharing',
  })
  @IsOptional()
  @IsString()
  shortUrl?: string;

  @ApiPropertyOptional({
    description:
      'Quiz scoring templates to update (will replace existing templates)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        minScore: { type: 'number' },
        maxScore: { type: 'number' },
        grade: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  @IsOptional()
  scoringTemplates?: Array<{
    id?: number;
    correctAnswers: number;
    points?: number;
  }>;

  @ApiPropertyOptional({
    description:
      'Quiz questions to update (will replace existing questions if quiz has no attempts)',
    type: 'array',
  })
  @IsOptional()
  questions?: Array<{
    id?: number; // Question ID for matching on update (if provided, updates existing; if not, creates new)
    questionText: string;
    questionType: string; // Supports: 'multiple-choice', 'multiple-select', 'text', 'true-false'
    imageUrl?: string;
    options: string[];
    correctAnswer?: string;
    points: number;
    order: number;
    isRequired: boolean;
    imageBase64?: string;
    imageOriginalName?: string;
    imageAltText?: string;
    imageSequence?: number;
    imageFileName?: string; // Reference to existing image
    imageMimeType?: string;
    imageFileSize?: number;
    imagesBase64?: Array<{
      imageBase64: string;
      originalName?: string;
      altText?: string;
      sequence?: number;
      fileName?: string; // Reference to existing image
      mimeType?: string;
      fileSize?: number;
    }>;
  }>;
}

export class QuizResponseDto {
  @ApiProperty({ example: 1, description: 'Quiz ID' })
  id: number;

  @ApiProperty({ example: 'JavaScript Basics', description: 'Quiz title' })
  title: string;

  @ApiProperty({
    example: 'Test your knowledge of JavaScript fundamentals',
    description: 'Quiz description',
  })
  description: string;

  @ApiProperty({ example: 'javascript-basics', description: 'URL slug' })
  slug: string;

  @ApiProperty({ example: 'ABC123DEF', description: 'Quiz token' })
  token: string;

  @ApiPropertyOptional({
    example: 'jakarta_pusat',
    description: 'Location key',
  })
  locationKey?: string;

  @ApiPropertyOptional({
    example: 'Jakarta Pusat',
    description: 'Location display name',
  })
  locationName?: string;

  @ApiPropertyOptional({
    example: { id: 1, key: 'jakarta_pusat', value: 'Jakarta Pusat' },
    description: 'Location details',
  })
  location?: any;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key' })
  serviceKey?: string;

  @ApiPropertyOptional({
    example: 'Service Management',
    description: 'Service display name',
  })
  serviceName?: string;

  @ApiPropertyOptional({
    example: { id: 1, key: 'sm', value: 'Service Management' },
    description: 'Service details',
  })
  service?: any;

  @ApiProperty({ example: 70, description: 'Passing score percentage' })
  passingScore: number;

  @ApiProperty({ example: 5, description: 'Questions per page' })
  questionsPerPage: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Quiz duration in minutes (null = no time limit)',
  })
  durationMinutes?: number;

  @ApiProperty({ example: true, description: 'Whether the quiz is active' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Quiz start date and time',
  })
  startDateTime: Date;

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Quiz end date and time',
  })
  endDateTime: Date;

  @ApiProperty({
    example: 'https://quiz.gms.com/q/ABC123',
    description: 'Short URL for public sharing (legacy)',
  })
  quizLink: string;

  @ApiPropertyOptional({
    example: 'https://quiz.gms.com/quiz/javascript-basics-ABC123',
    description: 'Normal URL for quiz access',
  })
  normalUrl?: string;

  @ApiPropertyOptional({
    example: 'https://tinyurl.com/quiz-js-basics',
    description: 'Short URL for easy sharing',
  })
  shortUrl?: string;

  @ApiProperty({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy: string;

  @ApiPropertyOptional({
    example: 'admin@gms.com',
    description: 'Last updater email',
  })
  updatedBy?: string;

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

  @ApiPropertyOptional({
    description: 'Quiz images',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        imageUrl: { type: 'string' },
        altText: { type: 'string' },
        order: { type: 'number' },
      },
    },
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
        description: { type: 'string' },
      },
    },
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
        correctAnswers: { type: 'array' },
      },
    },
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
        assignmentType: {
          type: 'string',
          description: 'Assignment type (auto/manual)',
        },
        isActive: { type: 'boolean' },
      },
    },
  })
  assignedUsers?: any[];
}

export class StartManualQuizDto {
  @ApiPropertyOptional({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Custom start date and time (default: now)',
  })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Override quiz duration in minutes',
  })
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;
}
