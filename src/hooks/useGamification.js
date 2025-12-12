import { useState, useEffect } from 'react';
import {
  getUserXP,
  addXP,
  getUserStreak,
  updateReadingStreak,
  getAchievements,
  awardAchievement,
  getUserRewards,
  getChallenges,
  updateChallengeProgress
} from '../services/gamificationService';

/**
 * Custom hook for gamification features
 * Handles XP, levels, streaks, achievements, and challenges
 * 
 * @param {object} currentUser - Current user object
 * @param {array} bookshelves - Array of bookshelves
 * @returns {object} Gamification state and functions
 */
export function useGamification(currentUser, bookshelves) {
  const [userXP, setUserXP] = useState(null);
  const [userStreak, setUserStreak] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);

  const loadGamificationData = async () => {
    if (!currentUser) return;

    try {
      // Load XP
      const { data: xpData } = await getUserXP(currentUser.id);
      if (xpData) setUserXP(xpData);

      // Load streak
      const { data: streakData } = await getUserStreak(currentUser.id);
      if (streakData) setUserStreak(streakData);

      // Load achievements
      const { data: achievements } = await getAchievements(currentUser.id, 5);
      if (achievements) setRecentAchievements(achievements);

      // Load rewards
      const { data: rewards } = await getUserRewards(currentUser.id);
      if (rewards) setUserRewards(rewards);

      // Load challenges
      const { data: challengesData } = await getChallenges(currentUser.id);
      if (challengesData) setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const checkAchievements = async (userId, bookshelves) => {
    try {
      const allBooks = bookshelves.flatMap(shelf => shelf.books || []);
      const totalBooks = allBooks.length;
      const finishedBooks = allBooks.filter(b => b.finishDate);
      const booksThisMonth = finishedBooks.filter(b => {
        const finishDate = new Date(b.finishDate);
        const now = new Date();
        return finishDate.getMonth() === now.getMonth() && finishDate.getFullYear() === now.getFullYear();
      }).length;

      // First book achievement
      if (totalBooks === 1) {
        const result = await awardAchievement(userId, 'first_book', 'First Book', '🎉', 'Read your first book!');
        if (result.data && !result.alreadyEarned) {
          setNewAchievement(result.data);
          setShowAchievementModal(true);
          await addXP(userId, 50, 'First book achievement');
        }
      }

      // 10 books achievement
      if (totalBooks === 10) {
        const result = await awardAchievement(userId, 'ten_books', 'Bookworm', '📚', 'Read 10 books!');
        if (result.data && !result.alreadyEarned) {
          setNewAchievement(result.data);
          setShowAchievementModal(true);
          await addXP(userId, 100, '10 books achievement');
        }
      }

      // Speed reader (5 books in a month)
      if (booksThisMonth >= 5) {
        const result = await awardAchievement(userId, 'speed_reader', 'Speed Reader', '⚡', 'Read 5 books in a month!');
        if (result.data && !result.alreadyEarned) {
          setNewAchievement(result.data);
          setShowAchievementModal(true);
          await addXP(userId, 150, 'Speed reader achievement');
        }
      }

      // Streak achievements (now based on weeks)
      if (userStreak) {
        if (userStreak.current_streak === 1) {
          const result = await awardAchievement(userId, 'streak_1', 'Week Warrior', '🔥', '1 week reading streak!');
          if (result.data && !result.alreadyEarned) {
            setNewAchievement(result.data);
            setShowAchievementModal(true);
            await addXP(userId, 75, '1 week streak achievement');
          }
        }
        if (userStreak.current_streak === 4) {
          const result = await awardAchievement(userId, 'streak_4', 'Monthly Master', '🌟', '4 week reading streak!');
          if (result.data && !result.alreadyEarned) {
            setNewAchievement(result.data);
            setShowAchievementModal(true);
            await addXP(userId, 200, '4 week streak achievement');
          }
        }
      }

      // Reload achievements after awarding
      const { data: achievements } = await getAchievements(userId, 5);
      if (achievements) setRecentAchievements(achievements);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const handleBookFinished = async (bookId, finishDate) => {
    if (!currentUser) return;

    try {
      // Award XP for finishing a book
      const xpAmount = 50;
      const { data: xpResult, leveledUp, newLevel } = await addXP(currentUser.id, xpAmount, 'Finished a book');
      if (xpResult) {
        setUserXP(xpResult);
        if (leveledUp) {
          setLevelUpData({ level: newLevel, xp: xpResult.total_xp });
          setShowLevelUpModal(true);
        }
      }

      // Update reading streak
      const { data: streakResult } = await updateReadingStreak(currentUser.id, finishDate);
      if (streakResult) {
        setUserStreak(streakResult);
      }

      // Check achievements
      await checkAchievements(currentUser.id, bookshelves);

      // Update challenge progress
      if (challenges.length > 0) {
        const activeChallenges = challenges.filter(c => !c.is_completed && 
          new Date(c.end_date) >= new Date() && 
          new Date(c.start_date) <= new Date()
        );
        for (const challenge of activeChallenges) {
          await updateChallengeProgress(challenge.id, bookId);
        }
        // Reload challenges
        const { data: updatedChallenges } = await getChallenges(currentUser.id);
        if (updatedChallenges) setChallenges(updatedChallenges);
      }
    } catch (error) {
      console.error('Error handling book finished:', error);
    }
  };

  // Load gamification data when user changes
  useEffect(() => {
    if (currentUser) {
      loadGamificationData();
    }
  }, [currentUser]);

  return {
    userXP,
    setUserXP,
    userStreak,
    setUserStreak,
    recentAchievements,
    setRecentAchievements,
    userRewards,
    challenges,
    setChallenges,
    showLevelUpModal,
    setShowLevelUpModal,
    levelUpData,
    setLevelUpData,
    showAchievementModal,
    setShowAchievementModal,
    newAchievement,
    setNewAchievement,
    loadGamificationData,
    checkAchievements,
    handleBookFinished
  };
}

