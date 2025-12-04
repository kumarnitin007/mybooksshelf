/**
 * Book Service
 * 
 * Handles all book-related database operations including:
 * - Creating, updating, and deleting books
 * - Fetching books from bookshelves
 * - Book search and filtering
 */

import { supabase } from '../config/supabase';

/**
 * Get all books in a bookshelf
 * @param {string} bookshelfId - The bookshelf ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getBooksInBookshelf = async (bookshelfId) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .select('*')
      .eq('bookshelf_id', bookshelfId)
      .order('added_date', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching books:', error);
    return { data: [], error };
  }
};

/**
 * Get all books for a user (across all bookshelves)
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAllUserBooks = async (userId) => {
  try {
    // First get all user's bookshelves
    const { data: bookshelves } = await supabase
      .from('bk_bookshelves')
      .select('id')
      .eq('user_id', userId);

    if (!bookshelves || bookshelves.length === 0) {
      return { data: [], error: null };
    }

    const bookshelfIds = bookshelves.map(bs => bs.id);

    // Get all books from these bookshelves
    const { data, error } = await supabase
      .from('bk_books')
      .select('*')
      .in('bookshelf_id', bookshelfIds)
      .order('added_date', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching all user books:', error);
    return { data: [], error };
  }
};

/**
 * Create a new book
 * @param {string} bookshelfId - The bookshelf ID
 * @param {object} bookData - The book data
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const createBook = async (bookshelfId, bookData) => {
  try {
    // Validate bookshelfId is a UUID
    if (!bookshelfId || (typeof bookshelfId === 'number') || (typeof bookshelfId === 'string' && !bookshelfId.includes('-'))) {
      return { 
        data: null, 
        error: { 
          message: `Invalid bookshelf ID: ${bookshelfId}. Bookshelf must exist in database with a UUID.` 
        } 
      };
    }

    const bookInsert = {
      bookshelf_id: bookshelfId,
      title: bookData.title,
      author: bookData.author || null,
      genre: bookData.genre || null,
      cover_url: bookData.coverUrl || null,
      description: bookData.description || null,
      favorite_character: bookData.favoriteCharacter || null,
      scene_summary: bookData.sceneSummary || null,
      memorable_moments: bookData.memorableMoments || null,
      review: bookData.review || null,
      least_favorite_part: bookData.leastFavoritePart || null,
      rating: bookData.rating || 0,
      start_date: bookData.startDate || null,
      finish_date: bookData.finishDate || null
    };

    const { data, error } = await supabase
      .from('bk_books')
      .insert([bookInsert])
      .select()
      .single();

    if (error) {
      console.error('Error creating book:', error);
      // Provide more helpful error messages
      if (error.code === '23503') {
        return { 
          data: null, 
          error: { 
            ...error, 
            message: `Foreign key error: Bookshelf with ID ${bookshelfId} does not exist in database.` 
          } 
        };
      }
    }

    return { data, error };
  } catch (error) {
    console.error('Error creating book:', error);
    return { data: null, error };
  }
};

/**
 * Update a book
 * @param {string} bookId - The book ID
 * @param {object} updates - The fields to update
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateBook = async (bookId, updates) => {
  try {
    // Map camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
    if (updates.favoriteCharacter !== undefined) dbUpdates.favorite_character = updates.favoriteCharacter;
    if (updates.sceneSummary !== undefined) dbUpdates.scene_summary = updates.sceneSummary;
    if (updates.memorableMoments !== undefined) dbUpdates.memorable_moments = updates.memorableMoments;
    if (updates.leastFavoritePart !== undefined) dbUpdates.least_favorite_part = updates.leastFavoritePart;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.finishDate !== undefined) dbUpdates.finish_date = updates.finishDate;
    if (updates.sharedWith !== undefined) dbUpdates.shared_with = updates.sharedWith;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.sharedBy !== undefined) dbUpdates.shared_by = updates.sharedBy;
    if (updates.sharedAt !== undefined) dbUpdates.shared_at = updates.sharedAt;
    
    // Direct mappings for fields that don't need conversion
    Object.keys(updates).forEach(key => {
      if (!['coverUrl', 'favoriteCharacter', 'sceneSummary', 'memorableMoments', 'leastFavoritePart', 'startDate', 'finishDate', 'sharedWith', 'isPublic', 'sharedBy', 'sharedAt'].includes(key)) {
        dbUpdates[key] = updates[key];
      }
    });

    const { data, error } = await supabase
      .from('bk_books')
      .update(dbUpdates)
      .eq('id', bookId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error updating book:', error);
    return { data: null, error };
  }
};

/**
 * Delete a book
 * @param {string} bookId - The book ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const deleteBook = async (bookId) => {
  try {
    const { error } = await supabase
      .from('bk_books')
      .delete()
      .eq('id', bookId);

    return { data: { success: true }, error };
  } catch (error) {
    console.error('Error deleting book:', error);
    return { data: null, error };
  }
};

/**
 * Move a book to a different bookshelf
 * @param {string} bookId - The book ID
 * @param {string} newBookshelfId - The new bookshelf ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const moveBook = async (bookId, newBookshelfId) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .update({ bookshelf_id: newBookshelfId })
      .eq('id', bookId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error moving book:', error);
    return { data: null, error };
  }
};

/**
 * Transform database book object to app format
 * @param {object} dbBook - Book object from database
 * @returns {object} Book object in app format
 */
