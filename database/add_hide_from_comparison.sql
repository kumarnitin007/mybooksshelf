-- Add hide_from_comparison column to bk_user_profiles
-- This allows users to opt out of appearing in the user comparison list

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bk_user_profiles' 
    AND column_name = 'hide_from_comparison'
  ) THEN
    ALTER TABLE bk_user_profiles 
    ADD COLUMN hide_from_comparison BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Column hide_from_comparison added to bk_user_profiles';
  ELSE
    RAISE NOTICE 'Column hide_from_comparison already exists';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_hide_from_comparison 
ON bk_user_profiles(hide_from_comparison) 
WHERE hide_from_comparison = FALSE;

