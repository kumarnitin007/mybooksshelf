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
    
    // Handle case where currentXP might be null or undefined
    if (!currentXP) {
      console.warn('No XP data found for user, using defaults');
    }
    const totalXP = currentXP?.total_xp || 0;
    const currentLevel = currentXP?.current_level || 1;
    const newTotalXP = totalXP + xpAmount;
    
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

// Helper function to get the week identifier for a given date
// Returns a string in format "YYYY-WW" representing the week
// Uses ISO week calculation (week starts on Monday)
const getWeekIdentifier = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  
  // Get the date of the Monday of this week
  const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek + 1);
  
  // Calculate week number: days since Jan 1, divided by 7
  const startOfYear = new Date(year, 0, 1);
  const daysSinceStart = Math.floor((monday - startOfYear) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
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
      const lastWeek = getWeekIdentifier(lastDate);
      const readingWeek = getWeekIdentifier(readingDateStr);
      
      if (lastWeek === readingWeek) {
        // Same week, no change to streak (already counted this week)
        return { data: streak, error: null };
      } else {
        // Different weeks - check if consecutive or within grace period
        const lastDateObj = new Date(lastDate + 'T00:00:00');
        const readingDateObj = new Date(readingDateStr + 'T00:00:00');
        const daysDiff = Math.floor((readingDateObj - lastDateObj) / (1000 * 60 * 60 * 24));
        
        // For weekly streaks:
        // - If within 1-13 days and different weeks, it's consecutive (with grace period)
        // - If 14-20 days and freeze available, use freeze
        // - If more than 20 days, streak is broken
        
        if (daysDiff >= 1 && daysDiff <= 13) {
          // Consecutive week (within 1-13 days, different weeks)
          newStreak = (streak.current_streak || 0) + 1;
          usedFreeze = false; // Reset freeze on successful week
        } else if (daysDiff >= 14 && daysDiff <= 20 && !usedFreeze) {
          // One week missed (14-20 days), use freeze
          newStreak = (streak.current_streak || 0) + 1;
          usedFreeze = true;
        } else {
          // Streak broken (more than 20 days gap or freeze already used)
          newStreak = 1;
          usedFreeze = false;
        }
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
    // Get challenges created by user
    const { data: myChallenges, error: myError } = await supabase
      .from('bk_reading_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (myError) throw myError;

    // Get challenges shared with user
    // RLS policies should allow users to see challenges shared with them
    // Fetch all challenges the user can see (RLS will filter) and filter in JavaScript
    const { data: allChallengesData, error: allError } = await supabase
      .from('bk_reading_challenges')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.warn('Error fetching all challenges, using only user-created challenges:', allError);
      return { data: myChallenges || [], error: null };
    }
    
    // Filter challenges where user is in shared_with array (excluding ones already in myChallenges)
    const filteredShared = (allChallengesData || []).filter(c => {
      // Skip challenges already in myChallenges (to avoid duplicates)
      if (myChallenges && myChallenges.some(mc => mc.id === c.id)) {
        return false;
      }
      
      // Check if user is in shared_with array
      if (!c.shared_with) return false;
      
      let sharedArray = c.shared_with;
      if (typeof sharedArray === 'string') {
        try {
          sharedArray = JSON.parse(sharedArray);
        } catch (e) {
          // If parsing fails, try splitting if comma-separated
          if (sharedArray.includes(',')) {
            sharedArray = sharedArray.split(',').map(id => id.trim());
          } else {
            sharedArray = [sharedArray];
          }
        }
      }
      
      if (!Array.isArray(sharedArray)) return false;
      
      // Check if userId is in the shared_with array
      return sharedArray.map(id => String(id)).includes(String(userId));
    });

    // Combine and deduplicate
    const allChallengesCombined = [...(myChallenges || []), ...filteredShared];
    const uniqueChallenges = Array.from(
      new Map(allChallengesCombined.map(c => [c.id, c])).values()
    );


    return { data: uniqueChallenges, error: null };
  } catch (error) {
    console.error('Error getting challenges:', error);
    return { data: [], error };
  }
};

