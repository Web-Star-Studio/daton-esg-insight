/**
 * Production-safe logging utility
 * Respects production configuration and only logs appropriate messages
 */

import { PRODUCTION_CONFIG, isProduction } from './productionConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!PRODUCTION_CONFIG.LOGGING.ENABLE_CONSOLE_LOGS && isProduction()) {
      return level === 'error';
    }
    
    const configLevel = PRODUCTION_CONFIG.LOGGING.LEVEL;
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    
    return levels[level] >= levels[configLevel];
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, error, ...args);
      
      // In production, send to error reporting service
      if (isProduction() && PRODUCTION_CONFIG.LOGGING.ENABLE_ERROR_REPORTING) {
        this.reportError(message, error);
      }
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(`🔍 ${message}`, ...args);
    }
  }

  private reportError(message: string, error?: Error | unknown) {
    // TODO: Integrate with error reporting service (Sentry, etc.)
    // This is a placeholder for future integration
    const errorData = {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // In production, this would send to an external service
    console.error('Error Report:', errorData);
  }
}

export const logger = new Logger();
