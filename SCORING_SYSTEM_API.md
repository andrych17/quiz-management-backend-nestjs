# Dokumentasi Scoring System API (Versi Baru - Simplified)

## Perubahan Sistem Scoring

Sistem scoring telah disederhanakan dari sistem grade-based (A, B, C) menjadi point-based system yang lebih straightforward.

### Yang Dihapus:
- ❌ `scoringName` - Tidak perlu label "0 Benar", "1 Benar", dll
- ❌ `minScore` & `maxScore` - Tidak perlu range
- ❌ `passingScore` di scoring template (ada di quiz level)
- ❌ `incorrectAnswerPenalty` - Tidak ada penalty untuk salah
- ❌ `unansweredPenalty` - Tidak ada penalty untuk tidak dijawab
- ❌ `bonusPoints` - Tidak ada bonus
- ❌ `multiplier` - Tidak ada multiplier
- ❌ `timeBonusEnabled` - Tidak ada time bonus

### Yang Tersisa (Simplified):
- ✅ `correctAnswers` - Jumlah jawaban benar (0, 1, 2, ... n)
- ✅ `points` - Point per jawaban benar (default: 1)
- ✅ **Score dihitung sebagai: `correctAnswers × points`**

---

## 1. Create Quiz dengan Scoring Templates

### Request Format

