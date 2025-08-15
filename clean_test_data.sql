-- Comprehensive Database Cleanup - Remove ALL test data except Admin login
-- Execute this in your Supabase SQL Editor or database management tool

-- =============================================
-- WARNING: This will permanently delete all data except:
-- - Admin user (navanidhi.care@gmail.com) 
-- - Academic structure (classes, subjects, chapters, topics)
-- - Location data (states, districts, mandals, villages)
-- =============================================

BEGIN;

-- Step 1: Delete all dependent records first (foreign key order matters)

-- Delete exam results
DELETE FROM exam_results;
RAISE NOTICE 'Deleted exam results';

-- Delete tuition progress
DELETE FROM tuition_progress;
RAISE NOTICE 'Deleted tuition progress records';

-- Delete attendance records
DELETE FROM attendance;
RAISE NOTICE 'Deleted attendance records';

-- Delete payment records
DELETE FROM payments;
RAISE NOTICE 'Deleted payment records';

-- Delete product orders
DELETE FROM product_orders;
RAISE NOTICE 'Deleted product orders';

-- Delete wallet transactions
DELETE FROM wallet_transactions;
RAISE NOTICE 'Deleted wallet transactions';

-- Delete teaching records
DELETE FROM teaching_records;
RAISE NOTICE 'Deleted teaching records';

-- Delete announcements (keep system ones)
DELETE FROM announcements WHERE created_by IS NOT NULL;
RAISE NOTICE 'Deleted user announcements';

-- Delete students (main entity)
DELETE FROM students;
RAISE NOTICE 'Deleted all students';

-- Delete SO center equipment
DELETE FROM so_center_equipment;
RAISE NOTICE 'Deleted SO center equipment';

-- Delete SO centers
DELETE FROM so_centers;
RAISE NOTICE 'Deleted all SO centers';

-- Delete all non-admin users
DELETE FROM users 
WHERE email != 'navanidhi.care@gmail.com' 
  AND role != 'admin';
RAISE NOTICE 'Deleted all non-admin users';

-- Delete exams (but keep templates if any)
DELETE FROM exams;
RAISE NOTICE 'Deleted all exams';

-- Optional: Reset sequences for clean IDs (PostgreSQL specific)
-- These ensure new records start from ID 1 again
SELECT setval('students_id_seq', 1, false);
SELECT setval('so_centers_id_seq', 1, false);
SELECT setval('payments_id_seq', 1, false);
SELECT setval('exams_id_seq', 1, false);

COMMIT;

-- =============================================
-- VERIFICATION QUERIES - Check what remains
-- =============================================

SELECT 'CLEANUP COMPLETE - DATA SUMMARY:' as status;

SELECT 
  'users' as table_name, 
  COUNT(*) as count,
  'Should be 1 (admin only)' as expected
FROM users
UNION ALL
SELECT 'students', COUNT(*), 'Should be 0' FROM students
UNION ALL
SELECT 'so_centers', COUNT(*), 'Should be 0' FROM so_centers
UNION ALL
SELECT 'payments', COUNT(*), 'Should be 0' FROM payments
UNION ALL
SELECT 'attendance', COUNT(*), 'Should be 0' FROM attendance
UNION ALL
SELECT 'tuition_progress', COUNT(*), 'Should be 0' FROM tuition_progress
UNION ALL
SELECT 'exam_results', COUNT(*), 'Should be 0' FROM exam_results
UNION ALL
SELECT 'product_orders', COUNT(*), 'Should be 0' FROM product_orders
UNION ALL
SELECT 'wallet_transactions', COUNT(*), 'Should be 0' FROM wallet_transactions
ORDER BY table_name;

-- Show remaining admin user to confirm it's preserved
SELECT 
  id, 
  email, 
  role, 
  name, 
  is_active,
  'ADMIN PRESERVED ✓' as status
FROM users 
WHERE email = 'navanidhi.care@gmail.com';

-- Show preserved academic structure count
SELECT 
  'classes' as structure_type, COUNT(*) as count FROM classes
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL
SELECT 'topics', COUNT(*) FROM topics
ORDER BY structure_type;