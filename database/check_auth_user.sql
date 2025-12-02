-- Check if user exists in Supabase Auth
-- This helps identify if a user needs to be deleted from auth.users table

-- Replace 'kumarnitin007' with the username or email you're checking
WITH app_user AS (
  SELECT id, username
  FROM bk_users
  WHERE username = 'kumarnitin007'  -- ⚠️ REPLACE WITH USERNAME
)
SELECT 
  'Application User' as source,
  au.id::text as user_id,
  au.username,
  NULL::text as email,
  NULL::text as created_at
FROM app_user au

UNION ALL

SELECT 
  'Supabase Auth User' as source,
  auth_u.id::text as user_id,
  COALESCE(auth_u.raw_user_meta_data->>'username', 'N/A') as username,
  auth_u.email,
  auth_u.created_at::text as created_at
FROM auth.users auth_u
WHERE auth_u.id::text IN (SELECT id::text FROM app_user)
   OR auth_u.email = 'kumarnitin007'  -- ⚠️ REPLACE WITH EMAIL IF CHECKING DIRECTLY
   OR auth_u.raw_user_meta_data->>'username' = 'kumarnitin007'  -- Check by username in metadata

ORDER BY source, created_at;

-- ============================================
-- Alternative: Check by email directly
-- ============================================
-- If you know the email but not the username:
/*
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';  -- Replace with actual email
*/

-- ============================================
-- Alternative: List all auth users with usernames
-- ============================================
-- To see all users in Supabase Auth:
/*
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM bk_users WHERE bk_users.id::text = auth.users.id::text) 
    THEN 'Has App Account' 
    ELSE 'No App Account' 
  END as app_account_status
FROM auth.users
ORDER BY created_at DESC;
*/

