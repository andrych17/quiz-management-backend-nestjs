# Backend Best Practices

Dokumentasi best practices untuk project Quiz Backend (NestJS + TypeORM).

## 📁 Struktur Project

```
src/
├── auth/           # Authentication & Authorization
├── config/         # Database & App configurations
├── constants/      # Application constants & messages
├── controllers/    # HTTP Controllers (REST endpoints)
├── dto/            # Data Transfer Objects (validation)
├── entities/       # TypeORM Entities
├── filters/        # Exception Filters
├── interceptors/   # Response Interceptors
├── interfaces/     # TypeScript Interfaces
├── lib/            # Utility libraries (DebugLogger, utils)
├── migrations/     # Database migrations
├── seeds/          # Database seeders
├── services/       # Business Logic Services
└── shared/         # Shared modules
```

## 🔧 Coding Standards

### 1. Logging

**JANGAN** gunakan `console.log`, `console.error`, atau `console.warn` langsung.

**GUNAKAN** `DebugLogger` dari `src/lib/debug-logger.ts`:

```typescript
import { DebugLogger } from '../lib/debug-logger';

// Debug log (hanya muncul jika DEBUG_MODE=true)
DebugLogger.debug('ServiceName', 'Message', optionalData);

// Error log (selalu muncul)
DebugLogger.error('ServiceName', 'Error message', error.message);

// Warning log (selalu muncul)
DebugLogger.warn('ServiceName', 'Warning message', optionalData);

// Info log (selalu muncul)
DebugLogger.info('ServiceName', 'Info message');

// Service method logging (hanya debug mode)
DebugLogger.service('ServiceName', 'methodName', params);

// API endpoint logging (hanya debug mode)
DebugLogger.endpoint('POST', '/api/endpoint', params, query);
```

### 2. Error Handling

```typescript
// Gunakan NestJS built-in exceptions
import { 
  NotFoundException, 
  BadRequestException, 
  UnauthorizedException 
} from '@nestjs/common';

// Pattern untuk service methods
async someMethod() {
  try {
    // Business logic
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error; // Re-throw known exceptions
    }
    DebugLogger.error('ServiceName', 'Method failed', error.message);
    throw new BadRequestException(ERROR_MESSAGES.DATABASE_ERROR);
  }
}
```

### 3. Validasi DTO

Gunakan class-validator decorators:

```typescript
import { IsString, IsEmail, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;
}
```

### 4. API Response Format

Gunakan standar response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
  statusCode: number;
}
```

### 5. Pagination

```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

## 🔐 Security Best Practices

### 1. Authentication
- Gunakan JWT dengan expiration time
- Simpan token di httpOnly cookie untuk web client
- Implementasi refresh token untuk long-lived sessions

### 2. Authorization
- Gunakan `@Roles()` decorator untuk role-based access
- Implementasi guards untuk protected routes
- Validasi ownership sebelum update/delete resources

### 3. Input Validation
- Selalu validasi input dengan DTO + class-validator
- Sanitize user input untuk mencegah XSS
- Validasi file uploads (size, mime type)

### 4. Database Security
- Gunakan parameterized queries (TypeORM handles this)
- Jangan expose database errors ke client
- Limit query results untuk pagination

## 📝 Naming Conventions

### Files
- `*.controller.ts` - HTTP Controllers
- `*.service.ts` - Business Logic
- `*.entity.ts` - Database Models
- `*.dto.ts` - Data Transfer Objects
- `*.guard.ts` - Authentication/Authorization Guards
- `*.filter.ts` - Exception Filters
- `*.interceptor.ts` - Request/Response Interceptors

### Variables & Functions
- camelCase untuk variables dan functions
- PascalCase untuk classes dan interfaces
- UPPER_SNAKE_CASE untuk constants

### Database
- snake_case untuk table names dan columns
- Singular names untuk entities (User, Quiz, Question)

## 🚀 Performance Tips

### 1. Database Queries
```typescript
// Gunakan relations hanya jika diperlukan
const quiz = await this.quizRepository.findOne({
  where: { id },
  relations: ['questions'], // Only load what you need
});

// Gunakan select untuk membatasi fields
const users = await this.userRepository.find({
  select: ['id', 'name', 'email'],
  where: { isActive: true },
});
```

### 2. Caching
- Cache config/static data yang jarang berubah
- Gunakan Redis untuk session storage di production

### 3. File Uploads
- Upload langsung ke cloud storage (R2/S3)
- Validasi dan resize images sebelum upload
- Gunakan streaming untuk file besar

## 🧪 Testing Guidelines

### Unit Tests
```typescript
// *.spec.ts files
describe('QuizService', () => {
  it('should create a quiz', async () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
// test/*.e2e-spec.ts
describe('QuizController (e2e)', () => {
  it('/api/quizzes (POST)', () => {
    // Test implementation
  });
});
```

## 📦 Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=quiz_db
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=http://localhost:3000

# Cloud Storage
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET_NAME=

# Optional
DEBUG_MODE=false
ENABLE_TINYURL=true
TINYURL_API_TOKEN=
```

## 🔄 Git Workflow

1. Feature branches dari `main`
2. Naming: `feature/`, `fix/`, `refactor/`
3. Pull request sebelum merge
4. Squash commits saat merge

## 📚 Referensi

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Class Validator](https://github.com/typestack/class-validator)
