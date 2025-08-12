-- Add percentage column to exam_results table
-- Run this SQL command manually in your database console

ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'exam_results' 
ORDER BY ordinal_position;