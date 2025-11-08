import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User, Quiz, Question, Attempt, AttemptAnswer, ConfigItem, UserLocation, QuizImage } from '../entities';
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
    entities: [User, Quiz, Question, Attempt, AttemptAnswer, ConfigItem, UserLocation, QuizImage],
    migrations: ['dist/migrations/*.js'],
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
    logging: process.env.DATABASE_LOGGING === 'true' || false,
    migrationsRun: true,
    autoLoadEntities: true,
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
};

export const dataSource = new DataSource(dataSourceConfig);