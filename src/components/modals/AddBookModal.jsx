import React from 'react';
import { X, Star, Upload, Image as ImageIcon } from 'lucide-react';

/**
 * AddBookModal Component
 * Modal for adding a new book to the bookshelf
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} newBook - The new book object being created
 * @param {function} setNewBook - Function to update the new book state
 * @param {string} searchQuery - Current search query
 * @param {array} searchResults - Array of search results
 * @param {boolean} isSearching - Whether a search is in progress
 * @param {function} onClose - Callback to close the modal
 * @param {function} onSearchChange - Callback when search input changes
 * @param {function} onSelectResult - Callback when a search result is selected
 * @param {function} onImageUpload - Callback when an image is uploaded
 * @param {function} onAddBook - Callback to add the book
 */
export default function AddBookModal({
  show,
  newBook,
  setNewBook,
  searchQuery,
  searchResults,
  isSearching,
  onClose,
  onSearchChange,
  onSelectResult,
  onImageUpload,
  onAddBook
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close modal">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Book Title, Author, or ISBN *</label>
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type to search for books by title, author, or ISBN..."
            />
            {isSearching && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Search Results (click to select):</p>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => onSelectResult(result)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded flex gap-3 mb-2"
                >
                  <img src={result.coverUrl} alt={result.title} className="w-10 h-14 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{result.title}</div>
                    <div className="text-xs text-gray-600">{result.author}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">Or enter book details manually:</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Book Title *</label>
            <input
              type="text"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter book title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
              <span className="ml-2 text-xs text-indigo-600 font-normal">(Used for AI recommendations)</span>
            </label>
            <input
              type="text"
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre
              <span className="ml-2 text-xs text-indigo-600 font-normal">(Used for AI recommendations)</span>
            </label>
            <input
              type="text"
              value={newBook.genre || ''}
              onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Fiction, Mystery, Science Fiction, Romance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Book Cover Image</label>
            <div className="space-y-3">
              {/* Image Preview */}
              {newBook.coverUrl && (
                <div className="relative w-32 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={newBook.coverUrl}
                    alt="Book cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {(newBook.coverUrl.startsWith('data:') || 
                    (newBook.coverUrl && !newBook.coverUrl.includes('placeholder') && !newBook.coverUrl.startsWith('http'))) && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{newBook.coverUrl.startsWith('data:') ? 'Base64' : 'Storage'}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setNewBook({ ...newBook, coverUrl: '' })}
                    className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {/* Upload Button */}
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer w-fit">
                <Upload className="w-5 h-5" />
                <span>{newBook.coverUrl ? 'Change Image' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageUpload(e, false)}
                  className="hidden"
                />
              </label>
              
              {/* URL Input (alternative) */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Or enter image URL:</label>
                <input
                  type="text"
                  value={newBook.coverUrl && !newBook.coverUrl.startsWith('data:') ? newBook.coverUrl : ''}
                  onChange={(e) => setNewBook({ ...newBook, coverUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Image URL (auto-filled from search)"
                />
                <p className="text-xs text-gray-500 mt-1">Uploaded images are saved with your book</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
              <span className="ml-2 text-xs text-indigo-600 font-normal">(Used for AI recommendations)</span>
            </label>
            <textarea
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Book description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={newBook.startDate}
                onChange={(e) => setNewBook({ ...newBook, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Finish Date</label>
              <input
                type="date"
                value={newBook.finishDate}
                onChange={(e) => setNewBook({ ...newBook, finishDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                <span>💡</span>
                <span>Add a finish date to count this book toward your reading challenges and earn XP!</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewBook({ ...newBook, rating: star })}
                  className="transition-transform hover:scale-110"
                  title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 ${star <= newBook.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
            {newBook.rating <= 2 && newBook.rating > 0 && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Least Favorite Part *</label>
                <textarea
                  value={newBook.leastFavoritePart}
                  onChange={(e) => setNewBook({ ...newBook, leastFavoritePart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                  placeholder="What did you not like about this book?"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Character
              <span className="ml-2 text-xs text-indigo-600 font-normal">(Used for AI recommendations)</span>
            </label>
            <input
              type="text"
              value={newBook.favoriteCharacter}
              onChange={(e) => setNewBook({ ...newBook, favoriteCharacter: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your favorite character"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review
              <span className="ml-2 text-xs text-indigo-600 font-normal">(Used for AI recommendations & writing feedback)</span>
            </label>
            <textarea
              value={newBook.review}
              onChange={(e) => setNewBook({ ...newBook, review: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Your review of the book"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scene Summary</label>
            <textarea
              value={newBook.sceneSummary}
              onChange={(e) => setNewBook({ ...newBook, sceneSummary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Memorable scene or summary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Memorable Moments</label>
            <textarea
              value={newBook.memorableMoments}
              onChange={(e) => setNewBook({ ...newBook, memorableMoments: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Memorable moments from the book"
            />
          </div>

          <button
            onClick={onAddBook}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-medium"
            title="Add this book to your library"
          >
            Add to Library
          </button>
        </div>
      </div>
    </div>
  );
}

