/**
 * Data Validation Utilities
 * Provides comprehensive validation for extracted data
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface FieldValidation {
  field: string;
  type: 'string' | 'number' | 'date' | 'email' | 'url' | 'cnpj' | 'cpf' | 'phone';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

/**
 * Validate CNPJ format and checksum
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

/**
 * Validate CPF format and checksum
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cpf.charAt(10));
}

/**
 * Validate date format and reasonability
 */
export function validateDate(date: string | Date, options: { 
  allowFuture?: boolean;
  allowPast?: boolean;
  minDate?: Date;
  maxDate?: Date;
} = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const { allowFuture = true, allowPast = true, minDate, maxDate } = options;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      errors.push('Data inválida');
      return { isValid: false, errors, warnings, suggestions: [] };
    }
    
    const now = new Date();
    
    if (!allowFuture && dateObj > now) {
      errors.push('Data no futuro não é permitida');
    }
    
    if (!allowPast && dateObj < now) {
      errors.push('Data no passado não é permitida');
    }
    
    if (minDate && dateObj < minDate) {
      errors.push(`Data deve ser posterior a ${minDate.toLocaleDateString()}`);
    }
    
    if (maxDate && dateObj > maxDate) {
      errors.push(`Data deve ser anterior a ${maxDate.toLocaleDateString()}`);
    }
    
    // Warnings for unusual dates
    const year = dateObj.getFullYear();
    if (year < 1900) {
      warnings.push('Data muito antiga, verifique o ano');
    }
    if (year > now.getFullYear() + 10) {
      warnings.push('Data muito distante no futuro');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  } catch (e) {
    return {
      isValid: false,
      errors: ['Erro ao validar data'],
      warnings: [],
      suggestions: ['Formato esperado: YYYY-MM-DD']
    };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (Brazilian format)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, '');
  // Brazilian phone: 10 or 11 digits (with area code)
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validate extracted data against schema
 */
export function validateExtractedData(
  data: Record<string, any>,
  schema: FieldValidation[]
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  
  for (const field of schema) {
    const value = data[field.field];
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check required
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`Campo ${field.field} é obrigatório`);
    }
    
    // Skip further validation if empty and not required
    if (!value && !field.required) {
      results[field.field] = { isValid: true, errors, warnings, suggestions };
      continue;
    }
    
    // Type validation
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push('Deve ser um número');
        } else {
          const num = Number(value);
          if (field.min !== undefined && num < field.min) {
            errors.push(`Valor mínimo: ${field.min}`);
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(`Valor máximo: ${field.max}`);
          }
        }
        break;
        
      case 'date':
        const dateResult = validateDate(value);
        errors.push(...dateResult.errors);
        warnings.push(...dateResult.warnings);
        suggestions.push(...dateResult.suggestions);
        break;
        
      case 'email':
        if (!validateEmail(value)) {
          errors.push('Email inválido');
          suggestions.push('Formato esperado: usuario@dominio.com');
        }
        break;
        
      case 'url':
        if (!validateURL(value)) {
          errors.push('URL inválida');
          suggestions.push('Formato esperado: https://exemplo.com');
        }
        break;
        
      case 'cnpj':
        if (!validateCNPJ(value)) {
          errors.push('CNPJ inválido');
          suggestions.push('Formato esperado: 00.000.000/0000-00');
        }
        break;
        
      case 'cpf':
        if (!validateCPF(value)) {
          errors.push('CPF inválido');
          suggestions.push('Formato esperado: 000.000.000-00');
        }
        break;
        
      case 'phone':
        if (!validatePhone(value)) {
          errors.push('Telefone inválido');
          suggestions.push('Formato esperado: (00) 00000-0000');
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          errors.push('Deve ser texto');
        } else {
          if (field.min && value.length < field.min) {
            errors.push(`Mínimo de ${field.min} caracteres`);
          }
          if (field.max && value.length > field.max) {
            warnings.push(`Máximo recomendado: ${field.max} caracteres`);
          }
          if (field.pattern && !field.pattern.test(value)) {
            errors.push('Formato inválido');
          }
        }
        break;
    }
    
    // Custom validation
    if (field.custom && !field.custom(value)) {
      errors.push('Validação customizada falhou');
    }
    
    results[field.field] = {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
  
  return results;
}

/**
 * Get validation schema for common table types
 */
export function getTableValidationSchema(tableName: string): FieldValidation[] {
  const schemas: Record<string, FieldValidation[]> = {
    licenses: [
      { field: 'license_name', type: 'string', required: true, min: 3, max: 200 },
      { field: 'license_number', type: 'string', required: true, min: 3 },
      { field: 'issue_date', type: 'date', required: true },
      { field: 'expiration_date', type: 'date', required: true },
    ],
    suppliers: [
      { field: 'name', type: 'string', required: true, min: 3, max: 200 },
      { field: 'cnpj', type: 'cnpj', required: false },
      { field: 'contact_email', type: 'email', required: false },
      { field: 'contact_phone', type: 'phone', required: false },
    ],
    employees: [
      { field: 'full_name', type: 'string', required: true, min: 3, max: 200 },
      { field: 'cpf', type: 'cpf', required: false },
      { field: 'email', type: 'email', required: false },
      { field: 'phone', type: 'phone', required: false },
      { field: 'hire_date', type: 'date', required: false },
    ],
    emission_sources: [
      { field: 'source_name', type: 'string', required: true, min: 3, max: 200 },
      { field: 'scope', type: 'number', required: true, min: 1, max: 3 },
    ],
    waste_logs: [
      { field: 'waste_type', type: 'string', required: true, min: 3 },
      { field: 'quantity', type: 'number', required: true, min: 0 },
      { field: 'log_date', type: 'date', required: true },
    ],
  };
  
  return schemas[tableName] || [];
}
