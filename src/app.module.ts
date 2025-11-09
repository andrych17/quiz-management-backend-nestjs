import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { User } from './entities/user.entity';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { Attempt } from './entities/attempt.entity';
import { AttemptAnswer } from './entities/attempt-answer.entity';
import { ConfigItem } from './entities/config-item.entity';
import { UserQuizAssignment } from './entities/user-quiz-assignment.entity';
import { QuizImage } from './entities/quiz-image.entity';
import { QuizScoring } from './entities/quiz-scoring.entity';
import { UserQuizSession } from './entities/user-quiz-session.entity';

// Controllers
import { UserController } from './controllers/user.controller';
import { QuizController } from './controllers/quiz.controller';
import { QuestionController } from './controllers/question.controller';
import { AttemptController } from './controllers/attempt.controller';
import { ConfigController } from './controllers/config.controller';
import { UserQuizSessionController } from './controllers/user-quiz-session.controller';
import { AttemptAnswerController } from './controllers/attempt-answer.controller';
import { UserQuizAssignmentController } from './controllers/user-quiz-assignment.controller';

// Services
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { AttemptService } from './services/attempt.service';
import { ConfigService } from './services/config.service';
import { UrlShortenerService } from './services/url-shortener.service';
import { UserQuizSessionService } from './services/user-quiz-session.service';
import { AttemptAnswerService } from './services/attempt-answer.service';
import { UserQuizAssignmentService } from './services/user-quiz-assignment.service';
import { UrlGeneratorService } from './services/url-generator.service';

// Shared Services Module
import { SharedServicesModule } from './shared/shared-services.module';

// Auth Module
import { AuthModule } from './auth/auth.module';

// Schedule Module
import { ScheduleAppModule } from './schedule/schedule.module';

import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config) => config,
    }),
    TypeOrmModule.forFeature([
      User,
      Quiz,
      Question,
      Attempt,
      AttemptAnswer,
      ConfigItem,
      UserQuizAssignment,
      QuizImage,
      QuizScoring,
      UserQuizSession,
    ]),
    SharedServicesModule,
    AuthModule,
    ScheduleAppModule,
  ],
  controllers: [
    UserController,
    QuizController,
    QuestionController,
    AttemptController,
    ConfigController,
    AttemptAnswerController,
    UserQuizAssignmentController,
    UserQuizSessionController,
  ],
  providers: [
    QuizService,
    QuestionService,
    AttemptService,
    ConfigService,
    UrlShortenerService,
    AttemptAnswerService,
    UserQuizAssignmentService,
    UserQuizSessionService,
    UrlGeneratorService,
  ],
})
export class AppModule {}