export const createChallenge = async (userId, challengeData) => {
  try {
    // Check if user already has 5 challenges
    const { data: existingChallenges, error: countError } = await supabase
      .from('bk_reading_challenges')
      .select('id')
      .eq('user_id', userId);

    if (countError) throw countError;

    if (existingChallenges && existingChallenges.length >= 5) {
      return { 
        data: null, 
        error: { message: 'You can only create up to 5 challenges. Please delete an existing challenge first.' } 
      };
    }

    // Extract shared_with separately to handle both sharedWith and shared_with
    let sharedWith = challengeData.sharedWith || challengeData.shared_with || [];
    
    // Limit to 5 users max (including creator)
    if (sharedWith.length > 4) {
      return { 
        data: null, 
        error: { message: 'You can only share a challenge with up to 4 other users (5 total including you).' } 
      };
    }
    
    // Automatically add the creator to shared_with if not already included
    if (!sharedWith.includes(userId)) {
      sharedWith = [...sharedWith, userId];
    }
    
    const { data, error } = await supabase
      .from('bk_reading_challenges')
      .insert([{
        user_id: userId,
        shared_with: sharedWith,
        challenge_name: challengeData.challenge_name,
        challenge_type: challengeData.challenge_type || 'reading', // Default to 'reading' if not provided
        target_count: challengeData.target_count,
        current_count: challengeData.current_count || 0,
        start_date: challengeData.start_date,
        end_date: challengeData.end_date,
        reward_xp: challengeData.reward_xp || 0,
        description: challengeData.description || null,
        is_completed: challengeData.is_completed || false
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { data: null, error };
  }
};

export const shareChallenge = async (challengeId, userIds) => {
  try {
    // Get the challenge to check current shared_with
    const { data: challenge, error: fetchError } = await supabase
      .from('bk_reading_challenges')
      .select('user_id, shared_with')
      .eq('id', challengeId)
      .single();

    if (fetchError) throw fetchError;

    // Include creator in the count
    const allUsers = [...(userIds || []), challenge.user_id];
    
    // Limit to 5 users max
    if (allUsers.length > 5) {
      return { 
        data: null, 
        error: { message: 'You can only share a challenge with up to 4 other users (5 total including creator).' } 
      };
    }

    const { data, error } = await supabase
      .from('bk_reading_challenges')
      .update({
        shared_with: userIds || []
      })
      .eq('id', challengeId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error sharing challenge:', error);
    return { data: null, error };
  }
};

export const deleteChallenge = async (challengeId) => {
  try {
    const { error } = await supabase
      .from('bk_reading_challenges')
      .delete()
      .eq('id', challengeId);

    return { error };
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return { error };
  }
};

export const updateChallengeProgress = async (challengeId, bookId, userId) => {
  try {
    
    // Check if book is already linked to this challenge for this user
    // Try with user_id first, fallback to old method if column doesn't exist
    let existingLink = null;
    try {
      const { data, error } = await supabase
        .from('bk_challenge_books')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.message && error.message.includes('user_id')) {
        // If user_id column doesn't exist, check without it (backward compatibility)
        const { data: fallbackData } = await supabase
          .from('bk_challenge_books')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('book_id', bookId)
          .maybeSingle();
        existingLink = fallbackData;
      } else {
        existingLink = data;
      }
    } catch (err) {
      console.error('Error checking existing link:', err);
      // If user_id column doesn't exist, check without it (backward compatibility)
      const { data } = await supabase
        .from('bk_challenge_books')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('book_id', bookId)
        .maybeSingle();
      existingLink = data;
    }

    // If book is already linked for this user, don't update progress (prevent double-counting)
    if (existingLink) {
      return { data: null, error: null, alreadyCounted: true };
    }

        // Add book to challenge with user_id (only if not already linked)
        // Try with user_id first, fallback if column doesn't exist
        let linkError = null;
        try {
          const { error } = await supabase
            .from('bk_challenge_books')
            .insert([{
              challenge_id: challengeId,
              book_id: bookId,
              user_id: userId
            }]);
          linkError = error;
        } catch (err) {
          // If user_id column doesn't exist, insert without it (backward compatibility)
          const { error } = await supabase
            .from('bk_challenge_books')
            .insert([{
              challenge_id: challengeId,
              book_id: bookId
            }]);
          linkError = error;
        }

    if (linkError) {
      // If it's a duplicate key error, book was already added (race condition)
      if (linkError.code === '23505') {
        return { data: null, error: null, alreadyCounted: true };
      }
      // If it's a column not found error, the migration hasn't been run yet
      if (linkError.message && linkError.message.includes('user_id')) {
        console.warn('user_id column not found in bk_challenge_books. Please run the database migration.');
        // Fallback: insert without user_id
        const { error: fallbackError } = await supabase
          .from('bk_challenge_books')
          .insert([{
            challenge_id: challengeId,
            book_id: bookId
          }]);
        if (fallbackError && fallbackError.code !== '23505') {
          throw fallbackError;
        }
      } else {
        throw linkError;
      }
    }

    // Get user's progress for this challenge
    // Try with user_id first, fallback if column doesn't exist
    let userProgress = 0;
    try {
      const { count } = await supabase
        .from('bk_challenge_books')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);
      userProgress = count || 0;
    } catch (err) {
      // If user_id column doesn't exist, count all books for this challenge (backward compatibility)
      const { count } = await supabase
        .from('bk_challenge_books')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId);
      userProgress = count || 0;
    }

    // Get challenge details
    const { data: challenge } = await supabase
      .from('bk_reading_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challenge) {
      const isCompleted = (userProgress || 0) >= challenge.target_count;

      // Update challenge's is_completed flag if this user completed it
      // Note: We only update if the challenge wasn't already marked as completed
      // to avoid overwriting if another user completed it first
      if (isCompleted && !challenge.is_completed) {
        // Update the challenge to mark it as completed
        // This is a per-user completion, but we mark the challenge as completed
        // when any participant completes it (or we could track per-user completion separately)
        await supabase
          .from('bk_reading_challenges')
          .update({ 
            is_completed: true,
            current_count: Math.max(challenge.current_count || 0, userProgress)
          })
          .eq('id', challengeId);
      } else if (isCompleted && challenge.current_count < userProgress) {
        // Update current_count if this user's progress is higher
        await supabase
          .from('bk_reading_challenges')
          .update({ 
            current_count: userProgress
          })
          .eq('id', challengeId);
      }

      // Award XP if this user completed the challenge
      let xpAwarded = null;
      if (isCompleted && challenge.reward_xp > 0) {
        const xpResult = await addXP(userId, challenge.reward_xp, 'Challenge completed');
        if (xpResult.data) {
          xpAwarded = {
            amount: challenge.reward_xp,
            totalXP: xpResult.data.total_xp,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
          };
        }
      }

      return { 
        data: { userProgress: userProgress || 0, isCompleted }, 
        error: null, 
        completed: isCompleted,
        xpAwarded 
      };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return { data: null, error };
  }
};

// Get progress for all users in a challenge
export const getChallengeUserProgress = async (challengeId) => {
  try {
    // Get all books linked to this challenge with user info
    const { data: challengeBooks, error } = await supabase
      .from('bk_challenge_books')
      .select('user_id, book_id')
      .eq('challenge_id', challengeId);

    if (error) throw error;

    // Count books per user
    const userProgress = {};
    (challengeBooks || []).forEach(cb => {
      if (!userProgress[cb.user_id]) {
        userProgress[cb.user_id] = 0;
      }
      userProgress[cb.user_id]++;
    });

    return { data: userProgress, error: null };
  } catch (error) {
    console.error('Error getting challenge user progress:', error);
    return { data: {}, error };
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

