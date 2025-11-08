import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateQuizDatetimeAndLink1762578127578 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove the expiresAt column
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "expiresAt"`);
        
        // Add new columns for start/end datetime and quiz link
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "startDateTime" timestamp NULL`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "endDateTime" timestamp NULL`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "quizLink" varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove new columns
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "quizLink"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "endDateTime"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "startDateTime"`);
        
        // Re-add the expiresAt column
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "expiresAt" timestamp NULL`);
    }

}
