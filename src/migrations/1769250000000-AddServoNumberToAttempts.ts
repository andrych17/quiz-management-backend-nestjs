import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServoNumberToAttempts1769250000000
  implements MigrationInterface
{
  name = 'AddServoNumberToAttempts1769250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "servoNumber" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "servoNumber"`);
  }
}
