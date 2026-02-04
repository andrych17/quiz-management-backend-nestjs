import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintsToEmailAndNij1770222876796 implements MigrationInterface {
    name = 'AddUniqueConstraintsToEmailAndNij1770222876796'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_808de8f324f5d818f108a50308"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d95f2a146ce7d7e15229334c55"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_808de8f324f5d818f108a50308" ON "attempts" ("nij") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d95f2a146ce7d7e15229334c55" ON "attempts" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d95f2a146ce7d7e15229334c55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_808de8f324f5d818f108a50308"`);
        await queryRunner.query(`CREATE INDEX "IDX_d95f2a146ce7d7e15229334c55" ON "attempts" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_808de8f324f5d818f108a50308" ON "attempts" ("nij") `);
    }

}
