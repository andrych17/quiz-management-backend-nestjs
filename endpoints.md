# API Endpoints - Quiz Report and Dashboard

This document describes the new Report and Dashboard API endpoints for the Quiz Management System.

## Authentication

All endpoints require **admin authentication**:
- Add `Authorization: Bearer <jwt_token>` header to all requests
- Only users with role `admin` or `superadmin` can access these endpoints

---

## Config Items Endpoints

### Get All Config Items

Get config items with pagination (locations, services, etc).

**Endpoint:** `GET /api/config`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `group` (optional): Filter by group (e.g., 'locations', 'services')
- `sortBy` (optional, default: 'group'): Sort field
- `sortOrder` (optional, default: 'ASC'): Sort order (ASC/DESC)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "group": "services",
        "key": "art_ministry",
        "value": "Art Ministry",
        "description": "Art Ministry Services",
        "order": 1,
        "isActive": true,
        "isDisplayToUser": true,
        "createdBy": "system",
        "createdAt": "2026-01-31T00:00:00.000Z"
      },
      {
        "id": 2,
        "group": "services",
        "key": "all_services",
        "value": "All Services",
        "description": "Access to all services",
        "order": 0,
        "isActive": true,
        "isDisplayToUser": false,
        "createdBy": "system",
        "createdAt": "2026-01-31T00:00:00.000Z"
      },
      {
        "id": 3,
        "group": "locations",
        "key": "surabaya",
        "value": "Surabaya",
        "description": "Surabaya",
        "order": 1,
        "isActive": true,
        "isDisplayToUser": null,
        "createdBy": "system",
        "createdAt": "2026-01-31T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "pageSize": 10,
      "totalItems": 3
    }
  }
}
```

**Field `isDisplayToUser` Behavior:**
| Group | isDisplayToUser | Keterangan |
|-------|-----------------|------------|
| `services` | `true` / `false` | Ditampilkan di dropdown form quiz publik |
| `locations` | `null` (kosong) | Tidak digunakan, bisa diabaikan di FE |
| (group lain) | `null` (kosong) | Tidak digunakan, bisa diabaikan di FE |

**Note untuk Frontend:**
- Di table admin, tampilkan kolom "Display to User" **hanya untuk group `services`**
- Untuk group lain, tampilkan sebagai kosong/dash (-)
- `all_services` memiliki `isDisplayToUser: false` agar tidak muncul di dropdown quiz publik

---

## Report Endpoints

### Export Quiz Results to Excel

Download quiz results as an Excel file with formatting.

**Endpoint:** `GET /api/reports/quiz/:quizId/export-excel`

**Parameters:**
- `quizId` (path parameter, required): The ID of the quiz to export results for

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with name: `quiz-{quizId}-results-{date}.xlsx`

**Excel File Contents:**
- **Title Row:** Quiz title
- **Headers:** Participant Name, Email, NIJ, Score, Grade, Correct Answers, Total Questions, Passed, Started At, Completed At
- **Data Rows:** All attempt records with conditional formatting for passed/failed status
  - Passed (Yes): Green background
  - Passed (No): Red background
- **Summary Row:** Total attempts, passed count, failed count

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/reports/quiz/1/export-excel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --output quiz-results.xlsx
```

**Error Responses:**
- `404 Not Found`: Quiz not found or no attempts found for the quiz
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have admin role

---

## Dashboard Endpoints

### Get Dashboard Statistics

Get comprehensive dashboard statistics including active quizzes, admin users, today's activities, and participant counts.

**Endpoint:** `GET /api/dashboard/stats`

**Response:**
```json
{
  "activeQuizzes": 5,
  "adminUsers": 3,
  "todayActiveQuizzes": [
    {
      "id": 1,
      "title": "IQ Test - Math & Language",
      "attemptCount": 15
    },
    {
      "id": 2,
      "title": "General Knowledge Quiz",
      "attemptCount": 8
    }
  ],
  "todayParticipants": 12
}
```

