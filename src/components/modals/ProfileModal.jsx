import React, { useState, useEffect, useRef } from 'react';
import { X, User, ChevronUp, ChevronDown, Target, Sparkles, MessageSquare, Settings, Save, BookOpen, Library, Plus, Trash2 } from 'lucide-react';
import AvatarSelector from '../AvatarSelector';
import { isEmailVerified } from '../../services/authService';
import { getGenreColor } from '../../utils/genreColors';

/**
 * ProfileModal Component
 * Modal for viewing and editing user profile
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} userProfile - User profile data
 * @param {function} setUserProfile - Function to update user profile
 * @param {object} currentUser - Current logged in user
 * @param {object} authUser - Authenticated user from Supabase
 * @param {boolean} showAvatarSelector - Whether avatar selector is visible
 * @param {function} setShowAvatarSelector - Function to toggle avatar selector
 * @param {string} profileError - Error message
 * @param {string} profileSuccess - Success message
 * @param {boolean} profileLoading - Whether profile is being saved
 * @param {array} allBooks - All books array
 * @param {array} bookshelves - All bookshelves array
 * @param {number} booksReadThisMonth - Books read this month
 * @param {number} remainingBooks - Remaining books to reach goal
 * @param {number} averageBooksPerMonth - Average books per month
 * @param {string} mostReadAuthor - Most read author
 * @param {object} userXP - User XP data
 * @param {object} userStreak - User streak data
 * @param {array} recentAchievements - Recent achievements
 * @param {function} onClose - Callback to close the modal
 * @param {function} onLogout - Callback to logout
 * @param {function} onSave - Callback to save profile
 */
