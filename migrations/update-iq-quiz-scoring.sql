-- ================================================
-- MIGRATION: Update IQ Quiz Scoring Table
-- Created: 2026-02-13
-- Purpose: Update existing scoring templates untuk Logical Test - IQ Scoring
--          Handles Quiz ID 1 and Quiz ID 11
--          Updates existing records and inserts missing ones
--          Recalculates all attempt scores based on new mapping
-- Strategy: UPDATE existing + INSERT missing (not DELETE + INSERT)
-- Note: Uses camelCase column names (TypeORM convention)
-- ================================================

-- Step 1: Backup existing scoring data (optional, untuk rollback)
CREATE TABLE IF NOT EXISTS quiz_scoring_backup_20260213 AS 
SELECT * FROM quiz_scoring WHERE "quizId" IN (1, 11);

CREATE TABLE IF NOT EXISTS attempts_backup_20260213 AS 
SELECT * FROM attempts WHERE "quizId" IN (1, 11);

-- Step 2: Update or Insert scoring templates using UPSERT pattern
-- This will UPDATE existing records and INSERT new ones if needed

-- First, update existing scoring templates
UPDATE quiz_scoring 
SET 
  points = temp_data.points,
  "correctAnswerPoints" = temp_data.points,
  "scoringName" = temp_data.scoring_name,
  "incorrectAnswerPenalty" = 0,
  "unansweredPenalty" = 0,
  "bonusPoints" = 0,
  multiplier = 1.0,
  "timeBonusEnabled" = false,
  "timeBonusPerSecond" = 0.0,
  "isActive" = true,
  "updatedAt" = NOW()
FROM (
  VALUES 
    -- Quiz 1 mappings
    (1, 'IQ-73-0', 0, 73), (1, 'IQ-73-1', 1, 73), (1, 'IQ-73-2', 2, 73),
    (1, 'IQ-73-3', 3, 73), (1, 'IQ-73-4', 4, 73), (1, 'IQ-73-5', 5, 73),
    (1, 'IQ-73-6', 6, 73), (1, 'IQ-73-7', 7, 73), (1, 'IQ-77', 8, 77),
    (1, 'IQ-79', 9, 79), (1, 'IQ-84-10', 10, 84), (1, 'IQ-84-11', 11, 84),
    (1, 'IQ-88-12', 12, 88), (1, 'IQ-88-13', 13, 88), (1, 'IQ-92-14', 14, 92),
    (1, 'IQ-92-15', 15, 92), (1, 'IQ-94-16', 16, 94), (1, 'IQ-94-17', 17, 94),
    (1, 'IQ-98-18', 18, 98), (1, 'IQ-98-19', 19, 98), (1, 'IQ-101-20', 20, 101),
    (1, 'IQ-101-21', 21, 101), (1, 'IQ-104-22', 22, 104), (1, 'IQ-104-23', 23, 104),
    (1, 'IQ-108-24', 24, 108), (1, 'IQ-108-25', 25, 108), (1, 'IQ-112-26', 26, 112),
    (1, 'IQ-112-27', 27, 112), (1, 'IQ-116-28', 28, 116), (1, 'IQ-116-29', 29, 116),
    (1, 'IQ-120-30', 30, 120), (1, 'IQ-120-31', 31, 120), (1, 'IQ-123', 32, 123),
    (1, 'IQ-125', 33, 125), (1, 'IQ-132', 34, 132), (1, 'IQ-139-35', 35, 139),
    (1, 'IQ-139-36', 36, 139), (1, 'IQ-139-37', 37, 139), (1, 'IQ-139-38', 38, 139),
    (1, 'IQ-139-39', 39, 139), (1, 'IQ-139-40', 40, 139),
    -- Quiz 11 mappings
    (11, 'IQ-73-0', 0, 73), (11, 'IQ-73-1', 1, 73), (11, 'IQ-73-2', 2, 73),
    (11, 'IQ-73-3', 3, 73), (11, 'IQ-73-4', 4, 73), (11, 'IQ-73-5', 5, 73),
    (11, 'IQ-73-6', 6, 73), (11, 'IQ-73-7', 7, 73), (11, 'IQ-77', 8, 77),
    (11, 'IQ-79', 9, 79), (11, 'IQ-84-10', 10, 84), (11, 'IQ-84-11', 11, 84),
    (11, 'IQ-88-12', 12, 88), (11, 'IQ-88-13', 13, 88), (11, 'IQ-92-14', 14, 92),
    (11, 'IQ-92-15', 15, 92), (11, 'IQ-94-16', 16, 94), (11, 'IQ-94-17', 17, 94),
    (11, 'IQ-98-18', 18, 98), (11, 'IQ-98-19', 19, 98), (11, 'IQ-101-20', 20, 101),
    (11, 'IQ-101-21', 21, 101), (11, 'IQ-104-22', 22, 104), (11, 'IQ-104-23', 23, 104),
    (11, 'IQ-108-24', 24, 108), (11, 'IQ-108-25', 25, 108), (11, 'IQ-112-26', 26, 112),
    (11, 'IQ-112-27', 27, 112), (11, 'IQ-116-28', 28, 116), (11, 'IQ-116-29', 29, 116),
    (11, 'IQ-120-30', 30, 120), (11, 'IQ-120-31', 31, 120), (11, 'IQ-123', 32, 123),
    (11, 'IQ-125', 33, 125), (11, 'IQ-132', 34, 132), (11, 'IQ-139-35', 35, 139),
    (11, 'IQ-139-36', 36, 139), (11, 'IQ-139-37', 37, 139), (11, 'IQ-139-38', 38, 139),
    (11, 'IQ-139-39', 39, 139), (11, 'IQ-139-40', 40, 139)
) AS temp_data(quiz_id, scoring_name, correct_answers, points)
WHERE quiz_scoring."quizId" = temp_data.quiz_id 
  AND quiz_scoring."correctAnswers" = temp_data.correct_answers;

