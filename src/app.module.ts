import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

// Controllers
import { AppController } from './app.controller';
import { UserController } from './controllers/user.controller';
import { QuizController } from './controllers/quiz.controller';
import { QuestionController } from './controllers/question.controller';
import { AttemptController } from './controllers/attempt.controller';
import { ConfigController } from './controllers/config.controller';
import { UserQuizAssignmentController } from './controllers/user-quiz-assignment.controller';
import { PublicController } from './controllers/public.controller';
import { FileController } from './controllers/file.controller';
import { DashboardController } from './controllers/dashboard.controller';

// Services
import { AppService } from './app.service';
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { AttemptService } from './services/attempt.service';
import { UrlShortenerService } from './services/url-shortener.service';
import { UserQuizAssignmentService } from './services/user-quiz-assignment.service';
import { UrlGeneratorService } from './services/url-generator.service';
import { FileUploadService } from './services/file-upload.service';
import { DashboardService } from './services/dashboard.service';

// Shared Services Module
import { SharedServicesModule } from './shared/shared-services.module';
import { StorageModule } from './shared/storage.module';

// Auth Module
import { AuthModule } from './auth/auth.module';

import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
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
    ]),
    SharedServicesModule,
    StorageModule,
    AuthModule,
  ],
  controllers: [
    AppController,
    UserController,
    QuizController,
    QuestionController,
    AttemptController,
    ConfigController,
    UserQuizAssignmentController,
    PublicController,
    FileController,
    DashboardController,
  ],
  providers: [
    AppService,
    QuizService,
    QuestionService,
    AttemptService,
    UrlShortenerService,
    UserQuizAssignmentService,
    UrlGeneratorService,
    FileUploadService,
    DashboardService,
  ],
})
export class AppModule {}
