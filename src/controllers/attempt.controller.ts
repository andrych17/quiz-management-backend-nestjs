import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AttemptService } from '../services/attempt.service';
import { AttemptResponseDto } from '../dto/attempt.dto';

@ApiTags('attempts')
@Controller('api/attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Get()
  @ApiOperation({ summary: 'Get all attempts with pagination and filters (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'serviceKey', required: false, type: String })
  @ApiQuery({ name: 'locationKey', required: false, type: String })
  @ApiQuery({ name: 'quizId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('serviceKey') serviceKey?: string,
    @Query('locationKey') locationKey?: string,
    @Query('quizId') quizId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attemptService.findAllWithFilter(
      page,
      limit,
      search,
      serviceKey,
      locationKey,
      quizId,
      startDate,
      endDate,
    );
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'Get attempt with detailed answers for review (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt with answers retrieved successfully',
  })
  async viewAttempt(
    @Param('id', ParseIntPipe) id: number,
  ) {
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

  @Get('quiz/:quizId/export')
  @ApiOperation({ summary: 'Export quiz attempts to CSV (Admin only)' })
  @ApiParam({ name: 'quizId', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts exported successfully',
  })
  async exportAttempts(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.attemptService.exportAttempts(quizId);
  }
}