export default function ProfileModal({
  show,
  userProfile,
  setUserProfile,
  currentUser,
  authUser,
  showAvatarSelector,
  setShowAvatarSelector,
  profileError,
  profileSuccess,
  profileLoading,
  allBooks,
  bookshelves,
  booksReadThisMonth,
  remainingBooks,
  averageBooksPerMonth,
  mostReadAuthor,
  userXP,
  userStreak,
  recentAchievements,
  onClose,
  onLogout,
  onSave
}) {
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);

  // Initialize custom library buttons from userProfile
  const [customLibraryButtons, setCustomLibraryButtons] = useState([]);
  const isInitializedRef = useRef(false);

  // Sync customLibraryButtons when modal opens (only once per modal session)
  useEffect(() => {
    if (!show) {
      isInitializedRef.current = false;
      return;
    }
    
    // Only initialize once when modal opens
    if (!isInitializedRef.current) {
      try {
        if (userProfile?.custom_library_buttons) {
          let parsed = [];
          if (typeof userProfile.custom_library_buttons === 'string') {
            parsed = JSON.parse(userProfile.custom_library_buttons);
          } else if (Array.isArray(userProfile.custom_library_buttons)) {
            parsed = userProfile.custom_library_buttons;
          }
          setCustomLibraryButtons(parsed);
        } else {
          setCustomLibraryButtons([]);
        }
        isInitializedRef.current = true;
      } catch (e) {
        console.error('Error parsing custom_library_buttons:', e);
        setCustomLibraryButtons([]);
        isInitializedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Update userProfile when customLibraryButtons changes (only after initialization)
  useEffect(() => {
    if (!show || !userProfile || !isInitializedRef.current) return;
    
    // Update userProfile with current customLibraryButtons
    setUserProfile(prev => ({
      ...prev,
      custom_library_buttons: customLibraryButtons
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customLibraryButtons]);

  if (!show) return null;

  const handleAddLibraryButton = () => {
    if (customLibraryButtons.length >= 3) {
      alert('You can add a maximum of 3 custom library buttons.');
      return;
    }
    setCustomLibraryButtons([...customLibraryButtons, { name: '', url: '' }]);
  };

  const handleRemoveLibraryButton = (index) => {
    setCustomLibraryButtons(customLibraryButtons.filter((_, i) => i !== index));
  };

  const handleUpdateLibraryButton = (index, field, value) => {
    const updated = [...customLibraryButtons];
    updated[index] = { ...updated[index], [field]: value };
    setCustomLibraryButtons(updated);
  };

  const handleClose = () => {
    onClose();
    setShowAvatarSelector(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{userProfile.avatar || '📚'}</span>
            <User className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Logged in User Display */}
          {currentUser && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-sm text-gray-600">Logged in as</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {authUser ? authUser.email : currentUser.username}
                    </p>
                    {authUser && isEmailVerified(authUser) && (
                      <p className="text-xs text-green-600 mt-1">✓ Email verified</p>
                    )}
                    {authUser && !isEmailVerified(authUser) && (
                      <p className="text-xs text-yellow-600 mt-1">⚠ Email not verified</p>
                    )}
                    {!authUser && (
                      <p className="text-xs text-gray-500 mt-1">Using default account</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                  title="Logout"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Avatar Display and Selector */}
          <div className="text-center">
            <div className="text-6xl mb-4">{userProfile.avatar || '📚'}</div>
            <button
              onClick={() => setShowAvatarSelector(!showAvatarSelector)}
              className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
              title="Change your avatar"
            >
              <span className="text-xl">{userProfile.avatar || '📚'}</span>
              <span className="font-medium">Change Avatar</span>
              {showAvatarSelector ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-indigo-600" />}
            </button>
            {showAvatarSelector && (
              <div className="mt-4">
                <AvatarSelector
                  currentAvatar={userProfile.avatar || '📚'}
                  onSelect={(newAvatar) => setUserProfile({ ...userProfile, avatar: newAvatar })}
                />
              </div>
            )}
          </div>

          {/* Your Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Story ✨ (Helps AI find your perfect reads!)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              🎯 Tell us what makes you tick! Your hobbies, favorite topics, or what kind of stories you love. Our AI will use this to suggest books that'll actually make you want to keep reading!
            </p>
            <textarea
              value={userProfile.bio || ''}
              onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Love sci-fi adventures? Obsessed with mysteries? Into romance? Tell us what gets you excited and we'll find books you won't be able to put down! 📚"
              rows="3"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {(userProfile.bio || '').length}/200
            </div>
          </div>

          {/* Age Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Group (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              📊 Enter your age or age range (e.g., "12", "12-15", "47"). This helps AI provide age-appropriate book recommendations and writing feedback tailored to your level.
            </p>
            <input
              type="text"
              value={userProfile?.age_group || ''}
              onChange={(e) => setUserProfile({ ...userProfile, age_group: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., 12, 12-15, 47"
              maxLength={20}
            />
          </div>

          {/* Monthly Reading Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Reading Target</label>
            <input
              type="number"
              value={userProfile.monthlyTarget}
              onChange={(e) => setUserProfile({ ...userProfile, monthlyTarget: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Number of books to read this month"
              min="0"
            />
          </div>

          {/* Reading Progress */}
          {userProfile.monthlyTarget > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Reading Progress</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Books Read This Month</span>
                    <span className="font-semibold">{booksReadThisMonth} / {userProfile.monthlyTarget}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (booksReadThisMonth / userProfile.monthlyTarget) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{remainingBooks}</p>
                  <p className="text-sm text-gray-600">books remaining to reach your goal</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Reading Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{allBooks.length}</p>
                <p className="text-sm text-gray-600">Total Books</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{bookshelves.length}</p>
                <p className="text-sm text-gray-600">Bookshelves</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{booksReadThisMonth}</p>
                <p className="text-sm text-gray-600">Read This Month</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {allBooks.length > 0 
                    ? (allBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / allBooks.filter(b => b.rating > 0).length).toFixed(1)
                    : '0'
                  }
                </p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600">{averageBooksPerMonth}</p>
                <p className="text-sm text-gray-600">Avg Books/Month</p>
              </div>
              {mostReadAuthor && mostReadAuthor !== 'N/A' && (
                <div>
                  <p className="text-lg font-bold text-green-600 truncate" title={mostReadAuthor}>
                    {mostReadAuthor}
                  </p>
                  <p className="text-sm text-gray-600">Favorite Author</p>
                </div>
              )}
            </div>
          </div>

          {/* Genre Statistics */}
          {(() => {
            const booksWithGenres = allBooks.filter(b => b.genre);
            if (booksWithGenres.length === 0) return null;

            // Count genres
            const genreCounts = {};
            booksWithGenres.forEach(book => {
              genreCounts[book.genre] = (genreCounts[book.genre] || 0) + 1;
            });

            // Get top genres
            const topGenres = Object.entries(genreCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5);

            const totalGenres = Object.keys(genreCounts).length;

            return (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Genre Insights
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Genres</span>
                    <span className="text-lg font-bold text-purple-600">{totalGenres}</span>
                  </div>
                  {topGenres.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Top Genres</p>
                      <div className="space-y-2">
                        {topGenres.map(([genre, count]) => {
                          const percentage = ((count / booksWithGenres.length) * 100).toFixed(0);
                          const genreColors = getGenreColor(genre);
                          return (
                            <div key={genre} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${genreColors.bg} border ${genreColors.border}`}></span>
                                  <span className="font-medium text-gray-700">{genre}</span>
                                </div>
                                <span className="text-gray-600">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${genreColors.bg} transition-all`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Gamification Stats */}
          {(userXP || userStreak) && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                Achievements & Progress
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {userXP && (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">Level {userXP.current_level || 1}</p>
                      <p className="text-sm text-gray-600">Current Level</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{userXP.total_xp || 0}</p>
                      <p className="text-sm text-gray-600">Total XP</p>
                    </div>
                    {userXP.xp_to_next_level > 0 && (
                      <div className="col-span-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress to Level {userXP.current_level + 1}</span>
                          <span>{userXP.xp_to_next_level} XP needed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, ((userXP.total_xp || 0) % (100 + (userXP.current_level - 1) * 50)) / (userXP.xp_to_next_level || 100) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                {userStreak && (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-red-600">🔥 {userStreak.current_streak || 0}</p>
                      <p className="text-sm text-gray-600">Current Streak</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">🌟 {userStreak.longest_streak || 0}</p>
                      <p className="text-sm text-gray-600">Longest Streak</p>
                    </div>
                  </>
                )}
                {recentAchievements.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Recent Achievements ({recentAchievements.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {recentAchievements.slice(0, 6).map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-yellow-200"
                          title={achievement.badge_description}
                        >
                          <span className="text-lg">{achievement.badge_emoji}</span>
                          <span className="text-xs font-medium text-gray-700">{achievement.badge_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <button
              onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
              className="w-full flex items-center justify-between gap-3 mb-4 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Feedback and New Feature Request</h3>
              </div>
              {isFeedbackExpanded ? (
                <ChevronUp className="w-5 h-5 text-indigo-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-600" />
              )}
            </button>
            {isFeedbackExpanded && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  We'd love to hear your thoughts! Share your feedback, suggestions, or report any issues you've encountered.
                </p>
                <textarea
                  value={userProfile.feedback || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, feedback: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                  placeholder="Tell us what you think about Bookshelf..."
                  rows="5"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {(userProfile.feedback || '').length}/1000
                </div>
              </>
            )}
          </div>

          {/* Custom Library Buttons */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Library className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Custom Library Buttons</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Add up to 3 custom library buttons that will appear in the "Get the Book" section when viewing book details. These buttons will open your favorite libraries or bookstores.
            </p>
            
            {/* Example URL Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">💡 URL Examples:</p>
              <div className="space-y-2 text-xs text-blue-800 font-mono">
                <div>
                  <span className="font-semibold">Search by title:</span>
                  <div className="bg-white p-2 rounded mt-1 break-all">
                    https://fulcolibrary.bibliocommons.com/v2/search?query={'{title}'}&searchType=title
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Search by author:</span>
                  <div className="bg-white p-2 rounded mt-1 break-all">
                    https://fulcolibrary.bibliocommons.com/v2/search?query={'{author}'}&searchType=author
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Search by title and author:</span>
                  <div className="bg-white p-2 rounded mt-1 break-all">
                    https://fulcolibrary.bibliocommons.com/v2/search?query={'{title}'} {'{author}'}&searchType=keyword
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Use <code className="bg-blue-100 px-1 rounded">{'{title}'}</code> and <code className="bg-blue-100 px-1 rounded">{'{author}'}</code> placeholders - they'll be replaced with the actual book details!
              </p>
            </div>
            
            <div className="space-y-3">
              {customLibraryButtons.map((button, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Button {index + 1}</span>
                    <button
                      onClick={() => handleRemoveLibraryButton(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove this button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Button Name</label>
                      <input
                        type="text"
                        value={button.name || ''}
                        onChange={(e) => handleUpdateLibraryButton(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="e.g., My Local Library"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                      <input
                        type="url"
                        value={button.url || ''}
                        onChange={(e) => handleUpdateLibraryButton(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="https://example.com/search?q={title}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Use {"{title}"} and {"{author}"} in the URL to automatically insert book details
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {customLibraryButtons.length < 3 && (
                <button
                  onClick={handleAddLibraryButton}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Library Button ({customLibraryButtons.length}/3)
                </button>
              )}
              {customLibraryButtons.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No custom library buttons added yet. Click "Add Library Button" to get started!
                </p>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Privacy Settings</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Hide from User Comparison</p>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, your profile will not appear in the user comparison list
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userProfile.hideFromComparison || false}
                  onChange={(e) => setUserProfile({ ...userProfile, hideFromComparison: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Error/Success Messages */}
          {profileError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {profileSuccess}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={profileLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

