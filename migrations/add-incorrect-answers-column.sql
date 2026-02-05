-- Migration to add incorrectAnswers column to attempts table
-- This is needed for proper tracking of quiz results

ALTER TABLE attempts 
ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER DEFAULT 0;

-- Update existing records to calculate incorrect answers
UPDATE attempts 
SET incorrect_answers = total_questions - correct_answers
WHERE incorrect_answers = 0 AND total_questions > 0;

-- Add comment for documentation
COMMENT ON COLUMN attempts.incorrect_answers IS 'Number of incorrect answers in the quiz attempt';
