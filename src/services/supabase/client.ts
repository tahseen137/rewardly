/**
 * Supabase Client Configuration
 *
 * This module initializes and exports the Supabase client for use throughout the app.
 * The client is configured to work with React Native/Expo using AsyncStorage for persistence.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './types';

// Supabase configuration from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate configuration
const isConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co'
);

if (!isConfigured) {
  console.warn(
    'Supabase configuration missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Create Supabase client only if properly configured
 * Returns null if not configured (for testing/offline mode)
 */
function createSupabaseClient(): SupabaseClient<Database> | null {
  if (!isConfigured) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for React Native
    },
  });
}

/**
 * Supabase client instance configured for React Native
 * May be null if Supabase is not configured
 */
export const supabase: SupabaseClient<Database> | null = createSupabaseClient();

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured && supabase !== null;
}

/**
 * Get the Supabase URL (for debugging)
 */
export function getSupabaseUrl(): string {
  return supabaseUrl;
}

export default supabase;
