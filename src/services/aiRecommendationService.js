/**
 * AI Recommendation Service
 * 
 * Generates personalized book recommendations using AI based on user's reading history
 * Includes rate limiting and caching to prevent abuse
 */

import {
  checkRateLimit,
  recordRequest,
  getCachedRecommendations,
  cacheRecommendations,
  generateBooksHash
} from './aiRecommendationRateLimit';
import { saveAIRecommendationRequest } from './aiRecommendationTrackingService';
import { BOOK_RECOMMENDATIONS } from '../data/recommendations';

/**
 * Generate AI-powered book recommendations
 * @param {array} userBooks - Array of user's books with ratings
 * @param {object} userProfile - User profile data
 * @param {string} userId - User ID for rate limiting and caching
 * @param {boolean} forceRefresh - Force refresh even if cache exists
 * @returns {Promise<{data: array, error: object|null, fromCache: boolean, rateLimited: boolean}>}
 */
export const generateAIRecommendations = async (userBooks, userProfile, userId = null, forceRefresh = false) => {
  try {
    // Check environment variable to force refresh (overrides parameter)
    // This allows bypassing cache for testing via .env file
    const envForceRefresh = import.meta.env.VITE_FORCE_AI_REFRESH === 'true' || import.meta.env.VITE_FORCE_AI_REFRESH === true;
    const shouldForceRefresh = forceRefresh || envForceRefresh;
    
    // Check rate limiting if userId is provided
    if (userId) {
      const rateLimitCheck = await checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          data: [],
          error: { message: rateLimitCheck.reason, code: 'RATE_LIMIT_EXCEEDED' },
          fromCache: false,
          rateLimited: true,
          retryAfter: rateLimitCheck.retryAfter
        };
      }
    }

    // Analyze user's reading patterns (needed for tracking and prompt)
    const analysis = analyzeReadingPatterns(userBooks);
    const booksHash = generateBooksHash(userBooks);
    
    // Check cache if not forcing refresh
    if (!shouldForceRefresh && userId) {
      const cached = getCachedRecommendations(userId, booksHash);
      if (cached) {
        // Still save to database that cache was used (for tracking)
        if (userId) {
          const promptData = buildRecommendationPrompt(analysis, userProfile);
          const { prompt } = promptData;
          await saveAIRecommendationRequest(
            userId,
            {
              analysis,
              prompt,
              booksHash,
              modelUsed: 'cached',
              apiKeyUsed: false,
              fromCache: true,
              estimatedCost: null
            },
            cached,
            { fromCache: true }
          );
        }
        return {
          data: cached,
          error: null,
          fromCache: true,
          rateLimited: false
        };
      }
    }
    
    // Build prompt for AI (now returns object with prompt, tokenEstimate, costEstimate)
    const promptData = buildRecommendationPrompt(analysis, userProfile);
    const { prompt, tokenEstimate, costEstimate } = promptData;
    
    // Call AI service (OpenAI, Anthropic, or local model)
    // Note: API key is stored server-side only (in Vercel env vars as OPENAI_API_KEY)
    // Frontend doesn't need the key - it just calls the serverless function
    const apiKeyExists = true; // Assume API is available if serverless function exists
    const apiResult = await callAIRecommendationAPI(prompt, userBooks, apiKeyExists, { tokenEstimate, costEstimate });
    
    // Handle both old format (array) and new format (object with recommendations and rawResponse)
    let recommendations, rawResponse = null;
    if (Array.isArray(apiResult)) {
      recommendations = apiResult;
    } else if (apiResult && apiResult.recommendations) {
      recommendations = apiResult.recommendations;
      rawResponse = apiResult.rawResponse;
    } else {
      recommendations = [];
    }
    
    // Determine if API was actually used (check if recommendations have isAI flag)
    const apiKeyUsed = recommendations && recommendations.length > 0 && recommendations[0]?.isAI === true;
    
    // Sort recommendations by score (highest first) if scores exist
    if (recommendations && recommendations.length > 0 && recommendations[0].score !== undefined) {
      recommendations = recommendations.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    // Cache recommendations if userId is provided
    if (userId && recommendations && recommendations.length > 0) {
      cacheRecommendations(userId, booksHash, recommendations);
    }
    
    // Record the request for rate limiting
    if (userId) {
      recordRequest(userId);
    }
    
    // Save to database for tracking (only if userId exists and recommendations were generated)
    if (userId && recommendations && recommendations.length > 0) {
      // Use actual cost estimate from prompt building
      const estimatedCost = apiKeyUsed && costEstimate ? costEstimate.totalCost : null;
      
      await saveAIRecommendationRequest(
        userId,
        {
          analysis,
          prompt,
          booksHash,
          modelUsed: apiKeyUsed ? 'gpt-4o-mini' : 'fallback',
          apiKeyUsed,
          fromCache: false,
          tokensUsed: tokenEstimate || null,
          estimatedCost
        },
        recommendations,
        { 
          fromCache: false,
          rawResponse: rawResponse // Pass raw AI response for storage
        }
      );
    }
    
    return {
      data: recommendations,
      error: null,
      fromCache: false,
      rateLimited: false,
      costEstimate: costEstimate || null,
      tokenEstimate: tokenEstimate || null
    };
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return {
      data: [],
      error,
      fromCache: false,
      rateLimited: false
    };
  }
};

