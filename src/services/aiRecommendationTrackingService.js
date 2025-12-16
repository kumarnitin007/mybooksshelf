/**
 * AI Recommendation Tracking Service
 * 
 * Tracks all AI recommendation requests to database for:
 * - Cost tracking
 * - History retrieval
 * - Analytics
 */

import { supabase } from '../config/supabase';

/**
 * Save an AI recommendation request to database
 * For cache hits, updates existing row with usage count instead of creating new row
 * @param {string} userId - User ID
 * @param {object} requestParams - Request parameters
 * @param {array} recommendations - Generated recommendations
 * @param {object} metadata - Additional metadata (fromCache, apiKeyUsed, rawResponse, etc.)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const saveAIRecommendationRequest = async (userId, requestParams, recommendations, metadata = {}) => {
  try {
    const {
      analysis,
      prompt,
      booksHash,
      modelUsed = 'gpt-4o-mini',
      apiKeyUsed = false,
      fromCache = false,
      tokensUsed = null,
      estimatedCost = null
    } = requestParams;

    // If this is a cache hit, find the original request and increment usage count
    if (fromCache && booksHash) {
      // Find the original request by books_hash and user_id
      // Look for the most recent request with this books_hash (could be from_cache false or true)
      // We want to find the original request that generated these recommendations
      const { data: existingRequests, error: findError } = await supabase
        .from('bk_ai_recommendations')
        .select('id, cache_usage_count, from_cache, api_key_used')
        .eq('user_id', userId)
        .eq('books_hash', booksHash)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding existing request:', findError);
        console.warn('Cache hit but error finding original request - skipping database save to avoid duplicate rows');
        // For cache hits, if we can't find the original due to error, don't create a new row
        return { data: null, error: findError };
      } else if (existingRequests && existingRequests.length > 0) {
        // Found existing request - update it with incremented cache usage count
        const existingId = existingRequests[0].id;
        const currentCount = existingRequests[0].cache_usage_count || 0;
        
        console.log(`Found existing request ${existingId}, incrementing cache_usage_count from ${currentCount} to ${currentCount + 1}`);
        
        const { data, error } = await supabase
          .from('bk_ai_recommendations')
          .update({
            cache_usage_count: currentCount + 1,
            last_cache_used_at: new Date().toISOString()
          })
          .eq('id', existingId)
          .select()
          .single();

        if (error) {
          console.error('Error updating cache usage count:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // If update fails (e.g., columns don't exist), don't create a new record
          // Just return - we tried to update but failed
          console.warn('Update failed - columns may not exist. Run database/add_cache_usage_tracking.sql');
          return { data: null, error };
        } else {
          console.log('Successfully updated cache usage count');
          return { data, error: null };
        }
      } else {
        console.log(`No existing request found for books_hash: ${booksHash}, user_id: ${userId}`);
        console.warn('Cache hit but original request not found - this should not happen. Skipping database save.');
        // For cache hits, if we can't find the original, don't create a new row
        // Just return without saving
        return { data: null, error: null };
      }
    }

    // Create new record ONLY for non-cached requests (fresh API calls or fallback)
    const record = {
      user_id: userId,
      total_books: analysis?.totalBooks || 0,
      average_rating: analysis?.averageRating ? parseFloat(analysis.averageRating) : null,
      favorite_genres: analysis?.favoriteGenres || [],
      favorite_authors: analysis?.favoriteAuthors || [],
      highly_rated_books: analysis?.highlyRatedBooks || [],
      reading_themes: analysis?.readingThemes || [],
      books_hash: booksHash,
      prompt_text: prompt,
      model_used: modelUsed,
      api_key_used: apiKeyUsed,
      recommendations: recommendations || [],
      recommendations_count: recommendations?.length || 0,
      from_cache: fromCache,
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      cache_usage_count: null, // Will be set when cache is used
      raw_ai_response: metadata.rawResponse || null // Store raw AI response if provided
    };

    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error saving AI recommendation request:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in saveAIRecommendationRequest:', error);
    return { data: null, error };
  }
};

/**
 * Save writing style feedback to database
 * @param {string} userId - User ID
 * @param {object} requestParams - Request parameters
 * @param {string} feedback - Generated feedback text
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const saveWritingStyleFeedback = async (userId, requestParams, feedback) => {
  try {
    const {
      booksAnalyzed = [],
      prompt,
      modelUsed = 'gpt-4o-mini',
      apiKeyUsed = false,
      tokensUsed = null,
      estimatedCost = null,
      rawResponse = null
    } = requestParams;

    // Store feedback in recommendations field as JSON for now
    // Format: { type: 'writing_feedback', feedback: '...', books: [...] }
    const feedbackRecord = {
      type: 'writing_feedback',
      feedback: feedback,
      books: booksAnalyzed.map(b => ({
        title: b.title,
        author: b.author,
        review_length: b.review?.length || 0
      }))
    };

    const record = {
      user_id: userId,
      total_books: booksAnalyzed.length,
      average_rating: null, // Not applicable for writing feedback
      favorite_genres: [],
      favorite_authors: [],
      highly_rated_books: [],
      reading_themes: [],
      books_hash: null, // Not applicable
      prompt_text: prompt,
      model_used: modelUsed,
      api_key_used: apiKeyUsed,
      recommendations: [feedbackRecord], // Store feedback as first "recommendation" with type marker
      recommendations_count: 1, // Mark as 1 to indicate feedback exists
      from_cache: false,
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      cache_usage_count: null,
      raw_ai_response: rawResponse || feedback // Store raw API response if available, otherwise store feedback text
    };

    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error saving writing feedback:', error);
      // If the table structure doesn't support this, we might need a new table
      // For now, just log the error but don't fail
      console.warn('Writing feedback not saved to database. Table may need schema update.');
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in saveWritingStyleFeedback:', error);
    return { data: null, error };
  }
};

/**
 * Get user's writing feedback history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getWritingFeedbackHistory = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('recommendations_count', 1) // Writing feedback has count of 1
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching writing feedback history:', error);
      return { data: [], error };
    }

    // Filter to only return records that are actually writing feedback
    const feedbackRecords = (data || []).filter(record => {
      if (record.recommendations && record.recommendations.length > 0) {
        const firstRec = record.recommendations[0];
        return firstRec && firstRec.type === 'writing_feedback';
      }
      return false;
    });

    return { data: feedbackRecords, error: null };
  } catch (error) {
    console.error('Error in getWritingFeedbackHistory:', error);
    return { data: [], error };
  }
};

/**
 * Get user's AI recommendation history
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<{data: array, error: object|null}>}
 */
