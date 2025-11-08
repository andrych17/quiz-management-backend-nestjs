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
import { QuizScoringService } from '../services/quiz-scoring.service';
import { CreateQuizScoringDto, UpdateQuizScoringDto, QuizScoringResponseDto, CalculateScoreDto } from '../dto/quiz-scoring.dto';

@ApiTags('Quiz Scoring')
@Controller('api/quiz-scoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuizScoringController {
  constructor(private readonly quizScoringService: QuizScoringService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create quiz scoring template',
    description: 'Create a new scoring template for a quiz. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Scoring template created successfully',
    type: QuizScoringResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or duplicate scoring name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async create(@Body() createQuizScoringDto: CreateQuizScoringDto) {
    return await this.quizScoringService.create(createQuizScoringDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all quiz scoring templates',
    description: 'Retrieve all scoring templates across all quizzes. Requires admin role.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all scoring templates',
    type: [QuizScoringResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    return await this.quizScoringService.findAll();
  }

  @Get('quiz/:quizId')
  @ApiOperation({ 
    summary: 'Get scoring templates for specific quiz',
    description: 'Retrieve all scoring templates for a specific quiz.' 
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of scoring templates for the quiz',
    type: [QuizScoringResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findByQuizId(@Param('quizId', ParseIntPipe) quizId: number) {
    return await this.quizScoringService.findByQuizId(quizId);
  }

  @Get('quiz/:quizId/active')
  @ApiOperation({ 
    summary: 'Get active scoring template for quiz',
    description: 'Retrieve the currently active scoring template for a quiz.' 
  })
  @ApiParam({ name: 'quizId', type: 'number', description: 'Quiz ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active scoring template for the quiz',
    type: QuizScoringResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz or active scoring template not found' })
  async getActiveScoring(@Param('quizId', ParseIntPipe) quizId: number) {
    const activeScoring = await this.quizScoringService.getActiveScoring(quizId);
    if (!activeScoring) {
      return null;
    }
    return activeScoring;
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get quiz scoring template by ID',
    description: 'Retrieve a specific scoring template by its ID.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Scoring template ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Scoring template details',
    type: QuizScoringResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scoring template not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.quizScoringService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update quiz scoring template',
    description: 'Update an existing scoring template. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Scoring template ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Scoring template updated successfully',
    type: QuizScoringResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or duplicate scoring name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scoring template not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuizScoringDto: UpdateQuizScoringDto,
  ) {
    return await this.quizScoringService.update(id, updateQuizScoringDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete quiz scoring template',
    description: 'Delete a scoring template. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Scoring template ID' })
  @ApiResponse({ status: 204, description: 'Scoring template deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scoring template not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.quizScoringService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ 
    summary: 'Set scoring template as active',
    description: 'Set a scoring template as the active one for its quiz. Deactivates other templates. Requires admin role.' 
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Scoring template ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Scoring template activated successfully',
    type: QuizScoringResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scoring template not found' })
  async setActiveScoring(@Param('id', ParseIntPipe) id: number) {
    // First get the scoring template to get quiz ID
    const scoring = await this.quizScoringService.findOne(id);
    return await this.quizScoringService.setActiveScoring(scoring.quizId, id);
  }

  @Post('calculate')
  @ApiOperation({ 
    summary: 'Calculate score using scoring template',
    description: 'Calculate the final score for an attempt using a specific scoring template.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Score calculated successfully',
    schema: {
      type: 'object',
      properties: {
        totalScore: { type: 'number', example: 85.5 },
        maxPossibleScore: { type: 'number', example: 100 },
        percentage: { type: 'number', example: 85.5 },
        breakdown: {
          type: 'object',
          properties: {
            correctAnswers: { type: 'number', example: 8 },
            incorrectAnswers: { type: 'number', example: 2 },
            unansweredQuestions: { type: 'number', example: 0 },
            correctPoints: { type: 'number', example: 80 },
            incorrectPenalty: { type: 'number', example: 0 },
            unansweredPenalty: { type: 'number', example: 0 },
            bonusPoints: { type: 'number', example: 5 },
            timeBonus: { type: 'number', example: 0.5 },
            finalScore: { type: 'number', example: 85.5 },
          },
        },
        passed: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attempt or scoring template not found' })
  async calculateScore(@Body() calculateScoreDto: CalculateScoreDto) {
    return await this.quizScoringService.calculateScore(calculateScoreDto);
  }
}