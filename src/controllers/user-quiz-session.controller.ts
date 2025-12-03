import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserQuizSessionService } from '../services/user-quiz-session.service';
import {
  StartQuizSessionDto,
  UpdateSessionDto,
  ResumeSessionDto,
  SessionTimeUpdateDto,
  StartSessionByQuizTokenDto,
  UserQuizSessionResponseDto,
} from '../dto/user-quiz-session.dto';

@ApiTags('Quiz Sessions')
@Controller('api/quiz-sessions')
export class UserQuizSessionController {
  constructor(private readonly sessionService: UserQuizSessionService) {}

  /**
   * Extract actual quiz token from slug-token format
   * Handles both formats: "ABC123DEF456" or "test-ABC123DEF456"
   */
  private extractToken(input: string): string {
    // If input contains a hyphen, assume it's slug-token format
    if (input.includes('-')) {
      const parts = input.split('-');
      // Return the last part as the token
      return parts[parts.length - 1];
    }
    // Otherwise, assume it's already a plain token
    return input;
  }

  @Post('start')
  @ApiOperation({
    summary: 'Start a new quiz session',
    description:
      'Start a new quiz session for a user. Creates a timed session if quiz has duration.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz session started successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Quiz not available or user already has active session',
  })
  @ApiResponse({ status: 404, description: 'Quiz or user not found' })
  async startSession(@Body() startQuizSessionDto: StartQuizSessionDto) {
    return await this.sessionService.startSession(startQuizSessionDto);
  }

  @Post('start-by-token')
  @ApiOperation({
    summary: 'Start or get session by quiz token',
    description:
      'Start a new quiz session or get existing active session using quiz token from URL. Returns session with session token for tracking.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz session started or retrieved successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Quiz not available or has ended' })
  @ApiResponse({ status: 404, description: 'Quiz with token not found' })
  async startSessionByToken(
    @Body() startSessionDto: StartSessionByQuizTokenDto,
  ) {
    return await this.sessionService.startSessionByQuizToken(startSessionDto);
  }

  @Post('resume')
  @ApiOperation({
    summary: 'Resume an existing quiz session',
    description:
      'Resume a paused or active quiz session using session token and email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz session resumed successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Session expired or already completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or invalid credentials',
  })
  async resumeSession(@Body() resumeSessionDto: ResumeSessionDto) {
    return await this.sessionService.resumeSession(resumeSessionDto);
  }

  @Post(':sessionToken/pause')
  @ApiOperation({
    summary: 'Pause quiz session',
    description: 'Pause an active quiz session. User can resume later.',
  })
  @ApiParam({
    name: 'sessionToken',
    type: 'string',
    description: 'Session token',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz session paused successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only pause active sessions or session expired',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async pauseSession(@Param('sessionToken') sessionToken: string) {
    return await this.sessionService.pauseSession(sessionToken);
  }

  @Post(':sessionToken/complete')
  @ApiOperation({
    summary: 'Complete quiz session',
    description:
      'Mark quiz session as completed. Usually called when user finishes all questions.',
  })
  @ApiParam({
    name: 'sessionToken',
    type: 'string',
    description: 'Session token',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz session completed successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async completeSession(@Param('sessionToken') sessionToken: string) {
    return await this.sessionService.completeSession(sessionToken);
  }

  @Post('update-time')
  @ApiOperation({
    summary: 'Update session time and progress',
    description:
      'Update time spent and session metadata. Used for tracking user progress.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session time updated successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Session not active' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateSessionTime(@Body() sessionTimeUpdateDto: SessionTimeUpdateDto) {
    return await this.sessionService.updateSessionTime(sessionTimeUpdateDto);
  }

  @Get('token/:sessionToken')
  @ApiOperation({
    summary:
      'Get or create session by token (auto-detects quiz vs session token)',
    description:
      'Smart endpoint that accepts EITHER quiz token OR session token. If quiz token is provided, will create/return active session automatically.',
  })
  @ApiParam({
    name: 'sessionToken',
    type: 'string',
    description:
      'Quiz token (12 chars uppercase) OR session token (sess_xxxxx)',
    examples: {
      quizToken: { value: 'CC6B4422DF66', description: 'Quiz token from URL' },
      sessionToken: {
        value: 'sess_abc123def456',
        description: 'Existing session token',
      },
    },
  })
  @ApiQuery({
    name: 'userEmail',
    required: false,
    type: 'string',
    description:
      'User email (required only when using quiz token for first time)',
    example: 'user@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Session details (created or existing)',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
  })
  async getSessionByToken(
    @Param('sessionToken') token: string,
    @Query('userEmail') userEmail?: string,
  ) {
    // Handle both formats: plain token (ABC123) or slug-token (test-ABC123)
    const actualToken = this.extractToken(token);
    return await this.sessionService.findOrCreateByToken(actualToken, userEmail);
  }

  @Get('user/:userId/quiz/:quizId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get session by user and quiz',
    description:
      'Get the latest session for a specific user and quiz. Requires authentication.',
  })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Session details (null if not found)',
    type: UserQuizSessionResponseDto,
  })
  async getSessionByUserAndQuiz(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return await this.sessionService.findByUserAndQuiz(userId, quizId);
  }

  @Get('email/:userEmail/quiz/:quizId')
  @ApiOperation({
    summary: 'Get session by email and quiz',
    description: 'Get the latest session for a specific email and quiz.',
  })
  @ApiParam({ name: 'userEmail', type: 'string', description: 'User email' })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Session details (null if not found)',
    type: UserQuizSessionResponseDto,
  })
  async getSessionByEmailAndQuiz(
    @Param('userEmail') userEmail: string,
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return await this.sessionService.findByEmailAndQuiz(userEmail, quizId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all active sessions',
    description: 'Get all currently active quiz sessions. Requires admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [UserQuizSessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveSessions() {
    return await this.sessionService.getActiveSessions();
  }

  @Get('quiz/:quizId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sessions for specific quiz',
    description: 'Get all sessions for a specific quiz. Requires admin role.',
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'List of sessions for the quiz',
    type: [UserQuizSessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessionsByQuiz(@Param('quizId', ParseIntPipe) quizId: number) {
    return await this.sessionService.getSessionsByQuiz(quizId);
  }

  @Get('quiz/:quizId/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get session statistics for quiz',
    description:
      'Get statistical overview of sessions for a specific quiz. Requires admin role.',
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Session statistics',
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number', example: 50 },
        activeSessions: { type: 'number', example: 5 },
        completedSessions: { type: 'number', example: 40 },
        expiredSessions: { type: 'number', example: 5 },
        averageTimeSpent: { type: 'number', example: 1800 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessionStatistics(@Param('quizId', ParseIntPipe) quizId: number) {
    return await this.sessionService.getSessionStatistics(quizId);
  }


}
