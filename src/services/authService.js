/**
 * Authentication Service
 * 
 * Handles Supabase Auth operations including:
 * - Email magic link authentication
 * - Email verification
 * - Session management
 */

import { supabase } from '../config/supabase';

/**
 * Send magic link to email
 * @param {string} email - User's email address
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const signInWithEmail = async (email) => {
  try {
    // Use current origin (works for both localhost and production)
    const redirectUrl = `${window.location.origin}`;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true
      }
    });

    return { data, error };
  } catch (error) {
    console.error('Error sending magic link:', error);
    return { data: null, error };
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const signInWithPassword = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    return { data, error };
  } catch (error) {
    console.error('Error signing in with password:', error);
    return { data: null, error };
  }
};

/**
 * Sign up with email and password (create new user)
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const signUpWithPassword = async (email, password) => {
  try {
    // Use current origin (works for both localhost and production)
    const redirectUrl = `${window.location.origin}`;
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    return { data, error };
  } catch (error) {
    console.error('Error signing up with password:', error);
    return { data: null, error };
  }
};

/**
 * Get current authenticated user session
 * @returns {Promise<{user: object|null, session: object|null}>}
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { user: session?.user || null, session: session, error };
  } catch (error) {
    console.error('Error getting session:', error);
    return { user: null, session: null, error };
  }
};

/**
 * Sign out current user
 * @returns {Promise<{error: object|null}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

/**
 * Check if user email is verified
 * @param {object} user - Supabase auth user object
 * @returns {boolean}
 */
export const isEmailVerified = (user) => {
  return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
};

/**
 * Listen to auth state changes
 * @param {function} callback - Callback function to handle auth changes
 * @returns {object} Object with data.subscription containing unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

/**
 * Get or create app user record linked to auth user
 * @param {string} authUserId - Supabase auth user ID
 * @param {string} email - User's email
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export const getOrCreateAppUser = async (authUserId, email) => {
  try {
    // Try to find existing user linked to this auth user
    let { data: existingUser, error: findError } = await supabase
      .from('bk_users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (existingUser) {
      return { data: existingUser, error: null };
    }

    // Create new user record linked to auth user
    const { data: newUser, error: createError } = await supabase
      .from('bk_users')
      .insert([{
        id: authUserId, // Use auth user ID as the app user ID
        username: email.split('@')[0] // Use email prefix as username
      }])
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError };
    }

    // Create default user profile
    if (newUser) {
      try {
        await supabase
          .from('bk_user_profiles')
          .insert([{
            user_id: newUser.id,
            name: '',
            monthly_target: 0,
            avatar: '📚',
            bio: '',
            feedback: ''
          }]);
      } catch (e) {
        console.error('Error creating user profile:', e);
      }
    }

    return { data: newUser, error: null };
  } catch (error) {
    console.error('Error getting/creating app user:', error);
    return { data: null, error };
  }
};
