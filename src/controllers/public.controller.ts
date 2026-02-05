import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { QuizService } from '../services/quiz.service';
import { AttemptService } from '../services/attempt.service';
import { ConfigService } from '../services/config.service';
import { CreateAttemptDto } from '../dto/attempt.dto';
import { QuizResponseDto } from '../dto/quiz.dto';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { Idempotent } from '../decorators/idempotent.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@ApiTags('public')
@Controller('api/public')
@UseInterceptors(IdempotencyInterceptor)
export class PublicController {
  constructor(
    private readonly quizService: QuizService,
    private readonly attemptService: AttemptService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Extract actual quiz token from slug-token format
   * Handles both formats: "ABC123DEF456" or "test-ABC123DEF456"
   */
  private extractToken(input: string): string {
    // If input contains a hyphen, assume it's slug-token format
    if (input.includes('-')) {
      const parts = input.split('-');
      // Return the last part as the token
      return parts[parts.length - 1];
    }
    // Otherwise, assume it's already a plain token
    return input;
  }

  @Get('services')
  @ApiOperation({
    summary: 'Get daftar services/jenis pelayanan untuk public quiz',
    description:
      'Endpoint untuk mendapatkan daftar services yang dapat dipilih peserta saat mengerjakan quiz. Hanya menampilkan services dengan isDisplayToUser=true.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daftar services berhasil diambil',
  })
  async getServicesForPublicUser(): Promise<StdApiResponse<any>> {
    const services = await this.configService.getServicesForPublicUser();
    const result = services.map((s) => ({
      key: s.key,
      value: s.value,
      description: s.description,
    }));
    return ResponseFactory.success(
      result,
      'Daftar jenis pelayanan berhasil diambil',
    );
  }

  @Get('quiz/:token')
  @ApiOperation({
    summary: 'Akses quiz secara publik menggunakan token (tanpa autentikasi)',
    description:
      'Endpoint untuk mengakses quiz yang sudah dipublish menggunakan token. Tidak memerlukan autentikasi.',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description:
      'Token quiz untuk akses publik (format: TOKEN atau slug-TOKEN)',
    example: 'ABC123DEF456',
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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Quiz sudah expired atau belum dimulai',
  })
  async getPublicQuiz(
    @Param('token') token: string,
  ): Promise<StdApiResponse<any>> {
    // Handle both formats: plain token (ABC123) or slug-token (test-ABC123)
    const actualToken = this.extractToken(token);
    const quiz = await this.quizService.findByTokenPublic(actualToken);

    // Transform quiz response to include images in questions
    const result = {
      ...quiz,
      questions:
        (quiz as any).questions?.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          order: q.order,
          images: q.images || [], // Include images from question
          // correctAnswer is already excluded by findByTokenPublic
        })) || [],
    };

    return ResponseFactory.success(
      result,
      'Data quiz dan soal berhasil diambil',
    );
  }

  @Post('quiz/:token/resume')
  @ApiOperation({
    summary: 'Get attempt data untuk resume quiz (jika ada)',
    description:
      'Endpoint untuk mendapatkan data attempt peserta yang sedang berjalan (belum submit). Digunakan saat refresh page untuk restore state.',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Token quiz',
    example: 'ABC123DEF456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt data berhasil diambil (atau null jika tidak ada)',
  })
  async getAttemptForResume(
    @Param('token') token: string,
    @Body() data: { email: string; nij: string },
  ): Promise<StdApiResponse<any>> {
    // Handle both formats: plain token (ABC123) or slug-token (test-ABC123)
    const actualToken = this.extractToken(token);

    // Verify quiz exists
    const quiz = await this.quizService.findByTokenPublic(actualToken);
    if (!quiz) {
      throw new BadRequestException(
        'Quiz tidak ditemukan atau tidak dapat diakses',
      );
    }

    // Find existing attempt by email and quizId
    const existingAttempt = await this.attemptService.findByEmailAndQuiz(
      data.email,
      quiz.id,
    );

    // If no attempt exists, return null
    if (!existingAttempt) {
      return ResponseFactory.success(
        null,
        'Tidak ada attempt yang ditemukan',
      );
    }

    // Check if already submitted - if yes, don't allow resume
    if (existingAttempt.submittedAt) {
      return ResponseFactory.success(
        {
          alreadySubmitted: true,
          submittedAt: existingAttempt.submittedAt,
        },
        'Quiz sudah di-submit sebelumnya',
      );
    }

    // Check if time expired (but still allow loading the quiz for submission)
    let timeExpired = false;
    if (existingAttempt.endDateTime) {
      const now = new Date();
      timeExpired = now > existingAttempt.endDateTime;
    }

    // Return attempt data for resume (including timeExpired flag for FE to handle)
    const result = {
      attemptId: existingAttempt.id,
      quizId: existingAttempt.quizId,
      participantName: existingAttempt.participantName,
      email: existingAttempt.email,
      nij: existingAttempt.nij,
      servoNumber: existingAttempt.servoNumber,
      serviceKey: existingAttempt.serviceKey,
      startDateTime: existingAttempt.startDateTime,
      endDateTime: existingAttempt.endDateTime,
      startedAt: existingAttempt.startedAt,
      answers: (existingAttempt as any).answers || [],
      timeExpired: timeExpired, // Include flag for frontend to handle UI state
    };

    return ResponseFactory.success(
      result,
      'Attempt ditemukan, dapat dilanjutkan',
    );
  }

  @Post('quiz/:token/check')
  @ApiOperation({
    summary: 'Cek apakah peserta sudah pernah mengerjakan quiz',
    description:
      'Endpoint untuk mengecek apakah peserta dengan NIJ tertentu sudah pernah submit quiz ini.',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Token quiz untuk pengecekan',
    example: 'ABC123DEF456',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status pengerjaan quiz berhasil dicek',
  })
  async checkUserSubmission(
    @Param('token') token: string,
    @Body() checkData: { nij: string },
  ): Promise<StdApiResponse<any>> {
    // Handle both formats: plain token (ABC123) or slug-token (test-ABC123)
    const actualToken = this.extractToken(token);

    // Verify quiz exists
    const quiz = await this.quizService.findByTokenPublic(actualToken);
    if (!quiz) {
      throw new BadRequestException(
        'Quiz tidak ditemukan atau tidak dapat diakses',
      );
    }

    // Check if user already submitted using NIJ
    const existingAttempt = await this.attemptService.findByNijAndQuiz(
      checkData.nij,
      quiz.id,
    );

    const result = {
      hasSubmitted: !!existingAttempt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
      },
      submission: existingAttempt
        ? {
            participantName: existingAttempt.participantName,
            nij: existingAttempt.nij,
            submittedAt:
              existingAttempt.submittedAt || existingAttempt.createdAt,
          }
        : null,
    };

    return ResponseFactory.success(
      result,
      existingAttempt
        ? 'Peserta sudah pernah mengerjakan quiz ini'
        : 'Peserta belum pernah mengerjakan quiz ini',
    );
  }

  @Post('quiz/:token/submit')
  @Idempotent(300) // Cache idempotent responses for 5 minutes
  @ApiOperation({
    summary: 'Submit jawaban quiz (tanpa autentikasi)',
    description:
      'Endpoint untuk submit jawaban quiz secara publik. Memerlukan input NIJ, email, nama, dan jawaban. Supports idempotency for safe retries.',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Token quiz untuk submit attempt',
    example: 'ABC123DEF456',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Optional idempotency key to prevent duplicate submissions',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Jawaban berhasil disubmit (tanpa menampilkan nilai kepada peserta)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Quiz tidak ditemukan atau belum dipublish',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Data tidak valid atau peserta sudah pernah mengerjakan quiz ini',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests. Please try again later.',
  })
  async submitQuizAttempt(
    @Param('token') token: string,
    @Body() submitData: CreateAttemptDto,
  ): Promise<StdApiResponse<any>> {
    // Handle both formats: plain token (ABC123) or slug-token (test-ABC123)
    const actualToken = this.extractToken(token);
    // Verify quiz exists and is accessible
    const quiz = await this.quizService.findByTokenPublic(actualToken);
    if (!quiz) {
      throw new BadRequestException(
        'Quiz tidak ditemukan atau tidak dapat diakses',
      );
    }

    // Set the quiz ID from the token-based quiz
    submitData.quizId = quiz.id;

    // Create the attempt (but don't return scores/results to participant)
    await this.attemptService.create(submitData);

    // Return only confirmation without revealing scores
    const result = {
      submitted: true,
      participantName: submitData.participantName,
      email: submitData.email,
      nij: submitData.nij,
      servoNumber: submitData.servoNumber || null,
      serviceKey: submitData.serviceKey,
      submittedAt: new Date().toISOString(),
      quiz: {
        title: quiz.title,
      },
    };

    return ResponseFactory.success(
      result,
      'Jawaban Anda berhasil disubmit. Terima kasih telah mengikuti quiz.',
    );
  }
}
