/**
 * Genre Color Mapping
 * 
 * Maps book genres to color schemes for visual badges
 */

export const GENRE_COLORS = {
  // Fiction genres
  'Fiction': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  'Science Fiction': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  'Fantasy': { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600' },
  'Mystery': { bg: 'bg-gray-700', text: 'text-white', border: 'border-gray-800' },
  'Thriller': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
  'Horror': { bg: 'bg-black', text: 'text-white', border: 'border-gray-900' },
  'Romance': { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
  'Historical Fiction': { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700' },
  'Literary Fiction': { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
  
  // Non-fiction genres
  'Biography': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  'Autobiography': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
  'History': { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-800' },
  'Science': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  'Philosophy': { bg: 'bg-slate-600', text: 'text-white', border: 'border-slate-700' },
  'Self-Help': { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
  'Business': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  'Health': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
  'Travel': { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-600' },
  'Cooking': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  'Art': { bg: 'bg-violet-500', text: 'text-white', border: 'border-violet-600' },
  'Music': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
  'Sports': { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-600' },
  'Education': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  'Religion': { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-700' },
  'Psychology': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
  
  // Other common genres
  'Young Adult': { bg: 'bg-pink-400', text: 'text-white', border: 'border-pink-500' },
  'Children': { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-500' },
  'Poetry': { bg: 'bg-purple-400', text: 'text-white', border: 'border-purple-500' },
  'Drama': { bg: 'bg-red-700', text: 'text-white', border: 'border-red-800' },
  'Comedy': { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-600' },
  'Adventure': { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700' },
  'Crime': { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-900' },
  'Dystopian': { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900' },
  'Western': { bg: 'bg-amber-800', text: 'text-white', border: 'border-amber-900' },
  'War': { bg: 'bg-red-800', text: 'text-white', border: 'border-red-900' },
};

/**
 * Get color scheme for a genre
 * @param {string} genre - The genre name
 * @returns {object} Color scheme object with bg, text, and border classes
 */
export const getGenreColor = (genre) => {
  if (!genre) return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' };
  
  // Normalize genre string
  const normalized = genre.trim();
  
  // Check for exact match first
  if (GENRE_COLORS[normalized]) {
    return GENRE_COLORS[normalized];
  }
  
  // Check for partial matches (case-insensitive)
  const lowerGenre = normalized.toLowerCase();
  for (const [key, colors] of Object.entries(GENRE_COLORS)) {
    if (lowerGenre.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerGenre)) {
      return colors;
    }
  }
  
  // Default color for unknown genres
  return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' };
};

/**
 * Get a shortened genre name for display
 * @param {string} genre - The full genre name
 * @param {number} maxLength - Maximum length (default: 12)
 * @returns {string} Shortened genre name
 */
export const getShortGenreName = (genre, maxLength = 12) => {
  if (!genre) return '';
  if (genre.length <= maxLength) return genre;
  return genre.substring(0, maxLength - 3) + '...';
};

