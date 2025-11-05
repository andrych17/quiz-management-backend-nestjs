# Quiz Application Backend API# Quiz Application Backend API<p align="center">



A comprehensive NestJS backend API for a quiz management system with full CRUD operations, JWT authentication, Swagger documentation, and TypeORM with MySQL.  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>



## FeaturesA comprehensive NestJS backend API for a quiz management system with full CRUD operations, Swagger documentation, and TypeORM with MySQL.</p>



- ✅ **JWT Authentication** with login, register, and token refresh

- ✅ **Role-based Authorization** (admin, user roles)

- ✅ **Complete CRUD APIs** for all entities (Users, Quizzes, Questions, Attempts, Config)## Features[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

- ✅ **Swagger Documentation** at `/api/docs`

- ✅ **TypeORM with MySQL** database integration[circleci-url]: https://circleci.com/gh/nestjs/nest

- ✅ **Password Security** with bcrypt hashing

- ✅ **Location Management** through config items- ✅ **Complete CRUD APIs** for all entities (Users, Quizzes, Questions, Attempts, Config)

- ✅ **Quiz Image Support** with one-to-one relationship

- ✅ **Auto-generated Quiz Tokens** and slugs- ✅ **Swagger Documentation** at `/api/docs`  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

- ✅ **Score Calculation** and attempt tracking

- ✅ **Data Export** functionality for quiz results- ✅ **TypeORM with MySQL** database integration    <p align="center">

- ✅ **Input Validation** with class-validator

- ✅ **Error Handling** with standardized error messages- ✅ **User Authentication** with bcrypt password hashing<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>

- ✅ **Environment Configuration** with .env support

- ✅ **Location Management** through config items<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

## Tech Stack

- ✅ **Quiz Image Support** with one-to-one relationship<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>

- **Framework**: NestJS 11.x

- **Database**: MySQL with TypeORM 0.3.x- ✅ **Auto-generated Quiz Tokens** and slugs<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>

- **Authentication**: JWT with Passport.js

- **Documentation**: Swagger/OpenAPI- ✅ **Score Calculation** and attempt tracking<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>

- **Validation**: class-validator & class-transformer

- **Security**: bcrypt for password hashing- ✅ **Data Export** functionality for quiz results<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>

- **Environment**: dotenv configuration

- ✅ **Input Validation** with class-validator<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>

## Database Schema

- ✅ **Error Handling** with standardized error messages  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>

### Entities

- ✅ **Environment Configuration** with .env support    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>

1. **Users** - User management with roles, authentication, and location assignment

2. **Quizzes** - Quiz creation with tokens, slugs, and expiration  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>

3. **Questions** - Multiple choice questions with order management

4. **Attempts** - Quiz attempts with scoring and timing## Tech Stack</p>

5. **AttemptAnswers** - Individual answers with correctness tracking

6. **ConfigItems** - Configuration management (locations, settings)  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)

7. **UserLocations** - User location assignments

8. **QuizImages** - Quiz image attachments- **Framework**: NestJS 11.x  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->



## Setup Instructions- **Database**: MySQL with TypeORM 0.3.x



### 1. Environment Configuration- **Documentation**: Swagger/OpenAPI## Description



Create a `.env` file in the root directory:- **Validation**: class-validator & class-transformer



```env- **Authentication**: bcrypt for password hashing[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

# Database Configuration

DB_HOST=localhost- **Environment**: dotenv configuration

DB_PORT=3306

DB_USERNAME=root## Project setup

DB_PASSWORD=your_password

DB_DATABASE=quiz_db## Database Schema



# Application Configuration```bash

APP_PORT=3001

NODE_ENV=development### Entities$ npm install



# JWT Configuration```

JWT_SECRET=your-super-secret-jwt-key-change-in-production

JWT_EXPIRES_IN=24h1. **Users** - User management with roles and location assignment

JWT_REFRESH_EXPIRES_IN=7d

2. **Quizzes** - Quiz creation with tokens, slugs, and expiration## Compile and run the project

