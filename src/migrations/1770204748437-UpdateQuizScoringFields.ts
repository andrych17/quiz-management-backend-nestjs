import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuizScoringFields1770204748437 implements MigrationInterface {
    name = 'UpdateQuizScoringFields1770204748437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "scoringName" character varying`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "correctAnswerPoints" integer`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "incorrectAnswerPenalty" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "unansweredPenalty" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "bonusPoints" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "multiplier" numeric(5,2) NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "timeBonusEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "timeBonusPerSecond" numeric(5,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "maxScore" integer`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "minScore" integer`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ADD "passingScore" integer`);
        await queryRunner.query(`ALTER TABLE "config_items" ALTER COLUMN "isDisplayToUser" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ALTER COLUMN "points" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_scoring" ALTER COLUMN "points" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "config_items" ALTER COLUMN "isDisplayToUser" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "passingScore"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "minScore"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "maxScore"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "timeBonusPerSecond"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "timeBonusEnabled"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "multiplier"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "bonusPoints"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "unansweredPenalty"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "incorrectAnswerPenalty"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "correctAnswerPoints"`);
        await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP COLUMN "scoringName"`);
    }

}
