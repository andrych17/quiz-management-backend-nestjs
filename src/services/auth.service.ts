import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { LoginDto, RegisterDto, AuthResponseDto, ChangePasswordDto } from '../dto/auth.dto';
import { CreateUserDto, UserRole } from '../dto/user.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.userService.validatePassword(user, password);
    
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    const { password: userPassword, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await this.updateLastLogin(user.id);

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.parseExpirationTime(expiresIn),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    
    if (existingUser) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Create new user
    const createUserDto: CreateUserDto = {
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      role: UserRole.USER, // Default role
    };

    const newUser = await this.userService.create(createUserDto);

    // Generate JWT token
    const payload = { 
      sub: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.parseExpirationTime(expiresIn),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role 
      };

      const accessToken = this.jwtService.sign(newPayload);
      const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: this.parseExpirationTime(expiresIn),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<any> {
    const user = await this.userService.findByEmail(
      (await this.userService.findOne(userId)).email
    );
    
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword, 
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    await this.userService.update(userId, {
      password: changePasswordDto.newPassword,
    });

    return {
      message: SUCCESS_MESSAGES.UPDATED('Password'),
    };
  }

  async getProfile(userId: number): Promise<any> {
    const user = await this.userService.findOne(userId);
    
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  private async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.userService.update(userId, {
        lastLogin: new Date(),
      } as any);
    } catch (error) {
      // Log error but don't fail the login process
      console.error('Failed to update last login:', error);
    }
  }

  private parseExpirationTime(expiresIn: string): number {
    // Convert string like '24h', '7d', '30m' to seconds
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 24 * 60 * 60; // Default to 24 hours
    }
  }

  async logout(userId: number): Promise<any> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return {
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    };
  }
}