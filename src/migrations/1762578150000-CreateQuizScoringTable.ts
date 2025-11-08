import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuizScoringTable1762578150000 implements MigrationInterface {
  name = 'CreateQuizScoringTable1762578150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quiz_scoring table
    await queryRunner.query(`
      CREATE TABLE "quiz_scoring" (
        "id" SERIAL PRIMARY KEY,
        "quizId" int NOT NULL,
        "scoringName" varchar(255) NOT NULL,
        "correctAnswerPoints" int NOT NULL DEFAULT 10,
        "incorrectAnswerPenalty" int NOT NULL DEFAULT 0,
        "unansweredPenalty" int NOT NULL DEFAULT 0,
        "bonusPoints" int NOT NULL DEFAULT 0,
        "multiplier" decimal(5,2) NOT NULL DEFAULT 1.0,
        "timeBonusEnabled" boolean NOT NULL DEFAULT false,
        "timeBonusPerSecond" decimal(5,2) NOT NULL DEFAULT 0.0,
        "maxScore" int NULL,
        "minScore" int NULL,
        "passingScore" int NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_quiz_scoring_quiz_id" ON "quiz_scoring" ("quizId")`);
    await queryRunner.query(`CREATE INDEX "IDX_quiz_scoring_is_active" ON "quiz_scoring" ("isActive")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "quiz_scoring" ADD CONSTRAINT "FK_quiz_scoring_quiz"
      FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "quiz_scoring" DROP CONSTRAINT "FK_quiz_scoring_quiz"`);
    
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quiz_scoring_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quiz_scoring_quiz_id"`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE "quiz_scoring"`);
  }
}