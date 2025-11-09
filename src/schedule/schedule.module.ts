import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionCleanupService } from './session-cleanup.service';
import { ScheduleController } from './schedule.controller';
import { UserQuizSessionService } from '../services/user-quiz-session.service';
import { UserQuizSession } from '../entities/user-quiz-session.entity';
import { Quiz } from '../entities/quiz.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserQuizSession, Quiz, User]),
  ],
  controllers: [ScheduleController],
  providers: [SessionCleanupService, UserQuizSessionService],
  exports: [SessionCleanupService],
})
export class ScheduleAppModule {}