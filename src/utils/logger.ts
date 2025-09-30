// Sistema de logging estruturado para produção
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorDetails = error ? ` - ${error.message}` : '';
    console.error(this.formatMessage('error', message + errorDetails, context));
    
    if (error?.stack && this.isDevelopment) {
      console.error(error.stack);
    }
  }

  debug(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
      if (data) {
        console.debug('Debug data:', data);
      }
    }
  }
}

export const logger = new Logger();