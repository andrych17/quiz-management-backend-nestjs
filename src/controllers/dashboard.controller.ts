import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { DashboardService } from '../services/dashboard.service';
import { DebugLogger } from '../lib/debug-logger';

@ApiTags('dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard statistics (Admin only)',
    description:
      'Get comprehensive dashboard statistics including active quizzes, admin users, today\'s activities, and participant counts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        activeQuizzes: {
          type: 'number',
          description: 'Count of active and published quizzes',
          example: 5,
        },
        adminUsers: {
          type: 'number',
          description: 'Count of admin and superadmin users',
          example: 3,
        },
        todayActiveQuizzes: {
          type: 'array',
          description: 'Quizzes with attempts started today',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'Math Quiz' },
              attemptCount: { type: 'number', example: 15 },
            },
          },
        },
        todayParticipants: {
          type: 'number',
          description: 'Count of unique participants today',
          example: 12,
        },
      },
    },
  })
  async getDashboardStats() {
    DebugLogger.endpoint('GET', '/api/dashboard/stats');
    return await this.dashboardService.getDashboardStats();
  }

  @Get('recent-activity')
  @ApiOperation({
    summary: 'Get recent activity (Admin only)',
    description: 'Get list of recent quiz attempts with participant and quiz details',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent activities to return (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent activity retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 123 },
          participantName: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          nij: { type: 'string', example: '12345' },
          quizId: { type: 'number', example: 1 },
          quizTitle: { type: 'string', example: 'Math Quiz' },
          score: { type: 'number', example: 85 },
          passed: { type: 'boolean', example: true },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  })
  async getRecentActivity(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    DebugLogger.endpoint('GET', '/api/dashboard/recent-activity', {}, { limit: limit || 50 });
    return await this.dashboardService.getRecentActivity(limit || 50);
  }
}
