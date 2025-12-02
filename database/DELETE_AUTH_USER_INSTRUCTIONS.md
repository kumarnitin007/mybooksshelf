# Deleting Users from Supabase Auth

## The Problem

When you delete a user using the application deletion scripts (`delete_user_by_username.sql`), it only removes the user from your **application tables** (`bk_users`, `bk_user_profiles`, etc.), but **NOT** from Supabase's internal **authentication tables** (`auth.users`).

This means:
- ✅ User data is deleted from your app
- ❌ User still exists in Supabase Auth
- ❌ Email is still "registered" in Supabase Auth
- ❌ User cannot sign up again with the same email

## Solution: Delete from Supabase Auth

You have **two options** to delete the user from Supabase Auth:

---

## Option 1: Using Supabase Dashboard (Recommended) ⭐

This is the **safest and easiest** method:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Search for the user by email address
4. Click on the user to open their details
5. Click the **"Delete User"** button
6. Confirm the deletion

**Advantages:**
- ✅ Safe and user-friendly
- ✅ Provides audit trail
- ✅ No SQL required
- ✅ Handles all related auth data automatically

---

## Option 2: Using SQL Script

If you prefer to use SQL, you can use `delete_auth_user.sql`:

1. Open `delete_auth_user.sql` in Supabase SQL Editor
2. Replace `'user@example.com'` with the actual email address
3. Run the script

**Note:** This requires admin access to the `auth.users` table. If you get a permission error, use Option 1 instead.

---

## Finding the User's Email

If you only know the username, you can find the email using:

```sql
SELECT email, username, created_at
FROM bk_users
WHERE username = 'kumarnitin007';  -- Replace with username
```

Or check both application and auth tables:

```sql
-- Run check_auth_user.sql to see if user exists in both places
```

---

## Complete Deletion Process

To completely remove a user from your system:

1. **First:** Delete from application tables using `delete_user_by_username.sql`
2. **Then:** Delete from Supabase Auth using either:
   - Supabase Dashboard (Option 1 - Recommended)
   - SQL script `delete_auth_user.sql` (Option 2)

---

## Important Notes

⚠️ **Deleting from `auth.users` is permanent and cannot be undone!**

⚠️ **After deleting from auth.users, the user can sign up again with the same email.**

⚠️ **If you're using Row Level Security (RLS) policies that reference `auth.uid()`, deleting the auth user will prevent any orphaned application data from being accessed (which is good for security).**

---

## Troubleshooting

**Q: I get a permission error when trying to delete from `auth.users` via SQL**
- **A:** Use the Supabase Dashboard instead (Option 1). The `auth.users` table has restricted permissions.

**Q: The user still can't sign up after deleting from auth**
- **A:** Make sure you deleted from BOTH:
  1. Application tables (`bk_users`, etc.) ✅
  2. Supabase Auth (`auth.users`) ✅

**Q: How do I verify the user is completely deleted?**
- **A:** Run `check_auth_user.sql` to see if the user exists in either location.

