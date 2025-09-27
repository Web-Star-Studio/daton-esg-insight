// Type guards for runtime type checking

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// API response type guards
export function isApiResponse<T>(value: unknown): value is { data: T; error?: string; success: boolean } {
  return isObject(value) && 'data' in value && 'success' in value && isBoolean(value.success);
}

export function isSuccessResponse<T>(value: unknown): value is { data: T; success: true } {
  return isApiResponse(value) && value.success === true;
}

export function isErrorResponse(value: unknown): value is { error: string; success: false } {
  return isApiResponse(value) && value.success === false && isString(value.error);
}

// ESG specific type guards
export function isESGIndicator(value: unknown): value is {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  unit: string;
} {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.category) &&
    ['environmental', 'social', 'governance'].includes(value.category as string) &&
    isString(value.unit)
  );
}

export function isComplianceTask(value: unknown): value is {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
} {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.status) &&
    ['pending', 'in_progress', 'completed', 'overdue'].includes(value.status as string)
  );
}

// Form validation type guards
export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: string[]
): obj is T {
  if (!isObject(obj)) return false;
  
  return requiredFields.every(field => 
    field in obj && isDefined(obj[field])
  );
}

// Date type guards
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

// File type guards
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

export function isFileList(value: unknown): value is FileList {
  return value instanceof FileList;
}

// Event type guards
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

// Error type guards
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function hasErrorMessage(value: unknown): value is { message: string } {
  return isObject(value) && isString(value.message);
}

// Utility function to safely access nested properties
export function safeGet<T>(
  obj: unknown,
  path: string,
  defaultValue: T
): T {
  if (!isObject(obj)) return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return isDefined(current) ? (current as T) : defaultValue;
}

// Type assertion with validation
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): T {
  if (!guard(value)) {
    throw new Error(errorMessage);
  }
  return value;
}