-- Then, insert only the missing records
INSERT INTO quiz_scoring (
  "quizId", 
  "scoringName", 
  "correctAnswers", 
  points, 
  "correctAnswerPoints",
  "incorrectAnswerPenalty",
  "unansweredPenalty",
  "bonusPoints",
  multiplier,
  "timeBonusEnabled",
  "timeBonusPerSecond",
  "isActive",
  "createdAt",
  "updatedAt"
) 
SELECT 
  quiz_id,
  scoring_name,
  correct_answers,
  points,
  points as correct_answer_points,
  0 as incorrect_answer_penalty,
  0 as unanswered_penalty,
  0 as bonus_points,
  1.0 as multiplier,
  false as time_bonus_enabled,
  0.0 as time_bonus_per_second,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  VALUES 
    -- Quiz 1 mappings
    (1, 'IQ-73-0', 0, 73), (1, 'IQ-73-1', 1, 73), (1, 'IQ-73-2', 2, 73),
    (1, 'IQ-73-3', 3, 73), (1, 'IQ-73-4', 4, 73), (1, 'IQ-73-5', 5, 73),
    (1, 'IQ-73-6', 6, 73), (1, 'IQ-73-7', 7, 73), (1, 'IQ-77', 8, 77),
    (1, 'IQ-79', 9, 79), (1, 'IQ-84-10', 10, 84), (1, 'IQ-84-11', 11, 84),
    (1, 'IQ-88-12', 12, 88), (1, 'IQ-88-13', 13, 88), (1, 'IQ-92-14', 14, 92),
    (1, 'IQ-92-15', 15, 92), (1, 'IQ-94-16', 16, 94), (1, 'IQ-94-17', 17, 94),
    (1, 'IQ-98-18', 18, 98), (1, 'IQ-98-19', 19, 98), (1, 'IQ-101-20', 20, 101),
    (1, 'IQ-101-21', 21, 101), (1, 'IQ-104-22', 22, 104), (1, 'IQ-104-23', 23, 104),
    (1, 'IQ-108-24', 24, 108), (1, 'IQ-108-25', 25, 108), (1, 'IQ-112-26', 26, 112),
    (1, 'IQ-112-27', 27, 112), (1, 'IQ-116-28', 28, 116), (1, 'IQ-116-29', 29, 116),
    (1, 'IQ-120-30', 30, 120), (1, 'IQ-120-31', 31, 120), (1, 'IQ-123', 32, 123),
    (1, 'IQ-125', 33, 125), (1, 'IQ-132', 34, 132), (1, 'IQ-139-35', 35, 139),
    (1, 'IQ-139-36', 36, 139), (1, 'IQ-139-37', 37, 139), (1, 'IQ-139-38', 38, 139),
    (1, 'IQ-139-39', 39, 139), (1, 'IQ-139-40', 40, 139),
    -- Quiz 11 mappings
    (11, 'IQ-73-0', 0, 73), (11, 'IQ-73-1', 1, 73), (11, 'IQ-73-2', 2, 73),
    (11, 'IQ-73-3', 3, 73), (11, 'IQ-73-4', 4, 73), (11, 'IQ-73-5', 5, 73),
    (11, 'IQ-73-6', 6, 73), (11, 'IQ-73-7', 7, 73), (11, 'IQ-77', 8, 77),
    (11, 'IQ-79', 9, 79), (11, 'IQ-84-10', 10, 84), (11, 'IQ-84-11', 11, 84),
    (11, 'IQ-88-12', 12, 88), (11, 'IQ-88-13', 13, 88), (11, 'IQ-92-14', 14, 92),
    (11, 'IQ-92-15', 15, 92), (11, 'IQ-94-16', 16, 94), (11, 'IQ-94-17', 17, 94),
    (11, 'IQ-98-18', 18, 98), (11, 'IQ-98-19', 19, 98), (11, 'IQ-101-20', 20, 101),
    (11, 'IQ-101-21', 21, 101), (11, 'IQ-104-22', 22, 104), (11, 'IQ-104-23', 23, 104),
    (11, 'IQ-108-24', 24, 108), (11, 'IQ-108-25', 25, 108), (11, 'IQ-112-26', 26, 112),
    (11, 'IQ-112-27', 27, 112), (11, 'IQ-116-28', 28, 116), (11, 'IQ-116-29', 29, 116),
    (11, 'IQ-120-30', 30, 120), (11, 'IQ-120-31', 31, 120), (11, 'IQ-123', 32, 123),
    (11, 'IQ-125', 33, 125), (11, 'IQ-132', 34, 132), (11, 'IQ-139-35', 35, 139),
    (11, 'IQ-139-36', 36, 139), (11, 'IQ-139-37', 37, 139), (11, 'IQ-139-38', 38, 139),
    (11, 'IQ-139-39', 39, 139), (11, 'IQ-139-40', 40, 139)
) AS temp_data(quiz_id, scoring_name, correct_answers, points)
WHERE NOT EXISTS (
  SELECT 1 FROM quiz_scoring qs
  WHERE qs."quizId" = temp_data.quiz_id 
    AND qs."correctAnswers" = temp_data.correct_answers
);