/**
 * Generate writing style feedback from book reviews
 * @param {array} booksWithReviews - Array of books with reviews
 * @param {string} userId - User ID for rate limiting
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export const generateWritingStyleFeedback = async (booksWithReviews, userId = null, userProfile = null) => {
  try {
    // Check rate limiting if userId is provided
    if (userId) {
      const { checkRateLimit } = await import('./aiRecommendationRateLimit');
      const rateLimitCheck = await checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          data: null,
          error: { message: rateLimitCheck.reason, code: 'RATE_LIMIT_EXCEEDED' }
        };
      }
    }

    // Extract age group from user profile
    const ageGroup = userProfile?.age_group || null;
    const ageContext = ageGroup ? ` The student's age group is: ${ageGroup}. Please consider this when assessing their writing skill level and providing age-appropriate feedback.` : '';

    // Build prompt for writing style feedback
    let prompt = `You are an expert writing coach and educator specializing in helping students improve their writing skills. Analyze the following book reviews written by a student and provide comprehensive feedback on their writing style, strengths, and areas for improvement.${ageContext}\n\n`;
    
    prompt += `Student's Book Reviews (${booksWithReviews.length} reviews):\n\n`;
    
    booksWithReviews.forEach((book, index) => {
      prompt += `Review ${index + 1}:\n`;
      prompt += `Book: "${book.title}" by ${book.author || 'Unknown Author'}\n`;
      prompt += `Review:\n${book.review}\n\n`;
    });
    
    prompt += `IMPORTANT: Please provide your feedback as a valid JSON object with the following structure. The example below is for structure reference only - use actual values based on your analysis:\n\n`;
    prompt += `{\n`;
    prompt += `  "readingGradeLevel": "8th grade",\n`;
    prompt += `  "writingSkillLevel": 7,\n`;
    prompt += `  "skillBreakdown": {\n`;
    prompt += `    "contentUnderstanding": 8,\n`;
    prompt += `    "engagement": 8,\n`;
    prompt += `    "writingMechanics": 6\n`;
    prompt += `  },\n`;
    prompt += `  "strengths": ["Clear and engaging writing style", "Good use of descriptive language", "Well-organized thoughts"],\n`;
    prompt += `  "improvements": ["Grammar and punctuation need work", "Could use more varied sentence structure", "Deeper analysis would strengthen reviews"],\n`;
    prompt += `  "specificSuggestions": ["Practice using commas correctly", "Try varying sentence lengths", "Include specific examples from books"],\n`;
    prompt += `  "tips": ["Start with a brief summary", "State your opinion clearly", "Use examples from the book"],\n`;
    prompt += `  "overallAssessment": "The student shows strong potential with engaging writing. With focus on grammar and deeper analysis, their reviews will become even more compelling."\n`;
    prompt += `}\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- "readingGradeLevel": A single string like "6th grade", "9th grade", "high school level", or "college level" - assess the reading level demonstrated in the reviews\n`;
    prompt += `- "writingSkillLevel": REQUIRED - A number from 1 to 10 representing the overall writing skill level. This is a critical field. Rate this based on the student's age/grade level if provided. For example, if the student is 12 years old, rate it on a scale of 1-10 for a 12-year-old. This should be a single integer (e.g., 7, not 7.5). Consider grammar, clarity, engagement, depth of analysis, and overall writing quality.\n`;
    prompt += `- "skillBreakdown": An object with three numeric scores (1-10 each): "contentUnderstanding" (how well they understand the book), "engagement" (how engaging their writing is), and "writingMechanics" (grammar, punctuation, sentence structure).\n`;
    prompt += `- "strengths": An array of 3-5 specific strengths (each as a string)\n`;
    prompt += `- "improvements": An array of 3-5 specific areas for improvement (each as a string)\n`;
    prompt += `- "specificSuggestions": An array of 5-7 actionable suggestions (each as a string)\n`;
    prompt += `- "tips": An array of 3-5 tips for writing better reviews (each as a string)\n`;
    prompt += `- "overallAssessment": A single string with 2-3 sentences summarizing the student's writing ability and explaining the writingSkillLevel rating\n\n`;
    prompt += `Please be encouraging, constructive, and specific. Return ONLY valid JSON, no additional text before or after.`;

    // Call AI API for writing feedback (returns JSON)
    // Use the same API endpoint but with mode='json'
    const isProduction = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
    const apiUrl = isProduction ? '/api/openai' : 'http://localhost:3001/api/openai';
    
    console.log('Calling OpenAI API for writing feedback with mode=text');
    
    // Track request start time
    const requestStartTime = Date.now();
    const requestTimestamp = new Date().toISOString();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'gpt-4o-mini',
        max_tokens: 2000, // More tokens for detailed feedback
        temperature: 0.7,
        mode: 'json' // Return JSON for structured parsing
      }),
    });
    
    console.log('OpenAI API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track response time
    const responseTimestamp = new Date().toISOString();
    const timeTakenMs = Date.now() - requestStartTime;
    
    // Store raw response for database
    const rawResponse = JSON.stringify(data);
    
    // Extract feedback from API response (should be JSON)
    let feedbackText = null;
    let feedbackJson = null;
    
    // Format 1: Processed response from our API handler (mode='json')
    if (data.text) {
      feedbackText = data.text;
    }
    // Format 2: Standard OpenAI API response
    else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      feedbackText = data.choices[0].message.content;
    }
    // Format 3: Alternative response formats
    else if (data.response) {
      feedbackText = data.response;
    }
    else if (data.message) {
      feedbackText = data.message;
    }
    
    if (!feedbackText || feedbackText.trim().length === 0) {
      console.error('Unexpected API response format for writing feedback:', {
        responseKeys: Object.keys(data),
        fullResponse: data,
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0]
      });
      throw new Error('No feedback generated. The API response format was unexpected. Please check the console for details.');
    }
    
    // Try to parse as JSON
    try {
      // Clean up the text - remove markdown code blocks if present
      let cleanedText = feedbackText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      feedbackJson = JSON.parse(cleanedText);
      console.log('Writing feedback parsed as JSON successfully');
    } catch (parseError) {
      console.warn('Failed to parse feedback as JSON, will use text parsing:', parseError);
      feedbackJson = null;
    }
    
    console.log('Writing feedback received successfully, length:', feedbackText.length, 'Time taken:', timeTakenMs, 'ms');

    // Record the request if userId is provided
    let feedbackRecordId = null;
    if (userId) {
      try {
        const { recordRequest } = await import('./aiRecommendationRateLimit');
        await recordRequest(userId);
      } catch (err) {
        console.warn('Failed to record writing feedback request:', err);
      }
      
      // Step 1: Save raw response immediately to database (before parsing)
      try {
        const { saveWritingFeedbackRaw, updateWritingFeedbackParsed } = await import('./writingFeedbackService');
        const estimatedTokens = data.usage?.total_tokens || Math.ceil(prompt.length / 4) + 2000;
        const costEst = estimateAICost(estimatedTokens - 2000, 2000); // input tokens, output tokens
        
        // Insert with raw response first (as JSON string)
        const saveResult = await saveWritingFeedbackRaw(
          userId,
          {
            booksAnalyzed: booksWithReviews,
            prompt: prompt,
            modelUsed: 'gpt-4o-mini',
            apiKeyUsed: true,
            tokensUsed: estimatedTokens,
            estimatedCost: costEst.totalCost,
            timeTakenMs: timeTakenMs,
            requestTimestamp: requestTimestamp,
            responseTimestamp: responseTimestamp
          },
          rawResponse // Full raw response as JSON string - save immediately
        );
        
        if (saveResult.data && saveResult.data.id) {
          feedbackRecordId = saveResult.data.id;
        }
      } catch (err) {
        console.warn('Failed to save writing feedback to database:', err);
        // Don't fail the request if saving fails
      }
    }

    // Step 2: Parse feedback to extract structured data (after saving raw response)
    // If we have JSON, use it directly; otherwise parse from text
    const parsedData = feedbackJson 
      ? {
          readingGradeLevel: feedbackJson.readingGradeLevel || null,
          writingSkillLevel: typeof feedbackJson.writingSkillLevel === 'number' ? feedbackJson.writingSkillLevel : null,
          skillBreakdown: feedbackJson.skillBreakdown || null,
          overallAssessment: feedbackJson.overallAssessment || null,
          strengths: Array.isArray(feedbackJson.strengths) ? feedbackJson.strengths : [],
          improvements: Array.isArray(feedbackJson.improvements) ? feedbackJson.improvements : [],
          specificSuggestions: Array.isArray(feedbackJson.specificSuggestions) ? feedbackJson.specificSuggestions : [],
          tips: Array.isArray(feedbackJson.tips) ? feedbackJson.tips : []
        }
      : parseWritingFeedbackResponse(feedbackText);

    // Step 3: Update the record with parsed data
    if (userId && feedbackRecordId) {
      try {
        const { updateWritingFeedbackParsed } = await import('./writingFeedbackService');
        await updateWritingFeedbackParsed(feedbackRecordId, userId, parsedData);
      } catch (err) {
        console.warn('Failed to update writing feedback with parsed data:', err);
        // Don't fail the request if update fails - raw data is already saved
      }
    }

    return {
      data: feedbackText, // Keep text for display/fallback
      rawResponse: rawResponse,
      parsedData: parsedData,
      metadata: {
        timeTakenMs,
        tokensUsed: data.usage?.total_tokens || null,
        requestTimestamp,
        responseTimestamp
      },
      error: null
    };
  } catch (error) {
    console.error('Error generating writing style feedback:', error);
    return {
      data: null,
      error
    };
  }
};

/**
 * Analyze user's reading patterns from their books
 * @param {array} books - User's books
 * @returns {object} Analysis object
 */
