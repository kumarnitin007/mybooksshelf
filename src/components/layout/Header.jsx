import React from 'react';
import { User, Info, Sparkles } from 'lucide-react';
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
 * @param {function} onGenerateRecommendations - Callback to generate recommendations
 */
export default function Header({
  currentUser,
  totalBooks,
  activeShelf,
  onShowUserComparison,
  onShowAbout,
  onShowProfile,
  onGenerateRecommendations
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
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">My Bookshelf</h1>
              <p className="text-xs sm:text-base text-gray-600">{totalBooks} books</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-3 w-full sm:w-auto justify-end">
            {currentUser && (
              <button
                onClick={onShowUserComparison}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-all text-xs sm:text-base"
                title="Compare Users"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Compare Users</span>
              </button>
            )}
            <button
              onClick={onShowAbout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-all text-xs sm:text-base"
              title="About Bookshelf"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">About</span>
            </button>
            <button
              onClick={onShowProfile}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg sm:rounded-xl hover:bg-purple-600 transition-all text-xs sm:text-base"
              title="Profile"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={onGenerateRecommendations}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md text-xs sm:text-base"
              title="Recommendations"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Recommendations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