# URLs (for CORS and constants)

FRONTEND_URL=http://localhost:30003. **Questions** - Multiple choice questions with order management

BACKEND_URL=http://localhost:3001

API_BASE_URL=http://localhost:3001/api4. **Attempts** - Quiz attempts with scoring and timing```bash

```

5. **AttemptAnswers** - Individual answers with correctness tracking# development

### 2. Database Setup

6. **ConfigItems** - Configuration management (locations, settings)$ npm run start

```bash

# Create MySQL database7. **UserLocations** - User location assignments

mysql -u root -p

CREATE DATABASE quiz_db;8. **QuizImages** - Quiz image attachments# watch mode

exit

$ npm run start:dev

# Install dependencies

npm install## Setup Instructions



# Run migrations to create tables# production mode

npm run migration:run

### 1. Environment Configuration$ npm run start:prod

# Seed initial data

npm run seed```

```

Create a `.env` file in the root directory:

### 3. Start the Application

## Run tests

```bash

# Development mode```env

npm run start:dev

# Database Configuration```bash

# Production mode

npm run buildDB_HOST=localhost# unit tests

npm run start:prod

```DB_PORT=3306$ npm run test



### 4. Access DocumentationDB_USERNAME=root



- **Swagger API Docs**: http://localhost:3001/api/docsDB_PASSWORD=your_password# e2e tests

- **Application**: http://localhost:3001

DB_DATABASE=quiz_db$ npm run test:e2e

## API Endpoints



### Authentication

# Application Configuration# test coverage

| Method | Endpoint | Description |

|--------|----------|-------------|APP_PORT=3001$ npm run test:cov

| POST | `/api/auth/login` | User login |

| POST | `/api/auth/register` | User registration |NODE_ENV=development```

| POST | `/api/auth/refresh` | Refresh access token |

| GET | `/api/auth/profile` | Get user profile |

| POST | `/api/auth/change-password` | Change password |

| POST | `/api/auth/logout` | User logout |# URLs (for CORS and constants)## Deployment



### User ManagementFRONTEND_URL=http://localhost:3000



| Method | Endpoint | Description | Auth Required |BACKEND_URL=http://localhost:3001When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

|--------|----------|-------------|---------------|

| POST | `/api/users` | Create new user | No |API_BASE_URL=http://localhost:3001/api

| GET | `/api/users` | Get all users (with pagination) | Admin only |

| GET | `/api/users/:id` | Get user by ID | JWT |```If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

| PUT | `/api/users/:id` | Update user | JWT |

| DELETE | `/api/users/:id` | Delete user | JWT |

| GET | `/api/users/:id/quizzes` | Get user's quiz attempts | JWT |

| GET | `/api/users/:id/attempts` | Get user's attempt history | JWT |### 2. Database Setup```bash



### Quiz Management$ npm install -g @nestjs/mau



| Method | Endpoint | Description | Auth Required |```bash$ mau deploy

|--------|----------|-------------|---------------|

| POST | `/api/quizzes` | Create new quiz | Admin only |# Create MySQL database```

| GET | `/api/quizzes` | Get all quizzes (with filters) | No |

| GET | `/api/quizzes/:id` | Get quiz by ID | No |mysql -u root -p

| PUT | `/api/quizzes/:id` | Update quiz | Admin only |

| DELETE | `/api/quizzes/:id` | Delete quiz | Admin only |CREATE DATABASE quiz_db;With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

| GET | `/api/quizzes/:id/questions` | Get quiz questions | No |

| GET | `/api/quizzes/:id/attempts` | Get quiz attempts | JWT |exit

| POST | `/api/quizzes/:id/duplicate` | Duplicate quiz | Admin only |

| PUT | `/api/quizzes/:id/publish` | Publish quiz | Admin only |## Resources

| PUT | `/api/quizzes/:id/unpublish` | Unpublish quiz | Admin only |

# Install dependencies

### Question Management

npm installCheck out a few resources that may come in handy when working with NestJS:

