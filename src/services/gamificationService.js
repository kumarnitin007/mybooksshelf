/**
 * Gamification Service
 * 
 * Handles all gamification features including:
 * - XP and levels
 * - Reading streaks
 * - Achievements
 * - Virtual rewards
 * - Reading challenges
 * - Quizzes
 * - Reading reports
 */

import { supabase } from '../config/supabase';

// XP and Levels
export const getUserXP = async (userId) => {
  try {
    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } };
    }

    const { data, error } = await supabase
      .from('bk_user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() to handle missing records gracefully

    // If no XP record exists, try to create one
    if (!data && (!error || error.code === 'PGRST116')) {
      const { data: newData, error: createError } = await supabase
        .from('bk_user_xp')
        .insert([{
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          xp_to_next_level: 100
        }])
        .select()
        .maybeSingle();

      // If RLS policy blocks insert, return default values instead of error
      if (createError) {
        // Check if it's an RLS policy error (42501)
        if (createError.code === '42501') {
          console.warn('RLS policy blocks XP creation. Please run fix_user_xp_rls.sql');
          // Return default XP data instead of failing
          return { 
            data: {
              user_id: userId,
              total_xp: 0,
              current_level: 1,
              xp_to_next_level: 100
            }, 
            error: null 
          };
        }
        throw createError;
      }
      return { data: newData, error: null };
    }

    // If there was an error other than "not found", throw it
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user XP:', error);
    // Return default values on error to prevent app crashes
    return { 
      data: {
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100
      }, 
      error 
    };
  }
};

export const addXP = async (userId, xpAmount, reason = '') => {
  try {
    // Get current XP
    const { data: currentXP, error: fetchError } = await getUserXP(userId);
    if (fetchError) throw fetchError;

    const newTotalXP = (currentXP.data.total_xp || 0) + xpAmount;
    const currentLevel = currentXP.data.current_level || 1;
    
    // Calculate new level (100 XP per level, increasing by 50 each level)
    const baseXP = 100;
    const xpPerLevel = 50;
    let newLevel = currentLevel;
    let xpForCurrentLevel = 0;
    let xpToNextLevel = baseXP + (newLevel * xpPerLevel);

    // Check if leveled up
    let totalXPForLevel = 0;
    for (let level = 1; level <= newLevel; level++) {
      totalXPForLevel += baseXP + ((level - 1) * xpPerLevel);
    }

    while (newTotalXP >= totalXPForLevel + xpToNextLevel) {
      newLevel++;
      totalXPForLevel += xpToNextLevel;
      xpToNextLevel = baseXP + (newLevel * xpPerLevel);
    }

    xpForCurrentLevel = newTotalXP - totalXPForLevel;
    const newXPToNextLevel = xpToNextLevel - xpForCurrentLevel;

    const { data, error } = await supabase
      .from('bk_user_xp')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        xp_to_next_level: newXPToNextLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    const leveledUp = newLevel > currentLevel;
    return { data, error: null, leveledUp, newLevel };
  } catch (error) {
    console.error('Error adding XP:', error);
    return { data: null, error, leveledUp: false };
  }
};

// Reading Streaks
export const getUserStreak = async (userId) => {
  try {
    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } };
    }

    const { data, error } = await supabase
      .from('bk_reading_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() to handle missing records gracefully

    // If no streak exists, try to create one
    if (!data && (!error || error.code === 'PGRST116')) {
      const { data: newData, error: createError } = await supabase
        .from('bk_reading_streaks')
        .insert([{
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_reading_date: null
        }])
        .select()
        .maybeSingle();

      // If RLS policy blocks insert, return default values instead of error
      if (createError) {
        // Check if it's an RLS policy error (42501)
        if (createError.code === '42501') {
          console.warn('RLS policy blocks streak creation. Please run fix_reading_streaks_rls.sql');
          // Return default streak data instead of failing
          return { 
            data: {
              user_id: userId,
              current_streak: 0,
              longest_streak: 0,
              last_reading_date: null
            }, 
            error: null 
          };
        }
        throw createError;
      }
      return { data: newData, error: null };
    }

    // If there was an error other than "not found", throw it
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user streak:', error);
    // Return default values on error to prevent app crashes
    return { 
      data: {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_reading_date: null
      }, 
      error 
    };
  }
};

export const updateReadingStreak = async (userId, readingDate) => {
  try {
    const { data: streakData, error: fetchError } = await getUserStreak(userId);
    if (fetchError) throw fetchError;

    const streak = streakData.data;
    const today = new Date().toISOString().split('T')[0];
    const readingDateStr = readingDate || today;
    const lastDate = streak.last_reading_date ? new Date(streak.last_reading_date).toISOString().split('T')[0] : null;

    let newStreak = streak.current_streak || 0;
    let longestStreak = streak.longest_streak || 0;
    let usedFreeze = streak.streak_freeze_used || false;

    if (!lastDate) {
      // First reading
      newStreak = 1;
    } else {
      const lastDateObj = new Date(lastDate);
      const readingDateObj = new Date(readingDateStr);
      const daysDiff = Math.floor((readingDateObj - lastDateObj) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        return { data: streak, error: null };
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = (streak.current_streak || 0) + 1;
        usedFreeze = false; // Reset freeze on successful day
      } else if (daysDiff === 2 && !usedFreeze) {
        // One day missed, use freeze
        newStreak = (streak.current_streak || 0) + 1;
        usedFreeze = true;
      } else {
        // Streak broken
        newStreak = 1;
        usedFreeze = false;
      }
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    const { data, error } = await supabase
      .from('bk_reading_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_reading_date: readingDateStr,
        streak_freeze_used: usedFreeze,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null, streakIncreased: newStreak > (streak.current_streak || 0) };
  } catch (error) {
    console.error('Error updating reading streak:', error);
    return { data: null, error };
  }
};

// Achievements
export const getAchievements = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('bk_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return { data: [], error };
  }
};

