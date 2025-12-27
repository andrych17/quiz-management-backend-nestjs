import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { ComprehensiveSeeder } from './comprehensive-seeder';

// Load environment variables
config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'quiz_db',
    entities: [join(__dirname, '../entities/*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
});

async function resetAndSeed() {
    console.log('🔄 Starting database reset and seeding process...\n');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established\n');

        // Delete data in correct order (respecting foreign key constraints)
        console.log('🗑️  Deleting existing data...');

        // Delete child tables first
        await AppDataSource.query('DELETE FROM attempt_answers');
        console.log('  ✓ Deleted attempt_answers');

        await AppDataSource.query('DELETE FROM attempts');
        console.log('  ✓ Deleted attempts');

        await AppDataSource.query('DELETE FROM user_quiz_assignments');
        console.log('  ✓ Deleted user_quiz_assignments');

        await AppDataSource.query('DELETE FROM quiz_images');
        console.log('  ✓ Deleted quiz_images');

        await AppDataSource.query('DELETE FROM questions');
        console.log('  ✓ Deleted questions');

        await AppDataSource.query('DELETE FROM quiz_scoring');
        console.log('  ✓ Deleted quiz_scoring');

        await AppDataSource.query('DELETE FROM quizzes');
        console.log('  ✓ Deleted quizzes');

        await AppDataSource.query('DELETE FROM users');
        console.log('  ✓ Deleted users');

        await AppDataSource.query('DELETE FROM config_items');
        console.log('  ✓ Deleted config_items');

        console.log('\n✅ All existing data deleted successfully!\n');

        // Run comprehensive seeder
        console.log('🌱 Running comprehensive seeder...\n');
        const seeder = new ComprehensiveSeeder(AppDataSource);
        await seeder.run();

        console.log('\n✅ Database reset and seeding completed successfully!');
        console.log('📊 Database now contains fresh data with:');
        console.log('   - Config items (services & locations)');
        console.log('   - Users (superadmin, admins, regular users)');
        console.log('   - Sample quiz with questions and scoring');

    } catch (error) {
        console.error('❌ Error during reset and seeding:', error);
        process.exit(1);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('\n✓ Database connection closed');
        }
    }
}

resetAndSeed();
