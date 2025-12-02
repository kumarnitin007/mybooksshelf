/**
 * Main App Component
 * 
 * This is the main application component for the Bookshelf app.
 * Fully migrated to use Supabase database - all data operations use Supabase services.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Book, Star, Calendar, User, Plus, X, Filter, Sparkles, ChevronDown, Target, Grid, List, Heart, Edit2, Check, Info, Table, Download, FileUp, Trash2 } from 'lucide-react';
import AboutBookshelfModal from './components/AboutBookshelfModal';
import AvatarSelector from './components/AvatarSelector';
import LevelUpModal from './components/modals/LevelUpModal';
import AchievementModal from './components/modals/AchievementModal';
import MoveBookModal from './components/modals/MoveBookModal';
import RecommendationsModal from './components/modals/RecommendationsModal';
import UserComparisonModal from './components/modals/UserComparisonModal';
import AddBookModal from './components/modals/AddBookModal';
import BookDetailsModal from './components/modals/BookDetailsModal';
import LoginModal from './components/modals/LoginModal';
import ProfileModal from './components/modals/ProfileModal';
import Header from './components/layout/Header';
import UserStatsSection from './components/layout/UserStatsSection';
import BookshelfDisplay from './components/bookshelf/BookshelfDisplay';
import { ANIMAL_THEMES } from './constants/animalThemes';
import { isAgeAppropriate } from './utils/contentFilter';
import { getBooksReadThisMonth as getBooksThisMonth, calculateAverageBooksPerMonth, findMostReadAuthor } from './utils/bookHelpers';
import { useAuth } from './hooks/useAuth';
import { useGamification } from './hooks/useGamification';
import { useBookshelfData } from './hooks/useBookshelfData';
import { useUserData } from './hooks/useUserData';

// Import Supabase services
import { 
  createUser, 
  getUserByUsername, 
  getUserById,
  getAllUsers, 
  getUserProfile, 
  updateUserProfile 
} from './services/userService';
import {
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
  getCurrentSession,
  signOut as authSignOut,
  isEmailVerified,
  onAuthStateChange,
  getOrCreateAppUser
} from './services/authService';
import { uploadImageWithFallback, deleteImageFromStorage } from './services/imageService';
import { 
  createBook, 
  updateBook, 
  deleteBook, 
  moveBook, 
  getBooksInBookshelf,
  transformBookFromDB,
  getUserBookCount,
  getUserBooksThisMonth
} from './services/bookService';
import { 
  createBookshelf, 
  updateBookshelf, 
  deleteBookshelf, 
  getUserBookshelves
} from './services/bookshelfService';
import {
  getUserXP
} from './services/gamificationService';
import { 
  getIgnoredSuggestions, 
  ignoreSuggestion as ignoreSuggestionService
} from './services/suggestionService';


export default function App() {
  // Use custom hooks for state management
  const auth = useAuth();
  const {
    currentUser,
    setCurrentUser,
    authUser,
    setAuthUser,
    users,
    setUsers,
    showLoginModal,
    setShowLoginModal,
    defaultUser,
    isVerifying,
    setIsVerifying,
    emailSent,
    setEmailSent
  } = auth;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [displayMode, setDisplayMode] = useState('covers'); // 'covers', 'spines', or 'table'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    coverUrl: '',
    description: '',
    favoriteCharacter: '',
    sceneSummary: '',
    memorableMoments: '',
    review: '',
    startDate: '',
    finishDate: '',
    rating: 0,
    leastFavoritePart: ''
  });
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isEditingBookshelfName, setIsEditingBookshelfName] = useState(false);
  const [editingBookshelfName, setEditingBookshelfName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [bookToMove, setBookToMove] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [allRecommendationsPool, setAllRecommendationsPool] = useState([]);
  const [failedImages, setFailedImages] = useState(new Set()); // Track books with failed images after retries
  const imageRetryCountsRef = useRef({}); // Use ref to avoid re-renders during retries
  const failedImagesRef = useRef(new Set()); // Use ref to avoid re-renders during retries
  const pendingFailedUpdatesRef = useRef(new Set()); // Track pending failed images to batch update
  // UI state
  const [showUserComparison, setShowUserComparison] = useState(false);
  const [encouragingMessage, setEncouragingMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'magiclink'
  const [passwordMode, setPasswordMode] = useState('login'); // 'login' or 'signup'
  
  // User data hook
  const userData = useUserData(currentUser);
  const {
    userProfile,
    setUserProfile,
    ignoredSuggestions,
    setIgnoredSuggestions,
    userProfiles,
    setUserProfiles,
    userStats,
    setUserStats,
    loadingUserStats,
    setLoadingUserStats,
    loadUserProfile
  } = userData;
  
  // Bookshelf state (needed before gamification hook)
  const [bookshelves, setBookshelves] = useState([]);
  const [activeBookshelfIndex, setActiveBookshelfIndex] = useState(0);
  const isUpdatingRef = useRef(false);
  
  // Gamification hook (depends on bookshelves)
  const gamification = useGamification(currentUser, bookshelves);
  const {
    userXP,
    setUserXP,
    userStreak,
    setUserStreak,
    recentAchievements,
    setRecentAchievements,
    userRewards,
    challenges,
    setChallenges,
    showLevelUpModal,
    setShowLevelUpModal,
    levelUpData,
    setLevelUpData,
    showAchievementModal,
    setShowAchievementModal,
    newAchievement,
    setNewAchievement,
    loadGamificationData,
    checkAchievements,
    handleBookFinished
  } = gamification;
  
  // Unused modal states (kept for future features)
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      loadData();
      loadUserProfile();
    }
  }, [currentUser]);

  // initializeAuth and loadDefaultUser are now handled by useAuth hook

  const loadUsers = async () => {
    try {
      // Load all users from database
      const { data: allUsers, error } = await getAllUsers();
      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } else {
        setUsers(allUsers || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadUserProfiles = async () => {
    try {
      const profilesMap = {};
      // Load profile for each user
      for (const user of users) {
        const { data: profile, error } = await getUserProfile(user.id);
        if (!error && profile) {
          profilesMap[user.id] = profile;
        }
      }
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      setLoadingUserStats(true);
      const statsMap = {};
      
      // Load stats for each user (books + XP)
      for (const user of users) {
        const [totalResult, monthlyResult, xpResult] = await Promise.all([
          getUserBookCount(user.id),
          getUserBooksThisMonth(user.id),
          getUserXP(user.id)
        ]);
        
        statsMap[user.id] = {
          totalBooks: totalResult.data || 0,
          monthlyBooks: monthlyResult.data || 0,
          xp: xpResult.data?.total_xp || 0,
          level: xpResult.data?.current_level || 1
        };
      }
      
      setUserStats(statsMap);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingUserStats(false);
    }
  };

  // loadGamificationData and checkAchievements are now provided by useGamification hook

  const loadData = async () => {
    if (!currentUser || isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;

      // Load bookshelves from database
      // Note: Default bookshelves should be created by the prepopulation script
      // or automatically via database trigger for new users
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
      await loadGamificationData();

      // Load user profile from database
      const { data: profileData, error: profileError } = await getUserProfile(currentUser.id);
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else if (profileData) {
        setUserProfile({
          name: profileData.name || '',
          monthlyTarget: profileData.monthly_target || 0,
          avatar: profileData.avatar || '📚',
          bio: profileData.bio || '',
          feedback: profileData.feedback || '',
          hideFromComparison: profileData.hide_from_comparison || false
        });
      }

      // Load ignored suggestions from database
      const { data: ignoredData, error: ignoredError } = await getIgnoredSuggestions(currentUser.id);
      
      if (ignoredError) {
        console.error('Error loading ignored suggestions:', ignoredError);
        setIgnoredSuggestions([]);
      } else {
        setIgnoredSuggestions(ignoredData || []);
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

  // Save active index to sessionStorage (for persistence across page reloads)
  const saveActiveIndex = () => {
    if (!currentUser) return;
    try {
      sessionStorage.setItem(`bookshelf-app-${currentUser.id}-active-index`, activeBookshelfIndex.toString());
    } catch (error) {
      console.error('Error saving active index:', error);
    }
  };

  // User management functions
  const handleCreateUser = async (username) => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      const result = await createUser(username.trim());
      
      if (result.error) {
        alert(result.error.message || 'Error creating user. Please try again.');
        return;
      }

      if (result.data) {
        const newUser = result.data;
        setUsers([...users, newUser]);
        loginUser(newUser);
        setNewUsername('');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  const handlePasswordLogin = async () => {
    if (!loginEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (!loginPassword.trim()) {
      alert('Please enter your password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsVerifying(true);
      
      if (passwordMode === 'signup') {
        // Create new account
        if (loginPassword.length < 6) {
          alert('Password must be at least 6 characters long');
          setIsVerifying(false);
          return;
        }

        if (loginPassword !== confirmPassword) {
          alert('Passwords do not match');
          setIsVerifying(false);
          return;
        }

        const { data, error } = await signUpWithPassword(loginEmail.trim(), loginPassword);
        
        if (error) {
          alert(`Error: ${error.message || 'Failed to create account. Email may already be in use.'}`);
          setIsVerifying(false);
          return;
        }

        // Signup successful - show message
        alert('Account created successfully! Please check your email to verify your account. You can sign in once verified.');
        setPasswordMode('login');
        setLoginPassword('');
        setConfirmPassword('');
        setIsVerifying(false);
      } else {
        // Sign in existing user
        const { data, error } = await signInWithPassword(loginEmail.trim(), loginPassword);
        
        if (error) {
          alert(`Error: ${error.message || 'Failed to sign in. Please check your email and password.'}`);
          setIsVerifying(false);
          return;
        }

        // Password login successful - user will be set via auth state change listener
        setIsVerifying(false);
        setLoginPassword('');
      }
    } catch (error) {
      console.error('Error with password authentication:', error);
      alert('Error: ' + (error.message || 'Please try again.'));
      setIsVerifying(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail.trim()) {
      alert('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsVerifying(true);
      const { data, error } = await signInWithEmail(loginEmail.trim());
      
      if (error) {
        alert(`Error: ${error.message || 'Failed to send magic link'}`);
        setIsVerifying(false);
        return;
      }

      setEmailSent(true);
      alert('Check your email! We sent you a magic link to sign in. Click the link in the email to verify and access your account.');
    } catch (error) {
      console.error('Error sending magic link:', error);
      alert('Error sending magic link. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleChangeUser = () => {
    // Sign out and show login modal
    authSignOut();
    setCurrentUser(defaultUser);
    setAuthUser(null);
    setShowLoginModal(true);
    setEmailSent(false);
    setLoginEmail('');
  };

  const logout = async () => {
    // Sign out from Supabase Auth (if authenticated)
    if (authUser) {
      await authSignOut();
    }
    
    // Clear state
    setAuthUser(null);
    setBookshelves([]);
    setUserProfile({
      name: '',
      monthlyTarget: 0,
      avatar: '📚',
      bio: '',
      feedback: ''
    });
    
    // If logging out from default user, just show login modal
    // If logging out from authenticated user, show login modal and clear current user
    if (authUser) {
      setCurrentUser(null);
    } else {
      // Default user logout - just show login modal
      setCurrentUser(null);
    }
    
    // Show login modal (but don't auto-login to default)
    setShowLoginModal(true);
    setEmailSent(false);
    setLoginEmail('');
    setIsVerifying(false);
  };

  const getBooksReadThisMonth = (userId) => {
    if (!userId || userId === currentUser?.id) {
      // For current user, use local state
      const allBooks = bookshelves.flatMap(shelf => shelf.books || []);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      return allBooks.filter(book => {
        if (!book.finishDate) return false;
        const finishDate = new Date(book.finishDate);
        return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
      }).length;
    }
    // For other users, use fetched stats
    return userStats[userId]?.monthlyBooks || 0;
  };

  const getTotalBooksRead = (userId) => {
    if (!userId || userId === currentUser?.id) {
      // For current user, use local state
      return bookshelves.reduce((total, shelf) => total + (shelf.books?.length || 0), 0);
    }
    // For other users, use fetched stats
    return userStats[userId]?.totalBooks || 0;
  };


  // isAgeAppropriate function - now imported from utils/contentFilter.js

  const searchBooks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Check if query looks like an ISBN (10 or 13 digits, possibly with hyphens)
      const isbnPattern = /^[\d-]{10,17}$/;
      const cleanQuery = query.replace(/[-\s]/g, '');
      const isISBN = isbnPattern.test(cleanQuery) && (cleanQuery.length === 10 || cleanQuery.length === 13);
      
      let url;
      if (isISBN) {
        // Search by ISBN
        url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanQuery)}&limit=20`;
      } else {
        // Search by title/author
        url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.docs && data.docs.length > 0) {
        const results = data.docs
          .map(doc => ({
            title: doc.title || 'Unknown Title',
            author: doc.author_name ? doc.author_name[0] : 'Unknown Author',
            coverUrl: doc.cover_i 
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              : `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(doc.title || 'Book')}`,
            description: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence) : '',
            isbn: doc.isbn ? doc.isbn[0] : null,
            key: doc.key
          }))
          // Filter out inappropriate books for teens
          .filter(result => isAgeAppropriate(result.title, result.author))
          .slice(0, 10); // Limit to 10 age-appropriate results
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      searchBooks(query);
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result) => {
    setNewBook({
      ...newBook,
      title: result.title,
      author: result.author,
      coverUrl: result.coverUrl,
      description: result.description
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleImageUpload = async (e, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      // Show loading state
      const bookId = isEditing && selectedBook ? selectedBook.id : 'temp';
      
      // Upload to Supabase Storage with base64 fallback
      const result = await uploadImageWithFallback(file, bookId);
      
      if (result.error || !result.url) {
        alert(`Error uploading image: ${result.error?.message || 'Unknown error'}. Please try again.`);
        return;
      }

      if (isEditing && selectedBook) {
        // Delete old image from storage if it was a storage URL
        if (selectedBook.coverUrl && 
            !selectedBook.coverUrl.startsWith('data:') && 
            !selectedBook.coverUrl.includes('placeholder')) {
          await deleteImageFromStorage(selectedBook.coverUrl);
        }

        // Update existing book image
        const updates = { coverUrl: result.url };
        await handleUpdateBook(selectedBook.id, updates);
        setSelectedBook({ ...selectedBook, ...updates });
      } else {
        // Set image for new book
        setNewBook({ ...newBook, coverUrl: result.url });
      }

      // Show success message if uploaded to storage
      if (!result.isBase64) {
        console.log('Image uploaded to Supabase Storage:', result.url);
      } else {
        console.log('Image saved as base64 (storage unavailable)');
      }
    } catch (error) {
      console.error('Error handling image upload:', error);
      alert('Error uploading image. Please try again.');
    }
  };

  const verifyBookExists = async (title, author) => {
    if (!title.trim()) return false;
    
    try {
      const query = author ? `${title} ${author}` : title;
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      
      if (data.docs && data.docs.length > 0) {
        // Check if any result closely matches
        const matches = data.docs.filter(doc => {
          const docTitle = (doc.title || '').toLowerCase();
          const searchTitle = title.toLowerCase();
          return docTitle.includes(searchTitle) || searchTitle.includes(docTitle);
        });
        return matches.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error verifying book:', error);
      return false;
    }
  };

  const addBook = async () => {
    try {
      if (!newBook.title) {
        alert('Please enter a book title');
        return;
      }

      isUpdatingRef.current = true; // Prevent loadData from interfering

      // Ensure we have at least one bookshelf
      let currentBookshelves = [...bookshelves];
      if (!currentBookshelves || currentBookshelves.length === 0) {
        const initialBookshelf = {
          id: Date.now(),
          name: 'My First Bookshelf',
          animal: 'cat',
          books: [],
          displayMode: 'covers',
          type: 'regular'
        };
        currentBookshelves = [initialBookshelf];
        // Batch both updates together to prevent flickering
        setBookshelves(currentBookshelves);
        setActiveBookshelfIndex(0);
      }

      // Check if book is age-appropriate for teens
      if (!isAgeAppropriate(newBook.title, newBook.author)) {
        const confirm = window.confirm(
          'This book may contain mature content that is not appropriate for teens. ' +
          'Are you sure you want to add it? We recommend choosing age-appropriate books.'
        );
        if (!confirm) return;
      }

      // Verify book exists if manually adding
      if (!newBook.coverUrl || newBook.coverUrl.includes('placeholder')) {
        const exists = await verifyBookExists(newBook.title, newBook.author);
        if (!exists) {
          const confirm = window.confirm('This book was not found in our database. Are you sure you want to add it manually?');
          if (!confirm) return;
        }
      }

      // Ensure activeBookshelfIndex is valid
      let targetIndex = activeBookshelfIndex;
      if (targetIndex < 0 || targetIndex >= currentBookshelves.length) {
        targetIndex = 0;
        setActiveBookshelfIndex(0);
      }

      const currentBookshelf = currentBookshelves[targetIndex];
      
      if (!currentBookshelf) {
        alert('Error: No bookshelf available. Please refresh the page.');
        console.error('No bookshelf found at index:', targetIndex, 'Bookshelves:', currentBookshelves);
        return;
      }
      
      // Check if bookshelf is full (only for regular shelves, not wishlist/favorites)
      if (currentBookshelf.type === 'regular' && currentBookshelf.books.length >= 10) {
        alert('This bookshelf is full! It will be moved to Completed Bookshelves. Creating a new bookshelf...');
        createNewBookshelf();
        return;
      }

      const updatedBookshelves = [...currentBookshelves];
      
      if (!updatedBookshelves[targetIndex]) {
        alert('Error: Invalid bookshelf index. Please refresh the page.');
        console.error('Invalid bookshelf index:', targetIndex, 'Bookshelves:', updatedBookshelves);
        return;
      }

      // Check if bookshelf is full (only for regular shelves, not wishlist/favorites)
      const targetShelf = updatedBookshelves[targetIndex];
      if (targetShelf.type === 'regular' && targetShelf.books.length >= 10) {
        alert('This bookshelf is full! It will be moved to Completed Bookshelves. Creating a new bookshelf...');
        createNewBookshelf();
        return;
      }

      // Save book to Supabase database
      let savedBook = null;
      if (currentUser && targetShelf.id) {
        try {
          const bookData = {
            title: newBook.title,
            author: newBook.author || '',
            coverUrl: newBook.coverUrl || `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(newBook.title)}`,
            description: newBook.description || '',
            favoriteCharacter: newBook.favoriteCharacter || '',
            sceneSummary: newBook.sceneSummary || '',
            memorableMoments: newBook.memorableMoments || '',
            review: newBook.review || '',
            leastFavoritePart: newBook.leastFavoritePart || '',
            rating: newBook.rating || 0,
            startDate: newBook.startDate || null,
            finishDate: newBook.finishDate || null
          };

          // Use bookshelf ID - if it's a UUID format, use it directly; otherwise it might need to be created in DB first
          const bookshelfId = typeof targetShelf.id === 'string' && targetShelf.id.includes('-') 
            ? targetShelf.id 
            : targetShelf.dbId || targetShelf.id;

          console.log('Attempting to save book with bookshelfId:', bookshelfId, 'bookshelf:', targetShelf);
          const result = await createBook(bookshelfId, bookData);
          
          if (result.error) {
            console.error('Error saving book to database:', result.error);
            console.error('Bookshelf ID used:', bookshelfId);
            console.error('Target shelf:', targetShelf);
            alert(`Error saving book: ${result.error.message || result.error.code || 'Unknown error'}. Check console for details.`);
            // Continue with local save even if DB save fails
          } else {
            savedBook = result.data;
            console.log('✅ Book saved to database:', savedBook);
          }
        } catch (error) {
          console.error('Error saving book to Supabase:', error);
          // Continue with local save even if DB save fails
        }
      }

      const bookToAdd = {
        id: savedBook?.id || Date.now(),
        ...newBook,
        coverUrl: newBook.coverUrl || `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(newBook.title)}`,
        addedDate: new Date().toISOString()
      };
      
      updatedBookshelves[targetIndex].books.push(bookToAdd);
      
      // Clear failed image state for the new book to allow fresh image loading
      failedImagesRef.current.delete(bookToAdd.id);
      imageRetryCountsRef.current[bookToAdd.id] = 0;
      // Batch failed images update - only update if needed
      if (failedImages.has(bookToAdd.id)) {
        setFailedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookToAdd.id);
          return newSet;
        });
      }
      
      // Check if bookshelf is now full (reached exactly 10 books)
      if (updatedBookshelves[targetIndex].books.length === 10) {
        // Bookshelf is now complete - it will automatically appear in "Completed" tab
        // Switch to a new bookshelf if this was the active one
        setTimeout(() => {
          isUpdatingRef.current = true;
          const activeShelves = updatedBookshelves.filter(shelf => shelf.books.length < 10);
          if (activeShelves.length > 0) {
            const newActiveIndex = updatedBookshelves.findIndex(shelf => shelf.id === activeShelves[0].id);
            if (newActiveIndex !== -1) {
              setActiveBookshelfIndex(newActiveIndex);
            }
          } else {
            // No active shelves, create a new one
            const newBookshelf = {
              id: Date.now(),
              name: `Bookshelf ${updatedBookshelves.length + 1}`,
              animal: 'cat',
              books: [],
              displayMode: 'covers',
              type: 'regular'
            };
            const newBookshelves = [...updatedBookshelves, newBookshelf];
            setBookshelves(newBookshelves);
            setActiveBookshelfIndex(updatedBookshelves.length);
          }
        }, 100);
      }

      // Update bookshelves - this is the main state update
      setBookshelves(updatedBookshelves);
      saveActiveIndex(); // Save active index
      setShowAddModal(false);
      setNewBook({
        title: '',
        author: '',
        coverUrl: '',
        description: '',
        favoriteCharacter: '',
        sceneSummary: '',
        memorableMoments: '',
        review: '',
        startDate: '',
        finishDate: '',
        rating: 0,
        leastFavoritePart: ''
      });
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding book:', error);
      alert('An error occurred while adding the book. Please check the console for details.');
    }
  };

  const createNewBookshelf = async () => {
    if (!currentUser) return;
    
    isUpdatingRef.current = true; // Prevent loadData from interfering
    const regularShelves = bookshelves.filter(s => !s.type || s.type === 'regular');
    
    try {
      // Create in database
      const result = await createBookshelf(currentUser.id, {
        name: `Bookshelf ${regularShelves.length + 1}`,
        animal: 'cat',
        displayMode: 'covers',
        type: 'regular'
      });
      
      if (result.error) {
        console.error('Error creating bookshelf in database:', result.error);
        // Continue with local creation if DB fails
        const newBookshelf = {
          id: Date.now(),
          name: `Bookshelf ${regularShelves.length + 1}`,
          animal: 'cat',
          books: [],
          displayMode: 'covers',
          type: 'regular'
        };
        const newBookshelves = [...bookshelves, newBookshelf];
        const newIndex = newBookshelves.length - 1;
        setBookshelves(newBookshelves);
        setActiveBookshelfIndex(newIndex);
        saveActiveIndex();
        return;
      }

      // Use database result
      const newBookshelf = {
        id: result.data.id,
        name: result.data.name,
        animal: result.data.animal,
        books: [],
        displayMode: result.data.display_mode,
        type: result.data.type
      };
      const newBookshelves = [...bookshelves, newBookshelf];
      const newIndex = newBookshelves.length - 1;
      setBookshelves(newBookshelves);
      setActiveBookshelfIndex(newIndex);
      saveActiveIndex();
    } catch (error) {
      console.error('Error creating bookshelf:', error);
      // Fallback to local creation
      const newBookshelf = {
        id: Date.now(),
        name: `Bookshelf ${regularShelves.length + 1}`,
        animal: 'cat',
        books: [],
        displayMode: 'covers',
        type: 'regular'
      };
      const newBookshelves = [...bookshelves, newBookshelf];
      const newIndex = newBookshelves.length - 1;
      setBookshelves(newBookshelves);
      setActiveBookshelfIndex(newIndex);
      saveActiveIndex();
    }
  };

  const startEditingBookshelfName = () => {
    if (activeShelf) {
      setEditingBookshelfName(activeShelf.name);
      setIsEditingBookshelfName(true);
    }
  };

  const saveBookshelfName = async () => {
    if (!editingBookshelfName.trim()) {
      alert('Bookshelf name cannot be empty');
      return;
    }
    
    if (!activeShelf || !activeShelf.id) {
      alert('Error: No bookshelf selected or invalid bookshelf ID');
      return;
    }
    
    try {
      // Update in database
      const result = await updateBookshelf(activeShelf.id, {
        name: editingBookshelfName.trim()
      });
      
      if (result.error) {
        console.error('Error updating bookshelf name in database:', result.error);
        alert(`Failed to save bookshelf name to database: ${result.error.message || 'Unknown error'}. The change may not persist after page reload.`);
        // Continue with local update so user sees the change
      } else {
        console.log('Bookshelf name updated successfully in database:', result.data);
      }

      // Update local state
      const updated = [...bookshelves];
      updated[activeBookshelfIndex].name = editingBookshelfName.trim();
      setBookshelves(updated);
      saveActiveIndex();
      setIsEditingBookshelfName(false);
      setEditingBookshelfName('');
    } catch (error) {
      console.error('Error updating bookshelf name:', error);
      alert(`Error updating bookshelf name: ${error.message || 'Unknown error'}. The change may not persist after page reload.`);
      // Still update local state so user sees the change
      const updated = [...bookshelves];
      updated[activeBookshelfIndex].name = editingBookshelfName.trim();
      setBookshelves(updated);
      saveActiveIndex();
      setIsEditingBookshelfName(false);
      setEditingBookshelfName('');
    }
  };

  const cancelEditingBookshelfName = () => {
    setIsEditingBookshelfName(false);
    setEditingBookshelfName('');
  };

  const handleDeleteBookshelf = async (bookshelfId) => {
    const bookshelf = bookshelves.find(s => s.id === bookshelfId);
    if (!bookshelf) return;

    // Check if bookshelf has books
    if (bookshelf.books && bookshelf.books.length > 0) {
      alert(`Cannot delete bookshelf "${bookshelf.name}". Please remove all books from this bookshelf before deleting it.`);
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${bookshelf.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from database
      const result = await deleteBookshelf(bookshelfId);
      
      if (result.error) {
        console.error('Error deleting bookshelf from database:', result.error);
        alert(`Error deleting bookshelf: ${result.error.message || 'Unknown error'}`);
        return;
      }

      // Update local state
      const updatedBookshelves = bookshelves.filter(s => s.id !== bookshelfId);
      setBookshelves(updatedBookshelves);
      
      // If we deleted the active bookshelf, switch to the first available one
      if (activeBookshelfIndex >= updatedBookshelves.length) {
        setActiveBookshelfIndex(Math.max(0, updatedBookshelves.length - 1));
      } else {
        // Adjust index if needed
        const deletedIndex = bookshelves.findIndex(s => s.id === bookshelfId);
        if (deletedIndex < activeBookshelfIndex) {
          setActiveBookshelfIndex(activeBookshelfIndex - 1);
        }
      }
      
      saveActiveIndex();
    } catch (error) {
      console.error('Error deleting bookshelf:', error);
      alert(`Error deleting bookshelf: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateBook = async (bookId, updates) => {
    try {
      // If updating cover image, delete old image from storage
      if (updates.coverUrl) {
        const currentBook = bookshelves
          .flatMap(shelf => shelf.books)
          .find(book => book.id === bookId);
        
        if (currentBook?.coverUrl && 
            !currentBook.coverUrl.startsWith('data:') && 
            !currentBook.coverUrl.includes('placeholder') &&
            currentBook.coverUrl !== updates.coverUrl) {
          // Delete old image from storage (don't wait for it)
          deleteImageFromStorage(currentBook.coverUrl).catch(err => {
            console.warn('Error deleting old image from storage:', err);
          });
        }
      }

      // Check if book is being finished (finishDate added)
      const currentBook = bookshelves
        .flatMap(shelf => shelf.books)
        .find(book => book.id === bookId);
      const isFinishingBook = updates.finishDate && !currentBook?.finishDate;

      // Update in database
      const result = await updateBook(bookId, updates);
      
      if (result.error) {
        console.error('Error updating book in database:', result.error);
        // Continue with local update even if DB fails
      }

      // Update local state
      const updatedBookshelves = bookshelves.map(shelf => ({
        ...shelf,
        books: shelf.books.map(book =>
          book.id === bookId ? { ...book, ...updates } : book
        )
      }));
      setBookshelves(updatedBookshelves);

      // Gamification: Award XP and update streak when book is finished (using hook)
      if (isFinishingBook && handleBookFinished) {
        await handleBookFinished(bookId, updates.finishDate);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      // Still update local state
      const updatedBookshelves = bookshelves.map(shelf => ({
        ...shelf,
        books: shelf.books.map(book => 
          book.id === bookId ? { ...book, ...updates } : book
        )
      }));
      setBookshelves(updatedBookshelves);
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      // Find the book to get its cover URL
      const bookToDelete = bookshelves
        .flatMap(shelf => shelf.books)
        .find(book => book.id === bookId);

      // Delete image from storage if it's a storage URL
      if (bookToDelete?.coverUrl && 
          !bookToDelete.coverUrl.startsWith('data:') && 
          !bookToDelete.coverUrl.includes('placeholder')) {
        // Delete image from storage (don't wait for it)
        deleteImageFromStorage(bookToDelete.coverUrl).catch(err => {
          console.warn('Error deleting image from storage:', err);
        });
      }

      // Delete from database
      const result = await deleteBook(bookId);
      
      if (result.error) {
        console.error('Error deleting book from database:', result.error);
        // Continue with local delete even if DB fails
      }

      // Update local state
      const updatedBookshelves = bookshelves.map(shelf => ({
        ...shelf,
        books: shelf.books.filter(book => book.id !== bookId)
      }));
      setBookshelves(updatedBookshelves);
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error deleting book:', error);
      // Still update local state
      const updatedBookshelves = bookshelves.map(shelf => ({
        ...shelf,
        books: shelf.books.filter(book => book.id !== bookId)
      }));
      setBookshelves(updatedBookshelves);
      setShowDetailsModal(false);
    }
  };

  const handleMoveBook = async (bookId, targetShelfId) => {
    let bookToMove = null;
    let sourceShelfIndex = -1;

    // Find the book and its source shelf
    bookshelves.forEach((shelf, index) => {
      const book = shelf.books.find(b => b.id === bookId);
      if (book) {
        bookToMove = book;
        sourceShelfIndex = index;
      }
    });

    if (!bookToMove || sourceShelfIndex === -1) return;

    const targetShelfIndex = bookshelves.findIndex(s => s.id === targetShelfId);
    if (targetShelfIndex === -1) return;

    // Check if target shelf is full (only for regular shelves, not wishlist/favorites)
    const targetShelf = bookshelves[targetShelfIndex];
    if (targetShelf.type === 'regular' && targetShelf.books.length >= 10) {
      alert('This bookshelf is full! Please choose another bookshelf.');
      return;
    }

    try {
      // Move in database
      const result = await moveBook(bookId, targetShelfId);
      
      if (result.error) {
        console.error('Error moving book in database:', result.error);
        // Continue with local move even if DB fails
      }

      // Update local state
      const updatedBookshelves = [...bookshelves];
      updatedBookshelves[sourceShelfIndex] = {
        ...updatedBookshelves[sourceShelfIndex],
        books: updatedBookshelves[sourceShelfIndex].books.filter(b => b.id !== bookId)
      };

      updatedBookshelves[targetShelfIndex] = {
        ...updatedBookshelves[targetShelfIndex],
        books: [...updatedBookshelves[targetShelfIndex].books, bookToMove]
      };

      setBookshelves(updatedBookshelves);
      setShowMoveModal(false);
      setBookToMove(null);
    } catch (error) {
      console.error('Error moving book:', error);
      // Still update local state
      const updatedBookshelves = [...bookshelves];
      updatedBookshelves[sourceShelfIndex] = {
        ...updatedBookshelves[sourceShelfIndex],
        books: updatedBookshelves[sourceShelfIndex].books.filter(b => b.id !== bookId)
      };

      updatedBookshelves[targetShelfIndex] = {
        ...updatedBookshelves[targetShelfIndex],
        books: [...updatedBookshelves[targetShelfIndex].books, bookToMove]
      };

      setBookshelves(updatedBookshelves);
      setShowMoveModal(false);
      setBookToMove(null);
    }
  };

  const ignoreSuggestion = async (bookTitle, bookAuthor) => {
    const suggestionKey = `${bookTitle}|${bookAuthor}`;
    if (!ignoredSuggestions.includes(suggestionKey) && currentUser) {
      try {
        // Save to database
        await ignoreSuggestionService(currentUser.id, suggestionKey);
        
        // Update local state
        setIgnoredSuggestions([...ignoredSuggestions, suggestionKey]);
        
        // Remove from recommendations display
        setRecommendations(recommendations.filter(r => 
          !(r.title === bookTitle && r.author === bookAuthor)
        ));
      } catch (error) {
        console.error('Error ignoring suggestion:', error);
        // Still update local state
        setIgnoredSuggestions([...ignoredSuggestions, suggestionKey]);
        setRecommendations(recommendations.filter(r => 
          !(r.title === bookTitle && r.author === bookAuthor)
        ));
      }
    }
  };

  const generateRecommendations = async (append = false) => {
    // Always open the modal first
    if (!append) {
      setShowRecommendations(true);
      setIsLoadingRecommendations(true);
    }

    const allBooks = bookshelves.flatMap(shelf => shelf.books);
    const ratedBooks = allBooks.filter(b => b.rating >= 3); // Exclude 1-2 star books

    try {
      const authors = [...new Set(ratedBooks.map(b => b.author).filter(Boolean))];
      const topRated = ratedBooks.filter(b => b.rating >= 4);
      
      // Generate a larger pool of recommendations - all age-appropriate for teens
      const allRecs = [];
      
      // Always generate recommendations, even if there are no rated books
      // Expanded recommendation pool - all books are age-appropriate for teens
      const recommendationPool = [
        { title: "The Hunger Games", author: "Suzanne Collins", reason: topRated.length > 0 ? `Based on your love for ${topRated[0].title}, you might enjoy this thrilling dystopian adventure with a strong female protagonist.` : "A thrilling dystopian adventure with a strong female protagonist that many readers love." },
        { title: "Project Hail Mary", author: "Andy Weir", reason: topRated.length > 0 ? `If you enjoyed ${topRated[0].title}, this science fiction adventure might be right up your alley.` : "An exciting science fiction adventure that combines humor, science, and suspense." },
        { title: "The Midnight Library", author: "Matt Haig", reason: "A thought-provoking novel about life choices and second chances that could resonate with you." },
        { title: "The Book Thief", author: "Markus Zusak", reason: "A powerful historical fiction novel set in Nazi Germany that explores the power of words and stories." },
        { title: "Percy Jackson and the Lightning Thief", author: "Rick Riordan", reason: topRated.length > 0 ? `If you enjoyed ${topRated[0].title}, this exciting mythological adventure might appeal to you.` : "An exciting modern take on Greek mythology with humor and adventure." },
        { title: "The Maze Runner", author: "James Dashner", reason: topRated.length > 0 ? `Fans of ${topRated[0].title} often love this thrilling dystopian mystery with non-stop action.` : "A thrilling dystopian mystery with non-stop action and suspense." },
        { title: "Divergent", author: "Veronica Roth", reason: "An exciting dystopian story with strong characters and themes of identity and choice." },
        { title: "The Fault in Our Stars", author: "John Green", reason: "A beautifully written contemporary story about friendship, love, and finding meaning in life." },
        { title: "Wonder", author: "R.J. Palacio", reason: "An inspiring story about kindness, acceptance, and seeing beyond appearances." },
        { title: "The Giver", author: "Lois Lowry", reason: "A thought-provoking classic dystopian novel that explores memory, emotion, and what it means to be human." },
        { title: "Dune", author: "Frank Herbert", reason: "An epic science fiction classic with rich world-building and complex themes." },
        { title: "The Name of the Wind", author: "Patrick Rothfuss", reason: "A fantasy novel with rich world-building and compelling storytelling." },
        { title: "The Alchemist", author: "Paulo Coelho", reason: "A philosophical and inspiring tale about following your dreams and finding your personal legend." },
        { title: "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", reason: "A classic fantasy adventure that transports readers to a magical world." },
        { title: "Ender's Game", author: "Orson Scott Card", reason: "A science fiction classic about strategy, leadership, and the cost of war." },
        { title: "The Hobbit", author: "J.R.R. Tolkien", reason: "A classic fantasy adventure following Bilbo Baggins on an unexpected journey." },
        { title: "To Kill a Mockingbird", author: "Harper Lee", reason: "A powerful coming-of-age story about justice, morality, and growing up in the American South." },
        { title: "The Outsiders", author: "S.E. Hinton", reason: "A classic story about friendship, belonging, and the struggles of youth." },
        { title: "The Hate U Give", author: "Angie Thomas", reason: "A powerful contemporary novel about finding your voice and standing up for what's right." },
        { title: "The Lightning Thief", author: "Rick Riordan", reason: "An exciting modern take on Greek mythology with humor, adventure, and relatable characters." }
      ];
      
      // Filter to ensure all recommendations are age-appropriate
      const ageAppropriateRecs = recommendationPool.filter(rec => 
        isAgeAppropriate(rec.title, rec.author)
      );
      
      allRecs.push(...ageAppropriateRecs);

      // Filter out ignored suggestions, books already in library, and ensure age-appropriateness
      const filteredRecs = allRecs.filter(rec => {
        const key = `${rec.title}|${rec.author}`;
        const isIgnored = ignoredSuggestions.includes(key);
        const alreadyInLibrary = bookshelves.some(shelf => 
          shelf.books.some(book => book.title === rec.title && book.author === rec.author)
        );
        const isAppropriate = isAgeAppropriate(rec.title, rec.author);
        return !isIgnored && !alreadyInLibrary && isAppropriate;
      });

      if (append) {
        // Get 5 more recommendations that aren't already shown
        const currentRecTitles = recommendations.map(r => `${r.title}|${r.author}`);
        const newRecs = filteredRecs.filter(rec => {
          const key = `${rec.title}|${rec.author}`;
          return !currentRecTitles.includes(key);
        }).slice(0, 5);
        
        setRecommendations([...recommendations, ...newRecs]);
      } else {
        // First time - show first 5 and store the pool
        setRecommendations(filteredRecs.slice(0, 5));
        setAllRecommendationsPool(filteredRecs);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      if (!append) {
        setRecommendations([]);
      }
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const addRecommendationToWishlist = async (rec) => {
    const wishlistShelf = getWishlistBookshelf();
    if (!wishlistShelf) {
      alert('Wishlist bookshelf not found. Please refresh the page.');
      return;
    }

    // Check if book already exists in wishlist
    const alreadyInWishlist = wishlistShelf.books.some(
      book => book.title === rec.title && book.author === rec.author
    );

    if (alreadyInWishlist) {
      alert('This book is already in your wishlist!');
      return;
    }

    // Save book to Supabase database
    let savedBook = null;
    if (currentUser && wishlistShelf.id) {
      try {
        const bookData = {
          title: rec.title,
          author: rec.author || '',
          coverUrl: `https://via.placeholder.com/200x300/EC4899/FFFFFF?text=${encodeURIComponent(rec.title)}`,
          description: rec.reason || '',
          favoriteCharacter: '',
          sceneSummary: '',
          memorableMoments: '',
          review: '',
          leastFavoritePart: '',
          rating: 0,
          startDate: null,
          finishDate: null
        };

        // Use bookshelf ID - if it's a UUID format, use it directly; otherwise it might need to be created in DB first
        const bookshelfId = typeof wishlistShelf.id === 'string' && wishlistShelf.id.includes('-') 
          ? wishlistShelf.id 
          : wishlistShelf.dbId || wishlistShelf.id;

        const result = await createBook(bookshelfId, bookData);
        
        if (result.error) {
          console.error('Error saving book to database:', result.error);
          // Continue with local save even if DB save fails
        } else {
          savedBook = result.data;
          console.log('Book saved to database:', savedBook);
        }
      } catch (error) {
        console.error('Error saving book to Supabase:', error);
        // Continue with local save even if DB save fails
      }
    }

    // Add to wishlist
    const updatedBookshelves = bookshelves.map(shelf => {
      if (shelf.type === 'wishlist') {
        return {
          ...shelf,
          books: [...shelf.books, {
            id: savedBook?.id || Date.now(),
            title: rec.title,
            author: rec.author,
            coverUrl: `https://via.placeholder.com/200x300/EC4899/FFFFFF?text=${encodeURIComponent(rec.title)}`,
            description: rec.reason,
            addedDate: new Date().toISOString()
          }]
        };
      }
      return shelf;
    });

    setBookshelves(updatedBookshelves);
    saveActiveIndex(); // Save active index
    
    // Remove from recommendations display
    setRecommendations(recommendations.filter(r => 
      !(r.title === rec.title && r.author === rec.author)
    ));
    
    alert(`${rec.title} has been added to your wishlist!`);
  };

  const getActiveBookshelf = () => {
    return bookshelves[activeBookshelfIndex] || bookshelves[0];
  };

  const getCompletedBookshelves = () => {
    return bookshelves.filter(shelf => shelf.books.length >= 10);
  };

  const getActiveBookshelves = () => {
    return bookshelves.filter(shelf => !shelf.type || shelf.type === 'regular').filter(shelf => shelf.books.length < 10);
  };

  const getRegularBookshelves = () => {
    return bookshelves.filter(shelf => !shelf.type || shelf.type === 'regular');
  };

  const getTotalBooksCount = () => {
    // Get total count of books from all regular bookshelves (excluding wishlist and suggested)
    return getRegularBookshelves().reduce((total, shelf) => total + shelf.books.length, 0);
  };

  const getWishlistBookshelf = () => {
    return bookshelves.find(shelf => shelf.type === 'wishlist');
  };


  const getFavoritesBookshelf = () => {
    return bookshelves.find(shelf => shelf.type === 'favorites');
  };


  // getCurrentUserBooksReadThisMonth - now using imported utility from utils/bookHelpers.js
  const getCurrentUserBooksReadThisMonth = () => {
    const allBooks = bookshelves.flatMap(shelf => shelf.books || []);
    return getBooksThisMonth(allBooks);
  };

  const getMostReadAuthor = () => {
    const allBooks = bookshelves.flatMap(shelf => shelf.books);
    const authorCounts = {};
    
    allBooks.forEach(book => {
      if (book.author) {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }
    });
    
    if (Object.keys(authorCounts).length === 0) return 'N/A';
    
    const mostReadAuthor = Object.entries(authorCounts).reduce((a, b) => 
      authorCounts[a[0]] > authorCounts[b[0]] ? a : b
    );
    
    return mostReadAuthor[0];
  };

  const getAverageBooksPerMonth = () => {
    const allBooks = bookshelves.flatMap(shelf => shelf.books);
    const booksWithFinishDate = allBooks.filter(book => book.finishDate);
    
    if (booksWithFinishDate.length === 0) return '0.0';
    
    // Group books by month-year
    const monthGroups = {};
    booksWithFinishDate.forEach(book => {
      const finishDate = new Date(book.finishDate);
      const monthKey = `${finishDate.getFullYear()}-${finishDate.getMonth()}`;
      monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1;
    });
    
    // Calculate average books per month
    const totalMonths = Object.keys(monthGroups).length;
    if (totalMonths === 0) return '0.0';
    
    const totalBooks = Object.values(monthGroups).reduce((sum, count) => sum + count, 0);
    return (totalBooks / totalMonths).toFixed(1);
  };

  const getFilteredBooks = () => {
    const activeShelf = getActiveBookshelf();
    if (!activeShelf) return [];
    
    
    let books = activeShelf.books;
    
    // Apply search filter
    if (searchQuery) {
      books = books.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply rating/author filter
    if (filterBy === 'rating5') {
      books = books.filter(book => book.rating === 5);
    } else if (filterBy === 'rating4+') {
      books = books.filter(book => book.rating >= 4);
    } else if (filterBy.startsWith('author:')) {
      const author = filterBy.replace('author:', '');
      books = books.filter(book => book.author === author);
    }
    
    return books;
  };

  const allBooks = bookshelves.flatMap(shelf => shelf.books);
  const uniqueAuthors = [...new Set(allBooks.map(b => b.author))].filter(Boolean);
  const activeShelf = getActiveBookshelf();
  const theme = activeShelf ? ANIMAL_THEMES[activeShelf.animal] || ANIMAL_THEMES.cat : ANIMAL_THEMES.cat;
  const filteredBooks = getFilteredBooks();

  // Get all books across all bookshelves with their bookshelf names
  const getAllBooksWithBookshelf = () => {
    return bookshelves.flatMap(shelf => 
      (shelf.books || []).map(book => ({
        ...book,
        bookshelfName: shelf.name || 'Unknown',
        bookshelfType: shelf.type || 'regular'
      }))
    );
  };

  // Export functions
  const exportToCSV = () => {
    const books = getAllBooksWithBookshelf();
    if (books.length === 0) {
      alert('No books to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Title', 'Author', 'Bookshelf', 'Bookshelf Type', 'Rating', 
      'Start Date', 'Finish Date', 'Description', 'Favorite Character',
      'Scene Summary', 'Memorable Moments', 'Review', 'Least Favorite Part'
    ];

    // Convert books to CSV rows
    const rows = books.map(book => [
      `"${(book.title || '').replace(/"/g, '""')}"`,
      `"${(book.author || '').replace(/"/g, '""')}"`,
      `"${(book.bookshelfName || '').replace(/"/g, '""')}"`,
      `"${(book.bookshelfType || '').replace(/"/g, '""')}"`,
      book.rating || 0,
      book.startDate || '',
      book.finishDate || '',
      `"${(book.description || '').replace(/"/g, '""')}"`,
      `"${(book.favoriteCharacter || '').replace(/"/g, '""')}"`,
      `"${(book.sceneSummary || '').replace(/"/g, '""')}"`,
      `"${(book.memorableMoments || '').replace(/"/g, '""')}"`,
      `"${(book.review || '').replace(/"/g, '""')}"`,
      `"${(book.leastFavoritePart || '').replace(/"/g, '""')}"`
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookshelf-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const books = getAllBooksWithBookshelf();
    if (books.length === 0) {
      alert('No books to export');
      return;
    }

    const jsonContent = JSON.stringify(books, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookshelf-export-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import functions
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    try {
      if (fileExtension === 'csv') {
        await importFromCSV(file);
      } else if (fileExtension === 'json') {
        await importFromJSON(file);
      } else {
        alert('Unsupported file format. Please upload a CSV or JSON file.');
        return;
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error importing file. Please check the file format and try again.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const importFromCSV = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row.');
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Find bookshelf column index
    const bookshelfIndex = headers.findIndex(h => h.toLowerCase() === 'bookshelf');
    if (bookshelfIndex === -1) {
      alert('CSV file must have a "Bookshelf" column.');
      return;
    }

    // Parse data rows
    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const bookshelfName = values[bookshelfIndex]?.replace(/^"|"$/g, '') || '';
      if (!bookshelfName) continue;

      // Find or create bookshelf
      let targetShelf = bookshelves.find(s => s.name === bookshelfName);
      if (!targetShelf) {
        // Create new bookshelf
        if (!currentUser) {
          alert('Please log in to import books.');
          return;
        }
        const result = await createBookshelf(currentUser.id, {
          name: bookshelfName,
          animal: 'cat',
          displayMode: 'covers',
          type: 'regular'
        });
        if (result.error) {
          console.error('Error creating bookshelf:', result.error);
          continue;
        }
        targetShelf = { ...result.data, books: [] };
        setBookshelves([...bookshelves, targetShelf]);
      }

      // Map CSV columns to book fields
      const titleIndex = headers.findIndex(h => h.toLowerCase() === 'title');
      const authorIndex = headers.findIndex(h => h.toLowerCase() === 'author');
      const ratingIndex = headers.findIndex(h => h.toLowerCase() === 'rating');
      const startDateIndex = headers.findIndex(h => h.toLowerCase() === 'start date');
      const finishDateIndex = headers.findIndex(h => h.toLowerCase() === 'finish date');
      const descriptionIndex = headers.findIndex(h => h.toLowerCase() === 'description');
      const favoriteCharacterIndex = headers.findIndex(h => h.toLowerCase() === 'favorite character');
      const sceneSummaryIndex = headers.findIndex(h => h.toLowerCase() === 'scene summary');
      const memorableMomentsIndex = headers.findIndex(h => h.toLowerCase() === 'memorable moments');
      const reviewIndex = headers.findIndex(h => h.toLowerCase() === 'review');
      const leastFavoritePartIndex = headers.findIndex(h => h.toLowerCase() === 'least favorite part');

      const bookData = {
        title: titleIndex >= 0 ? values[titleIndex]?.replace(/^"|"$/g, '') || '' : '',
        author: authorIndex >= 0 ? values[authorIndex]?.replace(/^"|"$/g, '') || '' : '',
        rating: ratingIndex >= 0 ? parseInt(values[ratingIndex]?.replace(/^"|"$/g, '')) || 0 : 0,
        startDate: startDateIndex >= 0 ? values[startDateIndex]?.replace(/^"|"$/g, '') || null : null,
        finishDate: finishDateIndex >= 0 ? values[finishDateIndex]?.replace(/^"|"$/g, '') || null : null,
        description: descriptionIndex >= 0 ? values[descriptionIndex]?.replace(/^"|"$/g, '') || '' : '',
        favoriteCharacter: favoriteCharacterIndex >= 0 ? values[favoriteCharacterIndex]?.replace(/^"|"$/g, '') || '' : '',
        sceneSummary: sceneSummaryIndex >= 0 ? values[sceneSummaryIndex]?.replace(/^"|"$/g, '') || '' : '',
        memorableMoments: memorableMomentsIndex >= 0 ? values[memorableMomentsIndex]?.replace(/^"|"$/g, '') || '' : '',
        review: reviewIndex >= 0 ? values[reviewIndex]?.replace(/^"|"$/g, '') || '' : '',
        leastFavoritePart: leastFavoritePartIndex >= 0 ? values[leastFavoritePartIndex]?.replace(/^"|"$/g, '') || '' : '',
        coverUrl: `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(values[titleIndex]?.replace(/^"|"$/g, '') || 'Book')}`
      };

      if (!bookData.title) continue;

      // Create book
      const result = await createBook(targetShelf.id, bookData);
      if (result.error) {
        console.error('Error creating book:', result.error);
        continue;
      }

      // Update local state
      const updatedBookshelves = bookshelves.map(shelf => 
        shelf.id === targetShelf.id
          ? { ...shelf, books: [...shelf.books, transformBookFromDB(result.data)] }
          : shelf
      );
      setBookshelves(updatedBookshelves);
      importedCount++;
    }

    alert(`Successfully imported ${importedCount} books!`);
    await loadData(); // Reload data to ensure consistency
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const importFromJSON = async (file) => {
    const text = await file.text();
    let books;
    try {
      books = JSON.parse(text);
      if (!Array.isArray(books)) {
        alert('JSON file must contain an array of books.');
        return;
      }
    } catch (error) {
      alert('Invalid JSON file format.');
      return;
    }

    let importedCount = 0;
    for (const book of books) {
      if (!book.title) continue;

      const bookshelfName = book.bookshelfName || book.bookshelf || 'Default';
      
      // Find or create bookshelf
      let targetShelf = bookshelves.find(s => s.name === bookshelfName);
      if (!targetShelf) {
        if (!currentUser) {
          alert('Please log in to import books.');
          return;
        }
        const result = await createBookshelf(currentUser.id, {
          name: bookshelfName,
          animal: 'cat',
          displayMode: 'covers',
          type: 'regular'
        });
        if (result.error) {
          console.error('Error creating bookshelf:', result.error);
          continue;
        }
        targetShelf = { ...result.data, books: [] };
        setBookshelves([...bookshelves, targetShelf]);
      }

      // Map JSON fields to book data
      const bookData = {
        title: book.title || '',
        author: book.author || '',
        rating: book.rating || 0,
        startDate: book.startDate || null,
        finishDate: book.finishDate || null,
        description: book.description || '',
        favoriteCharacter: book.favoriteCharacter || '',
        sceneSummary: book.sceneSummary || '',
        memorableMoments: book.memorableMoments || '',
        review: book.review || '',
        leastFavoritePart: book.leastFavoritePart || '',
        coverUrl: book.coverUrl || `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(book.title || 'Book')}`
      };

      // Create book
      const result = await createBook(targetShelf.id, bookData);
      if (result.error) {
        console.error('Error creating book:', result.error);
        continue;
      }

      // Update local state
      const updatedBookshelves = bookshelves.map(shelf => 
        shelf.id === targetShelf.id
          ? { ...shelf, books: [...shelf.books, transformBookFromDB(result.data)] }
          : shelf
      );
      setBookshelves(updatedBookshelves);
      importedCount++;
    }

    alert(`Successfully imported ${importedCount} books!`);
    await loadData(); // Reload data to ensure consistency
  };
  const booksReadThisMonth = getCurrentUserBooksReadThisMonth();
  const remainingBooks = Math.max(0, userProfile.monthlyTarget - booksReadThisMonth);
  const mostReadAuthor = getMostReadAuthor();
  const averageBooksPerMonth = getAverageBooksPerMonth();

  // Generate encouraging message based on user's reading data
  const generateEncouragingMessage = useCallback(() => {
    const allBooks = bookshelves.flatMap(shelf => shelf.books);
    const totalBooks = allBooks.length;
    const ratedBooks = allBooks.filter(b => b.rating > 0);
    const avgRating = ratedBooks.length > 0 
      ? (ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1)
      : 0;
    
    // Analyze reading preferences
    const authors = [...new Set(allBooks.map(b => b.author).filter(Boolean))];
    const genres = []; // Could be extracted from book data if available
    const recentBooks = allBooks
      .filter(b => b.finishDate)
      .sort((a, b) => new Date(b.finishDate) - new Date(a.finishDate))
      .slice(0, 5);
    
    // Generate message based on stats
    const messages = [];
    
    if (totalBooks === 0) {
      messages.push("🌟 Ready to start your reading journey? Add your first book and begin an amazing adventure!");
      messages.push("📚 Every great reader starts with a single book. What will yours be?");
      messages.push("✨ Your bookshelf is waiting for stories! Let's fill it with your favorite reads.");
    } else if (booksReadThisMonth === 0 && userProfile.monthlyTarget > 0) {
      messages.push(`📖 You've read ${totalBooks} amazing books! Ready to add another one this month?`);
      messages.push(`🎯 You're ${remainingBooks} books away from your monthly goal. You've got this!`);
      messages.push(`📚 With ${totalBooks} books under your belt, you're building an impressive collection!`);
    } else if (booksReadThisMonth > 0 && remainingBooks > 0) {
      messages.push(`🔥 Amazing progress! You've read ${booksReadThisMonth} book${booksReadThisMonth > 1 ? 's' : ''} this month. Only ${remainingBooks} more to reach your goal!`);
      messages.push(`📚 ${booksReadThisMonth} down, ${remainingBooks} to go! You're on fire this month!`);
      messages.push(`✨ Keep up the fantastic reading pace! You're ${Math.round((booksReadThisMonth / userProfile.monthlyTarget) * 100)}% of the way to your monthly goal!`);
    } else if (booksReadThisMonth >= userProfile.monthlyTarget && userProfile.monthlyTarget > 0) {
      messages.push(`🎉 Congratulations! You've exceeded your monthly goal with ${booksReadThisMonth} books! You're unstoppable!`);
      messages.push(`🏆 Goal achieved! ${booksReadThisMonth} books this month is incredible. Time to set a new challenge?`);
      messages.push(`⭐ Wow! You've read ${booksReadThisMonth} books this month. You're a reading superstar!`);
    } else if (mostReadAuthor && mostReadAuthor !== 'N/A') {
      messages.push(`📖 You're clearly a fan of ${mostReadAuthor}! Explore more from your favorite author or discover new voices.`);
      messages.push(`🎯 ${mostReadAuthor} seems to be your go-to author. Have you checked out their latest releases?`);
      messages.push(`✨ Your love for ${mostReadAuthor} shows great taste! Consider branching out to similar authors.`);
    } else if (avgRating >= 4) {
      messages.push(`⭐ With an average rating of ${avgRating} stars, you clearly know how to pick great books!`);
      messages.push(`🌟 Your ${avgRating}-star average shows you're finding books you truly love. Keep exploring!`);
      messages.push(`📚 Your high ratings (${avgRating} stars) mean you're curating an excellent collection!`);
    } else if (totalBooks >= 50) {
      messages.push(`📚 Wow! ${totalBooks} books is an incredible achievement. You're a true bibliophile!`);
      messages.push(`🏆 ${totalBooks} books read! That's a library to be proud of. What's next on your list?`);
      messages.push(`✨ ${totalBooks} books and counting! Your reading journey is inspiring.`);
    } else if (totalBooks >= 20) {
      messages.push(`📖 ${totalBooks} books is impressive! You're building a wonderful reading habit.`);
      messages.push(`🎯 Great progress with ${totalBooks} books! Every page turns you into a better reader.`);
      messages.push(`✨ ${totalBooks} books read! You're on an amazing literary journey.`);
    } else {
      messages.push(`📚 You've read ${totalBooks} book${totalBooks > 1 ? 's' : ''}! Every book is a new adventure.`);
      messages.push(`🌟 ${totalBooks} books and growing! Your reading collection is taking shape beautifully.`);
      messages.push(`📖 ${totalBooks} books read! Keep going - each book adds to your story.`);
    }
    
    // Add variety based on recent activity
    if (recentBooks.length > 0) {
      const lastBook = recentBooks[0];
      if (lastBook.rating >= 4) {
        messages.push(`⭐ You loved "${lastBook.title}"! Ready to find your next 5-star read?`);
      }
    }
    
    // Randomly select a message to ensure variety
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    return randomMessage;
  }, [bookshelves, booksReadThisMonth, remainingBooks, userProfile.monthlyTarget, mostReadAuthor]);

  // Generate message on load or when data changes
  // Add a small delay to ensure message changes on each load
  useEffect(() => {
    if (currentUser && bookshelves.length > 0) {
      // Small delay to ensure fresh message generation
      const timer = setTimeout(() => {
        const message = generateEncouragingMessage();
        setEncouragingMessage(message);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentUser, bookshelves.length, booksReadThisMonth, userProfile.monthlyTarget, mostReadAuthor, generateEncouragingMessage]);

  // Show loading state while user is being loaded
  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (!currentUser) {
      const timeout = setTimeout(() => {
        if (!currentUser && !defaultUser) {
          console.error('Loading timeout: No user loaded after 5 seconds. Creating temporary user.');
          // Create a temporary user to prevent infinite loading
          const tempUser = { id: 'temp-' + Date.now(), username: 'Guest' };
          setCurrentUser(tempUser);
          setDefaultUser(tempUser);
        } else if (!currentUser && defaultUser) {
          // If defaultUser exists but currentUser doesn't, set it
          setCurrentUser(defaultUser);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [currentUser, defaultUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">If this takes too long, check the browser console for errors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <Header
        currentUser={currentUser}
        totalBooks={bookshelves.flatMap(shelf => shelf.books || []).length}
        activeShelf={getActiveBookshelf()}
        onShowUserComparison={async () => {
          setShowUserComparison(true);
          await Promise.all([
            loadUserProfiles(),
            loadUserStats()
          ]);
        }}
        onShowAbout={() => setShowAboutModal(true)}
        onShowProfile={() => setShowProfile(true)}
        onGenerateRecommendations={() => generateRecommendations()}
      />

      {/* User Stats Section */}
      <UserStatsSection
        currentUser={currentUser}
        userProfile={userProfile}
        userXP={userXP}
        userStreak={userStreak}
        recentAchievements={recentAchievements}
        totalBooksCount={getTotalBooksCount()}
        booksReadThisMonth={booksReadThisMonth}
        remainingBooks={remainingBooks}
        encouragingMessage={encouragingMessage}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs for Active and Completed Bookshelves */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => {
                const regular = getRegularBookshelves();
                if (regular.length > 0) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === regular[0].id));
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
            >
              Books ({getTotalBooksCount()})
            </button>
            <button
              onClick={() => {
                const completed = getCompletedBookshelves();
                if (completed.length > 0) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === completed[0].id));
                }
              }}
              className="px-2 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center"
            >
              <Check className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Completed ({getCompletedBookshelves().length})</span>
            </button>
            <button
              onClick={() => {
                const wishlist = getWishlistBookshelf();
                if (wishlist) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === wishlist.id));
                }
              }}
              className="px-2 sm:px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 flex items-center justify-center"
            >
              <Heart className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Wishlist ({getWishlistBookshelf()?.books.length || 0})</span>
            </button>
            <button
              onClick={() => {
                const favorites = getFavoritesBookshelf();
                if (favorites) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === favorites.id));
                }
              }}
              className="px-2 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 flex items-center justify-center"
            >
              <Star className="w-4 h-4 sm:mr-1 fill-current" />
              <span className="hidden sm:inline">Favorites ({getFavoritesBookshelf()?.books.length || 0})</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Book
            </button>
            <button
              onClick={createNewBookshelf}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              New Bookshelf
            </button>
          </div>

          {/* Bookshelf Selector */}
          {activeShelf && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
              {isEditingBookshelfName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingBookshelfName}
                    onChange={(e) => setEditingBookshelfName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveBookshelfName();
                      } else if (e.key === 'Escape') {
                        cancelEditingBookshelfName();
                      }
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={saveBookshelfName}
                    className="px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Save name"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={cancelEditingBookshelfName}
                    className="px-2 sm:px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select
                    value={activeBookshelfIndex}
                    onChange={(e) => {
                      isUpdatingRef.current = true;
                      setActiveBookshelfIndex(parseInt(e.target.value));
                      setIsEditingBookshelfName(false);
                      setEditingBookshelfName('');
                      saveActiveIndex(); // Save active index
                    }}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {bookshelves.map((shelf, index) => (
                      <option key={shelf.id} value={index}>
                        {shelf.name} {shelf.animal ? ANIMAL_THEMES[shelf.animal]?.emoji : ''} {
                          shelf.type === 'wishlist'
                            ? `(${shelf.books.length})` 
                            : `(${shelf.books.length}/10)`
                        }
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={startEditingBookshelfName}
                    className="px-2 sm:px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                    title="Edit bookshelf name"
                  >
                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {activeShelf && activeShelf.type === 'regular' && (
                    <button
                      onClick={() => handleDeleteBookshelf(activeShelf.id)}
                      className="px-2 sm:px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                      title="Delete bookshelf"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {activeShelf.type !== 'wishlist' && activeShelf.type !== 'favorites' && (
                  <select
                    value={activeShelf.animal}
                    onChange={async (e) => {
                      const newAnimal = e.target.value;
                      if (!activeShelf || !activeShelf.id) {
                        alert('Error: No bookshelf selected or invalid bookshelf ID');
                        return;
                      }

                      isUpdatingRef.current = true;
                      
                      try {
                        // Update in database
                        const result = await updateBookshelf(activeShelf.id, {
                          animal: newAnimal
                        });
                        
                        if (result.error) {
                          console.error('Error updating bookshelf animal in database:', result.error);
                          alert(`Failed to save animal selection to database: ${result.error.message || 'Unknown error'}. The change may not persist after page reload.`);
                          // Continue with local update so user sees the change
                        } else {
                          console.log('Bookshelf animal updated successfully in database:', result.data);
                        }

                        // Update local state
                        const updated = [...bookshelves];
                        updated[activeBookshelfIndex] = { ...updated[activeBookshelfIndex], animal: newAnimal };
                        setBookshelves(updated);
                      } catch (error) {
                        console.error('Error updating bookshelf animal:', error);
                        alert(`Error updating animal: ${error.message || 'Unknown error'}. The change may not persist after page reload.`);
                        // Still update local state so user sees the change
                        const updated = [...bookshelves];
                        updated[activeBookshelfIndex] = { ...updated[activeBookshelfIndex], animal: newAnimal };
                        setBookshelves(updated);
                      } finally {
                        isUpdatingRef.current = false;
                      }
                    }}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
                  >
                    {Object.entries(ANIMAL_THEMES).filter(([key]) => key !== 'heart' && key !== 'sparkles').map(([key, theme]) => (
                      <option key={key} value={key}>
                        {theme.emoji} {theme.name}
                      </option>
                    ))}
                  </select>
                )}

                  <button
                    onClick={() => {
                      const updated = [...bookshelves];
                      updated[activeBookshelfIndex].displayMode = 'covers';
                      setBookshelves(updated);
                      setDisplayMode('covers');
                    }}
                    className={`px-2 sm:px-3 py-2 rounded-lg flex-shrink-0 ${activeShelf.displayMode === 'covers' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    title="Grid view"
                  >
                    <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const updated = [...bookshelves];
                      updated[activeBookshelfIndex].displayMode = 'spines';
                      setBookshelves(updated);
                      setDisplayMode('spines');
                    }}
                    className={`px-2 sm:px-3 py-2 rounded-lg flex-shrink-0 ${activeShelf.displayMode === 'spines' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    title="Spine view"
                  >
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const updated = [...bookshelves];
                      updated[activeBookshelfIndex].displayMode = 'table';
                      setBookshelves(updated);
                      setDisplayMode('table');
                    }}
                    className={`px-2 sm:px-3 py-2 rounded-lg flex-shrink-0 ${activeShelf.displayMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    title="Table view"
                  >
                    <Table className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search books or authors..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 flex gap-3"
                    >
                      <img src={result.coverUrl} alt={result.title} className="w-12 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{result.title}</div>
                        <div className="text-sm text-gray-600">{result.author}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Filter</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10">
                  <button
                    onClick={() => { setFilterBy('all'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    All Books
                  </button>
                  <button
                    onClick={() => { setFilterBy('rating5'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    5 Star Ratings
                  </button>
                  <button
                    onClick={() => { setFilterBy('rating4+'); setShowFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    4+ Star Ratings
                  </button>
                  {uniqueAuthors.length > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">By Author</div>
                      {uniqueAuthors.map(author => (
                        <button
                          key={author}
                          onClick={() => { setFilterBy(`author:${author}`); setShowFilterDropdown(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          {author}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bookshelf Display */}
        <BookshelfDisplay
          activeShelf={activeShelf}
          filteredBooks={filteredBooks}
          allBooksWithBookshelf={getAllBooksWithBookshelf()}
          totalBookshelves={bookshelves.length}
          failedImages={failedImages}
          failedImagesRef={failedImagesRef}
          imageRetryCountsRef={imageRetryCountsRef}
          pendingFailedUpdatesRef={pendingFailedUpdatesRef}
          setFailedImages={setFailedImages}
          onBookClick={(book) => {
            setSelectedBook(book);
            setShowDetailsModal(true);
          }}
          onExportCSV={exportToCSV}
          onExportJSON={exportToJSON}
          onImport={handleFileUpload}
        />
      </div>

      {/* Add Book Modal */}
      <AddBookModal
        show={showAddModal}
        newBook={newBook}
        setNewBook={setNewBook}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onClose={() => setShowAddModal(false)}
        onSearchChange={handleSearchChange}
        onSelectResult={selectSearchResult}
        onImageUpload={handleImageUpload}
        onAddBook={addBook}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        show={showDetailsModal}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        onClose={() => setShowDetailsModal(false)}
        onUpdateBook={handleUpdateBook}
        onImageUpload={handleImageUpload}
        onDeleteBook={handleDeleteBook}
        onMoveBook={(book) => {
          setBookToMove(book);
          setShowMoveModal(true);
        }}
      />

      {/* Recommendations Modal */}
      <RecommendationsModal
        show={showRecommendations}
        recommendations={recommendations}
        isLoadingRecommendations={isLoadingRecommendations}
        onClose={() => setShowRecommendations(false)}
        onAddToWishlist={addRecommendationToWishlist}
        onIgnore={ignoreSuggestion}
        onGetMore={() => generateRecommendations(true)}
      />

      {/* Profile Modal */}
      <ProfileModal
        show={showProfile}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        currentUser={currentUser}
        authUser={authUser}
        showAvatarSelector={showAvatarSelector}
        setShowAvatarSelector={setShowAvatarSelector}
        profileError={profileError}
        profileSuccess={profileSuccess}
        profileLoading={profileLoading}
        allBooks={allBooks}
        bookshelves={bookshelves}
        booksReadThisMonth={booksReadThisMonth}
        remainingBooks={remainingBooks}
        averageBooksPerMonth={averageBooksPerMonth}
        mostReadAuthor={mostReadAuthor}
        userXP={userXP}
        userStreak={userStreak}
        recentAchievements={recentAchievements}
        onClose={() => {
          setShowProfile(false);
          setProfileError('');
          setProfileSuccess('');
          setShowAvatarSelector(false);
        }}
        onChangeUser={handleChangeUser}
        onLogout={logout}
        onSave={async () => {
          setProfileLoading(true);
          setProfileError('');
          setProfileSuccess('');
          
          try {
            const result = await updateUserProfile(currentUser.id, {
              name: userProfile.name,
              monthly_target: userProfile.monthlyTarget,
              avatar: userProfile.avatar,
              bio: userProfile.bio,
              feedback: userProfile.feedback,
              hide_from_comparison: userProfile.hideFromComparison || false
            });
            
            if (result.error) {
              throw result.error;
            }
            
            setProfileSuccess('Profile saved successfully!');
            setTimeout(() => {
              setShowProfile(false);
              setProfileSuccess('');
              setShowAvatarSelector(false);
            }, 1000);
          } catch (error) {
            console.error('Error saving profile:', error);
            setProfileError('Failed to save profile. Please try again.');
          } finally {
            setProfileLoading(false);
          }
        }}
      />

      {/* Move Book Modal */}
      <MoveBookModal
        show={showMoveModal}
        bookToMove={bookToMove}
        bookshelves={bookshelves}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMoveBook}
      />

      {/* Login Modal */}
      <LoginModal
        show={showLoginModal}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        confirmPassword={confirmPassword}
        loginMode={loginMode}
        passwordMode={passwordMode}
        emailSent={emailSent}
        isVerifying={isVerifying}
        authUser={authUser}
        defaultUser={defaultUser}
        onClose={() => {
          setShowLoginModal(false);
          setEmailSent(false);
          setLoginEmail('');
          setLoginPassword('');
          setConfirmPassword('');
          setIsVerifying(false);
          setLoginMode('password');
          setPasswordMode('login');
          if (!currentUser && defaultUser) {
            setCurrentUser(defaultUser);
          }
        }}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onLoginModeChange={(mode) => {
          setLoginMode(mode);
          setLoginPassword('');
          setEmailSent(false);
        }}
        onPasswordModeChange={(mode) => {
          setPasswordMode(mode);
          setLoginPassword('');
          setConfirmPassword('');
        }}
        onPasswordLogin={handlePasswordLogin}
        onEmailLogin={handleEmailLogin}
        onUseDefaultUser={(user) => setCurrentUser(user)}
      />

      {/* About Modal */}
      <AboutBookshelfModal show={showAboutModal} onClose={() => setShowAboutModal(false)} />


      {/* User Comparison Modal */}
      <UserComparisonModal
        show={showUserComparison}
        users={users}
        currentUser={currentUser}
        userProfiles={userProfiles}
        userStats={userStats}
        loadingUserStats={loadingUserStats}
        onClose={() => setShowUserComparison(false)}
        getTotalBooksRead={getTotalBooksRead}
        getBooksReadThisMonth={getBooksReadThisMonth}
      />

      {/* Level Up Modal */}
      <LevelUpModal
        show={showLevelUpModal}
        levelUpData={levelUpData}
        onClose={() => {
          setShowLevelUpModal(false);
          setLevelUpData(null);
        }}
      />

      {/* Achievement Modal */}
      <AchievementModal
        show={showAchievementModal}
        achievement={newAchievement}
        onClose={() => {
          setShowAchievementModal(false);
          setNewAchievement(null);
        }}
      />

    </div>
  );
}

