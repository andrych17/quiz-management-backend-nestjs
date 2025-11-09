import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigItem } from '../entities/config-item.entity';
import { ServiceSeeder } from './service.seeder';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'quiz_db',
  entities: [ConfigItem],
  synchronize: false,
  logging: true,
});

async function runServiceSeeder() {
  try {
    console.log('🚀 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🛠️ Starting service data seeding...');
    const seeder = new ServiceSeeder(dataSource);
    await seeder.run();

    console.log('✅ Service data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during service seeding:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runServiceSeeder();