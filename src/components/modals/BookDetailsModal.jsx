import React, { useState, useEffect } from 'react';
import { X, Star, User, Heart, Upload, Image as ImageIcon, Library, Save } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants/animalThemes';
import { getPlaceholderImage } from '../../utils/imageHelpers';

/**
 * BookDetailsModal Component
 * Modal for viewing and editing book details
 * 
 * @param {boolean} show - Whether to show the modal
 * @param {object} selectedBook - The book object being viewed/edited
 * @param {function} setSelectedBook - Function to update the selected book state
 * @param {object} currentUser - Current logged in user
 * @param {object} userProfile - User profile data (name, avatar)
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
  currentUser,
  userProfile,
  onClose,
  onUpdateBook,
  onImageUpload,
  onDeleteBook,
  onMoveBook
}) {
  const [localBook, setLocalBook] = useState(selectedBook);
  const [originalBook, setOriginalBook] = useState(selectedBook);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local book and original when selectedBook changes (modal opens or book changes)
  useEffect(() => {
    if (selectedBook) {
      setLocalBook(selectedBook);
      setOriginalBook(selectedBook);
      setHasUnsavedChanges(false);
    }
  }, [selectedBook?.id]); // Only reset when the book ID changes (different book selected)

  if (!show || !selectedBook) return null;

  // Get theme based on bookshelf animal
  const bookshelfAnimal = selectedBook.bookshelfAnimal || localBook?.bookshelfAnimal || 'cat';
  const theme = ANIMAL_THEMES[bookshelfAnimal] || ANIMAL_THEMES.cat;

  const handleUpdate = (updates) => {
    // Update local state immediately for UI responsiveness
    const updatedBook = { ...localBook, ...updates };
    setLocalBook(updatedBook);
    
    // Check if there are actual changes compared to original
    const hasChanges = Object.keys(updates).some(key => {
      const originalValue = originalBook?.[key];
      const newValue = updatedBook[key];
      // Handle null/undefined/empty string comparisons
      const orig = originalValue === null || originalValue === undefined ? '' : String(originalValue);
      const updated = newValue === null || newValue === undefined ? '' : String(newValue);
      return orig.trim() !== updated.trim();
    });
    
    setHasUnsavedChanges(hasChanges);
  };

  const handleSave = () => {
    if (hasUnsavedChanges && localBook) {
      // Calculate what actually changed compared to original
      const updates = {};
      Object.keys(localBook).forEach(key => {
        if (key !== 'id' && key !== 'bookshelfName' && key !== 'bookshelfAnimal') {
          const originalValue = originalBook?.[key];
          const newValue = localBook[key];
          // Handle null/undefined/empty string comparisons
          const orig = originalValue === null || originalValue === undefined ? '' : String(originalValue);
          const updated = newValue === null || newValue === undefined ? '' : String(newValue);
          if (orig.trim() !== updated.trim()) {
            updates[key] = localBook[key];
          }
        }
      });
      
      if (Object.keys(updates).length > 0) {
        onUpdateBook(selectedBook.id, updates);
        // Update original book to reflect saved state
        setOriginalBook({ ...localBook });
        setHasUnsavedChanges(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`bg-gradient-to-br ${theme.colors.primary} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 border-b border-white/30 flex items-center justify-between sticky top-0 bg-gradient-to-r ${theme.colors.primary} z-10 backdrop-blur-sm`}>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">{userProfile?.avatar || '📚'}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">{localBook?.title || selectedBook.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 bg-white/95 backdrop-blur-sm">
          <div className="flex gap-6 mb-6">
            <div className="relative">
              <img
                src={localBook?.coverUrl || selectedBook.coverUrl}
                alt={localBook?.title || selectedBook.title}
                className="w-40 h-60 object-cover rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.src = getPlaceholderImage(localBook?.title || selectedBook.title);
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
              <label className={`absolute bottom-2 right-2 bg-gradient-to-r ${theme.colors.primary} text-white p-2 rounded-lg hover:opacity-90 transition-colors cursor-pointer shadow-lg`} title="Upload new image">
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
                <span className="text-lg font-medium text-gray-700">
                  {(localBook?.author || selectedBook.author) && (localBook?.author || selectedBook.author).trim() ? (localBook?.author || selectedBook.author) : 'Unknown Author'}
                </span>
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
                      className={`w-6 h-6 ${star <= (localBook?.rating ?? selectedBook.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={localBook?.startDate || selectedBook.startDate || ''}
                    onChange={(e) => handleUpdate({ startDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finish Date</label>
                  <input
                    type="date"
                    value={localBook?.finishDate || selectedBook.finishDate || ''}
                    onChange={(e) => handleUpdate({ finishDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={localBook?.description || selectedBook.description || ''}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-20"
                  placeholder="Book description"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className={`font-semibold ${theme.colors.accent} mb-2 flex items-center gap-2`}>
              <Heart className={`w-5 h-5 ${theme.colors.accent}`} />
              Favorite Character
            </h3>
            <textarea
              value={localBook?.favoriteCharacter || selectedBook.favoriteCharacter || ''}
              onChange={(e) => handleUpdate({ favoriteCharacter: e.target.value })}
              className={`w-full px-4 py-2 border-2 ${theme.colors.secondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
              placeholder="Your favorite character from the book"
            />
          </div>

          <div className="mb-4">
            <h3 className={`font-semibold ${theme.colors.accent} mb-2`}>Scene Summary</h3>
            <textarea
              value={localBook?.sceneSummary || selectedBook.sceneSummary || ''}
              onChange={(e) => handleUpdate({ sceneSummary: e.target.value })}
              className={`w-full px-4 py-2 border-2 ${theme.colors.secondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
              placeholder="Memorable scene or summary"
            />
          </div>

          <div className="mb-4">
            <h3 className={`font-semibold ${theme.colors.accent} mb-2`}>Memorable Moments</h3>
            <textarea
              value={localBook?.memorableMoments || selectedBook.memorableMoments || ''}
              onChange={(e) => handleUpdate({ memorableMoments: e.target.value })}
              className={`w-full px-4 py-2 border-2 ${theme.colors.secondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
              placeholder="Memorable moments from the book"
            />
          </div>

          <div className="mb-4">
            <h3 className={`font-semibold ${theme.colors.accent} mb-2`}>Review</h3>
            <textarea
              value={localBook?.review || selectedBook.review || ''}
              onChange={(e) => handleUpdate({ review: e.target.value })}
              className={`w-full px-4 py-2 border-2 ${theme.colors.secondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24`}
              placeholder="Your review of the book"
            />
          </div>

          {(localBook?.rating ?? selectedBook.rating) <= 2 && (localBook?.rating ?? selectedBook.rating) > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Least Favorite Part</h3>
              <textarea
                value={localBook?.leastFavoritePart || selectedBook.leastFavoritePart || ''}
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
                href={`https://www.sno-isle.org/catalog?q=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Library className="w-4 h-4" />
                Sno-Isle Libraries
              </a>
              <a
                href={`https://kcls.bibliocommons.com/v2/search?query=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
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
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex-1 py-3 bg-gradient-to-r ${theme.colors.primary} text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              title={hasUnsavedChanges ? 'Click to save your changes to the database' : 'All changes have been saved'}
            >
              <Save className="w-5 h-5" />
              {hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved ✓'}
            </button>
            <button
              onClick={() => onMoveBook(selectedBook)}
              className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              Move to Another Bookshelf
            </button>
            <button
              onClick={() => onDeleteBook(selectedBook.id)}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
            >
              Remove from Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

