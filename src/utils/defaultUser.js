/**
 * Default User Utility
 * 
 * Handles loading and creating the default user for unverified access
 */

import { getUserByUsername, getAllUsers, createUser } from '../services/userService';

/**
 * Loads the default user for unverified access
 * Tries to find "Default User", then any existing user, or creates one if none exist
 * 
 * @returns {Promise<object|null>} Default user object or null
 */
export const loadDefaultUser = async () => {
  try {
    console.log('Loading default user...');
    const defaultUsername = 'Default User';
    const { data: fetchedUser, error: fetchError } = await getUserByUsername(defaultUsername);
    
    if (fetchError) {
      console.warn('Error fetching default user:', fetchError);
    }
    
    if (fetchedUser) {
      console.log('Default user found:', fetchedUser.username);
      return fetchedUser;
    }

    // Try to get any existing user as fallback
    console.log('Default user not found, checking for any existing users...');
    const { data: allUsers, error: allUsersError } = await getAllUsers();
    
    if (allUsersError) {
      console.warn('Error fetching all users:', allUsersError);
    }
    
    if (allUsers && allUsers.length > 0) {
      console.log('Found existing user:', allUsers[0].username);
      return allUsers[0];
    }

    // If no users exist, create a default user
    console.log('No users found, creating default user...');
    const { data: newUser, error: createError } = await createUser(defaultUsername);
    if (newUser && !createError) {
      console.log('Default user created successfully:', newUser.username);
      return newUser;
    } else {
      console.error('Error creating default user:', createError);
    }

    console.warn('Could not load or create default user');
    return null;
  } catch (error) {
    console.error('Error loading default user:', error);
    return null;
  }
};

