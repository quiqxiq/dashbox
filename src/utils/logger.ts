import { appConfig, type LogLevel } from '@config/app.config';

const LEVELS: readonly LogLevel[] = ['silent', 'error', 'warn', 'info', 'debug'];

function enabled(level: LogLevel): boolean {
  return LEVELS.indexOf(level) <= LEVELS.indexOf(appConfig.logLevel);
}

export const logger = {
  error: (...args: unknown[]): void => {
    if (enabled('error')) console.error('[error]', ...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled('warn')) console.warn('[warn]', ...args);
  },
  info: (...args: unknown[]): void => {
    if (enabled('info')) console.info('[info]', ...args);
  },
  debug: (...args: unknown[]): void => {
    if (enabled('debug')) console.debug('[debug]', ...args);
  },
};
