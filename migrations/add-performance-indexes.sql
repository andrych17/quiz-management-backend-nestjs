-- Migration for adding indexes to improve concurrent query performance
-- Run this migration for better performance with hundreds of concurrent users

-- Create indexes on attempts table for faster queries
CREATE INDEX IF NOT EXISTS idx_attempts_email ON attempts(email);
CREATE INDEX IF NOT EXISTS idx_attempts_nij ON attempts(nij);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON attempts(submitted_at);
CREATE INDEX IF NOT EXISTS idx_attempts_started_at ON attempts(started_at);

-- Composite index for common query pattern (checking existing submission)
CREATE INDEX IF NOT EXISTS idx_attempts_email_quiz ON attempts(email, quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_nij_quiz ON attempts(nij, quiz_id);

-- Index for date range queries (filtering by submission date)
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at_quiz ON attempts(submitted_at, quiz_id);

-- Create indexes on attempt_answers table
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON attempt_answers(question_id);

-- Create indexes on questions table
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions("order");

-- Create indexes on quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_access_token ON quizzes(access_token) WHERE access_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_quizzes_start_date ON quizzes(start_date);
CREATE INDEX IF NOT EXISTS idx_quizzes_end_date ON quizzes(end_date);

-- Add partial index for active quizzes (published and within date range)
CREATE INDEX IF NOT EXISTS idx_quizzes_active ON quizzes(is_published, start_date, end_date) 
WHERE is_published = true;

-- Create table for query result cache (if not exists)
CREATE TABLE IF NOT EXISTS query_result_cache (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL UNIQUE,
  time BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  query TEXT NOT NULL,
  result TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_query_cache_identifier ON query_result_cache(identifier);
CREATE INDEX IF NOT EXISTS idx_query_cache_time ON query_result_cache(time);

-- Analyze tables to update statistics for query planner
ANALYZE attempts;
ANALYZE attempt_answers;
ANALYZE questions;
ANALYZE quizzes;

-- Display index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('attempts', 'attempt_answers', 'questions', 'quizzes')
ORDER BY tablename, indexname;
