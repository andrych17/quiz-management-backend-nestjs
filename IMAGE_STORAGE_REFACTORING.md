# Image Storage Refactoring - Best Practice Implementation

**Date**: January 23, 2026  
**Status**: ✅ Completed

## 📋 Overview

Refactored image storage implementation to follow cloud storage best practices:
- **Removed** `filePath` column from database
- **Generate** download URLs dynamically on-the-fly
- **Added** multi-image support for future frontend flexibility

---

## 🎯 Why This Change?

### ❌ Previous Implementation (Bad Practice)
```typescript
// Database stored full URLs
{
  fileName: "question_5/1705xxx_abc123_image.jpg",
  filePath: "http://localhost:3001/api/files/download/question_5/1705xxx_abc123_image.jpg"  // ❌ BAD
}
```

**Problems:**
- ❌ URL hardcoded in database
- ❌ Cannot change domain/backend URL without DB migration
- ❌ No flexibility for signed URLs or access control
- ❌ Database bloat with redundant URL data

### ✅ New Implementation (Best Practice)
```typescript
// Database stores only metadata
{
  fileName: "question/5/1705xxx_abc123_image.jpg",  // R2 object key
  originalName: "image.jpg",
  mimeType: "image/jpeg",
  fileSize: 102400,
  altText: "Question diagram"
  // No filePath!
}

// URLs generated on-the-fly in API responses
{
  ...imageMetadata,
  downloadUrl: "/api/files/download/question/5/1705xxx_abc123_image.jpg"  // ✅ GOOD
}
```

**Benefits:**
- ✅ Database stores only essential metadata
- ✅ URLs generated dynamically at runtime
- ✅ Easy to change backend URL/domain
- ✅ Ready for signed URLs with expiration
- ✅ Flexible for access control per file

---

## 🔧 Technical Changes

### 1. Database Schema

**Entity: `QuizImage`**
```typescript
// REMOVED
@Column()
filePath: string;  // ❌ Deleted

// KEPT
@Column() fileName: string;        // R2 object key (e.g., "question/5/timestamp_random_image.jpg")
@Column() originalName: string;     // Original upload filename
@Column() mimeType: string;         // image/jpeg, image/png, etc.
@Column() fileSize: number;         // Size in bytes
@Column({ nullable: true }) altText: string;  // Accessibility text
```

**Migration Generated:**
```bash
src/migrations/1769175791344-RemoveFilePathFromQuizImages.ts
```

Run migration:
```bash
npm run migration:run
```

---

### 2. File Upload Service

**Updated Return Types:**

```typescript
// Before
async uploadFromBase64(...): Promise<{
  fileName: string;
  filePath: string;  // ❌ Removed
  fileSize: number;
  mimeType: string;
  originalName: string;
}>

// After
async uploadFromBase64(...): Promise<{
  fileName: string;  // Only R2 object key
  fileSize: number;
  mimeType: string;
  originalName: string;
}>
```

**Changes:**
- ❌ Removed `filePath` from return values
- ✅ Only return `fileName` (R2 object key)
- Service no longer generates URLs

---

### 3. Question & Quiz Services

**Image Retrieval - Generate URLs Dynamically:**

```typescript
// In all retrieve methods (findOne, getQuestions, findByTokenPublic)
images: images.map((img) => ({
  id: img.id,
  fileName: img.fileName,
  originalName: img.originalName,
  mimeType: img.mimeType,
  fileSize: img.fileSize,
  altText: img.altText,
  downloadUrl: `/api/files/download/${img.fileName}`,  // ✅ Generated on-the-fly
}))
```

**Image Creation - Save Only Metadata:**

```typescript
const imageRecord = this.quizImageRepository.create({
  questionId: savedQuestion.id,
  fileName: fileInfo.fileName,  // R2 object key
  originalName: fileInfo.originalName,
  mimeType: fileInfo.mimeType,
  fileSize: fileInfo.fileSize,
  altText: imageAltText,
  isActive: true,
  // No filePath!
});
```

