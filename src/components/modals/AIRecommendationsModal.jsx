import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, Loader, AlertCircle, Play, BookOpen, Star, TrendingUp, Clock, Shield, History, Check, Plus, Info, Copy, FileText } from 'lucide-react';
import { generateAIRecommendations, estimateAICost } from '../../services/aiRecommendationService';
import { getRateLimitStatus } from '../../services/aiRecommendationRateLimit';
import { getAIRecommendationHistory } from '../../services/aiRecommendationTrackingService';
import { getPlaceholderImage } from '../../utils/imageHelpers';

/**
 * AI Recommendations Modal Component
 * Displays AI-generated personalized book recommendations
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} userBooks - User's books with ratings
 * @param {object} userProfile - User profile data (should include id)
 * @param {object} currentUser - Current user object
 * @param {function} onClose - Callback to close the modal
 * @param {function} onAddToWishlist - Callback to add a recommendation to wishlist
 * @param {function} onIgnore - Callback to ignore a recommendation
 * @param {array} ignoredSuggestions - Array of ignored suggestion keys (format: "title|author")
 */
export default function AIRecommendationsModal({
  show,
  userBooks,
  bookshelves = [],
  userProfile,
  currentUser,
  onClose,
  onAddToWishlist,
  onIgnore,
  ignoredSuggestions = []
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showParameters, setShowParameters] = useState(false); // Changed to false - show book selection first
  const [showBookSelection, setShowBookSelection] = useState(true); // New: show book selection screen first
  const [selectedBooks, setSelectedBooks] = useState(new Set()); // Track selected books
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [availableBooks, setAvailableBooks] = useState([]); // All books with ratings
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [costEstimate, setCostEstimate] = useState(null);
  const [tokenEstimate, setTokenEstimate] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    if (show) {
      // Get wishlist bookshelf to identify wishlist books
      const wishlistShelf = bookshelves.find(shelf => shelf.type === 'wishlist');
      const wishlistBookIds = wishlistShelf ? new Set(wishlistShelf.books.map(b => b.id)) : new Set();
      
      // Filter: Only books with 4+ star rating AND not in wishlist
      const eligibleBooks = userBooks.filter(b => 
        b.rating >= 4 && !wishlistBookIds.has(b.id)
      );
      setAvailableBooks(eligibleBooks);
      
      // Initialize selected books - select all by default
      const initialSelected = new Set(eligibleBooks.map((book, idx) => idx));
      setSelectedBooks(initialSelected);
      
      setShowBookSelection(true);
      setShowParameters(false);
      setRecommendations([]);
      setError(null);
      setFromCache(false);
      
      // Get rate limit status if we have user ID
      const userId = userProfile?.id || currentUser?.id;
      if (userId) {
        const status = getRateLimitStatus(userId);
        setRateLimitStatus(status);
      }
    } else {
      // Reset state when modal closes
      setRecommendations([]);
      setError(null);
      setAnalysis(null);
      setShowBookSelection(true);
      setShowParameters(false);
      setSelectedBooks(new Set());
      setRateLimitStatus(null);
      setFromCache(false);
    }
  }, [show, userBooks, userProfile, bookshelves]);

  const buildPromptForDisplay = (readingAnalysis) => {
    const MAX_FIELD_CHARS = 200;
    const truncateText = (text, maxLength) => {
      if (!text || !text.trim()) return '';
      const trimmed = text.trim();
      if (trimmed.length <= maxLength) return trimmed;
      return trimmed.substring(0, maxLength - 3) + '...';
    };

    let prompt = `You are a book recommendation expert. Based on the following reading history, suggest 10 personalized book recommendations.\n\n`;
    prompt += `User's Reading Profile:\n`;
    prompt += `- Total books read: ${readingAnalysis.totalBooks}\n`;
    prompt += `- Average rating: ${readingAnalysis.averageRating}/5\n`;
    
    if (readingAnalysis.favoriteGenres.length > 0) {
      prompt += `- Favorite genres: ${readingAnalysis.favoriteGenres.join(', ')}\n`;
    }
    
    if (readingAnalysis.favoriteAuthors.length > 0) {
      prompt += `- Favorite authors: ${readingAnalysis.favoriteAuthors.join(', ')}\n`;
    }
    
    if (readingAnalysis.readingThemes && readingAnalysis.readingThemes.length > 0) {
      prompt += `- Reading themes: ${readingAnalysis.readingThemes.join(', ')}\n`;
    }
    
    if (readingAnalysis.highlyRatedBooks && readingAnalysis.highlyRatedBooks.length > 0) {
      prompt += `\nHighly Rated Books (${readingAnalysis.highlyRatedBooks.length}):\n`;
      readingAnalysis.highlyRatedBooks.slice(0, 10).forEach(book => {
        prompt += `- "${book.title}" by ${book.author}${book.genre ? ` (${book.genre})` : ''} - Rated ${book.rating}/5`;
        if (book.review && book.review.trim()) {
          prompt += `\n  Review: "${truncateText(book.review, MAX_FIELD_CHARS)}"`;
        }
        if (book.favoriteCharacter && book.favoriteCharacter.trim()) {
          prompt += `\n  Favorite Character: ${truncateText(book.favoriteCharacter, MAX_FIELD_CHARS)}`;
        }
        prompt += `\n`;
      });
    }
    
    if (userProfile?.bio && userProfile.bio.trim()) {
      prompt += `\nUser's Bio:\n${truncateText(userProfile.bio, MAX_FIELD_CHARS)}\n\nUse this information about the user's interests, personality, and preferences to provide more personalized recommendations.\n`;
    }
    
    prompt += `\nRequirements:\n`;
    prompt += `- Suggest 10 book recommendations\n`;
    prompt += `- Books should be age-appropriate for teens (13-18 years)\n`;
    prompt += `- Include diverse genres and authors\n`;
    prompt += `- Provide a brief reason for each recommendation\n`;
    prompt += `- Format as JSON array with: title, author, reason\n`;
    prompt += `- Do not suggest books already in their library\n`;
    
    return prompt;
  };

  const handleContinueToParameters = () => {
    // Get selected books based on indices
    const booksToAnalyze = availableBooks.filter((_, idx) => selectedBooks.has(idx));
    
    if (booksToAnalyze.length === 0) {
      setError('Please select at least one book to analyze');
      return;
    }
    
    // Analyze reading patterns with selected books (using the same function as the service)
    const readingAnalysis = analyzeUserReading(booksToAnalyze);
    setAnalysis(readingAnalysis);
    
    // Build the actual prompt that will be sent to AI
    const fullPrompt = buildPromptForDisplay(readingAnalysis);
    setPromptText(fullPrompt);
    
    // Calculate cost estimate by building the prompt (same logic as service)
    // Estimate tokens (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(fullPrompt.length / 4);
    const costEst = estimateAICost(estimatedTokens, 1500); // 1500 output tokens
    
    setTokenEstimate(estimatedTokens);
    setCostEstimate(costEst);
    
    setShowBookSelection(false);
    setShowParameters(true);
    setShowPrompt(false); // Reset prompt visibility
    setError(null);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      // Show temporary success message
      const copyButton = document.querySelector('[data-copy-prompt]');
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = '✓ Copied!';
        copyButton.classList.add('bg-green-600');
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('bg-green-600');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy prompt:', err);
      // Fallback: select text in textarea
      const textarea = document.querySelector('[data-prompt-textarea]');
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
      }
    }
  };

  const loadAIRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setShowParameters(false); // Hide parameters screen, show loading
    
    try {
      // Get user ID from userProfile or currentUser
      const userId = userProfile?.id || currentUser?.id || null;
      
      // Get selected books based on indices
      const booksToAnalyze = availableBooks.filter((_, idx) => selectedBooks.has(idx));
      
      // Check if force refresh is enabled via environment variable (for testing)
      const forceRefresh = import.meta.env.VITE_FORCE_AI_REFRESH === 'true' || import.meta.env.VITE_FORCE_AI_REFRESH === true;
      
      // Generate AI recommendations with rate limiting using selected books
      const { data, error: recError, fromCache: isFromCache, rateLimited, retryAfter } = await generateAIRecommendations(
        booksToAnalyze,
        userProfile,
        userId,
        forceRefresh // Use env variable to force refresh if needed
      );
      
      setFromCache(isFromCache);
      
      if (rateLimited) {
        setError(recError?.message || 'Rate limit exceeded. Please try again later.');
        if (retryAfter) {
          const minutes = Math.ceil(retryAfter / 60);
          setError(`Rate limit exceeded. Please wait ${minutes} minute(s) before trying again.`);
        }
        setShowParameters(true); // Go back to parameters screen
        setShowBookSelection(false);
        // Update rate limit status
        if (userId) {
          const status = getRateLimitStatus(userId);
          setRateLimitStatus(status);
        }
        return;
      }
      
      if (recError) {
        throw recError;
      }

      if (data && data.length > 0) {
        // Filter out ignored suggestions
        const filteredData = data.filter(rec => {
          const key = `${rec.title}|${rec.author || 'Unknown Author'}`;
          return !ignoredSuggestions.includes(key);
        });
        setRecommendations(filteredData);
        // Update rate limit status after successful request
        if (userId) {
          const status = getRateLimitStatus(userId);
          setRateLimitStatus(status);
        }
      } else {
        setError('No recommendations generated. Please try again.');
      }
    } catch (err) {
      console.error('Error loading AI recommendations:', err);
      setError(err.message || 'Failed to generate AI recommendations. Please check your API key or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeUserReading = (books) => {
    if (!books || books.length === 0) {
      return { totalBooks: 0, averageRating: 0, favoriteGenres: [], favoriteAuthors: [], highlyRatedBooks: [], readingThemes: [] };
    }

    // Books passed here are already filtered to 4+ stars and non-wishlist
    const eligibleBooks = books.filter(b => b.rating >= 4);
    const averageRating = eligibleBooks.length > 0
      ? (eligibleBooks.reduce((sum, b) => sum + b.rating, 0) / eligibleBooks.length).toFixed(1)
      : 0;

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

    // Extract themes from memorable moments (simplified)
    const themes = [];
    const keywords = ['adventure', 'friendship', 'love', 'mystery', 'courage', 'family', 'growth'];
    highlyRated.forEach(book => {
      if (book.memorableMoments) {
        keywords.forEach(keyword => {
          if (book.memorableMoments.toLowerCase().includes(keyword) && !themes.includes(keyword)) {
            themes.push(keyword);
          }
        });
      }
    });
    const readingThemes = themes.slice(0, 5);

    const highlyRatedBooks = highlyRated
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map(b => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
        rating: b.rating,
        review: b.review || '',
        favoriteCharacter: b.favoriteCharacter || ''
      }));

    return { totalBooks: eligibleBooks.length, averageRating, favoriteGenres, favoriteAuthors, highlyRatedBooks, readingThemes };
  };

  // Check if user is default user
  const isDefaultUser = currentUser?.username === 'Default User' || userProfile?.username === 'Default User';

  if (!show) {
    return null;
  }

  // If default user, show message instead of modal
  if (isDefaultUser) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">
              AI-powered recommendations require a user account to track usage and prevent abuse.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please log in to access this feature.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {showHistory ? 'Past Recommendations' : 'AI-Powered Recommendations'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && (
              <button
                onClick={async () => {
                  setShowHistory(true);
                  setLoadingHistory(true);
                  const userId = userProfile?.id || currentUser?.id;
                  if (userId) {
                    const { data } = await getAIRecommendationHistory(userId, 20);
                    setHistory(data || []);
                  }
                  setLoadingHistory(false);
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
                title="View past recommendations"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            )}
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                title="Go back to recommendations"
              >
                Back
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close modal">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showHistory ? (
            <div>
              {loadingHistory ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading your recommendation history... 📚</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">No past recommendations yet! 🎯</p>
                  <p className="text-sm text-gray-600">Generate your first AI recommendations to see them here! Once you create some, you can come back and view them anytime! ✨</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                            {record.from_cache && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Cached
                              </span>
                            )}
                            {record.api_key_used && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                Paid API
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {record.total_books > 0 && <span>📚 {record.total_books} books analyzed</span>}
                            {record.average_rating && <span> • ⭐ {record.average_rating}/5 avg</span>}
                            {record.favorite_genres?.length > 0 && (
                              <span> • 📖 {record.favorite_genres.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        {record.estimated_cost && (
                          <span className="text-xs text-gray-500">
                            ${parseFloat(record.estimated_cost).toFixed(4)}
                          </span>
                        )}
                      </div>
                      
                      {record.recommendations && record.recommendations.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {record.recommendations.slice(0, 4).map((rec, idx) => (
                            <div key={idx} className="bg-white rounded p-2 border border-gray-100">
                              <p className="text-xs font-semibold text-gray-900 line-clamp-1">{rec.title}</p>
                              {rec.author && <p className="text-xs text-gray-600">by {rec.author}</p>}
                            </div>
                          ))}
                          {record.recommendations.length > 4 && (
                            <div className="bg-white rounded p-2 border border-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                +{record.recommendations.length - 4} more
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          if (record.recommendations && record.recommendations.length > 0) {
                            setRecommendations(record.recommendations);
                            setShowHistory(false);
                            setShowParameters(false);
                          }
                        }}
                        className="mt-3 w-full py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        View These Recommendations
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : showBookSelection ? (
            <div className="space-y-6">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Books used for AI Recommendations</h3>
                <p className="text-gray-600">Choose which books from your bookshelf should be used for AI recommendations.</p>
              </div>

              {availableBooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No Eligible Books Found</p>
                  <p className="text-sm text-gray-500">Please rate some books with 4 or 5 stars (and ensure they're not in your wishlist) to get personalized AI recommendations.</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedBooks.size} of {availableBooks.length} books selected
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Selected books will be analyzed to generate personalized recommendations
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const allSelected = new Set(availableBooks.map((_, idx) => idx));
                            setSelectedBooks(allSelected);
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedBooks(new Set())}
                          className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
                    {availableBooks.map((book, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedBooks.has(idx)
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          const newSelected = new Set(selectedBooks);
                          if (newSelected.has(idx)) {
                            newSelected.delete(idx);
                          } else {
                            newSelected.add(idx);
                          }
                          setSelectedBooks(newSelected);
                        }}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedBooks.has(idx)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedBooks.has(idx) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <img
                          src={getPlaceholderImage(book.title)}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            e.target.src = getPlaceholderImage(book.title);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{book.title}</h4>
                          {book.author && (
                            <p className="text-xs text-gray-600 line-clamp-1">by {book.author}</p>
                          )}
                          {book.genre && (
                            <p className="text-xs text-gray-500 mt-1">{book.genre}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-semibold text-sm">{book.rating}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fun warning note about filtering - moved to bottom after books list */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-900 mb-1">✨ Did you know?</p>
                        <p className="text-xs text-purple-800">
                          We only show your <strong>4 and 5 star favorites</strong> here (and skip wishlist books) because we want to learn what you <em>loved</em> reading! This helps our AI suggest books that'll make you go "wow, this is perfect for me!" 🎯
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleContinueToParameters}
                      disabled={selectedBooks.size === 0}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review & Generate
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : showParameters && !isLoading && recommendations.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Recommendations</h3>
                <p className="text-gray-600">Review the parameters that will be sent to AI, then generate personalized recommendations.</p>
              </div>

              {analysis && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Your Reading Profile (Parameters to be analyzed)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900">Selected Books</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{analysis.totalBooks}</p>
                      <p className="text-xs text-gray-500 mt-1">books for AI analysis</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">Average Rating</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{analysis.averageRating}/5</p>
                      <p className="text-xs text-gray-500 mt-1">across all rated books</p>
                    </div>

                    {analysis.favoriteGenres.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900">Favorite Genres</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {analysis.favoriteGenres.map((genre, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {genre}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">from your highly rated books</p>
                      </div>
                    )}

                    {analysis.favoriteAuthors.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-gray-900">Favorite Authors</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {analysis.favoriteAuthors.map((author, idx) => (
                            <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                              {author}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">authors you've rated highly</p>
                      </div>
                    )}
                  </div>

                  {analysis.highlyRatedBooks && analysis.highlyRatedBooks.length > 0 && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                      <h5 className="font-semibold text-gray-900 mb-3">Highly Rated Books (Top {Math.min(analysis.highlyRatedBooks.length, 5)})</h5>
                      <div className="space-y-2">
                        {analysis.highlyRatedBooks.slice(0, 5).map((book, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              <span className="font-medium">"{book.title}"</span> by {book.author}
                              {book.genre && <span className="text-gray-500"> ({book.genre})</span>}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                              <Star className="w-4 h-4 fill-current" />
                              {book.rating}/5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {userProfile?.bio && userProfile.bio.trim() && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-pink-600" />
                        <h5 className="font-semibold text-gray-900">Your Story (Bio)</h5>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed italic bg-pink-50 p-3 rounded border border-pink-100">
                        "{userProfile.bio}"
                      </p>
                      <p className="text-xs text-gray-500 mt-2">This helps AI understand your interests and preferences</p>
                    </div>
                  )}
                </div>
              )}

              {costEstimate && tokenEstimate && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Cost & Token Estimate
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-green-700 mb-1">Estimated Tokens</div>
                      <div className="text-2xl font-bold text-green-800">{tokenEstimate.toLocaleString()}</div>
                      <div className="text-xs text-green-600 mt-1">Input tokens (prompt)</div>
                    </div>
                    <div>
                      <div className="text-xs text-green-700 mb-1">Estimated Cost</div>
                      <div className="text-2xl font-bold text-green-800">{costEstimate.formatted || `$${costEstimate.totalCost.toFixed(4)}`}</div>
                      <div className="text-xs text-green-600 mt-1">gpt-4o-mini pricing</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-700">
                      💡 Cost includes ~1,500 output tokens for AI response. Actual cost may vary slightly.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">📋 What will be analyzed:</h5>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Your reading history and patterns</li>
                  <li>Books you've rated highly (4+ stars)</li>
                  <li>Preferred genres and authors</li>
                  <li>Reading themes from your memorable moments</li>
                  <li>Your average rating preferences</li>
                  {userProfile?.bio && userProfile.bio.trim() && (
                    <li>Your bio and personal interests ✨</li>
                  )}
                </ul>
              </div>

              {/* Prompt Display */}
              {showPrompt && promptText && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">AI Prompt Text (Ready to Copy)</p>
                    <button
                      onClick={handleCopyPrompt}
                      data-copy-prompt
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      title="Copy prompt to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </button>
                  </div>
                  <textarea
                    data-prompt-textarea
                    readOnly
                    value={promptText}
                    className="w-full h-64 p-3 bg-white border border-gray-300 rounded-lg font-mono text-xs text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can copy this prompt and use it manually with OpenAI or any other AI service instead of calling our API.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowParameters(false);
                    setShowBookSelection(true);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  title="Go back to book selection"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                  title={showPrompt ? "Hide prompt text" : "Show prompt text to copy manually"}
                >
                  <FileText className="w-4 h-4" />
                  {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
                </button>
                <button
                  onClick={loadAIRecommendations}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center gap-2 shadow-lg"
                  title="Generate personalized AI recommendations based on your reading history"
                >
                  <Play className="w-5 h-5" />
                  Ask AI
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-700 font-medium mb-2">✨ Analyzing your reading patterns...</p>
              <p className="text-sm text-gray-600">Our AI is working its magic to find your perfect next reads! This might take a moment! 🎯</p>
              {analysis && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Your Reading Profile:</p>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>📚 {analysis.totalBooks} selected books</li>
                    <li>⭐ Average rating: {analysis.averageRating}/5</li>
                    {analysis.favoriteGenres.length > 0 && (
                      <li>📖 Favorite genres: {analysis.favoriteGenres.join(', ')}</li>
                    )}
                    {analysis.favoriteAuthors.length > 0 && (
                      <li>✍️ Favorite authors: {analysis.favoriteAuthors.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-semibold mb-2">Error Generating Recommendations</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto text-left">
                <p className="text-sm font-semibold text-yellow-900 mb-2">💡 Tip:</p>
                <p className="text-xs text-yellow-800">
                  For local development: Add your OpenAI API key to <code className="bg-yellow-100 px-1 rounded">.env</code> as <code className="bg-yellow-100 px-1 rounded">VITE_OPENAI_API_KEY</code>. For production: Add <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> in Vercel environment variables.
                </p>
                <p className="text-xs text-yellow-800 mt-2">
                  The system will use fallback recommendations if no API key is configured.
                </p>
              </div>
              <button
                onClick={loadAIRecommendations}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No recommendations available.</p>
              <p className="text-sm text-gray-500 mt-2">Try rating some books to get personalized recommendations!</p>
            </div>
          ) : (
            <>
              {fromCache && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Showing cached recommendations (generated within the last hour)</span>
                </div>
              )}
              
              {analysis && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900 mb-2">✨ Based on Your Reading Profile:</p>
                  <div className="flex flex-wrap gap-4 text-xs text-purple-700">
                    <span>📚 {analysis.totalBooks} selected</span>
                    <span>⭐ {analysis.averageRating}/5 avg rating</span>
                    {analysis.favoriteGenres.length > 0 && (
                      <span>📖 {analysis.favoriteGenres.join(', ')}</span>
                    )}
                    {analysis.favoriteAuthors.length > 0 && (
                      <span>✍️ {analysis.favoriteAuthors.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations
                  .filter(rec => {
                    // Filter out ignored suggestions (double-check in case they weren't filtered earlier)
                    const key = `${rec.title}|${rec.author || 'Unknown Author'}`;
                    return !ignoredSuggestions.includes(key);
                  })
                  .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score (highest first)
                  .map((rec, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={getPlaceholderImage(rec.title)}
                        alt={rec.title}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(rec.title);
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                            {rec.title}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {rec.isAI && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded" title="AI-Generated Recommendation">
                                AI
                              </span>
                            )}
                            {rec.score !== undefined && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-gray-700">{rec.score}</span>
                                <span className="text-xs text-gray-500">/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {rec.author && (
                          <p className="text-xs text-gray-600 mb-2">by {rec.author}</p>
                        )}
                        {rec.reason && (
                          <p className="text-xs text-gray-700 line-clamp-3 italic">
                            "{rec.reason}"
                          </p>
                        )}
                        {rec.score !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  rec.score >= 80 ? 'bg-green-500' :
                                  rec.score >= 60 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${rec.score}%` }}
                                title={`Relevance score: ${rec.score}/100`}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {rec.score >= 80 ? 'Highly relevant' :
                               rec.score >= 60 ? 'Moderately relevant' :
                               'Somewhat relevant'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (onAddToWishlist) {
                            onAddToWishlist({
                              title: rec.title,
                              author: rec.author || 'Unknown Author',
                              description: rec.reason || ''
                            });
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Heart className="w-4 h-4" />
                        Add
                      </button>
                      {onIgnore && (
                        <button
                          onClick={() => {
                            onIgnore(rec.title, rec.author || 'Unknown Author');
                            // Remove from local recommendations immediately
                            setRecommendations(recommendations.filter((r) => {
                              const rKey = `${r.title}|${r.author || 'Unknown Author'}`;
                              const recKey = `${rec.title}|${rec.author || 'Unknown Author'}`;
                              return rKey !== recKey;
                            }));
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          title="Ignore this recommendation - it won't appear in future recommendations"
                        >
                          Ignore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowParameters(true);
                    setRecommendations([]);
                    setShowBookSelection(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  title="Go back to view parameters"
                >
                  ← Back to Parameters
                </button>
                <button
                  onClick={loadAIRecommendations}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  title="Generate new AI recommendations"
                >
                  🔄 Generate New Recommendations
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

