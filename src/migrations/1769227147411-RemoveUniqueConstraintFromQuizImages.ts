import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueConstraintFromQuizImages1769227147411
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint on questionId to allow multiple images per question
    await queryRunner.query(
      `ALTER TABLE "quiz_images" DROP CONSTRAINT IF EXISTS "REL_452fa374294113895f61b1c5e5"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add unique constraint (only if needed for rollback)
    // Note: This will fail if there are already multiple images per question
    await queryRunner.query(
      `ALTER TABLE "quiz_images" ADD CONSTRAINT "REL_452fa374294113895f61b1c5e5" UNIQUE ("questionId")`,
    );
  }
}
