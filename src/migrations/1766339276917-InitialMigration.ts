import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1766339276917 implements MigrationInterface {
  name = 'InitialMigration1766339276917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('superadmin', 'admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "lastLogin" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdBy" character varying, "updatedBy" character varying, "locationKey" character varying, "serviceKey" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_type_enum" AS ENUM('scheduled', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quizzes" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "slug" character varying, "token" character varying NOT NULL, "serviceType" character varying, "quizType" "public"."quiz_type_enum" NOT NULL DEFAULT 'scheduled', "locationKey" character varying, "serviceKey" character varying, "passingScore" integer NOT NULL DEFAULT '70', "questionsPerPage" integer NOT NULL DEFAULT '5', "durationMinutes" integer, "isActive" boolean NOT NULL DEFAULT true, "isPublished" boolean NOT NULL DEFAULT false, "startDateTime" TIMESTAMP, "endDateTime" TIMESTAMP, "quizLink" character varying, "normalUrl" character varying, "shortUrl" character varying, "createdBy" character varying, "updatedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a222b1155419cccaa16eab009a3" UNIQUE ("token"), CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_288761104b13482bf50686dd13" ON "quizzes" ("serviceKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b0d52a1b8677fd683241c1cba" ON "quizzes" ("locationKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_293b24cc3015646be6581c39ab" ON "quizzes" ("serviceType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_369913516cd527552f3011c42f" ON "quizzes" ("slug") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a222b1155419cccaa16eab009a" ON "quizzes" ("token") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."questions_questiontype_enum" AS ENUM('multiple-choice', 'multiple-select', 'text', 'true-false', 'essay')`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" SERIAL NOT NULL, "quizId" integer NOT NULL, "questionText" text NOT NULL, "questionType" "public"."questions_questiontype_enum" NOT NULL, "options" jsonb, "correctAnswer" character varying NOT NULL, "order" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d3e9f91c0dc5e6cba50efb7d6b" ON "questions" ("quizId", "order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attempt_answers" ("id" SERIAL NOT NULL, "attemptId" integer NOT NULL, "questionId" integer NOT NULL, "answerText" text NOT NULL, "isCorrect" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7166de359382219e40c62607be" ON "attempt_answers" ("attemptId", "questionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attempts" ("id" SERIAL NOT NULL, "quizId" integer NOT NULL, "participantName" character varying NOT NULL, "email" character varying NOT NULL, "nij" character varying NOT NULL, "score" integer NOT NULL DEFAULT '0', "grade" character varying(10), "correctAnswers" integer NOT NULL DEFAULT '0', "totalQuestions" integer NOT NULL DEFAULT '0', "passed" boolean NOT NULL DEFAULT false, "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_808de8f324f5d818f108a50308" ON "attempts" ("nij") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d95f2a146ce7d7e15229334c55" ON "attempts" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f1246426f57a518bb0e93b5065" ON "attempts" ("quizId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4e62f5ff74316fe49b0c3abbf5" ON "attempts" ("quizId", "email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "config_items" ("id" SERIAL NOT NULL, "group" character varying NOT NULL, "key" character varying NOT NULL, "value" text NOT NULL, "description" text, "order" integer DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdBy" character varying, "updatedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c223d8328eb8d4a08a3e28d96fa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c05c26cbb243d04b9af1957645" ON "config_items" ("group") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e78b4753da8fd726c18c645718" ON "config_items" ("group", "key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_quiz_assignments" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "quizId" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "assignedBy" character varying, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3177c4bcac8f1e1ef4d68170771" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21fbb4a3002ec38cb97edd2e28" ON "user_quiz_assignments" ("quizId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_adbac927eed1edcf0f2e6f4d48" ON "user_quiz_assignments" ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ba823798eaa4128911d924df1a" ON "user_quiz_assignments" ("userId", "quizId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_images" ("id" SERIAL NOT NULL, "questionId" integer NOT NULL, "fileName" character varying NOT NULL, "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "fileSize" integer NOT NULL, "filePath" character varying NOT NULL, "altText" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdBy" character varying, "updatedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_452fa374294113895f61b1c5e5" UNIQUE ("questionId"), CONSTRAINT "PK_d16caeb7b955311a9862d4673d8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_452fa374294113895f61b1c5e5" ON "quiz_images" ("questionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_scoring" ("id" SERIAL NOT NULL, "quizId" integer NOT NULL, "correctAnswers" integer NOT NULL DEFAULT '0', "points" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "createdBy" character varying, "updatedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_26ae872cb140ff63762bf430b8a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17fdc537077fa8163d9062e8ce" ON "quiz_scoring" ("quizId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_35d54f06d12ea78d4842aed6b6d" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_76e6a7dc4c1894250800077e79b" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_382ef7a450def2331b236e49268" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" ADD CONSTRAINT "FK_f1246426f57a518bb0e93b50656" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" ADD CONSTRAINT "FK_adbac927eed1edcf0f2e6f4d485" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" ADD CONSTRAINT "FK_21fbb4a3002ec38cb97edd2e28d" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_images" ADD CONSTRAINT "FK_452fa374294113895f61b1c5e56" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_scoring" ADD CONSTRAINT "FK_17fdc537077fa8163d9062e8cee" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_scoring" DROP CONSTRAINT "FK_17fdc537077fa8163d9062e8cee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_images" DROP CONSTRAINT "FK_452fa374294113895f61b1c5e56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" DROP CONSTRAINT "FK_21fbb4a3002ec38cb97edd2e28d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_quiz_assignments" DROP CONSTRAINT "FK_adbac927eed1edcf0f2e6f4d485"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempts" DROP CONSTRAINT "FK_f1246426f57a518bb0e93b50656"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_382ef7a450def2331b236e49268"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_76e6a7dc4c1894250800077e79b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_35d54f06d12ea78d4842aed6b6d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17fdc537077fa8163d9062e8ce"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_scoring"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_452fa374294113895f61b1c5e5"`,
    );
    await queryRunner.query(`DROP TABLE "quiz_images"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba823798eaa4128911d924df1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_adbac927eed1edcf0f2e6f4d48"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21fbb4a3002ec38cb97edd2e28"`,
    );
    await queryRunner.query(`DROP TABLE "user_quiz_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e78b4753da8fd726c18c645718"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c05c26cbb243d04b9af1957645"`,
    );
    await queryRunner.query(`DROP TABLE "config_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e62f5ff74316fe49b0c3abbf5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f1246426f57a518bb0e93b5065"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d95f2a146ce7d7e15229334c55"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_808de8f324f5d818f108a50308"`,
    );
    await queryRunner.query(`DROP TABLE "attempts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7166de359382219e40c62607be"`,
    );
    await queryRunner.query(`DROP TABLE "attempt_answers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3e9f91c0dc5e6cba50efb7d6b"`,
    );
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TYPE "public"."questions_questiontype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a222b1155419cccaa16eab009a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_369913516cd527552f3011c42f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_293b24cc3015646be6581c39ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b0d52a1b8677fd683241c1cba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_288761104b13482bf50686dd13"`,
    );
    await queryRunner.query(`DROP TABLE "quizzes"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
