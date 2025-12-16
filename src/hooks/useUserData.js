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
    hideFromComparison: false,
    custom_library_buttons: [],
    age_group: ''
  });
  const [ignoredSuggestions, setIgnoredSuggestions] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [userStats, setUserStats] = useState({});
  const [loadingUserStats, setLoadingUserStats] = useState(false);

  const loadUserProfile = async () => {
    if (!currentUser || !currentUser.id) return;

    try {
      const { data: profileData, error: profileError } = await getUserProfile(currentUser.id);
      
      // Only log errors that are actual problems (not missing profiles)
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        // Parse custom_library_buttons if it's a string
        let customLibraryButtons = [];
        try {
          if (profileData.custom_library_buttons) {
            if (typeof profileData.custom_library_buttons === 'string') {
              customLibraryButtons = JSON.parse(profileData.custom_library_buttons);
            } else if (Array.isArray(profileData.custom_library_buttons)) {
              customLibraryButtons = profileData.custom_library_buttons;
            }
          }
        } catch (e) {
          console.error('Error parsing custom_library_buttons:', e);
        }

        setUserProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          name: profileData.name || '',
          monthlyTarget: profileData.monthly_target || 0,
          avatar: profileData.avatar || '📚',
          bio: profileData.bio || '',
          feedback: profileData.feedback || '',
          hideFromComparison: profileData.hide_from_comparison || false,
          is_admin: profileData.is_admin || false,
          ai_recommendations_enabled: profileData.ai_recommendations_enabled !== false, // Default to true
          custom_library_buttons: customLibraryButtons,
          age_group: profileData.age_group || ''
        });
      }
      // If no profile exists, that's fine - user will create one later

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

