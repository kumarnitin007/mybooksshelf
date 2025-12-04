import React, { useState, useEffect } from 'react';
import { X, Globe, Book, Star, Plus } from 'lucide-react';
import { getPublicRecommendations } from '../../services/bookService';
import { transformBookFromDB } from '../../services/bookService';
import { getGenreColor } from '../../utils/genreColors';
import { getUserProfile } from '../../services/userService';
import { getPlaceholderImage } from '../../utils/imageHelpers';

/**
 * PublicRecommendationsModal Component
 * Displays publicly recommended books from all users
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} currentUser - Current logged in user
 * @param {function} onClose - Callback to close the modal
 * @param {function} onAddBook - Callback to add a book to user's library
 */
export default function PublicRecommendationsModal({
  show,
  currentUser,
  onClose,
  onAddBook
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (show) {
      loadRecommendations();
    }
  }, [show]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getPublicRecommendations(50);
      if (error) {
        console.error('Error loading recommendations:', error);
        setRecommendations([]);
        return;
      }

      const transformed = (data || []).map(transformBookFromDB);
      setRecommendations(transformed);

      // Load user profiles for sharer info
      const profiles = {};
      const uniqueSharerIds = [...new Set(transformed.map(b => b.sharedBy).filter(Boolean))];
      
      for (const sharerId of uniqueSharerIds) {
        try {
          const { data: profile } = await getUserProfile(sharerId);
          if (profile) {
            profiles[sharerId] = profile;
          }
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error loading recommendations:', error);
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
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Public Recommendations</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading recommendations...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No public recommendations yet.</p>
              <p className="text-sm text-gray-500 mt-2">Share your favorite books publicly to help others discover great reads!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((book) => {
                const sharerProfile = book.sharedBy ? userProfiles[book.sharedBy] : null;
                const genreColors = book.genre ? getGenreColor(book.genre) : null;
                
                return (
                  <div key={book.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex gap-3 mb-3">
                      <img
                        src={book.coverUrl || getPlaceholderImage(book.title)}
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => {
                          e.target.src = getPlaceholderImage(book.title);
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{book.title}</h3>
                        {book.author && (
                          <p className="text-xs text-gray-600 mt-1">{book.author}</p>
                        )}
                        {book.genre && genreColors && (
                          <span className={`inline-block mt-2 px-2 py-0.5 ${genreColors.bg} ${genreColors.text} rounded text-xs font-semibold`}>
                            {book.genre}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {book.rating > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= book.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}

                    {sharerProfile && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <span>{sharerProfile.avatar || '👤'}</span>
                        <span>Recommended by {sharerProfile.name || 'Someone'}</span>
                      </div>
                    )}

                    {book.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{book.description}</p>
                    )}

                    <button
                      onClick={() => {
                        if (onAddBook) {
                          onAddBook(book);
                        }
                      }}
                      className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add to My Library
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

