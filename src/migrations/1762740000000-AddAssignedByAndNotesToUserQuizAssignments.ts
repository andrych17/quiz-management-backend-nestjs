import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedByAndNotesToUserQuizAssignments1762740000000 implements MigrationInterface {
  name = 'AddAssignedByAndNotesToUserQuizAssignments1762740000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add assignedBy and notes columns if they do not already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_quiz_assignments' AND column_name = 'assignedBy'
        ) THEN
          ALTER TABLE "user_quiz_assignments" ADD COLUMN "assignedBy" varchar;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_quiz_assignments' AND column_name = 'notes'
        ) THEN
          ALTER TABLE "user_quiz_assignments" ADD COLUMN "notes" text;
        END IF;
      END $$;
    `);

    // Ensure indexes or defaults if needed (no-op for now)
    console.log('✅ Added assignedBy and notes columns to user_quiz_assignments (if they were missing)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_quiz_assignments" DROP COLUMN IF EXISTS "assignedBy";`);
    await queryRunner.query(`ALTER TABLE "user_quiz_assignments" DROP COLUMN IF EXISTS "notes";`);
    console.log('✅ Rolled back assignedBy and notes columns on user_quiz_assignments');
  }
}
