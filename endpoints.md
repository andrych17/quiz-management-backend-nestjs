# API Endpoints - Quiz Report and Dashboard

This document describes the new Report and Dashboard API endpoints for the Quiz Management System.

## Authentication

All endpoints require **admin authentication**:
- Add `Authorization: Bearer <jwt_token>` header to all requests
- Only users with role `admin` or `superadmin` can access these endpoints

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

## Summary

### Report Endpoints
- `GET /api/reports/quiz/:quizId/export-excel` - Export quiz results to Excel

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity list

All endpoints require admin authentication and return JSON responses (except Excel export which returns a file).
