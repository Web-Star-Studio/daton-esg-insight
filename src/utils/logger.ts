/**
 * Production-safe logging utility
 * Respects production configuration and only logs appropriate messages
 */

import { PRODUCTION_CONFIG, isProduction } from './productionConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogCategory = 
  | 'auth' 
  | 'api' 
  | 'ui' 
  | 'database' 
  | 'service' 
  | 'general'
  // Domain-specific categories
  | 'emission'
  | 'training'
  | 'supplier'
  | 'document'
  | 'gri'
  | 'audit'
  | 'compliance'
  | 'quality'
  | 'notification'
  | 'import';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: Date;
  context?: unknown;
  stack?: string;
  duration?: number;
}

interface PerfEntry {
  operation: string;
  duration: number;
  timestamp: Date;
  category?: LogCategory;
}

class Logger {
  private logs: LogEntry[] = [];
  private perfLogs: PerfEntry[] = [];
  private readonly maxLogs = 100;
  private readonly maxPerfLogs = 50;

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

  private createLogEntry(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    context?: unknown,
    duration?: number
  ): LogEntry {
    const entry: LogEntry = {
      level,
      category,
      message,
      timestamp: new Date(),
      context,
      duration,
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

  private formatContext(context: unknown[]): unknown[] {
    return context.filter(c => c !== undefined && c !== null);
  }

  info(message: string, categoryOrContext?: LogCategory | unknown, ...args: unknown[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? categoryOrContext 
      : 'general';
    const context = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? args 
      : [categoryOrContext, ...args];
    
    if (this.shouldLog('info')) {
      this.createLogEntry('info', category, message, context);
      console.info(`ℹ️ [${category.toUpperCase()}] ${message}`, ...this.formatContext(context));
    }
  }

  warn(message: string, categoryOrContext?: LogCategory | unknown, ...args: unknown[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? categoryOrContext 
      : 'general';
    const context = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? args 
      : [categoryOrContext, ...args];
    
    if (this.shouldLog('warn')) {
      this.createLogEntry('warn', category, message, context);
      console.warn(`⚠️ [${category.toUpperCase()}] ${message}`, ...this.formatContext(context));
      
      if (isProduction() && PRODUCTION_CONFIG.LOGGING.ENABLE_ERROR_REPORTING) {
        this.reportError(message, context[0]);
      }
    }
  }

  error(message: string, error?: Error | unknown, categoryOrExtra?: LogCategory | unknown, ...args: unknown[]) {
    const category: LogCategory = typeof categoryOrExtra === 'string' && this.isValidCategory(categoryOrExtra) 
      ? categoryOrExtra 
      : 'general';
    
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

  debug(message: string, categoryOrContext?: LogCategory | unknown, ...args: unknown[]) {
    const category: LogCategory = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? categoryOrContext 
      : 'general';
    const context = typeof categoryOrContext === 'string' && this.isValidCategory(categoryOrContext) 
      ? args 
      : [categoryOrContext, ...args];
    
    if (this.shouldLog('debug')) {
      this.createLogEntry('debug', category, message, context);
      console.debug(`🔍 [${category.toUpperCase()}] ${message}`, ...this.formatContext(context));
    }
  }

  /**
   * Log performance metrics
   */
  perf(operation: string, duration: number, category?: LogCategory) {
    const entry: PerfEntry = {
      operation,
      duration,
      timestamp: new Date(),
      category,
    };

    this.perfLogs.push(entry);
    if (this.perfLogs.length > this.maxPerfLogs) {
      this.perfLogs.shift();
    }

    if (this.shouldLog('debug')) {
      const categoryStr = category ? `[${category.toUpperCase()}] ` : '';
      console.debug(`⏱️ ${categoryStr}${operation}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Trace structured data for debugging
   */
  trace(message: string, data: Record<string, unknown>, category: LogCategory = 'general') {
    if (this.shouldLog('debug')) {
      this.createLogEntry('debug', category, message, data);
      console.debug(`🔎 [${category.toUpperCase()}] ${message}`, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(operation: string, category?: LogCategory): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.perf(operation, duration, category);
    };
  }

  private isValidCategory(value: string): value is LogCategory {
    const validCategories: LogCategory[] = [
      'auth', 'api', 'ui', 'database', 'service', 'general',
      'emission', 'training', 'supplier', 'document', 'gri',
      'audit', 'compliance', 'quality', 'notification', 'import'
    ];
    return validCategories.includes(value as LogCategory);
  }

  private reportError(message: string, error?: Error | unknown) {
    // TODO: Integrate with error reporting service (Sentry, etc.)
    // This is a placeholder for future integration
    const errorData = {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
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
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get performance logs
   */
  getPerfLogs(count: number = 20): PerfEntry[] {
    return this.perfLogs.slice(-count);
  }

  /**
   * Get average performance for an operation
   */
  getAvgPerf(operation: string): number | null {
    const matching = this.perfLogs.filter(p => p.operation === operation);
    if (matching.length === 0) return null;
    return matching.reduce((sum, p) => sum + p.duration, 0) / matching.length;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.perfLogs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      perfLogs: this.perfLogs,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

export const logger = new Logger();

// Export type for external use
export type { LogCategory, LogLevel, LogEntry, PerfEntry };
