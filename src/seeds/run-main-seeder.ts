import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { MainSeeder } from './main-seeder';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  entities: ['src/entities/**/*.entity.ts'],
  synchronize: false,
  logging: false,
});

async function run() {
  try {
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const seeder = new MainSeeder(AppDataSource);
    await seeder.run();

    await AppDataSource.destroy();
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

run();
