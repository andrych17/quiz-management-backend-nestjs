import { DataSource } from 'typeorm';
import { ConfigItem } from '../entities';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupConfig() {
  console.log('🧹 Starting config cleanup...');
  
  // Create database connection configuration
  const dataSourceConfig = {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD?.replace(/"/g, '') || '',
    database: process.env.DATABASE_NAME || 'quiz',
    entities: [ConfigItem],
    synchronize: false,
    logging: false,
  };
  
  // Initialize database connection
  const dataSource = new DataSource(dataSourceConfig);
  await dataSource.initialize();
  console.log('✓ Database connection established');
  
  const configRepository = dataSource.getRepository(ConfigItem);
  
  try {
    // Get all config items that are NOT location or service
    const configsToDelete = await configRepository.createQueryBuilder('config')
      .where('config.group NOT IN (:...allowedGroups)', { allowedGroups: ['location', 'service'] })
      .getMany();
    
    console.log(`Found ${configsToDelete.length} config items to delete:`);
    configsToDelete.forEach(config => {
      console.log(`  - ${config.group}.${config.key}: ${config.value}`);
    });
    
    if (configsToDelete.length > 0) {
      // Delete the configs
      await configRepository.remove(configsToDelete);
      console.log(`✅ Deleted ${configsToDelete.length} config items`);
    } else {
      console.log('✅ No config items to delete');
    }
    
    // Show remaining configs
    const remainingConfigs = await configRepository.find({
      order: { group: 'ASC', order: 'ASC' }
    });
    
    console.log(`\n📋 Remaining config items (${remainingConfigs.length}):`);
    remainingConfigs.forEach(config => {
      console.log(`  - ${config.group}.${config.key}: ${config.value}`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await dataSource.destroy();
    console.log('✓ Database connection closed');
  }
}

cleanupConfig()
  .then(() => {
    console.log('🎉 Config cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Config cleanup failed:', error);
    process.exit(1);
  });