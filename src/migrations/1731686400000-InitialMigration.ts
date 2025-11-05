import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1731686400000 implements MigrationInterface {
    name = 'InitialMigration1731686400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`email\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user',
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
                \`id\` int NOT NULL AUTO_INCREMENT,
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
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NOT NULL,
                \`slug\` varchar(255) NULL,
                \`token\` varchar(255) NOT NULL,
                \`serviceType\` enum('service-management', 'network-management', 'database-admin', 'system-admin', 'web-development', 'mobile-development', 'data-science', 'cybersecurity', 'cloud-computing', 'devops') NOT NULL,
                \`locationId\` int NULL,
                \`passingScore\` int NOT NULL DEFAULT 70,
                \`questionsPerPage\` int NOT NULL DEFAULT 5,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`isPublished\` tinyint NOT NULL DEFAULT 0,
                \`expiresAt\` timestamp NULL,
                \`createdBy\` varchar(255) NULL,
                \`updatedBy\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_quiz_token\` (\`token\`),
                INDEX \`IDX_quiz_slug\` (\`slug\`),
                INDEX \`IDX_quiz_serviceType\` (\`serviceType\`),
                INDEX \`IDX_quiz_locationId\` (\`locationId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create questions table
        await queryRunner.query(`
            CREATE TABLE \`questions\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`order\` int NOT NULL,
                \`questionText\` text NOT NULL,
                \`questionType\` enum ('multiple-choice', 'multiple-select', 'text') NOT NULL,
                \`options\` json NULL,
                \`correctAnswer\` varchar(255) NOT NULL,
                \`quizId\` int NOT NULL,
                INDEX \`IDX_question_quiz_order\` (\`quizId\`, \`order\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create attempts table
        await queryRunner.query(`
            CREATE TABLE \`attempts\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`quizId\` int NOT NULL,
                \`participantName\` varchar(255) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`nij\` varchar(255) NOT NULL,
                \`score\` int NOT NULL DEFAULT 0,
                \`passed\` tinyint NOT NULL DEFAULT 0,
                \`startedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`completedAt\` timestamp NULL,
                \`submittedAt\` timestamp NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_attempt_quiz\` (\`quizId\`),
                INDEX \`IDX_attempt_email\` (\`email\`),
                INDEX \`IDX_attempt_nij\` (\`nij\`),
                UNIQUE INDEX \`IDX_attempt_quiz_email\` (\`quizId\`, \`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create attempt_answers table
        await queryRunner.query(`
            CREATE TABLE \`attempt_answers\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`attemptId\` int NOT NULL,
                \`questionId\` int NOT NULL,
                \`answerText\` text NOT NULL,
                \`selectedOption\` int NULL,
                \`selectedOptions\` json NULL,
                INDEX \`IDX_answer_attempt_question\` (\`attemptId\`, \`questionId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create user_locations table
        await queryRunner.query(`
            CREATE TABLE \`user_locations\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`userId\` int NOT NULL,
                \`locationId\` int NOT NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`createdBy\` varchar(255) NULL,
                \`updatedBy\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_user_location_userId\` (\`userId\`),
                INDEX \`IDX_user_location_locationId\` (\`locationId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create quiz_images table
        await queryRunner.query(`
            CREATE TABLE \`quiz_images\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`quizId\` int NOT NULL,
                \`fileName\` varchar(255) NOT NULL,
                \`originalName\` varchar(255) NOT NULL,
                \`mimeType\` varchar(100) NOT NULL,
                \`fileSize\` int NOT NULL,
                \`filePath\` varchar(500) NOT NULL,
                \`altText\` varchar(255) NULL,
                \`isActive\` tinyint NOT NULL DEFAULT 1,
                \`createdBy\` varchar(255) NULL,
                \`updatedBy\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_quiz_image_quizId\` (\`quizId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE \`quizzes\` ADD CONSTRAINT \`FK_quiz_location\` 
            FOREIGN KEY (\`locationId\`) REFERENCES \`config_items\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
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

        await queryRunner.query(`
            ALTER TABLE \`user_locations\` ADD CONSTRAINT \`FK_user_location_user\` 
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`user_locations\` ADD CONSTRAINT \`FK_user_location_config\` 
            FOREIGN KEY (\`locationId\`) REFERENCES \`config_items\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE \`quiz_images\` ADD CONSTRAINT \`FK_quiz_image_quiz\` 
            FOREIGN KEY (\`quizId\`) REFERENCES \`quizzes\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE \`quiz_images\` DROP FOREIGN KEY \`FK_quiz_image_quiz\``);
        await queryRunner.query(`ALTER TABLE \`user_locations\` DROP FOREIGN KEY \`FK_user_location_config\``);
        await queryRunner.query(`ALTER TABLE \`user_locations\` DROP FOREIGN KEY \`FK_user_location_user\``);
        await queryRunner.query(`ALTER TABLE \`attempt_answers\` DROP FOREIGN KEY \`FK_answer_question\``);
        await queryRunner.query(`ALTER TABLE \`attempt_answers\` DROP FOREIGN KEY \`FK_answer_attempt\``);
        await queryRunner.query(`ALTER TABLE \`attempts\` DROP FOREIGN KEY \`FK_attempt_quiz\``);
        await queryRunner.query(`ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_question_quiz\``);
        await queryRunner.query(`ALTER TABLE \`quizzes\` DROP FOREIGN KEY \`FK_quiz_creator\``);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE \`quiz_images\``);
        await queryRunner.query(`DROP TABLE \`user_locations\``);
        await queryRunner.query(`DROP TABLE \`attempt_answers\``);
        await queryRunner.query(`DROP TABLE \`attempts\``);
        await queryRunner.query(`DROP TABLE \`questions\``);
        await queryRunner.query(`DROP TABLE \`quizzes\``);
        await queryRunner.query(`DROP TABLE \`config_items\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}