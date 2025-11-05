import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttemptService } from '../services/attempt.service';
import { CreateAttemptDto, UpdateAttemptDto, AttemptResponseDto } from '../dto/attempt.dto';

@ApiTags('attempts')
@Controller('api/attempts')
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quiz attempt' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attempt created successfully',
    type: AttemptResponseDto,
  })
  async create(@Body() createAttemptDto: CreateAttemptDto): Promise<AttemptResponseDto> {
    return this.attemptService.create(createAttemptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attempts with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'quizId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('email') email?: string,
    @Query('quizId') quizId?: number,
  ) {
    return this.attemptService.findAll(page, limit, email, quizId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attempt by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt retrieved successfully',
    type: AttemptResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AttemptResponseDto> {
    return this.attemptService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attempt by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt updated successfully',
    type: AttemptResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttemptDto: UpdateAttemptDto,
  ): Promise<AttemptResponseDto> {
    return this.attemptService.update(id, updateAttemptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attempt by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.attemptService.remove(id);
  }

  @Get(':id/answers')
  @ApiOperation({ summary: 'Get all answers for an attempt' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt answers retrieved successfully',
  })
  async getAnswers(@Param('id', ParseIntPipe) id: number) {
    return this.attemptService.getAnswers(id);
  }

  @Get('quiz/:quizId/export')
  @ApiOperation({ summary: 'Export quiz attempts to CSV' })
  @ApiParam({ name: 'quizId', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts exported successfully',
  })
  async exportAttempts(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.attemptService.exportAttempts(quizId);
  }
}