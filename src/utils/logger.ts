/**
 * Structured logger.
 *
 * Thin wrapper over `console` that:
 *   - Prefixes every message with a source tag so logs are greppable
 *   - Strips `debug` and `info` in production builds
 *   - Forwards warnings/errors to the error reporter (for future Sentry)
 *
 * Usage:
 *   import { createLogger } from '../utils/logger';
 *   const log = createLogger('CardDataService');
 *   log.info('Cache hit', { cardId });
 *   log.warn('Stale cache', { ageMs });
 *   log.error('Fetch failed', err);
 *
 * In production, only `warn` / `error` reach the console. `debug` / `info`
 * are stripped. All `error` calls are also forwarded to `reportError()`.
 */

import { reportError, reportMessage } from './errorReporting';

// `__DEV__` is injected by Metro/Expo at runtime; in Node (Jest) it may be
// undefined. Default to dev mode when the flag is absent so tests exercise
// the full logger output.
declare const __DEV__: boolean | undefined;
function isProdMode(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === false;
}

export interface Logger {
  debug: (msg: string, context?: Record<string, unknown>) => void;
  info: (msg: string, context?: Record<string, unknown>) => void;
  warn: (msg: string, context?: Record<string, unknown>) => void;
  error: (msg: string, error?: unknown, context?: Record<string, unknown>) => void;
}

export function createLogger(source: string): Logger {
  const prefix = `[${source}]`;

  return {
    debug: (msg, context) => {
      if (isProdMode()) return;
      if (context) {
        console.log(prefix, msg, context);
      } else {
        console.log(prefix, msg);
      }
    },
    info: (msg, context) => {
      if (isProdMode()) return;
      if (context) {
        console.info(prefix, msg, context);
      } else {
        console.info(prefix, msg);
      }
    },
    warn: (msg, context) => {
      if (context) {
        console.warn(prefix, msg, context);
      } else {
        console.warn(prefix, msg);
      }
      reportMessage(`${prefix} ${msg}`, context);
    },
    error: (msg, error, context) => {
      if (error !== undefined) {
        console.error(prefix, msg, error, context);
      } else {
        console.error(prefix, msg, context);
      }
      reportError(error ?? new Error(msg), { source, message: msg, ...context });
    },
  };
}
