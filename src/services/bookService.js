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
    
    // Direct mappings
    Object.keys(updates).forEach(key => {
      if (!['coverUrl', 'favoriteCharacter', 'sceneSummary', 'memorableMoments', 'leastFavoritePart', 'startDate', 'finishDate'].includes(key)) {
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
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    coverUrl: dbBook.cover_url,
    description: dbBook.description,
    favoriteCharacter: dbBook.favorite_character,
    sceneSummary: dbBook.scene_summary,
    memorableMoments: dbBook.memorable_moments,
    review: dbBook.review,
    leastFavoritePart: dbBook.least_favorite_part,
    rating: dbBook.rating,
    startDate: dbBook.start_date,
    finishDate: dbBook.finish_date,
    addedDate: dbBook.added_date
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
    cover_url: appBook.coverUrl || null,
    description: appBook.description || null,
    favorite_character: appBook.favoriteCharacter || null,
    scene_summary: appBook.sceneSummary || null,
    memorable_moments: appBook.memorableMoments || null,
    review: appBook.review || null,
    least_favorite_part: appBook.leastFavoritePart || null,
    rating: appBook.rating || 0,
    start_date: appBook.startDate || null,
    finish_date: appBook.finishDate || null
  };
};
