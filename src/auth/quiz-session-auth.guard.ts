import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class QuizSessionGuard extends AuthGuard('quiz-session') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Session token tidak valid atau tidak ditemukan. ' +
            'Silakan mulai ulang quiz untuk mendapatkan session baru. ' +
            'Kirim token via header: x-session-token',
        )
      );
    }
    return user;
  }
}
