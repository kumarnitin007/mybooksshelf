/**
 * Suggestion Service
 * 
 * Handles ignored book suggestions for users
 */

import { supabase } from '../config/supabase';

/**
 * Get all ignored suggestions for a user
 * @param {string} userId - The user ID
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getIgnoredSuggestions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_ignored_suggestions')
      .select('suggestion_key')
      .eq('user_id', userId);

    return { data: data?.map(item => item.suggestion_key) || [], error };
  } catch (error) {
    console.error('Error fetching ignored suggestions:', error);
    return { data: [], error };
  }
};

/**
 * Add a suggestion to ignored list
 * @param {string} userId - The user ID
 * @param {string} suggestionKey - The suggestion key (format: "title|author")
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const ignoreSuggestion = async (userId, suggestionKey) => {
  try {
    const { data, error } = await supabase
      .from('bk_ignored_suggestions')
      .insert([{
        user_id: userId,
        suggestion_key: suggestionKey
      }])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    // Ignore duplicate key errors
    if (error.code === '23505') {
      return { data: { success: true }, error: null };
    }
    console.error('Error ignoring suggestion:', error);
    return { data: null, error };
  }
};

/**
 * Remove a suggestion from ignored list
 * @param {string} userId - The user ID
 * @param {string} suggestionKey - The suggestion key
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const unignoreSuggestion = async (userId, suggestionKey) => {
  try {
    const { error } = await supabase
      .from('bk_ignored_suggestions')
      .delete()
      .eq('user_id', userId)
      .eq('suggestion_key', suggestionKey);

    return { data: { success: true }, error };
  } catch (error) {
    console.error('Error unignoring suggestion:', error);
    return { data: null, error };
  }
};
