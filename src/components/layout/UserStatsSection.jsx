import React from 'react';
import { Book, Calendar, Target, Sparkles } from 'lucide-react';

/**
 * UserStatsSection Component
 * Displays user statistics, achievements, and encouraging messages
 * 
 * @param {object} currentUser - Current logged in user
 * @param {object} userProfile - User profile data
 * @param {object} userXP - User XP data
 * @param {object} userStreak - User streak data
 * @param {array} recentAchievements - Recent achievements array
 * @param {number} totalBooksCount - Total number of books
 * @param {number} booksReadThisMonth - Books read this month
 * @param {number} remainingBooks - Remaining books to reach goal
 * @param {string} encouragingMessage - Encouraging message to display
 */
export default function UserStatsSection({
  currentUser,
  userProfile,
  userXP,
  userStreak,
  recentAchievements,
  totalBooksCount,
  booksReadThisMonth,
  remainingBooks,
  encouragingMessage
}) {
  if (!currentUser) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* User Avatar and Name */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-4xl sm:text-5xl">{userProfile.avatar || '📚'}</div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {userProfile.name?.trim() || currentUser.username || 'Reader'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">Your Reading Journey</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 flex-1">
              {/* XP and Level */}
              {userXP && (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      Level {userXP.current_level || 1}
                    </div>
                    <div className="text-xs text-gray-600">
                      {userXP.total_xp || 0} XP
                    </div>
                    {userXP.xp_to_next_level > 0 && (
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, ((userXP.total_xp || 0) % (100 + (userXP.current_level - 1) * 50)) / (userXP.xp_to_next_level || 100) * 100)}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Reading Streak */}
              {userStreak && userStreak.current_streak > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      {userStreak.current_streak} week{userStreak.current_streak !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-600">Reading Streak</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{totalBooksCount}</div>
                  <div className="text-xs text-gray-600">Total Books</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{booksReadThisMonth}</div>
                  <div className="text-xs text-gray-600">This Month</div>
                </div>
              </div>
              {userProfile.monthlyTarget > 0 && (
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-600" />
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      {booksReadThisMonth} / {userProfile.monthlyTarget}
                    </div>
                    <div className="text-xs text-gray-600">Monthly Goal</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">Recent Achievements</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentAchievements.slice(0, 5).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                      title={achievement.badge_description}
                    >
                      <span className="text-lg">{achievement.badge_emoji}</span>
                      <span className="text-xs font-medium text-gray-700">{achievement.badge_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encouraging Message */}
            {encouragingMessage && (
              <div className="w-full sm:w-auto sm:max-w-md">
                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 sm:p-4 border-l-4 border-indigo-500">
                  <p className="text-sm sm:text-base text-gray-800 font-medium">
                    {encouragingMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

