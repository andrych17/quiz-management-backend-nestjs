import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsDisplayToUserAndServiceKey1769250100000
  implements MigrationInterface
{
  name = 'AddIsDisplayToUserAndServiceKey1769250100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isDisplayToUser to config_items with default true
    await queryRunner.query(
      `ALTER TABLE "config_items" ADD "isDisplayToUser" boolean NOT NULL DEFAULT true`,
    );

    // Add serviceKey to attempts
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD "serviceKey" character varying`,
    );

    // Update all_services and all_locations to have isDisplayToUser = false
    await queryRunner.query(
      `UPDATE "config_items" SET "isDisplayToUser" = false WHERE "key" IN ('all_services', 'all_locations')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "serviceKey"`);
    await queryRunner.query(
      `ALTER TABLE "config_items" DROP COLUMN "isDisplayToUser"`,
    );
  }
}