**Response Fields:**
- `activeQuizzes` (number): Count of quizzes where `isActive=true` and `isPublished=true`
- `adminUsers` (number): Count of users with role `admin` or `superadmin`
- `todayActiveQuizzes` (array): List of quizzes that have attempts started today
  - `id` (number): Quiz ID
  - `title` (string): Quiz title
  - `attemptCount` (number): Number of attempts for this quiz today
- `todayParticipants` (number): Count of unique participants (by email) who started attempts today

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have admin role

---

### Get Recent Activity

Get a list of recent quiz attempts with participant and quiz details.

**Endpoint:** `GET /api/dashboard/recent-activity`

**Query Parameters:**
- `limit` (optional, default: 50): Number of recent activities to return

**Response:**
```json
[
  {
    "id": 123,
    "participantName": "John Doe",
    "email": "john@example.com",
    "nij": "12345",
    "quizId": 1,
    "quizTitle": "IQ Test - Math & Language",
    "score": 85,
    "passed": true,
    "startedAt": "2026-01-18T07:15:30.000Z",
    "completedAt": "2026-01-18T07:45:30.000Z",
    "submittedAt": "2026-01-18T07:45:30.000Z"
  },
  {
    "id": 122,
    "participantName": "Jane Smith",
    "email": "jane@example.com",
    "nij": "67890",
    "quizId": 2,
    "quizTitle": "General Knowledge Quiz",
    "score": 65,
    "passed": false,
    "startedAt": "2026-01-18T06:30:00.000Z",
    "completedAt": "2026-01-18T06:55:00.000Z",
    "submittedAt": "2026-01-18T06:55:00.000Z"
  }
]
```

**Response Fields (per activity):**
- `id` (number): Attempt ID
- `participantName` (string): Name of the participant
- `email` (string): Email of the participant
- `nij` (string): NIJ (Nomor Induk Jemaat) of the participant
- `quizId` (number): Quiz ID
- `quizTitle` (string): Title of the quiz
- `score` (number): Final score
- `passed` (boolean): Whether the participant passed the quiz
- `startedAt` (string): ISO 8601 timestamp when the attempt was started
- `completedAt` (string|null): ISO 8601 timestamp when the attempt was completed
- `submittedAt` (string|null): ISO 8601 timestamp when the attempt was submitted

