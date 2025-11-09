import { DataSource } from 'typeorm';
import { seedLocationData } from './location-seeder';

// Import the same config as ormconfig.ts
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Attempt } from '../entities/attempt.entity';
import { AttemptAnswer } from '../entities/attempt-answer.entity';
import { ConfigItem } from '../entities/config-item.entity';
import { UserQuizAssignment } from '../entities/user-quiz-assignment.entity';
import { QuizImage } from '../entities/quiz-image.entity';
import { QuizScoring } from '../entities/quiz-scoring.entity';
import { UserQuizSession } from '../entities/user-quiz-session.entity';

dotenv.config();

async function runLocationSeed() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12345678',
    database: process.env.DATABASE_NAME || 'quiz',
    synchronize: false,
    logging: true,
    entities: [
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
    ],
  });

  try {
    console.log('🚀 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🌱 Starting location data seeding...');
    await seedLocationData(AppDataSource);

    console.log('✅ Location data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seeder
runLocationSeed().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});