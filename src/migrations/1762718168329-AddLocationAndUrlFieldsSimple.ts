import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationAndUrlFieldsSimple1762718168329 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add locationId to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locationId" integer`);
        
        // Add URL fields to quizzes table
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "normalUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "shortUrl" character varying`);
        
        // Change quiz_images from quizId to questionId if not already done
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_images' AND column_name='quizId') THEN
                    ALTER TABLE "quiz_images" RENAME COLUMN "quizId" TO "questionId";
                END IF;
            END $$;
        `);
        
        // Update foreign key constraint if needed
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_quiz_image_quiz') THEN
                    ALTER TABLE "quiz_images" DROP CONSTRAINT "FK_quiz_image_quiz";
                END IF;
            END $$;
        `);
        
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='FK_quiz_image_question') THEN
                    ALTER TABLE "quiz_images" ADD CONSTRAINT "FK_quiz_image_question" 
                    FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove URL fields from quizzes
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "shortUrl"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "normalUrl"`);
        
        // Remove locationId from users
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locationId"`);
        
        // Revert quiz_images back to quizId if needed
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quiz_images' AND column_name='questionId') THEN
                    ALTER TABLE "quiz_images" RENAME COLUMN "questionId" TO "quizId";
                END IF;
            END $$;
        `);
    }

}
