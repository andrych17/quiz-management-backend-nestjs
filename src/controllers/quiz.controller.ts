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
import { QuizService } from '../services/quiz.service';
import { CreateQuizDto, UpdateQuizDto, QuizResponseDto } from '../dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('quizzes')
@Controller('api/quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz created successfully',
    type: QuizResponseDto,
  })
  async create(@Body() createQuizDto: CreateQuizDto): Promise<QuizResponseDto> {
    return this.quizService.create(createQuizDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quizzes retrieved successfully',
    type: [QuizResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.quizService.findAll(page, limit, search, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz retrieved successfully',
    type: QuizResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<QuizResponseDto> {
    return this.quizService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quiz by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz updated successfully',
    type: QuizResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<QuizResponseDto> {
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.remove(id);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz questions retrieved successfully',
  })
  async getQuestions(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.getQuestions(id);
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get all attempts for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts retrieved successfully',
  })
  async getAttempts(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.getAttempts(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz duplicated successfully',
    type: QuizResponseDto,
  })
  async duplicate(@Param('id', ParseIntPipe) id: number): Promise<QuizResponseDto> {
    return this.quizService.duplicate(id);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz published successfully',
    type: QuizResponseDto,
  })
  async publish(@Param('id', ParseIntPipe) id: number): Promise<QuizResponseDto> {
    return this.quizService.publish(id);
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz unpublished successfully',
    type: QuizResponseDto,
  })
  async unpublish(@Param('id', ParseIntPipe) id: number): Promise<QuizResponseDto> {
    return this.quizService.unpublish(id);
  }
}