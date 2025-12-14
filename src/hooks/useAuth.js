import { useState, useEffect } from 'react';
import {
  getCurrentSession,
  isEmailVerified,
  onAuthStateChange,
  getOrCreateAppUser
} from '../services/authService';
import { getAllUsers } from '../services/userService';
import { loadDefaultUser } from '../utils/defaultUser';

/**
 * Custom hook for authentication management
 * Handles user authentication, session management, and auth state changes
 * 
 * @returns {object} Auth state and functions
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [defaultUser, setDefaultUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
          }
        }
      } else if (sessionUser && !isEmailVerified(sessionUser)) {
        // User signed in but email not verified - use default user
        console.log('Email not verified, using default user');
        setIsVerifying(true);
        if (loadedDefaultUser) {
          setCurrentUser(loadedDefaultUser);
          setDefaultUser(loadedDefaultUser);
        }
        setShowLoginModal(true);
      } else {
        // No auth session - use default user
        if (loadedDefaultUser) {
          setCurrentUser(loadedDefaultUser);
          setDefaultUser(loadedDefaultUser);
        }
        setShowLoginModal(true);
      }

      // Load all users for comparison
      const { data: allUsers } = await getAllUsers();
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Error initializing auth:', error);
      const loadedDefaultUser = await loadDefaultUser();
      if (loadedDefaultUser) {
        setCurrentUser(loadedDefaultUser);
        setDefaultUser(loadedDefaultUser);
      }
      setShowLoginModal(true);
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      // Only log meaningful auth events (skip INITIAL_SESSION when there's no session)
      if (event !== 'INITIAL_SESSION' || session) {
      }
      
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

  return {
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
    setEmailSent,
    initializeAuth
  };
}

