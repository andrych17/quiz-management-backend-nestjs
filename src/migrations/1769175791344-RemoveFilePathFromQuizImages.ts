import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFilePathFromQuizImages1769175791344
  implements MigrationInterface
{
  name = 'RemoveFilePathFromQuizImages1769175791344';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_images" DROP COLUMN "filePath"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_images" ADD "filePath" character varying NOT NULL`,
    );
  }
}