export const awardAchievement = async (userId, badgeType, badgeName, badgeEmoji, badgeDescription) => {
  try {
    // Check if already earned
    const { data: existing } = await supabase
      .from('bk_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_type', badgeType)
      .single();

    if (existing) {
      return { data: existing, error: null, alreadyEarned: true };
    }

    const { data, error } = await supabase
      .from('bk_achievements')
      .insert([{
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_emoji: badgeEmoji,
        badge_description: badgeDescription
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, alreadyEarned: false };
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return { data: null, error };
  }
};

// Virtual Rewards
export const getUserRewards = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_user_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return { data: [], error };
  }
};

export const unlockReward = async (userId, rewardType, rewardName, rewardValue) => {
  try {
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('bk_user_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_type', rewardType)
      .eq('reward_name', rewardName)
      .single();

    if (existing) {
      return { data: existing, error: null, alreadyUnlocked: true };
    }

    const { data, error } = await supabase
      .from('bk_user_rewards')
      .insert([{
        user_id: userId,
        reward_type: rewardType,
        reward_name: rewardName,
        reward_value: rewardValue
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null, alreadyUnlocked: false };
  } catch (error) {
    console.error('Error unlocking reward:', error);
    return { data: null, error };
  }
};

// Reading Challenges
export const getChallenges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_reading_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting challenges:', error);
    return { data: [], error };
  }
};

export const createChallenge = async (userId, challengeData) => {
  try {
    const { data, error } = await supabase
      .from('bk_reading_challenges')
      .insert([{
        user_id: userId,
        ...challengeData
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { data: null, error };
  }
};

export const updateChallengeProgress = async (challengeId, bookId) => {
  try {
    // Add book to challenge
    const { error: linkError } = await supabase
      .from('bk_challenge_books')
      .insert([{
        challenge_id: challengeId,
        book_id: bookId
      }]);

    if (linkError && linkError.code !== '23505') { // Ignore duplicate key error
      throw linkError;
    }

    // Update challenge progress
    const { data: challenge } = await supabase
      .from('bk_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challenge) {
      const newCount = (challenge.current_count || 0) + 1;
      const isCompleted = newCount >= challenge.target_count;

      const { data, error } = await supabase
        .from('bk_reading_challenges')
        .update({
          current_count: newCount,
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;

      // Award XP if completed
      if (isCompleted && challenge.reward_xp > 0) {
        await addXP(challenge.user_id, challenge.reward_xp, 'Challenge completed');
      }

      return { data, error: null, completed: isCompleted };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { data: null, error };
  }
};

// Quizzes
export const getBookQuizzes = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('bk_quizzes')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting quizzes:', error);
    return { data: [], error };
  }
};

export const submitQuizAnswer = async (userId, quizId, selectedAnswer) => {
  try {
    const { data: quiz } = await supabase
      .from('bk_quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (!quiz) {
      return { data: null, error: { message: 'Quiz not found' } };
    }

    const isCorrect = selectedAnswer === quiz.correct_answer;
    const xpEarned = isCorrect ? quiz.xp_reward : 0;

    const { data, error } = await supabase
      .from('bk_quiz_attempts')
      .insert([{
        user_id: userId,
        quiz_id: quizId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        xp_earned: xpEarned
      }])
      .select()
      .single();

    if (error) throw error;

    // Award XP if correct
    if (isCorrect && xpEarned > 0) {
      await addXP(userId, xpEarned, 'Quiz answered correctly');
    }

    return { data, error: null, isCorrect, xpEarned };
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    return { data: null, error };
  }
};

// Book Facts
export const getBookFacts = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('bk_book_facts')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting book facts:', error);
    return { data: [], error };
  }
};

export const addBookFact = async (bookId, factText) => {
  try {
    const { data, error } = await supabase
      .from('bk_book_facts')
      .insert([{
        book_id: bookId,
        content: factText,  // Primary column name in database
        fact_text: factText  // Also set fact_text if it exists
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error adding book fact:', error);
    return { data: null, error };
  }
};

export const addBookFacts = async (bookId, facts) => {
  try {
    const factsToInsert = facts.map(fact => ({
      book_id: bookId,
      content: fact,  // Primary column name in database
      fact_text: fact  // Also set fact_text if it exists
    }));

    const { data, error } = await supabase
      .from('bk_book_facts')
      .insert(factsToInsert)
      .select();

    return { data, error };
  } catch (error) {
    console.error('Error adding book facts:', error);
    return { data: null, error };
  }
};

// Stories
export const getUserStories = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting stories:', error);
    return { data: [], error };
  }
};

export const createStory = async (userId, storyData) => {
  try {
    const { data, error } = await supabase
      .from('bk_stories')
      .insert([{
        user_id: userId,
        ...storyData
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating story:', error);
    return { data: null, error };
  }
};

// Reading Reports
export const generateReadingReport = async (userId, reportType, periodStart, periodEnd) => {
  try {
    // Calculate stats from books
    // This would need to query books finished in the period
    // For now, return a placeholder structure
    
    const { data, error } = await supabase
      .from('bk_reading_reports')
      .insert([{
        user_id: userId,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        books_read: 0, // Calculate from books
        pages_read: 0,
        hours_read: 0,
        xp_earned: 0,
        achievements_earned: 0
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error generating reading report:', error);
    return { data: null, error };
  }
};

export const getReadingReports = async (userId, reportType = null) => {
  try {
    let query = supabase
      .from('bk_reading_reports')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting reading reports:', error);
    return { data: [], error };
  }
};