const analyzeReadingPatterns = (books) => {
  if (!books || books.length === 0) {
    return {
      totalBooks: 0,
      averageRating: 0,
      favoriteGenres: [],
      favoriteAuthors: [],
      highlyRatedBooks: [],
      readingThemes: []
    };
  }

  // Filter out wishlist books and only keep 4+ star books
  // Note: Books passed here should already be filtered, but we ensure it here too
  const eligibleBooks = books.filter(b => b.rating >= 4);

  // Calculate average rating from eligible books
  const averageRating = eligibleBooks.length > 0
    ? eligibleBooks.reduce((sum, b) => sum + b.rating, 0) / eligibleBooks.length
    : 0;

  // Find favorite genres (from highly rated books)
  const highlyRated = eligibleBooks;
  const genreCounts = {};
  highlyRated.forEach(book => {
    if (book.genre) {
      genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
    }
  });
  const favoriteGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // Find favorite authors
  const authorCounts = {};
  highlyRated.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });
  const favoriteAuthors = Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author]) => author);

  // Extract themes from highly rated books
  const readingThemes = extractThemes(highlyRated);

  return {
    totalBooks: eligibleBooks.length,
    averageRating: averageRating.toFixed(1),
    favoriteGenres,
    favoriteAuthors,
    highlyRatedBooks: highlyRated.slice(0, 10).map(b => ({
      title: b.title,
      author: b.author,
      genre: b.genre,
      rating: b.rating,
      review: b.review || '',
      favoriteCharacter: b.favoriteCharacter || '',
      sceneSummary: b.sceneSummary || '',
      memorableMoments: b.memorableMoments || ''
    })),
    readingThemes
  };
};

