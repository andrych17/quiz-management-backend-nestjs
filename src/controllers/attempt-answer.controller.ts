import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AttemptAnswerService } from '../services/attempt-answer.service';
import { CreateAttemptAnswerDto, UpdateAttemptAnswerDto, AttemptAnswerResponseDto } from '../dto/attempt-answer.dto';

@ApiTags('Attempt Answers')
@Controller('api/attempt-answers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttemptAnswerController {
  constructor(private readonly attemptAnswerService: AttemptAnswerService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create attempt answer',
    description: 'Submit an answer for a specific question in an attempt.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Answer submitted successfully',
    type: AttemptAnswerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or answer already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attempt or question not found' })
  async create(@Body() createAttemptAnswerDto: CreateAttemptAnswerDto) {
    return await this.attemptAnswerService.create(createAttemptAnswerDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all attempt answers',
    description: 'Retrieve all attempt answers. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all attempt answers',
    type: [AttemptAnswerResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    return await this.attemptAnswerService.findAll();
  }

  @Get('attempt/:attemptId')
  @ApiOperation({ 
    summary: 'Get answers for specific attempt',
    description: 'Retrieve all answers submitted for a specific attempt.' 
  })
  @ApiParam({ name: 'attemptId', type: 'number', description: 'Attempt ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of answers for the attempt',
    type: [AttemptAnswerResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async findByAttemptId(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return await this.attemptAnswerService.findByAttemptId(attemptId);
  }

  @Get('question/:questionId')
  @ApiOperation({ 
    summary: 'Get answers for specific question',
    description: 'Retrieve all answers submitted for a specific question across all attempts.' 
  })
  @ApiParam({ name: 'questionId', type: 'number', description: 'Question ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of answers for the question',
    type: [AttemptAnswerResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findByQuestionId(@Param('questionId', ParseIntPipe) questionId: number) {
    return await this.attemptAnswerService.findByQuestionId(questionId);
  }

  @Get('question/:questionId/statistics')
  @ApiOperation({ 
    summary: 'Get answer statistics for question',
    description: 'Get statistical analysis of answers for a specific question.' 
  })
  @ApiParam({ name: 'questionId', type: 'number', description: 'Question ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Answer statistics',
    schema: {
      type: 'object',
      properties: {
        totalAnswers: { type: 'number', example: 100 },
        correctAnswers: { type: 'number', example: 75 },
        incorrectAnswers: { type: 'number', example: 25 },
        answerDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              answer: { type: 'string', example: 'A' },
              count: { type: 'number', example: 45 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getAnswerStatistics(@Param('questionId', ParseIntPipe) questionId: number) {
    return await this.attemptAnswerService.getAnswerStatistics(questionId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get attempt answer by ID',
    description: 'Retrieve a specific attempt answer by its ID.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Answer ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Answer details',
    type: AttemptAnswerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.attemptAnswerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update attempt answer',
    description: 'Update an existing attempt answer.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Answer ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Answer updated successfully',
    type: AttemptAnswerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttemptAnswerDto: UpdateAttemptAnswerDto,
  ) {
    return await this.attemptAnswerService.update(id, updateAttemptAnswerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete attempt answer',
    description: 'Delete a specific attempt answer.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Answer ID' })
  @ApiResponse({ status: 204, description: 'Answer deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.attemptAnswerService.remove(id);
  }

  @Get('attempt/:attemptId/correct-count')
  @ApiOperation({ 
    summary: 'Count correct answers for attempt',
    description: 'Get the number of correct answers for a specific attempt.' 
  })
  @ApiParam({ name: 'attemptId', type: 'number', description: 'Attempt ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Correct answer count',
    schema: {
      type: 'object',
      properties: {
        correctAnswers: { type: 'number', example: 8 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async countCorrectAnswers(@Param('attemptId', ParseIntPipe) attemptId: number) {
    const count = await this.attemptAnswerService.countCorrectAnswers(attemptId);
    return { correctAnswers: count };
  }
}