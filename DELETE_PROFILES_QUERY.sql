-- =============================================
-- DELETE PROFILES AND USERS - SQL QUERIES
-- =============================================

-- STEP 1: Delete all profiles (your custom table)
-- This will delete profiles and cascade delete related entries
DELETE FROM profiles;

-- STEP 2: Delete all users from auth.users (requires admin/service role)
-- WARNING: This permanently deletes all user accounts
-- You can only do this via SQL Editor with service role, NOT from your app
DELETE FROM auth.users;

-- =============================================
-- ALTERNATIVE: Delete specific user/profile
-- =============================================

-- Delete profile by email (example)
DELETE FROM profiles 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Delete user by email (requires admin access)
DELETE FROM auth.users WHERE email = 'user@example.com';

-- =============================================
-- RESET AUTO-INCREMENT/SEQUENCES (if any)
-- =============================================

-- If you have any sequences, reset them:
-- ALTER SEQUENCE profiles_id_seq RESTART WITH 1;

-- =============================================
-- SAFE WAY TO DELETE ALL (via Supabase Dashboard)
-- =============================================

-- Option 1: Via Table Editor
-- 1. Go to Table Editor → profiles
-- 2. Select all rows (or use filter)
-- 3. Click Delete button

-- Option 2: Via SQL Editor (use these queries)

-- Delete all profiles first
DELETE FROM profiles;

-- Then delete all users (if you have admin access)
DELETE FROM auth.users;

-- =============================================
-- CAUTION NOTES
-- =============================================
-- ⚠️ This will delete ALL profiles and users
-- ⚠️ This cannot be undone
-- ⚠️ Related data in entries, friend_requests, etc. will also be deleted (due to CASCADE)
-- ⚠️ Make sure you have backups if needed
-- ⚠️ After deleting, you can sign up with the same emails again

