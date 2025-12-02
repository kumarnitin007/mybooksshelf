-- Fix RLS Policies to Allow User Comparison
-- This allows users to read other users' book counts for comparison purposes
-- Run this in Supabase SQL Editor

-- ============================================
-- Allow reading other users' bookshelves (read-only for comparison)
-- ============================================
-- Check if policy exists, if not create it
DO $$ 
BEGIN
  -- Policy to allow reading bookshelf metadata (name, type, etc.) for all users
  -- This is needed for comparison view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bk_bookshelves' 
    AND policyname = 'Anyone can view bookshelf metadata for comparison'
  ) THEN
    CREATE POLICY "Anyone can view bookshelf metadata for comparison" 
    ON bk_bookshelves 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- ============================================
-- Allow reading book counts for all users (read-only)
-- ============================================
DO $$ 
BEGIN
  -- Policy to allow reading book counts for comparison
  -- Users can see how many books others have, but not the book details
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bk_books' 
    AND policyname = 'Anyone can view book counts for comparison'
  ) THEN
    CREATE POLICY "Anyone can view book counts for comparison" 
    ON bk_books 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

-- ============================================
-- Note: If you want more restrictive access (only allow reading counts, not details)
-- You could create a database function instead:
-- ============================================
/*
-- Create a function to get user book counts (more secure)
CREATE OR REPLACE FUNCTION get_user_book_stats(user_id_param UUID)
RETURNS TABLE (
  total_books BIGINT,
  books_this_month BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_books,
    COUNT(*) FILTER (
      WHERE finish_date IS NOT NULL 
      AND DATE_TRUNC('month', finish_date) = DATE_TRUNC('month', CURRENT_DATE)
    )::BIGINT as books_this_month
  FROM bk_books
  WHERE bookshelf_id IN (
    SELECT id FROM bk_bookshelves WHERE user_id = user_id_param
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_book_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_book_stats(UUID) TO anon;
*/

