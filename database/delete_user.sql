-- Delete User and All Associated Data
-- WARNING: This will permanently delete a user and ALL their data!
-- Use with extreme caution. Consider backing up data first.

-- Usage:
-- 1. Replace 'USER_ID_HERE' with the actual user ID (UUID)
-- 2. Review what will be deleted
-- 3. Run in a transaction first to preview, then commit if correct

-- Example:
-- BEGIN;
-- -- Run the delete statements
-- -- Review the results
-- -- If correct: COMMIT;
-- -- If incorrect: ROLLBACK;

-- ============================================
-- CONFIGURATION: Set the username or user ID to delete
-- ============================================
DO $$
DECLARE
  -- OPTION A: Use username (easier - uncomment this and comment out OPTION B)
  target_username TEXT := 'kumarnitin007'; -- ⚠️ REPLACE THIS WITH ACTUAL USERNAME
  
  -- OPTION B: Use UUID directly (uncomment this and comment out OPTION A)
  -- target_user_id UUID := 'USER_ID_HERE'; -- ⚠️ REPLACE THIS WITH ACTUAL USER ID
  
  target_user_id UUID;
  user_username TEXT;
  deleted_counts RECORD;
BEGIN
  -- If using username, look up the UUID
  IF target_username IS NOT NULL THEN
    SELECT id, username INTO target_user_id, user_username
    FROM bk_users
    WHERE username = target_username;
    
    IF user_username IS NULL THEN
      RAISE EXCEPTION 'User with username "%" does not exist!', target_username;
    END IF;
  ELSE
    -- If using UUID directly
    SELECT username INTO user_username
    FROM bk_users
    WHERE id = target_user_id;
    
    IF user_username IS NULL THEN
      RAISE EXCEPTION 'User with ID % does not exist!', target_user_id;
    END IF;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELETING USER: % (ID: %)', user_username, target_user_id;
  RAISE NOTICE '========================================';
  
  -- Delete in order to respect foreign key constraints
  
  -- 1. Delete quiz attempts (references user)
  DELETE FROM bk_quiz_attempts WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % quiz attempts', deleted_counts;
  
  -- 2. Delete reading reports (references user)
  DELETE FROM bk_reading_reports WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading reports', deleted_counts;
  
  -- 3. Delete stories (references user)
  DELETE FROM bk_stories WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % stories', deleted_counts;
  
  -- 4. Delete reading challenges and their books (references user)
  DELETE FROM bk_challenge_books 
  WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % challenge book links', deleted_counts;
  
  DELETE FROM bk_reading_challenges WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading challenges', deleted_counts;
  
  -- 5. Delete user rewards (references user)
  DELETE FROM bk_user_rewards WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % user rewards', deleted_counts;
  
  -- 6. Delete achievements (references user)
  DELETE FROM bk_achievements WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % achievements', deleted_counts;
  
  -- 7. Delete reading streaks (references user)
  DELETE FROM bk_reading_streaks WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading streak records', deleted_counts;
  
  -- 8. Delete user XP (references user)
  DELETE FROM bk_user_xp WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % XP records', deleted_counts;
  
  -- 9. Delete bookshelf customizations (references bookshelves, which reference user)
  DELETE FROM bk_bookshelf_customizations 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % bookshelf customizations', deleted_counts;
  
  -- 10. Delete books (references bookshelves, which reference user)
  DELETE FROM bk_books 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % books', deleted_counts;
  
  -- 11. Delete ignored suggestions (references user)
  DELETE FROM bk_ignored_suggestions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % ignored suggestions', deleted_counts;
  
  -- 12. Delete bookshelves (references user)
  DELETE FROM bk_bookshelves WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % bookshelves', deleted_counts;
  
  -- 13. Delete user profile (references user)
  DELETE FROM bk_user_profiles WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % user profiles', deleted_counts;
  
  -- 14. Finally, delete the user (this will cascade if ON DELETE CASCADE is set)
  DELETE FROM bk_users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % users', deleted_counts;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User % (ID: %) has been DELETED', user_username, target_user_id;
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================
-- ALTERNATIVE: Simple version with user ID parameter
-- ============================================
-- Uncomment and use this if you prefer a simpler approach:

/*
-- Set the user ID here
\set user_id 'USER_ID_HERE'

-- Delete all user data
DELETE FROM bk_quiz_attempts WHERE user_id = :'user_id';
DELETE FROM bk_reading_reports WHERE user_id = :'user_id';
DELETE FROM bk_stories WHERE user_id = :'user_id';
DELETE FROM bk_challenge_books WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = :'user_id');
DELETE FROM bk_reading_challenges WHERE user_id = :'user_id';
DELETE FROM bk_user_rewards WHERE user_id = :'user_id';
DELETE FROM bk_achievements WHERE user_id = :'user_id';
DELETE FROM bk_reading_streaks WHERE user_id = :'user_id';
DELETE FROM bk_user_xp WHERE user_id = :'user_id';
DELETE FROM bk_bookshelf_customizations WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = :'user_id');
DELETE FROM bk_books WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = :'user_id');
DELETE FROM bk_ignored_suggestions WHERE user_id = :'user_id';
DELETE FROM bk_bookshelves WHERE user_id = :'user_id';
DELETE FROM bk_user_profiles WHERE user_id = :'user_id';
DELETE FROM bk_users WHERE id = :'user_id';
*/

