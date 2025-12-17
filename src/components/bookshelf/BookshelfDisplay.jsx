import React from 'react';
import TableView from './TableView';
import BookCard from './BookCard';
import BookSpine from './BookSpine';
import { ANIMAL_THEMES } from '../../constants/animalThemes';

/**
 * BookshelfDisplay Component
 * Main component that orchestrates the display of books in different modes
 * 
 * @param {object} activeShelf - Currently active bookshelf
 * @param {array} filteredBooks - Filtered list of books to display
 * @param {array} allBooksWithBookshelf - All books with bookshelf information (for table view)
 * @param {number} totalBookshelves - Total number of bookshelves
 * @param {object} failedImages - Set of book IDs with failed images
 * @param {object} failedImagesRef - Ref object tracking failed images
 * @param {object} imageRetryCountsRef - Ref object tracking retry counts
 * @param {object} pendingFailedUpdatesRef - Ref object for batching updates
 * @param {function} setFailedImages - State setter for failed images
 * @param {function} onBookClick - Callback when a book is clicked
 * @param {function} onExportCSV - Callback to export to CSV
 * @param {function} onExportJSON - Callback to export to JSON
 * @param {function} onImport - Callback when file is imported
 */
export default function BookshelfDisplay({
  activeShelf,
  filteredBooks,
  allBooksWithBookshelf,
  totalBookshelves,
  failedImages,
  failedImagesRef,
  imageRetryCountsRef,
  pendingFailedUpdatesRef,
  setFailedImages,
  onBookClick,
  onExportCSV,
  onExportJSON,
  onImport
}) {
  const theme = activeShelf ? ANIMAL_THEMES[activeShelf.animal] || ANIMAL_THEMES.cat : ANIMAL_THEMES.cat;

  return (
    <div className={`bg-gradient-to-b ${theme.colors.primary} rounded-2xl shadow-2xl p-8 relative overflow-hidden`}>
      {/* Animal Stickers - Decorative elements in corners */}
      {theme.decorations && theme.decorations.length > 0 && (
        <>
          {/* Top-left sticker */}
          <div className="absolute top-2 left-2 text-4xl sm:text-5xl opacity-30 pointer-events-none z-0 transform rotate-12">
            {theme.decorations[0]}
          </div>
          {/* Top-right sticker (positioned below main character) */}
          {theme.decorations[1] && (
            <div className="absolute top-20 right-4 text-3xl sm:text-4xl opacity-30 pointer-events-none z-0 transform -rotate-12">
              {theme.decorations[1]}
            </div>
          )}
          {/* Bottom-left sticker */}
          {theme.decorations[2] && (
            <div className="absolute bottom-16 left-2 text-3xl sm:text-4xl opacity-25 pointer-events-none z-0 transform rotate-6">
              {theme.decorations[2]}
            </div>
          )}
          {/* Bottom-right sticker */}
          {theme.decorations[3] && (
            <div className="absolute bottom-16 right-2 text-3xl sm:text-4xl opacity-25 pointer-events-none z-0 transform -rotate-6">
              {theme.decorations[3]}
            </div>
          )}
        </>
      )}
      
      {/* Main Animal Character - Large emoji or GIF in top-right corner */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        {theme.gifUrl ? (
          <img 
            src={theme.gifUrl} 
            alt={theme.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain opacity-80"
            onError={(e) => {
              // Fallback to emoji if GIF fails to load
              e.target.style.display = 'none';
              const container = e.target.parentElement;
              const emojiFallback = container.querySelector('.emoji-fallback');
              if (emojiFallback) emojiFallback.style.display = 'block';
            }}
          />
        ) : null}
        <div 
          className={`emoji-fallback text-5xl sm:text-6xl opacity-70`}
          style={{ display: theme.gifUrl ? 'none' : 'block' }}
        >
          {theme.emoji}
        </div>
      </div>
      
      <div className={`bg-white/20 rounded-xl p-6 min-h-[400px] relative z-10`}>
        {filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white">
            <div className="text-8xl mb-4 opacity-75 animate-bounce">📚</div>
            <p className="text-xl font-semibold mb-2">Ready to start your reading adventure? 🚀</p>
            <p className="text-sm opacity-90">Your bookshelf is waiting for its first book! Click the + button to add one and let the magic begin! ✨</p>
          </div>
        ) : (
          activeShelf?.displayMode === 'table' ? (
            <TableView
              books={allBooksWithBookshelf}
              totalBookshelves={totalBookshelves}
              onBookClick={onBookClick}
              onExportCSV={onExportCSV}
              onExportJSON={onExportJSON}
              onImport={onImport}
            />
          ) : (
            <div className={`flex ${activeShelf?.displayMode === 'spines' ? 'flex-wrap gap-3 items-end' : 'flex-wrap gap-4'}`}>
              {filteredBooks.map((book, index) => (
                activeShelf?.displayMode === 'spines' ? (
                  <BookSpine
                    key={book.id}
                    book={book}
                    index={index}
                    onClick={onBookClick}
                  />
                ) : (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFailed={failedImages.has(book.id) || failedImagesRef.current.has(book.id)}
                    imageRetryCountsRef={imageRetryCountsRef}
                    failedImagesRef={failedImagesRef}
                    pendingFailedUpdatesRef={pendingFailedUpdatesRef}
                    setFailedImages={setFailedImages}
                    onClick={onBookClick}
                  />
                )
              ))}
            </div>
          )
        )}
      </div>
      <div className="mt-4 h-4 bg-black/20 rounded-b-xl"></div>
      <div className="absolute bottom-4 left-4 text-white font-semibold">
        {filteredBooks.length} / {activeShelf?.books.length || 0} books
        {activeShelf?.type === 'regular' && ` (${activeShelf.books.length}/10)`}
        {activeShelf?.type === 'wishlist' && ` (unlimited)`}
        {activeShelf?.type === 'favorites' && ` (unlimited)`}
        {activeShelf?.type === 'shared_with_me' && ` (unlimited)`}
      </div>
    </div>
  );
}

