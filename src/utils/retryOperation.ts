/**
 * Retry Operation Utility
 * Implements automatic retry logic for operations that may fail temporarily
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        console.error(`❌ Operation failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      console.warn(`⚠️ Operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const retrySupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> => {
  return retryOperation(async () => {
    const { data, error } = await operation();
    
    if (error) {
      throw new Error(error.message || 'Supabase operation failed');
    }
    
    if (!data) {
      throw new Error('No data returned from operation');
    }
    
    return data;
  }, options);
};
