// Shared validation utilities for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

export interface AuthContext {
  user: any;
  companyId: string;
}

export interface ValidationError {
  error: string;
  status: number;
}

// ============================================================================
// SERVER-SIDE ZOD SCHEMAS
// ============================================================================

/**
 * Password schema with full complexity requirements
 * - Min 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const serverPasswordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

/**
 * Email schema for server-side validation
 */
export const serverEmailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo');

/**
 * Validate request body against a Zod schema
 */
export function validateBodyWithSchema<T>(
  body: unknown, 
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues[0]?.message || 'Dados inválidos'
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * In-memory rate limit cache
 * Note: This is per-instance. For production, consider using Deno KV or database.
 */
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if an action is rate limited
 * 
 * @param identifier - Unique identifier (e.g., "login:document:ip")
 * @param maxAttempts - Maximum allowed attempts in the window
 * @param windowMinutes - Time window in minutes
 * @returns Rate limit status
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remainingAttempts: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  const current = rateLimitCache.get(identifier);
  
  // First request or window expired - reset
  if (!current || now > current.resetTime) {
    rateLimitCache.set(identifier, { count: 1, resetTime: now + windowMs });
    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - 1, 
      resetInSeconds: windowMinutes * 60 
    };
  }
  
  // Rate limit exceeded
  if (current.count >= maxAttempts) {
    const resetInSeconds = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, resetInSeconds };
  }
  
  // Increment count
  current.count++;
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - current.count,
    resetInSeconds: Math.ceil((current.resetTime - now) / 1000)
  };
}

/**
 * Clear rate limit for an identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitCache.delete(identifier);
}

// ============================================================================
// AUTHENTICATION VALIDATION
// ============================================================================

/**
 * Validates authorization and returns user context
 * Returns ValidationError if auth fails, or AuthContext if successful
 */
export async function validateAuth(
  req: Request,
  supabaseUrl: string,
  supabaseKey: string
): Promise<AuthContext | ValidationError> {
  // Check Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('❌ Missing Authorization header');
    return {
      error: 'Authorization header is required',
      status: 401
    };
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  // Validate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Authentication failed:', authError?.message);
    return {
      error: 'Unauthorized - Invalid or expired token',
      status: 401
    };
  }

  console.log('✅ User authenticated:', user.id);

  // Get user's company
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    console.error('❌ Company not found for user:', user.id, profileError);
    return {
      error: 'Company not found for user',
      status: 404
    };
  }

  console.log('✅ Company found:', profile.company_id);

  return {
    user,
    companyId: profile.company_id
  };
}

/**
 * Helper to check if validation result is an error
 */
export function isValidationError(result: AuthContext | ValidationError): result is ValidationError {
  return 'error' in result;
}

/**
 * Validates request body against expected fields
 */
export function validateRequestBody(body: any, requiredFields: string[]): string | null {
  if (!body) {
    return 'Request body is required';
  }

  for (const field of requiredFields) {
    if (!(field in body)) {
      return `Missing required field: ${field}`;
    }
  }

  return null;
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizes UUID - converts invalid values to null
 */
export function sanitizeUUID(value: any): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'none' || trimmed === 'undefined' || trimmed === 'null') {
    return null;
  }
  
  return isValidUUID(trimmed) ? trimmed : null;
}
