/**
 * Writing Feedback Service
 * Handles all writing feedback operations using the new bk_ai_writing_feedback table
 */

import { supabase } from '../config/supabase';

/**
 * Save writing style feedback with raw response first (before parsing)
 * @param {string} userId - User ID
 * @param {object} requestParams - Request parameters including prompt, books, timing, cost, etc.
 * @param {string} fullResponse - Complete raw response from AI (JSON string)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const saveWritingFeedbackRaw = async (userId, requestParams, fullResponse) => {
  try {
    const {
      booksAnalyzed = [],
      prompt,
      modelUsed = 'gpt-4o-mini',
      apiKeyUsed = false,
      tokensUsed = null,
      estimatedCost = null,
      timeTakenMs = null,
      requestTimestamp = new Date().toISOString(),
      responseTimestamp = new Date().toISOString()
    } = requestParams;

    // Insert with raw response first, parsed fields will be null initially
    const record = {
      user_id: userId,
      request_timestamp: requestTimestamp,
      response_timestamp: responseTimestamp,
      time_taken_ms: timeTakenMs,
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      model_used: modelUsed,
      api_key_used: apiKeyUsed,
      full_request: prompt,
      full_response: fullResponse, // Save raw response immediately
      reading_grade_level: null, // Will be updated after parsing
      overall_assessment: null, // Will be updated after parsing
      books_analyzed: booksAnalyzed.map(b => ({
        title: b.title,
        author: b.author,
        review_length: b.review?.length || 0,
        word_count: b.review?.trim().split(/\s+/).filter(word => word.length > 0).length || 0
      })),
      books_count: booksAnalyzed.length,
      strengths: [], // Will be updated after parsing
      improvements: [], // Will be updated after parsing
      specific_suggestions: [], // Will be updated after parsing
      tips: [] // Will be updated after parsing
    };

    const { data, error } = await supabase
      .from('bk_ai_writing_feedback')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error saving writing feedback (raw):', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in saveWritingFeedbackRaw:', error);
    return { data: null, error };
  }
};

/**
 * Update writing feedback record with parsed data
 * @param {string} feedbackId - Feedback record ID
 * @param {string} userId - User ID (for security check)
 * @param {object} parsedData - Parsed/structured data from the response
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const updateWritingFeedbackParsed = async (feedbackId, userId, parsedData) => {
  try {
    const {
      readingGradeLevel = null,
      writingSkillLevel = null,
      skillBreakdown = null,
      overallAssessment = null,
      strengths = [],
      improvements = [],
      specificSuggestions = [],
      tips = []
    } = parsedData;

    const updateData = {
      reading_grade_level: readingGradeLevel,
      writing_skill_level: typeof writingSkillLevel === 'number' ? writingSkillLevel : null,
      skill_breakdown: skillBreakdown || null,
      overall_assessment: overallAssessment,
      strengths: Array.isArray(strengths) ? strengths : [],
      improvements: Array.isArray(improvements) ? improvements : [],
      specific_suggestions: Array.isArray(specificSuggestions) ? specificSuggestions : [],
      tips: Array.isArray(tips) ? tips : []
    };

    const { data, error } = await supabase
      .from('bk_ai_writing_feedback')
      .update(updateData)
      .eq('id', feedbackId)
      .eq('user_id', userId) // Security check
      .select()
      .single();

    if (error) {
      console.error('Error updating writing feedback with parsed data:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateWritingFeedbackParsed:', error);
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
      .from('bk_ai_writing_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('request_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching writing feedback history:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getWritingFeedbackHistory:', error);
    return { data: [], error };
  }
};

/**
 * Get a specific writing feedback record by ID
 * @param {string} userId - User ID
 * @param {string} feedbackId - Feedback record ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getWritingFeedbackById = async (userId, feedbackId) => {
  try {
    const { data, error } = await supabase
      .from('bk_ai_writing_feedback')
      .select('*')
      .eq('id', feedbackId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching writing feedback:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getWritingFeedbackById:', error);
    return { data: null, error };
  }
};

/**
 * Get writing feedback analytics for progress tracking
 * @param {string} userId - User ID
 * @param {number} months - Number of months to look back (default: 12)
 * @returns {Promise<{data: object, error: object|null}>}
 */
export const getWritingFeedbackAnalytics = async (userId, months = 12) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const { data, error } = await supabase
      .from('bk_ai_writing_feedback')
      .select('id, request_timestamp, reading_grade_level, overall_assessment, time_taken_ms, estimated_cost')
      .eq('user_id', userId)
      .gte('request_timestamp', cutoffDate.toISOString())
      .order('request_timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching writing feedback analytics:', error);
      return { data: null, error };
    }

    // Process data for analytics
    const analytics = {
      totalFeedback: data?.length || 0,
      gradeLevels: data?.filter(d => d.reading_grade_level).map(d => ({
        date: d.request_timestamp,
        gradeLevel: d.reading_grade_level
      })) || [],
      averageTimeMs: data?.length > 0 
        ? Math.round(data.reduce((sum, d) => sum + (d.time_taken_ms || 0), 0) / data.length)
        : null,
      totalCost: data?.reduce((sum, d) => sum + (parseFloat(d.estimated_cost) || 0), 0) || 0
    };

    return { data: analytics, error: null };
  } catch (error) {
    console.error('Error in getWritingFeedbackAnalytics:', error);
    return { data: null, error };
  }
};

