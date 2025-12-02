-- Delete User from Supabase Auth (auth.users table)
-- WARNING: This requires admin access and will permanently delete the auth user
-- This should be run AFTER deleting from application tables

-- ============================================
-- OPTION 1: Delete by Email (Recommended)
-- ============================================
-- Replace 'user@example.com' with the actual email address
DO $$
DECLARE
  target_email TEXT := 'user@example.com';  -- ⚠️ REPLACE WITH ACTUAL EMAIL
  auth_user_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Find the auth user by email
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with email: %', target_email;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found auth user with ID: %', auth_user_id;
  RAISE NOTICE 'Deleting auth user...';
  
  -- Delete from auth.users (this will cascade to related auth tables)
  DELETE FROM auth.users WHERE id = auth_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Successfully deleted auth user: % (ID: %)', target_email, auth_user_id;
  ELSE
    RAISE NOTICE 'Failed to delete auth user: %', target_email;
  END IF;
  
END $$;

-- ============================================
-- OPTION 2: Delete by Username (if email is unknown)
-- ============================================
-- First, find the auth user by matching username or app user ID
DO $$
DECLARE
  target_username TEXT := 'kumarnitin007';  -- ⚠️ REPLACE WITH ACTUAL USERNAME
  auth_user_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Try to find auth user by username in metadata or by matching app user ID
  SELECT au.id INTO auth_user_id
  FROM auth.users au
  WHERE au.raw_user_meta_data->>'username' = target_username
     OR au.id::text IN (
       SELECT id::text FROM bk_users WHERE username = target_username
     )
  LIMIT 1;
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found with username: %', target_username;
    RAISE NOTICE 'Try finding by email using Option 1 instead';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found auth user with ID: %', auth_user_id;
  RAISE NOTICE 'Deleting auth user...';
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = auth_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Successfully deleted auth user with username: % (ID: %)', target_username, auth_user_id;
  ELSE
    RAISE NOTICE 'Failed to delete auth user: %', target_username;
  END IF;
  
END $$;

-- ============================================
-- ALTERNATIVE: Use Supabase Dashboard (Recommended)
-- ============================================
-- Instead of SQL, you can delete auth users via Supabase Dashboard:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Search for the user by email
-- 3. Click on the user
-- 4. Click "Delete User" button
-- This is safer and provides better audit trail

