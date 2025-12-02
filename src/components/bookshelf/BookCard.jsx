import React from 'react';
import { Star } from 'lucide-react';

/**
 * BookCard Component
 * Displays a book in cover view with image retry logic
 * 
 * @param {object} book - Book object
 * @param {boolean} isFailed - Whether the image has failed to load (from state or ref)
 * @param {object} imageRetryCountsRef - Ref object tracking retry counts per book
 * @param {object} failedImagesRef - Ref object tracking failed images
 * @param {object} pendingFailedUpdatesRef - Ref object for batching failed image updates
 * @param {function} setFailedImages - State setter for failed images
 * @param {function} onClick - Callback when book is clicked
 */
export default function BookCard({ 
  book, 
  isFailed, 
  imageRetryCountsRef,
  failedImagesRef,
  pendingFailedUpdatesRef,
  setFailedImages,
  onClick 
}) {
  const handleImageError = (e) => {
    const currentRetries = imageRetryCountsRef.current[book.id] || 0;
    const maxRetries = 2; // Reduced retries to minimize flickering
    
    // Only retry if it's a web URL (not data URL or placeholder)
    const isWebUrl = book.coverUrl && 
      !book.coverUrl.startsWith('data:') && 
      !book.coverUrl.includes('placeholder') &&
      (book.coverUrl.startsWith('http://') || book.coverUrl.startsWith('https://'));
    
    if (isWebUrl && currentRetries < maxRetries) {
      // Retry using ref to avoid re-render
      imageRetryCountsRef.current[book.id] = currentRetries + 1;
      
      // Force reload by adding cache-busting parameter
      const separator = book.coverUrl.includes('?') ? '&' : '?';
      e.target.src = `${book.coverUrl}${separator}_retry=${currentRetries + 1}`;
    } else {
      // Mark as failed in ref immediately to prevent flickering
      failedImagesRef.current.add(book.id);
      pendingFailedUpdatesRef.current.add(book.id);
      
      // Batch update state after a short delay to prevent flickering
      setTimeout(() => {
        if (pendingFailedUpdatesRef.current.size > 0) {
          setFailedImages(prev => {
            const newSet = new Set([...prev, ...pendingFailedUpdatesRef.current]);
            pendingFailedUpdatesRef.current.clear();
            return newSet;
          });
        }
      }, 100);
    }
  };

  return (
    <div key={book.id} className="group relative">
      <button
        onClick={onClick}
        className="w-full"
      >
        <div className="transform transition-all hover:scale-105 hover:-translate-y-2">
          {isFailed ? (
            // Text fallback when image fails after retries
            <div className="w-32 h-48 rounded-lg shadow-xl border-2 border-white/50 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-3 text-center">
              <div className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                {book.title}
              </div>
              {book.author && (
                <div className="text-white/90 text-xs leading-tight line-clamp-2">
                  {book.author}
                </div>
              )}
            </div>
          ) : (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-32 h-48 object-cover rounded-lg shadow-xl border-2 border-white/50"
              onError={handleImageError}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
            <span className="text-white text-xs font-semibold truncate w-full">{book.title}</span>
          </div>
        </div>
        {book.rating > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        )}
      </button>
    </div>
  );
}

