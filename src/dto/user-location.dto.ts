import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateUserLocationDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 1, description: 'Location ID from config items (location group)' })
  @IsNotEmpty()
  @IsNumber()
  locationId: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the location assignment is active (default: true)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateUserLocationDto {
  @ApiPropertyOptional({ example: 2, description: 'Updated location ID' })
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the location assignment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class UserLocationResponseDto {
  @ApiProperty({ example: 1, description: 'User location ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'User ID' })
  userId: number;

  @ApiProperty({ example: 1, description: 'Location ID' })
  locationId: number;

  @ApiProperty({ example: true, description: 'Whether the location assignment is active' })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Creator email' })
  createdBy?: string;

  @ApiPropertyOptional({ example: 'admin@gms.com', description: 'Updater email' })
  updatedBy?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'User details',
    example: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    }
  })
  user?: any;

  @ApiPropertyOptional({ 
    description: 'Location details',
    example: {
      id: 1,
      key: 'jakarta_pusat',
      value: 'Jakarta Pusat',
      group: 'location'
    }
  })
  location?: any;
}