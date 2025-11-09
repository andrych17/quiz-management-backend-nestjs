import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ConfigItem } from '../entities/config-item.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'quiz_db',
  entities: [ConfigItem],
  synchronize: false,
  logging: false,
});

async function addAllLocations() {
  try {
    console.log('🚀 Connecting to database...');
    await dataSource.initialize();
    const repo = dataSource.getRepository(ConfigItem);
    
    const existing = await repo.findOne({
      where: { group: 'location', key: 'all_locations' }
    });
    
    if (!existing) {
      await repo.save({
        group: 'location',
        key: 'all_locations',
        value: 'All Locations',
        description: 'Akses ke semua lokasi (SuperAdmin)',
        order: 999,
        isActive: true,
        createdBy: 'system',
      });
      console.log('✅ Added all_locations config');
    } else {
      console.log('ℹ️ all_locations already exists');
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

addAllLocations().catch(console.error);