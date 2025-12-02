-- Gamification and Fun Features Schema (SAFE VERSION)
-- This version is safe to run on production databases with existing data
-- It only creates NEW tables and does NOT modify any existing tables

-- User XP and Levels
CREATE TABLE IF NOT EXISTS bk_user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Reading Streaks
CREATE TABLE IF NOT EXISTS bk_reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_reading_date DATE,
  streak_freeze_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Achievement Badges
CREATE TABLE IF NOT EXISTS bk_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_emoji VARCHAR(10) NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Virtual Rewards/Unlockables
CREATE TABLE IF NOT EXISTS bk_user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  reward_value TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reward_type, reward_name)
);

-- Story Creations
CREATE TABLE IF NOT EXISTS bk_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES bk_books(id) ON DELETE CASCADE,
  story_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Challenges
CREATE TABLE IF NOT EXISTS bk_reading_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  challenge_type VARCHAR(50) NOT NULL,
  challenge_name VARCHAR(200) NOT NULL,
  description TEXT,
  target_count INTEGER,
  current_count INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  reward_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Books
CREATE TABLE IF NOT EXISTS bk_challenge_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES bk_reading_challenges(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, book_id)
);

-- Reading Comprehension Quizzes
CREATE TABLE IF NOT EXISTS bk_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES bk_books(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS bk_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES bk_quizzes(id) ON DELETE CASCADE,
  selected_answer INTEGER,
  is_correct BOOLEAN,
  xp_earned INTEGER DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book Facts & Trivia
CREATE TABLE IF NOT EXISTS bk_book_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES bk_books(id) ON DELETE CASCADE,
  fact_type VARCHAR(50),
  title VARCHAR(200),
  content TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Reports
CREATE TABLE IF NOT EXISTS bk_reading_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES bk_users(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  books_read INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  hours_read DECIMAL(5,2) DEFAULT 0,
  favorite_genre VARCHAR(100),
  favorite_author VARCHAR(200),
  xp_earned INTEGER DEFAULT 0,
  achievements_earned INTEGER DEFAULT 0,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_type, period_start)
);

-- Bookshelf Customization
CREATE TABLE IF NOT EXISTS bk_bookshelf_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookshelf_id UUID NOT NULL REFERENCES bk_bookshelves(id) ON DELETE CASCADE,
  customization_type VARCHAR(50) NOT NULL,
  customization_value TEXT NOT NULL,
  position_x INTEGER,
  position_y INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (safe - IF NOT EXISTS prevents errors)
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON bk_user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON bk_reading_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON bk_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON bk_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON bk_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_book_id ON bk_stories(book_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON bk_reading_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_book_id ON bk_quizzes(book_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON bk_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_book_facts_book_id ON bk_book_facts(book_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON bk_reading_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_customizations_bookshelf_id ON bk_bookshelf_customizations(bookshelf_id);

-- Enable RLS (safe - only enables if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_user_xp' AND schemaname = 'public') THEN
    ALTER TABLE bk_user_xp ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS for all tables (using DO block to check if table exists first)
DO $$ 
BEGIN
  -- Enable RLS only if tables exist
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_reading_streaks' AND schemaname = 'public') THEN
    ALTER TABLE bk_reading_streaks ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_achievements' AND schemaname = 'public') THEN
    ALTER TABLE bk_achievements ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_user_rewards' AND schemaname = 'public') THEN
    ALTER TABLE bk_user_rewards ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_stories' AND schemaname = 'public') THEN
    ALTER TABLE bk_stories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_reading_challenges' AND schemaname = 'public') THEN
    ALTER TABLE bk_reading_challenges ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_challenge_books' AND schemaname = 'public') THEN
    ALTER TABLE bk_challenge_books ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_quizzes' AND schemaname = 'public') THEN
    ALTER TABLE bk_quizzes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_quiz_attempts' AND schemaname = 'public') THEN
    ALTER TABLE bk_quiz_attempts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_book_facts' AND schemaname = 'public') THEN
    ALTER TABLE bk_book_facts ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_reading_reports' AND schemaname = 'public') THEN
    ALTER TABLE bk_reading_reports ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bk_bookshelf_customizations' AND schemaname = 'public') THEN
    ALTER TABLE bk_bookshelf_customizations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies (using DO block to check if policy exists before creating)
DO $$ 
BEGIN
  -- XP Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_user_xp' AND policyname = 'Users can view own XP') THEN
    CREATE POLICY "Users can view own XP" ON bk_user_xp FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_user_xp' AND policyname = 'Users can update own XP') THEN
    CREATE POLICY "Users can update own XP" ON bk_user_xp FOR UPDATE USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_user_xp' AND policyname = 'Users can insert own XP') THEN
    CREATE POLICY "Users can insert own XP" ON bk_user_xp FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- Streak Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_streaks' AND policyname = 'Users can view own streaks') THEN
    CREATE POLICY "Users can view own streaks" ON bk_reading_streaks FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_streaks' AND policyname = 'Users can update own streaks') THEN
    CREATE POLICY "Users can update own streaks" ON bk_reading_streaks FOR UPDATE USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_streaks' AND policyname = 'Users can insert own streaks') THEN
    CREATE POLICY "Users can insert own streaks" ON bk_reading_streaks FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- Achievement Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_achievements' AND policyname = 'Users can view own achievements') THEN
    CREATE POLICY "Users can view own achievements" ON bk_achievements FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_achievements' AND policyname = 'Users can insert own achievements') THEN
    CREATE POLICY "Users can insert own achievements" ON bk_achievements FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- Reward Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_user_rewards' AND policyname = 'Users can view own rewards') THEN
    CREATE POLICY "Users can view own rewards" ON bk_user_rewards FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_user_rewards' AND policyname = 'Users can insert own rewards') THEN
    CREATE POLICY "Users can insert own rewards" ON bk_user_rewards FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- Story Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_stories' AND policyname = 'Users can manage own stories') THEN
    CREATE POLICY "Users can manage own stories" ON bk_stories FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_stories' AND policyname = 'Anyone can view public stories') THEN
    CREATE POLICY "Anyone can view public stories" ON bk_stories FOR SELECT USING (is_public = true);
  END IF;

  -- Challenge Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_challenges' AND policyname = 'Users can manage own challenges') THEN
    CREATE POLICY "Users can manage own challenges" ON bk_reading_challenges FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;

  -- Quiz Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_quizzes' AND policyname = 'Anyone can view quizzes') THEN
    CREATE POLICY "Anyone can view quizzes" ON bk_quizzes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_quiz_attempts' AND policyname = 'Users can manage own quiz attempts') THEN
    CREATE POLICY "Users can manage own quiz attempts" ON bk_quiz_attempts FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;

  -- Book Facts Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_book_facts' AND policyname = 'Anyone can view book facts') THEN
    CREATE POLICY "Anyone can view book facts" ON bk_book_facts FOR SELECT USING (true);
  END IF;

  -- Report Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_reports' AND policyname = 'Users can view own reports') THEN
    CREATE POLICY "Users can view own reports" ON bk_reading_reports FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_reading_reports' AND policyname = 'Users can insert own reports') THEN
    CREATE POLICY "Users can insert own reports" ON bk_reading_reports FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;

  -- Customization Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bk_bookshelf_customizations' AND policyname = 'Users can manage own customizations') THEN
    CREATE POLICY "Users can manage own customizations" ON bk_bookshelf_customizations FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bk_bookshelves 
        WHERE bk_bookshelves.id = bk_bookshelf_customizations.bookshelf_id 
        AND bk_bookshelves.user_id::text = auth.uid()::text
      )
    );
  END IF;
END $$;

