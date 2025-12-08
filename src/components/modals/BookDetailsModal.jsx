import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, User, Heart, Upload, Image as ImageIcon, Library, Save, Sparkles, ChevronDown, ChevronUp, ShoppingCart, Book, Share2, UserCheck } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants/animalThemes';
import { getPlaceholderImage } from '../../utils/imageHelpers';
import { getBookFacts, addBookFacts } from '../../services/gamificationService';
import { generateBookFacts } from '../../utils/bookFactsGenerator';
import { getUserProfile } from '../../services/userService';
import ShareBookModal from './ShareBookModal';

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
  const [bookFacts, setBookFacts] = useState([]);
  const [isLoadingFacts, setIsLoadingFacts] = useState(false);
  const [isGetBookExpanded, setIsGetBookExpanded] = useState(true); // Expanded by default
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharerProfile, setSharerProfile] = useState(null);

  // Load book facts from database, or generate and save them if they don't exist
  const loadBookFacts = useCallback(async () => {
    if (!selectedBook?.id) {
      setBookFacts([]);
      return;
    }

    setIsLoadingFacts(true);
    try {
      const { data, error } = await getBookFacts(selectedBook.id);
      
      if (error) {
        // If table doesn't exist or other error, just skip facts - don't crash
        console.warn('Book facts not available:', error.message || error);
        setBookFacts([]);
      } else if (data && data.length > 0) {
        // Facts exist, use them (handle different possible column names)
        setBookFacts(data.map(fact => fact.fact_text || fact.content || fact.fact || fact.text || '').filter(f => f));
      } else {
        // No facts exist, generate and save them
        try {
          const facts = generateBookFacts(selectedBook.title, selectedBook.author, 3);
          if (facts.length > 0) {
            try {
              const { data: savedFacts, error: saveError } = await addBookFacts(selectedBook.id, facts);
              if (!saveError && savedFacts) {
                setBookFacts(facts);
              } else {
                // If save fails (maybe table doesn't exist), still show facts
                console.warn('Could not save book facts:', saveError?.message || saveError);
                setBookFacts(facts);
              }
            } catch (saveErr) {
              // If save throws error, still show facts
              console.warn('Error saving book facts:', saveErr);
              setBookFacts(facts);
            }
          }
        } catch (genErr) {
          console.warn('Error generating book facts:', genErr);
          setBookFacts([]);
        }
      }
    } catch (error) {
      // Catch any unexpected errors and continue - don't crash the component
      console.warn('Error in loadBookFacts:', error);
      setBookFacts([]);
    } finally {
      setIsLoadingFacts(false);
    }
  }, [selectedBook?.id, selectedBook?.title, selectedBook?.author]);

  // Update local book and original when selectedBook changes (modal opens or book changes)
  useEffect(() => {
    if (selectedBook) {
      setLocalBook(selectedBook);
      setOriginalBook(selectedBook);
      setHasUnsavedChanges(false);
      loadBookFacts();
    }
  }, [selectedBook?.id, loadBookFacts]); // Only reset when the book ID changes (different book selected)

  // Load sharer profile if book is shared
  useEffect(() => {
    const loadSharerProfile = async () => {
      if (selectedBook?.sharedBy && selectedBook.sharedBy !== currentUser?.id) {
        const { data: profile } = await getUserProfile(selectedBook.sharedBy);
        setSharerProfile(profile);
      } else {
        setSharerProfile(null);
      }
    };
    
    if (show && selectedBook) {
      loadSharerProfile();
    }
  }, [show, selectedBook?.sharedBy, currentUser?.id]);

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
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors" title="Close modal">
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
              {/* Sharer information */}
              {(localBook?.sharedBy || selectedBook?.sharedBy) && (localBook?.sharedBy || selectedBook?.sharedBy) !== currentUser?.id && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Shared by: <span className="font-semibold">{sharerProfile?.name || sharerProfile?.username || 'Unknown User'}</span>
                    {sharerProfile?.avatar && <span className="ml-2">{sharerProfile.avatar}</span>}
                  </span>
                </div>
              )}
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                <input
                  type="text"
                  value={localBook?.genre || selectedBook.genre || ''}
                  onChange={(e) => handleUpdate({ genre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g., Fiction, Mystery, Science Fiction"
                />
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
            <label className={`block font-semibold ${theme.colors.accent} mb-2 flex items-center gap-2`}>
              <Heart className={`w-5 h-5 ${theme.colors.accent}`} />
              Favorite Character ✨ (Helps AI find your perfect reads!)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              🎯 Tell us about characters that made an impact! Our AI uses this to understand what types of characters and stories resonate with you, helping suggest books with similar compelling characters.
            </p>
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
            <label className={`block font-semibold ${theme.colors.accent} mb-2`}>
              Review ✨ (Helps AI find your perfect reads!)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              🎯 Share your thoughts about what you loved (or didn't) about this book! Our AI analyzes your reviews to understand your reading preferences and suggest books that match your taste and interests.
            </p>
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

          {/* Book Facts Section */}
          {bookFacts.length > 0 && (
            <div className="mb-6 mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Fun Book Facts!
              </h3>
              {isLoadingFacts ? (
                <p className="text-sm text-gray-600">✨ Loading fun facts about this book...</p>
              ) : (
                <ul className="space-y-2">
                  {bookFacts.map((fact, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-lg">✨</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Get the Book Section - Collapsible */}
          <div className="mb-6 mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsGetBookExpanded(!isGetBookExpanded);
              }}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-100/50 transition-colors rounded-lg"
              title={isGetBookExpanded ? "Click to collapse" : "Click to see where to get this book"}
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Library className="w-5 h-5 text-blue-600" />
                Get the Book
              </h3>
              {isGetBookExpanded ? (
                <ChevronUp className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-600" />
              )}
            </button>
            {isGetBookExpanded && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-sm text-gray-600">
                  Find this book at libraries, bookstores, or online retailers
                </p>
                
                {/* Libraries */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">📚 Public Libraries</h4>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.sno-isle.org/search?q=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Library className="w-4 h-4" />
                      Sno-Isle Libraries
                    </a>
                    <a
                      href={`https://kcls.bibliocommons.com/v2/search?query=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Library className="w-4 h-4" />
                      KCLS (King County)
                    </a>
                    <a
                      href={`https://seattle.bibliocommons.com/v2/search?query=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Library className="w-4 h-4" />
                      Seattle Public Library
                    </a>
                  </div>
                </div>

                {/* Online Retailers */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">🛒 Online Retailers</h4>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.amazon.com/s?k=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Amazon
                    </a>
                    <a
                      href={`https://www.barnesandnoble.com/s/${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Barnes & Noble
                    </a>
                    <a
                      href={`https://www.goodreads.com/search?q=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Book className="w-4 h-4" />
                      Goodreads
                    </a>
                    <a
                      href={`https://www.thriftbooks.com/browse/?b.search=${encodeURIComponent((localBook?.title || selectedBook.title) + ((localBook?.author || selectedBook.author) ? ' ' + (localBook?.author || selectedBook.author) : ''))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      ThriftBooks
                    </a>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Opens in a new tab. You may need to search manually if the book isn't found automatically.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex-1 py-3 bg-gradient-to-r ${theme.colors.primary} text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              title={hasUnsavedChanges ? 'Click to save your changes to the database' : 'All changes have been saved'}
            >
              <Save className="w-5 h-5" />
              {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg flex items-center justify-center gap-2"
              title="Share this book with other users or make it public"
            >
              <Share2 className="w-5 h-5" />
              Share Book
            </button>
            <button
              onClick={() => onMoveBook(selectedBook)}
              className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg"
              title="Move this book to another bookshelf"
            >
              Move Bookshelf
            </button>
            <button
              onClick={() => onDeleteBook(selectedBook.id)}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
              title="Remove this book from your library"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Share Book Modal */}
      <ShareBookModal
        show={showShareModal}
        book={selectedBook}
        currentUser={currentUser}
        onClose={() => setShowShareModal(false)}
        onShareSuccess={(shareData) => {
          // Update local book with sharing info
          handleUpdate(shareData);
          // Reload book data if needed
          if (onUpdateBook) {
            onUpdateBook(selectedBook.id, shareData);
          }
        }}
      />
    </div>
  );
}

