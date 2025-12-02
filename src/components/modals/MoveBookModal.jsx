import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants/animalThemes';
import { getPlaceholderImage } from '../../utils/imageHelpers';

/**
 * MoveBookModal Component
 * Allows users to move a book from one bookshelf to another
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} bookToMove - The book object to move
 * @param {array} bookshelves - Array of all bookshelves
 * @param {function} onClose - Callback to close the modal
 * @param {function} onMove - Callback to handle moving the book (bookId, targetShelfId)
 */
export default function MoveBookModal({ show, bookToMove, bookshelves, onClose, onMove }) {
  if (!show || !bookToMove) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Move Book</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex gap-4 items-center">
              <img
                src={bookToMove.coverUrl}
                alt={bookToMove.title}
                className="w-24 h-36 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = getPlaceholderImage(bookToMove.title);
                }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{bookToMove.title}</h3>
                <p className="text-gray-600">{bookToMove.author || 'Unknown Author'}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Destination Bookshelf</label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bookshelves
                .filter(shelf => {
                  // Don't show the current shelf the book is in
                  const currentShelf = bookshelves.find(s => s.books.some(b => b.id === bookToMove.id));
                  return shelf.id !== currentShelf?.id;
                })
                .map((shelf) => {
                  const theme = ANIMAL_THEMES[shelf.animal] || ANIMAL_THEMES.cat;
                  const isFull = shelf.type === 'regular' && shelf.books.length >= 10;
                  const isSpecialShelf = shelf.type === 'wishlist' || shelf.type === 'favorites';
                  return (
                    <button
                      key={shelf.id}
                      onClick={() => !isFull && onMove(bookToMove.id, shelf.id)}
                      disabled={isFull}
                      className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                        isFull
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                      title={isSpecialShelf ? 'Unlimited capacity' : ''}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{theme.emoji}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{shelf.name}</div>
                            <div className="text-sm text-gray-600">
                              {shelf.type === 'wishlist' && '❤️ Wishlist'}
                              {shelf.type === 'favorites' && '⭐ Favorites (unlimited)'}
                              {(!shelf.type || shelf.type === 'regular') && `${shelf.books.length}/10 books`}
                            </div>
                          </div>
                        </div>
                        {isFull && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Full</span>
                        )}
                        {isSpecialShelf && !isFull && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Unlimited</span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