```http
POST /api/quizzes
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ⚠️ WAJIB: Scoring Templates Harus Lengkap!

**PENTING:** Jumlah scoring templates **HARUS** sama dengan total soal + 1 (untuk 0 benar).

Contoh: Jika quiz punya **5 soal**, maka harus ada **6 templates** untuk:
- 0 benar (0 dari 5)
- 1 benar (1 dari 5)
- 2 benar (2 dari 5)
- 3 benar (3 dari 5)
- 4 benar (4 dari 5)
- 5 benar (5 dari 5)

**❌ ERROR jika ada yang terlewat:**
```json
{
  "success": false,
  "message": "Template penilaian tidak lengkap. Belum ada template untuk: 2, 4 jawaban benar. Quiz memiliki 5 soal, harus ada template untuk 0 sampai 5 jawaban benar.",
  "statusCode": 400
}
```

### Request Body Example (5 Soal)

```json
{
  "title": "Quiz Matematika Dasar",
  "description": "Quiz untuk mengukur kemampuan matematika dasar",
  "passingScore": 60,
  "durationMinutes": 30,
  "locationKey": "jakarta_pusat",
  "serviceKey": "network_operation",
  "isActive": true,
  
  "questions": [
    {
      "questionText": "Berapa hasil 2 + 2?",
      "questionType": "multiple-choice",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "order": 1
    },
    {
      "questionText": "Berapa hasil 5 × 3?",
      "questionType": "multiple-choice",
      "options": ["10", "15", "20", "25"],
      "correctAnswer": "15",
      "order": 2
    },
    {
      "questionText": "10 adalah bilangan genap",
      "questionType": "true-false",
      "options": ["true", "false"],
      "correctAnswer": "true",
      "order": 3
    },
    {
      "questionText": "Pilih bilangan prima:",
      "questionType": "multiple-select",
      "options": ["2", "3", "4", "6"],
      "correctAnswer": "2,3",
      "order": 4
    },
    {
      "questionText": "Jelaskan teorema pythagoras",
      "questionType": "text",
      "order": 5
    }
  ],
  
  "scoringTemplates": [
    {
      "correctAnswers": 0,
      "points": 1
    },
    {
      "correctAnswers": 1,
      "points": 1
    },
    {
      "correctAnswers": 2,
      "points": 2
    },
    {
      "correctAnswers": 3,
      "points": 3
    },
    {
      "correctAnswers": 4,
      "points": 4
    },
    {
      "correctAnswers": 5,
      "points": 5
    }
  ]
}
```

### Response Success (201 Created)

```json
{
  "success": true,
  "message": "Quiz created successfully",
  "data": {
    "id": 123,
    "title": "Quiz Matematika Dasar",
    "description": "Quiz untuk mengukur kemampuan matematika dasar",
    "slug": "quiz-matematika-dasar",
    "token": "ABC123DEF456",
    "normalUrl": "https://quiz-be.onrender.com/quiz/quiz-matematika-dasar-ABC123DEF456",
    "shortUrl": "https://tinyurl.com/quiz-math-123",
    "passingScore": 60,
    "durationMinutes": 30,
    "locationKey": "jakarta_pusat",
    "serviceKey": "network_operation",
    "isActive": true,
    "isPublished": false,
    "startDateTime": null,
    "endDateTime": null,
    "quizLink": null,
    "createdBy": "admin@example.com",
    "updatedBy": "admin@example.com",
    "createdAt": "2025-12-15T00:00:00.000Z",
    "updatedAt": "2025-12-15T00:00:00.000Z",
    
    "questions": [
      {
        "id": 1,
        "quizId": 123,
        "questionText": "Berapa hasil 2 + 2?",
        "questionType": "multiple-choice",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4",
        "order": 1,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 2,
        "quizId": 123,
        "questionText": "Berapa hasil 5 × 3?",
        "questionType": "multiple-choice",
        "options": ["10", "15", "20", "25"],
        "correctAnswer": "15",
        "order": 2,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 3,
        "quizId": 123,
        "questionText": "10 adalah bilangan genap",
        "questionType": "true-false",
        "options": ["true", "false"],
        "correctAnswer": "true",
        "order": 3,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 4,
        "quizId": 123,
        "questionText": "Pilih bilangan prima:",
        "questionType": "multiple-select",
        "options": ["2", "3", "4", "6"],
        "correctAnswer": "2,3",
        "order": 4,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 5,
        "quizId": 123,
        "questionText": "Jelaskan teorema pythagoras",
        "questionType": "text",
        "options": [],
        "correctAnswer": "",
        "order": 5,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      }
    ],
    
    "scoringTemplates": [
      {
        "id": 1,
        "quizId": 123,
        "correctAnswers": 0,
        "points": 1,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 2,
        "quizId": 123,
        "correctAnswers": 1,
        "points": 1,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 3,
        "quizId": 123,
        "correctAnswers": 2,
        "points": 2,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 4,
        "quizId": 123,
        "correctAnswers": 3,
        "points": 3,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 5,
        "quizId": 123,
        "correctAnswers": 4,
        "points": 4,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 6,
        "quizId": 123,
        "correctAnswers": 5,
        "points": 5,
        "isActive": true,
        "createdBy": "admin@example.com",
        "updatedBy": "admin@example.com",
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      }
    ],
    
    "assignedUsers": [
      {
        "id": 5,
        "name": "Admin Jakarta",
        "email": "admin@example.com",
        "role": "admin",
        "assignedAt": "2025-12-15T00:00:00.000Z",
        "assignmentType": "auto",
        "isActive": true
      }
    ],
    
    "images": []
  }
}
```

### Penjelasan Scoring Templates:

**Cara Kerja:**
- Jika peserta benar 0 → Score = 0 × 1 = **0 poin**
- Jika peserta benar 1 → Score = 1 × 1 = **1 poin**
- Jika peserta benar 2 → Score = 2 × 2 = **4 poin**
- Jika peserta benar 3 → Score = 3 × 3 = **9 poin**
- Jika peserta benar 4 → Score = 4 × 4 = **16 poin**
- Jika peserta benar 5 → Score = 5 × 5 = **25 poin**

**Passing Score: 60**
- Peserta minimal harus score ≥ 60 untuk lulus
- Dengan template di atas, tidak ada yang bisa lulus (max score = 25)
- **Rekomendasi:** Sesuaikan points atau passingScore agar realistis

---

## 2. Update Quiz dengan Scoring Templates

### Request Format

```http
PUT /api/quizzes/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

