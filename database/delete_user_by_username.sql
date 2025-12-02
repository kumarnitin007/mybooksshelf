-- Delete User by Username (Simplified Version)
-- This version accepts a username instead of UUID for easier use
-- WARNING: This will permanently delete a user and ALL their data!

-- ============================================
-- CONFIGURATION: Set the username to delete
-- ============================================
DO $$
DECLARE
  target_username TEXT := 'kumarnitin007'; -- ⚠️ REPLACE THIS WITH ACTUAL USERNAME
  target_user_id UUID;
  user_username TEXT;
  deleted_counts INTEGER;
BEGIN
  -- Look up user by username
  SELECT id, username INTO target_user_id, user_username
  FROM bk_users
  WHERE username = target_username;
  
  IF user_username IS NULL THEN
    RAISE EXCEPTION 'User with username "%" does not exist!', target_username;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELETING USER: % (ID: %)', user_username, target_user_id;
  RAISE NOTICE '========================================';
  
  -- Delete in order to respect foreign key constraints
  
  -- 1. Delete quiz attempts
  DELETE FROM bk_quiz_attempts WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % quiz attempts', deleted_counts;
  
  -- 2. Delete reading reports
  DELETE FROM bk_reading_reports WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading reports', deleted_counts;
  
  -- 3. Delete stories
  DELETE FROM bk_stories WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % stories', deleted_counts;
  
  -- 4. Delete challenge books
  DELETE FROM bk_challenge_books 
  WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % challenge book links', deleted_counts;
  
  -- 5. Delete reading challenges
  DELETE FROM bk_reading_challenges WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading challenges', deleted_counts;
  
  -- 6. Delete user rewards
  DELETE FROM bk_user_rewards WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % user rewards', deleted_counts;
  
  -- 7. Delete achievements
  DELETE FROM bk_achievements WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % achievements', deleted_counts;
  
  -- 8. Delete reading streaks
  DELETE FROM bk_reading_streaks WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % reading streak records', deleted_counts;
  
  -- 9. Delete user XP
  DELETE FROM bk_user_xp WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % XP records', deleted_counts;
  
  -- 10. Delete bookshelf customizations
  DELETE FROM bk_bookshelf_customizations 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % bookshelf customizations', deleted_counts;
  
  -- 11. Delete books
  DELETE FROM bk_books 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % books', deleted_counts;
  
  -- 12. Delete ignored suggestions
  DELETE FROM bk_ignored_suggestions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % ignored suggestions', deleted_counts;
  
  -- 13. Delete bookshelves
  DELETE FROM bk_bookshelves WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % bookshelves', deleted_counts;
  
  -- 14. Delete user profile
  DELETE FROM bk_user_profiles WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % user profiles', deleted_counts;
  
  -- 15. Finally, delete the user
  DELETE FROM bk_users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_counts = ROW_COUNT;
  RAISE NOTICE 'Deleted % users', deleted_counts;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User % (ID: %) has been DELETED', user_username, target_user_id;
  RAISE NOTICE '========================================';
  
END $$;

