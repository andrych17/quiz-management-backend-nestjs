import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConfigItemDto {
  @ApiProperty({ example: 'LOCATION', description: 'Configuration group' })
  @IsNotEmpty()
  @IsString()
  group: string;

  @ApiProperty({ example: 'Jakarta', description: 'Configuration key' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ example: 'Jakarta Office', description: 'Configuration value' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'Main office location', description: 'Configuration description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateConfigItemDto {
  @ApiPropertyOptional({ example: 'LOCATION', description: 'Configuration group' })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ example: 'Bandung', description: 'Configuration key' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ example: 'Bandung Office', description: 'Configuration value' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ example: 'Branch office location', description: 'Configuration description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfigItemResponseDto {
  @ApiProperty({ example: 1, description: 'Config item ID' })
  id: number;

  @ApiProperty({ example: 'LOCATION', description: 'Configuration group' })
  group: string;

  @ApiProperty({ example: 'Jakarta', description: 'Configuration key' })
  key: string;

  @ApiProperty({ example: 'Jakarta Office', description: 'Configuration value' })
  value: string;

  @ApiProperty({ example: 'Main office location', description: 'Configuration description' })
  description: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}