| Method | Endpoint | Description | Auth Required |

|--------|----------|-------------|---------------|

| POST | `/api/questions` | Create new question | Admin only |

| GET | `/api/questions` | Get all questions (with filters) | No |# Run migrations to create tables- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.

| GET | `/api/questions/:id` | Get question by ID | No |

| PUT | `/api/questions/:id` | Update question | Admin only |npm run migration:run- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

| DELETE | `/api/questions/:id` | Delete question | Admin only |

| PUT | `/api/questions/quiz/:quizId/reorder` | Reorder questions | Admin only |- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).



### Quiz Attempts# Seed initial data- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.



| Method | Endpoint | Description | Auth Required |npm run seed- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).

|--------|----------|-------------|---------------|

| POST | `/api/attempts` | Submit quiz attempt | JWT |```- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).

| GET | `/api/attempts` | Get all attempts (with filters) | JWT |

| GET | `/api/attempts/:id` | Get attempt by ID | JWT |- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).

| PUT | `/api/attempts/:id` | Update attempt | JWT |

| DELETE | `/api/attempts/:id` | Delete attempt | JWT |### 3. Start the Application- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

| GET | `/api/attempts/:id/answers` | Get attempt answers | JWT |

| GET | `/api/attempts/quiz/:quizId/export` | Export quiz results | Admin only |



### Configuration```bash## Support



| Method | Endpoint | Description | Auth Required |# Development mode

|--------|----------|-------------|---------------|

| POST | `/api/config` | Create config item | Admin only |npm run start:devNest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

| GET | `/api/config` | Get all config items | No |

| GET | `/api/config/locations` | Get location config items | No |

| GET | `/api/config/:id` | Get config item by ID | No |

| PUT | `/api/config/:id` | Update config item | Admin only |# Production mode## Stay in touch

| DELETE | `/api/config/:id` | Delete config item | Admin only |

| GET | `/api/config/group/:group` | Get items by group | No |npm run build



## Request/Response Examplesnpm run start:prod- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)



### Login```- Website - [https://nestjs.com](https://nestjs.com/)



```bash- Twitter - [@nestframework](https://twitter.com/nestframework)

POST /api/auth/login

Content-Type: application/json### 4. Access Documentation



{## License

  "email": "john@example.com",

  "password": "password123"- **Swagger API Docs**: http://localhost:3001/api/docs

}

```- **Application**: http://localhost:3001Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).



**Response:**

```json## API Endpoints

{

  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",### Authentication

  "token_type": "Bearer",

  "expires_in": 86400,| Method | Endpoint | Description |

  "user": {|--------|----------|-------------|

    "id": 1,| POST | `/api/auth/login` | User login |

    "name": "John Doe",| POST | `/api/auth/register` | User registration |

    "email": "john@example.com",| POST | `/api/auth/refresh` | Refresh access token |

    "role": "user"| GET | `/api/auth/profile` | Get user profile |

  }| POST | `/api/auth/change-password` | Change password |

}| POST | `/api/auth/logout` | User logout |

```

### Authentication & Users

### Register

| Method | Endpoint | Description |

```bash|--------|----------|-------------|

POST /api/auth/register| POST | `/api/users` | Create new user |

Content-Type: application/json| GET | `/api/users` | Get all users (with pagination) |

| GET | `/api/users/:id` | Get user by ID |

{| PUT | `/api/users/:id` | Update user |

  "name": "Jane Doe",| DELETE | `/api/users/:id` | Delete user |

  "email": "jane@example.com",| GET | `/api/users/:id/quizzes` | Get user's quiz attempts |

  "password": "password123"| GET | `/api/users/:id/attempts` | Get user's attempt history |

}

```### Quiz Management



### Authenticated Request| Method | Endpoint | Description |

|--------|----------|-------------|

```bash| POST | `/api/quizzes` | Create new quiz |

GET /api/auth/profile| GET | `/api/quizzes` | Get all quizzes (with filters) |

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...| GET | `/api/quizzes/:id` | Get quiz by ID |

```| PUT | `/api/quizzes/:id` | Update quiz |

