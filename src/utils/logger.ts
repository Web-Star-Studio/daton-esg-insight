/**
 * Production-safe logging utility
 * Respects production configuration and only logs appropriate messages
 */

import { PRODUCTION_CONFIG, isProduction } from './productionConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogCategory = 'auth' | 'api' | 'ui' | 'database' | 'service' | 'general';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: Date;
  context?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 100;

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

  private createLogEntry(level: LogLevel, category: LogCategory, message: string, context?: any): LogEntry {
    const entry: LogEntry = {
      level,
      category,
      message,
      timestamp: new Date(),
      context,
    };

    if (level === 'error' && context instanceof Error) {
      entry.stack = context.stack;
    }

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return entry;
  }

  info(message: string, categoryOrContext?: LogCategory | any, ...args: any[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' ? categoryOrContext as LogCategory : 'general';
    const context = typeof categoryOrContext === 'string' ? args : [categoryOrContext, ...args];
    
    if (this.shouldLog('info')) {
      this.createLogEntry('info', category, message, context);
      console.info(`ℹ️ [${category.toUpperCase()}] ${message}`, ...context);
    }
  }

  warn(message: string, categoryOrContext?: LogCategory | any, ...args: any[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' ? categoryOrContext as LogCategory : 'general';
    const context = typeof categoryOrContext === 'string' ? args : [categoryOrContext, ...args];
    
    if (this.shouldLog('warn')) {
      this.createLogEntry('warn', category, message, context);
      console.warn(`⚠️ [${category.toUpperCase()}] ${message}`, ...context);
      
      if (isProduction() && PRODUCTION_CONFIG.LOGGING.ENABLE_ERROR_REPORTING) {
        this.reportError(message, context[0]);
      }
    }
  }

  error(message: string, error?: Error | unknown, categoryOrExtra?: LogCategory | any, ...args: any[]) {
    const category: LogCategory = typeof categoryOrExtra === 'string' ? categoryOrExtra as LogCategory : 'general';
    
    if (this.shouldLog('error')) {
      this.createLogEntry('error', category, message, error);
      
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack || ''}`
        : String(error);
      
      console.error(`❌ [${category.toUpperCase()}] ${message}`, errorDetails, ...args);
      
      if (isProduction() && PRODUCTION_CONFIG.LOGGING.ENABLE_ERROR_REPORTING) {
        this.reportError(message, error);
      }
    }
  }

  debug(message: string, categoryOrContext?: LogCategory | any, ...args: any[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' ? categoryOrContext as LogCategory : 'general';
    const context = typeof categoryOrContext === 'string' ? args : [categoryOrContext, ...args];
    
    if (this.shouldLog('debug')) {
      this.createLogEntry('debug', category, message, context);
      console.debug(`🔍 [${category.toUpperCase()}] ${message}`, ...context);
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

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
