/**
 * Error reporting via Sentry.
 *
 * No-ops when `EXPO_PUBLIC_SENTRY_DSN` is not set, so the rest of the
 * codebase can call `reportError()` unconditionally.
 *
 * To activate in a new environment:
 *   1. Set `EXPO_PUBLIC_SENTRY_DSN` in the client env
 *   2. Follow `@sentry/react-native` setup docs for native linking
 */

import * as Sentry from '@sentry/react-native';

type ErrorContext = Record<string, unknown>;

interface ErrorReporter {
  captureException: (error: unknown, context?: ErrorContext) => void;
  captureMessage: (message: string, context?: ErrorContext) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

let activeReporter: ErrorReporter | null = null;
let initialized = false;

/**
 * Initialize the error reporter. Call once at app startup. Safe to call
 * without a DSN — becomes a console-only reporter.
 */
export function initErrorReporting(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    activeReporter = createConsoleReporter();
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
  });

  activeReporter = {
    captureException: (error, context) => Sentry.captureException(error, { extra: context }),
    captureMessage: (message, context) => Sentry.captureMessage(message, { extra: context }),
    setUser: (user) => Sentry.setUser(user),
  };
}

function createConsoleReporter(): ErrorReporter {
  return {
    captureException: (error, context) => {
      const serialized =
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error;
      console.error('[errorReporting] exception', { error: serialized, context });
    },
    captureMessage: (message, context) => {
      console.warn('[errorReporting] message', { message, context });
    },
    setUser: () => {
      /* no-op */
    },
  };
}

/**
 * Report an unexpected error to the error tracker. Always safe to call.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  if (!initialized) initErrorReporting();
  activeReporter?.captureException(error, context);
}

/**
 * Report a non-error event (warning, unusual state) to the error tracker.
 */
export function reportMessage(message: string, context?: ErrorContext): void {
  if (!initialized) initErrorReporting();
  activeReporter?.captureMessage(message, context);
}

/**
 * Attach or clear the current user. Call after login/logout.
 */
export function setErrorUser(user: { id: string; email?: string } | null): void {
  if (!initialized) initErrorReporting();
  activeReporter?.setUser(user);
}
