import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1731686400000 implements MigrationInterface {
    name = 'InitialMigration1731686400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` varchar(36) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`role\` enum ('admin', 'superadmin') NOT NULL DEFAULT 'admin',
                \`lastLogin\` timestamp NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`createdBy\` varchar(255) NULL,
                \`updatedBy\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create config_items table
        await queryRunner.query(`
            CREATE TABLE \`config_items\` (
                \`id\` varchar(36) NOT NULL,
                \`group\` varchar(255) NOT NULL,
                \`key\` varchar(255) NOT NULL,
                \`value\` text NOT NULL,
                \`description\` text NULL,
                \`order\` int NULL DEFAULT 0,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`createdBy\` varchar(255) NULL,
                \`updatedBy\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_config_group\` (\`group\`),
                UNIQUE INDEX \`IDX_config_group_key\` (\`group\`, \`key\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create quizzes table
        await queryRunner.query(`
            CREATE TABLE \`quizzes\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`slug\` varchar(255) NULL,
                \`linkToken\` varchar(255) NOT NULL,
                \`isPublished\` tinyint NOT NULL DEFAULT 0,
                \`expiresAt\` timestamp NULL,
                \`passingScore\` int NOT NULL DEFAULT 1,
                \`questionsPerPage\` int NOT NULL DEFAULT 5,
                \`createdBy\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_quiz_linkToken\` (\`linkToken\`),
                INDEX \`IDX_quiz_slug\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create questions table
        await queryRunner.query(`
            CREATE TABLE \`questions\` (
                \`id\` varchar(36) NOT NULL,
                \`order\` int NOT NULL,
                \`questionText\` text NOT NULL,
                \`questionType\` enum ('multiple-choice', 'multiple-select', 'text') NOT NULL,
                \`options\` json NULL,
                \`correctAnswer\` varchar(255) NOT NULL,
                \`quizId\` varchar(36) NOT NULL,
                INDEX \`IDX_question_quiz_order\` (\`quizId\`, \`order\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create attempts table
        await queryRunner.query(`
            CREATE TABLE \`attempts\` (
                \`id\` varchar(36) NOT NULL,
                \`quizId\` varchar(36) NOT NULL,
                \`participantName\` varchar(255) NOT NULL,
                \`nij\` varchar(255) NOT NULL,
                \`score\` int NOT NULL DEFAULT 0,
                \`passed\` tinyint NOT NULL DEFAULT 0,
                \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_attempt_quiz\` (\`quizId\`),
                INDEX \`IDX_attempt_submitted\` (\`submittedAt\`),
                UNIQUE INDEX \`IDX_attempt_quiz_nij\` (\`quizId\`, \`nij\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create attempt_answers table
        await queryRunner.query(`
            CREATE TABLE \`attempt_answers\` (
                \`id\` varchar(36) NOT NULL,
                \`attemptId\` varchar(36) NOT NULL,
                \`questionId\` varchar(36) NOT NULL,
                \`answerText\` text NOT NULL,
                \`selectedOption\` int NULL,
                \`selectedOptions\` json NULL,
                INDEX \`IDX_answer_attempt_question\` (\`attemptId\`, \`questionId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE \`quizzes\` ADD CONSTRAINT \`FK_quiz_creator\` 
            FOREIGN KEY (\`createdBy\`) REFERENCES \`users\`(\`email\`) ON DELETE RESTRICT ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_question_quiz\` 
            FOREIGN KEY (\`quizId\`) REFERENCES \`quizzes\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`attempts\` ADD CONSTRAINT \`FK_attempt_quiz\` 
            FOREIGN KEY (\`quizId\`) REFERENCES \`quizzes\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`attempt_answers\` ADD CONSTRAINT \`FK_answer_attempt\` 
            FOREIGN KEY (\`attemptId\`) REFERENCES \`attempts\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`attempt_answers\` ADD CONSTRAINT \`FK_answer_question\` 
            FOREIGN KEY (\`questionId\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE \`attempt_answers\` DROP FOREIGN KEY \`FK_answer_question\``);
        await queryRunner.query(`ALTER TABLE \`attempt_answers\` DROP FOREIGN KEY \`FK_answer_attempt\``);
        await queryRunner.query(`ALTER TABLE \`attempts\` DROP FOREIGN KEY \`FK_attempt_quiz\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_question_quiz\``);
        await queryRunner.query(`ALTER TABLE \`quizzes\` DROP FOREIGN KEY \`FK_quiz_creator\``);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE \`attempt_answers\``);
        await queryRunner.query(`DROP TABLE \`attempts\``);
        await queryRunner.query(`DROP TABLE \`questions\``);
        await queryRunner.query(`DROP TABLE \`quizzes\``);
        await queryRunner.query(`DROP TABLE \`config_items\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}