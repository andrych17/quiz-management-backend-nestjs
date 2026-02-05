import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCompletedAtColumn1770320000000
  implements MigrationInterface
{
  name = 'RemoveCompletedAtColumn1770320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove completedAt column from attempts table
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP COLUMN IF EXISTS "completedAt"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add completedAt column back if needed
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "completedAt" TIMESTAMP`,
    );
  }
}
