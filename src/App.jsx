/**
 * Main App Component
 * 
 * This is the main application component for the Bookshelf app.
 * Fully migrated to use Supabase database - all data operations use Supabase services.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Book, Star, Calendar, User, Plus, X, Filter, Sparkles, ChevronDown, ChevronUp, Target, Settings, Grid, List, Heart, BookOpen, Edit2, Check, Upload, Image as ImageIcon, Info, Save, MessageSquare, Table, Download, FileUp } from 'lucide-react';
import AboutBookshelfModal from './components/AboutBookshelfModal';

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
  transformBookFromDB 
} from './services/bookService';
import { 
  createBookshelf, 
  updateBookshelf, 
  deleteBookshelf, 
  getUserBookshelves,
  ensureDefaultBookshelves 
} from './services/bookshelfService';
import { 
  getIgnoredSuggestions, 
  ignoreSuggestion as ignoreSuggestionService,
  unignoreSuggestion 
} from './services/suggestionService';

// Avatar Selector Component (inline)
const AvatarSelectorInline = ({ currentAvatar, onSelect }) => {
  const avatars = [
    '📚', '🦦', '👦', '👧', '🧑', '👨', '👩', '👴', '👵',
    '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
    '🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐸', '🐷', '🐮', '🐹', '🐭', '🦊', '🐺',
    '🎃', '👻', '🤖', '👽', '👾', '🤡', '💀', '☠️',
    '🦄', '🐉', '🐲', '🦋', '🐝', '🐞', '🦗', '🕷️',
    '🌞', '⭐', '🌟', '💫', '✨', '🔥', '💧', '⚡',
    '🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎬', '🎤'
  ];

  const [selected, setSelected] = useState(currentAvatar || '📚');

  useEffect(() => {
    setSelected(currentAvatar || '📚');
  }, [currentAvatar]);

  const handleSelect = (avatar) => {
    setSelected(avatar);
    onSelect(avatar);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
        {avatars.map((avatar, index) => (
          <button
            key={index}
            onClick={() => handleSelect(avatar)}
            className={`w-10 h-10 rounded-full text-2xl flex items-center justify-center transition-all transform hover:scale-110 relative ${
              selected === avatar
                ? 'bg-yellow-400 ring-2 ring-yellow-300 ring-offset-2 ring-offset-gray-50'
                : 'bg-white hover:bg-gray-100 border border-gray-200'
            }`}
            title={`Select ${avatar}`}
          >
            {avatar}
            {selected === avatar && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center">
        Click an emoji to select it as your avatar
      </div>
    </div>
  );
};

// TODO: Remove this and use the imported version from constants/animalThemes.js
// import { ANIMAL_THEMES } from './constants/animalThemes';
const ANIMAL_THEMES = {
  cat: { 
    name: 'Cat', 
    emoji: '🐱', 
    colors: { primary: 'from-pink-500 to-rose-500', secondary: 'bg-pink-100', accent: 'text-pink-600' },
    decorations: ['🐱', '🐾', '💕', '⭐'],
    animation: 'float'
  },
  dog: { 
    name: 'Dog', 
    emoji: '🐶', 
    colors: { primary: 'from-amber-500 to-orange-500', secondary: 'bg-amber-100', accent: 'text-amber-600' },
    decorations: ['🐶', '🦴', '🎾', '⭐'],
    animation: 'bounce'
  },
  bunny: { 
    name: 'Bunny', 
    emoji: '🐰', 
    colors: { primary: 'from-purple-500 to-indigo-500', secondary: 'bg-purple-100', accent: 'text-purple-600' },
    decorations: ['🐰', '🥕', '🌸', '✨'],
    animation: 'hop'
  },
  bear: { 
    name: 'Bear', 
    emoji: '🐻', 
    colors: { primary: 'from-brown-500 to-amber-800', secondary: 'bg-amber-100', accent: 'text-amber-700' },
    decorations: ['🐻', '🍯', '🌲', '⭐'],
    animation: 'sway'
  },
  panda: { 
    name: 'Panda', 
    emoji: '🐼', 
    colors: { primary: 'from-gray-600 to-gray-800', secondary: 'bg-gray-100', accent: 'text-gray-700' },
    decorations: ['🐼', '🎋', '🍃', '⭐'],
    animation: 'float'
  },
  fox: { 
    name: 'Fox', 
    emoji: '🦊', 
    colors: { primary: 'from-orange-500 to-red-500', secondary: 'bg-orange-100', accent: 'text-orange-600' },
    decorations: ['🦊', '🍇', '🍂', '✨'],
    animation: 'dash'
  },
  owl: { 
    name: 'Owl', 
    emoji: '🦉', 
    colors: { primary: 'from-yellow-600 to-amber-600', secondary: 'bg-yellow-100', accent: 'text-yellow-700' },
    decorations: ['🦉', '🌙', '⭐', '✨'],
    animation: 'glide'
  },
  penguin: { 
    name: 'Penguin', 
    emoji: '🐧', 
    colors: { primary: 'from-blue-600 to-indigo-600', secondary: 'bg-blue-100', accent: 'text-blue-600' },
    decorations: ['🐧', '❄️', '🌊', '⭐'],
    animation: 'slide'
  },
  heart: { 
    name: 'Heart', 
    emoji: '❤️', 
    colors: { primary: 'from-red-500 to-pink-500', secondary: 'bg-red-100', accent: 'text-red-600' },
    decorations: ['❤️', '💕', '✨', '⭐'],
    animation: 'pulse'
  },
  sparkles: { 
    name: 'Sparkles', 
    emoji: '✨', 
    colors: { primary: 'from-purple-500 to-pink-500', secondary: 'bg-purple-100', accent: 'text-purple-600' },
    decorations: ['✨', '⭐', '💫', '🌟'],
    animation: 'sparkle'
  },
};

export default function App() {
  const [bookshelves, setBookshelves] = useState([]);
  const [activeBookshelfIndex, setActiveBookshelfIndex] = useState(0);
  const isUpdatingRef = useRef(false); // Prevent loadData from overwriting during updates
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
  const [userProfile, setUserProfile] = useState({
    name: '',
    monthlyTarget: 0,
    avatar: '📚',
    bio: '',
    feedback: ''
  });
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isEditingBookshelfName, setIsEditingBookshelfName] = useState(false);
  const [editingBookshelfName, setEditingBookshelfName] = useState('');
  const [ignoredSuggestions, setIgnoredSuggestions] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [bookToMove, setBookToMove] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [allRecommendationsPool, setAllRecommendationsPool] = useState([]);
  const [failedImages, setFailedImages] = useState(new Set()); // Track books with failed images after retries
  const imageRetryCountsRef = useRef({}); // Use ref to avoid re-renders during retries
  const failedImagesRef = useRef(new Set()); // Use ref to avoid re-renders during retries
  const pendingFailedUpdatesRef = useRef(new Set()); // Track pending failed images to batch update
  const [currentUser, setCurrentUser] = useState(null); // Current logged in user (from bk_users table)
  const [authUser, setAuthUser] = useState(null); // Supabase auth user
  const [users, setUsers] = useState([]); // All users in the app
  const [userProfiles, setUserProfiles] = useState({}); // Map of userId -> profile data
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserComparison, setShowUserComparison] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'magiclink'
  const [passwordMode, setPasswordMode] = useState('login'); // 'login' or 'signup'
  const [defaultUser, setDefaultUser] = useState(null); // Default user for unverified access

  // Initialize auth and load default user
  useEffect(() => {
    initializeAuth();
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const verified = isEmailVerified(session.user);
        if (verified) {
          // User is verified, get/create app user
          const { data: appUser, error } = await getOrCreateAppUser(session.user.id, session.user.email);
          if (appUser && !error) {
            setAuthUser(session.user);
            setCurrentUser(appUser);
            setShowLoginModal(false);
            setEmailSent(false);
          }
        } else {
          // Email not verified yet, keep using default user
          console.log('Email not verified yet, using default user');
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setCurrentUser(defaultUser);
        setShowLoginModal(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const verified = isEmailVerified(session.user);
        if (verified) {
          const { data: appUser } = await getOrCreateAppUser(session.user.id, session.user.email);
          if (appUser) {
            setAuthUser(session.user);
            setCurrentUser(appUser);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [defaultUser]);

  // Test connection on mount (for debugging)
  useEffect(() => {
    // Uncomment the line below to test connection on app load
    // import('./config/supabase').then(({ testConnection }) => testConnection().then(result => console.log('DB Connection Test:', result)));
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...');
      // First, load default user for unverified access
      const loadedDefaultUser = await loadDefaultUser();
      console.log('Loaded default user:', loadedDefaultUser?.username || 'none');

      // Check for existing auth session
      const { user: sessionUser, session } = await getCurrentSession();
      
      if (sessionUser && isEmailVerified(sessionUser)) {
        // User is authenticated and verified
        const { data: appUser, error } = await getOrCreateAppUser(sessionUser.id, sessionUser.email);
        if (appUser && !error) {
          setAuthUser(sessionUser);
          setCurrentUser(appUser);
          setShowLoginModal(false);
        } else {
          // Fallback to default user if app user creation fails
          console.error('Error getting app user:', error);
          if (loadedDefaultUser) {
            setCurrentUser(loadedDefaultUser);
            setDefaultUser(loadedDefaultUser);
          } else if (defaultUser) {
            setCurrentUser(defaultUser);
          }
        }
      } else if (sessionUser && !isEmailVerified(sessionUser)) {
        // User signed in but email not verified - use default user
        console.log('Email not verified, using default user');
        setIsVerifying(true);
        if (loadedDefaultUser) {
          setCurrentUser(loadedDefaultUser);
          setDefaultUser(loadedDefaultUser);
        } else if (defaultUser) {
          setCurrentUser(defaultUser);
        }
        setShowLoginModal(true);
      } else {
        // No auth session - use default user
        if (loadedDefaultUser) {
          setCurrentUser(loadedDefaultUser);
          setDefaultUser(loadedDefaultUser);
        } else if (defaultUser) {
          setCurrentUser(defaultUser);
        }
        setShowLoginModal(true);
      }

      // Load all users for comparison
      const { data: allUsers } = await getAllUsers();
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Ensure we always have a user to prevent infinite loading
      if (defaultUser) {
        setCurrentUser(defaultUser);
      } else {
        // Last resort: create a temporary user object to prevent infinite loading
        console.warn('No default user available, creating temporary user');
        const tempUser = { id: 'temp', username: 'Guest' };
        setCurrentUser(tempUser);
        setDefaultUser(tempUser);
      }
    }
  };

  const loadDefaultUser = async () => {
    try {
      console.log('Loading default user...');
      const defaultUsername = 'Default User';
      const { data: fetchedUser, error: fetchError } = await getUserByUsername(defaultUsername);
      
      if (fetchError) {
        console.warn('Error fetching default user:', fetchError);
      }
      
      if (fetchedUser) {
        console.log('Default user found:', fetchedUser.username);
        setDefaultUser(fetchedUser);
        return fetchedUser;
      }

      // Try to get any existing user as fallback
      console.log('Default user not found, checking for any existing users...');
      const { data: allUsers, error: allUsersError } = await getAllUsers();
      
      if (allUsersError) {
        console.warn('Error fetching all users:', allUsersError);
      }
      
      if (allUsers && allUsers.length > 0) {
        console.log('Found existing user:', allUsers[0].username);
        setDefaultUser(allUsers[0]);
        return allUsers[0];
      }

      // If no users exist, create a default user
      console.log('No users found, creating default user...');
      const { data: newUser, error: createError } = await createUser(defaultUsername);
      if (newUser && !createError) {
        console.log('Default user created successfully:', newUser.username);
        setDefaultUser(newUser);
        return newUser;
      } else {
        console.error('Error creating default user:', createError);
      }

      console.warn('Could not load or create default user');
      return null;
    } catch (error) {
      console.error('Error loading default user:', error);
      return null;
    }
  };

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
          feedback: profileData.feedback || ''
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
    // For other users, would need to fetch from database (can be async later)
    return 0;
  };

  const getTotalBooksRead = (userId) => {
    if (!userId || userId === currentUser?.id) {
      // For current user, use local state
      return bookshelves.reduce((total, shelf) => total + (shelf.books?.length || 0), 0);
    }
    // For other users, would need to fetch from database (can be async later)
    return 0;
  };


  // Content filter to ensure all suggestions are age-appropriate for teens
  const isAgeAppropriate = (title, author) => {
    // List of books that are not appropriate for teens (mature content, sexual themes, etc.)
    const inappropriateBooks = [
      { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid" },
      { title: "The Handmaid's Tale", author: "Margaret Atwood" },
      { title: "The Kite Runner", author: "Khaled Hosseini" },
      { title: "The Song of Achilles", author: "Madeline Miller" },
      { title: "Circe", author: "Madeline Miller" },
      { title: "Where the Crawdads Sing", author: "Delia Owens" },
      { title: "Educated", author: "Tara Westover" },
      { title: "Fifty Shades of Grey", author: "E.L. James" },
      { title: "Lolita", author: "Vladimir Nabokov" },
      { title: "American Psycho", author: "Bret Easton Ellis" },
      { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson" },
      { title: "Gone Girl", author: "Gillian Flynn" },
      { title: "The Girl on the Train", author: "Paula Hawkins" },
      { title: "Fight Club", author: "Chuck Palahniuk" },
      { title: "A Clockwork Orange", author: "Anthony Burgess" }
    ];
    
    return !inappropriateBooks.some(book => 
      book.title.toLowerCase() === title.toLowerCase() && 
      book.author.toLowerCase() === author.toLowerCase()
    );
  };

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


  const getCurrentUserBooksReadThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const allBooks = bookshelves.flatMap(shelf => shelf.books);
    return allBooks.filter(book => {
      if (!book.finishDate) return false;
      const finishDate = new Date(book.finishDate);
      return finishDate.getMonth() === currentMonth && finishDate.getFullYear() === currentYear;
    }).length;
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
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className={`bg-gradient-to-br ${theme.colors.primary} p-2 sm:p-3 rounded-xl flex items-center justify-center`}>
                <span className="text-2xl sm:text-4xl">📚</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">My Bookshelf</h1>
                <p className="text-xs sm:text-base text-gray-600">{allBooks.length} books</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-3 w-full sm:w-auto justify-end">
              {currentUser && (
                <button
                  onClick={async () => {
                    setShowUserComparison(true);
                    // Load profiles for all users when opening comparison
                    await loadUserProfiles();
                  }}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-all text-xs sm:text-base"
                  title="Compare Users"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Compare Users</span>
                </button>
              )}
              <button
                onClick={() => setShowAboutModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-all text-xs sm:text-base"
                title="About Bookshelf"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">About</span>
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg sm:rounded-xl hover:bg-purple-600 transition-all text-xs sm:text-base"
                title="Profile"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={() => generateRecommendations()}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md text-xs sm:text-base"
                title="Recommendations"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Recommendations</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md text-xs sm:text-base"
                title="Add Book"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
              Completed ({getCompletedBookshelves().length})
            </button>
            <button
              onClick={() => {
                const wishlist = getWishlistBookshelf();
                if (wishlist) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === wishlist.id));
                }
              }}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700"
            >
              <Heart className="w-4 h-4 inline mr-1" />
              Wishlist ({getWishlistBookshelf()?.books.length || 0})
            </button>
            <button
              onClick={() => {
                const favorites = getFavoritesBookshelf();
                if (favorites) {
                  setActiveBookshelfIndex(bookshelves.findIndex(s => s.id === favorites.id));
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600"
            >
              ⭐ Favorites ({getFavoritesBookshelf()?.books.length || 0})
            </button>
            <button
              onClick={createNewBookshelf}
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
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
        <div className={`bg-gradient-to-b ${theme.colors.primary} rounded-2xl shadow-2xl p-8 relative overflow-hidden`}>
          <div className={`bg-white/20 rounded-xl p-6 min-h-[400px] relative z-10`}>
            {filteredBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-white">
                <div className="text-8xl mb-4 opacity-75">📚</div>
                <p className="text-xl font-semibold">Your bookshelf is empty</p>
                <p className="text-sm opacity-75">Add your first book to get started!</p>
              </div>
            ) : (
              activeShelf?.displayMode === 'table' ? (
                // Table View
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">All Books - Table View</h3>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <FileUp className="w-4 h-4" />
                        Import
                        <input
                          type="file"
                          accept=".csv,.json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={exportToCSV}
                        className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Export to CSV"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        onClick={exportToJSON}
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
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Title</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Author</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Bookshelf</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b">Rating</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Start Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Finish Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Description</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Favorite Character</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Scene Summary</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Memorable Moments</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Review</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Least Favorite Part</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAllBooksWithBookshelf().map((book, index) => (
                          <tr 
                            key={book.id || index}
                            className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                            onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">{book.title || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{book.author || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">
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
                            <td className="px-4 py-3 text-gray-600">{book.startDate || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{book.finishDate || '-'}</td>
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
                    Total: {getAllBooksWithBookshelf().length} books across {bookshelves.length} bookshelves
                  </div>
                </div>
              ) : (
                <div className={`flex ${activeShelf?.displayMode === 'spines' ? 'flex-wrap gap-3 items-end' : 'flex-wrap gap-4'}`}>
                  {filteredBooks.map((book, index) => (
                    activeShelf?.displayMode === 'spines' ? (
                    <button
                      key={book.id}
                      onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                      className="relative group"
                      style={{ 
                        perspective: '1000px',
                        height: '300px'
                      }}
                    >
                      {/* Book Spine with 3D effect */}
                      <div
                        className="relative h-full transition-all duration-300 transform hover:scale-105"
                        style={{
                          width: '55px',
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Main spine face */}
                        <div
                          className="absolute inset-0 rounded-sm shadow-2xl transition-all duration-300 overflow-hidden"
                          style={{
                            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 45%)`,
                            transform: 'rotateY(-2deg)',
                            boxShadow: 'inset -3px 0 10px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
                            backgroundImage: book.coverUrl && !book.coverUrl.includes('placeholder') 
                              ? `linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.1)), url(${book.coverUrl})`
                              : `linear-gradient(135deg, hsl(${(index * 25) % 360}, 65%, 45%) 0%, hsl(${(index * 25) % 360}, 65%, 35%) 100%)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'left center',
                          }}
                        >
                          {/* Top binding line */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                          
                          {/* Bottom binding line */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                          
                          {/* Left edge highlight (spine edge) */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                          
                          {/* Right edge shadow (spine edge) */}
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/40 to-transparent"></div>
                          
                          {/* Text on spine */}
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <div 
                              className="text-white font-bold text-xs leading-tight transform -rotate-90 whitespace-nowrap"
                              style={{
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                                letterSpacing: '0.5px',
                                maxWidth: '250px',
                              }}
                            >
                              {book.title.length > 25 ? book.title.substring(0, 25) + '...' : book.title}
                            </div>
                          </div>
                          
                          {/* Author on spine (smaller, at bottom) */}
                          {book.author && (
                            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
                              <div 
                                className="text-white/80 text-[10px] font-medium transform -rotate-90 whitespace-nowrap"
                                style={{
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  maxWidth: '200px',
                                }}
                              >
                                {book.author.length > 20 ? book.author.substring(0, 20) + '...' : book.author}
                              </div>
                            </div>
                          )}
                          
                          {/* Subtle texture overlay */}
                          <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                          }}></div>
                        </div>
                        
                        {/* Top edge of book (when viewed from side) */}
                        <div
                          className="absolute top-0 left-0 right-0 h-2 rounded-t-sm"
                          style={{
                            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 55%)`,
                            transform: 'rotateX(88deg) translateZ(2px)',
                            transformOrigin: 'top center',
                            boxShadow: '0 -2px 5px rgba(0,0,0,0.3)',
                          }}
                        ></div>
                        
                        {/* Bottom edge of book (when viewed from side) */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 rounded-b-sm"
                          style={{
                            backgroundColor: `hsl(${(index * 25) % 360}, 65%, 35%)`,
                            transform: 'rotateX(-88deg) translateZ(2px)',
                            transformOrigin: 'bottom center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          }}
                        ></div>
                      </div>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-20 shadow-xl pointer-events-none">
                        <div className="font-semibold">{book.title}</div>
                        {book.author && <div className="text-gray-300 text-[10px] mt-1">{book.author}</div>}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                  ) : (
                    <div key={book.id} className="group relative">
                      <button
                        onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                        className="w-full"
                      >
                        <div className="transform transition-all hover:scale-105 hover:-translate-y-2">
                          {failedImages.has(book.id) || failedImagesRef.current.has(book.id) ? (
                            // Text fallback when image fails after retries
                            <div className="w-32 h-48 rounded-lg shadow-xl border-2 border-white/50 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center p-3 text-center">
                              <div className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                                {book.title}
                              </div>
                              {book.author && (
                                <div className="text-white/90 text-xs leading-tight line-clamp-2">
                                  {book.author}
                                </div>
                              )}
                            </div>
                          ) : (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-32 h-48 object-cover rounded-lg shadow-xl border-2 border-white/50"
                              onError={(e) => {
                                const currentRetries = imageRetryCountsRef.current[book.id] || 0;
                                const maxRetries = 2; // Reduced retries to minimize flickering
                                
                                // Only retry if it's a web URL (not data URL or placeholder)
                                const isWebUrl = book.coverUrl && 
                                  !book.coverUrl.startsWith('data:') && 
                                  !book.coverUrl.includes('placeholder') &&
                                  (book.coverUrl.startsWith('http://') || book.coverUrl.startsWith('https://'));
                                
                                if (isWebUrl && currentRetries < maxRetries) {
                                  // Retry using ref to avoid re-render
                                  imageRetryCountsRef.current[book.id] = currentRetries + 1;
                                  
                                  // Force reload by adding cache-busting parameter
                                  const separator = book.coverUrl.includes('?') ? '&' : '?';
                                  e.target.src = `${book.coverUrl}${separator}_retry=${currentRetries + 1}`;
                                } else {
                                  // Mark as failed in ref immediately to prevent flickering
                                  failedImagesRef.current.add(book.id);
                                  pendingFailedUpdatesRef.current.add(book.id);
                                  
                                  // Batch update state after a short delay to prevent flickering
                                  setTimeout(() => {
                                    if (pendingFailedUpdatesRef.current.size > 0) {
                                      setFailedImages(prev => {
                                        const newSet = new Set([...prev, ...pendingFailedUpdatesRef.current]);
                                        pendingFailedUpdatesRef.current.clear();
                                        return newSet;
                                      });
                                    }
                                  }, 100);
                                }
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-white text-xs font-semibold truncate w-full">{book.title}</span>
                          </div>
                        </div>
                        {book.rating > 0 && (
                          <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                      </button>
                    </div>
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
          </div>
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Book Title, Author, or ISBN *</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type to search for books by title, author, or ISBN..."
                />
                {isSearching && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Search Results (click to select):</p>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded flex gap-3 mb-2"
                    >
                      <img src={result.coverUrl} alt={result.title} className="w-10 h-14 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{result.title}</div>
                        <div className="text-xs text-gray-600">{result.author}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-4">Or enter book details manually:</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Title *</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Author name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Cover Image</label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {newBook.coverUrl && (
                    <div className="relative w-32 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={newBook.coverUrl}
                        alt="Book cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {(newBook.coverUrl.startsWith('data:') || 
                        (newBook.coverUrl && !newBook.coverUrl.includes('placeholder') && !newBook.coverUrl.startsWith('http'))) && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{newBook.coverUrl.startsWith('data:') ? 'Base64' : 'Storage'}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setNewBook({ ...newBook, coverUrl: '' })}
                        className="absolute top-1 left-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer w-fit">
                    <Upload className="w-5 h-5" />
                    <span>{newBook.coverUrl ? 'Change Image' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  
                  {/* URL Input (alternative) */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Or enter image URL:</label>
                    <input
                      type="text"
                      value={newBook.coverUrl && !newBook.coverUrl.startsWith('data:') ? newBook.coverUrl : ''}
                      onChange={(e) => setNewBook({ ...newBook, coverUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="Image URL (auto-filled from search)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Uploaded images are saved with your book</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Book description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newBook.startDate}
                    onChange={(e) => setNewBook({ ...newBook, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finish Date</label>
                  <input
                    type="date"
                    value={newBook.finishDate}
                    onChange={(e) => setNewBook({ ...newBook, finishDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewBook({ ...newBook, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${star <= newBook.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
                {newBook.rating <= 2 && newBook.rating > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Least Favorite Part *</label>
                    <textarea
                      value={newBook.leastFavoritePart}
                      onChange={(e) => setNewBook({ ...newBook, leastFavoritePart: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                      placeholder="What did you not like about this book?"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Character</label>
                <input
                  type="text"
                  value={newBook.favoriteCharacter}
                  onChange={(e) => setNewBook({ ...newBook, favoriteCharacter: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your favorite character"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scene Summary</label>
                <textarea
                  value={newBook.sceneSummary}
                  onChange={(e) => setNewBook({ ...newBook, sceneSummary: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Memorable scene or summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Memorable Moments</label>
                <textarea
                  value={newBook.memorableMoments}
                  onChange={(e) => setNewBook({ ...newBook, memorableMoments: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Memorable moments from the book"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={newBook.review}
                  onChange={(e) => setNewBook({ ...newBook, review: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Your review of the book"
                />
              </div>

              <button
                onClick={addBook}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all font-medium"
              >
                Add to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {showDetailsModal && selectedBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <h2 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h2>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
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
                      onChange={(e) => handleImageUpload(e, true)}
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
                          if (star <= 2) {
                            // Show least favorite part field if rating is 1-2
                          } else {
                            updates.leastFavoritePart = '';
                          }
                          handleUpdateBook(selectedBook.id, updates);
                          setSelectedBook({ ...selectedBook, ...updates });
                        }}
                      >
                        <Star
                          className={`w-6 h-6 ${star <= selectedBook.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  {(selectedBook.startDate || selectedBook.finishDate) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      {selectedBook.startDate && <span>Started: {selectedBook.startDate}</span>}
                      {selectedBook.finishDate && <span>Finished: {selectedBook.finishDate}</span>}
                    </div>
                  )}
                  {selectedBook.description && (
                    <p className="text-sm text-gray-700 mt-4">{selectedBook.description}</p>
                  )}
                </div>
              </div>

              {selectedBook.favoriteCharacter && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Favorite Character
                  </h3>
                  <p className="text-gray-700 bg-pink-50 p-3 rounded-lg">{selectedBook.favoriteCharacter}</p>
                </div>
              )}

              {selectedBook.sceneSummary && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Scene Summary</h3>
                  <p className="text-gray-700 bg-purple-50 p-3 rounded-lg">{selectedBook.sceneSummary}</p>
                </div>
              )}

              {selectedBook.memorableMoments && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Memorable Moments</h3>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedBook.memorableMoments}</p>
                </div>
              )}

              {selectedBook.review && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Review</h3>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{selectedBook.review}</p>
                </div>
              )}

              {selectedBook.rating <= 2 && selectedBook.rating > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Least Favorite Part</h3>
                  <textarea
                    value={selectedBook.leastFavoritePart || ''}
                    onChange={(e) => {
                      const updates = { leastFavoritePart: e.target.value };
                      handleUpdateBook(selectedBook.id, updates);
                      setSelectedBook({ ...selectedBook, ...updates });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                    placeholder="What did you not like about this book?"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setBookToMove(selectedBook);
                    setShowMoveModal(true);
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Move to Another Bookshelf
                </button>
                <button
                  onClick={() => handleDeleteBook(selectedBook.id)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Remove from Library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRecommendations(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
              </div>
              <button onClick={() => setShowRecommendations(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {isLoadingRecommendations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Analyzing your reading preferences...</p>
                  </div>
                </div>
              ) : recommendations.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    {recommendations.map((rec, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors cursor-pointer group"
                        onClick={() => addRecommendationToWishlist(rec)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg text-gray-900">{rec.title}</h3>
                              <Heart className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">by {rec.author}</p>
                            <p className="text-gray-700 text-sm">{rec.reason}</p>
                            <p className="text-xs text-pink-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to add to wishlist
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addRecommendationToWishlist(rec);
                              }}
                              className="px-3 py-1 text-sm bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-colors flex items-center gap-1"
                              title="Add to wishlist"
                            >
                              <Heart className="w-4 h-4" />
                              Add
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                ignoreSuggestion(rec.title, rec.author);
                              }}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              title="Ignore this suggestion"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center pt-4 border-t border-gray-200">
                    <button
                      onClick={() => generateRecommendations(true)}
                      disabled={isLoadingRecommendations}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Get 5 More Recommendations
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-600 py-12">No recommendations available. Add more books with ratings to get personalized recommendations!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => {
          setShowProfile(false);
          setProfileError('');
          setProfileSuccess('');
          setShowAvatarSelector(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{userProfile.avatar || '📚'}</span>
                <User className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
              </div>
              <button onClick={() => {
                setShowProfile(false);
                setProfileError('');
                setProfileSuccess('');
                setShowAvatarSelector(false);
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Logged in User Display */}
              {currentUser && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <p className="text-sm text-gray-600">Logged in as</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {authUser ? authUser.email : currentUser.username}
                        </p>
                        {authUser && isEmailVerified(authUser) && (
                          <p className="text-xs text-green-600 mt-1">✓ Email verified</p>
                        )}
                        {authUser && !isEmailVerified(authUser) && (
                          <p className="text-xs text-yellow-600 mt-1">⚠ Email not verified</p>
                        )}
                        {!authUser && (
                          <p className="text-xs text-gray-500 mt-1">Using default account</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {authUser && (
                        <button
                          onClick={handleChangeUser}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                          title="Change User"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Change User</span>
                        </button>
                      )}
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                        title="Logout"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Avatar Display and Selector */}
              <div className="text-center">
                <div className="text-6xl mb-4">{userProfile.avatar || '📚'}</div>
                <button
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  <span className="text-xl">{userProfile.avatar || '📚'}</span>
                  <span className="font-medium">Change Avatar</span>
                  {showAvatarSelector ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-indigo-600" />}
                </button>
                {showAvatarSelector && (
                  <div className="mt-4">
                    <AvatarSelectorInline
                      currentAvatar={userProfile.avatar || '📚'}
                      onSelect={(newAvatar) => setUserProfile({ ...userProfile, avatar: newAvatar })}
                    />
                  </div>
                )}
              </div>

              {/* Your Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your name"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio (Optional)</label>
                <textarea
                  value={userProfile.bio || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {(userProfile.bio || '').length}/200
                </div>
              </div>

              {/* Monthly Reading Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Reading Target</label>
                <input
                  type="number"
                  value={userProfile.monthlyTarget}
                  onChange={(e) => setUserProfile({ ...userProfile, monthlyTarget: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Number of books to read this month"
                  min="0"
                />
              </div>

              {/* Reading Progress */}
              {userProfile.monthlyTarget > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-8 h-8 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Reading Progress</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Books Read This Month</span>
                        <span className="font-semibold">{booksReadThisMonth} / {userProfile.monthlyTarget}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (booksReadThisMonth / userProfile.monthlyTarget) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">{remainingBooks}</p>
                      <p className="text-sm text-gray-600">books remaining to reach your goal</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">{allBooks.length}</p>
                    <p className="text-sm text-gray-600">Total Books</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{bookshelves.length}</p>
                    <p className="text-sm text-gray-600">Bookshelves</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-600">{booksReadThisMonth}</p>
                    <p className="text-sm text-gray-600">Read This Month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {allBooks.length > 0 
                        ? (allBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / allBooks.filter(b => b.rating > 0).length).toFixed(1)
                        : '0'
                      }
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 truncate" title={mostReadAuthor}>
                      {mostReadAuthor.length > 15 ? mostReadAuthor.substring(0, 15) + '...' : mostReadAuthor}
                    </p>
                    <p className="text-sm text-gray-600">Most Read Author</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-teal-600">{averageBooksPerMonth}</p>
                    <p className="text-sm text-gray-600">Avg Books/Month</p>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-900">Feedback</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We'd love to hear your thoughts! Share your feedback, suggestions, or report any issues you've encountered.
                </p>
                <textarea
                  value={userProfile.feedback || ''}
                  onChange={(e) => setUserProfile({ ...userProfile, feedback: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                  placeholder="Tell us what you think about Bookshelf..."
                  rows="5"
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {(userProfile.feedback || '').length}/1000
                </div>
              </div>

              {/* Error/Success Messages */}
              {profileError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                  {profileSuccess}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={async () => {
                  setProfileLoading(true);
                  setProfileError('');
                  setProfileSuccess('');
                  
                  try {
                    const result = await updateUserProfile(currentUser.id, {
                      name: userProfile.name,
                      monthly_target: userProfile.monthlyTarget,
                      avatar: userProfile.avatar,
                      bio: userProfile.bio,
                      feedback: userProfile.feedback
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
                disabled={profileLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Book Modal */}
      {showMoveModal && bookToMove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <BookOpen className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Move Book</h2>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex gap-4 items-center">
                  <img
                    src={bookToMove.coverUrl}
                    alt={bookToMove.title}
                    className="w-24 h-36 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/200x300/4F46E5/FFFFFF?text=${encodeURIComponent(bookToMove.title)}`;
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{bookToMove.title}</h3>
                    <p className="text-gray-600">{bookToMove.author || 'Unknown Author'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Destination Bookshelf</label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bookshelves
                    .filter(shelf => {
                      // Don't show the current shelf the book is in
                      const currentShelf = bookshelves.find(s => s.books.some(b => b.id === bookToMove.id));
                      return shelf.id !== currentShelf?.id;
                    })
                    .map((shelf) => {
                      const theme = ANIMAL_THEMES[shelf.animal] || ANIMAL_THEMES.cat;
                      const isFull = shelf.type === 'regular' && shelf.books.length >= 10;
                      const isSpecialShelf = shelf.type === 'wishlist' || shelf.type === 'favorites';
                      return (
                        <button
                          key={shelf.id}
                          onClick={() => !isFull && handleMoveBook(bookToMove.id, shelf.id)}
                          disabled={isFull}
                          className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                            isFull
                              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                          }`}
                          title={isSpecialShelf ? 'Unlimited capacity' : ''}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{theme.emoji}</span>
                              <div>
                                <div className="font-semibold text-gray-900">{shelf.name}</div>
                                <div className="text-sm text-gray-600">
                                  {shelf.type === 'wishlist' && '❤️ Wishlist'}
                                  {shelf.type === 'favorites' && '⭐ Favorites (unlimited)'}
                                  {(!shelf.type || shelf.type === 'regular') && `${shelf.books.length}/10 books`}
                                </div>
                              </div>
                            </div>
                            {isFull && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Full</span>
                            )}
                            {isSpecialShelf && !isFull && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Unlimited</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setEmailSent(false);
                setLoginEmail('');
                setLoginPassword('');
                setConfirmPassword('');
                setIsVerifying(false);
                setLoginMode('password');
                setPasswordMode('login');
                // If no user is logged in and default user exists, use it
                if (!currentUser && defaultUser) {
                  setCurrentUser(defaultUser);
                }
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Bookshelf</h2>
              <p className="text-gray-600">
                {emailSent 
                  ? 'Check your email for the magic link to sign in'
                  : 'Sign in with your email to access your personal bookshelf'
                }
              </p>
            </div>

            {!emailSent ? (
              <div className="space-y-4">
                {/* Login Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      setLoginMode('password');
                      setLoginPassword('');
                      setEmailSent(false);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      loginMode === 'password'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Password
                  </button>
                  <button
                    onClick={() => {
                      setLoginMode('magiclink');
                      setLoginPassword('');
                      setEmailSent(false);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      loginMode === 'magiclink'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Magic Link
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (loginMode === 'password') {
                          handlePasswordLogin();
                        } else {
                          handleEmailLogin();
                        }
                      }
                    }}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isVerifying}
                  />
                </div>

                {loginMode === 'password' && (
                  <>
                    {/* Sign In / Create Account Toggle */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => {
                          setPasswordMode('login');
                          setLoginPassword('');
                          setConfirmPassword('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          passwordMode === 'login'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setPasswordMode('signup');
                          setLoginPassword('');
                          setConfirmPassword('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          passwordMode === 'signup'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePasswordLogin();
                          }
                        }}
                        placeholder={passwordMode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isVerifying}
                      />
                    </div>

                    {passwordMode === 'signup' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handlePasswordLogin();
                            }
                          }}
                          placeholder="Confirm your password"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={isVerifying}
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={loginMode === 'password' ? handlePasswordLogin : handleEmailLogin}
                  disabled={
                    isVerifying || 
                    !loginEmail.trim() || 
                    (loginMode === 'password' && !loginPassword.trim()) ||
                    (loginMode === 'password' && passwordMode === 'signup' && !confirmPassword.trim())
                  }
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isVerifying 
                    ? (loginMode === 'password' 
                        ? (passwordMode === 'signup' ? 'Creating account...' : 'Signing in...') 
                        : 'Sending...') 
                    : (loginMode === 'password' 
                        ? (passwordMode === 'signup' ? 'Create Account' : 'Sign In') 
                        : 'Send Magic Link')
                  }
                </button>

                {!authUser && defaultUser && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      Or continue with default account
                    </p>
                    <button
                      onClick={() => {
                        setShowLoginModal(false);
                        setCurrentUser(defaultUser);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                    >
                      Continue as {defaultUser.username}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✉️</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Magic link sent!
                      </p>
                      <p className="text-sm text-blue-700">
                        We've sent a sign-in link to <strong>{loginEmail}</strong>. 
                        Click the link in the email to verify and access your account.
                      </p>
                    </div>
                  </div>
                </div>

                {isVerifying && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⏳ Waiting for email verification... You'll be signed in automatically once you click the link.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setEmailSent(false);
                    setLoginEmail('');
                    setLoginPassword('');
                    setConfirmPassword('');
                    setIsVerifying(false);
                    setLoginMode('password');
                    setPasswordMode('login');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                >
                  Use Different Email
                </button>

                {!authUser && defaultUser && (
                  <button
                    onClick={() => {
                      setShowLoginModal(false);
                      setEmailSent(false);
                      setCurrentUser(defaultUser);
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                  >
                    Continue with Default Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* About Modal */}
      <AboutBookshelfModal show={showAboutModal} onClose={() => setShowAboutModal(false)} />


      {/* User Comparison Modal */}
      {showUserComparison && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">User Comparison</h2>
              <button
                onClick={() => setShowUserComparison(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Books</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">This Month</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const totalBooks = getTotalBooksRead(user.id);
                    const monthlyBooks = getBooksReadThisMonth(user.id);
                    const isCurrentUser = currentUser && user.id === currentUser.id;
                    const profile = userProfiles[user.id];
                    const displayName = profile?.name?.trim() || user.username || user.email || 'Unknown User';
                    const avatar = profile?.avatar || '👤';
                    
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          isCurrentUser ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{avatar}</span>
                            <span className={`font-medium ${isCurrentUser ? 'text-indigo-600' : 'text-gray-900'}`}>
                              {displayName}
                              {isCurrentUser && <span className="ml-2 text-xs text-indigo-500">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-gray-900">{totalBooks}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-lg font-semibold text-indigo-600">{monthlyBooks}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No users found. Create an account to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