| DELETE | `/api/quizzes/:id` | Delete quiz |

### Create Quiz (Admin only)| GET | `/api/quizzes/:id/questions` | Get quiz questions |

| GET | `/api/quizzes/:id/attempts` | Get quiz attempts |

```bash| POST | `/api/quizzes/:id/duplicate` | Duplicate quiz |

POST /api/quizzes| PUT | `/api/quizzes/:id/publish` | Publish quiz |

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...| PUT | `/api/quizzes/:id/unpublish` | Unpublish quiz |

Content-Type: application/json

### Question Management

{

  "title": "JavaScript Basics",| Method | Endpoint | Description |

  "description": "Test your knowledge of JavaScript fundamentals",|--------|----------|-------------|

  "isActive": true,| POST | `/api/questions` | Create new question |

  "expiresAt": "2024-12-31T23:59:59.000Z"| GET | `/api/questions` | Get all questions (with filters) |

}| GET | `/api/questions/:id` | Get question by ID |

```| PUT | `/api/questions/:id` | Update question |

| DELETE | `/api/questions/:id` | Delete question |

### Submit Quiz Attempt| PUT | `/api/questions/quiz/:quizId/reorder` | Reorder questions |



```bash### Quiz Attempts

POST /api/attempts

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...| Method | Endpoint | Description |

Content-Type: application/json|--------|----------|-------------|

| POST | `/api/attempts` | Submit quiz attempt |

{| GET | `/api/attempts` | Get all attempts (with filters) |

  "quizId": 1,| GET | `/api/attempts/:id` | Get attempt by ID |

  "userId": 1,| PUT | `/api/attempts/:id` | Update attempt |

  "answers": [| DELETE | `/api/attempts/:id` | Delete attempt |

    {| GET | `/api/attempts/:id/answers` | Get attempt answers |

      "questionId": 1,| GET | `/api/attempts/quiz/:quizId/export` | Export quiz results |

      "answer": "Paris"

    },### Configuration

    {

      "questionId": 2,| Method | Endpoint | Description |

      "answer": "London"|--------|----------|-------------|

    }| POST | `/api/config` | Create config item |

  ]| GET | `/api/config` | Get all config items |

}| GET | `/api/config/locations` | Get location config items |

```| GET | `/api/config/:id` | Get config item by ID |

| PUT | `/api/config/:id` | Update config item |

## Authentication & Authorization| DELETE | `/api/config/:id` | Delete config item |

| GET | `/api/config/group/:group` | Get items by group |

### JWT Token Usage

## Request/Response Examples

Include the JWT token in the Authorization header:

```### Login

Authorization: Bearer YOUR_JWT_TOKEN

``````bash

POST /api/auth/login

### Role-based Access ControlContent-Type: application/json



- **Public**: Quiz listing, questions (for taking quizzes){

- **User**: Profile management, quiz attempts, view own results  "email": "john@example.com",

- **Admin**: Full CRUD access to quizzes, questions, users, and configurations  "password": "password123"

}

### Token Management```



- **Access Token**: Short-lived (24h default), used for API requests**Response:**

- **Refresh Token**: Longer-lived (7d default), used to get new access tokens```json

- **Token Expiration**: Automatic handling with refresh endpoint{

  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

## Database Commands  "token_type": "Bearer",

  "expires_in": 86400,

```bash  "user": {

# Generate new migration    "id": 1,

npm run migration:generate -- src/migrations/MigrationName    "name": "John Doe",

    "email": "john@example.com",

# Create empty migration    "role": "user"

npm run migration:create -- src/migrations/MigrationName  }

}

# Run migrations```

npm run migration:run

### Register

# Revert last migration

npm run migration:revert```bash

POST /api/auth/register

# Seed databaseContent-Type: application/json

npm run seed

```{

  "name": "Jane Doe",

## Error Handling  "email": "jane@example.com",

  "password": "password123"

The API uses standardized error responses:}

