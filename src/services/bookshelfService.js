/**
 * Bookshelf Service
 * 
 * Handles all bookshelf-related database operations including:
 * - Creating and managing bookshelves
 * - Updating bookshelf settings
 * - Managing shared bookshelf permissions
 */

import { supabase } from '../config/supabase';

/**
 * Get all bookshelves for a user
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getUserBookshelves = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_bookshelves')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching bookshelves:', error);
    return { data: [], error };
  }
};

/**
 * Get bookshelves accessible to a user (own + shared)
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAccessibleBookshelves = async (userId) => {
  try {
    // Get own bookshelves
    const { data: ownBookshelves, error: ownError } = await supabase
      .from('bk_bookshelves')
      .select('*')
      .eq('user_id', userId);

    if (ownError) throw ownError;

    // Get shared bookshelves (where user is in shared_with array)
    const { data: sharedBookshelves, error: sharedError } = await supabase
      .from('bk_bookshelves')
      .select('*')
      .contains('shared_with', [userId])
      .neq('user_id', userId); // Exclude own bookshelves

    if (sharedError) throw sharedError;

    // Combine and sort
    const allBookshelves = [...(ownBookshelves || []), ...(sharedBookshelves || [])];
    allBookshelves.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return { data: allBookshelves, error: null };
  } catch (error) {
    console.error('Error fetching accessible bookshelves:', error);
    return { data: [], error };
  }
};

/**
 * Create a new bookshelf
 * @param {string} userId - The user ID
 * @param {object} bookshelfData - The bookshelf data
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const createBookshelf = async (userId, bookshelfData) => {
  try {
    const bookshelfInsert = {
      user_id: userId,
      name: bookshelfData.name || 'New Bookshelf',
      animal: bookshelfData.animal || 'cat',
      display_mode: bookshelfData.displayMode || 'covers',
      type: bookshelfData.type || 'regular',
      shared_with: bookshelfData.sharedWith || []
    };

    const { data, error } = await supabase
      .from('bk_bookshelves')
      .insert([bookshelfInsert])
      .select()
      .single();

    if (error) {
      // Provide more helpful error messages
      if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.error('Table bk_bookshelves does not exist. Please run the schema.sql script in your Supabase SQL Editor.');
        return { 
          data: null, 
          error: { 
            ...error, 
            message: 'Database table not found. Please run the schema.sql script in Supabase SQL Editor to create all tables.' 
          } 
        };
      }
    }

    return { data, error };
  } catch (error) {
    console.error('Error creating bookshelf:', error);
    return { data: null, error };
  }
};

/**
 * Update a bookshelf
 * @param {string} bookshelfId - The bookshelf ID
 * @param {object} updates - The fields to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateBookshelf = async (bookshelfId, updates) => {
  try {
    const { data, error } = await supabase
      .from('bk_bookshelves')
      .update(updates)
      .eq('id', bookshelfId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bookshelf:', error);
    }

    return { data, error };
  } catch (error) {
    console.error('Error updating bookshelf:', error);
    return { data: null, error };
  }
};

/**
 * Delete a bookshelf
 * @param {string} bookshelfId - The bookshelf ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const deleteBookshelf = async (bookshelfId) => {
  try {
    const { error } = await supabase
      .from('bk_bookshelves')
      .delete()
      .eq('id', bookshelfId);

    return { data: { success: true }, error };
  } catch (error) {
    console.error('Error deleting bookshelf:', error);
    return { data: null, error };
  }
};

/**
 * Update shared bookshelf permissions
 * @param {string} bookshelfId - The bookshelf ID
 * @param {array} userIds - Array of user IDs who can view the bookshelf
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateSharedBookshelfPermissions = async (bookshelfId, userIds) => {
  try {
    const { data, error } = await supabase
      .from('bk_bookshelves')
      .update({ shared_with: userIds })
      .eq('id', bookshelfId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating shared bookshelf permissions:', error);
    return { data: null, error };
  }
};

/**
 * Ensure "Shared with Me" bookshelf exists for a user
 * @param {string} userId - The user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const ensureSharedWithMeBookshelf = async (userId) => {
  try {
    // Check if "Shared with Me" bookshelf already exists
    const { data: existing } = await supabase
      .from('bk_bookshelves')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'shared_with_me')
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Create "Shared with Me" bookshelf
    const { data, error } = await createBookshelf(userId, {
      name: 'Shared with Me',
      animal: 'heart',
      displayMode: 'covers',
      type: 'shared_with_me'
    });

    return { data, error };
  } catch (error) {
    console.error('Error ensuring Shared with Me bookshelf:', error);
    return { data: null, error };
  }
};

/**
 * Ensure default bookshelves exist for a user
 * This is a fallback function - default bookshelves should be created by:
 * 1. Running the prepopulate_default_bookshelves.sql script for existing users
 * 2. Database trigger automatically creates them for new users
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const ensureDefaultBookshelves = async (userId) => {
  try {
    // Get existing bookshelves
    const { data: existing } = await getUserBookshelves(userId);

    // Check if default bookshelves exist
    const hasWishlist = existing.some(bs => bs.type === 'wishlist');
    const hasFavorites = existing.some(bs => bs.type === 'favorites');
    const hasRegular = existing.some(bs => bs.type === 'regular');

    // Only create missing ones as a fallback (shouldn't be needed if script/trigger is set up)
    const createdShelves = [];

    if (!hasWishlist) {
      const { data, error } = await createBookshelf(userId, {
        name: 'Wishlist',
        animal: 'heart',
        displayMode: 'covers',
        type: 'wishlist'
      });
      if (!error && data) createdShelves.push(data);
    }

    if (!hasFavorites) {
      const { data, error } = await createBookshelf(userId, {
        name: 'Favorites',
        animal: 'sparkles',
        displayMode: 'covers',
        type: 'favorites'
      });
      if (!error && data) createdShelves.push(data);
    }

    if (!hasRegular) {
      const { data, error } = await createBookshelf(userId, {
        name: 'My Bookshelf',
        animal: 'cat',
        displayMode: 'covers',
        type: 'regular'
      });
      if (!error && data) createdShelves.push(data);
    }

    return { data: createdShelves, error: null };
  } catch (error) {
    console.error('Error ensuring default bookshelves:', error);
    return { data: [], error };
  }
};