/**
 * Extract themes from books (simplified - can be enhanced with AI)
 * @param {array} books - Books to analyze
 * @returns {array} Array of themes
 */
const extractThemes = (books) => {
  const themes = [];
  books.forEach(book => {
    if (book.memorableMoments) {
      // Simple keyword extraction (can be enhanced with AI)
      const keywords = ['adventure', 'friendship', 'love', 'mystery', 'courage', 'family', 'growth'];
      keywords.forEach(keyword => {
        if (book.memorableMoments.toLowerCase().includes(keyword) && !themes.includes(keyword)) {
          themes.push(keyword);
        }
      });
    }
  });
  return themes.slice(0, 5);
};

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 200) => {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength - 3) + '...';
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
const estimateTokens = (text) => {
  if (!text) return 0;
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
};

/**
 * Estimate cost for OpenAI API call (gpt-4o-mini pricing)
 * @param {number} inputTokens - Estimated input tokens
 * @param {number} outputTokens - Estimated output tokens (default 1500)
 * @returns {object} Cost estimate in USD
 */
export const estimateAICost = (inputTokens, outputTokens = 1500) => {
  // gpt-4o-mini pricing (as of 2024): $0.15 per 1M input tokens, $0.60 per 1M output tokens
  const inputCostPerMillion = 0.15;
  const outputCostPerMillion = 0.60;
  
  const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion;
  const totalCost = inputCost + outputCost;
  
  return {
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost,
    formatted: totalCost < 0.001 ? '< $0.001' : `$${totalCost.toFixed(4)}`
  };
};

