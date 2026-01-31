import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEssayQuestionType1766847088828
  implements MigrationInterface
{
  name = 'RemoveEssayQuestionType1766847088828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."questions_questiontype_enum" RENAME TO "questions_questiontype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."questions_questiontype_enum" AS ENUM('multiple-choice', 'multiple-select', 'text', 'true-false')`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "questionType" TYPE "public"."questions_questiontype_enum" USING "questionType"::"text"::"public"."questions_questiontype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."questions_questiontype_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."questions_questiontype_enum_old" AS ENUM('multiple-choice', 'multiple-select', 'text', 'true-false', 'essay')`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "questionType" TYPE "public"."questions_questiontype_enum_old" USING "questionType"::"text"::"public"."questions_questiontype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."questions_questiontype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."questions_questiontype_enum_old" RENAME TO "questions_questiontype_enum"`,
    );
  }
}
