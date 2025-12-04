import React from 'react';
import { Star, Download, FileUp } from 'lucide-react';
import { getGenreColor } from '../../utils/genreColors';

/**
 * TableView Component
 * Displays books in a table format with export functionality
 * 
 * @param {array} books - Array of books with bookshelf information
 * @param {number} totalBookshelves - Total number of bookshelves
 * @param {function} onBookClick - Callback when a book is clicked
 * @param {function} onExportCSV - Callback to export to CSV
 * @param {function} onExportJSON - Callback to export to JSON
 * @param {function} onImport - Callback when file is imported
 */
export default function TableView({
  books,
  totalBookshelves,
  onBookClick,
  onExportCSV,
  onExportJSON,
  onImport
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          <span className="sm:hidden">Books</span>
          <span className="hidden sm:inline">All Books - Table View</span>
        </h3>
        <div className="flex gap-2">
          <label className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer">
            <FileUp className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".csv,.json"
              onChange={onImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={onExportJSON}
            className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium"
            title="Export to JSON"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[200px]">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[150px]">Author</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[100px]">Genre</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[120px]">Bookshelf</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b">Rating</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[110px]">Start Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[110px]">Finish Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[160px] whitespace-nowrap">Favorite Character</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Scene Summary</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Memorable Moments</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Review</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b min-w-[160px] whitespace-nowrap">Least Favorite Part</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book, index) => (
              <tr 
                key={book.id || index}
                className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                onClick={() => onBookClick(book)}
              >
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{book.title || '-'}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{book.author || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {book.genre ? (() => {
                    const genreColors = getGenreColor(book.genre);
                    return (
                      <span className={`px-2 py-1 ${genreColors.bg} ${genreColors.text} rounded text-xs font-semibold border ${genreColors.border}`}>
                        {book.genre}
                      </span>
                    );
                  })() : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    {book.bookshelfName || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {book.rating > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-gray-700">{book.rating}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{book.startDate || '-'}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{book.finishDate || '-'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.description || ''}>
                  {book.description || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.favoriteCharacter || ''}>
                  {book.favoriteCharacter || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.sceneSummary || ''}>
                  {book.sceneSummary || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.memorableMoments || ''}>
                  {book.memorableMoments || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.review || ''}>
                  {book.review || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={book.leastFavoritePart || ''}>
                  {book.leastFavoritePart || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600 border-t">
        Total: {books.length} books across {totalBookshelves} bookshelves
      </div>
    </div>
  );
}