**Example Requests:**
```bash
# Get default 50 recent activities
curl -X GET http://localhost:3000/api/dashboard/recent-activity \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get last 5 recent activities
curl -X GET http://localhost:3000/api/dashboard/recent-activity?limit=5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get last 100 recent activities
curl -X GET http://localhost:3000/api/dashboard/recent-activity?limit=100 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have admin role

---

## Question Image Management Endpoints

### Delete Specific Image from Question

Delete a specific image from a question by image ID.

**Endpoint:** `DELETE /api/questions/:questionId/images/:imageId`

**Parameters:**
- `questionId` (path parameter, required): The ID of the question
- `imageId` (path parameter, required): The ID of the image to delete

**Response:**
```json
{
  "message": "Question image deleted successfully"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/questions/5/images/12 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Error Responses:**
- `404 Not Found`: Question or image not found
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have required permissions

---

### Update Question with Image Deletion

Update question dan hapus image yang tidak diinginkan dalam satu request.

**Endpoint:** `PUT /api/questions/:id`

**Parameters:**
- `id` (path parameter, required): The ID of the question

**Request Body:**
```json
{
  "questionText": "Updated question text",
  "deleteImageIds": [1, 3]
}
```

**Request Body Fields:**
- `questionText` (string, optional): Updated question text
- `questionType` (string, optional): Type of question
- `options` (array, optional): Answer options
- `correctAnswer` (string, optional): Correct answer
- `order` (number, optional): Question order
- `deleteImageIds` (array of numbers, optional): **IDs of images to delete from this question**
- `imagesBase64` (array, optional): New images to upload (base64 encoded)

**Response:**
```json
{
  "id": 5,
  "questionText": "Updated question text",
  "questionType": "multiple-choice",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "order": 1,
  "images": [
    {
      "id": 2,
      "fileName": "abc123.jpg",
      "imageUrl": "https://storage.example.com/quiz-images/abc123.jpg",
      "sequence": 2
    }
  ]
}
```

**Example Request (Hapus image 1 dan 3):**
```bash
curl -X PUT http://localhost:3000/api/questions/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "deleteImageIds": [1, 3]
  }'
```

**Example Request (Update text dan hapus image):**
```bash
curl -X PUT http://localhost:3000/api/questions/5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "New question text",
    "deleteImageIds": [1]
  }'
```

**Important Notes:**
- `deleteImageIds` akan menghapus image dari storage (R2/local) DAN dari database
- Bisa digunakan bersamaan dengan field lain seperti `questionText`, `imagesBase64`, dll
- Image yang dihapus tidak bisa dikembalikan

---

### Delete Question

Hapus pertanyaan dari quiz. **Tidak bisa dihapus jika quiz sudah dikerjakan oleh peserta.**

**Endpoint:** `DELETE /api/questions/:id`

**Parameters:**
- `id` (path parameter, required): The ID of the question

**Response (Success):**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

**Error Response (Quiz sudah dikerjakan):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Pertanyaan tidak dapat dihapus karena quiz sudah dikerjakan oleh 5 peserta."
}
```

**Important Notes:**
- Jika quiz sudah memiliki attempts (sudah dikerjakan peserta), pertanyaan TIDAK BISA dihapus
- Semua gambar yang terkait dengan pertanyaan akan dihapus dari storage (R2/local)
- Untuk menonaktifkan quiz tanpa menghapus, gunakan endpoint unpublish

---

---

### Delete Quiz

Hapus quiz beserta semua pertanyaan dan gambar. **Tidak bisa dihapus jika quiz sudah dikerjakan oleh peserta.**

**Endpoint:** `DELETE /api/admin/quizzes/:id`

**Parameters:**
- `id` (path parameter, required): The ID of the quiz

**Response (Success):**
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

**Error Response (Quiz sudah dikerjakan):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Quiz tidak dapat dihapus karena sudah ada 5 peserta yang mengerjakan. Anda dapat menonaktifkan quiz dengan unpublish."
}
```

**Important Notes:**
- Jika quiz sudah memiliki attempts (sudah dikerjakan peserta), quiz TIDAK BISA dihapus
- Semua pertanyaan dan gambar terkait akan dihapus dari storage (R2/local)
- Alternatif: gunakan endpoint **unpublish** untuk menonaktifkan quiz tanpa menghapus data

---

---

## Public Quiz Endpoints (Tanpa Autentikasi)

Endpoint untuk peserta mengerjakan quiz tanpa perlu login.

### 0. Get Services (Daftar Jenis Pelayanan untuk Dropdown)

Mengambil daftar services/jenis pelayanan yang dapat dipilih peserta saat mengerjakan quiz. Endpoint ini digunakan untuk mengisi dropdown "Jenis Pelayanan" di form quiz.

**Endpoint:** `GET /api/public/services`

**Response:**
```json
{
  "success": true,
  "message": "Daftar jenis pelayanan berhasil diambil",
  "data": [
    {
      "key": "art_ministry",
      "value": "Art Ministry",
      "description": "Art Ministry Services"
    },
    {
      "key": "service_ministry",
      "value": "Service Ministry",
      "description": "Service Ministry Services"
    }
  ]
}
```

