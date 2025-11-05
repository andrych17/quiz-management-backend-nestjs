# Quiz App Backend - NestJS API

Backend API for the Quiz Application built with NestJS, TypeORM, and MySQL.

## Features

- 🔐 User management with role-based access (admin, superadmin)
- 📝 Quiz management with multiple question types
- 📊 Attempt tracking and scoring
- ⚙️ Configuration management
- 🗄️ MySQL database with TypeORM
- 🔄 Database migrations and seeding

## Database Schema

### Entities

1. **Users** - System administrators
2. **Quizzes** - Quiz definitions with metadata
3. **Questions** - Quiz questions (multiple-choice, multiple-select, text)
4. **Attempts** - User quiz submissions
5. **AttemptAnswers** - Individual question answers
6. **ConfigItems** - Application configuration

### Relationships

- Users → Quizzes (1:many - creator relationship)
- Quizzes → Questions (1:many)
- Quizzes → Attempts (1:many)
- Attempts → AttemptAnswers (1:many)
- Questions → AttemptAnswers (1:many)

## Setup

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database settings:
```env
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=quiz_db
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=true

APP_PORT=3001
NODE_ENV=development
```

3. Create database:
```sql
CREATE DATABASE quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Run migrations:
```bash
npm run migration:run
```

5. Seed database (optional):
```bash
npm run seed
```

## Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug mode

# Building
npm run build              # Build the application
npm run start:prod         # Start production build

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed              # Run database seeder

# Testing
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Test coverage
```

### API Endpoints

The API will be available at `http://localhost:3001` by default.

**Health Check:**
- `GET /` - Application health check

## Database Migration Guide

### Creating New Migrations

1. Modify your entities in `src/entities/`
2. Generate migration:
```bash
npm run migration:generate src/migrations/YourMigrationName
```

3. Review the generated migration file
4. Run the migration:
```bash
npm run migration:run
```

### Manual Migration Creation

```bash
npm run migration:create src/migrations/YourMigrationName
```

### Reverting Migrations

```bash
npm run migration:revert
```

## Seeding Data

The seeder includes:
- 3 default users (superadmin, admin, moderator)
- 4 configuration items
- 2 sample quizzes with questions
- 3 sample attempts

Run the seeder:
```bash
npm run seed
```

## Project Structure

```
src/
├── config/           # Configuration files
│   └── database.config.ts
├── entities/         # TypeORM entities
│   ├── user.entity.ts
│   ├── quiz.entity.ts
│   ├── question.entity.ts
│   ├── attempt.entity.ts
│   ├── attempt-answer.entity.ts
│   └── config-item.entity.ts
├── migrations/       # Database migrations
├── seeds/           # Database seeders
├── app.module.ts    # Main application module
└── main.ts         # Application bootstrap
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | MySQL host | `localhost` |
| `DATABASE_PORT` | MySQL port | `3306` |
| `DATABASE_USERNAME` | MySQL username | `root` |
| `DATABASE_PASSWORD` | MySQL password | `` |
| `DATABASE_NAME` | Database name | `quiz_db` |
| `DATABASE_SYNCHRONIZE` | Auto-sync schema | `false` |
| `DATABASE_LOGGING` | Enable SQL logging | `true` |
| `APP_PORT` | Application port | `3001` |
| `NODE_ENV` | Environment | `development` |

## Production Deployment

1. Set `NODE_ENV=production`
2. Set `DATABASE_SYNCHRONIZE=false`
3. Set `DATABASE_LOGGING=false`
4. Run migrations before deployment
5. Use a process manager like PM2

## License

This project is licensed under the UNLICENSED License.