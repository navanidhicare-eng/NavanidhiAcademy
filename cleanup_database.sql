-- Database Cleanup Script - Remove all test data except Admin user
-- This script will clean all test data while preserving the admin account and system structure

BEGIN;

-- First, get the admin user ID to preserve it
-- Admin email: navanidhi.care@gmail.com

-- Delete dependent records first (foreign key constraints)

-- 1. Delete exam results
DELETE FROM exam_results;

-- 2. Delete tuition progress records
DELETE FROM tuition_progress;

-- 3. Delete attendance records
DELETE FROM attendance;

-- 4. Delete payment records
DELETE FROM payments;

-- 5. Delete product orders
DELETE FROM product_orders;

-- 6. Delete wallet transactions
DELETE FROM wallet_transactions;

-- 7. Delete announcements (but keep system announcements if any)
DELETE FROM announcements WHERE target_audiences != 'system';

-- 8. Delete students (this will cascade to related records)
DELETE FROM students;

-- 9. Delete SO Centers
DELETE FROM so_centers;

-- 10. Delete all users EXCEPT the admin user
DELETE FROM users 
WHERE email != 'navanidhi.care@gmail.com' 
AND role != 'admin';

-- 11. Delete equipment records
DELETE FROM so_center_equipment;

-- 12. Delete teaching records
DELETE FROM teaching_records;

-- 13. Delete exams
DELETE FROM exams;

-- Reset auto-increment sequences if needed (PostgreSQL doesn't auto-increment by default, but reset any sequences)
-- This ensures fresh IDs for new data

-- Note: We preserve:
-- - Admin user (navanidhi.care@gmail.com)
-- - Academic structure (classes, subjects, chapters, topics)
-- - Location data (states, districts, mandals, villages)
-- - System configuration tables

COMMIT;

-- Verification queries to check what remains
SELECT 'users' as table_name, COUNT(*) as remaining_records FROM users
UNION ALL
SELECT 'so_centers', COUNT(*) FROM so_centers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'tuition_progress', COUNT(*) FROM tuition_progress
UNION ALL
SELECT 'exam_results', COUNT(*) FROM exam_results
UNION ALL
SELECT 'product_orders', COUNT(*) FROM product_orders
UNION ALL
SELECT 'wallet_transactions', COUNT(*) FROM wallet_transactions
ORDER BY table_name;

-- Show remaining admin user
SELECT id, email, role, name, is_active 
FROM users 
WHERE email = 'navanidhi.care@gmail.com';