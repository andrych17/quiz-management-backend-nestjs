import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateToKeyBasedStorage1762772417800 implements MigrationInterface {
    name = 'UpdateToKeyBasedStorage1762772417800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns for key-based storage
        await queryRunner.query(`ALTER TABLE "users" ADD "locationKey" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "serviceKey" character varying`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "locationKey" character varying`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "serviceKey" character varying`);

        // Migrate existing data from ID-based to key-based
        // Update users table
        await queryRunner.query(`
            UPDATE "users" 
            SET "locationKey" = (
                SELECT "key" 
                FROM "config_items" 
                WHERE "config_items"."id" = "users"."locationId" 
                AND "config_items"."group" = 'location'
            )
            WHERE "locationId" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "users" 
            SET "serviceKey" = (
                SELECT "key" 
                FROM "config_items" 
                WHERE "config_items"."id" = "users"."serviceId" 
                AND "config_items"."group" = 'service'
            )
            WHERE "serviceId" IS NOT NULL
        `);

        // Update quizzes table
        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "locationKey" = (
                SELECT "key" 
                FROM "config_items" 
                WHERE "config_items"."id" = "quizzes"."locationId" 
                AND "config_items"."group" = 'location'
            )
            WHERE "locationId" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "serviceKey" = (
                SELECT "key" 
                FROM "config_items" 
                WHERE "config_items"."id" = "quizzes"."serviceId" 
                AND "config_items"."group" = 'service'
            )
            WHERE "serviceId" IS NOT NULL
        `);

        // Drop old columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "serviceId"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "serviceId"`);

        // Create indexes for new key columns
        await queryRunner.query(`CREATE INDEX "IDX_users_locationKey" ON "users" ("locationKey")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_serviceKey" ON "users" ("serviceKey")`);
        await queryRunner.query(`CREATE INDEX "IDX_quizzes_locationKey" ON "quizzes" ("locationKey")`);
        await queryRunner.query(`CREATE INDEX "IDX_quizzes_serviceKey" ON "quizzes" ("serviceKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_quizzes_serviceKey"`);
        await queryRunner.query(`DROP INDEX "IDX_quizzes_locationKey"`);
        await queryRunner.query(`DROP INDEX "IDX_users_serviceKey"`);
        await queryRunner.query(`DROP INDEX "IDX_users_locationKey"`);

        // Add back old ID columns
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "serviceId" integer`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "locationId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "serviceId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "locationId" integer`);

        // Migrate data back from key-based to ID-based (if needed)
        await queryRunner.query(`
            UPDATE "users" 
            SET "locationId" = (
                SELECT "id" 
                FROM "config_items" 
                WHERE "config_items"."key" = "users"."locationKey" 
                AND "config_items"."group" = 'location'
            )
            WHERE "locationKey" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "users" 
            SET "serviceId" = (
                SELECT "id" 
                FROM "config_items" 
                WHERE "config_items"."key" = "users"."serviceKey" 
                AND "config_items"."group" = 'service'
            )
            WHERE "serviceKey" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "locationId" = (
                SELECT "id" 
                FROM "config_items" 
                WHERE "config_items"."key" = "quizzes"."locationKey" 
                AND "config_items"."group" = 'location'
            )
            WHERE "locationKey" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "quizzes" 
            SET "serviceId" = (
                SELECT "id" 
                FROM "config_items" 
                WHERE "config_items"."key" = "quizzes"."serviceKey" 
                AND "config_items"."group" = 'service'
            )
            WHERE "serviceKey" IS NOT NULL
        `);

        // Drop new key columns
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "serviceKey"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "locationKey"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "serviceKey"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locationKey"`);
    }
}
