import React, { useState, useEffect, useRef } from 'react';
import { X, PenTool, History, Copy, Sparkles, Clock, Check, AlertCircle, Award, Target, Lightbulb, TrendingDown, TrendingUp, MessageSquare, BookOpen, Star, Play, FileText } from 'lucide-react';
import { generateWritingStyleFeedback, estimateAICost } from '../../services/aiRecommendationService';
import { getWritingFeedbackHistory } from '../../services/writingFeedbackService';

/**
 * Writing Feedback Modal Component
 * Provides AI-powered writing style feedback based on book reviews
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} userBooks - User's books with reviews
 * @param {object} userProfile - User profile data
 * @param {object} currentUser - Current user object
 * @param {function} onClose - Callback to close the modal
 */
export default function WritingFeedbackModal({
  show,
  userBooks = [],
  userProfile,
  currentUser,
  onClose
}) {
  const [availableBooksWithReviews, setAvailableBooksWithReviews] = useState([]);
  const [selectedBooksForWriting, setSelectedBooksForWriting] = useState(new Set());
  const [writingFeedback, setWritingFeedback] = useState(null);
  const [writingFeedbackParsedData, setWritingFeedbackParsedData] = useState(null);
  const [showParameters, setShowParameters] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [writingPromptText, setWritingPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [tokenEstimate, setTokenEstimate] = useState(null);
  const [showWritingHistory, setShowWritingHistory] = useState(false);
  const [writingHistory, setWritingHistory] = useState([]);
  const [loadingWritingHistory, setLoadingWritingHistory] = useState(false);
  const [selectedFeedbackForComparison, setSelectedFeedbackForComparison] = useState([]);

  const prevShowRef = useRef(false);
  const userProfileRef = useRef(userProfile); // Store userProfile in ref to prevent re-renders

  useEffect(() => {
    const isFirstOpen = show && !prevShowRef.current;
    prevShowRef.current = show;

    if (show) {
      // IMPORTANT: Update ref immediately when modal opens to capture current userProfile
      // This ensures we have the latest userProfile with age_group before building prompts
      userProfileRef.current = userProfile;

      // Filter: Books with reviews - up to 10
      const booksWithReviews = userBooks
        .filter(b => b.review && b.review.trim().length > 0)
        .slice(0, 10);
      setAvailableBooksWithReviews(booksWithReviews);

      if (isFirstOpen) {
        // Initialize selected books - select all by default
        const initialSelectedWriting = new Set(booksWithReviews.map((book, idx) => idx));
        setSelectedBooksForWriting(initialSelectedWriting);
        setWritingFeedback(null);
        setWritingFeedbackParsedData(null);
        setShowParameters(false);
        setShowPrompt(false);
        setError(null);
        setShowWritingHistory(false);
      } else {
        // Modal is already open, just update the available books list
        if (selectedBooksForWriting.size === 0 && booksWithReviews.length > 0) {
          const initialSelectedWriting = new Set(booksWithReviews.map((book, idx) => idx));
          setSelectedBooksForWriting(initialSelectedWriting);
        }
      }
    } else {
      // Reset state when modal closes
      setWritingFeedback(null);
      setWritingFeedbackParsedData(null);
      setShowParameters(false);
      setShowPrompt(false);
      setError(null);
      setSelectedBooksForWriting(new Set());
      setShowWritingHistory(false);
      setSelectedFeedbackForComparison([]);
    }
  }, [show, userBooks]); // Removed userProfile from dependencies to prevent unnecessary re-renders

  /**
   * Parse and display writing feedback in a structured, readable format
   */
  const parseWritingFeedback = (feedback, parsedData = null) => {
    if (!feedback) return null;

    // If we have parsed data from DB, use it directly
    if (parsedData) {
      // Extract suggested reviews - handle both array format and single format
      let suggestedReviews = [];
      
      // Handle JSONB column - Supabase returns it as parsed JSON, but check if it's a string first
      let suggestedReviewsData = parsedData.suggested_reviews;
      if (typeof suggestedReviewsData === 'string') {
        try {
          suggestedReviewsData = JSON.parse(suggestedReviewsData);
        } catch (e) {
          console.warn('Failed to parse suggested_reviews as JSON:', e);
          suggestedReviewsData = null;
        }
      }
      
      if (Array.isArray(suggestedReviewsData) && suggestedReviewsData.length > 0) {
        suggestedReviews = suggestedReviewsData;
      } else if (parsedData.suggested_review) {
        // Fallback to single suggested review format
        suggestedReviews = [{
          bookTitle: parsedData.suggested_review_for_book_title || 'Unknown Book',
          bookAuthor: parsedData.suggested_review_for_book_author || 'Unknown Author',
          originalReview: parsedData.original_review_text || '',
          suggestedReview: parsedData.suggested_review
        }];
      }
      
      // Debug logging
      if (suggestedReviews.length > 0) {
        console.log('[WritingFeedbackModal] Found suggested reviews:', suggestedReviews.length);
      }
      
      const sections = {
        gradeLevel: parsedData.reading_grade_level || null,
        strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
        improvements: Array.isArray(parsedData.improvements) ? parsedData.improvements : [],
        suggestions: Array.isArray(parsedData.specific_suggestions) ? parsedData.specific_suggestions : [],
        tips: Array.isArray(parsedData.tips) ? parsedData.tips : [],
        overall: parsedData.overall_assessment || null,
        suggestedReviews: suggestedReviews
      };

      // If we have structured data, render it
      if (sections.gradeLevel || sections.strengths.length > 0 || 
          sections.improvements.length > 0 || sections.suggestions.length > 0 ||
          sections.suggestedReviews.length > 0) {
        return renderStructuredFeedback(sections);
      }
    }

    // Otherwise, try to parse from raw text
    const sections = {
      gradeLevel: null,
      strengths: [],
      improvements: [],
      suggestions: [],
      tips: [],
      overall: null
    };

    // Try to extract JSON arrays from the text (handle various formats)
    const jsonArrayPatterns = {
      improvements: [
        /(?:Areas?\s+for\s+)?Improvement[:\s]*\[([^\]]+)\]/i,
        /"Areas?\s+for\s+Improvement"[:\s]*\[([^\]]+)\]/i,
        /":\s*\[\s*"([^"]+)"(?:\s*,\s*"([^"]+)")*\]/i
      ],
      suggestions: [
        /(?:Specific\s+)?Suggestions?[:\s]*\[([^\]]+)\]/i,
        /"Specific\s+Suggestions?"[:\s]*\[([^\]]+)\]/i
      ],
      tips: [
        /(?:Writing\s+)?Tips?\s+(?:for\s+Better\s+Reviews?)?[:\s]*\[([^\]]+)\]/i,
        /"Writing\s+Tips?\s+for\s+Better\s+Reviews?"[:\s]*\[([^\]]+)\]/i
      ],
      strengths: [
        /(?:Writing\s+)?Strengths?[:\s]*\[([^\]]+)\]/i,
        /"Writing\s+Strengths?"[:\s]*\[([^\]]+)\]/i
      ]
    };

    // Extract JSON arrays
    for (const [key, patterns] of Object.entries(jsonArrayPatterns)) {
      for (const pattern of patterns) {
        const match = feedback.match(pattern);
        if (match) {
          try {
            // Try to parse as JSON array
            let jsonStr = match[1];
            // If it's already a JSON array format, try to extract it
            if (jsonStr.includes('"')) {
              // Extract quoted strings
              const quotedItems = jsonStr.match(/"([^"]+)"/g);
              if (quotedItems) {
                sections[key] = quotedItems
                  .map(item => item.replace(/^"|"$/g, '').trim())
                  .filter(item => item.length > 0);
                break; // Found valid data, move to next section
              }
            }
            
            // Try parsing as JSON array
            jsonStr = '[' + jsonStr + ']';
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) {
              sections[key] = parsed
                .map(item => typeof item === 'string' ? item.trim() : String(item))
                .filter(item => item.length > 0);
              break; // Found valid data, move to next section
            }
          } catch (e) {
            // If JSON parsing fails, try comma-separated extraction
            const items = match[1]
              .split(',')
              .map(item => item.replace(/^["']|["']$/g, '').trim())
              .filter(item => item.length > 0);
            if (items.length > 0) {
              sections[key] = items;
              break; // Found valid data, move to next section
            }
          }
        }
      }
    }

    // Also try text-based patterns
    const patterns = {
      gradeLevel: /(?:Writing\s+)?Grade\s+Level\s+(?:Assessment)?:?\s*(.+?)(?:\n\n|\n(?=\d+\.|\*\*)|$)/i,
      strengths: /(?:Writing\s+)?Strengths?:?\s*(.+?)(?:\n\n|\n(?=\d+\.|\*\*)|$)/is,
      improvements: /(?:Areas?\s+for\s+)?Improvement:?\s*(.+?)(?:\n\n|\n(?=\d+\.|\*\*)|$)/is,
      suggestions: /(?:Specific\s+)?Suggestions?:?\s*(.+?)(?:\n\n|\n(?=\d+\.|\*\*)|$)/is,
      tips: /(?:Writing\s+)?Tips?\s+(?:for\s+Better\s+Reviews?)?:?\s*(.+?)(?:\n\n|\n(?=\d+\.|\*\*)|$)/is,
      overall: /(?:Overall\s+)?Assessment:?\s*(.+?)(?:\n\n|$)/is
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      // Skip if we already extracted this from JSON
      if (sections[key] && sections[key].length > 0) continue;
      
      const match = feedback.match(pattern);
      if (match) {
        if (key === 'gradeLevel' || key === 'overall') {
          sections[key] = match[1].trim();
        } else {
          const content = match[1].trim();
          const items = content.split(/\n(?=[•\-\*]|\d+\.)/).map(item => 
            item.replace(/^[•\-\*\d+\.]\s*/, '').trim()
          ).filter(item => item.length > 0);
          if (items.length > 0) {
            sections[key] = items;
          }
        }
      }
    }

    const hasStructuredData = sections.gradeLevel || sections.strengths.length > 0 || 
                              sections.improvements.length > 0 || sections.suggestions.length > 0;

    if (!hasStructuredData) {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {feedback}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return renderStructuredFeedback(sections);
  };

  const renderStructuredFeedback = (sections) => {

    return (
      <div className="space-y-4">
        {sections.gradeLevel && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4" />
                  Writing Grade Level Assessment
                </h4>
                <p className="text-blue-800 leading-relaxed text-sm">{sections.gradeLevel}</p>
              </div>
            </div>
          </div>
        )}

        {sections.strengths.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Writing Strengths
                </h4>
                <ul className="space-y-2">
                  {sections.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-green-800">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {sections.improvements.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {sections.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-orange-800">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {sections.suggestions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Specific Suggestions
                </h4>
                <ul className="space-y-2">
                  {sections.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-purple-800">
                      <span className="text-purple-600 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {sections.tips.length > 0 && (
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-cyan-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Writing Tips for Better Reviews
                </h4>
                <ul className="space-y-2">
                  {sections.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-cyan-800">
                      <span className="text-cyan-600 font-bold mt-0.5 flex-shrink-0">💡</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {sections.overall && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Overall Assessment
                </h4>
                <p className="text-indigo-800 leading-relaxed">{sections.overall}</p>
              </div>
            </div>
          </div>
        )}

        {sections.suggestedReviews && sections.suggestedReviews.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  Improved Review Suggestions
                </h4>
                <p className="text-yellow-800 text-sm mb-4">
                  Here are improved versions of your reviews that demonstrate better writing skills while keeping your original message:
                </p>
                <div className="space-y-4">
                  {sections.suggestedReviews.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="mb-3">
                        <h5 className="font-semibold text-gray-900 text-sm mb-1">
                          📖 {item.bookTitle || 'Unknown Book'}
                        </h5>
                        {item.bookAuthor && (
                          <p className="text-xs text-gray-600 mb-2">by {item.bookAuthor}</p>
                        )}
                      </div>
                      
                      {item.originalReview && (
                        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Your Original Review:</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{item.originalReview}</p>
                        </div>
                      )}
                      
                      <div className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded border-2 border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-900 mb-1 flex items-center gap-1">
                          ✨ Improved Review:
                        </p>
                        <p className="text-sm text-yellow-900 leading-relaxed font-medium">{item.suggestedReview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const buildWritingStylePrompt = (selectedBooksData) => {
    // This function is kept for display purposes, but the actual prompt is built in aiRecommendationService.js
    // This ensures consistency between what's shown and what's sent
    // Use ref to get stable userProfile that was captured when modal opened
    const currentUserProfile = userProfileRef.current || userProfile;
    const ageGroup = currentUserProfile?.age_group || null;
    const ageContext = ageGroup && ageGroup.trim() ? ` The student's age group is: ${ageGroup}. Please consider this when assessing their writing skill level and providing age-appropriate feedback.` : '';
    
    let prompt = `You are an expert writing coach and educator specializing in helping students improve their writing skills. Analyze the following book reviews written by a student and provide comprehensive feedback on their writing style, strengths, and areas for improvement.${ageContext}\n\n`;
    
    prompt += `Student's Book Reviews (${selectedBooksData.length} reviews):\n\n`;
    
    selectedBooksData.forEach((book, index) => {
      prompt += `Review ${index + 1}:\n`;
      prompt += `Book: "${book.title}" by ${book.author || 'Unknown Author'}\n`;
      // Include book summary if available
      const summaryText = (book.sceneSummary || book.scene_summary || '').trim();
      if (summaryText) {
        prompt += `Book Summary: ${summaryText}\n`;
      } else {
        // Debug: Log if summary is missing
        console.log(`[Writing Feedback Preview] Book "${book.title}" - sceneSummary:`, book.sceneSummary, 'scene_summary:', book.scene_summary, 'all keys:', Object.keys(book));
      }
      // Review is required
      const reviewText = (book.review || '').trim();
      if (reviewText) {
        prompt += `Review:\n${reviewText}\n\n`;
      } else {
        console.warn(`[Writing Feedback Preview] Book "${book.title}" has no review text`);
      }
    });
    
    prompt += `IMPORTANT: Please provide your feedback as a valid JSON object with the following structure. Analyze the student's actual writing and provide specific, personalized feedback:\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- "readingGradeLevel": A single string like "6th grade", "9th grade", "high school level", or "college level" - assess the reading level demonstrated in the reviews\n`;
    prompt += `- "writingSkillLevel": REQUIRED - A number from 1 to 10 representing the overall writing skill level. This is a critical field. Rate this based on the student's age/grade level if provided.\n`;
    prompt += `- "skillBreakdown": An object with three numeric scores (1-10 each): "contentUnderstanding", "engagement", and "writingMechanics"\n`;
    prompt += `- "strengths": An array of 3-5 specific strengths (each as a string)\n`;
    prompt += `- "improvements": An array of 3-5 specific areas for improvement (each as a string)\n`;
    prompt += `- "specificSuggestions": An array of 5-7 actionable suggestions (each as a string)\n`;
    prompt += `- "tips": An array of 3-5 tips for writing better reviews (each as a string)\n`;
    prompt += `- "overallAssessment": A single string with 2-3 sentences summarizing the student's writing ability and explaining the writingSkillLevel rating\n`;
    prompt += `- "suggestedReviews": REQUIRED - Provide an improved version for EACH review analyzed. Format as an array of objects, where each object contains:\n`;
    prompt += `  * "bookTitle": The title of the book (string)\n`;
    prompt += `  * "bookAuthor": The author of the book (string)\n`;
    prompt += `  * "originalReview": The student's original review text (string)\n`;
    prompt += `  * "suggestedReview": An improved version that:\n`;
    prompt += `    - Captures the same message and key points from the student's original review\n`;
    prompt += `    - Demonstrates a step up in writing skills and level (better grammar, more varied sentence structure, deeper analysis)\n`;
    prompt += `    - Maintains the student's authentic voice while showing improvement\n`;
    prompt += `    - Is appropriate for the student's age/grade level (one step up, not too advanced)\n`;
    prompt += `  Example structure: [{"bookTitle": "Book 1", "bookAuthor": "Author 1", "originalReview": "...", "suggestedReview": "..."}, {"bookTitle": "Book 2", ...}]\n\n`;
    prompt += `Please be encouraging, constructive, and specific. Return ONLY valid JSON, no additional text before or after.`;
    
    return prompt;
  };

  const calculateWritingFeedbackCost = (selectedCount) => {
    if (selectedCount === 0) return null;
    
    const avgReviewLength = 200;
    const promptOverhead = 800;
    const estimatedPromptLength = promptOverhead + (selectedCount * avgReviewLength);
    const estimatedTokens = Math.ceil(estimatedPromptLength / 4);
    const costEst = estimateAICost(estimatedTokens, 2000);
    
    return { tokenEstimate: estimatedTokens, costEstimate: costEst };
  };

  const handleContinueToParameters = () => {
    const booksToAnalyze = availableBooksWithReviews.filter((_, idx) => selectedBooksForWriting.has(idx));
    
    if (booksToAnalyze.length === 0) {
      setError('Please select at least one book with a review to analyze.');
      return;
    }
    
    // Use ref to get stable userProfile that was captured when modal opened
    const currentUserProfile = userProfileRef.current || userProfile;
    
    // Build prompt for display and cost estimation
    const prompt = buildWritingStylePrompt(booksToAnalyze);
    setWritingPromptText(prompt);
    
    const estimatedTokens = Math.ceil(prompt.length / 4);
    const costEst = estimateAICost(estimatedTokens, 2000);
    
    setTokenEstimate(estimatedTokens);
    setCostEstimate(costEst);
    setShowParameters(true);
    setError(null);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(writingPromptText);
      // Show temporary success message
      const copyButton = document.querySelector('[data-copy-writing-prompt]');
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
      const textarea = document.querySelector('[data-writing-prompt-textarea]');
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
      }
    }
  };

  const loadWritingStyleFeedback = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const booksToAnalyze = availableBooksWithReviews.filter((_, idx) => selectedBooksForWriting.has(idx));
      
      if (booksToAnalyze.length === 0) {
        throw new Error('Please select at least one book with a review.');
      }

      // Use ref to get stable userProfile that was captured when modal opened
      const currentUserProfile = userProfileRef.current || userProfile;
      const userId = currentUserProfile?.id || currentUser?.id;
      const result = await generateWritingStyleFeedback(booksToAnalyze, userId, currentUserProfile);

      if (result.error) {
        // Convert error object to Error instance if needed
        if (result.error instanceof Error) {
          throw result.error;
        } else if (typeof result.error === 'string') {
          throw new Error(result.error);
        } else if (result.error.message) {
          throw new Error(result.error.message);
        } else {
          throw new Error(JSON.stringify(result.error));
        }
      }

      if (result.data) {
        setWritingFeedback(result.data);
        // Store parsed data if available (for grade level display)
        if (result.parsedData) {
          setWritingFeedbackParsedData(result.parsedData);
        }
        setShowParameters(false);
        setShowPrompt(false);
      } else {
        throw new Error('No feedback generated. Please try again.');
      }
    } catch (err) {
      console.error('Error loading writing feedback:', err);
      // Extract error message from various possible error formats
      let errorMessage = 'Failed to generate writing feedback. Please try again later.';
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = typeof err.error === 'string' ? err.error : err.error.message || JSON.stringify(err.error);
        } else if (err.response) {
          errorMessage = err.response.error || err.response.message || 'API request failed';
        } else {
          errorMessage = JSON.stringify(err);
        }
      }
      // Ensure error is displayed to user
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <PenTool className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {showWritingHistory ? 'Writing Feedback History' : 'Writing Style Feedback'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!showWritingHistory && (
              <button
                onClick={async () => {
                  setLoadingWritingHistory(true);
                  setShowWritingHistory(true);
                  const userId = userProfile?.id || currentUser?.id;
                  if (userId) {
                    const { data } = await getWritingFeedbackHistory(userId, 20);
                    setWritingHistory(data || []);
                  }
                  setLoadingWritingHistory(false);
                }}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-2"
                title="View past writing feedback analysis"
              >
                <History className="w-4 h-4" />
                View History
              </button>
            )}
            {showWritingHistory && (
              <button
                onClick={() => {
                  setShowWritingHistory(false);
                  setSelectedFeedbackForComparison([]);
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
          {showWritingHistory ? (
            <div className="space-y-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  {selectedFeedbackForComparison.length > 0 
                    ? `${selectedFeedbackForComparison.length} selected for comparison`
                    : 'Select feedback to compare over time'}
                </p>
                {selectedFeedbackForComparison.length > 0 && (
                  <button
                    onClick={() => setSelectedFeedbackForComparison([])}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors mt-2"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                {writingHistory.map((record) => {
                  // New table structure: full_response is directly on the record
                  const feedback = record.full_response || '';
                  const isSelected = selectedFeedbackForComparison.some(f => f.id === record.id);
                  
                  return (
                    <div
                      key={record.id}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-900">
                                  {new Date(record.request_timestamp || record.created_at).toLocaleString()}
                                </span>
                            {record.estimated_cost && (
                              <span className="text-xs text-gray-500">
                                • ${parseFloat(record.estimated_cost).toFixed(4)}
                              </span>
                            )}
                          </div>
                              {record.books_count > 0 && (
                                <div className="text-xs text-gray-600 mb-2">
                                  📚 Analyzed {record.books_count} review{record.books_count !== 1 ? 's' : ''}
                                  {record.reading_grade_level && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                      {record.reading_grade_level}
                                    </span>
                                  )}
                                </div>
                              )}
                              {record.time_taken_ms && (
                                <div className="text-xs text-gray-500">
                                  ⏱️ {record.time_taken_ms}ms • ${parseFloat(record.estimated_cost || 0).toFixed(4)}
                                </div>
                              )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (isSelected) {
                                setSelectedFeedbackForComparison(
                                  selectedFeedbackForComparison.filter(f => f.id !== record.id)
                                );
                              } else {
                                setSelectedFeedbackForComparison([
                                  ...selectedFeedbackForComparison,
                                  { 
                                    id: record.id, 
                                    feedback, 
                                    date: record.request_timestamp || record.created_at, 
                                    gradeLevel: record.reading_grade_level,
                                    parsedData: record // Pass the full record as parsed data
                                  }
                                ]);
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              isSelected
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => {
                              // Store both the raw feedback and parsed data
                              setWritingFeedback(feedback);
                              setWritingFeedbackParsedData(record);
                              setShowWritingHistory(false);
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 line-clamp-3 bg-gray-50 p-2 rounded">
                        {feedback.substring(0, 200)}...
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedFeedbackForComparison.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Compare Feedback Over Time
                  </h4>
                  <div className="space-y-6">
                    {selectedFeedbackForComparison.map((item, idx) => (
                      <div key={item.id} className="bg-white rounded-lg p-4 border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-blue-900">
                              Feedback {idx + 1}
                            </span>
                            {item.gradeLevel && (
                              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                {item.gradeLevel}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {parseWritingFeedback(item.feedback, item.parsedData)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : writingFeedback ? (
            <div className="space-y-6">
              {/* Prominent Writing Skill Level Display */}
              {(() => {
                // Extract skill level and breakdown from parsed data
                const skillLevel = writingFeedbackParsedData?.writingSkillLevel || 
                                  writingFeedbackParsedData?.writing_skill_level;
                const skillBreakdown = writingFeedbackParsedData?.skillBreakdown || 
                                      writingFeedbackParsedData?.skill_breakdown;
                const gradeLevel = writingFeedbackParsedData?.readingGradeLevel || 
                                  writingFeedbackParsedData?.reading_grade_level;
                
                return skillLevel ? (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg border-2 border-purple-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-white/90 text-sm font-medium mb-1">
                            Writing Skill Level
                          </div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-white text-4xl font-bold">
                              {skillLevel}
                            </div>
                            <div className="text-white/80 text-lg">/ 10</div>
                          </div>
                        </div>
                      </div>
                      {gradeLevel && (
                        <div className="text-right">
                          <div className="text-white/80 text-xs mb-1">Grade Level</div>
                          <div className="text-white text-sm font-semibold">
                            {gradeLevel}
                          </div>
                        </div>
                      )}
                    </div>
                    {skillBreakdown && (
                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                        <div className="text-center">
                          <div className="text-white/80 text-xs mb-1">Content Understanding</div>
                          <div className="text-white text-xl font-bold">
                            {skillBreakdown.contentUnderstanding || skillBreakdown.content_understanding || '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/80 text-xs mb-1">Engagement</div>
                          <div className="text-white text-xl font-bold">
                            {skillBreakdown.engagement || '-'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/80 text-xs mb-1">Writing Mechanics</div>
                          <div className="text-white text-xl font-bold">
                            {skillBreakdown.writingMechanics || skillBreakdown.writing_mechanics || '-'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-white/90 text-xs font-medium mb-1">Progress Tracker</div>
                      <div className="text-white text-sm">
                        📈 Track your writing growth over time
                      </div>
                    </div>
                  </div>
                ) : gradeLevel ? (
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg border-2 border-blue-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Award className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-white/90 text-sm font-medium mb-1">
                            Reading & Writing Grade Level
                          </div>
                          <div className="text-white text-2xl font-bold">
                            {gradeLevel}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-xs mb-1">Progress Tracker</div>
                        <div className="text-white text-sm font-semibold">
                          📈 Track your writing growth over time
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="text-green-600">💾</span>
                    <span className="font-medium">Saved to your history</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(writingFeedback);
                        alert('Feedback copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                {parseWritingFeedback(writingFeedback, writingFeedbackParsedData)}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setWritingFeedback(null);
                    setShowParameters(false);
                    setShowPrompt(false);
                    setSelectedBooksForWriting(new Set(availableBooksWithReviews.map((_, idx) => idx)));
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Start Over
                </button>
              </div>

              {/* AI Integration Suggestions */}
              <div className="mt-8 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-bold text-purple-900">🚀 More AI Magic Coming Soon!</h4>
                </div>
                
                <p className="text-sm text-purple-800 mb-4">
                  We're always thinking of new ways to make your reading journey more fun and helpful! Here are some AI features we're considering:
                </p>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📝</span>
                      <span className="font-semibold text-gray-900">Smart Review Helper</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Get AI suggestions while writing reviews - expand your thoughts, fix grammar, or add more detail!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎯</span>
                      <span className="font-semibold text-gray-900">Reading Goals Assistant</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Set reading goals and get personalized suggestions to help you achieve them!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📊</span>
                      <span className="font-semibold text-gray-900">Reading Analytics</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Deep insights into your reading patterns, favorite themes, and growth over time!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💬</span>
                      <span className="font-semibold text-gray-900">Book Discussion Generator</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Generate discussion questions for book clubs or class discussions!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✍️</span>
                      <span className="font-semibold text-gray-900">Essay & Report Helper</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Get help structuring essays, reports, or analysis papers about books you've read!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎨</span>
                      <span className="font-semibold text-gray-900">Creative Writing Prompts</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Get creative writing prompts inspired by books you've read and loved!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔍</span>
                      <span className="font-semibold text-gray-900">Book Comparison Tool</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Compare themes, characters, and writing styles across different books you've read!
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📚</span>
                      <span className="font-semibold text-gray-900">Reading Path Suggestions</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Get personalized reading paths - "If you liked X, try Y, then Z" sequences!
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-purple-100 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-900 font-medium">
                    💡 Have an idea? Share it in your profile feedback - we love hearing from you!
                  </p>
                </div>
              </div>
            </div>
          ) : showParameters && !showWritingHistory ? (
            <div className="space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Error Generating Feedback</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Dismiss error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <PenTool className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Writing Style Feedback</h3>
                <p className="text-gray-600">Review the parameters that will be sent to AI, then generate personalized writing feedback.</p>
              </div>

              {/* Your Reading Profile Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Your Reading Profile (Parameters to be analyzed)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">Selected Books</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{selectedBooksForWriting.size}</p>
                    <p className="text-xs text-gray-500 mt-1">books with reviews for analysis</p>
                  </div>

                  {(() => {
                    const currentUserProfile = userProfileRef.current || userProfile;
                    return (
                      <>
                        {currentUserProfile?.age_group && currentUserProfile.age_group.trim() && (
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-900">Age Group</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{currentUserProfile.age_group}</p>
                            <p className="text-xs text-gray-500 mt-1">used for age-appropriate feedback</p>
                          </div>
                        )}

                        {currentUserProfile?.bio && currentUserProfile.bio.trim() && (
                          <div className="bg-white rounded-lg p-4 border border-green-100 md:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-pink-600" />
                              <span className="font-semibold text-gray-900">Your Story (Bio)</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed italic bg-pink-50 p-3 rounded border border-pink-100">
                              "{currentUserProfile.bio}"
                            </p>
                            <p className="text-xs text-gray-500 mt-2">This helps AI understand your interests and writing context</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {costEstimate && tokenEstimate && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
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
                      💡 Cost includes ~2,000 output tokens for AI response. Actual cost may vary slightly.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">📋 What will be analyzed:</h5>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Your writing style and clarity</li>
                  <li>Grammar and punctuation</li>
                  <li>Reading and writing grade level</li>
                  <li>Strengths and areas for improvement</li>
                  <li>Specific suggestions for better reviews</li>
                  <li>Tips for writing more engaging reviews</li>
                </ul>
              </div>

              {/* Prompt Display */}
              {showPrompt && writingPromptText && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">AI Prompt Text (Ready to Copy)</p>
                    <button
                      onClick={handleCopyPrompt}
                      data-copy-writing-prompt
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      title="Copy prompt to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </button>
                  </div>
                  <textarea
                    data-writing-prompt-textarea
                    readOnly
                    value={writingPromptText}
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
                  onClick={loadWritingStyleFeedback}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-700 font-medium mb-2">✨ Analyzing your writing style...</p>
              <p className="text-sm text-gray-600">Our AI is working its magic to provide detailed feedback! This might take a moment! 🎯</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-semibold mb-2">Error Generating Feedback</p>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setShowParameters(false);
                }}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-green-600" />
                  Select Books for Writing Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Choose up to 10 books with reviews that you'd like feedback on. We'll analyze your writing style and provide suggestions for improvement.
                </p>
              </div>

              {availableBooksWithReviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">No books with reviews found</p>
                  <p className="text-sm text-gray-600">Please add reviews to some books to use this feature.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-700">
                      {selectedBooksForWriting.size} of {availableBooksWithReviews.length} books selected
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allSelected = new Set(availableBooksWithReviews.map((_, idx) => idx));
                          setSelectedBooksForWriting(allSelected);
                        }}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedBooksForWriting(new Set())}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-6">
                    {availableBooksWithReviews.map((book, idx) => (
                      <label
                        key={book.id || idx}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedBooksForWriting.has(idx)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBooksForWriting.has(idx)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedBooksForWriting);
                            if (e.target.checked) {
                              newSelected.add(idx);
                            } else {
                              newSelected.delete(idx);
                            }
                            setSelectedBooksForWriting(newSelected);
                          }}
                          className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{book.title}</div>
                          <div className="text-sm text-gray-600 truncate">{book.author || 'Unknown Author'}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {book.review?.substring(0, 100)}...
                          </div>
                          {(book.review || book.sceneSummary) && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              📝 {(() => {
                                const reviewWords = (book.review || '').trim().split(/\s+/).filter(word => word.length > 0).length;
                                const summaryWords = (book.sceneSummary || '').trim().split(/\s+/).filter(word => word.length > 0).length;
                                const totalWords = reviewWords + summaryWords;
                                return `${totalWords} words${summaryWords > 0 ? ' (review + summary)' : ' (review only)'}`;
                              })()}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleContinueToParameters}
                      disabled={selectedBooksForWriting.size === 0}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review & Generate
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

