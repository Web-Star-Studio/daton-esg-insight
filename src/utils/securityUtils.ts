/**
 * Security Utilities
 * Input validation and sanitization for production security
 */

import { PRODUCTION_CONFIG } from './productionConfig';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!PRODUCTION_CONFIG.SECURITY.ENABLE_INPUT_SANITIZATION) {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link'];
  dangerousTags.forEach(tag => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Remove dangerous attributes
  const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover'];
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    dangerousAttrs.forEach(attr => {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate CNPJ format
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return false;
  }

  // Validate check digits
  let sum = 0;
  let pos = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(cleanCNPJ.charAt(12))) {
    return false;
  }

  sum = 0;
  pos = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(cleanCNPJ.charAt(13));
}

/**
 * Validate CPF format
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(cleanCPF.charAt(10));
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (!PRODUCTION_CONFIG.SECURITY.ENABLE_INPUT_SANITIZATION) {
    return input;
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\-,.@()]/g, ''); // Keep only alphanumeric and safe chars
}

/**
 * Validate file type for uploads
 */
export function isValidFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate file size
 */
export function isValidFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Rate limiting helper (client-side)
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if action is rate limited
   */
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    if (!PRODUCTION_CONFIG.SECURITY.ENABLE_RATE_LIMITING) {
      return false;
    }

    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Generate secure random string
 */
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for SQL injection patterns (basic)
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(union.*select)/i,
    /(;|\-\-|\/\*)/
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}
