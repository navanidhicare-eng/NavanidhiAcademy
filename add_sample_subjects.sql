-- Add sample subjects for each class to fix the "No Subjects Found" issue
-- This script ensures that subjects exist for SO Center subject selection

-- Insert subjects for different classes
INSERT INTO subjects (id, name, description, class_id, is_active, created_at, updated_at) VALUES
-- Subjects for 1st Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%1st%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%1st%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Basic Mathematics and Numbers', (SELECT id FROM classes WHERE name LIKE '%1st%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 2nd Class  
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%2nd%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%2nd%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Basic Operations', (SELECT id FROM classes WHERE name LIKE '%2nd%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 3rd Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%3rd%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%3rd%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Problem Solving', (SELECT id FROM classes WHERE name LIKE '%3rd%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Environmental Science', 'Environmental Studies', (SELECT id FROM classes WHERE name LIKE '%3rd%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 4th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%4th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%4th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Calculations', (SELECT id FROM classes WHERE name LIKE '%4th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Environmental Science', 'Environmental Studies', (SELECT id FROM classes WHERE name LIKE '%4th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'Social Studies and General Knowledge', (SELECT id FROM classes WHERE name LIKE '%4th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 5th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%5th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%5th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Advanced Calculations', (SELECT id FROM classes WHERE name LIKE '%5th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Environmental Science', 'Environmental Studies', (SELECT id FROM classes WHERE name LIKE '%5th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'Social Studies and History', (SELECT id FROM classes WHERE name LIKE '%5th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 6th Class and above
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%6th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%6th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Algebra', (SELECT id FROM classes WHERE name LIKE '%6th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Science', 'Physics, Chemistry and Biology', (SELECT id FROM classes WHERE name LIKE '%6th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'History, Geography and Civics', (SELECT id FROM classes WHERE name LIKE '%6th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 7th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%7th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%7th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Geometry', (SELECT id FROM classes WHERE name LIKE '%7th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Science', 'Physics, Chemistry and Biology', (SELECT id FROM classes WHERE name LIKE '%7th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'History, Geography and Civics', (SELECT id FROM classes WHERE name LIKE '%7th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 8th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%8th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%8th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Advanced Topics', (SELECT id FROM classes WHERE name LIKE '%8th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Science', 'Physics, Chemistry and Biology', (SELECT id FROM classes WHERE name LIKE '%8th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'History, Geography and Civics', (SELECT id FROM classes WHERE name LIKE '%8th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 9th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Algebra', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Physics', 'Physics Fundamentals', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Chemistry', 'Chemistry Fundamentals', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Biology', 'Biology and Life Sciences', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'History, Geography and Civics', (SELECT id FROM classes WHERE name LIKE '%9th%' LIMIT 1), true, NOW(), NOW()),

-- Subjects for 10th Class
(gen_random_uuid(), 'Telugu', 'Telugu Language and Literature', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'English', 'English Language and Grammar', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Mathematics', 'Mathematics and Advanced Algebra', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Physics', 'Physics Advanced Concepts', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Chemistry', 'Chemistry Advanced Concepts', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Biology', 'Biology Advanced Topics', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW()),
(gen_random_uuid(), 'Social Studies', 'History, Geography and Civics', (SELECT id FROM classes WHERE name LIKE '%10th%' LIMIT 1), true, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- Verify the insertion
SELECT 
    c.name as class_name,
    COUNT(s.id) as subject_count,
    string_agg(s.name, ', ' ORDER BY s.name) as subjects
FROM classes c
LEFT JOIN subjects s ON c.id = s.class_id AND s.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;