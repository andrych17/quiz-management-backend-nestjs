import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface QuizSessionData {
  sub: number;    // attemptId
  quizId: number;
  email: string;
  nij: string;
}

@Injectable()
export class QuizSessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get secret(): string {
    return (
      this.configService.get<string>('QUIZ_SESSION_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'your-secret-key'
    );
  }

  /**
   * Sign a short-lived session token for a quiz attempt.
   * Expiry mirrors the quiz duration or defaults to 8h so a
   * partially-started quiz can still be submitted.
   */
  signSessionToken(
    data: QuizSessionData,
    expiresIn: string = '8h',
  ): string {
    return this.jwtService.sign(
      { ...data, type: 'quiz-session' },
      { secret: this.secret, expiresIn },
    );
  }
}
