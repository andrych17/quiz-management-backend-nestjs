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
import { QuestionService } from '../services/question.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionResponseDto,
  QuestionDetailResponseDto,
} from '../dto/question.dto';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('questions')
@Controller('api/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question with images' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question created successfully with images',
    type: QuestionDetailResponseDto,
  })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionDetailResponseDto> {
    return this.questionService.create(createQuestionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all questions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'quizId', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Questions retrieved successfully',
    type: [QuestionResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('quizId') quizId?: number,
  ) {
    return this.questionService.findAll(page, limit, quizId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get question by ID with images' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question retrieved successfully with images',
    type: QuestionDetailResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuestionDetailResponseDto> {
    return this.questionService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question by ID with images' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question updated successfully with images',
    type: QuestionDetailResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionDetailResponseDto> {
    return this.questionService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete question by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.remove(id);
  }

  @Put('quiz/:quizId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder questions in a quiz' })
  @ApiParam({ name: 'quizId', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Questions reordered successfully',
  })
  async reorderQuestions(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body('questionIds') questionIds: number[],
  ) {
    return this.questionService.reorderQuestions(quizId, questionIds);
  }

  @Delete(':questionId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete specific image from a question' })
  @ApiParam({ name: 'questionId', type: Number, description: 'Question ID' })
  @ApiParam({
    name: 'imageId',
    type: Number,
    description: 'Image ID to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image deleted successfully',
  })
  async deleteQuestionImage(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.questionService.deleteQuestionImage(questionId, imageId);
  }
}
