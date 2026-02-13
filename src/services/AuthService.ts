/**
 * AuthService - Handles user authentication via Supabase
 * Supports email/password, Google, and Apple sign-in
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session, AuthChangeEvent, AuthError } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user: AuthUser | null;
  error: string | null;
}

export type AuthStateChangeCallback = (event: AuthChangeEvent, user: AuthUser | null) => void;

const GUEST_USER_KEY = '@rewards_optimizer/guest_user';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform Supabase user to AuthUser
 */
function transformUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    isAnonymous: !user.email,
    createdAt: user.created_at,
  };
}

/**
 * Create a guest user for limited access mode
 */
async function createGuestUser(): Promise<AuthUser> {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const guestUser: AuthUser = {
    id: guestId,
    email: null,
    displayName: 'Guest',
    avatarUrl: null,
    isAnonymous: true,
    createdAt: new Date().toISOString(),
  };
  
  await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
}

/**
 * Get stored guest user
 */
async function getStoredGuestUser(): Promise<AuthUser | null> {
  try {
    const stored = await AsyncStorage.getItem(GUEST_USER_KEY);
    if (stored) {
      return JSON.parse(stored) as AuthUser;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Clear guest user
 */
async function clearGuestUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_USER_KEY);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Auth Functions
// ============================================================================

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      user: null,
      error: 'Authentication service not configured',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // No email confirmation for now
      },
    });

    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
      };
    }

    // Clear any guest user
    await clearGuestUser();

    return {
      success: true,
      user: transformUser(data.user),
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to sign up',
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      user: null,
      error: 'Authentication service not configured',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
      };
    }

    // Clear any guest user
    await clearGuestUser();

    return {
      success: true,
      user: transformUser(data.user),
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to sign in',
    };
  }
}

/**
 * Sign in with Google using Expo AuthSession
 * Note: Requires expo-auth-session and proper OAuth configuration
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      user: null,
      error: 'Authentication service not configured',
    };
  }

  try {
    // For React Native, we use Supabase's OAuth with a redirect
    // This will open a browser window for Google sign-in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: Platform.OS !== 'web',
        redirectTo: Platform.OS === 'web' 
          ? window.location.origin 
          : 'rewardly://auth/callback',
      },
    });

    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
      };
    }

    // For native apps, we need to handle the redirect
    // The actual user will be set via the auth state change listener
    if (Platform.OS === 'web' && data.url) {
      window.location.href = data.url;
    }

    // Clear any guest user
    await clearGuestUser();

    return {
      success: true,
      user: null, // User will be set via auth state change
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to sign in with Google',
    };
  }
}

/**
 * Sign in with Apple using Expo Apple Authentication
 * Note: Requires expo-apple-authentication and Apple Developer setup
 */
export async function signInWithApple(): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      user: null,
      error: 'Authentication service not configured',
    };
  }

  try {
    // For iOS, we use Apple's native authentication
    if (Platform.OS === 'ios') {
      // Dynamic import to avoid bundling on non-iOS platforms
      const AppleAuthentication = await import('expo-apple-authentication').catch(() => null);
      
      if (!AppleAuthentication) {
        return {
          success: false,
          user: null,
          error: 'Apple authentication not available',
        };
      }

      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          user: null,
          error: 'Apple authentication not available on this device',
        };
      }

      // Request credentials from Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          success: false,
          user: null,
          error: 'No identity token received from Apple',
        };
      }

      // Sign in with Supabase using the Apple token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return {
          success: false,
          user: null,
          error: error.message,
        };
      }

      // Clear any guest user
      await clearGuestUser();

      return {
        success: true,
        user: transformUser(data.user),
        error: null,
      };
    } else {
      // For web/Android, use OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          skipBrowserRedirect: Platform.OS !== 'web',
          redirectTo: Platform.OS === 'web' 
            ? window.location.origin 
            : 'rewardly://auth/callback',
        },
      });

      if (error) {
        return {
          success: false,
          user: null,
          error: error.message,
        };
      }

      // Clear any guest user
      await clearGuestUser();

      return {
        success: true,
        user: null, // User will be set via auth state change
        error: null,
      };
    }
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to sign in with Apple',
    };
  }
}

/**
 * Continue as guest (limited features)
 */
export async function continueAsGuest(): Promise<AuthResult> {
  try {
    const guestUser = await createGuestUser();
    return {
      success: true,
      user: guestUser,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to create guest session',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error: string | null }> {
  // Clear guest user first
  await clearGuestUser();

  if (!isSupabaseConfigured() || !supabase) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to sign out',
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Check for guest user first
  const guestUser = await getStoredGuestUser();
  if (guestUser) {
    return guestUser;
  }

  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return transformUser(user);
  } catch {
    return null;
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Get a valid session, attempting to refresh if expired
 * Returns null for guest users (who don't have sessions)
 */
export async function getValidSession(): Promise<Session | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      // Attempt to refresh the session
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      return refreshedSession;
    }
    
    // Check if session is about to expire (within 60 seconds)
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      // If expiring soon or already expired, refresh it
      if (timeUntilExpiry < 60000) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        return refreshedSession;
      }
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get valid session:', error);
    return null;
  }
}

/**
 * Check if current user is a guest (no authentication)
 */
export function isGuestUser(user: AuthUser | null): boolean {
  return user !== null && user.isAnonymous === true;
}

/**
 * Validate session before making authenticated API calls
 * Returns true if user has valid session OR is a guest
 * Throws error only for expired authenticated sessions
 */
export async function validateSessionForApiCall(): Promise<boolean> {
  const currentUser = await getCurrentUser();
  
  // Guest users don't need a session
  if (isGuestUser(currentUser)) {
    return true;
  }
  
  // Authenticated users need a valid session
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }
  
  try {
    const session = await getValidSession();
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    // Return no-op unsubscribe
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, transformUser(session?.user ?? null));
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Authentication service not configured',
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web' 
        ? `${window.location.origin}/reset-password` 
        : 'rewardly://auth/reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send reset email',
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      user: null,
      error: 'Authentication service not configured',
    };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      },
    });

    if (error) {
      return {
        success: false,
        user: null,
        error: error.message,
      };
    }

    return {
      success: true,
      user: transformUser(data.user),
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      user: null,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    };
  }
}

/**
 * Check if user is authenticated (not a guest)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && !user.isAnonymous;
}

/**
 * Check if current session is a guest session
 */
export async function isGuestSession(): Promise<boolean> {
  const guestUser = await getStoredGuestUser();
  return guestUser !== null;
}
