/**
 * Script to update book genres in the database
 * 
 * This script:
 * 1. Fetches all books from the database
 * 2. For each book, searches Open Library and Google Books API to find genre
 * 3. Updates the book's genre in the database
 * 
 * Usage: node scripts/updateBookGenres.js
 * 
 * Make sure to set your Supabase credentials in a .env file or environment variables:
 * VITE_SUPABASE_URL=your-supabase-url
 * VITE_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!SUPABASE_URL || SUPABASE_URL.includes('your-project') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon-key')) {
  console.error('❌ Error: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create a custom fetch that handles SSL certificate issues
// Note: This disables SSL verification - use only for local development
const customFetch = async (url, options = {}) => {
  try {
    // Use node-fetch with custom agent to handle SSL issues
    const { default: nodeFetch } = await import('node-fetch');
    const httpsAgent = new https.Agent({ 
      rejectUnauthorized: false // Disable SSL certificate verification
    });
    
    return nodeFetch(url, {
      ...options,
      agent: url.startsWith('https') ? httpsAgent : undefined
    });
  } catch (error) {
    console.error('Error in custom fetch:', error);
    throw new Error('node-fetch is required. Please run: npm install node-fetch');
  }
};

// Create Supabase client with custom fetch that handles SSL issues
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch
  }
});

/**
 * Search for book genre using Open Library API
 */
async function getGenreFromOpenLibrary(title, author) {
  try {
    const query = author ? `${title} ${author}` : title;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
    const response = await customFetch(url);
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      // Find the best match
      const bestMatch = data.docs.find(doc => {
        const docTitle = (doc.title || '').toLowerCase();
        const searchTitle = title.toLowerCase();
        return docTitle === searchTitle || docTitle.includes(searchTitle) || searchTitle.includes(docTitle);
      }) || data.docs[0];

      // Get subject/genre from Open Library
      if (bestMatch.subject) {
        // Open Library subjects can be genres
        const subjects = Array.isArray(bestMatch.subject) ? bestMatch.subject : [bestMatch.subject];
        // Filter out non-genre subjects (like "Fiction", "Juvenile fiction", etc. are okay)
        const genreSubjects = subjects.filter(s => 
          !s.toLowerCase().includes('accessible book') &&
          !s.toLowerCase().includes('protected daisy') &&
          !s.toLowerCase().includes('in library')
        );
        
        if (genreSubjects.length > 0) {
          // Return the first meaningful subject as genre
          return genreSubjects[0];
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error searching Open Library for "${title}":`, error.message);
    return null;
  }
}

/**
 * Search for book genre using Google Books API
 */
async function getGenreFromGoogleBooks(title, author) {
  try {
    const query = author ? `intitle:${title}+inauthor:${author}` : `intitle:${title}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
    const response = await customFetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Find the best match
      const bestMatch = data.items.find(item => {
        const itemTitle = (item.volumeInfo?.title || '').toLowerCase();
        const searchTitle = title.toLowerCase();
        return itemTitle === searchTitle || itemTitle.includes(searchTitle) || searchTitle.includes(itemTitle);
      }) || data.items[0];

      const volumeInfo = bestMatch.volumeInfo;
      
      // Google Books has categories which are genres
      if (volumeInfo?.categories && volumeInfo.categories.length > 0) {
        // Return the first category (usually the primary genre)
        return volumeInfo.categories[0];
      }
    }
    return null;
  } catch (error) {
    console.error(`Error searching Google Books for "${title}":`, error.message);
    return null;
  }
}

/**
 * Get genre for a book by trying multiple sources
 */
async function getBookGenre(title, author) {
  if (!title) return null;

  // Try Google Books first (usually more reliable for genres)
  let genre = await getGenreFromGoogleBooks(title, author);
  
  if (!genre) {
    // Fall back to Open Library
    genre = await getGenreFromOpenLibrary(title, author);
  }

  // Clean up the genre string
  if (genre) {
    // Remove common prefixes/suffixes
    genre = genre
      .replace(/^Fiction\s*-\s*/i, '')
      .replace(/\s*Fiction$/i, '')
      .replace(/^Juvenile\s+/i, '')
      .trim();
    
    // Capitalize properly
    genre = genre.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  return genre || null;
}

/**
 * Update genre for a single book
 */
async function updateBookGenre(bookId, genre) {
  try {
    const { data, error } = await supabase
      .from('bk_books')
      .update({ genre })
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error updating book ${bookId}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating book ${bookId}:`, error.message);
    return false;
  }
}

/**
 * Main function to update all book genres
 */
async function updateAllBookGenres() {
  console.log('📚 Starting genre update process...\n');

  try {
    // Fetch all books from database
    console.log('📖 Fetching all books from database...');
    const { data: books, error } = await supabase
      .from('bk_books')
      .select('id, title, author, genre')
      .order('title');

    if (error) {
      console.error('❌ Error fetching books:', error);
      process.exit(1);
    }

    if (!books || books.length === 0) {
      console.log('ℹ️  No books found in database.');
      return;
    }

    console.log(`✅ Found ${books.length} books in database.\n`);

    // Filter books that need genre updates (no genre or empty genre)
    const booksNeedingGenre = books.filter(book => !book.genre || book.genre.trim() === '');
    console.log(`📝 ${booksNeedingGenre.length} books need genre updates.\n`);

    if (booksNeedingGenre.length === 0) {
      console.log('✅ All books already have genres!');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    // Process books with delay to avoid rate limiting
    for (let i = 0; i < booksNeedingGenre.length; i++) {
      const book = booksNeedingGenre[i];
      console.log(`\n[${i + 1}/${booksNeedingGenre.length}] Processing: "${book.title}" by ${book.author || 'Unknown'}`);

      // Skip if no title
      if (!book.title || book.title.trim() === '') {
        console.log('  ⏭️  Skipping: No title');
        skippedCount++;
        continue;
      }

      // Get genre
      const genre = await getBookGenre(book.title, book.author);
      
      if (genre) {
        console.log(`  ✅ Found genre: "${genre}"`);
        const updated = await updateBookGenre(book.id, genre);
        if (updated) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`  ⚠️  Could not find genre`);
        failCount++;
      }

      // Add delay to avoid rate limiting (1 second between requests)
      if (i < booksNeedingGenre.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  📚 Total processed: ${booksNeedingGenre.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
updateAllBookGenres()
  .then(() => {
    console.log('\n✅ Genre update process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