```json
{
  "title": "Quiz Matematika Dasar (Updated)",
  "passingScore": 85,
  
  "scoringTemplates": [
    {
      "correctAnswers": 0,
      "points": 1
    },
    {
      "correctAnswers": 15,
      "points": 2
    },
    {
      "correctAnswers": 25,
      "points": 3
    }
  ]
}
```

### ⚠️ Catatan Penting Update:

1. **Quiz yang sudah dikerjakan peserta:**
   - ❌ TIDAK BISA update `questions`
   - ❌ TIDAK BISA update `scoringTemplates`
   - ❌ TIDAK BISA regenerate link
   - ✅ BISA update data master (title, description, dates, dll)

2. **Response jika quiz sudah ada attempts:**
```json
{
  "success": false,
  "message": "Tidak dapat mengubah template penilaian untuk quiz yang sudah dikerjakan oleh peserta. Hal ini untuk menjaga keadilan dan integritas hasil quiz yang sudah ada.",
  "statusCode": 400
}
```

---

## 3. Get Quiz Detail (With Scoring Templates)

### Request Format

```http
GET /api/quizzes/{id}
Authorization: Bearer <jwt_token>
```

### Response Format

```json
{
  "success": true,
  "message": "Quiz retrieved successfully with complete details",
  "data": {
    "id": 1,
    "title": "Quiz Matematika Dasar",
    "description": "Quiz untuk mengukur kemampuan matematika dasar",
    "slug": "quiz-matematika-dasar",
    "token": "abc123xyz",
    "normalUrl": "https://quiz-be.onrender.com/quiz/quiz-matematika-dasar-abc123xyz",
    "shortUrl": "https://tinyurl.com/quiz-math-01",
    "passingScore": 80,
    "durationMinutes": 30,
    "locationKey": "jakarta_pusat",
    "serviceKey": "network_operation",
    "isActive": true,
    "isPublished": true,
    
    "scoringTemplates": [
      {
        "id": 1,
        "quizId": 1,
        "correctAnswers": 0,
        "points": 1,
        "isActive": true,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      },
      {
        "id": 2,
        "quizId": 1,
        "correctAnswers": 10,
        "points": 2,
        "isActive": true,
        "createdAt": "2025-12-15T00:00:00.000Z",
        "updatedAt": "2025-12-15T00:00:00.000Z"
      }
    ],
    
    "questions": [
      {
        "id": 1,
        "questionText": "Berapa hasil 2 + 2?",
        "questionType": "multiple-choice",
        "options": ["3", "4", "5", "6"],
        "correctAnswer": "4",
        "order": 1
      },
      {
        "id": 2,
        "questionText": "Jelaskan konsep integral",
        "questionType": "text",
        "options": [],
        "correctAnswer": "",
        "order": 2
      }
    ],
    
    "assignedUsers": [
      {
        "id": 5,
        "name": "Admin Jakarta",
        "email": "admin@example.com",
        "role": "admin",
        "assignedAt": "2025-12-15T00:00:00.000Z",
        "isActive": true
      }
    ],
    
    "createdAt": "2025-12-15T00:00:00.000Z",
    "updatedAt": "2025-12-15T00:00:00.000Z"
  },
  "timestamp": "2025-12-15T01:30:00.000Z",
  "statusCode": 200
}
```

---

## 4. Submit Quiz (Public Endpoint)

### Request Format

```http
POST /api/public/quiz/{token}/submit
Content-Type: application/json
```

```json
{
  "nij": "NIJ001",
  "answers": [
    {
      "questionId": 1,
      "answerText": "4"
    },
    {
      "questionId": 2,
      "answerText": "Integral adalah..."
    }
  ]
}
```

### Response Format (Quiz Result)

