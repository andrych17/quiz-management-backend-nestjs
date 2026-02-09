import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNijUniqueIndex1770529897439 implements MigrationInterface {
    name = 'RemoveNijUniqueIndex1770529897439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_attempts_quizId_nij"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_attempts_quizId_nij" ON "attempts" ("nij", "quizId") `);
    }

}
