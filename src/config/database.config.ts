import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  User,
  Quiz,
  Question,
  Attempt,
  AttemptAnswer,
  ConfigItem,
  UserQuizAssignment,
  QuizImage,
} from '../entities';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD?.replace(/"/g, '') || '', // Remove quotes if present
    database: process.env.DATABASE_NAME || 'quiz',
    entities: [
      User,
      Quiz,
      Question,
      Attempt,
      AttemptAnswer,
      ConfigItem,
      UserQuizAssignment,
      QuizImage,
    ],
    migrations: ['dist/migrations/*.js'],
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
    logging: process.env.NODE_ENV === 'production' ? false : (process.env.DATABASE_LOGGING === 'true' || false),
    migrationsRun: true,
    autoLoadEntities: true,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    // Connection pooling for production
    extra: process.env.NODE_ENV === 'production' ? {
      max: 10,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    } : {},
  }),
);

// Separate config for TypeORM CLI
export const dataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD?.replace(/"/g, '') || '', // Remove quotes if present
  database: process.env.DATABASE_NAME || 'quiz',
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true' || false,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
};

export const dataSource = new DataSource(dataSourceConfig);
