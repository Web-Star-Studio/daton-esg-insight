/**
 * Supabase helper types for better type safety
 * Complements the auto-generated types from Supabase
 */

import type { PostgrestError } from '@supabase/supabase-js';

// Re-export PostgrestError for convenience
export type { PostgrestError };

// Supabase error with additional context
export interface SupabaseError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

// Supabase query result wrapper
export interface SupabaseQueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
  count?: number | null;
  status: number;
  statusText: string;
}

// Supabase mutation result
export interface SupabaseMutationResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

// Auth session type
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  role?: string;
}

// User profile from profiles table
export interface UserProfile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  role: string | null;
  avatar_url?: string | null;
  has_completed_onboarding: boolean;
  created_at?: string;
  updated_at?: string;
}

// Company basic info
export interface CompanyBasic {
  id: string;
  name: string;
  logo_url?: string | null;
}

// Real-time subscription payload
export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  errors: string[] | null;
}

// Storage file metadata
export interface StorageFileMetadata {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

// Storage upload options
export interface StorageUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

// RPC function result
export interface RpcResult<T = unknown> {
  data: T | null;
  error: PostgrestError | null;
}

// Type guard for Supabase errors
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    typeof (error as SupabaseError).message === 'string' &&
    typeof (error as SupabaseError).code === 'string'
  );
}

// Type guard for PostgrestError
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'details' in error &&
    'hint' in error
  );
}

// Helper to extract error message from various error types
export function getErrorMessage(error: unknown): string {
  if (isSupabaseError(error)) {
    return error.message;
  }
  if (isPostgrestError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// Helper to check if query was successful
export function isQuerySuccess<T>(result: SupabaseQueryResult<T>): result is SupabaseQueryResult<T> & { data: T } {
  return result.error === null && result.data !== null;
}

// Common database field types
export interface TimestampFields {
  created_at: string;
  updated_at?: string;
}

export interface SoftDeleteFields {
  deleted_at?: string | null;
  is_deleted?: boolean;
}

export interface AuditFields extends TimestampFields {
  created_by?: string;
  updated_by?: string;
}

// Base entity with common fields
export interface BaseEntity extends TimestampFields {
  id: string;
}

// Company-scoped entity
export interface CompanyScopedEntity extends BaseEntity {
  company_id: string;
}

// User-scoped entity
export interface UserScopedEntity extends BaseEntity {
  user_id: string;
}
