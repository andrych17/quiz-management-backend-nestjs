import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { QuizService } from '../services/quiz.service';
import { AttemptService } from '../services/attempt.service';
import { ConfigService as AppConfigService } from '../services/config.service';
import { CreateAttemptDto } from '../dto/attempt.dto';
import { QuizResponseDto } from '../dto/quiz.dto';
import {
  ApiResponse as StdApiResponse,
  ResponseFactory,
} from '../interfaces/api-response.interface';
import { Idempotent } from '../decorators/idempotent.decorator';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import { QuizSessionPayload } from '../auth/quiz-session.strategy';
import { QuizSessionService } from '../services/quiz-session.service';

@ApiTags('public')
@Controller('api/public')
@UseInterceptors(IdempotencyInterceptor)
export class PublicController {
  constructor(
    private readonly quizService: QuizService,
    private readonly attemptService: AttemptService,
    private readonly configService: AppConfigService,
    private readonly jwtService: JwtService,
    private readonly nestConfigService: ConfigService,
    private readonly quizSessionService: QuizSessionService,
  ) {}

  /**
   * Validate quiz session token against the submitted data.
   * Reads from the request body field `sessionToken`, with fallback to
   * the `x-session-token` header for backward compatibility.
   * Only called when answers are present (actual submit, not start).
   */
  private validateQuizSessionToken(
    req: Request,
    body: CreateAttemptDto,
    email: string,
    nij: string,
    quizId: number,
  ): void {
    // Prefer body field, fall back to header for backward compat
    const rawToken =
      body.sessionToken ||
      (req.headers['x-session-token'] as string | undefined);
    if (!rawToken) {
      throw new UnauthorizedException(
        'Session token diperlukan saat submit jawaban. ' +
          'Pastikan Anda memulai quiz terlebih dahulu untuk mendapatkan session token.',
      );
    }

    let payload: QuizSessionPayload;
    try {
      const secret =
        this.nestConfigService.get<string>('QUIZ_SESSION_SECRET') ||
        this.nestConfigService.get<string>('JWT_SECRET') ||
        'your-secret-key';
      payload = this.jwtService.verify<QuizSessionPayload>(rawToken, { secret });
    } catch {
      throw new UnauthorizedException(
        'Session token tidak valid atau sudah kadaluarsa. ' +
          'Silakan mulai ulang quiz untuk mendapatkan session baru.',
      );
    }

    if (payload.type !== 'quiz-session') {
      throw new UnauthorizedException('Tipe token tidak valid.');
    }

    if (payload.email !== email || payload.nij !== nij) {
      throw new UnauthorizedException(
        'Session token tidak cocok dengan data peserta yang di-submit. ' +
          'Pastikan email dan NIJ sesuai dengan saat memulai quiz.',
      );
    }

    if (payload.quizId !== quizId) {
      throw new UnauthorizedException(
        'Session token tidak sesuai dengan quiz ini. ' +
          'Pastikan Anda mengakses quiz yang sama saat memulai.',
      );
    }
  }

  /**
   * Extract actual quiz token from slug-token format
   * Handles both formats: "ABC123DEF456" or "test-ABC123DEF456"
   */
  private extractToken(input: string): string {
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

    // Issue a fresh session token so the frontend can submit after resume
    const sessionToken = this.quizSessionService.signSessionToken(
      {
        sub: existingAttempt.id,
        quizId: existingAttempt.quizId,
        email: existingAttempt.email,
        nij: existingAttempt.nij,
      },
      (quiz as any).durationMinutes ? `${(quiz as any).durationMinutes + 30}m` : '8h',
    );

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
      sessionToken, // Fresh token so the frontend can submit after resume
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
      'Endpoint untuk submit jawaban quiz secara publik. ' +
      'Saat memulai quiz (answers kosong) server mengembalikan sessionToken. ' +
      'Saat submit jawaban, kirim sessionToken di body request (atau via header x-session-token sebagai fallback). ' +
      'Supports idempotency for safe retries.',
  })
  @ApiParam({
    name: 'token',
    type: String,
    description: 'Token quiz untuk submit attempt',
    example: 'ABC123DEF456',
  })
  @ApiHeader({
    name: 'x-session-token',
    description:
      '(Deprecated — gunakan field sessionToken di body) Session JWT yang diterima saat memulai quiz',
    required: false,
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
    @Req() req: Request,
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

    // Only validate session token when submitting actual answers (not on quiz start)
    const hasAnswers = submitData.answers && submitData.answers.length > 0;
    if (hasAnswers) {
      this.validateQuizSessionToken(
        req,
        submitData,
        submitData.email,
        submitData.nij,
        quiz.id,
      );
    }

    // Set the quiz ID from the token-based quiz
    submitData.quizId = quiz.id;

    // Create the attempt (but don't return scores/results to participant)
    const attemptDto = await this.attemptService.create(submitData);

    // Return only confirmation without revealing scores.
    // When starting (no answers), include sessionToken so the frontend can
    // send it back via x-session-token header on the actual submit call.
    const result: Record<string, any> = {
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

    if (!hasAnswers && (attemptDto as any)?.sessionToken) {
      result.sessionToken = (attemptDto as any).sessionToken;
      result.attemptId = (attemptDto as any).id ?? null;
      result.startDateTime = (attemptDto as any).startDateTime ?? null;
      result.endDateTime = (attemptDto as any).endDateTime ?? null;
    }

    return ResponseFactory.success(
      result,
      'Jawaban Anda berhasil disubmit. Terima kasih telah mengikuti quiz.',
    );
  }
}
