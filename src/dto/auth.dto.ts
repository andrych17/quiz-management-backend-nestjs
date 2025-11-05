import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'john@example.com', 
    description: 'User email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'User password' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ 
    example: 'John Doe', 
    description: 'Full name of the user' 
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'john@example.com', 
    description: 'Email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'Password (min 6 characters)' 
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT access token' 
  })
  access_token: string;

  @ApiProperty({ 
    example: 'Bearer', 
    description: 'Token type' 
  })
  token_type: string;

  @ApiProperty({ 
    example: 86400, 
    description: 'Token expiration time in seconds' 
  })
  expires_in: number;

  @ApiProperty({ 
    description: 'User information',
    type: Object
  })
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export class RefreshTokenDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'Refresh token' 
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'oldpassword123', 
    description: 'Current password' 
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    example: 'newpassword123', 
    description: 'New password (min 6 characters)' 
  })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}