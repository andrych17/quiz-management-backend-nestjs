import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface QuizSessionPayload {
  sub: number;   // attemptId
  quizId: number;
  email: string;
  nij: string;
  type: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class QuizSessionStrategy extends PassportStrategy(
  Strategy,
  'quiz-session',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('x-session-token'),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('QUIZ_SESSION_SECRET') ||
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key',
    });
  }

  async validate(payload: QuizSessionPayload): Promise<QuizSessionPayload> {
    if (payload.type !== 'quiz-session') {
      throw new UnauthorizedException('Invalid session token type');
    }
    return payload;
  }
}