-- Step 3: Update all existing attempts with new scores based on correctAnswers
-- Using CASE statement to map correctAnswers to IQ scores
-- Applied to BOTH Quiz 1 and Quiz 11
UPDATE attempts 
SET score = CASE 
    -- 0-7 correct = 73
    WHEN "correctAnswers" BETWEEN 0 AND 7 THEN 73
    -- 8 correct = 77
    WHEN "correctAnswers" = 8 THEN 77
    -- 9 correct = 79
    WHEN "correctAnswers" = 9 THEN 79
    -- 10-11 correct = 84
    WHEN "correctAnswers" BETWEEN 10 AND 11 THEN 84
    -- 12-13 correct = 88
    WHEN "correctAnswers" BETWEEN 12 AND 13 THEN 88
    -- 14-15 correct = 92
    WHEN "correctAnswers" BETWEEN 14 AND 15 THEN 92
    -- 16-17 correct = 94
    WHEN "correctAnswers" BETWEEN 16 AND 17 THEN 94
    -- 18-19 correct = 98
    WHEN "correctAnswers" BETWEEN 18 AND 19 THEN 98
    -- 20-21 correct = 101
    WHEN "correctAnswers" BETWEEN 20 AND 21 THEN 101
    -- 22-23 correct = 104
    WHEN "correctAnswers" BETWEEN 22 AND 23 THEN 104
    -- 24-25 correct = 108
    WHEN "correctAnswers" BETWEEN 24 AND 25 THEN 108
    -- 26-27 correct = 112
    WHEN "correctAnswers" BETWEEN 26 AND 27 THEN 112
    -- 28-29 correct = 116
    WHEN "correctAnswers" BETWEEN 28 AND 29 THEN 116
    -- 30-31 correct = 120
    WHEN "correctAnswers" BETWEEN 30 AND 31 THEN 120
    -- 32 correct = 123
    WHEN "correctAnswers" = 32 THEN 123
    -- 33 correct = 125
    WHEN "correctAnswers" = 33 THEN 125
    -- 34 correct = 132
    WHEN "correctAnswers" = 34 THEN 132
    -- 35+ correct = 139
    WHEN "correctAnswers" >= 35 THEN 139
    ELSE 73 -- default minimum score