```json
{
  "success": true,
  "message": "Quiz berhasil disubmit",
  "data": {
    "attemptId": 123,
    "nij": "NIJ001",
    "quizId": 1,
    "quizTitle": "Quiz Matematika Dasar",
    "submittedAt": "2025-12-15T01:30:00.000Z",
    
    "scoring": {
      "score": 20,
      "percentageScore": 50,
      "gradeDescription": "10 Benar",
      "passed": false,
      "passingScore": 80,
      "correctAnswers": 10,
      "totalQuestions": 20,
      
      "detail": {
        "benar": 10,
        "salah": 10,
        "total": 20,
        "sistemPenilaian": "Scoring Template"
      }
    },
    
    "answers": [
      {
        "questionId": 1,
        "questionText": "Berapa hasil 2 + 2?",
        "answerText": "4",
        "correctAnswer": "4",
        "isCorrect": true
      },
      {
        "questionId": 2,
        "questionText": "Jelaskan konsep integral",
        "answerText": "Integral adalah...",
        "correctAnswer": "",
        "isCorrect": null
      }
    ]
  },
  "timestamp": "2025-12-15T01:30:00.000Z",
  "statusCode": 200
}
```

### Penjelasan Scoring Result:

**Contoh Perhitungan:**
- Total questions: 20
- Correct answers: 10
- Matching template: `{ correctAnswers: 10, points: 2 }`
- **Score = 10 × 2 = 20 poin**
- Percentage = (10 / 20) × 100 = 50%
- Passing score: 80
- **Result: TIDAK LULUS** (20 < 80)

---

## 5. Calculate Score (Testing Endpoint)

### Request Format

```http
GET /api/quizzes/{id}/calculate-score?correctAnswers=10&totalQuestions=20
Authorization: Bearer <jwt_token>
```

### Response Format

```json
{
  "success": true,
  "message": "Skor berhasil dihitung",
  "data": {
    "score": 20,
    "percentageScore": 50,
    "gradeDescription": "10 Benar",
    "passed": false,
    "passingScore": 80,
    "correctAnswers": 10,
    "totalQuestions": 20,
    
    "detail": {
      "benar": 10,
      "salah": 10,
      "total": 20,
      "sistemPenilaian": "Scoring Template"
    }
  },
  "timestamp": "2025-12-15T01:30:00.000Z",
  "statusCode": 200
}
```

---

## 6. Get Quiz untuk Public (Tanpa Correct Answers)

### Request Format

```http
GET /api/public/quiz/{token}
```

### Response Format

```json
{
  "success": true,
  "message": "Data quiz berhasil diambil",
  "data": {
    "id": 1,
    "title": "Quiz Matematika Dasar",
    "description": "Quiz untuk mengukur kemampuan matematika dasar",
    "token": "abc123xyz",
    "durationMinutes": 30,
    "passingScore": 80,
    "isActive": true,
    "isPublished": true,
    
    "questions": [
      {
        "id": 1,
        "questionText": "Berapa hasil 2 + 2?",
        "questionType": "multiple-choice",
        "options": ["3", "4", "5", "6"],
        "order": 1
      },
      {
        "id": 2,
        "questionText": "Jelaskan konsep integral",
        "questionType": "text",
        "options": [],
        "order": 2
      }
    ],
    
    "scoringTemplates": [
      {
        "id": 1,
        "correctAnswers": 0,
        "points": 1
      },
      {
        "id": 2,
        "correctAnswers": 10,
        "points": 2
      }
    ]
  },
  "timestamp": "2025-12-15T01:30:00.000Z",
  "statusCode": 200
}
```

**⚠️ Catatan:** `correctAnswer` tidak disertakan untuk security reasons.

---

## 7. Tipe Question yang Didukung

### Multiple Choice
```json
{
  "questionText": "Berapa hasil 2 + 2?",
  "questionType": "multiple-choice",
  "options": ["3", "4", "5", "6"],
  "correctAnswer": "4"
}
```

### Multiple Select (Multiple Correct Answers)
```json
{
  "questionText": "Pilih angka genap:",
  "questionType": "multiple-select",
  "options": ["1", "2", "3", "4"],
  "correctAnswer": "2,4"
}
```

### True/False
```json
{
  "questionText": "Bumi berbentuk bulat",
  "questionType": "true-false",
  "options": ["true", "false"],
  "correctAnswer": "true"
}
```

