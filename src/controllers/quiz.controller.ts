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
import { UrlShortenerService } from '../services/url-shortener.service';
import { CreateQuizDto, UpdateQuizDto, QuizResponseDto, ServiceType, StartManualQuizDto } from '../dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ApiResponse as StdApiResponse, ResponseFactory } from '../interfaces/api-response.interface';

@ApiTags('quizzes')
@Controller('api/quizzes')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly urlShortenerService: UrlShortenerService,
  ) {}

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
  async create(@Body() createQuizDto: CreateQuizDto): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.create(createQuizDto);
    return ResponseFactory.success(result, 'Quiz created successfully', undefined, HttpStatus.CREATED);
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
  ): Promise<StdApiResponse<any>> {
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
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.findOne(id);
    return ResponseFactory.success(result, 'Quiz retrieved successfully');
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
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.update(id, updateQuizDto);
    return ResponseFactory.success(result, 'Quiz updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz deleted successfully',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<any>> {
    await this.quizService.remove(id);
    return ResponseFactory.success(null, 'Quiz deleted successfully');
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz questions retrieved successfully',
  })
  async getQuestions(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getQuestions(id);
    return ResponseFactory.success(result, 'Quiz questions retrieved successfully');
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get all attempts for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts retrieved successfully',
  })
  async getAttempts(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getAttempts(id);
    return ResponseFactory.success(result, 'Quiz attempts retrieved successfully');
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz duplicated successfully',
    type: QuizResponseDto,
  })
  async duplicate(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.duplicate(id);
    return ResponseFactory.success(result, 'Quiz duplicated successfully', undefined, HttpStatus.CREATED);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz published successfully',
    type: QuizResponseDto,
  })
  async publish(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.publish(id);
    return ResponseFactory.success(result, 'Quiz published successfully');
  }

  @Put(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz unpublished successfully',
    type: QuizResponseDto,
  })
  async unpublish(@Param('id', ParseIntPipe) id: number): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.unpublish(id);
    return ResponseFactory.success(result, 'Quiz unpublished successfully');
  }

  @Post(':id/generate-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate and update quiz link using TinyURL' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'alias', required: false, type: String, description: 'Optional custom alias for the short URL' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz link generated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        token: { type: 'string' },
        originalUrl: { type: 'string' },
        shortUrl: { type: 'string' },
        alias: { type: 'string' },
      },
    },
  })
  async generateLink(
    @Param('id', ParseIntPipe) id: number,
    @Query('alias') alias?: string,
  ): Promise<StdApiResponse<{
    id: number;
    token: string;
    originalUrl: string;
    shortUrl: string;
    alias?: string;
  }>> {
    // Get quiz details
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Generate the original URL
    const originalUrl = this.urlShortenerService.generateQuizUrl(quiz.token);

    // Create short URL with optional alias
    const shortUrl = await this.urlShortenerService.shortenUrl(originalUrl, alias);

    // Update the quiz with the new link
    await this.quizService.update(id, { quizLink: shortUrl });

    const result = {
      id: quiz.id,
      token: quiz.token,
      originalUrl,
      shortUrl,
      alias: alias || undefined,
    };

    return ResponseFactory.success(result, 'Quiz link generated successfully');
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Start manual quiz',
    description: 'Start a manual quiz (only for quizType: MANUAL). Sets startDateTime and calculates endDateTime based on duration.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'Quiz ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Manual quiz started successfully',
    type: QuizResponseDto,
  })
  async startManualQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() startDto?: StartManualQuizDto
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.startManualQuiz(id, startDto);
    return ResponseFactory.success(result, 'Manual quiz started successfully');
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Upload image to quiz',
    description: 'Upload image to external file server and associate with quiz' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Quiz ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image uploaded and associated with quiz successfully',
    type: QuizResponseDto,
  })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() imageData: {
      imageUrl: string;
      altText?: string;
      order?: number;
    },
  ): Promise<StdApiResponse<QuizResponseDto>> {
    // Note: Frontend harus upload ke file server terlebih dahulu
    // Kemudian kirim imageUrl yang sudah jadi ke endpoint ini
    const result = await this.quizService.uploadQuizImage(id, imageData);
    return ResponseFactory.success(result, 'Image associated with quiz successfully', undefined, HttpStatus.CREATED);
  }

  @Get(':id/calculate-score')
  @ApiOperation({ 
    summary: 'Calculate quiz score',
    description: 'Calculate score and grade based on quiz scoring templates' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Quiz ID' })
  @ApiQuery({ name: 'correctAnswers', type: Number, description: 'Number of correct answers' })
  @ApiQuery({ name: 'totalQuestions', type: Number, description: 'Total number of questions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Score calculated successfully',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        grade: { type: 'string' },
        gradeDescription: { type: 'string' },
        passed: { type: 'boolean' },
        passingScore: { type: 'number' },
      },
    },
  })
  async calculateScore(
    @Param('id', ParseIntPipe) id: number,
    @Query('correctAnswers', ParseIntPipe) correctAnswers: number,
    @Query('totalQuestions', ParseIntPipe) totalQuestions: number,
  ): Promise<StdApiResponse<any>> {
    const result = await this.quizService.calculateScore(id, correctAnswers, totalQuestions);
    return ResponseFactory.success(result, 'Score calculated successfully');
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get quiz templates for copying',
    description: 'Get all published quizzes that can be used as templates (including questions, images, and scoring)' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title' })
  @ApiQuery({ name: 'serviceType', required: false, enum: ServiceType, description: 'Filter by service type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz templates retrieved successfully',
    type: [QuizResponseDto],
  })
  async getTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('serviceType') serviceType?: ServiceType,
  ): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getQuizTemplates(page, limit, search, serviceType);
    return result;
  }

  @Post(':id/copy-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Copy quiz template',
    description: 'Create new quiz by copying existing quiz template with all questions, images, and scoring templates' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Source quiz ID to copy from' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz template copied successfully',
    type: QuizResponseDto,
  })
  async copyTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() copyData: {
      title: string;
      description?: string;
      serviceType?: ServiceType;
      locationId?: number;
    },
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.copyQuizTemplate(id, copyData);
    return ResponseFactory.success(result, 'Quiz template copied successfully', undefined, HttpStatus.CREATED);
  }

  @Get(':id/template-preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Preview quiz template',
    description: 'Get complete quiz template data for preview before copying' 
  })
  @ApiParam({ name: 'id', type: Number, description: 'Quiz ID to preview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz template preview retrieved successfully',
    type: QuizResponseDto,
  })
  async getTemplatePreview(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getQuizTemplatePreview(id);
    return ResponseFactory.success(result, 'Quiz template preview retrieved successfully');
  }
}