/**
 * Build prompt for AI recommendation with token limits
 * @param {object} analysis - Reading pattern analysis
 * @param {object} userProfile - User profile
 * @returns {object} { prompt: string, tokenEstimate: number, costEstimate: object }
 */
const buildRecommendationPrompt = (analysis, userProfile) => {
  const { favoriteGenres, favoriteAuthors, highlyRatedBooks, readingThemes, averageRating } = analysis;
  
  const MAX_PROMPT_TOKENS = 1000; // Limit to ~1,000 tokens
  const MAX_FIELD_CHARS = 200; // Truncate fields to 200 characters
  
  let prompt = `You are a book recommendation expert. Based on the following reading history, suggest 10 personalized book recommendations.\n\n`;
  
  prompt += `User's Reading Profile:\n`;
  prompt += `- Total books read: ${analysis.totalBooks}\n`;
  prompt += `- Average rating: ${averageRating}/5\n`;
  
  // Include age group if available for age-appropriate recommendations
  if (userProfile && userProfile.age_group && userProfile.age_group.trim()) {
    prompt += `- Age group: ${userProfile.age_group}\n`;
    prompt += `Please consider age-appropriate content and reading level when making recommendations.\n`;
  }
  
  if (favoriteGenres.length > 0) {
    prompt += `- Favorite genres: ${favoriteGenres.join(', ')}\n`;
  }
  
  if (favoriteAuthors.length > 0) {
    prompt += `- Favorite authors: ${favoriteAuthors.join(', ')}\n`;
  }
  
  if (readingThemes.length > 0) {
    prompt += `- Reading themes: ${readingThemes.join(', ')}\n`;
  }
  
  // Build books section with truncation
  let booksSection = '';
  if (highlyRatedBooks.length > 0) {
    booksSection = `\nHighly Rated Books (${highlyRatedBooks.length}):\n`;
    
    for (const book of highlyRatedBooks) {
      let bookEntry = `- "${book.title}" by ${book.author}${book.genre ? ` (${book.genre})` : ''} - Rated ${book.rating}/5`;
      
      // Include review if available (truncated to 200 chars)
      if (book.review && book.review.trim()) {
        const truncatedReview = truncateText(book.review, MAX_FIELD_CHARS);
        bookEntry += `\n  Review: "${truncatedReview}"`;
      }
      
      // Include favorite character if available (truncated to 200 chars)
      if (book.favoriteCharacter && book.favoriteCharacter.trim()) {
        const truncatedCharacter = truncateText(book.favoriteCharacter, MAX_FIELD_CHARS);
        bookEntry += `\n  Favorite Character: ${truncatedCharacter}`;
      }
      
      bookEntry += `\n`;
      
      // Check if adding this book would exceed token limit
      const currentPrompt = prompt + booksSection + bookEntry;
      const currentTokens = estimateTokens(currentPrompt);
      
      if (currentTokens > MAX_PROMPT_TOKENS) {
        // Stop adding books if we'd exceed the limit
        break;
      }
      
      booksSection += bookEntry;
    }
    
    prompt += booksSection;
  }
  
  // Include user's bio if available (truncated to 200 chars)
  if (userProfile && userProfile.bio && userProfile.bio.trim()) {
    const truncatedBio = truncateText(userProfile.bio, MAX_FIELD_CHARS);
    const bioSection = `\nUser's Bio:\n${truncatedBio}\n\nUse this information about the user's interests, personality, and preferences to provide more personalized recommendations.\n`;
    
    // Check if adding bio would exceed token limit
    const currentTokens = estimateTokens(prompt + bioSection);
    if (currentTokens <= MAX_PROMPT_TOKENS) {
      prompt += bioSection;
    }
  }
  
  prompt += `\nRequirements:\n`;
  prompt += `- Suggest 10 book recommendations\n`;
  prompt += `- Books should be age-appropriate for teens (13-18 years)\n`;
  prompt += `- Include diverse genres and authors\n`;
  prompt += `- Provide a brief reason for each recommendation\n`;
  prompt += `- Format as JSON array with: title, author, reason\n`;
  prompt += `- Do not suggest books already in their library\n`;
  
  const tokenEstimate = estimateTokens(prompt);
  const costEstimate = estimateAICost(tokenEstimate);
  
  return {
    prompt,
    tokenEstimate,
    costEstimate
  };
};

/**
 * Call AI API for recommendations
 * @param {string} prompt - The recommendation prompt
 * @param {array} userBooks - User's existing books (for fallback filtering)
 * @returns {Promise<array>} Array of recommendations
 */
