/**
 * Admin Service
 * 
 * Handles admin operations including:
 * - User management
 * - Virtual rewards management
 * - System statistics
 * - AI recommendations access control
 */

import { supabase } from '../config/supabase';

/**
 * Check if a user is an admin
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - True if user is admin
 */
export const isAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_user_profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get all users with their profiles
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAllUsersWithProfiles = async () => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('bk_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Get profiles for all users
    const userIds = users.map(u => u.id);
    const { data: profiles, error: profilesError } = await supabase
      .from('bk_user_profiles')
      .select('*')
      .in('user_id', userIds);

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError);
    }

    // Merge users with their profiles
    // IMPORTANT: Preserve user.id and store profile.id separately to avoid overwriting
    const usersWithProfiles = users.map(user => {
      const profile = profiles?.find(p => p.user_id === user.id) || {};
      return {
        ...user,
        // Spread profile but exclude 'id' to preserve user.id
        ...Object.fromEntries(
          Object.entries(profile).filter(([key]) => key !== 'id')
        ),
        profile_id: profile.id, // Store profile ID separately
        // Ensure user_id is always the user's ID, not profile's user_id
        user_id: user.id
      };
    });

    return { data: usersWithProfiles, error: null };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { data: [], error };
  }
};

/**
 * Get all virtual rewards
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAllRewards = async () => {
  try {
    const { data, error } = await supabase
      .from('bk_user_rewards')
      .select('*')
      .order('unlocked_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error getting all rewards:', error);
    return { data: [], error };
  }
};

/**
 * Update a reward
 * @param {string} rewardId - Reward ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateReward = async (rewardId, updates) => {
  try {
    const { data, error } = await supabase
      .from('bk_user_rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { 
        data: null, 
        error: { message: 'Reward not found. It may have been deleted.' } 
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating reward:', error);
    return { data: null, error };
  }
};

/**
 * Delete a reward
 * @param {string} rewardId - Reward ID
 * @returns {Promise<{error: object|null}>}
 */
export const deleteReward = async (rewardId) => {
  try {
    const { error } = await supabase
      .from('bk_user_rewards')
      .delete()
      .eq('id', rewardId);

    return { error };
  } catch (error) {
    console.error('Error deleting reward:', error);
    return { error };
  }
};

/**
 * Create a new reward
 * @param {string|null} userId - User ID (optional - null for criteria-based rewards)
 * @param {string} rewardType - Type of reward (badge, title, achievement, milestone)
 * @param {string} rewardName - Name of the reward
 * @param {string} rewardValue - Value of the reward
 * @param {string} rewardEmoji - Emoji for the reward (optional)
 * @param {string} rewardDescription - Description of the reward (optional)
 * @param {string} criteriaGenre - Genre criteria for automatic reward (optional)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const createReward = async (userId, rewardType, rewardName, rewardValue, rewardEmoji = null, rewardDescription = null, criteriaGenre = null) => {
  try {
    // For criteria-based rewards (null userId), verify the current user is an admin
    if (!userId) {
      // Get current user from Supabase auth
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        return {
          data: null,
          error: { message: 'You must be logged in to create criteria-based rewards.' }
        };
      }
      
      // Check if current user is admin
      const adminCheck = await isAdmin(currentUser.id);
      if (!adminCheck) {
        return {
          data: null,
          error: { message: 'Only admins can create criteria-based rewards that are automatically assigned.' }
        };
      }
    }
    
    // If userId is provided, verify the user exists
    if (userId) {
      const { data: userExists, error: userCheckError } = await supabase
        .from('bk_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userCheckError || !userExists) {
        return { 
          data: null, 
          error: { 
            message: 'User does not exist. Cannot create reward for non-existent user.' 
          } 
        };
      }

      // Check if reward already exists for this user (to prevent duplicates)
      const { data: existingReward } = await supabase
        .from('bk_user_rewards')
        .select('id')
        .eq('user_id', userId)
        .eq('reward_type', rewardType)
        .eq('reward_name', rewardName)
        .maybeSingle();

      if (existingReward) {
        return { 
          data: null, 
          error: { 
            message: 'This reward already exists for this user.' 
          } 
        };
      }
    }

    // Create the reward (user_id can be null for criteria-based rewards)
    const rewardData = {
      reward_type: rewardType,
      reward_name: rewardName,
      reward_value: rewardValue,
      unlocked_at: new Date().toISOString()
    };

    // Only include user_id if provided (for user-specific rewards)
    if (userId) {
      rewardData.user_id = userId;
    }

    // Store criteria in description
    let finalDescription = rewardDescription || '';
    if (criteriaGenre) {
      finalDescription = finalDescription + (finalDescription ? ' | ' : '') + `[Criteria: Genre = ${criteriaGenre}]`;
    }
    if (finalDescription) {
      rewardData.reward_description = finalDescription;
    }

    // Only include emoji if provided
    if (rewardEmoji) {
      rewardData.reward_emoji = rewardEmoji;
    }

    // For criteria-based rewards (no userId), don't set unlocked_at yet
    // It will be set when the reward is automatically awarded to a user
    if (!userId) {
      rewardData.unlocked_at = null;
    }

    const { data, error } = await supabase
      .from('bk_user_rewards')
      .insert([rewardData])
      .select()
      .maybeSingle();

    return { data, error };
  } catch (error) {
    console.error('Error creating reward:', error);
    return { data: null, error };
  }
};

/**
 * Update user settings
 * @param {string} userId - User ID
 * @param {object} settings - Settings to update (hide_from_comparison, ai_recommendations_enabled, is_admin)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateUserSettings = async (userId, settings) => {
  try {
    // First verify the user exists in bk_users
    const { data: userExists, error: userCheckError } = await supabase
      .from('bk_users')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking user existence:', userCheckError);
      return { 
        data: null, 
        error: { 
          message: `Error checking user: ${userCheckError.message}` 
        } 
      };
    }

    if (!userExists) {
      console.error('User not found:', userId);
      return { 
        data: null, 
        error: { 
          message: `User with ID ${userId} does not exist. Cannot update settings for non-existent user.` 
        } 
      };
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('bk_user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let result;
    if (existingProfile) {
      // Profile exists, update it
      result = await supabase
        .from('bk_user_profiles')
        .update(settings)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    } else {
      // Profile doesn't exist, create it with default values
      result = await supabase
        .from('bk_user_profiles')
        .insert([{
          user_id: userId,
          name: '',
          monthly_target: 0,
          avatar: '📚',
          bio: '',
          feedback: '',
          hide_from_comparison: settings.hide_from_comparison || false,
          ai_recommendations_enabled: settings.ai_recommendations_enabled !== false,
          is_admin: settings.is_admin || false
        }])
        .select()
        .maybeSingle();
    }

    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { data: null, error };
  }
};

/**
 * Get system statistics
 * @returns {Promise<{data: object, error: object|null}>}
 */
