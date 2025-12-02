import { useState } from 'react';
import { getUserProfile } from '../services/userService';
import { getIgnoredSuggestions } from '../services/suggestionService';

/**
 * Custom hook for user data management
 * Handles user profile and preferences
 * 
 * @param {object} currentUser - Current user object
 * @returns {object} User data state and functions
 */
export function useUserData(currentUser) {
  const [userProfile, setUserProfile] = useState({
    name: '',
    monthlyTarget: 0,
    avatar: '📚',
    bio: '',
    feedback: '',
    hideFromComparison: false
  });
  const [ignoredSuggestions, setIgnoredSuggestions] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [userStats, setUserStats] = useState({});
  const [loadingUserStats, setLoadingUserStats] = useState(false);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      const { data: profileData, error: profileError } = await getUserProfile(currentUser.id);
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setUserProfile({
          name: profileData.name || '',
          monthlyTarget: profileData.monthly_target || 0,
          avatar: profileData.avatar || '📚',
          bio: profileData.bio || '',
          feedback: profileData.feedback || '',
          hideFromComparison: profileData.hide_from_comparison || false
        });
      }

      // Load ignored suggestions from database
      const { data: ignoredData, error: ignoredError } = await getIgnoredSuggestions(currentUser.id);
      
      if (ignoredError) {
        console.error('Error loading ignored suggestions:', ignoredError);
        setIgnoredSuggestions([]);
      } else {
        setIgnoredSuggestions(ignoredData || []);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  return {
    userProfile,
    setUserProfile,
    ignoredSuggestions,
    setIgnoredSuggestions,
    userProfiles,
    setUserProfiles,
    userStats,
    setUserStats,
    loadingUserStats,
    setLoadingUserStats,
    loadUserProfile
  };
}

