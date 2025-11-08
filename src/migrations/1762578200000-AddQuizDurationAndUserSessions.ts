import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizDurationAndUserSessions1762578200000 implements MigrationInterface {
  name = 'AddQuizDurationAndUserSessions1762578200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add duration column to quizzes table
    await queryRunner.query(`
      ALTER TABLE "quizzes" ADD "durationMinutes" int NULL
    `);

    // Create session_status enum
    await queryRunner.query(`
      CREATE TYPE "session_status" AS ENUM('active', 'paused', 'completed', 'expired')
    `);

    // Create user_quiz_sessions table
    await queryRunner.query(`
      CREATE TABLE "user_quiz_sessions" (
        "id" SERIAL PRIMARY KEY,
        "userId" int NULL,
        "quizId" int NOT NULL,
        "sessionToken" varchar(255) NOT NULL UNIQUE,
        "sessionStatus" "session_status" NOT NULL DEFAULT 'active',
        "startedAt" timestamp NOT NULL,
        "pausedAt" timestamp NULL,
        "resumedAt" timestamp NULL,
        "completedAt" timestamp NULL,
        "expiresAt" timestamp NULL,
        "timeSpentSeconds" int NOT NULL DEFAULT 0,
        "remainingSeconds" int NULL,
        "metadata" jsonb NULL,
        "userEmail" varchar(255) NULL,
        "userIdentifier" varchar(255) NULL,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_user_quiz_sessions_user_quiz" ON "user_quiz_sessions" ("userId", "quizId")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_quiz_sessions_status" ON "user_quiz_sessions" ("sessionStatus")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_quiz_sessions_expires" ON "user_quiz_sessions" ("expiresAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_quiz_sessions_email" ON "user_quiz_sessions" ("userEmail")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_quiz_sessions" ADD CONSTRAINT "FK_user_quiz_sessions_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_quiz_sessions" ADD CONSTRAINT "FK_user_quiz_sessions_quiz"
      FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // Add unique constraint for active sessions
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_unique_active_session" ON "user_quiz_sessions" ("userId", "quizId") 
      WHERE "sessionStatus" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_unique_active_session"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "user_quiz_sessions" DROP CONSTRAINT IF EXISTS "FK_user_quiz_sessions_quiz"`);
    await queryRunner.query(`ALTER TABLE "user_quiz_sessions" DROP CONSTRAINT IF EXISTS "FK_user_quiz_sessions_user"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_quiz_sessions_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_quiz_sessions_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_quiz_sessions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_quiz_sessions_user_quiz"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "user_quiz_sessions"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "session_status"`);

    // Remove duration column from quizzes
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "durationMinutes"`);
  }
}