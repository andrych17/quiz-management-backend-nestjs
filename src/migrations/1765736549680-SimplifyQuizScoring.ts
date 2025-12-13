import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyQuizScoring1765736549680 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop columns that are no longer needed
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            DROP COLUMN IF EXISTS "scoringName",
            DROP COLUMN IF EXISTS "minScore",
            DROP COLUMN IF EXISTS "maxScore",
            DROP COLUMN IF EXISTS "passingScore",
            DROP COLUMN IF EXISTS "incorrectAnswerPenalty",
            DROP COLUMN IF EXISTS "unansweredPenalty",
            DROP COLUMN IF EXISTS "bonusPoints",
            DROP COLUMN IF EXISTS "multiplier",
            DROP COLUMN IF EXISTS "timeBonusEnabled"
        `);

        // Rename correctAnswerPoints to just points and set default to 1
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            RENAME COLUMN "correctAnswerPoints" TO "points"
        `);

        // Add new simpler columns
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            ADD COLUMN IF NOT EXISTS "correctAnswers" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0
        `);

        // Add description for clarity
        await queryRunner.query(`
            COMMENT ON COLUMN "quiz_scoring"."correctAnswers" IS 'Jumlah jawaban benar'
        `);
        
        await queryRunner.query(`
            COMMENT ON COLUMN "quiz_scoring"."score" IS 'Score yang didapat untuk jumlah jawaban benar ini'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "quiz_scoring"."points" IS 'Point per jawaban (default 1)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore old columns
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            DROP COLUMN IF EXISTS "correctAnswers",
            DROP COLUMN IF EXISTS "score"
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            RENAME COLUMN "points" TO "correctAnswerPoints"
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            ADD COLUMN IF NOT EXISTS "scoringName" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "minScore" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "maxScore" INTEGER DEFAULT 100,
            ADD COLUMN IF NOT EXISTS "passingScore" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "incorrectAnswerPenalty" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "unansweredPenalty" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "bonusPoints" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "multiplier" DECIMAL(5,2) DEFAULT 1.0,
            ADD COLUMN IF NOT EXISTS "timeBonusEnabled" BOOLEAN DEFAULT false
        `);
    }

}
