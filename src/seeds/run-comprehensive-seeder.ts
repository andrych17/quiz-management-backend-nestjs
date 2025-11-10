import { DataSource } from 'typeorm';
import { ComprehensiveSeeder } from './comprehensive-seeder';
import { dataSourceConfig } from '../config/database.config';

async function runSeeder() {
  console.log('🚀 Initializing database connection for comprehensive seeding...');

  const dataSource = new DataSource(dataSourceConfig);

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    const seeder = new ComprehensiveSeeder(dataSource);
    await seeder.run();
    
    console.log('🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the seeder
runSeeder().catch((error) => {
  console.error('❌ Fatal error during seeding:', error);
  process.exit(1);
});