---

### 4. File Path Structure in R2

**Path Pattern:**
```
question/{questionId}/{timestamp}_{random}_{filename}
```

**Examples:**
```
question/516/1705926438123_abc123_diagram.jpg
question/517/1705926439456_xyz789_chart.png
question/518/1705926440789_def456_screenshot.jpg
```

**R2 Storage Service:**
```typescript
private generateObjectKey(fileName: string, prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedPrefix = prefix.replace(/[^a-z0-9\/]/gi, '_');  // ✅ Allow '/' for nested paths
  const sanitizedFileName = fileName.replace(/[^a-z0-9.]/gi, '_');
  
  return `${sanitizedPrefix}/${timestamp}_${random}_${sanitizedFileName}`;
}
```

---

## 🚀 Multi-Image Support

Added support for multiple images per question (frontend-ready).

### API Changes

**1. Question DTOs:**

```typescript
// CreateQuestionDto & UpdateQuestionDto
@ApiPropertyOptional({
  description: 'Array of base64 images for multi-image support (max 5MB each)',
  type: 'array',
})
imagesBase64?: Array<{
  imageBase64: string;      // Base64 encoded image
  originalName?: string;    // Optional filename
  altText?: string;         // Optional alt text
}>;
```

**2. Quiz Update DTO:**

```typescript
questions?: Array<{
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer?: string;
  // ... other fields
  imagesBase64?: Array<{     // ✅ Multi-image support
    imageBase64: string;
    originalName?: string;
    altText?: string;
  }>;
}>;
```

### Usage Examples

**Single Image (Backward Compatible):**
```json
{
  "questionText": "What is this?",
  "questionType": "multiple-choice",
  "options": ["A", "B", "C"],
  "correctAnswer": "A",
  "imageBase64": "data:image/png;base64,iVBORw0KG...",
  "imageOriginalName": "diagram.png",
  "imageAltText": "Process diagram"
}
```

**Multiple Images (New Feature):**
```json
{
  "questionText": "Analyze these screenshots",
  "questionType": "multiple-choice",
  "options": ["A", "B", "C"],
  "correctAnswer": "A",
  "imagesBase64": [
    {
      "imageBase64": "data:image/png;base64,iVBORw0KG...",
      "originalName": "screenshot1.png",
      "altText": "First screenshot"
    },
    {
      "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
      "originalName": "screenshot2.jpg",
      "altText": "Second screenshot"
    }
  ]
}
```

### Response Format

```json
{
  "id": 516,
  "questionText": "Analyze these screenshots",
  "questionType": "multiple-choice",
  "options": ["A", "B", "C"],
  "correctAnswer": "A",
  "images": [
    {
      "id": 1,
      "fileName": "question/516/1705926438123_abc123_screenshot1.png",
      "originalName": "screenshot1.png",
      "mimeType": "image/png",
      "fileSize": 102400,
      "altText": "First screenshot",
      "downloadUrl": "/api/files/download/question/516/1705926438123_abc123_screenshot1.png"
    },
    {
      "id": 2,
      "fileName": "question/516/1705926439456_xyz789_screenshot2.jpg",
      "originalName": "screenshot2.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 156800,
      "altText": "Second screenshot",
      "downloadUrl": "/api/files/download/question/516/1705926439456_xyz789_screenshot2.jpg"
    }
  ]
}
```

---

## 📁 Files Modified

### Entities
- ✅ `src/entities/quiz-image.entity.ts` - Removed `filePath` column

### DTOs
- ✅ `src/dto/question.dto.ts` - Added `imagesBase64` field to CreateQuestionDto & UpdateQuestionDto
- ✅ `src/dto/quiz.dto.ts` - Added `imagesBase64` field to questions array in UpdateQuizDto

