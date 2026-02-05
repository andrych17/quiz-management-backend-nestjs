import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncorrectAnswersColumn1770300000000
  implements MigrationInterface
{
  name = 'AddIncorrectAnswersColumn1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the column with default value
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "incorrectAnswers" integer NOT NULL DEFAULT 0`,
    );

    // Update existing records to calculate incorrect answers
    await queryRunner.query(
      `UPDATE "attempts" SET "incorrectAnswers" = "totalQuestions" - "correctAnswers" WHERE "totalQuestions" > 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP COLUMN "incorrectAnswers"`,
    );
  }
}
