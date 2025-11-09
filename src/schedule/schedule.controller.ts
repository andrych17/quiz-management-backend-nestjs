import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionCleanupService } from './session-cleanup.service';
import { Roles } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly sessionCleanupService: SessionCleanupService) {}

  @Post('cleanup/manual')
  @Roles('admin')
  async manualCleanup() {
    try {
      const result = await this.sessionCleanupService.manualCleanup();
      return {
        success: true,
        message: 'Manual session cleanup completed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Manual session cleanup failed',
        error: error.message,
      };
    }
  }

  @Post('cleanup/emergency')
  @Roles('admin')
  async emergencyCleanup() {
    try {
      const result = await this.sessionCleanupService.emergencyCleanup();
      return {
        success: true,
        message: 'Emergency session cleanup completed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Emergency session cleanup failed',
        error: error.message,
      };
    }
  }

  @Get('status')
  @Roles('admin')
  getSchedulerStatus() {
    try {
      const status = this.sessionCleanupService.getSchedulerStatus();
      return {
        success: true,
        message: 'Scheduler status retrieved successfully',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get scheduler status',
        error: error.message,
      };
    }
  }

  @Get('stats')
  @Roles('admin')
  async getCleanupStats() {
    try {
      const stats = await this.sessionCleanupService.getCleanupStats();
      return {
        success: true,
        message: 'Cleanup statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cleanup statistics',
        error: error.message,
      };
    }
  }
}