### Text/Essay (Open-ended, tidak perlu correctAnswer)
```json
{
  "questionText": "Jelaskan konsep photosynthesis",
  "questionType": "text",
  "options": [],
  "correctAnswer": ""
}
```

**⚠️ Catatan:** 
- Question type `text` dan `essay` tidak memerlukan `correctAnswer`
- Untuk question lain, `correctAnswer` wajib diisi

---

## 8. Validasi dan Error Messages

### Error: Quiz Sudah Ada Attempts

**Scenario 1: Update Questions**
```json
{
  "success": false,
  "message": "Tidak dapat mengubah soal untuk quiz yang sudah dikerjakan oleh peserta. Hal ini untuk menjaga keadilan dan integritas hasil quiz yang sudah ada.",
  "statusCode": 400
}
```

**Scenario 2: Update Scoring Templates**
```json
{
  "success": false,
  "message": "Tidak dapat mengubah template penilaian untuk quiz yang sudah dikerjakan oleh peserta. Hal ini untuk menjaga keadilan dan integritas hasil quiz yang sudah ada.",
  "statusCode": 400
}
```

**Scenario 3: Regenerate Link**
```json
{
  "success": false,
  "message": "Tidak dapat membuat ulang link untuk quiz yang sudah dikerjakan oleh peserta. Hal ini untuk memastikan hasil quiz tetap valid dan menghindari kebingungan peserta.",
  "statusCode": 400
}
```

### Error: Publish Validation

**Missing Questions:**
```json
{
  "success": false,
  "message": "Quiz tidak dapat dipublish karena belum memiliki soal. Silakan tambahkan minimal satu soal terlebih dahulu.",
  "statusCode": 400
}
```

**Missing Scoring Templates:**
```json
{
  "success": false,
  "message": "Quiz tidak dapat dipublish karena belum memiliki template penilaian. Silakan tambahkan template penilaian terlebih dahulu.",
  "statusCode": 400
}
```

---

## 9. Cara Save Scoring Templates (Backend)

### Service Method (quiz.service.ts)

```typescript
// CREATE QUIZ
const scoringTemplates = createQuizDto.scoringTemplates.map(
  (templateData) =>
    this.quizScoringRepository.create({
      quizId: savedQuiz.id,
      correctAnswers: templateData.correctAnswers,  // Jumlah benar
      points: templateData.points || 1,             // Point per jawaban (default 1)
      isActive: true,
      createdBy: userInfo?.email || 'system',
      updatedBy: userInfo?.email || 'system',
    }),
);

savedScoringTemplates = await this.quizScoringRepository.save(scoringTemplates);
```

### Update Quiz with Scoring Templates

```typescript
// UPDATE QUIZ
if (scoringTemplates !== undefined) {
  // Validasi: Quiz tidak boleh ada attempts
  if (quiz.attempts && quiz.attempts.length > 0) {
    throw new BadRequestException(
      'Tidak dapat mengubah template penilaian untuk quiz yang sudah dikerjakan oleh peserta.'
    );
  }
  
  // Delete existing templates
  await this.quizScoringRepository.delete({ quizId: id });

  // Create new templates
  const newTemplates = scoringTemplates.map((templateData) =>
    this.quizScoringRepository.create({
      quizId: id,
      correctAnswers: templateData.correctAnswers,
      points: templateData.points || 1,
      isActive: true,
      createdBy: userInfo?.email || 'system',
      updatedBy: userInfo?.email || 'system',
    }),
  );
  
  await this.quizScoringRepository.save(newTemplates);
}
```

---

## 10. Cara Calculate Score (Backend)

### Service Method (quiz.service.ts)

