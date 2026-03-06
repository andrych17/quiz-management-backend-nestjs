# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-03-06

### Fixed
- `deleteImageIds` added to `UpdateQuizDto` — image deletions during question edit now correctly forwarded to the service layer
- `deleteImageIds` processed in `QuizService.update()` loop — deleted images are now physically removed from R2 storage and database
- `QuestionService.remove()` — safe-delete now uses active attempt check instead of historical attempt count
- Quiz edit validation (`questions` & `scoringTemplates`) now blocks only when quiz **is actively being taken** (`submittedAt IS NULL`), no longer blocks after all attempts have been submitted

## [1.2.0] - 2026-03-06

### Added
- Storage provider abstraction: support R2 (Cloudflare) and Local storage via `STORAGE_PROVIDER` env
- `GET /api/files/*path` endpoint to proxy private files from storage backend
- Detailed error messages with storage provider prefix (`[r2]` / `[local]`) for easier debugging
- `GET /api/version` endpoint to check app version and runtime info
- `GET /api/changelog` endpoint to view this changelog

### Changed
- Error messages on file not found now include storage provider, bucket/path, and object key
- Storage config info included in 500 error responses for faster diagnosis

## [1.1.0] - 2026-02-20

### Added
- Multi-image support per question via `imagesBase64[]` in question DTO
- `sequence` field on quiz images for ordering
- Dashboard endpoint with attempt statistics
- User quiz assignment management endpoints
- Idempotency support via `X-Idempotency-Key` header

### Changed
- Removed essay question type
- Removed `filePath` column from quiz_images (replaced by `objectKey` / `fileName`)
- Removed unique constraint from quiz_images to allow multiple images per question

### Migration
- `RemoveEssayQuestionType`
- `RemoveFilePathFromQuizImages`
- `AddSequenceToQuizImages`
- `RemoveUniqueConstraintFromQuizImages`

## [1.0.0] - 2026-01-15

### Added
- Initial release
- Authentication (JWT + local strategy) with role-based access control
- Quiz CRUD with scoring configuration
- Question CRUD with single image upload
- Attempt lifecycle: start → answer → submit
- Public quiz endpoint (no auth required) via token/slug
- Rate limiting middleware
- Global exception filter with standardized API response format
- Database migrations via TypeORM

### Migration
- `InitialMigration`
- `AddStartEndDateTimeToAttempts`
- `AddServoNumberToAttempts`
