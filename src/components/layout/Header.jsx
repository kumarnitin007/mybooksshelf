import React, { useState, useRef, useEffect } from 'react';
import { User, Info, Sparkles, Globe, Target, Trophy, BarChart3, Shield, PenTool, BookOpen } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants/animalThemes';

/**
 * Header Component
 * Top navigation bar with app title and action buttons
 * 
 * @param {object} currentUser - Current logged in user
 * @param {number} totalBooks - Total number of books
 * @param {object} activeShelf - Currently active bookshelf
 * @param {function} onShowUserComparison - Callback to show user comparison modal
 * @param {function} onShowAbout - Callback to show about modal
 * @param {function} onShowProfile - Callback to show profile modal
 * @param {function} onShowPublicRecommendations - Callback to show public recommendations modal
 * @param {function} onShowAIRecommendations - Callback to show AI recommendations modal
 * @param {function} onShowChallenges - Callback to show challenges modal
 * @param {function} onShowRewards - Callback to show rewards modal
 * @param {function} onShowReadingHistory - Callback to show reading history modal
 * @param {function} onShowAdmin - Callback to show admin console modal
 * @param {function} onShowWelcome - Callback to show welcome modal
 */
export default function Header({
  currentUser,
  userProfile,
  totalBooks,
  activeShelf,
  onShowUserComparison,
  onShowAbout,
  onShowProfile,
  onShowPublicRecommendations,
  onShowAIRecommendations,
  onShowWritingFeedback,
  onShowChallenges,
  onShowRewards,
  onShowReadingHistory,
  onShowAdmin,
  onShowWelcome
}) {
  const theme = activeShelf ? ANIMAL_THEMES[activeShelf.animal] || ANIMAL_THEMES.cat : ANIMAL_THEMES.cat;

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={onShowWelcome}
              className={`bg-gradient-to-br ${theme.colors.primary} p-2 sm:p-3 rounded-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer`}
              title="My Bookshelf"
            >
              <span className="text-2xl sm:text-4xl">📚</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Books</h1>
              <p className="text-xs sm:text-base text-gray-600">{totalBooks} books</p>
            </div>
          </div>
          <div className="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto justify-end">
            {currentUser && (
              <button
                onClick={onShowUserComparison}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                title="Compare Users"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            )}
            <button
              onClick={onShowAbout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
              title="About Bookshelf"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">About</span>
            </button>
            <button
              onClick={onShowProfile}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg sm:rounded-xl hover:bg-purple-600 transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
              title="Profile"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={onShowPublicRecommendations}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
              title="Public Recommendations"
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Public Feed</span>
            </button>
            <button
              onClick={onShowAIRecommendations}
              disabled={currentUser?.username === 'Default User' || userProfile?.ai_recommendations_enabled === false}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                currentUser?.username === 'Default User' || userProfile?.ai_recommendations_enabled === false
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-indigo-700 hover:to-purple-700'
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this feature'
                  : userProfile?.ai_recommendations_enabled === false
                  ? 'AI recommendations are not enabled for your account'
                  : 'Get AI-Powered Book Recommendations'
              }
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
            <button
              onClick={onShowWritingFeedback}
              disabled={currentUser?.username === 'Default User' || userProfile?.ai_recommendations_enabled === false}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                currentUser?.username === 'Default User' || userProfile?.ai_recommendations_enabled === false
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-green-700 hover:to-emerald-700'
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this feature'
                  : userProfile?.ai_recommendations_enabled === false
                  ? 'AI recommendations are not enabled for your account'
                  : 'Get Writing Style Feedback on Your Reviews'
              }
            >
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Writing AI</span>
            </button>
            <button
              onClick={onShowChallenges}
              disabled={currentUser?.username === 'Default User'}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg sm:rounded-xl transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                currentUser?.username === 'Default User'
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-orange-700 hover:to-red-700'
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this feature'
                  : 'Reading Challenges'
              }
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Challenges</span>
            </button>
            <button
              onClick={onShowRewards}
              disabled={currentUser?.username === 'Default User'}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg sm:rounded-xl transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                currentUser?.username === 'Default User'
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-yellow-700 hover:to-amber-700'
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this feature'
                  : 'Virtual Rewards'
              }
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Rewards</span>
            </button>
            <button
              onClick={onShowReadingHistory}
              disabled={currentUser?.username === 'Default User'}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg sm:rounded-xl transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                currentUser?.username === 'Default User'
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-teal-700 hover:to-cyan-700'
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this feature'
                  : 'Reading History & Analytics'
              }
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">History</span>
            </button>
            {userProfile?.is_admin && (
              <button
                onClick={onShowAdmin}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                title="Admin Console"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

