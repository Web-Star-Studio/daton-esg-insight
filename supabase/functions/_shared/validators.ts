/**
 * Sistema de Validação de Campos Extraídos
 * Valida e corrige dados bagunçados de documentos
 */

export interface ValidationResult {
  isValid: boolean;
  normalizedValue: any;
  confidence: number;
  issues: string[];
  corrections: string[];
}

/**
 * Valida e normaliza CPF
 */
export function validateCPF(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Remove caracteres não numéricos
  let cleaned = value.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 11) {
    issues.push('CPF deve ter 11 dígitos');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  // Verifica dígitos verificadores
  const digits = cleaned.split('').map(Number);
  
  // Primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  // Segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  const isValid = digits[9] === digit1 && digits[10] === digit2;
  
  if (!isValid) {
    issues.push('Dígitos verificadores inválidos');
  }
  
  // Formata: 000.000.000-00
  const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  
  if (value !== formatted) {
    corrections.push(`Formatado de "${value}" para "${formatted}"`);
  }
  
  return {
    isValid,
    normalizedValue: formatted,
    confidence: isValid ? 0.95 : 0.3,
    issues,
    corrections
  };
}

/**
 * Valida e normaliza CNPJ
 */
export function validateCNPJ(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Remove caracteres não numéricos
  let cleaned = value.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 14) {
    issues.push('CNPJ deve ter 14 dígitos');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  // Verifica dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const digits = cleaned.split('').map(Number);
  
  // Primeiro dígito
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  // Segundo dígito
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += digits[i] * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  const isValid = digits[12] === digit1 && digits[13] === digit2;
  
  if (!isValid) {
    issues.push('Dígitos verificadores inválidos');
  }
  
  // Formata: 00.000.000/0000-00
  const formatted = cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  
  if (value !== formatted) {
    corrections.push(`Formatado de "${value}" para "${formatted}"`);
  }
  
  return {
    isValid,
    normalizedValue: formatted,
    confidence: isValid ? 0.95 : 0.3,
    issues,
    corrections
  };
}

/**
 * Valida e normaliza data em diversos formatos brasileiros
 */
export function validateDate(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Padrões aceitos
  const patterns = [
    // DD/MM/YYYY
    { regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, order: 'dmy' },
    // DD/MM/YY
    { regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/, order: 'dmy2' },
    // YYYY-MM-DD (ISO)
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: 'ymd' },
    // DD de MMMM de YYYY
    { regex: /^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i, order: 'text' }
  ];
  
  const monthNames: { [key: string]: string } = {
    'janeiro': '01', 'jan': '01',
    'fevereiro': '02', 'fev': '02',
    'março': '03', 'mar': '03',
    'abril': '04', 'abr': '04',
    'maio': '05', 'mai': '05',
    'junho': '06', 'jun': '06',
    'julho': '07', 'jul': '07',
    'agosto': '08', 'ago': '08',
    'setembro': '09', 'set': '09',
    'outubro': '10', 'out': '10',
    'novembro': '11', 'nov': '11',
    'dezembro': '12', 'dez': '12'
  };
  
  let day: string = '', month: string = '', year: string = '';
  let matched = false;
  
  for (const pattern of patterns) {
    const match = value.match(pattern.regex);
    if (match) {
      matched = true;
      
      if (pattern.order === 'dmy') {
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        year = match[3];
      } else if (pattern.order === 'dmy2') {
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        year = parseInt(match[3]) > 50 ? '19' + match[3] : '20' + match[3];
        corrections.push(`Ano assumido: ${year}`);
      } else if (pattern.order === 'ymd') {
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else if (pattern.order === 'text') {
        day = match[1].padStart(2, '0');
        const monthText = match[2].toLowerCase();
        month = monthNames[monthText] || '01';
        year = match[3];
        corrections.push(`Mês convertido de texto: ${match[2]}`);
      }
      break;
    }
  }
  
  if (!matched) {
    issues.push('Formato de data não reconhecido');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  // Valida data
  const dateObj = new Date(`${year}-${month}-${day}`);
  const isValidDate = !isNaN(dateObj.getTime()) &&
    dateObj.getDate() === parseInt(day) &&
    dateObj.getMonth() + 1 === parseInt(month);
  
  if (!isValidDate) {
    issues.push('Data inválida');
  }
  
  const isoDate = `${year}-${month}-${day}`;
  
  if (value !== isoDate) {
    corrections.push(`Convertido de "${value}" para formato ISO "${isoDate}"`);
  }
  
  return {
    isValid: isValidDate,
    normalizedValue: isoDate,
    confidence: isValidDate ? 0.9 : 0.2,
    issues,
    corrections
  };
}

/**
 * Valida e normaliza valores numéricos com vírgula/ponto
 */
export function validateNumber(value: string | number, unit?: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  if (typeof value === 'number') {
    return { isValid: true, normalizedValue: value, confidence: 1.0, issues, corrections };
  }
  
  // Remove espaços e caracteres não numéricos exceto vírgula, ponto e sinal negativo
  let cleaned = value.replace(/[^\d,.\-]/g, '');
  
  // Detecta formato brasileiro (vírgula como decimal)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Formato: 1.234,56 (BR) ou 1,234.56 (US)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato BR: remove pontos, troca vírgula por ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      corrections.push('Convertido de formato BR para numérico');
    } else {
      // Formato US: remove vírgulas
      cleaned = cleaned.replace(/,/g, '');
      corrections.push('Convertido de formato US para numérico');
    }
  } else if (cleaned.includes(',')) {
    // Apenas vírgula: assumir decimal BR
    cleaned = cleaned.replace(',', '.');
    corrections.push('Vírgula convertida para ponto decimal');
  }
  
  const numValue = parseFloat(cleaned);
  
  if (isNaN(numValue)) {
    issues.push('Valor numérico inválido');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  return {
    isValid: true,
    normalizedValue: numValue,
    confidence: 0.95,
    issues,
    corrections
  };
}

