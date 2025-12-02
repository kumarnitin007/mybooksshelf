-- Safe User Deletion Script (With Preview)
-- This version shows what will be deleted BEFORE actually deleting
-- Run this first to see what will be deleted, then run delete_user_by_username.sql if correct

-- ============================================
-- STEP 1: Set the username to check
-- ============================================
-- Replace 'kumarnitin007' with the actual username
\set target_username 'kumarnitin007'

-- ============================================
-- STEP 2: Preview - Shows counts as a result table
-- ============================================
WITH user_info AS (
  SELECT id as user_id, username
  FROM bk_users
  WHERE username = :'target_username'
),
counts AS (
  SELECT 
    (SELECT COUNT(*) FROM bk_quiz_attempts WHERE user_id = ui.user_id) as quiz_attempts,
    (SELECT COUNT(*) FROM bk_reading_reports WHERE user_id = ui.user_id) as reading_reports,
    (SELECT COUNT(*) FROM bk_stories WHERE user_id = ui.user_id) as stories,
    (SELECT COUNT(*) FROM bk_reading_challenges WHERE user_id = ui.user_id) as reading_challenges,
    (SELECT COUNT(*) FROM bk_challenge_books 
     WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = ui.user_id)) as challenge_books,
    (SELECT COUNT(*) FROM bk_user_rewards WHERE user_id = ui.user_id) as user_rewards,
    (SELECT COUNT(*) FROM bk_achievements WHERE user_id = ui.user_id) as achievements,
    (SELECT COUNT(*) FROM bk_reading_streaks WHERE user_id = ui.user_id) as reading_streaks,
    (SELECT COUNT(*) FROM bk_user_xp WHERE user_id = ui.user_id) as xp_records,
    (SELECT COUNT(*) FROM bk_bookshelves WHERE user_id = ui.user_id) as bookshelves,
    (SELECT COUNT(*) FROM bk_books 
     WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = ui.user_id)) as books,
    (SELECT COUNT(*) FROM bk_bookshelf_customizations 
     WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = ui.user_id)) as bookshelf_customizations,
    (SELECT COUNT(*) FROM bk_ignored_suggestions WHERE user_id = ui.user_id) as ignored_suggestions,
    (SELECT COUNT(*) FROM bk_user_profiles WHERE user_id = ui.user_id) as user_profiles
  FROM user_info ui
)
SELECT 
  ui.username,
  ui.user_id,
  c.quiz_attempts,
  c.reading_reports,
  c.stories,
  c.reading_challenges,
  c.challenge_books,
  c.user_rewards,
  c.achievements,
  c.reading_streaks,
  c.xp_records,
  c.bookshelves,
  c.books,
  c.bookshelf_customizations,
  c.ignored_suggestions,
  c.user_profiles,
  1 as user_record,
  (c.quiz_attempts + c.reading_reports + c.stories + c.reading_challenges + c.challenge_books + 
   c.user_rewards + c.achievements + c.reading_streaks + c.xp_records + c.bookshelves + 
   c.books + c.bookshelf_customizations + c.ignored_suggestions + c.user_profiles + 1) as total_records
FROM user_info ui
CROSS JOIN counts c;

-- ============================================
-- Alternative: Simple version using DO block (shows in messages)
-- ============================================
-- If the above doesn't show results, uncomment this version:
/*
DO $$
DECLARE
  target_username TEXT := 'kumarnitin007'; -- ⚠️ REPLACE THIS WITH ACTUAL USERNAME
  target_user_id UUID;
  user_username TEXT;
  counts RECORD;
BEGIN
  -- Look up user by username
  SELECT id, username INTO target_user_id, user_username
  FROM bk_users
  WHERE username = target_username;
  
  IF user_username IS NULL THEN
    RAISE EXCEPTION 'User with username "%" does not exist!', target_username;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PREVIEW: Data that will be deleted for user: % (Username: %, ID: %)', user_username, target_username, target_user_id;
  RAISE NOTICE '========================================';
  
  -- Count records that will be deleted
  SELECT COUNT(*) INTO counts FROM bk_quiz_attempts WHERE user_id = target_user_id;
  RAISE NOTICE 'Quiz Attempts: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_reading_reports WHERE user_id = target_user_id;
  RAISE NOTICE 'Reading Reports: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_stories WHERE user_id = target_user_id;
  RAISE NOTICE 'Stories: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_reading_challenges WHERE user_id = target_user_id;
  RAISE NOTICE 'Reading Challenges: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_challenge_books 
  WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = target_user_id);
  RAISE NOTICE 'Challenge Books: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_user_rewards WHERE user_id = target_user_id;
  RAISE NOTICE 'User Rewards: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_achievements WHERE user_id = target_user_id;
  RAISE NOTICE 'Achievements: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_reading_streaks WHERE user_id = target_user_id;
  RAISE NOTICE 'Reading Streaks: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_user_xp WHERE user_id = target_user_id;
  RAISE NOTICE 'XP Records: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_bookshelves WHERE user_id = target_user_id;
  RAISE NOTICE 'Bookshelves: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_books 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  RAISE NOTICE 'Books: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_bookshelf_customizations 
  WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  RAISE NOTICE 'Bookshelf Customizations: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_ignored_suggestions WHERE user_id = target_user_id;
  RAISE NOTICE 'Ignored Suggestions: %', counts;
  
  SELECT COUNT(*) INTO counts FROM bk_user_profiles WHERE user_id = target_user_id;
  RAISE NOTICE 'User Profiles: %', counts;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total User Record: 1';
  RAISE NOTICE 'Total Records to Delete: %', (
    (SELECT COUNT(*) FROM bk_quiz_attempts WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_reading_reports WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_stories WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_reading_challenges WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_challenge_books WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = target_user_id)) +
    (SELECT COUNT(*) FROM bk_user_rewards WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_achievements WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_reading_streaks WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_user_xp WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_bookshelves WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_books WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id)) +
    (SELECT COUNT(*) FROM bk_bookshelf_customizations WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id)) +
    (SELECT COUNT(*) FROM bk_ignored_suggestions WHERE user_id = target_user_id) +
    (SELECT COUNT(*) FROM bk_user_profiles WHERE user_id = target_user_id) +
    1
  );
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If these numbers look correct, proceed with delete_user_by_username.sql';
  RAISE NOTICE 'WARNING: This action cannot be undone!';
  
END $$;
*/

-- ============================================
-- STEP 2: Get user ID from username (helper query)
-- ============================================
-- If you know the username but not the ID, use this:
/*
SELECT id, username, created_at 
FROM bk_users 
WHERE username = 'USERNAME_HERE';
-- Then use the ID from the result in the delete script
*/

-- ============================================
-- STEP 3: List all users (helper query)
-- ============================================
-- To see all users before deleting:
/*
SELECT 
  id,
  username,
  created_at,
  (SELECT COUNT(*) FROM bk_bookshelves WHERE user_id = bk_users.id) as bookshelf_count,
  (SELECT COUNT(*) FROM bk_books WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = bk_users.id)) as book_count
FROM bk_users
ORDER BY created_at DESC;
*/