END,
"updatedAt" = NOW()
WHERE "quizId" IN (1, 11);

-- Step 4: Verify the update
-- Show updated scoring table for both quizzes
SELECT 
    id,
    "quizId" as quiz_id,
    "scoringName" as scoring_name,
    "correctAnswers" as correct_answers,
    points as iq_score
FROM quiz_scoring 
WHERE "quizId" IN (1, 11)
ORDER BY "quizId", "correctAnswers";

-- Show updated attempts with new scores for both quizzes
SELECT 
    id,
    "quizId" as quiz_id,
    "participantName" as participant_name,
    email,
    "correctAnswers" as correct_answers,
    score as iq_score,
    "updatedAt" as updated_at
FROM attempts 
WHERE "quizId" IN (1, 11)
ORDER BY "quizId", "correctAnswers" DESC, id;

-- Step 5: Statistics
SELECT 
    "quizId" as quiz_id,
    'Total Scoring Templates' as metric,
    COUNT(*) as value
FROM quiz_scoring 
WHERE "quizId" IN (1, 11)
GROUP BY "quizId"
UNION ALL
SELECT 
    "quizId" as quiz_id,
    'Total Attempts Updated' as metric,
    COUNT(*) as value
FROM attempts 
WHERE "quizId" IN (1, 11)
GROUP BY "quizId"
UNION ALL
SELECT 
    "quizId" as quiz_id,
    'Average IQ Score' as metric,
    ROUND(AVG(score), 2) as value
FROM attempts 
WHERE "quizId" IN (1, 11)
GROUP BY "quizId"
ORDER BY quiz_id, metric;

-- ================================================
-- ROLLBACK SCRIPT (if needed)
-- ================================================
-- Uncomment lines below to rollback changes
--
-- Restore quiz_scoring from backup
-- UPDATE quiz_scoring qs
-- SET 
--   points = b.points,
--   "correctAnswerPoints" = b."correctAnswerPoints",
--   "scoringName" = b."scoringName",
--   "incorrectAnswerPenalty" = b."incorrectAnswerPenalty",
--   "unansweredPenalty" = b."unansweredPenalty",
--   "bonusPoints" = b."bonusPoints",
--   multiplier = b.multiplier,
--   "timeBonusEnabled" = b."timeBonusEnabled",
--   "timeBonusPerSecond" = b."timeBonusPerSecond",
--   "isActive" = b."isActive",
--   "updatedAt" = b."updatedAt"
-- FROM quiz_scoring_backup_20260213 b
-- WHERE qs.id = b.id;
--
-- Restore attempts from backup
-- UPDATE attempts a
-- SET score = b.score, "updatedAt" = b."updatedAt"
-- FROM attempts_backup_20260213 b
-- WHERE a.id = b.id AND a."quizId" IN (1, 11);
--
-- DROP TABLE quiz_scoring_backup_20260213;
-- DROP TABLE attempts_backup_20260213;
