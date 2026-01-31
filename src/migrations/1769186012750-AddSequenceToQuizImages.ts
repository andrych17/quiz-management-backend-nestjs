import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSequenceToQuizImages1769186012750
  implements MigrationInterface
{
  name = 'AddSequenceToQuizImages1769186012750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_images" ADD "sequence" integer NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_images" DROP COLUMN "sequence"`);
  }
}
