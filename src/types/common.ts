// Common TypeScript definitions for better type safety

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Form types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
}

// Modal types
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface ConfirmationModalProps extends BaseModalProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Table/List types
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  width?: string;
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Filter and sort types
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'list' | 'table';
  size: 'small' | 'medium' | 'large';
  data?: unknown;
  config?: Record<string, unknown>;
}

export interface MetricData {
  value: number | string;
  label: string;
  trend?: number;
  trendLabel?: string;
  format?: 'number' | 'currency' | 'percentage';
}

// Chart types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Component utility types
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ESG specific types
export interface ESGIndicator {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  unit: string;
  target?: number;
  current?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;
export type AsyncEventHandler<T = unknown> = (data: T) => Promise<void>;

// Query types for React Query
export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
}

// File upload types
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}