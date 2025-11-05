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

  @ApiPropertyOptional({ example: 1, description: 'Location ID from config items (location group)' })
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @ApiPropertyOptional({ example: 70, description: 'Passing score percentage (default: 70)' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ example: 5, description: 'Questions per page (default: 5)' })
  @IsOptional()
  @IsNumber()
  questionsPerPage?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the quiz is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
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

  @ApiPropertyOptional({ example: 1, description: 'Location ID from config items (location group)' })
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @ApiPropertyOptional({ example: 70, description: 'Passing score percentage' })
  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @ApiPropertyOptional({ example: 5, description: 'Questions per page' })
  @IsOptional()
  @IsNumber()
  questionsPerPage?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the quiz is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the quiz is published' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
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

  @ApiPropertyOptional({ example: 1, description: 'Location ID' })
  locationId?: number;

  @ApiPropertyOptional({ 
    example: { id: 1, key: 'jakarta_pusat', value: 'Jakarta Pusat' }, 
    description: 'Location details' 
  })
  location?: any;

  @ApiProperty({ example: 70, description: 'Passing score percentage' })
  passingScore: number;

  @ApiProperty({ example: 5, description: 'Questions per page' })
  questionsPerPage: number;

  @ApiProperty({ example: true, description: 'Whether the quiz is active' })
  isActive: boolean;

  @ApiProperty({ example: true, description: 'Whether the quiz is published' })
  isPublished: boolean;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', description: 'Quiz expiration date' })
  expiresAt: Date;

  @ApiProperty({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}