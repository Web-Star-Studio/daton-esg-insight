// Utility functions for form validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Calculate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCNPJ[12]) !== firstDigit) return false;
  
  // Calculate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCNPJ[13]) === secondDigit;
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF[9]) !== firstDigit) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCPF[10]) === secondDigit;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateDateRange = (startDate: string | Date, endDate: string | Date): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return start <= end;
};

export const sanitizeString = (value: string, maxLength = 255): string => {
  return value.trim().substring(0, maxLength);
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateNumericRange = (value: number, min?: number, max?: number): boolean => {
  if (isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Sanitize UUID helper - converts invalid UUID values to undefined
export const sanitizeUUID = (value: string | undefined | null): string | undefined => {
  if (!value || value === 'none' || value === 'undefined' || value === 'null' || value.trim() === '') {
    return undefined;
  }
  return value;
};

// Validate company context for forms
export const validateCompanyContext = async (supabase: any) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Usuário não autenticado');
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
    
  if (profileError || !profile?.company_id) {
    throw new Error('Company ID não encontrado. Por favor, complete seu perfil.');
  }
  
  return { userId: user.id, companyId: profile.company_id };
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CURRENCY: /^\d+(\.\d{2})?$/,
  PERCENTAGE: /^(100|[1-9]?\d)(\.\d+)?$/
};