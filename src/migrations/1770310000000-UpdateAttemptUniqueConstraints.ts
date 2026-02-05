import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAttemptUniqueConstraints1770310000000
  implements MigrationInterface
{
  name = 'UpdateAttemptUniqueConstraints1770310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the global unique constraints on email and nij
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_attempts_email"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_attempts_nij"`,
    );

    // Create composite unique index for quizId + nij (email + quizId already exists)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_attempts_quizId_nij" ON "attempts" ("quizId", "nij")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the composite index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_attempts_quizId_nij"`,
    );

    // Restore the global unique constraints
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_attempts_email" ON "attempts" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_attempts_nij" ON "attempts" ("nij")`,
    );
  }
}
