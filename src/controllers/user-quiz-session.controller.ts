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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserQuizSessionService } from '../services/user-quiz-session.service';
import { 
  StartQuizSessionDto, 
  UpdateSessionDto, 
  ResumeSessionDto, 
  SessionTimeUpdateDto,
  UserQuizSessionResponseDto 
} from '../dto/user-quiz-session.dto';

@ApiTags('Quiz Sessions')
@Controller('api/quiz-sessions')
export class UserQuizSessionController {
  constructor(private readonly sessionService: UserQuizSessionService) {}

  @Post('start')
  @ApiOperation({ 
    summary: 'Start a new quiz session',
    description: 'Start a new quiz session for a user. Creates a timed session if quiz has duration.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Quiz session started successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Quiz not available or user already has active session' })
  @ApiResponse({ status: 404, description: 'Quiz or user not found' })
  async startSession(@Body() startQuizSessionDto: StartQuizSessionDto) {
    return await this.sessionService.startSession(startQuizSessionDto);
  }

  @Post('resume')
  @ApiOperation({ 
    summary: 'Resume an existing quiz session',
    description: 'Resume a paused or active quiz session using session token and email.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Quiz session resumed successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Session expired or already completed' })
  @ApiResponse({ status: 404, description: 'Session not found or invalid credentials' })
  async resumeSession(@Body() resumeSessionDto: ResumeSessionDto) {
    return await this.sessionService.resumeSession(resumeSessionDto);
  }

  @Post(':sessionToken/pause')
  @ApiOperation({ 
    summary: 'Pause quiz session',
    description: 'Pause an active quiz session. User can resume later.' 
  })
  @ApiParam({ name: 'sessionToken', type: 'string', description: 'Session token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Quiz session paused successfully',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Can only pause active sessions or session expired' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async pauseSession(@Param('sessionToken') sessionToken: string) {
    return await this.sessionService.pauseSession(sessionToken);
  }

  @Post(':sessionToken/complete')
  @ApiOperation({ 
    summary: 'Complete quiz session',
    description: 'Mark quiz session as completed. Usually called when user finishes all questions.' 
  })
  @ApiParam({ name: 'sessionToken', type: 'string', description: 'Session token' })
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
    description: 'Update time spent and session metadata. Used for tracking user progress.' 
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
    summary: 'Get session by token',
    description: 'Retrieve session details using session token.' 
  })
  @ApiParam({ name: 'sessionToken', type: 'string', description: 'Session token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session details',
    type: UserQuizSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSessionByToken(@Param('sessionToken') sessionToken: string) {
    return await this.sessionService.findByToken(sessionToken);
  }

  @Get('user/:userId/quiz/:quizId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get session by user and quiz',
    description: 'Get the latest session for a specific user and quiz. Requires authentication.' 
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
    description: 'Get the latest session for a specific email and quiz.' 
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
    description: 'Get all currently active quiz sessions. Requires admin role.' 
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
    description: 'Get all sessions for a specific quiz. Requires admin role.' 
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
    description: 'Get statistical overview of sessions for a specific quiz. Requires admin role.' 
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

  @Post('cleanup-expired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Clean up expired sessions',
    description: 'Mark expired sessions as expired status. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Number of sessions cleaned up',
    schema: {
      type: 'object',
      properties: {
        cleanedUpCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupExpiredSessions() {
    const count = await this.sessionService.cleanupExpiredSessions();
    return { cleanedUpCount: count };
  }
}