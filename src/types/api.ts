/**
 * API and HTTP response type definitions
 * Provides standardized interfaces for API communication
 */

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
  status?: number;
}

// Standardized API error
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// Paginated response for list endpoints
export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  success: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Request configuration
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

// Edge function response types
export interface EdgeFunctionResponse<T = unknown> {
  data: T | null;
  error: EdgeFunctionError | null;
}

export interface EdgeFunctionError {
  message: string;
  name?: string;
  context?: Record<string, unknown>;
}

// Batch operation result
export interface BatchOperationResult<T = unknown> {
  successful: T[];
  failed: Array<{
    item: unknown;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Upload response
export interface UploadResponse {
  id: string;
  path: string;
  publicUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Export operation result
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
}

// Webhook payload
export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  data: T;
  signature?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version?: string;
  uptime?: number;
  services?: Record<string, 'up' | 'down'>;
  timestamp: string;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}

// Type guards for API responses
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ApiError).message === 'string'
  );
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ApiResponse<T>).success === 'boolean'
  );
}

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T; error: null } {
  return response.success && response.data !== null && response.error === null;
}

export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: null; error: ApiError } {
  return !response.success && response.error !== null;
}

// Helper to create success response
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    success: true,
  };
}

// Helper to create error response
export function createErrorResponse<T = unknown>(
  message: string,
  code?: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    data: null,
    error: { message, code, details },
    success: false,
  };
}