```typescript
async calculateScore(
  quizId: number,
  correctAnswers: number,
  totalQuestions: number,
) {
  const quiz = await this.quizRepository.findOne({
    where: { id: quizId },
    relations: ['scoringTemplates'],
  });

  // Hitung persentase
  const percentageScore =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  // Hitung score berdasarkan template
  let score = 0;
  let gradeDescription = `${correctAnswers} Benar`;

  if (quiz.scoringTemplates && quiz.scoringTemplates.length > 0) {
    // Cari template yang match dengan correctAnswers
    const matchingTemplate = quiz.scoringTemplates.find(
      (template) => template.correctAnswers === correctAnswers
    );

    if (matchingTemplate) {
      // Score = correctAnswers × points
      score = correctAnswers * (matchingTemplate.points || 1);
    } else {
      // Default: 1 point per jawaban benar
      score = correctAnswers;
    }
  } else {
    // Mode default: 1 point per jawaban benar
    score = correctAnswers;
  }

  // Tentukan lulus/tidak
  const passed = score >= quiz.passingScore;

  return {
    score,
    percentageScore,
    gradeDescription,
    passed,
    passingScore: quiz.passingScore,
    correctAnswers,
    totalQuestions,
    detail: {
      benar: correctAnswers,
      salah: totalQuestions - correctAnswers,
      total: totalQuestions,
      sistemPenilaian:
        quiz.scoringTemplates && quiz.scoringTemplates.length > 0
          ? 'Scoring Template'
          : 'Point System',
    },
  };
}
```

---

## 11. Database Schema (quiz_scoring table)

```sql
CREATE TABLE quiz_scoring (
  id SERIAL PRIMARY KEY,
  quizId INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Simplified scoring fields
  correctAnswers INTEGER NOT NULL DEFAULT 0,  -- Jumlah jawaban benar
  points INTEGER NOT NULL DEFAULT 1,          -- Point per jawaban (score = correctAnswers × points)
  
  -- Metadata
  isActive BOOLEAN DEFAULT true,
  createdBy VARCHAR(255),
  updatedBy VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Index untuk performance
CREATE INDEX idx_quiz_scoring_quiz_id ON quiz_scoring(quizId);
```

---

## 12. Contoh Use Case Lengkap

### Skenario: Quiz dengan 35 soal

**Scoring Templates:**
```json
[
  { "correctAnswers": 0, "points": 1 },   // 0 benar = 0 × 1 = 0 poin
  { "correctAnswers": 10, "points": 2 },  // 10 benar = 10 × 2 = 20 poin
  { "correctAnswers": 20, "points": 3 },  // 20 benar = 20 × 3 = 60 poin
  { "correctAnswers": 30, "points": 4 },  // 30 benar = 30 × 4 = 120 poin
  { "correctAnswers": 35, "points": 5 }   // 35 benar = 35 × 5 = 175 poin
]
```

**Hasil Peserta:**
- Peserta A: 35 benar → Score = 35 × 5 = **175 poin** ✅
- Peserta B: 30 benar → Score = 30 × 4 = **120 poin** ✅
- Peserta C: 20 benar → Score = 20 × 3 = **60 poin** ✅
- Peserta D: 15 benar → Score = 15 × 1 = **15 poin** (no template match, default)
- Peserta E: 10 benar → Score = 10 × 2 = **20 poin** ✅

**Passing Score: 80**
- Peserta A, B, C: **LULUS** ✅
- Peserta D, E: **TIDAK LULUS** ❌

---

---

## 13. Endpoint Yang Masih Aktif

### Public Endpoints (Tanpa Auth)
- `GET /api/public/quiz/:token` - Get quiz untuk peserta
- `POST /api/public/quiz/:token/submit` - Submit quiz attempt

### Admin Endpoints (Perlu JWT Auth)

**Quiz Management:**
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes` - List quizzes with pagination
- `GET /api/quizzes/:id` - Get quiz detail
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/:id/publish` - Publish quiz
- `POST /api/quizzes/:id/unpublish` - Unpublish quiz
- `POST /api/quizzes/:id/regenerate-link` - Regenerate quiz link
- `GET /api/quizzes/:id/calculate-score` - Test scoring calculation

