import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'user',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'User role',
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'jakarta_pusat',
    description: 'Location key from config items',
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
    example: true,
    description: 'User active status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Service details (will be ignored during creation, use serviceKey instead)',
  })
  @IsOptional()
  service?: any;

  @ApiPropertyOptional({
    description:
      'Location details (will be ignored during creation, use locationKey instead)',
  })
  @IsOptional()
  location?: any;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Full name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'jane@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'newpassword123',
    description: 'New password (min 6 characters)',
  })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'User role',
    enum: UserRole,
    enumName: 'UserRole',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'jakarta_pusat',
    description: 'Location key from config items',
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

  @ApiPropertyOptional({ example: true, description: 'User active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'admin', description: 'User role' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key' })
  serviceKey?: string;

  @ApiPropertyOptional({
    example: 'Service Management',
    description: 'Service display name',
  })
  serviceName?: string;

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
    example: { id: 1, key: 'sm', value: 'Service Management' },
    description: 'Service details',
  })
  service?: any;

  @ApiPropertyOptional({
    example: { id: 1, key: 'jakarta_pusat', value: 'Jakarta Pusat' },
    description: 'Location details',
  })
  location?: any;

  @ApiProperty({ example: true, description: 'User active status' })
  isActive: boolean;

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

export class UserDetailResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'admin', description: 'User role' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'sm', description: 'Service key' })
  serviceKey?: string;

  @ApiPropertyOptional({
    example: 'Service Management',
    description: 'Service display name',
  })
  serviceName?: string;

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
    example: { id: 1, key: 'sm', value: 'Service Management' },
    description: 'Service details',
  })
  service?: any;

  @ApiPropertyOptional({
    example: { id: 1, key: 'jakarta_pusat', value: 'Jakarta Pusat' },
    description: 'Location details',
  })
  location?: any;

  @ApiProperty({ example: true, description: 'User active status' })
  isActive: boolean;

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
    type: 'array',
    description:
      'Assigned quizzes (auto-assigned based on service and location)',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        description: { type: 'string' },
        serviceType: { type: 'string' },
        quizType: { type: 'string' },
        isActive: { type: 'boolean' },
        startDateTime: { type: 'string', format: 'date-time' },
        endDateTime: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        assignmentType: {
          type: 'string',
          description: 'Assignment type (auto/manual)',
        },
      },
    },
  })
  assignedQuizzes?: any[];
}