### Services
- ✅ `src/services/file-upload.service.ts` - Removed `filePath` from return values
- ✅ `src/services/question.service.ts` - Multi-image support + dynamic URL generation
- ✅ `src/services/quiz.service.ts` - Multi-image support + dynamic URL generation

### Migrations
- ✅ `src/migrations/1769175791344-RemoveFilePathFromQuizImages.ts` - Drop filePath column

---

## 🔄 Migration Steps

### For Existing Deployments

1. **Backup database** before running migration
2. **Run migration:**
   ```bash
   npm run migration:run
   ```
3. **Verify** no errors in migration log
4. **Test** image retrieval endpoints
5. **Monitor** file download endpoint performance

### Database Migration SQL (Auto-generated)

```sql
ALTER TABLE quiz_images DROP COLUMN filePath;
```

---

## 🧪 Testing Checklist

- ✅ Compile check: `npm run build` - Success
- ✅ Single image upload (backward compatibility)
- ✅ Multi-image upload (new feature)
- ✅ Image retrieval with downloadUrl
- ✅ File download endpoint serving images
- ✅ Public quiz endpoint (no correctAnswer leak)
- ✅ Admin quiz detail endpoint
- ✅ Question CRUD with images

---

## 🎨 Frontend Integration

### Display Images

```typescript
// Single image
<img 
  src={question.images[0]?.downloadUrl} 
  alt={question.images[0]?.altText}
/>

// Multiple images (gallery)
{question.images.map((img) => (
  <img 
    key={img.id}
    src={img.downloadUrl} 
    alt={img.altText}
  />
))}
```

### Upload Images

```typescript
// Single image (backward compatible)
const payload = {
  questionText: "...",
  imageBase64: base64String,
  imageOriginalName: file.name,
  imageAltText: "Description"
};

// Multiple images (new)
const payload = {
  questionText: "...",
  imagesBase64: files.map(file => ({
    imageBase64: file.base64,
    originalName: file.name,
    altText: file.description
  }))
};
```

---

## 📊 Performance Considerations

### Benefits
- ✅ **Smaller database size** (no redundant URLs)
- ✅ **Faster queries** (less data to transfer)
- ✅ **Flexible caching** (URLs generated at runtime)

### Trade-offs
- ⚠️ **Minimal overhead** generating URLs (negligible - string concatenation)
- ✅ **Offset by** reduced DB size and query performance

---

## 🔐 Security & Future Enhancements

### Current Implementation
- Images served via backend proxy (`/api/files/download/{objectKey}`)
- Private R2 bucket (no direct public access)
- Backend validates and serves files

### Future Enhancements (Ready for Implementation)

**1. Signed URLs with Expiration:**
```typescript
downloadUrl: generateSignedUrl(img.fileName, expiresIn: 3600)  // 1 hour expiry
```

**2. Access Control:**
```typescript
// Check user permission before serving file
if (!canAccessQuiz(userId, quizId)) {
  throw ForbiddenException();
}
```

**3. CDN Integration:**
```typescript
// Serve via CDN for better performance
downloadUrl: `https://cdn.example.com/${img.fileName}`
```

---

## 📝 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Database** | Stores full URLs | Stores only metadata |
| **URL Generation** | At upload time | At retrieve time |
| **Flexibility** | Hardcoded URLs | Dynamic generation |
| **Multi-Image** | Not supported | ✅ Supported |
| **File Path** | `question_5/file.jpg` | `question/5/file.jpg` |
| **Migration Needed** | N/A | ✅ Drop filePath column |

---

## 🚢 Deployment Notes

1. ✅ Build passed: No compilation errors
2. ⚠️ Migration required: Run `npm run migration:run`
3. ✅ Backward compatible: Single image API still works
4. ✅ Frontend ready: Multi-image support available
5. ✅ Testing: All endpoints return downloadUrl correctly

---

**Questions or Issues?**  
Contact: Developer Team  
Last Updated: January 23, 2026
