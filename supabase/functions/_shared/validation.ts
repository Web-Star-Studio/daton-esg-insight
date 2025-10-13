// Shared validation utilities for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  user: any;
  companyId: string;
}

export interface ValidationError {
  error: string;
  status: number;
}

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
