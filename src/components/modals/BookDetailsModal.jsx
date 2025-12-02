import React from 'react';
import { X, Star, User, Heart, Upload, Image as ImageIcon, Library } from 'lucide-react';

/**
 * BookDetailsModal Component
 * Modal for viewing and editing book details
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} selectedBook - The book object being viewed/edited
 * @param {function} setSelectedBook - Function to update the selected book state
 * @param {function} onClose - Callback to close the modal
 * @param {function} onUpdateBook - Callback to update book (bookId, updates)
 * @param {function} onImageUpload - Callback when an image is uploaded (event, isEditing)
 * @param {function} onDeleteBook - Callback to delete the book (bookId)
 * @param {function} onMoveBook - Callback to open move book modal (book)
 */
export default function BookDetailsModal({
  show,
  selectedBook,
  setSelectedBook,
  onClose,
  onUpdateBook,
  onImageUpload,
  onDeleteBook,
  onMoveBook
}) {
  if (!show || !selectedBook) return null;

  const handleUpdate = (updates) => {
    onUpdateBook(selectedBook.id, updates);
    setSelectedBook({ ...selectedBook, ...updates });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <h2 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-6 mb-6">
            <div className="relative">
              <img
                src={selectedBook.coverUrl}
                alt={selectedBook.title}
                className="w-40 h-60 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(selectedBook.title)}`;
                }}
              />
              {selectedBook.coverUrl && 
               !selectedBook.coverUrl.includes('placeholder') && 
               (selectedBook.coverUrl.startsWith('data:') || !selectedBook.coverUrl.startsWith('http')) && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                  <ImageIcon className="w-3 h-3" />
                  <span>{selectedBook.coverUrl.startsWith('data:') ? 'Base64' : 'Storage'}</span>
                </div>
              )}
              {/* Upload overlay button */}
              <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-lg" title="Upload new image">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageUpload(e, true)}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-lg font-medium text-gray-700">{selectedBook.author || 'Unknown Author'}</span>
              </div>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      const updates = { rating: star };
                      if (star > 2) {
                        updates.leastFavoritePart = '';
                      }
                      handleUpdate(updates);
                    }}
                  >
                    <Star
                      className={`w-6 h-6 ${star <= selectedBook.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={selectedBook.startDate || ''}
                    onChange={(e) => handleUpdate({ startDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                  <input
                    type="date"
                    value={selectedBook.finishDate || ''}
                    onChange={(e) => handleUpdate({ finishDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedBook.description || ''}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-20"
                  placeholder="Book description"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Favorite Character
            </h3>
            <textarea
              value={selectedBook.favoriteCharacter || ''}
              onChange={(e) => handleUpdate({ favoriteCharacter: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-pink-50 h-24"
              placeholder="Your favorite character from the book"
            />
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Scene Summary</h3>
            <textarea
              value={selectedBook.sceneSummary || ''}
              onChange={(e) => handleUpdate({ sceneSummary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-purple-50 h-24"
              placeholder="Memorable scene or summary"
            />
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Memorable Moments</h3>
            <textarea
              value={selectedBook.memorableMoments || ''}
              onChange={(e) => handleUpdate({ memorableMoments: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-blue-50 h-24"
              placeholder="Memorable moments from the book"
            />
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Review</h3>
            <textarea
              value={selectedBook.review || ''}
              onChange={(e) => handleUpdate({ review: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-green-50 h-24"
              placeholder="Your review of the book"
            />
          </div>

          {selectedBook.rating <= 2 && selectedBook.rating > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Least Favorite Part</h3>
              <textarea
                value={selectedBook.leastFavoritePart || ''}
                onChange={(e) => handleUpdate({ leastFavoritePart: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                placeholder="What did you not like about this book?"
              />
            </div>
          )}

          {/* Library Availability Checker */}
          <div className="mb-6 mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Library className="w-5 h-5 text-blue-600" />
              Check Library Availability
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Check if this book is available at your local libraries
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.sno-isle.org/catalog?q=${encodeURIComponent(selectedBook.title + (selectedBook.author ? ' ' + selectedBook.author : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Library className="w-4 h-4" />
                Sno-Isle Libraries
              </a>
              <a
                href={`https://kcls.bibliocommons.com/v2/search?query=${encodeURIComponent(selectedBook.title + (selectedBook.author ? ' ' + selectedBook.author : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Library className="w-4 h-4" />
                KCLS (King County)
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Opens library catalog in a new tab. You may need to search manually if the book isn't found automatically.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onMoveBook(selectedBook)}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Move to Another Bookshelf
            </button>
            <button
              onClick={() => onDeleteBook(selectedBook.id)}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Remove from Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