export const getSystemStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('bk_users')
      .select('*', { count: 'exact', head: true });

    // Get total books count
    const { count: totalBooks, error: booksError } = await supabase
      .from('bk_books')
      .select('*', { count: 'exact', head: true });

    // Get total bookshelves count
    const { count: totalBookshelves, error: bookshelvesError } = await supabase
      .from('bk_bookshelves')
      .select('*', { count: 'exact', head: true });

    // Get most active user (by book count) - exclude "Default User"
    // More efficient approach: Use a join query to count books per user
    let mostActiveUser = null;
    
    try {
      // Get all bookshelves with their user_id and count books per bookshelf
      const { data: allBookshelves } = await supabase
        .from('bk_bookshelves')
        .select('id, user_id');

      if (allBookshelves && allBookshelves.length > 0) {
        // Get all books with their bookshelf_id
        const { data: allBooks } = await supabase
          .from('bk_books')
          .select('bookshelf_id');

        // Get Default User ID to exclude
        const { data: defaultUser } = await supabase
          .from('bk_users')
          .select('id')
          .eq('username', 'Default User')
          .maybeSingle();

        const defaultUserId = defaultUser?.id;

        // Count books per user
        const userCounts = {};
        
        if (allBooks && allBooks.length > 0) {
          allBooks.forEach(book => {
            if (!book.bookshelf_id) return; // Skip books without bookshelf
            
            const bookshelf = allBookshelves.find(bs => bs.id === book.bookshelf_id);
            if (bookshelf && bookshelf.user_id && bookshelf.user_id !== defaultUserId) {
              userCounts[bookshelf.user_id] = (userCounts[bookshelf.user_id] || 0) + 1;
            }
          });
        }

        // Find the user with the most books
        const sortedUsers = Object.entries(userCounts)
          .sort((a, b) => b[1] - a[1]);

        if (sortedUsers.length > 0 && sortedUsers[0][1] > 0) {
          const mostActiveUserId = sortedUsers[0][0];
          const bookCount = sortedUsers[0][1];

          const { data: user } = await supabase
            .from('bk_users')
            .select('username')
            .eq('id', mostActiveUserId)
            .single();
          
          const { data: profile } = await supabase
            .from('bk_user_profiles')
            .select('name')
            .eq('user_id', mostActiveUserId)
            .maybeSingle();

          mostActiveUser = {
            id: mostActiveUserId,
            username: user?.username || 'Unknown',
            name: profile?.name || user?.username || 'Unknown',
            bookCount: bookCount
          };
        }
      }
    } catch (error) {
      console.warn('Error calculating most active user:', error);
    }

    // Get total challenges
    const { count: totalChallenges, error: challengesError } = await supabase
      .from('bk_reading_challenges')
      .select('*', { count: 'exact', head: true });

    // Get total rewards
    const { count: totalRewards, error: rewardsError } = await supabase
      .from('bk_user_rewards')
      .select('*', { count: 'exact', head: true });

    return {
      data: {
        totalUsers: totalUsers || 0,
        totalBooks: totalBooks || 0,
        totalBookshelves: totalBookshelves || 0,
        totalChallenges: totalChallenges || 0,
        totalRewards: totalRewards || 0,
        mostActiveUser: mostActiveUser
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return { data: null, error };
  }
};

