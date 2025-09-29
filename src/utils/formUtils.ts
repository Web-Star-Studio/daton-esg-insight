import { toast } from 'sonner';

// Utility to show user-friendly error messages
export const showFormError = (error: any, defaultMessage = 'Erro inesperado') => {
  let message = defaultMessage;
  
  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  // Map common backend errors to user-friendly messages
  if (message.includes('duplicate key')) {
    message = 'Este registro já existe no sistema';
  } else if (message.includes('foreign key')) {
    message = 'Existe uma dependência que impede esta operação';
  } else if (message.includes('not null')) {
    message = 'Alguns campos obrigatórios não foram preenchidos';
  } else if (message.includes('unauthorized') || message.includes('403')) {
    message = 'Você não tem permissão para realizar esta ação';
  } else if (message.includes('network') || message.includes('fetch')) {
    message = 'Erro de conexão. Verifique sua internet';
  }
  
  toast.error(message);
};

// Utility to show success messages
export const showFormSuccess = (message: string) => {
  toast.success(message);
};

// Centralized form state management
export class FormStateManager {
  private loading = false;
  private errors: Record<string, string> = {};
  
  setLoading(loading: boolean) {
    this.loading = loading;
  }
  
  getLoading() {
    return this.loading;
  }
  
  setError(field: string, message: string) {
    this.errors[field] = message;
  }
  
  clearError(field: string) {
    delete this.errors[field];
  }
  
  clearAllErrors() {
    this.errors = {};
  }
  
  getError(field: string) {
    return this.errors[field];
  }
  
  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }
  
  getAllErrors() {
    return { ...this.errors };
  }
}

// Common form utilities
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = {} as T;
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string') {
      (sanitized as any)[key] = value.trim();
    } else {
      (sanitized as any)[key] = value;
    }
  });
  
  return sanitized;
};

export const validateStringLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} deve ter no máximo ${maxLength} caracteres`;
  }
  return null;
};

export const validateRequiredField = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} é obrigatório`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Email inválido';
};

export const validateNumericRange = (value: number, min?: number, max?: number, fieldName = 'Valor'): string | null => {
  if (min !== undefined && value < min) {
    return `${fieldName} deve ser maior ou igual a ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} deve ser menor ou igual a ${max}`;
  }
  return null;
};