export const transformBookFromDB = (dbBook) => {
  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return null;
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // If it's an ISO date string or Date object, extract YYYY-MM-DD
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  };

  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author ? String(dbBook.author).trim() : null,
    genre: dbBook.genre || null,
    coverUrl: dbBook.cover_url,
    description: dbBook.description,
    favoriteCharacter: dbBook.favorite_character,
    sceneSummary: dbBook.scene_summary,
    memorableMoments: dbBook.memorable_moments,
    review: dbBook.review,
    leastFavoritePart: dbBook.least_favorite_part,
    rating: dbBook.rating,
    startDate: formatDateForInput(dbBook.start_date),
    finishDate: formatDateForInput(dbBook.finish_date),
    addedDate: dbBook.added_date,
    sharedWith: dbBook.shared_with || [],
    isPublic: dbBook.is_public || false,
    sharedBy: dbBook.shared_by || null,
    sharedAt: dbBook.shared_at || null
  };
};

/**
 * Transform app book object to database format
 * @param {object} appBook - Book object in app format
 * @returns {object} Book object in database format
 */
export const transformBookToDB = (appBook) => {
  return {
    title: appBook.title,
    author: appBook.author || null,
    genre: appBook.genre || null,
    cover_url: appBook.coverUrl || null,
    description: appBook.description || null,
    favorite_character: appBook.favoriteCharacter || null,
    scene_summary: appBook.sceneSummary || null,
    memorable_moments: appBook.memorableMoments || null,
    review: appBook.review || null,
    least_favorite_part: appBook.leastFavoritePart || null,
    rating: appBook.rating || 0,
    start_date: appBook.startDate || null,
    finish_date: appBook.finishDate || null,
    shared_with: appBook.sharedWith || [],
    is_public: appBook.isPublic || false,
    shared_by: appBook.sharedBy || null,
    shared_at: appBook.sharedAt || null
  };
};

/**
 * Share a book with specific users
 * @param {string} bookId - The book ID
 * @param {array} userIds - Array of user IDs to share with
 * @param {string} sharerId - The user ID who is sharing
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const shareBook = async (bookId, userIds, sharerId) => {
  try {
    console.log('Sharing book:', { bookId, userIds, sharerId });
    const { data, error } = await supabase
      .from('bk_books')
      .update({ 
        shared_with: userIds || [],
        shared_by: sharerId,
        shared_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      console.error('Error sharing book:', error);
    } else {
      console.log('Book shared successfully:', data);
    }
    return { data, error };
  } catch (error) {
    console.error('Error sharing book (catch):', error);
    return { data: null, error };
  }
};

/**
 * Make a book publicly recommended
 * @param {string} bookId - The book ID
 * @param {boolean} isPublic - Whether to make it public
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const setBookPublic = async (bookId, isPublic) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .update({ is_public: isPublic })
      .eq('id', bookId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error setting book public:', error);
    return { data: null, error };
  }
};

/**
 * Get books shared with a user
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getSharedBooks = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .select('*')
      .contains('shared_with', [userId])
      .neq('shared_by', userId) // Exclude books shared by the user themselves
      .order('shared_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching shared books:', error);
    return { data: [], error };
  }
};

/**
 * Get books shared by a user
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getBooksSharedByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .select('*')
      .eq('shared_by', userId)
      .order('shared_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching books shared by user:', error);
    return { data: [], error };
  }
};

/**
 * Get public book recommendations
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getPublicRecommendations = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .select('*')
      .eq('is_public', true)
      .order('shared_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching public recommendations:', error);
    return { data: [], error };
  }
};

/**
 * Get total book count for a user (for comparison)
 * @param {string} userId - The user ID
 * @returns {Promise<{data: number, error: object|null}>}
 */
export const getUserBookCount = async (userId) => {
  try {
    // Get all user's bookshelves
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bk_bookshelves')
      .select('id')
      .eq('user_id', userId);

    if (bookshelfError) {
      console.error('Error fetching bookshelves for count:', bookshelfError);
      return { data: 0, error: bookshelfError };
    }

    if (!bookshelves || bookshelves.length === 0) {
      return { data: 0, error: null };
    }

    const bookshelfIds = bookshelves.map(bs => bs.id);

    // Count books in these bookshelves
    const { count, error } = await supabase
      .from('bk_books')
      .select('*', { count: 'exact', head: true })
      .in('bookshelf_id', bookshelfIds);

    if (error) {
      console.error('Error counting books:', error);
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error getting user book count:', error);
    return { data: 0, error };
  }
};

/**
 * Get books read this month for a user (for comparison)
 * @param {string} userId - The user ID
 * @returns {Promise<{data: number, error: object|null}>}
 */
export const getUserBooksThisMonth = async (userId) => {
  try {
    // Get all user's bookshelves
    const { data: bookshelves, error: bookshelfError } = await supabase
      .from('bk_bookshelves')
      .select('id')
      .eq('user_id', userId);

    if (bookshelfError) {
      console.error('Error fetching bookshelves for monthly count:', bookshelfError);
      return { data: 0, error: bookshelfError };
    }

    if (!bookshelves || bookshelves.length === 0) {
      return { data: 0, error: null };
    }

    const bookshelfIds = bookshelves.map(bs => bs.id);

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Count books finished this month
    const { count, error } = await supabase
      .from('bk_books')
      .select('*', { count: 'exact', head: true })
      .in('bookshelf_id', bookshelfIds)
      .not('finish_date', 'is', null)
      .gte('finish_date', monthStart)
      .lte('finish_date', monthEnd);

    if (error) {
      console.error('Error counting monthly books:', error);
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error getting user books this month:', error);
    return { data: 0, error };
  }
};
