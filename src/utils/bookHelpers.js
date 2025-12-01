/**
 * Book Helper Utilities
 * 
 * Provides utility functions for book-related operations,
 * including date formatting, statistics calculation, and data transformation.
 */

/**
 * Formats a date string for display
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string (MM/DD/YYYY) or empty string
 */
export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch (error) {
    return '';
  }
};

/**
 * Calculates the number of books read this month
 * @param {Array} books - Array of book objects
 * @returns {number} - Count of books finished this month
 */
export const getBooksReadThisMonth = (books) => {
  if (!books || !Array.isArray(books)) return 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return books.filter(book => {
    if (!book.finishDate) return false;
    const finishDate = new Date(book.finishDate);
    return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
  }).length;
};

/**
 * Calculates the average books per month
 * @param {Array} books - Array of book objects
 * @returns {number} - Average books per month (rounded to 1 decimal)
 */
export const calculateAverageBooksPerMonth = (books) => {
  if (!books || books.length === 0) return 0;
  
  const finishedBooks = books.filter(b => b.finishDate);
  if (finishedBooks.length === 0) return 0;
  
  const dates = finishedBooks.map(b => new Date(b.finishDate)).sort((a, b) => a - b);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  
  if (!firstDate || !lastDate) return 0;
  
  const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                     (lastDate.getMonth() - firstDate.getMonth()) + 1;
  
  return monthsDiff > 0 ? (finishedBooks.length / monthsDiff).toFixed(1) : finishedBooks.length;
};

/**
 * Finds the most read author from a list of books
 * @param {Array} books - Array of book objects
 * @returns {string} - The author with the most books, or 'N/A'
 */
export const findMostReadAuthor = (books) => {
  if (!books || books.length === 0) return 'N/A';
  
  const authorCounts = {};
  books.forEach(book => {
    if (book.author) {
      authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
    }
  });
  
  const sortedAuthors = Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a);
  
  return sortedAuthors.length > 0 ? sortedAuthors[0][0] : 'N/A';
};

