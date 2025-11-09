import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimestampsToQuestionsOnly1762693620414 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add createdAt and updatedAt columns to questions table
        await queryRunner.query(`ALTER TABLE "questions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove createdAt and updatedAt columns from questions table
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "createdAt"`);
    }

}