**Catatan Penting:**
- Field `isDisplayToUser` **hanya digunakan untuk group `services`** saja
- Hanya services dengan `isActive=true` AND `isDisplayToUser=true` yang akan ditampilkan
- `all_services` memiliki `isDisplayToUser=false` sehingga tidak akan muncul di dropdown
- Untuk group lain seperti `locations`, field `isDisplayToUser` bisa dikosongkan/diabaikan di FE

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/public/services
```

---

### 1. Get Quiz Data (Mengambil Soal dan Gambar)

Mengambil data quiz lengkap dengan soal dan gambar untuk ditampilkan ke peserta.

**Endpoint:** `GET /api/public/quiz/:token`

**Parameters:**
- `token` (path parameter, required): Token quiz (format: `TOKEN` atau `slug-TOKEN`)

**Response:**
```json
{
  "success": true,
  "message": "Data quiz dan soal berhasil diambil",
  "data": {
    "id": 1,
    "title": "Quiz Test Sekolah Minggu",
    "description": "Quiz untuk peserta SM",
    "timeLimit": 30,
    "totalQuestions": 10,
    "passingScore": 70,
    "questions": [
      {
        "id": 1,
        "questionText": "Siapakah yang menjadi raja pertama Israel?",
        "questionType": "multiple_choice",
        "options": ["Daud", "Saul", "Salomo", "Samuel"],
        "order": 1,
        "images": [
          {
            "id": 1,
            "imageUrl": "https://storage.example.com/quiz-images/abc123.jpg",
            "imageCaption": "Gambar pertanyaan",
            "sequence": 1
          }
        ]
      },
      {
        "id": 2,
        "questionText": "Berapa murid Yesus?",
        "questionType": "multiple_choice",
        "options": ["10", "11", "12", "13"],
        "order": 2,
        "images": []
      }
    ]
  }
}
```

**Response Fields:**
- `id` (number): Quiz ID
- `title` (string): Judul quiz
- `description` (string): Deskripsi quiz
- `timeLimit` (number): Batas waktu dalam menit
- `totalQuestions` (number): Total soal
- `passingScore` (number): Nilai minimum lulus
- `questions` (array): Daftar soal
  - `id` (number): ID soal
  - `questionText` (string): Teks pertanyaan
  - `questionType` (string): Tipe soal (multiple_choice, true_false)
  - `options` (array): Pilihan jawaban
  - `order` (number): Urutan soal
  - `images` (array): Gambar terkait soal
    - `id` (number): ID gambar
    - `imageUrl` (string): URL gambar
    - `imageCaption` (string): Caption gambar
    - `sequence` (number): Urutan gambar

**Note:** `correctAnswer` tidak disertakan untuk mencegah kecurangan.

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/public/quiz/ABC123DEF456
# atau dengan slug
curl -X GET http://localhost:3000/api/public/quiz/test-sm-ABC123DEF456
```

**Error Responses:**
- `404 Not Found`: Quiz tidak ditemukan atau belum dipublish
- `400 Bad Request`: Quiz sudah expired atau belum dimulai

---

### 2. Check User Submission (Cek Status Pengerjaan)

Cek apakah peserta dengan NIJ tertentu sudah pernah mengerjakan quiz.

**Endpoint:** `POST /api/public/quiz/:token/check`

**Parameters:**
- `token` (path parameter, required): Token quiz

**Request Body:**
```json
{
  "nij": "NIJ001"
}
```

**Response (Belum pernah mengerjakan):**
```json
{
  "success": true,
  "message": "Peserta belum pernah mengerjakan quiz ini",
  "data": {
    "hasSubmitted": false,
    "quiz": {
      "id": 1,
      "title": "Quiz Test Sekolah Minggu"
    },
    "submission": null
  }
}
```

**Response (Sudah pernah mengerjakan):**
```json
{
  "success": true,
  "message": "Peserta sudah pernah mengerjakan quiz ini",
  "data": {
    "hasSubmitted": true,
    "quiz": {
      "id": 1,
      "title": "Quiz Test Sekolah Minggu"
    },
    "submission": {
      "participantName": "John Doe",
      "nij": "NIJ001",
      "submittedAt": "2026-01-30T10:30:00.000Z"
    }
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/public/quiz/ABC123DEF456/check \
  -H "Content-Type: application/json" \
  -d '{"nij": "NIJ001"}'
```

---

### 3. Submit Quiz (Submit Jawaban Quiz)

Submit jawaban quiz beserta data peserta termasuk servo_number dan serviceKey.

**Endpoint:** `POST /api/public/quiz/:token/submit`

**Parameters:**
- `token` (path parameter, required): Token quiz

