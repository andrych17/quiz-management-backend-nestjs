import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizTypeOnly1762710100000 implements MigrationInterface {
    name = 'AddQuizTypeOnly1762710100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for quiz type
        await queryRunner.query(`CREATE TYPE "public"."quiz_type_enum" AS ENUM('scheduled', 'manual')`);
        
        // Add quizType column to quizzes table with default value
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "quizType" "public"."quiz_type_enum" NOT NULL DEFAULT 'scheduled'`);
        
        // Update existing quizzes: if they have both startDateTime and endDateTime, mark as scheduled
        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "quizType" = 'scheduled' 
            WHERE "startDateTime" IS NOT NULL AND "endDateTime" IS NOT NULL
        `);
        
        // Update existing quizzes: if they only have durationMinutes but no dates, mark as manual
        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "quizType" = 'manual' 
            WHERE ("startDateTime" IS NULL OR "endDateTime" IS NULL) AND "durationMinutes" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove quizType column
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "quizType"`);
        
        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."quiz_type_enum"`);
    }
}