/**
 * User Service
 * 
 * Handles all user-related database operations including:
 * - User creation and authentication
 * - User profile management
 * - User statistics retrieval
 */

import { supabase } from '../config/supabase';

/**
 * Create a new user
 * @param {string} username - The username for the new user
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const createUser = async (username) => {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('bk_users')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existingUser) {
      return { data: null, error: { message: 'Username already exists' } };
    }

    // Create new user
    const { data, error } = await supabase
      .from('bk_users')
      .insert([{ username: username.trim() }])
      .select()
      .single();

    if (error) throw error;

    // Create default user profile
    if (data) {
      try {
        await supabase
          .from('bk_user_profiles')
          .insert([{
            user_id: data.id,
            name: '',
            monthly_target: 0,
            avatar: '📚',
            bio: '',
            feedback: ''
          }]);
      } catch (e) {
        console.error('Error creating user profile:', e);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

/**
 * Get user by username
 * @param {string} username - The username to search for
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getUserByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('bk_users')
      .select('*')
      .eq('username', username.trim())
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
};

/**
 * Get user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return { data: null, error };
  }
};

/**
 * Get all users (for comparison screen)
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('bk_users')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { data: [], error };
  }
};

/**
 * Get user profile
 * @param {string} userId - The user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile
 * @param {string} userId - The user ID
 * @param {object} profileData - The profile data to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('bk_user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

/**
 * Get total books read by a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Total number of books
 */
export const getTotalBooksRead = async (userId) => {
  try {
    // Get all bookshelves for the user
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bk_bookshelves')
      .select('id')
      .eq('user_id', userId);

    if (bookshelfError) throw bookshelfError;
    if (!bookshelves || bookshelves.length === 0) return 0;

    // Get count of books in all user's bookshelves
    const bookshelfIds = bookshelves.map(bs => bs.id);
    const { count, error: countError } = await supabase
      .from('bk_books')
      .select('*', { count: 'exact', head: true })
      .in('bookshelf_id', bookshelfIds);

    if (countError) throw countError;

    return count || 0;
  } catch (error) {
    console.error('Error getting total books read:', error);
    return 0;
  }
};

/**
 * Get books read this month by a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Number of books read this month
 */
export const getBooksReadThisMonth = async (userId) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get user's bookshelves
    const { data: bookshelves } = await supabase
      .from('bk_bookshelves')
      .select('id')
      .eq('user_id', userId);

    if (!bookshelves || bookshelves.length === 0) return 0;

    const bookshelfIds = bookshelves.map(bs => bs.id);

    // Count books finished this month
    const { count } = await supabase
      .from('bk_books')
      .select('*', { count: 'exact', head: true })
      .in('bookshelf_id', bookshelfIds)
      .gte('finish_date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('finish_date', lastDayOfMonth.toISOString().split('T')[0])
      .not('finish_date', 'is', null);

    return count || 0;
  } catch (error) {
    console.error('Error getting books read this month:', error);
    return 0;
  }
};
