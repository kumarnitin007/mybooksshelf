import { useState, useEffect, useCallback } from 'react';
import {
  getUserXP,
  addXP,
  getUserStreak,
  updateReadingStreak,
  getAchievements,
  awardAchievement,
  getUserRewards,
  getChallenges,
  updateChallengeProgress,
  checkAndAwardVirtualRewards,
  unlockReward
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
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newRewards, setNewRewards] = useState([]);

  const loadGamificationData = useCallback(async () => {
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

      // Check and award virtual rewards based on current stats
      await checkVirtualRewards(currentUser.id, bookshelves);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  }, [currentUser, bookshelves]);

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
          // Also unlock virtual reward
          await unlockReward(userId, 'badge', 'First Steps', '1', '🌱', 'Read your first book!');
        }
      }

      // 10 books achievement
      if (totalBooks === 10) {
        const result = await awardAchievement(userId, 'ten_books', 'Bookworm', '📚', 'Read 10 books!');
        if (result.data && !result.alreadyEarned) {
          setNewAchievement(result.data);
          setShowAchievementModal(true);
          await addXP(userId, 100, '10 books achievement');
          // Also unlock virtual reward
          await unlockReward(userId, 'badge', 'Bookworm', '10', '📚', 'Read 10 books!');
        }
      }

      // Speed reader (5 books in a month)
      if (booksThisMonth >= 5) {
        const result = await awardAchievement(userId, 'speed_reader', 'Speed Reader', '⚡', 'Read 5 books in a month!');
        if (result.data && !result.alreadyEarned) {
          setNewAchievement(result.data);
          setShowAchievementModal(true);
          await addXP(userId, 150, 'Speed reader achievement');
          // Also unlock virtual reward
          await unlockReward(userId, 'milestone', 'Speed Reader', '5', '⚡', 'Read 5 books in a month!');
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
            // Also unlock virtual reward
            await unlockReward(userId, 'achievement', 'Week Warrior', '1', '🔥', '1 week reading streak!');
          }
        }
        if (userStreak.current_streak === 4) {
          const result = await awardAchievement(userId, 'streak_4', 'Monthly Master', '🌟', '4 week reading streak!');
          if (result.data && !result.alreadyEarned) {
            setNewAchievement(result.data);
            setShowAchievementModal(true);
            await addXP(userId, 200, '4 week streak achievement');
            // Also unlock virtual reward
            await unlockReward(userId, 'achievement', 'Monthly Master', '4', '🌟', '4 week reading streak!');
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
          // Check rewards when leveling up
          await checkVirtualRewards(currentUser.id, bookshelves);
        }
      }

      // Update reading streak
      const { data: streakResult } = await updateReadingStreak(currentUser.id, finishDate);
      if (streakResult) {
        setUserStreak(streakResult);
      }

      // Check achievements
      await checkAchievements(currentUser.id, bookshelves);

      // Check and award virtual rewards
      await checkVirtualRewards(currentUser.id, bookshelves);

      // Update challenge progress
      if (challenges.length > 0) {
        const activeChallenges = challenges.filter(c => !c.is_completed && 
          new Date(c.end_date) >= new Date() && 
          new Date(c.start_date) <= new Date()
        );
        for (const challenge of activeChallenges) {
          await updateChallengeProgress(challenge.id, bookId, currentUser.id);
        }
        // Reload challenges
        const { data: updatedChallenges } = await getChallenges(currentUser.id);
        if (updatedChallenges) setChallenges(updatedChallenges);
      }
    } catch (error) {
      console.error('Error handling book finished:', error);
    }
  };

  const updateChallengesForBook = async (bookId, bookData = null) => {
    if (!currentUser || !challenges.length) {
      console.log('Skipping challenge update: no currentUser or no challenges');
      return;
    }
    
    try {
      // If bookData is provided, check if it has a finishDate
      // Only count books with finishDate toward challenges
      if (bookData !== null) {
        // If bookData is an object, check finishDate property
        const hasFinishDate = bookData && (
          (typeof bookData === 'object' && bookData.finishDate && bookData.finishDate.trim() !== '') ||
          (typeof bookData === 'string' && bookData.trim() !== '') // If it's just the finishDate string
        );
        
        if (!hasFinishDate) {
          // Book doesn't have finishDate, don't count it toward challenges
          console.log('Book does not have finishDate, skipping challenge update');
          return;
        }
      }
      
      // Get all active challenges where user is either creator or in shared_with
      const activeChallenges = challenges.filter(c => {
        if (c.is_completed) return false;
        
        const now = new Date();
        const endDate = new Date(c.end_date);
        const startDate = new Date(c.start_date);
        
        if (endDate < now) return false;
        if (startDate > now) return false;
        
        // Check if user is creator
        if (String(c.user_id) === String(currentUser.id)) {
          return true;
        }
        
        // Check if user is in shared_with array
        if (c.shared_with) {
          let sharedArray = c.shared_with;
          if (typeof sharedArray === 'string') {
            try {
              sharedArray = JSON.parse(sharedArray);
            } catch (e) {
              if (sharedArray.includes(',')) {
                sharedArray = sharedArray.split(',').map(id => id.trim());
              } else {
                sharedArray = [sharedArray];
              }
            }
          }
          
          if (Array.isArray(sharedArray)) {
            return sharedArray.map(id => String(id)).includes(String(currentUser.id));
          }
        }
        
        return false;
      });
      
      
      let xpAwarded = null;
      for (const challenge of activeChallenges) {
        // Get book data to pass for condition checking
        const allBooks = bookshelves.flatMap(shelf => shelf.books || []);
        const book = allBooks.find(b => b.id === bookId);
        
        const result = await updateChallengeProgress(challenge.id, bookId, currentUser.id);
        if (result.error) {
          console.error('Error updating challenge progress:', result.error);
        } else if (result.conditionNotMet) {
          // Book doesn't meet challenge conditions, silently skip
          console.log(`Book ${bookId} doesn't meet conditions for challenge ${challenge.id}`);
        } else {
          // If XP was awarded, capture it
          if (result.xpAwarded) {
            xpAwarded = result.xpAwarded;
          }
        }
      }
      
      // Reload XP if it was awarded
      if (xpAwarded) {
        const { data: updatedXP, error: xpError } = await getUserXP(currentUser.id);
        if (xpError) {
          console.error('Error fetching updated XP:', xpError);
        } else if (updatedXP) {
          setUserXP(updatedXP);
          // Show level up modal if user leveled up
          if (xpAwarded.leveledUp) {
            setLevelUpData({ level: xpAwarded.newLevel, xp: xpAwarded.totalXP });
            setShowLevelUpModal(true);
          }
          // Trigger XP update event so ProfileModal and other components can refresh
          window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { xp: updatedXP } }));
        }
      }
      
      // Reload challenges to get updated progress (this ensures shared challenges are included)
      const { data: updatedChallenges } = await getChallenges(currentUser.id);
      if (updatedChallenges) {
        setChallenges(updatedChallenges);
        // Trigger a reload in ChallengeModal by dispatching a custom event
        window.dispatchEvent(new CustomEvent('challengesUpdated'));
      }

      // Check and award virtual rewards after challenge completion
      await checkVirtualRewards(currentUser.id, bookshelves);
    } catch (error) {
      console.error('Error updating challenges for book:', error);
    }
  };

  // Check and award virtual rewards based on current stats
  const checkVirtualRewards = async (userId, bookshelves) => {
    try {
      const allBooks = bookshelves.flatMap(shelf => shelf.books || []);
      const finishedBooks = allBooks.filter(b => b.finishDate);
      const booksThisMonth = finishedBooks.filter(b => {
        const finishDate = new Date(b.finishDate);
        const now = new Date();
        return finishDate.getMonth() === now.getMonth() && finishDate.getFullYear() === now.getFullYear();
      }).length;

      // Count completed challenges (where user is creator or participant)
      const completedChallenges = challenges.filter(c => {
        const isCompleted = c.is_completed || (c.current_count >= c.target_count);
        // Check if user is creator or in shared_with
        const isCreator = String(c.user_id) === String(userId);
        let isParticipant = false;
        if (c.shared_with) {
          let sharedArray = c.shared_with;
          if (typeof sharedArray === 'string') {
            try {
              sharedArray = JSON.parse(sharedArray);
            } catch (e) {
              if (sharedArray.includes(',')) {
                sharedArray = sharedArray.split(',').map(id => id.trim());
              } else {
                sharedArray = [sharedArray];
              }
            }
          }
          if (Array.isArray(sharedArray)) {
            isParticipant = sharedArray.map(id => String(id)).includes(String(userId));
          }
        }
        return isCompleted && (isCreator || isParticipant);
      }).length;

      const stats = {
        totalBooks: allBooks.length,
        finishedBooks: finishedBooks.length,
        currentLevel: userXP?.current_level || 1,
        currentStreak: userStreak?.current_streak || 0,
        booksThisMonth: booksThisMonth,
        completedChallenges: completedChallenges
      };

      const { data: newlyUnlocked, error } = await checkAndAwardVirtualRewards(userId, stats);
      
      if (newlyUnlocked && newlyUnlocked.length > 0) {
        // Reload rewards to show newly unlocked ones
        const { data: updatedRewards } = await getUserRewards(userId);
        if (updatedRewards) {
          setUserRewards(updatedRewards);
        }
        // Show notification for newly unlocked rewards
        setNewRewards(newlyUnlocked);
        setShowRewardModal(true);
      }

      return { data: newlyUnlocked, error };
    } catch (error) {
      console.error('Error checking virtual rewards:', error);
      return { data: [], error };
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
    showRewardModal,
    setShowRewardModal,
    newRewards,
    setNewRewards,
    loadGamificationData,
    checkAchievements,
    handleBookFinished,
    updateChallengesForBook
  };
}

