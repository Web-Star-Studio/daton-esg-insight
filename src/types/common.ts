// Common interfaces and types used across the application

// Base data interfaces
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyEntity extends BaseEntity {
  company_id: string;
}

export interface UserEntity extends BaseEntity {
  created_by_user_id: string;
}

// Common form data types
export interface CreateData {
  [key: string]: any;
}

export interface UpdateData {
  [key: string]: any;
}

// Status enums used across modules
export type EntityStatus = 
  | 'Ativo' 
  | 'Inativo' 
  | 'Pendente' 
  | 'Aprovado' 
  | 'Rejeitado'
  | 'Em Análise'
  | 'Concluído'
  | 'Cancelado';

export type Priority = 'Alta' | 'Média' | 'Baixa';
export type Severity = 'Crítica' | 'Alta' | 'Média' | 'Baixa';
export type RiskLevel = 'Crítico' | 'Alto' | 'Médio' | 'Baixo' | 'Muito Baixo';

export type TrendDirection = 'up' | 'down' | 'stable';
export type AlertType = 'success' | 'warning' | 'error' | 'info';

// Common filter and pagination types
export interface FilterOptions {
  status?: EntityStatus[];
  priority?: Priority[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  category?: string;
  responsible_user_id?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Dashboard common types
export interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  trend?: TrendDirection;
  unit?: string;
  description?: string;
  link?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  date?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule;
  dependsOn?: string;
  conditional?: (formData: any) => boolean;
}

// File handling types
export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface DocumentReference {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
  uploaded_by: string;
}

// Notification types
export interface NotificationData {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  user_id: string;
}

// Audit trail types
export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  old_values?: any;
  new_values?: any;
  user_id: string;
  user_name: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}