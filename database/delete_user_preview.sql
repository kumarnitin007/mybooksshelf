-- User Deletion Preview (Returns Results as Table)
-- This version returns a result table that shows in Supabase console
-- Replace 'kumarnitin007' with the actual username

WITH user_info AS (
  SELECT id as user_id, username, created_at
  FROM bk_users
  WHERE username = 'kumarnitin007'  -- ⚠️ REPLACE THIS WITH ACTUAL USERNAME
),
preview_data AS (
  SELECT 
    'User Info' as category,
    ui.username as item_name,
    ui.user_id::text as item_id,
    ui.created_at::text as additional_info,
    NULL::bigint as count
  FROM user_info ui

  UNION ALL

  SELECT 
    'Quiz Attempts' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_quiz_attempts WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Reading Reports' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_reading_reports WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Stories' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_stories WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Reading Challenges' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_reading_challenges WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Challenge Books' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_challenge_books 
     WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = (SELECT user_id FROM user_info))) as count

  UNION ALL

  SELECT 
    'User Rewards' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_user_rewards WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Achievements' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_achievements WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Reading Streaks' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_reading_streaks WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'XP Records' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_user_xp WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Bookshelves' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'Books' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_books 
     WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info))) as count

  UNION ALL

  SELECT 
    'Bookshelf Customizations' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_bookshelf_customizations 
     WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info))) as count

  UNION ALL

  SELECT 
    'Ignored Suggestions' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_ignored_suggestions WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'User Profiles' as category,
    NULL as item_name,
    NULL as item_id,
    NULL as additional_info,
    (SELECT COUNT(*) FROM bk_user_profiles WHERE user_id = (SELECT user_id FROM user_info)) as count

  UNION ALL

  SELECT 
    'TOTAL RECORDS' as category,
    NULL as item_name,
    NULL as item_id,
    'Sum of all above' as additional_info,
    (
      (SELECT COUNT(*) FROM bk_quiz_attempts WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_reading_reports WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_stories WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_reading_challenges WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_challenge_books WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = (SELECT user_id FROM user_info))) +
      (SELECT COUNT(*) FROM bk_user_rewards WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_achievements WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_reading_streaks WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_user_xp WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_books WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info))) +
      (SELECT COUNT(*) FROM bk_bookshelf_customizations WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = (SELECT user_id FROM user_info))) +
      (SELECT COUNT(*) FROM bk_ignored_suggestions WHERE user_id = (SELECT user_id FROM user_info)) +
      (SELECT COUNT(*) FROM bk_user_profiles WHERE user_id = (SELECT user_id FROM user_info)) +
      1
    ) as count
)
SELECT 
  category,
  item_name,
  item_id,
  additional_info,
  count
FROM preview_data
ORDER BY 
  CASE 
    WHEN category = 'User Info' THEN 1
    WHEN category = 'TOTAL RECORDS' THEN 999
    ELSE 2
  END,
  category;
