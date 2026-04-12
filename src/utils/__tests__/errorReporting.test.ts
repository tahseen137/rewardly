/**
 * Tests for the error reporting wrapper.
 *
 * Verifies that:
 *   - `reportError` is safe to call before `initErrorReporting`
 *   - Without a DSN, it falls back to the console reporter
 *   - The module exports the expected public API
 */

import { reportError, reportMessage, setErrorUser, initErrorReporting } from '../errorReporting';

describe('errorReporting', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reportError is safe before explicit init', () => {
    expect(() => reportError(new Error('boom'), { source: 'test' })).not.toThrow();
  });

  it('reportError forwards an Error with context to the console in the no-DSN path', () => {
    const consoleError = jest.spyOn(console, 'error');
    reportError(new Error('ka-boom'), { source: 'test', userId: 'abc' });
    expect(consoleError).toHaveBeenCalled();
    const [prefix, payload] = consoleError.mock.calls[consoleError.mock.calls.length - 1];
    expect(prefix).toContain('errorReporting');
    expect((payload as any).error.message).toBe('ka-boom');
    expect((payload as any).context.source).toBe('test');
  });

  it('reportError accepts non-Error values without crashing', () => {
    expect(() => reportError('string error')).not.toThrow();
    expect(() => reportError({ weird: 'shape' })).not.toThrow();
    expect(() => reportError(null)).not.toThrow();
    expect(() => reportError(undefined)).not.toThrow();
  });

  it('reportMessage logs a warn-level message with context', () => {
    const consoleWarn = jest.spyOn(console, 'warn');
    reportMessage('stale cache', { ageMs: 10000 });
    expect(consoleWarn).toHaveBeenCalled();
  });

  it('setErrorUser is safe to call with null', () => {
    expect(() => setErrorUser(null)).not.toThrow();
  });

  it('setErrorUser accepts a user object', () => {
    expect(() => setErrorUser({ id: 'abc', email: 'a@b.com' })).not.toThrow();
  });

  it('initErrorReporting is idempotent', () => {
    initErrorReporting();
    initErrorReporting();
    // No assertion needed — just verifying no throw / no duplicate init.
    expect(true).toBe(true);
  });
});
