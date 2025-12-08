/**
 * AI Recommendation Rate Limiting Service
 * 
 * Prevents abuse of AI recommendation feature by:
 * - Limiting requests per user per time period
 * - Caching recommendations to avoid duplicate API calls
 * - Tracking usage in localStorage (client-side) and optionally in database
 */

const RATE_LIMIT_CONFIG = {
  // Maximum requests per hour per user
  MAX_REQUESTS_PER_HOUR: 2,
  // Maximum requests per day per user
  MAX_REQUESTS_PER_DAY: 5,
  // Cache duration in milliseconds (1 hour)
  CACHE_DURATION: 60 * 60 * 1000,
  // Minimum time between requests in milliseconds (5 minutes)
  MIN_TIME_BETWEEN_REQUESTS: 5 * 60 * 1000
};

/**
 * Get rate limit key for a user
 * @param {string} userId - User ID
 * @returns {string} Storage key
 */
const getRateLimitKey = (userId) => `ai_recommendations_rate_limit_${userId}`;
const getCacheKey = (userId) => `ai_recommendations_cache_${userId}`;
const getLastRequestKey = (userId) => `ai_recommendations_last_request_${userId}`;

/**
 * Check if user can make a request (rate limiting)
 * @param {string} userId - User ID
 * @returns {Promise<{allowed: boolean, reason: string|null, retryAfter: number|null}>}
 */
export const checkRateLimit = async (userId) => {
  try {
    const key = getRateLimitKey(userId);
    const lastRequestKey = getLastRequestKey(userId);
    
    // Get rate limit data from localStorage
    const rateLimitData = JSON.parse(localStorage.getItem(key) || '{"requests": [], "dailyCount": 0, "lastReset": null}');
    const lastRequestTime = parseInt(localStorage.getItem(lastRequestKey) || '0');
    
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Reset daily count if it's a new day
    if (!rateLimitData.lastReset || now - rateLimitData.lastReset > 24 * 60 * 60 * 1000) {
      rateLimitData.dailyCount = 0;
      rateLimitData.lastReset = now;
    }
    
    // Check minimum time between requests
    if (lastRequestTime > 0 && now - lastRequestTime < RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_REQUESTS) {
      const retryAfter = Math.ceil((RATE_LIMIT_CONFIG.MIN_TIME_BETWEEN_REQUESTS - (now - lastRequestTime)) / 1000);
      return {
        allowed: false,
        reason: `Please wait ${Math.ceil(retryAfter / 60)} minute(s) before requesting again.`,
        retryAfter
      };
    }
    
    // Filter requests from last hour
    const recentRequests = rateLimitData.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Check hourly limit
    if (recentRequests.length >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR) {
      const oldestRequest = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestRequest + 60 * 60 * 1000 - now) / 1000);
      return {
        allowed: false,
        reason: `Hourly limit reached (${RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR} requests/hour). Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        retryAfter
      };
    }
    
    // Check daily limit
    if (rateLimitData.dailyCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Daily limit reached (${RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY} requests/day). Please try again tomorrow.`,
        retryAfter: null
      };
    }
    
    return { allowed: true, reason: null, retryAfter: null };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request but log it
    return { allowed: true, reason: null, retryAfter: null };
  }
};

/**
 * Record a request (update rate limit tracking)
 * @param {string} userId - User ID
 */
export const recordRequest = (userId) => {
  try {
    const key = getRateLimitKey(userId);
    const lastRequestKey = getLastRequestKey(userId);
    
    const rateLimitData = JSON.parse(localStorage.getItem(key) || '{"requests": [], "dailyCount": 0, "lastReset": null}');
    const now = Date.now();
    
    // Reset daily count if it's a new day
    if (!rateLimitData.lastReset || now - rateLimitData.lastReset > 24 * 60 * 60 * 1000) {
      rateLimitData.dailyCount = 0;
      rateLimitData.lastReset = now;
    }
    
    // Add current request timestamp
    rateLimitData.requests.push(now);
    
    // Remove requests older than 1 hour
    const oneHourAgo = now - (60 * 60 * 1000);
    rateLimitData.requests = rateLimitData.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Increment daily count
    rateLimitData.dailyCount = (rateLimitData.dailyCount || 0) + 1;
    
    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(rateLimitData));
    localStorage.setItem(lastRequestKey, now.toString());
  } catch (error) {
    console.error('Error recording request:', error);
  }
};

/**
 * Get cached recommendations if available
 * @param {string} userId - User ID
 * @param {string} cacheKey - Additional cache key (e.g., based on user's books hash)
 * @returns {object|null} Cached recommendations or null
 */
export const getCachedRecommendations = (userId, cacheKey = 'default') => {
  try {
    const key = `${getCacheKey(userId)}_${cacheKey}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < RATE_LIMIT_CONFIG.CACHE_DURATION) {
      return data;
    }
    
    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error getting cached recommendations:', error);
    return null;
  }
};

/**
 * Cache recommendations
 * @param {string} userId - User ID
 * @param {string} cacheKey - Additional cache key
 * @param {array} recommendations - Recommendations to cache
 */
export const cacheRecommendations = (userId, cacheKey = 'default', recommendations) => {
  try {
    const key = `${getCacheKey(userId)}_${cacheKey}`;
    const cacheData = {
      data: recommendations,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching recommendations:', error);
  }
};

/**
 * Get rate limit status for display
 * @param {string} userId - User ID
 * @returns {object} Rate limit status
 */
export const getRateLimitStatus = (userId) => {
  try {
    const key = getRateLimitKey(userId);
    const rateLimitData = JSON.parse(localStorage.getItem(key) || '{"requests": [], "dailyCount": 0, "lastReset": null}');
    
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentRequests = rateLimitData.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Reset daily count if it's a new day
    if (!rateLimitData.lastReset || now - rateLimitData.lastReset > 24 * 60 * 60 * 1000) {
      rateLimitData.dailyCount = 0;
    }
    
    return {
      hourlyUsed: recentRequests.length,
      hourlyLimit: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR,
      dailyUsed: rateLimitData.dailyCount || 0,
      dailyLimit: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY,
      canRequest: recentRequests.length < RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR && 
                  (rateLimitData.dailyCount || 0) < RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      hourlyUsed: 0,
      hourlyLimit: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_HOUR,
      dailyUsed: 0,
      dailyLimit: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_DAY,
      canRequest: true
    };
  }
};

/**
 * Generate a simple hash of user's books for cache key
 * @param {array} books - User's books
 * @returns {string} Hash string
 */
export const generateBooksHash = (books) => {
  if (!books || books.length === 0) return 'empty';
  
  // Create a simple hash based on book IDs and ratings
  const hashData = books
    .map(b => `${b.id}_${b.rating || 0}`)
    .sort()
    .join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

