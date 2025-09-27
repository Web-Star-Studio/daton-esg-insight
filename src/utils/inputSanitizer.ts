// Utilitários para sanitização e validação de inputs

export interface SanitizationOptions {
  maxLength?: number;
  allowedTags?: string[];
  removeScripts?: boolean;
  trimWhitespace?: boolean;
}

// Sanitiza strings básicas
export function sanitizeString(
  input: string, 
  options: SanitizationOptions = {}
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;
  
  // Remove scripts por padrão
  if (options.removeScripts !== false) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }
  
  // Trim whitespace
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }
  
  // Aplicar limite de caracteres
  if (options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }
  
  return sanitized;
}

// Sanitiza dados de formulário
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldRules: Partial<Record<keyof T, SanitizationOptions>> = {}
): T {
  const sanitized = { ...data };
  
  (Object.keys(sanitized) as Array<keyof T>).forEach((key) => {
    const value = sanitized[key];
    const rules = fieldRules[key] || {};
    
    if (typeof value === 'string') {
      (sanitized as any)[key] = sanitizeString(value, rules);
    } else if (Array.isArray(value)) {
      (sanitized as any)[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item, rules) : item
      );
    }
  });
  
  return sanitized;
}

// Valida e sanitiza URLs
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    
    // Permitir apenas protocolos seguros
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol)) {
      return '';
    }
    
    return parsedUrl.toString();
  } catch {
    return '';
  }
}

// Valida CNPJ
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/[^\d]/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Verifica sequências iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  if (parseInt(numbers[12]) !== firstDigit) return false;
  
  sum = 0;
  weight = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(numbers[13]) === secondDigit;
}

// Formata CNPJ
export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/[^\d]/g, '');
  
  if (numbers.length !== 14) return cnpj;
  
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// Rate limiting para prevenir spam
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMinutes: number = 1
): boolean {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Sanitização específica para diferentes tipos de dados
export const sanitizers = {
  email: (email: string) => sanitizeString(email, { maxLength: 255 }).toLowerCase(),
  
  name: (name: string) => sanitizeString(name, { 
    maxLength: 100,
    trimWhitespace: true 
  }),
  
  description: (desc: string) => sanitizeString(desc, { 
    maxLength: 1000,
    trimWhitespace: true 
  }),
  
  currency: (value: string) => {
    const numbers = value.replace(/[^\d,.-]/g, '');
    return parseFloat(numbers.replace(',', '.')) || 0;
  },
  
  phone: (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, '');
    return numbers.slice(0, 11); // Limita a 11 dígitos (DDD + número)
  }
};