```

```json

{### Authenticated Request

  "statusCode": 401,

  "message": "Unauthorized access",```bash

  "error": "Unauthorized"GET /api/auth/profile

}Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

``````



Common HTTP status codes:### Create User

- `200` - Success

- `201` - Created```bash

- `400` - Bad Request (validation errors)POST /api/users

- `401` - Unauthorized (invalid/missing token)Content-Type: application/json

- `403` - Forbidden (insufficient permissions)

- `404` - Not Found{

- `409` - Conflict (duplicate entries)  "name": "John Doe",

- `500` - Internal Server Error  "email": "john@example.com",

  "password": "password123",

## Security Features  "role": "user",

  "locationId": 1

- **Password Hashing**: bcrypt with salt rounds}

- **JWT Security**: Configurable secret and expiration```

- **Role-based Access**: Admin and user role separation

- **Input Validation**: DTOs with class-validator### Create Quiz

- **CORS Protection**: Configurable origin whitelist

- **Environment Variables**: Sensitive data in .env files```bash

POST /api/quizzes

## DevelopmentContent-Type: application/json



### File Structure{

  "title": "JavaScript Basics",

```  "description": "Test your knowledge of JavaScript fundamentals",

src/  "isActive": true,

├── auth/               # Authentication (strategies, guards, module)  "expiresAt": "2024-12-31T23:59:59.000Z"

├── constants/          # Application constants}

├── controllers/        # API controllers```

├── dto/               # Data Transfer Objects

├── entities/          # TypeORM entities### Create Question

├── lib/               # Utility functions

├── migrations/        # Database migrations```bash

├── services/          # Business logicPOST /api/questions

├── seeds/             # Database seedersContent-Type: application/json

└── config/            # Configuration files

```{

  "quizId": 1,

## Swagger Documentation  "question": "What is the capital of France?",

  "options": ["Paris", "London", "Berlin", "Madrid"],

Once the application is running, visit:  "correctAnswer": "Paris",

- **Swagger UI**: http://localhost:3001/api/docs  "order": 1

}

The Swagger documentation provides:```

- Interactive API testing with JWT authentication

- Request/response schemas for all endpoints### Submit Quiz Attempt

- Authentication examples and token usage

- Error code documentation```bash

- Complete endpoint listings with authorization requirementsPOST /api/attempts

Content-Type: application/json

## Production Deployment

{

1. Set `NODE_ENV=production` in `.env`  "quizId": 1,

2. Configure strong JWT secret: `JWT_SECRET=your-strong-secret`  "userId": 1,

3. Set up production database with proper credentials  "answers": [

4. Configure CORS for production frontend URLs    {

5. Run `npm run build`      "questionId": 1,

6. Run migrations: `npm run migration:run`      "answer": "Paris"

7. Start with `npm run start:prod`    },

    {

## Contributing      "questionId": 2,

      "answer": "London"

1. Fork the repository    }

2. Create feature branch: `git checkout -b feature/new-feature`  ]

3. Commit changes: `git commit -am 'Add new feature'`}

4. Push to branch: `git push origin feature/new-feature````

5. Submit pull request

## Database Commands

## License

```bash

This project is licensed under the MIT License.# Generate new migration
npm run migration:generate -- src/migrations/MigrationName

# Create empty migration
npm run migration:create -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed database
npm run seed
```

## Error Handling

The API uses standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Development

### File Structure

```
src/
├── constants/          # Application constants
├── controllers/        # API controllers
├── dto/               # Data Transfer Objects
├── entities/          # TypeORM entities
├── lib/               # Utility functions
├── migrations/        # Database migrations
├── services/          # Business logic
├── seeds/             # Database seeders
└── config/            # Configuration files
```

## Swagger Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs

The Swagger documentation provides:
- Interactive API testing
- Request/response schemas
- Authentication examples
- Error code documentation
- Complete endpoint listings

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

This project is licensed under the MIT License.