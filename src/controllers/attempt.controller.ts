import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AttemptService } from '../services/attempt.service';
import { AttemptResponseDto } from '../dto/attempt.dto';
import { DebugLogger } from '../lib/debug-logger';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

@ApiTags('attempts')
@Controller('api/attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin', 'admin')
@ApiBearerAuth()
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all attempts with pagination and filters (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by participant name, email, or NIJ',
  })
  @ApiQuery({ name: 'serviceKey', required: false, type: String })
  @ApiQuery({ name: 'locationKey', required: false, type: String })
  @ApiQuery({ name: 'quizId', required: false, type: Number })
  @ApiQuery({
    name: 'quizName',
    required: false,
    type: String,
    description: 'Filter by quiz title/name',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'submissionStatus',
    required: false,
    type: String,
    description: 'Filter by submission status: submitted, not_submitted, all',
  })
  @ApiQuery({
    name: 'passStatus',
    required: false,
    type: String,
    description: 'Filter by pass status: passed, failed, all',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 25,
    @Query('search') search?: string,
    @Query('serviceKey') serviceKey?: string,
    @Query('locationKey') locationKey?: string,
    @Query('quizId') quizId?: number,
    @Query('quizName') quizName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('submissionStatus') submissionStatus?: string,
    @Query('passStatus') passStatus?: string,
  ) {
    DebugLogger.endpoint(
      'GET',
      '/api/attempts',
      {},
      {
        page,
        limit,
        search,
        serviceKey,
        locationKey,
        quizId,
        quizName,
        startDate,
        endDate,
        submissionStatus,
        passStatus,
      },
    );
    return this.attemptService.findAllWithFilter(
      page,
      limit,
      search,
      serviceKey,
      locationKey,
      quizId,
      quizName,
      startDate,
      endDate,
      submissionStatus,
      passStatus,
      user.id,
      user.role,
    );
  }

  @Get(':id/view')
  @ApiOperation({
    summary: 'Get attempt with detailed answers for review (Admin only)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt with answers retrieved successfully',
  })
  async viewAttempt(@Param('id', ParseIntPipe) id: number) {
    return this.attemptService.getAttemptWithAnswers(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attempt by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.attemptService.remove(id);
  }

  @Get('export-excel')
  @ApiOperation({ summary: 'Export quiz attempts to Excel (Admin only)' })
  @ApiQuery({
    name: 'quizId',
    required: false,
    type: Number,
    description: 'Filter by quiz ID',
  })
  @ApiQuery({
    name: 'serviceKey',
    required: false,
    type: String,
    description: 'Filter by service',
  })
  @ApiQuery({
    name: 'locationKey',
    required: false,
    type: String,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'submissionStatus',
    required: false,
    type: String,
    description: 'Filter by submission status: submitted, not_submitted, all',
  })
  @ApiQuery({
    name: 'passStatus',
    required: false,
    type: String,
    description: 'Filter by pass status: passed, failed, all',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts exported to Excel successfully',
  })
  async exportAttemptsToExcel(
    @CurrentUser() user: CurrentUserData,
    @Query('quizId', new ParseIntPipe({ optional: true })) quizId?: number,
    @Query('serviceKey') serviceKey?: string,
    @Query('locationKey') locationKey?: string,
    @Query('submissionStatus') submissionStatus?: string,
    @Query('passStatus') passStatus?: string,
    @Res() res?: Response,
  ) {
    DebugLogger.endpoint(
      'GET',
      '/api/attempts/export-excel',
      {},
      {
        quizId,
        serviceKey,
        locationKey,
        submissionStatus,
        passStatus,
      },
    );

    const buffer = await this.attemptService.exportAttemptsToExcel(
      quizId,
      serviceKey,
      locationKey,
      submissionStatus,
      passStatus,
      user.id,
      user.role,
    );

    const filename = `quiz-attempts-${new Date().toISOString().split('T')[0]}.xlsx`;
    DebugLogger.debug('AttemptController', `Sending Excel file: ${filename}`, {
      bufferSize: buffer.byteLength,
    });

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.byteLength,
    });

    res.send(buffer);
  }
}
