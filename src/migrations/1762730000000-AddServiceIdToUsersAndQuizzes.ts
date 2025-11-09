import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceIdToUsersAndQuizzes1762730000000 implements MigrationInterface {
  name = 'AddServiceIdToUsersAndQuizzes1762730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if serviceId column exists in users table before adding
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      const serviceIdColumnExists = await queryRunner.hasColumn('users', 'serviceId');
      if (!serviceIdColumnExists) {
        await queryRunner.query(`
          ALTER TABLE "users" 
          ADD COLUMN "serviceId" integer;
        `);
        
        // Add index for better performance
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS "IDX_users_serviceId" ON "users" ("serviceId");
        `);
        
        console.log('✅ Added serviceId column to users table');
      } else {
        console.log('ℹ️ serviceId column already exists in users table');
      }
    }

    // Check if serviceId column exists in quizzes table before adding
    const quizzesTableExists = await queryRunner.hasTable('quizzes');
    if (quizzesTableExists) {
      const serviceIdColumnExists = await queryRunner.hasColumn('quizzes', 'serviceId');
      if (!serviceIdColumnExists) {
        await queryRunner.query(`
          ALTER TABLE "quizzes" 
          ADD COLUMN "serviceId" integer;
        `);
        
        // Add index for better performance
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS "IDX_quizzes_serviceId" ON "quizzes" ("serviceId");
        `);
        
        console.log('✅ Added serviceId column to quizzes table');
      } else {
        console.log('ℹ️ serviceId column already exists in quizzes table');
      }
    }

    console.log('✅ Service ID migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_serviceId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quizzes_serviceId";`);
    
    // Remove columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "serviceId";`);
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "serviceId";`);
    
    console.log('✅ Service ID migration rollback completed');
  }
}