-- Production Database Schema Fix for exam_results table
-- Run these SQL commands manually in your Supabase database console

-- 1. Add missing percentage column
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS percentage INTEGER DEFAULT 0;

-- 2. Add missing submitted_by column (foreign key to users table)
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(255);

-- 3. Add missing submitted_at column
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- 4. Add foreign key constraint for submitted_by (optional, for data integrity)
-- ALTER TABLE exam_results ADD CONSTRAINT fk_exam_results_submitted_by 
-- FOREIGN KEY (submitted_by) REFERENCES users(id);

-- 5. Verify all columns were added correctly
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'exam_results' 
ORDER BY ordinal_position;

-- 6. After adding columns, you can update the schema in shared/schema.ts to include:
-- percentage: integer("percentage").default(0),
-- submittedBy: varchar("submitted_by").references(() => users.id),
-- submittedAt: timestamp("submitted_at").defaultNow(),