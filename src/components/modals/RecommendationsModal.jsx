import React from 'react';
import { X, Sparkles, Heart } from 'lucide-react';

/**
 * RecommendationsModal Component
 * Displays personalized book recommendations for the user
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {array} recommendations - Array of recommended books
 * @param {boolean} isLoadingRecommendations - Whether recommendations are being loaded
 * @param {function} onClose - Callback to close the modal
 * @param {function} onAddToWishlist - Callback to add a recommendation to wishlist
 * @param {function} onIgnore - Callback to ignore a recommendation
 * @param {function} onGetMore - Callback to get more recommendations
 */
export default function RecommendationsModal({
  show,
  recommendations,
  isLoadingRecommendations,
  onClose,
  onAddToWishlist,
  onIgnore,
  onGetMore
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          {isLoadingRecommendations ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing your reading preferences...</p>
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors cursor-pointer group"
                    onClick={() => onAddToWishlist(rec)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">{rec.title}</h3>
                          <Heart className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">by {rec.author}</p>
                        <p className="text-gray-700 text-sm">{rec.reason}</p>
                        <p className="text-xs text-pink-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to add to wishlist
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToWishlist(rec);
                          }}
                          className="px-3 py-1 text-sm bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-colors flex items-center gap-1"
                          title="Add to wishlist"
                        >
                          <Heart className="w-4 h-4" />
                          Add
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onIgnore(rec.title, rec.author);
                          }}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          title="Ignore this suggestion"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-4 border-t border-gray-200">
                <button
                  onClick={onGetMore}
                  disabled={isLoadingRecommendations}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Get 5 More Recommendations
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-600 py-12">No recommendations available. Add more books with ratings to get personalized recommendations!</p>
          )}
        </div>
      </div>
    </div>
  );
}

