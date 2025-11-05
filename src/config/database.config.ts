import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User, Quiz, Question, Attempt, AttemptAnswer, ConfigItem } from '../entities';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'quiz_db',
    entities: [User, Quiz, Question, Attempt, AttemptAnswer, ConfigItem],
    migrations: ['dist/migrations/*.js'],
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
    logging: process.env.DATABASE_LOGGING === 'true' || false,
    migrationsRun: true,
    autoLoadEntities: true,
  }),
);

// Separate config for TypeORM CLI
export const dataSourceConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'quiz_db',
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true' || false,
};

export const dataSource = new DataSource(dataSourceConfig);