const callAIRecommendationAPI = async (prompt, userBooks = [], apiKeyExists = false, estimates = null) => {
  // Note: API key is stored server-side only (in Vercel env vars as OPENAI_API_KEY)
  // Frontend doesn't have access to the key for security reasons
  // The serverless function (/api/openai.js) handles the API key

  try {
    // Priority order: 1) Vercel API route (production), 2) Local proxy server (development), 3) Supabase Edge Function, 4) Direct call (will fail CORS)
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    const vercelApiUrl = isProduction ? '/api/openai' : null;
    const devServerUrl = 'http://localhost:3001/api/openai';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let response = null;
    let lastError = null;
    
    // Priority 1: Try Vercel API route (production) or local proxy server (development)
    try {
      const apiUrl = vercelApiUrl || devServerUrl;
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      // If we got a response, use it (even if it's an error response)
      if (response !== null) {
        // Continue with this response
      }
    } catch (e) {
      // Local server not running or network error
      lastError = e;
      response = null;
    }
    
    // Priority 2: Try Supabase Edge Function (only if local server failed)
    if (!response && supabaseUrl) {
      try {
        const { supabase } = await import('../config/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('User not authenticated');
        }
        
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/openai-proxy`;
        response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 1500
          })
        });
        
        // If Edge Function returns CORS error or network error, it doesn't exist or isn't configured
        if (!response || response.status === 0) {
          throw new Error('Edge Function not deployed or CORS not configured');
        }
      } catch (e) {
        lastError = e;
        console.warn('Edge Function not available:', e.message);
        response = null;
      }
    }
    
    // Priority 3: Fallback to direct call (will fail with CORS in browser)
    // Only try this if we have no other options
    if (!response && apiKey && apiKey.trim()) {
      console.warn('Attempting direct API call (will likely fail due to CORS)...');
      const trimmedApiKey = apiKey.trim();
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful book recommendation assistant. Always respond with valid JSON only.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });
      } catch (e) {
        // CORS error expected here
        lastError = e;
        response = null;
      }
    }
    
    // If all methods failed, throw helpful error
    if (!response) {
      if (lastError?.message?.includes('CORS') || lastError?.message?.includes('Failed to fetch')) {
        throw new Error('CORS error: Please make sure the proxy server is running. Run "npm run dev:server" in a separate terminal. See docs/CORS_FIX_QUICK_START.md for help.');
      }
      throw lastError || new Error('No API proxy available. Please start the proxy server with "npm run dev:server"');
    }

    if (!response.ok) {
      // Get detailed error message from response
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = `OpenAI API error: ${errorData.error.message}`;
        } else if (errorData.error) {
          errorMessage = `OpenAI API error: ${JSON.stringify(errorData.error)}`;
        }
      } catch (e) {
        // If we can't parse error, use status text
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Store raw response for database
    const rawResponse = JSON.stringify(data);
    
    // Parse JSON response
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Ensure it's an array
    if (!Array.isArray(recommendations)) {
      recommendations = [recommendations];
    }

    // Calculate scores for AI recommendations based on prompt analysis
    const genreMatch = prompt.match(/Favorite genres: ([^\n]+)/);
    const authorMatch = prompt.match(/Favorite authors: ([^\n]+)/);
    const favoriteGenres = genreMatch ? genreMatch[1].split(',').map(g => g.trim().toLowerCase()) : [];
    const favoriteAuthors = authorMatch ? authorMatch[1].split(',').map(a => a.trim().toLowerCase()) : [];
    
    // Score AI recommendations (they get higher base score since they're AI-generated)
    const scoredRecommendations = recommendations.slice(0, 10).map((rec, index) => {
      let score = 85; // Base score for AI recommendations (high confidence)
      
      // Boost score based on position (first recommendations are more relevant)
      score += (10 - index) * 1.5;
      
      // Check if reason mentions favorite genres/authors
      const reasonLower = (rec.reason || '').toLowerCase();
      favoriteGenres.forEach(genre => {
        if (reasonLower.includes(genre)) {
          score += 5;
        }
      });
      favoriteAuthors.forEach(author => {
        if (reasonLower.includes(author)) {
          score += 5;
        }
      });
      
      // Cap at 100
      score = Math.min(100, Math.round(score));
      
      return {
        ...rec,
        score,
        isAI: true
      };
    });
    
    // Return both recommendations and raw response
    return {
      recommendations: scoredRecommendations,
      rawResponse: rawResponse
    };
  } catch (error) {
    console.error('Error calling AI API:', error);
    // Fallback to rule-based recommendations
    const fallbackRecs = generateFallbackRecommendations(prompt, userBooks);
    return {
      recommendations: fallbackRecs,
      rawResponse: null // No raw response for fallback
    };
  }
};

/**
 * Generate fallback recommendations when AI is unavailable
 * Uses the BOOK_RECOMMENDATIONS list and matches based on user preferences
 * @param {string} prompt - The prompt (for context)
 * @param {array} userBooks - User's existing books to filter out
 * @returns {array} Array of recommendations
 */
const generateFallbackRecommendations = (prompt, userBooks = []) => {
  // Extract genres and authors from prompt
  const genreMatch = prompt.match(/Favorite genres: ([^\n]+)/);
  const authorMatch = prompt.match(/Favorite authors: ([^\n]+)/);
  
  const favoriteGenres = genreMatch ? genreMatch[1].split(',').map(g => g.trim()) : [];
  const favoriteAuthors = authorMatch ? authorMatch[1].split(',').map(a => a.trim()) : [];

  // Get user's existing book titles (case-insensitive) to filter them out
  const userBookTitles = new Set(
    userBooks.map(book => `${book.title?.toLowerCase() || ''}|${book.author?.toLowerCase() || ''}`)
  );

  // Filter out books user already has
  let availableBooks = BOOK_RECOMMENDATIONS.filter(book => {
    const bookKey = `${book.title?.toLowerCase() || ''}|${book.author?.toLowerCase() || ''}`;
    return !userBookTitles.has(bookKey);
  });

  // If we have favorite genres, prioritize books in those genres
  if (favoriteGenres.length > 0) {
    // Normalize genre matching (case-insensitive, partial matches)
    const normalizedFavoriteGenres = favoriteGenres.map(g => g.toLowerCase());
    
    // Score books based on genre match
    const scoredBooks = availableBooks.map(book => {
      let score = 0;
      const bookGenre = (book.genre || '').toLowerCase();
      
      // Check for exact or partial genre match
      normalizedFavoriteGenres.forEach(favGenre => {
        if (bookGenre.includes(favGenre) || favGenre.includes(bookGenre)) {
          score += 10; // High score for genre match
        }
      });
      
      // Bonus for author match
      const bookAuthor = (book.author || '').toLowerCase();
      favoriteAuthors.forEach(favAuthor => {
        if (bookAuthor.includes(favAuthor.toLowerCase()) || favAuthor.toLowerCase().includes(bookAuthor)) {
          score += 5; // Bonus for author match
        }
      });
      
      return { ...book, score };
    });
    
    // Sort by score (highest first) and take top 10
    const topMatches = scoredBooks
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    // If we have good matches (score > 0), return them
    if (topMatches.length > 0 && topMatches[0].score > 0) {
      return topMatches.map(({ score, ...book }) => ({
        title: book.title,
        author: book.author,
        reason: book.reason || `Based on your interest in ${favoriteGenres.join(' and ')} genres.`,
        score: Math.min(100, Math.round(score)), // Normalize to 0-100
        isAI: false
      }));
    }
  }
  
  // If we have favorite authors but no genre matches, prioritize those authors
  if (favoriteAuthors.length > 0) {
    const authorMatches = availableBooks.filter(book => {
      const bookAuthor = (book.author || '').toLowerCase();
      return favoriteAuthors.some(favAuthor => 
        bookAuthor.includes(favAuthor.toLowerCase()) || 
        favAuthor.toLowerCase().includes(bookAuthor)
      );
    }).slice(0, 5);
    
    if (authorMatches.length > 0) {
      // Fill remaining slots with diverse recommendations
      const remaining = availableBooks
        .filter(book => !authorMatches.some(m => m.title === book.title))
        .slice(0, 5);
      
      return [...authorMatches, ...remaining].slice(0, 10).map((book, index) => ({
        title: book.title,
        author: book.author,
        reason: book.reason || `Recommended based on your reading preferences.`,
        score: Math.min(100, Math.round(60 + (index < authorMatches.length ? 20 : 0))), // Author matches get higher score
        isAI: false
      }));
    }
  }

  // Fallback: return diverse recommendations from the list
  // Shuffle and take 10 random books for variety
  const shuffled = [...availableBooks].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10).map((book, index) => ({
    title: book.title,
    author: book.author,
    reason: book.reason || `A popular book that many readers enjoy!`,
    score: Math.min(100, Math.round(50 + Math.random() * 20)), // Random score between 50-70 for general recommendations
    isAI: false
  }));
};

/**
 * Parse writing feedback response to extract structured data
 * @param {string} feedback - Raw feedback text from AI
 * @returns {object} Parsed data with grade level, strengths, improvements, etc.
 */
function parseWritingFeedbackResponse(feedback) {
  const parsed = {
    readingGradeLevel: null,
    overallAssessment: null,
    strengths: [],
    improvements: [],
    specificSuggestions: [],
    tips: []
  };

  if (!feedback) return parsed;

  // Extract grade level - look for patterns like "8th grade", "9th grade", "college level", etc.
  const gradeLevelPatterns = [
    /(?:grade level|reading level|writing level)[:\s]+([^\n]+)/i,
    /(?:estimated|assessed|evaluated)[:\s]+([^\n]+(?:grade|level))/i,
    /(\d+(?:st|nd|rd|th)?\s+grade)/i,
    /(college|high school|middle school|elementary)\s+level/i
  ];
  
  for (const pattern of gradeLevelPatterns) {
    const match = feedback.match(pattern);
    if (match) {
      parsed.readingGradeLevel = match[1].trim();
      break;
    }
  }

  // Extract overall assessment (usually at the end or in a specific section)
  const assessmentPatterns = [
    /(?:overall assessment|overall|summary|conclusion)[:\s]+([^\n]+(?:\n[^\n]+){0,3})/i,
    /(?:in summary|to conclude|overall)[:\s]+([^\n]+(?:\n[^\n]+){0,2})/i
  ];
  
  for (const pattern of assessmentPatterns) {
    const match = feedback.match(pattern);
    if (match) {
      parsed.overallAssessment = match[1].trim().substring(0, 500); // Limit length
      break;
    }
  }

  // Try to extract JSON arrays first (common in AI responses)
  const jsonPatterns = {
    improvements: /(?:Areas?\s+for\s+)?Improvement[:\s]*\[([^\]]+)\]/i,
    suggestions: /(?:Specific\s+)?Suggestions?[:\s]*\[([^\]]+)\]/i,
    tips: /(?:Writing\s+)?Tips?\s+(?:for\s+Better\s+Reviews?)?[:\s]*\[([^\]]+)\]/i,
    strengths: /(?:Writing\s+)?Strengths?[:\s]*\[([^\]]+)\]/i
  };

  // Extract JSON arrays
  for (const [key, pattern] of Object.entries(jsonPatterns)) {
    const match = feedback.match(pattern);
    if (match) {
      try {
        // Try to parse as JSON array
        const jsonStr = '[' + match[1] + ']';
        const parsedArray = JSON.parse(jsonStr);
        if (Array.isArray(parsedArray)) {
          const fieldName = key === 'suggestions' ? 'specificSuggestions' : key;
          parsed[fieldName] = parsedArray
            .map(item => typeof item === 'string' ? item.trim() : String(item))
            .filter(item => item.length > 0)
            .slice(0, 10);
          continue; // Skip text-based extraction if JSON worked
        }
      } catch (e) {
        // If JSON parsing fails, try comma-separated extraction
        const items = match[1]
          .split(',')
          .map(item => item.replace(/^["']|["']$/g, '').trim())
          .filter(item => item.length > 0)
          .slice(0, 10);
        if (items.length > 0) {
          const fieldName = key === 'suggestions' ? 'specificSuggestions' : key;
          parsed[fieldName] = items;
          continue; // Skip text-based extraction if comma-separated worked
        }
      }
    }
  }

  // Extract strengths - look for bullet points or numbered lists
  if (parsed.strengths.length === 0) {
    const strengthsSection = feedback.match(/(?:strengths?|strength)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/i);
    if (strengthsSection) {
      parsed.strengths = strengthsSection[1]
        .split(/\n/)
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10); // Limit to 10 items
    }
  }

  // Extract improvements
  if (parsed.improvements.length === 0) {
    const improvementsSection = feedback.match(/(?:improvement|areas?\s+for\s+improvement|areas?\s+to\s+improve|weaknesses?)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/i);
    if (improvementsSection) {
      parsed.improvements = improvementsSection[1]
        .split(/\n/)
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10);
    }
  }

  // Extract specific suggestions
  if (parsed.specificSuggestions.length === 0) {
    const suggestionsSection = feedback.match(/(?:suggestions?|specific\s+suggestions?|recommendations?)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/i);
    if (suggestionsSection) {
      parsed.specificSuggestions = suggestionsSection[1]
        .split(/\n/)
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10);
    }
  }

  // Extract tips
  if (parsed.tips.length === 0) {
    const tipsSection = feedback.match(/(?:tips?|writing\s+tips?|tips?\s+for\s+better\s+reviews?)[:\s]*\n((?:[-•*]\s*[^\n]+\n?)+)/i);
    if (tipsSection) {
      parsed.tips = tipsSection[1]
        .split(/\n/)
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 10);
    }
  }

  return parsed;
}

