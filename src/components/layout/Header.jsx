import React from 'react';
import { User, Info, Sparkles, Globe, Target, Trophy } from 'lucide-react';
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
  onShowChallenges,
  onShowRewards
}) {
  const theme = activeShelf ? ANIMAL_THEMES[activeShelf.animal] || ANIMAL_THEMES.cat : ANIMAL_THEMES.cat;

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className={`bg-gradient-to-br ${theme.colors.primary} p-2 sm:p-3 rounded-xl flex items-center justify-center`}>
              <span className="text-2xl sm:text-4xl">📚</span>
            </div>
            {currentUser && userProfile?.avatar && (
              <div className="text-2xl sm:text-3xl hidden sm:block" title={currentUser.username}>
                {userProfile.avatar}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">My Bookshelf</h1>
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
              disabled={currentUser?.username === 'Default User'}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-xs sm:text-sm ${
                currentUser?.username === 'Default User' 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              title={
                currentUser?.username === 'Default User' 
                  ? 'Please login to use this paid feature' 
                  : 'AI-Powered Recommendations'
              }
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Ask AI</span>
            </button>
            {currentUser && currentUser.username !== 'Default User' && (
              <>
                <button
                  onClick={onShowChallenges}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                  title="Reading Challenges"
                >
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Challenges</span>
                </button>
                <button
                  onClick={onShowRewards}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-lg sm:rounded-xl hover:from-yellow-700 hover:to-amber-700 transition-all shadow-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                  title="Virtual Rewards"
                >
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Rewards</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