**Question Management:**
- `POST /api/quizzes/:quizId/questions` - Add question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

**Attempt Management:**
- `GET /api/attempts` - List all attempts with filters
- `GET /api/attempts/:id/view` - View attempt detail with answers
- `DELETE /api/attempts/:id` - Delete attempt
- `GET /api/attempts/quiz/:quizId/export` - Export attempts to CSV

**User Management:**
- `POST /api/auth/login` - Login
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**User Quiz Assignment:**
- `POST /api/user-quiz-assignments/assign` - Assign quiz to users
- `GET /api/user-quiz-assignments/quiz/:quizId` - Get assignments for quiz
- `DELETE /api/user-quiz-assignments/:id` - Remove assignment

**Config:**
- `GET /api/config` - Get all config items
- `POST /api/config` - Create config item
- `PUT /api/config/:id` - Update config item
- `DELETE /api/config/:id` - Delete config item
- `GET /api/config/mappings` - Get location and service mappings

---

## 14. Response Format untuk Attempt List

### GET /api/attempts?page=1&limit=10

**Response:**
```json
{
  "items": [
    {
      "id": 123,
      "participantName": "John Doe",
      "email": "john@example.com",
      "nij": "NIJ001",
      "quizId": 1,
      "quizTitle": "Quiz Matematika Dasar",
      "serviceKey": "network_operation",
      "serviceName": "Network Operation",
      "locationKey": "jakarta_pusat",
      "locationName": "Jakarta Pusat",
      "score": 80,
      "correctAnswers": 20,
      "totalQuestions": 25,
      "grade": "20 Benar",
      "passed": true,
      "startedAt": "2025-12-15T01:00:00.000Z",
      "completedAt": "2025-12-15T01:30:00.000Z",
      "submittedAt": "2025-12-15T01:30:00.000Z",
      "createdAt": "2025-12-15T01:00:00.000Z",
      "updatedAt": "2025-12-15T01:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 10,
    "totalItems": 50,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `search` (optional) - Search by name, email, NIJ, or quiz title
- `serviceKey` (optional) - Filter by service
- `locationKey` (optional) - Filter by location
- `quizId` (optional) - Filter by quiz ID
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)

---

### ❌ Endpoints Yang Dihapus (Tidak Digunakan)
- ~~`POST /api/quiz-sessions/start`~~ - Handle di FE
- ~~`POST /api/quiz-sessions/resume`~~ - Handle di FE
- ~~`POST /api/quiz-sessions/:token/pause`~~ - Handle di FE
- ~~`POST /api/quiz-sessions/:token/complete`~~ - Handle di FE
- ~~`POST /api/quiz-sessions/update-time`~~ - Handle di FE
- ~~`GET /api/quiz-sessions/*`~~ - Tidak diperlukan
- ~~`POST /api/attempt-answers`~~ - Submit sudah di public controller
- ~~`GET /api/attempt-answers/*`~~ - Tidak diperlukan
- ~~`PUT /api/attempts/:id`~~ - Tidak diperlukan
- ~~`POST /api/attempts`~~ - Create sudah di public submit

---

## Summary

✅ **Sistem scoring sudah diupdate:**
- Simplified dari grade-based menjadi point-based
- Score = correctAnswers × points
- Tidak ada penalty atau bonus
- Lebih mudah dipahami dan diimplementasi

✅ **Save method sudah diupdate:**
- Create dan Update menggunakan structure baru
- Validasi untuk quiz dengan attempts

✅ **Calculate score sudah diupdate:**
- Logic menggunakan template matching
- Default 1 point per jawaban jika tidak ada template
- Percentage score untuk referensi

✅ **API sudah konsisten:**
- Request/Response format clear
- Error messages dalam Bahasa Indonesia
- Validasi comprehensive

✅ **Cleanup endpoints:**
- Session management dipindah ke FE
- AttemptAnswer endpoints dihapus (sudah ada di public submit)
- Hanya keep endpoint yang benar-benar digunakan