export const getAIRecommendationHistory = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI recommendation history:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getAIRecommendationHistory:', error);
    return { data: [], error };
  }
};

/**
 * Get a specific recommendation request by ID
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (for security check)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getAIRecommendationById = async (requestId, userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching AI recommendation by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getAIRecommendationById:', error);
    return { data: null, error };
  }
};

/**
 * Get statistics for a user's AI recommendation usage
 * @param {string} userId - User ID
 * @returns {Promise<{data: object, error: object|null}>}
 */
export const getAIRecommendationStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bk_ai_recommendations')
      .select('api_key_used, estimated_cost, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching AI recommendation stats:', error);
      return { data: null, error };
    }

    const paidRequests = (data || []).filter(r => r.api_key_used);
    const totalCost = paidRequests.reduce((sum, r) => sum + (parseFloat(r.estimated_cost) || 0), 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthRequests = (data || []).filter(r => new Date(r.created_at) >= thisMonth);

    return {
      data: {
        totalRequests: (data || []).length,
        paidRequests: paidRequests.length,
        freeRequests: (data || []).length - paidRequests.length,
        totalCost: totalCost.toFixed(4),
        thisMonthRequests: thisMonthRequests.length,
        lastRequest: (data || []).length > 0 ? data[0].created_at : null
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getAIRecommendationStats:', error);
    return { data: null, error };
  }
};

