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
  Req,
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
import {
  CreateQuizDto,
  UpdateQuizDto,
  QuizResponseDto,
  QuizDetailResponseDto,
} from '../dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';

@ApiTags('quizzes')
@Controller('api/quizzes')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly urlShortenerService: UrlShortenerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat quiz baru' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quiz berhasil dibuat',
    type: QuizDetailResponseDto,
  })
  async create(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: any,
  ): Promise<StdApiResponse<any>> {
    const userInfo = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
    };
    const result = await this.quizService.create(createQuizDto, userInfo);

    return {
      success: result.success,
      message: result.message,
      data: result.success ? result.data : null,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.OK,
    };
  }

  // Template endpoints - must be before :id routes to avoid routing conflicts
  @Get('quiz-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dapatkan daftar template quiz',
    description:
      'Menampilkan semua quiz yang sudah dipublish dan bisa digunakan sebagai template (termasuk questions, images, dan scoring)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Halaman',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah item per halaman',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Cari berdasarkan judul',
  })
  @ApiQuery({
    name: 'serviceKey',
    required: false,
    type: String,
    description: 'Filter berdasarkan service key',
  })
  @ApiQuery({
    name: 'locationKey',
    required: false,
    type: String,
    description: 'Filter berdasarkan location key',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template quiz berhasil diambil',
    type: [QuizResponseDto],
  })
  @Get('mapping-guide')
  @ApiOperation({
    summary: 'Get comprehensive guide for quiz filtering and mappings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Complete filtering and mapping guide retrieved successfully',
  })
  async getMappingGuide() {
    return ResponseFactory.success(
      {
        guide: 'Panduan Lengkap untuk Filtering dan Mapping Quiz',
        endpoints: {
          'GET /api/quizzes':
            'Mengembalikan data quiz dengan serviceKey dan locationKey',
          'GET /api/quizzes/quiz-templates':
            'Mengembalikan daftar template quiz yang bisa dicopy',
          'POST /api/quizzes/copy-template/:id':
            'Copy template quiz menjadi quiz baru',
          'GET /api/config/ui-mappings':
            'Mengembalikan mapping objects untuk manual mapping',
        },
        filteringRules: {
          superadmin:
            'Melihat semua quiz, bisa filter berdasarkan serviceKey/locationKey apapun',
          admin:
            'Hanya melihat quiz yang di-assign melalui tabel UserQuizAssignment',
          user: 'Hanya melihat quiz yang published + difilter otomatis berdasarkan serviceKey/locationKey user sendiri dari tabel User',
        },
        filterValues: {
          all_services:
            'Menampilkan semua service (mengabaikan filter service)',
          all_locations: 'Menampilkan semua lokasi (mengabaikan filter lokasi)',
          specific_key:
            'Filter berdasarkan serviceKey atau locationKey yang spesifik',
          empty_or_null: 'Tidak ada filtering yang diterapkan',
        },
        userBasedFiltering: {
          description:
            'User regular otomatis melihat quiz yang sesuai dengan serviceKey dan locationKey mereka dari tabel User',
          example:
            'User dengan serviceKey="sm" dan locationKey="jakarta_pusat" hanya melihat quiz SM di Jakarta Pusat',
        },
        displayMappings: {
          serviceKey: 'network_operation',
          serviceName: 'Network Operation',
          locationKey: 'jakarta_utara',
          locationName: 'Jakarta Utara',
        },
        currentData: {
          availableServiceKeys: ['sm', 'network_operation'],
          availableLocationKeys: ['jakarta_pusat', 'jakarta_utara'],
          specialFilterValues: ['all_services', 'all_locations'],
        },
        notes: {
          editRestriction:
            '⚠️ PENTING: Quiz yang sudah dikerjakan (memiliki attempts) TIDAK DAPAT diedit questionnya untuk menjaga integritas data dan fairness hasil quiz',
        },
      },
      'Panduan filtering dan mapping berhasil diambil',
    );
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz questions retrieved successfully',
  })
  async getQuestions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getQuestions(id);
    return ResponseFactory.success(
      result,
      'Quiz questions retrieved successfully',
    );
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get all attempts for a quiz' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz attempts retrieved successfully',
  })
  async getAttempts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<any>> {
    const result = await this.quizService.getAttempts(id);
    return ResponseFactory.success(
      result,
      'Quiz attempts retrieved successfully',
    );
  }

  @Post(':id/generate-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate and update quiz link using TinyURL' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'alias',
    required: false,
    type: String,
    description: 'Optional custom alias for the short URL',
  })
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
    @Req() req: any,
    @Query('alias') alias?: string,
  ): Promise<
    StdApiResponse<{
      normalUrl: string;
      shortUrl: string;
    }>
  > {
    const userInfo = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
    };
    // Generate URLs and publish quiz, pass alias if provided
    const urls = await this.quizService.generateLink(id, alias, userInfo);

    const result = {
      normalUrl: urls.normalUrl,
      shortUrl: urls.shortUrl,
      alias: alias || undefined,
    };

    return ResponseFactory.success(result, 'Quiz link generated successfully');
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publish quiz',
    description:
      'Publish quiz dan generate URL jika belum ada. Quiz yang dipublish bisa diakses secara publik. Quiz harus memiliki minimal 1 soal dan 1 template penilaian.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz published successfully',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Quiz tidak dapat dipublish karena belum memiliki soal atau template penilaian',
  })
  async publish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.publish(id);
    return ResponseFactory.success(result, 'Quiz published successfully');
  }

  @Put(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unpublish quiz',
    description: 'Unpublish quiz sehingga tidak bisa diakses secara publik.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz unpublished successfully',
    type: QuizResponseDto,
  })
  async unpublish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.unpublish(id);
    return ResponseFactory.success(result, 'Quiz unpublished successfully');
  }

  @Get(':id/calculate-score')
  @ApiOperation({
    summary: 'Calculate quiz score',
    description: 'Calculate score and grade based on quiz scoring templates',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Quiz ID' })
  @ApiQuery({
    name: 'correctAnswers',
    type: Number,
    description: 'Number of correct answers',
  })
  @ApiQuery({
    name: 'totalQuestions',
    type: Number,
    description: 'Total number of questions',
  })
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
    const result = await this.quizService.calculateScore(
      id,
      correctAnswers,
      totalQuestions,
    );
    return ResponseFactory.success(result, 'Skor berhasil dihitung');
  }

  @Get('public/:token')
  @ApiOperation({
    summary: 'Akses quiz secara publik menggunakan token (tanpa autentikasi)',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Token quiz untuk akses publik',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data quiz publik berhasil diambil',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Quiz tidak ditemukan atau belum dipublish',
  })
  async getPublicQuiz(
    @Param('token') token: string,
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const result = await this.quizService.findByTokenPublic(token);
    return ResponseFactory.success(result, 'Data quiz berhasil diambil');
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get quiz by ID with complete details (questions, scoring, assigned users)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz retrieved successfully with complete details',
    type: QuizDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Quiz not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<QuizDetailResponseDto>> {
    const result = await this.quizService.findOne(id);
    return ResponseFactory.success(
      result,
      'Quiz retrieved successfully with complete details',
    );
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
    @Req() req: any,
  ): Promise<StdApiResponse<QuizResponseDto>> {
    const userInfo = {
      id: req.user?.id,
      email: req.user?.email,
      name: req.user?.name,
      role: req.user?.role,
    };
    const result = await this.quizService.update(id, updateQuizDto, userInfo);
    return ResponseFactory.success(result, 'Quiz updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quiz deleted successfully',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StdApiResponse<any>> {
    await this.quizService.remove(id);
    return ResponseFactory.success(null, 'Quiz deleted successfully');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'user')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Dapatkan semua quiz dengan pagination (difilter berdasarkan role user)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Halaman',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah item per halaman',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Cari berdasarkan judul atau deskripsi',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter quiz aktif/non-aktif',
  })
  @ApiQuery({
    name: 'serviceKey',
    required: false,
    type: String,
    description: 'Filter berdasarkan service key (misal: sm, am, tech_support)',
  })
  @ApiQuery({
    name: 'locationKey',
    required: false,
    type: String,
    description:
      'Filter berdasarkan location key (misal: jakarta_pusat, jakarta_utara)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Urutkan berdasarkan field (title, startDateTime, endDateTime, createdAt, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Urutan sorting (ASC/DESC)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data quiz berhasil diambil',
    type: [QuizResponseDto],
  })
  async findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('serviceKey') serviceKey?: string,
    @Query('locationKey') locationKey?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const user = req.user;
    return this.quizService.findAllForUserWithDisplayNames(
      user.id,
      user.role,
      page,
      limit,
      search,
      isActive,
      serviceKey,
      locationKey,
      sortBy,
      sortOrder,
    );
  }
}
