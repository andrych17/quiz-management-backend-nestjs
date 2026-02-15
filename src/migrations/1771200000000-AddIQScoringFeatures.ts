import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIQScoringFeatures1771200000000 implements MigrationInterface {
    name = 'AddIQScoringFeatures1771200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for quiz_scoring_mode_enum
        await queryRunner.query(`CREATE TYPE "quiz_scoring_mode_enum" AS ENUM('standard', 'iq_test')`);

        // Add scoringMode column to quizzes table
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "scoringMode" "quiz_scoring_mode_enum" NOT NULL DEFAULT 'standard'`);

        // Create enum type for scoring_type_enum (for quiz_scoring table - backward compatibility)
        await queryRunner.query(`CREATE TYPE "scoring_type_enum" AS ENUM('standard', 'iq_scoring')`);

        // Add scoringType column to quiz_scoring table (for backward compatibility)
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "scoringType" "scoring_type_enum" NOT NULL DEFAULT 'standard'`);

        // Add category column to quiz_scoring table
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "category" character varying`);

        // Extend grade column for IQ categories (High Average = 12 chars, Low Average = 11 chars)
        await queryRunner.query(`ALTER TABLE "attempts" ALTER COLUMN "grade" TYPE character varying(20)`);

        // ============================================================================
        // UPDATE EXISTING DATA - Populate grades for existing attempts
        // ============================================================================

        // Update existing quizzes to IQ test mode (by title pattern)
        await queryRunner.query(`
            UPDATE quizzes
            SET "scoringMode" = 'iq_test', "passingScore" = 80
            WHERE title ILIKE '%IQ%' OR title ILIKE '%kognitif%' OR title ILIKE '%intelligence%';
        `);

        // Update attempts with standard scoring (percentage-based grades A-F)
        await queryRunner.query(`
            UPDATE attempts a
            SET grade = CASE
                WHEN a.score >= 90 THEN 'A'
                WHEN a.score >= 80 THEN 'B'
                WHEN a.score >= 70 THEN 'C'
                WHEN a.score >= 60 THEN 'D'
                WHEN a.score >= 50 THEN 'E'
                ELSE 'F'
            END
            FROM quizzes q
            WHERE a."quizId" = q.id
              AND q."scoringMode" = 'standard'
              AND a."submittedAt" IS NOT NULL
              AND a.grade IS NULL;
        `);

        // Update attempts with IQ scoring (IQ category grades)
        await queryRunner.query(`
            UPDATE attempts a
            SET grade = CASE
                WHEN a.score >= 130 THEN 'Gifted'
                WHEN a.score >= 120 THEN 'Superior'
                WHEN a.score >= 110 THEN 'High Average'
                WHEN a.score >= 90 THEN 'Average'
                WHEN a.score >= 80 THEN 'Low Average'
                ELSE 'Borderline'
            END,
            passed = CASE
                WHEN a.score < 80 THEN false
                ELSE a.passed
            END
            FROM quizzes q
            WHERE a."quizId" = q.id
              AND q."scoringMode" = 'iq_test'
              AND a."submittedAt" IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop columns from quiz_scoring table
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "scoringType"`);

        // Drop scoringMode column from quizzes table
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "scoringMode"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "scoring_type_enum"`);
        await queryRunner.query(`DROP TYPE "quiz_scoring_mode_enum"`);
    }
}
