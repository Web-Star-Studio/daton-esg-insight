/**
 * Form Logging Utility
 * Provides structured logging for form submissions and operations
 */

interface FormLogData {
  form: string;
  action: string;
  success: boolean;
  dataKeys?: string[];
  error?: string;
  errorCode?: string;
  userId?: string;
  companyId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export const logFormSubmission = (
  formName: string,
  data: any,
  success: boolean,
  error?: any,
  metadata?: Record<string, any>
) => {
  const logData: FormLogData = {
    form: formName,
    action: 'submit',
    success,
    dataKeys: data ? Object.keys(data) : undefined,
    error: error?.message,
    errorCode: error?.code,
    metadata,
    timestamp: new Date().toISOString()
  };

  if (success) {
    console.log('✅ Form submission successful:', JSON.stringify(logData, null, 2));
  } else {
    console.error('❌ Form submission failed:', JSON.stringify(logData, null, 2));
  }

  return logData;
};

export const logFormValidation = (
  formName: string,
  isValid: boolean,
  errors?: Record<string, string>
) => {
  const logData = {
    form: formName,
    action: 'validation',
    isValid,
    errorCount: errors ? Object.keys(errors).length : 0,
    errors,
    timestamp: new Date().toISOString()
  };

  if (!isValid) {
    console.warn('⚠️ Form validation failed:', JSON.stringify(logData, null, 2));
  }

  return logData;
};

export const logDatabaseOperation = (
  operation: string,
  table: string,
  success: boolean,
  error?: any,
  metadata?: Record<string, any>
) => {
  const logData = {
    operation,
    table,
    success,
    error: error?.message,
    errorCode: error?.code,
    metadata,
    timestamp: new Date().toISOString()
  };

  if (success) {
    console.log(`✅ Database ${operation} successful:`, JSON.stringify(logData, null, 2));
  } else {
    console.error(`❌ Database ${operation} failed:`, JSON.stringify(logData, null, 2));
  }

  return logData;
};

export const createPerformanceLogger = (operationName: string) => {
  const startTime = performance.now();

  return {
    end: (success: boolean, error?: any) => {
      const duration = performance.now() - startTime;
      
      const logData = {
        operation: operationName,
        duration: Math.round(duration),
        success,
        error: error?.message,
        timestamp: new Date().toISOString()
      };

      if (success) {
        console.log(`⚡ ${operationName} completed in ${Math.round(duration)}ms`);
      } else {
        console.error(`❌ ${operationName} failed after ${Math.round(duration)}ms:`, error);
      }

      return logData;
    }
  };
};
