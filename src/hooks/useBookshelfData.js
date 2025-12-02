import { useState, useRef } from 'react';
import { getUserBookshelves } from '../services/bookshelfService';
import { getBooksInBookshelf, transformBookFromDB } from '../services/bookService';

/**
 * Custom hook for bookshelf data management
 * Handles loading and managing bookshelf data
 * 
 * @param {object} currentUser - Current user object
 * @param {function} loadGamificationData - Function to load gamification data
 * @returns {object} Bookshelf state and functions
 */
export function useBookshelfData(currentUser, loadGamificationData) {
  const [bookshelves, setBookshelves] = useState([]);
  const [activeBookshelfIndex, setActiveBookshelfIndex] = useState(0);
  const isUpdatingRef = useRef(false);

  const loadData = async () => {
    if (!currentUser || isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;

      // Load bookshelves from database
      const { data: bookshelvesData, error: bookshelvesError } = await getUserBookshelves(currentUser.id);
      
      if (bookshelvesError) {
        console.error('Error loading bookshelves:', bookshelvesError);
        setBookshelves([]);
        isUpdatingRef.current = false;
        return;
      }

      // Load books for each bookshelf
      const bookshelvesWithBooks = await Promise.all(
        (bookshelvesData || []).map(async (bookshelf) => {
          const { data: books, error: booksError } = await getBooksInBookshelf(bookshelf.id);
          
          if (booksError) {
            console.error('Error loading books for bookshelf:', booksError);
            return { ...bookshelf, books: [] };
          }

          // Transform books from DB format to app format
          const transformedBooks = (books || []).map(transformBookFromDB);
          
          return {
            id: bookshelf.id,
            name: bookshelf.name,
            animal: bookshelf.animal,
            books: transformedBooks,
            displayMode: bookshelf.display_mode,
            type: bookshelf.type,
            sharedWith: bookshelf.shared_with || []
          };
        })
      );

      setBookshelves(bookshelvesWithBooks);

      // Load gamification data
      if (loadGamificationData) {
        await loadGamificationData();
      }

      // Set default active bookshelf index (find "My Bookshelf")
      const myBookshelfIndex = bookshelvesWithBooks.findIndex(s => s.name === 'My Bookshelf' && s.type === 'regular');
      if (myBookshelfIndex >= 0) {
        setActiveBookshelfIndex(myBookshelfIndex);
      } else if (bookshelvesWithBooks.length > 0) {
        setActiveBookshelfIndex(0);
      }

      // Load active index from sessionStorage (for persistence)
      const savedActiveIndex = sessionStorage.getItem(`bookshelf-app-${currentUser.id}-active-index`);
      if (savedActiveIndex) {
        const index = parseInt(savedActiveIndex);
        if (index >= 0 && index < bookshelvesWithBooks.length) {
          setActiveBookshelfIndex(index);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const saveActiveIndex = () => {
    if (!currentUser) return;
    try {
      sessionStorage.setItem(`bookshelf-app-${currentUser.id}-active-index`, activeBookshelfIndex.toString());
    } catch (error) {
      console.error('Error saving active index:', error);
    }
  };

  return {
    bookshelves,
    setBookshelves,
    activeBookshelfIndex,
    setActiveBookshelfIndex,
    isUpdatingRef,
    loadData,
    saveActiveIndex
  };
}

