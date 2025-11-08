import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1731686400000 implements MigrationInterface {
    name = 'InitialMigration1731686400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user role enum
        await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('admin', 'user')`);
        
        // Create service type enum
        await queryRunner.query(`CREATE TYPE "service_type" AS ENUM ('service-management', 'network-management', 'database-admin', 'system-admin', 'web-development', 'mobile-development', 'data-science', 'cybersecurity', 'cloud-computing', 'devops')`);
        
        // Create question type enum
        await queryRunner.query(`CREATE TYPE "question_type" AS ENUM ('multiple-choice', 'multiple-select', 'text')`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "email" varchar(255) NOT NULL,
                "name" varchar(255) NOT NULL,
                "password" varchar(255) NOT NULL,
                "role" "user_role" NOT NULL DEFAULT 'user',
                "lastLogin" timestamp NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

        // Create config_items table
        await queryRunner.query(`
            CREATE TABLE "config_items" (
                "id" SERIAL PRIMARY KEY,
                "group" varchar(255) NOT NULL,
                "key" varchar(255) NOT NULL,
                "value" text NOT NULL,
                "description" text NULL,
                "order" int NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_config_group_key" UNIQUE ("group", "key")
            )
        `);
        
        await queryRunner.query(`CREATE INDEX "IDX_config_group" ON "config_items" ("group")`);

        // Create quizzes table
        await queryRunner.query(`
            CREATE TABLE "quizzes" (
                "id" SERIAL PRIMARY KEY,
                "title" varchar(255) NOT NULL,
                "description" text NOT NULL,
                "slug" varchar(255) NULL,
                "token" varchar(255) NOT NULL,
                "serviceType" "service_type" NOT NULL,
                "locationId" int NULL,
                "passingScore" int NOT NULL DEFAULT 70,
                "questionsPerPage" int NOT NULL DEFAULT 5,
                "isActive" boolean NOT NULL DEFAULT true,
                "isPublished" boolean NOT NULL DEFAULT false,
                "expiresAt" timestamp NULL,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_quiz_token" UNIQUE ("token")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_quiz_slug" ON "quizzes" ("slug")`);
        await queryRunner.query(`CREATE INDEX "IDX_quiz_serviceType" ON "quizzes" ("serviceType")`);
        await queryRunner.query(`CREATE INDEX "IDX_quiz_locationId" ON "quizzes" ("locationId")`);

        // Create questions table
        await queryRunner.query(`
            CREATE TABLE "questions" (
                "id" SERIAL PRIMARY KEY,
                "order" int NOT NULL,
                "questionText" text NOT NULL,
                "questionType" "question_type" NOT NULL,
                "options" jsonb NULL,
                "correctAnswer" varchar(255) NOT NULL,
                "quizId" int NOT NULL
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_question_quiz_order" ON "questions" ("quizId", "order")`);

        // Create attempts table
        await queryRunner.query(`
            CREATE TABLE "attempts" (
                "id" SERIAL PRIMARY KEY,
                "quizId" int NOT NULL,
                "participantName" varchar(255) NOT NULL,
                "email" varchar(255) NOT NULL,
                "nij" varchar(255) NOT NULL,
                "score" int NOT NULL DEFAULT 0,
                "passed" boolean NOT NULL DEFAULT false,
                "startedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "completedAt" timestamp NULL,
                "submittedAt" timestamp NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_attempt_quiz_email" UNIQUE ("quizId", "email")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_attempt_quiz" ON "attempts" ("quizId")`);
        await queryRunner.query(`CREATE INDEX "IDX_attempt_email" ON "attempts" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_attempt_nij" ON "attempts" ("nij")`);

        // Create attempt_answers table
        await queryRunner.query(`
            CREATE TABLE "attempt_answers" (
                "id" SERIAL PRIMARY KEY,
                "attemptId" int NOT NULL,
                "questionId" int NOT NULL,
                "answerText" text NOT NULL,
                "selectedOption" int NULL,
                "selectedOptions" jsonb NULL
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_answer_attempt_question" ON "attempt_answers" ("attemptId", "questionId")`);

        // Create user_locations table
        await queryRunner.query(`
            CREATE TABLE "user_locations" (
                "id" SERIAL PRIMARY KEY,
                "userId" int NOT NULL,
                "locationId" int NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_user_location_userId" UNIQUE ("userId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_user_location_locationId" ON "user_locations" ("locationId")`);

        // Create quiz_images table
        await queryRunner.query(`
            CREATE TABLE "quiz_images" (
                "id" SERIAL PRIMARY KEY,
                "quizId" int NOT NULL,
                "fileName" varchar(255) NOT NULL,
                "originalName" varchar(255) NOT NULL,
                "mimeType" varchar(100) NOT NULL,
                "fileSize" int NOT NULL,
                "filePath" varchar(500) NOT NULL,
                "altText" varchar(255) NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdBy" varchar(255) NULL,
                "updatedBy" varchar(255) NULL,
                "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UQ_quiz_image_quizId" UNIQUE ("quizId")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "quizzes" ADD CONSTRAINT "FK_quiz_location" 
            FOREIGN KEY ("locationId") REFERENCES "config_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "questions" ADD CONSTRAINT "FK_question_quiz" 
            FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "attempts" ADD CONSTRAINT "FK_attempt_quiz" 
            FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_answer_attempt" 
            FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_answer_question" 
            FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_locations" ADD CONSTRAINT "FK_user_location_user" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "user_locations" ADD CONSTRAINT "FK_user_location_config" 
            FOREIGN KEY ("locationId") REFERENCES "config_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_images" ADD CONSTRAINT "FK_quiz_image_quiz" 
            FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "quiz_images" DROP CONSTRAINT "FK_quiz_image_quiz"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_location_config"`);
        await queryRunner.query(`ALTER TABLE "user_locations" DROP CONSTRAINT "FK_user_location_user"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_answer_question"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_answer_attempt"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_attempt_quiz"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_question_quiz"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_quiz_location"`);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE "quiz_images"`);
        await queryRunner.query(`DROP TABLE "user_locations"`);
        await queryRunner.query(`DROP TABLE "attempt_answers"`);
        await queryRunner.query(`DROP TABLE "attempts"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);
        await queryRunner.query(`DROP TABLE "config_items"`);
        await queryRunner.query(`DROP TABLE "users"`);
        
        // Drop enums
        await queryRunner.query(`DROP TYPE "question_type"`);
        await queryRunner.query(`DROP TYPE "service_type"`);
        await queryRunner.query(`DROP TYPE "user_role"`);
    }
}