/**
 * Valida e normaliza CEP
 */
export function validateCEP(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Remove caracteres não numéricos
  const cleaned = value.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 8) {
    issues.push('CEP deve ter 8 dígitos');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  // Formata: 00000-000
  const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  
  if (value !== formatted) {
    corrections.push(`Formatado de "${value}" para "${formatted}"`);
  }
  
  return {
    isValid: true,
    normalizedValue: formatted,
    confidence: 0.9,
    issues,
    corrections
  };
}

/**
 * Valida email
 */
export function validateEmail(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  const cleaned = value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const isValid = emailRegex.test(cleaned);
  
  if (!isValid) {
    issues.push('Formato de email inválido');
  }
  
  if (value !== cleaned) {
    corrections.push(`Normalizado de "${value}" para "${cleaned}"`);
  }
  
  return {
    isValid,
    normalizedValue: cleaned,
    confidence: isValid ? 0.95 : 0.1,
    issues,
    corrections
  };
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(value: string): ValidationResult {
  const issues: string[] = [];
  const corrections: string[] = [];
  
  // Remove caracteres não numéricos
  const cleaned = value.replace(/[^\d]/g, '');
  
  let formatted = cleaned;
  
  if (cleaned.length === 11) {
    // Celular: (00) 00000-0000
    formatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (00) 0000-0000
    formatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    issues.push('Telefone deve ter 10 ou 11 dígitos');
    return { isValid: false, normalizedValue: value, confidence: 0, issues, corrections };
  }
  
  if (value !== formatted) {
    corrections.push(`Formatado de "${value}" para "${formatted}"`);
  }
  
  return {
    isValid: true,
    normalizedValue: formatted,
    confidence: 0.9,
    issues,
    corrections
  };
}

/**
 * Validador genérico baseado no tipo de campo
 */
export function validateField(fieldName: string, value: any): ValidationResult {
  if (!value || value === '') {
    return {
      isValid: false,
      normalizedValue: value,
      confidence: 0,
      issues: ['Campo vazio'],
      corrections: []
    };
  }
  
  const fieldLower = fieldName.toLowerCase();
  const valueStr = String(value);
  
  // CPF
  if (fieldLower.includes('cpf')) {
    return validateCPF(valueStr);
  }
  
  // CNPJ
  if (fieldLower.includes('cnpj')) {
    return validateCNPJ(valueStr);
  }
  
  // Datas
  if (fieldLower.includes('date') || fieldLower.includes('data') || 
      fieldLower.includes('validade') || fieldLower.includes('vencimento') ||
      fieldLower.includes('emissao') || fieldLower.includes('expiration')) {
    return validateDate(valueStr);
  }
  
  // Números/Quantidades
  if (fieldLower.includes('quantity') || fieldLower.includes('quantidade') ||
      fieldLower.includes('valor') || fieldLower.includes('amount') ||
      fieldLower.includes('custo') || fieldLower.includes('preco')) {
    return validateNumber(valueStr);
  }
  
  // CEP
  if (fieldLower.includes('cep') || fieldLower.includes('postal')) {
    return validateCEP(valueStr);
  }
  
  // Email
  if (fieldLower.includes('email') || fieldLower.includes('e-mail')) {
    return validateEmail(valueStr);
  }
  
  // Telefone
  if (fieldLower.includes('phone') || fieldLower.includes('telefone') || 
      fieldLower.includes('celular')) {
    return validatePhone(valueStr);
  }
  
  // Campo genérico - apenas normalização básica
  const normalized = valueStr.trim();
  return {
    isValid: true,
    normalizedValue: normalized,
    confidence: 0.8,
    issues: [],
    corrections: value !== normalized ? [`Espaços removidos`] : []
  };
}
