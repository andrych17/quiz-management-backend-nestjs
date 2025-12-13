import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnusedScoringColumns1765736824615 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop unused columns
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            DROP COLUMN IF EXISTS "score",
            DROP COLUMN IF EXISTS "timeBonusPerSecond"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore columns if needed
        await queryRunner.query(`
            ALTER TABLE "quiz_scoring" 
            ADD COLUMN IF NOT EXISTS "score" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "timeBonusPerSecond" DECIMAL(5,2) DEFAULT 0.0
        `);
    }

}
