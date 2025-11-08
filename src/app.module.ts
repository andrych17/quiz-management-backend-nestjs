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
import { UserLocation } from './entities/user-location.entity';
import { QuizImage } from './entities/quiz-image.entity';
import { QuizScoring } from './entities/quiz-scoring.entity';

// Controllers
import { UserController } from './controllers/user.controller';
import { QuizController } from './controllers/quiz.controller';
import { QuestionController } from './controllers/question.controller';
import { AttemptController } from './controllers/attempt.controller';
import { ConfigController } from './controllers/config.controller';
import { QuizScoringController } from './controllers/quiz-scoring.controller';

// Services
import { UserService } from './services/user.service';
import { QuizService } from './services/quiz.service';
import { QuestionService } from './services/question.service';
import { AttemptService } from './services/attempt.service';
import { ConfigService } from './services/config.service';
import { UrlShortenerService } from './services/url-shortener.service';
import { QuizScoringService } from './services/quiz-scoring.service';

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
      UserLocation,
      QuizImage,
      QuizScoring,
    ]),
    AuthModule,
  ],
  controllers: [
    UserController,
    QuizController,
    QuestionController,
    AttemptController,
    ConfigController,
    QuizScoringController,
  ],
  providers: [
    UserService,
    QuizService,
    QuestionService,
    AttemptService,
    ConfigService,
    UrlShortenerService,
    QuizScoringService,
  ],
})
export class AppModule {}
