import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  RefreshTokenDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from '../dto/auth.dto';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

@ApiTags('authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<StdApiResponse<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    return ResponseFactory.success(result, 'Login successful');
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already exists or validation error',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<StdApiResponse<AuthResponseDto>> {
    const result = await this.authService.register(registerDto);
    return ResponseFactory.success(
      result,
      'Registration successful',
      undefined,
      HttpStatus.CREATED,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<StdApiResponse<AuthResponseDto>> {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refresh_token,
    );
    return ResponseFactory.success(result, 'Token refreshed successfully');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<StdApiResponse<any>> {
    const result = await this.authService.getProfile(user.id);
    return ResponseFactory.success(result, 'Profile retrieved successfully');
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<StdApiResponse<any>> {
    const result = await this.authService.updateProfile(
      user.id,
      updateProfileDto,
    );
    return ResponseFactory.success(result, 'Profile updated successfully');
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<StdApiResponse<any>> {
    const result = await this.authService.changePassword(
      user.id,
      changePasswordDto,
    );
    return ResponseFactory.success(result, 'Password changed successfully');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  async logout(@CurrentUser() user: CurrentUserData): Promise<StdApiResponse<any>> {
    const result = await this.authService.logout(user.id);
    return ResponseFactory.success(result, 'Logout successful');
  }
}
