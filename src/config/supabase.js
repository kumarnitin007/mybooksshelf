/**
 * Supabase Client Configuration
 * 
 * This file sets up the Supabase client for database operations.
 * Replace the placeholder values with your actual Supabase project credentials.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// TODO: Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project settings > API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test database connection
 * @returns {Promise<{success: boolean, message: string, error?: any, tableName?: string}>} Connection test result
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('bk_users')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error,
        tableName: 'bk_users'
      };
    }
    
    // Get user count for more detailed feedback
    const { count: userCount, error: countError } = await supabase
      .from('bk_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Could not get user count:', countError.message);
    }
    
    return {
      success: true,
      message: `Successfully connected to Supabase database! (Using table: bk_users)`,
      tableName: 'bk_users',
      userCount: userCount || 0
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      message: `Connection error: ${error.message}`,
      error: error
    };
  }
};

// Make it available globally for easy testing in browser console
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testConnection;
}