**Request Body:**
```json
{
  "participantName": "John Doe",
  "email": "john@example.com",
  "nij": "NIJ001",
  "servoNumber": "SRV2026001",
  "serviceKey": "art_ministry",
  "answers": [
    {
      "questionId": 1,
      "answer": "Saul"
    },
    {
      "questionId": 2,
      "answer": "12"
    }
  ]
}
```

**Request Body Fields:**
- `participantName` (string, required): Nama peserta
- `email` (string, required): Email peserta
- `nij` (string, required): Nomor Induk Jemaat
- `servoNumber` (string, optional): Servo Number peserta saat mengerjakan quiz
- `serviceKey` (string, required): Key jenis pelayanan (didapat dari endpoint GET /api/public/services)
- `answers` (array, required): Array jawaban
  - `questionId` (number): ID soal
  - `answer` (string): Jawaban yang dipilih

**Response:**
```json
{
  "success": true,
  "message": "Jawaban Anda berhasil disubmit. Terima kasih telah mengikuti quiz.",
  "data": {
    "submitted": true,
    "participantName": "John Doe",
    "email": "john@example.com",
    "nij": "NIJ001",
    "servoNumber": "SRV2026001",
    "serviceKey": "art_ministry",
    "submittedAt": "2026-01-31T08:30:00.000Z",
    "quiz": {
      "title": "Quiz Test Sekolah Minggu"
    }
  }
}
```

**Note:** Nilai/score tidak ditampilkan ke peserta untuk menjaga integritas hasil.

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/public/quiz/ABC123DEF456/submit \
  -H "Content-Type: application/json" \
  -d '{
    "participantName": "John Doe",
    "email": "john@example.com",
    "nij": "NIJ001",
    "servoNumber": "SRV2026001",
    "serviceKey": "art_ministry",
    "answers": [
      {"questionId": 1, "answer": "Saul"},
      {"questionId": 2, "answer": "12"}
    ]
  }'
```

**Error Responses:**
- `404 Not Found`: Quiz tidak ditemukan
- `400 Bad Request`: 
  - Data tidak valid
  - Peserta sudah pernah mengerjakan quiz ini (duplicate submission)

---

## Flow Pengerjaan Quiz oleh Peserta

1. **Frontend memanggil GET /api/public/services**
   - Mendapatkan daftar jenis pelayanan untuk dropdown
   - Hanya services dengan isDisplayToUser=true yang ditampilkan

2. **Frontend memanggil GET /api/public/quiz/:token**
   - Mendapatkan data quiz, soal, dan gambar
   - Menampilkan form identitas peserta

3. **Frontend memanggil POST /api/public/quiz/:token/check** (optional)
   - Cek apakah NIJ sudah pernah submit
   - Jika sudah, tampilkan pesan bahwa sudah pernah mengerjakan

4. **Peserta mengisi form identitas:**
   - Nama
   - Email
   - NIJ
   - Servo Number (jika diperlukan)
   - Jenis Pelayanan (dropdown dari services)

5. **Peserta mengerjakan soal**
   - Menampilkan soal satu per satu atau semua sekaligus
   - Menampilkan gambar yang terkait dengan soal

6. **Frontend memanggil POST /api/public/quiz/:token/submit**
   - Submit semua jawaban beserta data peserta
   - ServiceKey dan Servo number disimpan untuk tracking

---

## Summary

### Report Endpoints
- `GET /api/reports/quiz/:quizId/export-excel` - Export quiz results to Excel

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity list

### Question Image Endpoints
- `DELETE /api/questions/:questionId/images/:imageId` - Delete specific image from question

### Public Quiz Endpoints (Tanpa Autentikasi)
- `GET /api/public/services` - Get daftar jenis pelayanan untuk dropdown
- `GET /api/public/quiz/:token` - Get quiz data dengan soal dan gambar
- `POST /api/public/quiz/:token/check` - Cek apakah peserta sudah pernah mengerjakan
- `POST /api/public/quiz/:token/submit` - Submit jawaban quiz (dengan serviceKey & servoNumber)

All admin endpoints require authentication and return JSON responses (except Excel export which returns a file).
Public endpoints do not require authentication.
