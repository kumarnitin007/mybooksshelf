# Delete User Script Instructions

## ⚠️ WARNING
**This will permanently delete a user and ALL their data!**
- All books
- All bookshelves
- All achievements
- All XP and streaks
- All challenges
- All stories
- Everything associated with the user

**This action cannot be undone!**

## 📋 Step-by-Step Process

### Step 1: Preview What Will Be Deleted

1. Open `delete_user_safe.sql` in Supabase SQL Editor
2. Replace `'kumarnitin007'` with the actual username (or use UUID if preferred)
3. Run the script
4. Review the output to see what will be deleted
5. Verify the counts are correct

**The script now accepts usernames directly!** Just replace the username in the script.

**To find a user ID (if needed):**
```sql
-- If you know the username:
SELECT id, username, created_at 
FROM bk_users 
WHERE username = 'username_here';

-- Or list all users:
SELECT id, username, created_at 
FROM bk_users 
ORDER BY created_at DESC;
```

### Step 2: Backup (Recommended)

Before deleting, consider exporting the user's data:

```sql
-- Export user's books (example)
SELECT * FROM bk_books 
WHERE bookshelf_id IN (
  SELECT id FROM bk_bookshelves 
  WHERE user_id = 'USER_ID_HERE'
);
```

### Step 3: Delete the User

**Option A: Delete by Username (Easier)**
1. Open `delete_user_by_username.sql` in Supabase SQL Editor
2. Replace `'kumarnitin007'` with the actual username
3. **Run in a transaction first** to be safe:

**Option B: Delete by UUID**
1. Open `delete_user.sql` in Supabase SQL Editor
2. Replace the username or UUID with the actual value
3. **Run in a transaction first** to be safe:

```sql
BEGIN;

-- Copy and paste the DO block from delete_user.sql here
-- (with the user ID replaced)

-- Review the NOTICE messages
-- If everything looks correct:
COMMIT;

-- If something is wrong:
ROLLBACK;
```

### Step 4: Verify Deletion

```sql
-- Check if user still exists
SELECT * FROM bk_users WHERE id = 'USER_ID_HERE';
-- Should return 0 rows

-- Check if any orphaned data remains
SELECT COUNT(*) FROM bk_books 
WHERE bookshelf_id IN (
  SELECT id FROM bk_bookshelves 
  WHERE user_id = 'USER_ID_HERE'
);
-- Should return 0
```

## 🔍 What Gets Deleted (in order)

1. Quiz attempts
2. Reading reports
3. Stories
4. Challenge books (linked to challenges)
5. Reading challenges
6. User rewards
7. Achievements
8. Reading streaks
9. User XP
10. Bookshelf customizations
11. Books
12. Ignored suggestions
13. Bookshelves
14. User profiles
15. User record

## 🛡️ Safety Features

- The script checks if the user exists before deleting
- Shows counts of what's being deleted
- Can be run in a transaction for rollback capability
- Deletes in correct order to respect foreign key constraints

## 📝 Example Usage

```sql
-- 1. Find the user
SELECT id, username FROM bk_users WHERE username = 'testuser';

-- Result: id = '123e4567-e89b-12d3-a456-426614174000'

-- 2. Preview deletion
-- Run delete_user_safe.sql with the ID

-- 3. Delete in transaction
BEGIN;
-- Run delete_user.sql with the ID
-- Review output
COMMIT; -- or ROLLBACK if needed
```

## ⚡ Quick Delete (Advanced)

If you're confident and want a quick delete:

```sql
-- Replace USER_ID_HERE with actual UUID
DO $$
DECLARE
  target_user_id UUID := 'USER_ID_HERE';
BEGIN
  DELETE FROM bk_quiz_attempts WHERE user_id = target_user_id;
  DELETE FROM bk_reading_reports WHERE user_id = target_user_id;
  DELETE FROM bk_stories WHERE user_id = target_user_id;
  DELETE FROM bk_challenge_books WHERE challenge_id IN (SELECT id FROM bk_reading_challenges WHERE user_id = target_user_id);
  DELETE FROM bk_reading_challenges WHERE user_id = target_user_id;
  DELETE FROM bk_user_rewards WHERE user_id = target_user_id;
  DELETE FROM bk_achievements WHERE user_id = target_user_id;
  DELETE FROM bk_reading_streaks WHERE user_id = target_user_id;
  DELETE FROM bk_user_xp WHERE user_id = target_user_id;
  DELETE FROM bk_bookshelf_customizations WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  DELETE FROM bk_books WHERE bookshelf_id IN (SELECT id FROM bk_bookshelves WHERE user_id = target_user_id);
  DELETE FROM bk_ignored_suggestions WHERE user_id = target_user_id;
  DELETE FROM bk_bookshelves WHERE user_id = target_user_id;
  DELETE FROM bk_user_profiles WHERE user_id = target_user_id;
  DELETE FROM bk_users WHERE id = target_user_id;
END $$;
```

## 🚨 Important Notes

- **Always preview first** using `delete_user_safe.sql`
- **Use transactions** for safety
- **Backup important data** before deletion
- **Double-check the user ID** before running
- **This cannot be undone** - deletion is permanent

