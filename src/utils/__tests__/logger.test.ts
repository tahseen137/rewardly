/**
 * Tests for the structured logger.
 *
 * Verifies that:
 *   - Logs are prefixed with the source tag
 *   - `debug` / `info` are stripped in production (__DEV__ === false)
 *   - `warn` / `error` always reach the console
 */

import { createLogger } from '../logger';

describe('createLogger', () => {
  let consoleLog: jest.SpyInstance;
  let consoleWarn: jest.SpyInstance;
  let consoleError: jest.SpyInstance;
  const originalDev = (global as any).__DEV__;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as any).__DEV__ = originalDev;
  });

  it('prefixes every message with [source]', () => {
    (global as any).__DEV__ = true;
    const log = createLogger('TestService');
    log.warn('something odd');
    expect(consoleWarn).toHaveBeenCalledWith('[TestService]', 'something odd');
  });

  it('includes context as a second argument when provided', () => {
    const log = createLogger('TestService');
    log.warn('something odd', { userId: 'abc' });
    expect(consoleWarn).toHaveBeenCalledWith('[TestService]', 'something odd', { userId: 'abc' });
  });

  it('debug is a no-op when __DEV__ is false', () => {
    (global as any).__DEV__ = false;
    // logger module reads __DEV__ at import time — re-import to re-read
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createLogger: freshCreate } = require('../logger');
    const log = freshCreate('TestService');
    log.debug('debug msg');
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('warn and error always fire regardless of __DEV__', () => {
    (global as any).__DEV__ = false;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createLogger: freshCreate } = require('../logger');
    const log = freshCreate('TestService');
    log.warn('warning');
    log.error('err');
    expect(consoleWarn).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it('error accepts an Error object as the second arg', () => {
    const log = createLogger('TestService');
    const err = new Error('boom');
    log.error('failed', err);
    expect(consoleError).toHaveBeenCalled();
    // The logger calls console.error once directly, then reportError may
    // call it again via its no-DSN fallback. Check that at least one of the
    // calls included the Error object.
    const allArgs = consoleError.mock.calls.flat();
    expect(allArgs).toContain(err);
  });

  it('error works without an error object', () => {
    const log = createLogger('TestService');
    log.error('just a message');
    expect(consoleError).toHaveBeenCalled();
  });
});
