/**
 * AuthScreen - Sign in / Sign up screen
 * Supports email/password, Google, Apple, and guest mode
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Chrome, Apple } from 'lucide-react-native';

import { colors } from '../theme/colors';
import { borderRadius } from '../theme/borders';
import {
  signIn,
  signUp,
  signInWithGoogle,
  signInWithApple,
  continueAsGuest,
  AuthResult,
} from '../services/AuthService';
import { supabase } from '../services/supabase/client';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { t } = useTranslation();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = useCallback(async () => {
    // Validate inputs
    if (!email.trim()) {
      setError(t('auth.errors.emailRequired'));
      return;
    }
    
    if (!password) {
      setError(t('auth.errors.passwordRequired'));
      return;
    }
    
    if (mode === 'signup') {
      if (password.length < 6) {
        setError(t('auth.errors.passwordTooShort'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.errors.passwordMismatch'));
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let result: AuthResult;
      
      if (mode === 'signup') {
        result = await signUp(email.trim(), password);
      } else {
        result = await signIn(email.trim(), password);
      }

      if (result.success) {
        if (result.needsEmailConfirmation) {
          Alert.alert(
            'Check Your Email ✉️',
            `We've sent a confirmation link to ${email.trim()}. Please verify your email to complete sign up.`,
            [{ text: 'OK' }]
          );
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        } else {
          onAuthSuccess();
        }
      } else {
        setError(result.error ?? t('auth.errors.unknown'));
      }
    } catch (err) {
      setError(t('auth.errors.unknown'));
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, mode, onAuthSuccess, t]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error ?? t('auth.errors.googleFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.googleFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [onAuthSuccess, t]);

  const handleAppleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithApple();
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error ?? t('auth.errors.appleFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.appleFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [onAuthSuccess, t]);

  const handleContinueAsGuest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await continueAsGuest();
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error ?? t('auth.errors.guestFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.guestFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [onAuthSuccess, t]);

  const toggleMode = useCallback(() => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  const handleForgotPassword = useCallback(() => {
    Alert.prompt(
      t('auth.forgotPasswordTitle') || 'Forgot Password',
      t('auth.forgotPasswordMessage') || 'Enter your email address to receive a password reset link.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('auth.sendResetLink') || 'Send Reset Link',
          onPress: async (emailInput) => {
            if (!emailInput || !emailInput.trim()) {
              Alert.alert(
                t('auth.errors.title') || 'Error',
                t('auth.errors.emailRequired') || 'Please enter your email address.'
              );
              return;
            }

            setIsLoading(true);
            try {
              if (!supabase) {
                throw new Error('Supabase not configured');
              }
              
              const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
                redirectTo: 'rewardly://reset-password',
              });

              if (error) {
                throw error;
              }

              Alert.alert(
                t('auth.resetEmailSentTitle') || 'Email Sent',
                t('auth.resetEmailSentMessage') || 'Password reset email sent! Check your inbox.'
              );
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
              Alert.alert(
                t('auth.errors.title') || 'Error',
                errorMessage
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      'plain-text',
      email // Pre-fill with current email if entered
    );
  }, [email, t]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>💳</Text>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        {/* Auth Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.text.secondary} />
              ) : (
                <Eye size={20} color={colors.text.secondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot Password (Sign In only) */}
          {mode === 'signin' && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {t('auth.forgotPassword') || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Primary Button */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary.main, colors.primary.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Toggle Mode */}
          <TouchableOpacity
            onPress={toggleMode}
            style={styles.toggleButton}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? t('auth.noAccount')
                : t('auth.hasAccount')}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign In */}
          <View style={styles.socialButtons}>
            <View>
              <TouchableOpacity
                style={[styles.socialButton, styles.socialButtonDisabled]}
                disabled={true}
                activeOpacity={1}
              >
                <Chrome size={20} color={colors.text.secondary} />
                <Text style={[styles.socialButtonText, styles.socialButtonTextDisabled]}>
                  {t('auth.continueWithGoogle')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.comingSoonText}>{t('auth.comingSoon')}</Text>
            </View>

            {Platform.OS === 'ios' && (
              <View>
                <TouchableOpacity
                  style={[styles.socialButton, styles.socialButtonDisabled]}
                  disabled={true}
                  activeOpacity={1}
                >
                  <Apple size={20} color={colors.text.secondary} />
                  <Text style={[styles.socialButtonText, styles.socialButtonTextDisabled]}>
                    {t('auth.continueWithApple')}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.comingSoonText}>{t('auth.comingSoon')}</Text>
              </View>
            )}
          </View>

          {/* Guest Mode */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleContinueAsGuest}
            disabled={isLoading}
          >
            <Text style={styles.guestButtonText}>{t('auth.continueAsGuest')}</Text>
            <Text style={styles.guestSubtext}>{t('auth.guestLimitations')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('auth.termsNotice')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: colors.error.background,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error.main,
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    padding: 8,
    marginBottom: 24,
  },
  toggleText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    color: colors.text.tertiary,
    fontSize: 13,
    marginHorizontal: 16,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: 12,
  },
  socialButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.background.secondary,
  },
  socialButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  socialButtonTextDisabled: {
    color: colors.text.secondary,
  },
  comingSoonText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  guestButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  guestButtonText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  guestSubtext: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
