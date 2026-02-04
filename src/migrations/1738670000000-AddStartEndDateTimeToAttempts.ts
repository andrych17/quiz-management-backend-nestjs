import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStartEndDateTimeToAttempts1738670000000
  implements MigrationInterface
{
  name = 'AddStartEndDateTimeToAttempts1738670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "startDateTime" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "endDateTime" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "endDateTime"`);
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP COLUMN "startDateTime"`,
    );
  }
}
