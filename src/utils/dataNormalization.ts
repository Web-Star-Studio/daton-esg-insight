/**
 * Utilitários para normalização de dados
 * Garante tipos seguros e consistentes em toda a aplicação
 * 
 * Regras:
 * - Strings: nunca null, usar ""
 * - Numbers: nunca undefined, usar 0 ou null
 * - Booleans: true/false, nunca truthy
 * - Dates: ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)
 * - Enums: valores validados contra allowlist
 * - Arrays: [] se vazio
 */

/**
 * Normaliza strings - nunca retorna null/undefined
 * @param value - Valor a ser normalizado
 * @returns String vazia se null/undefined, caso contrário a string trimada
 */
export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Normaliza números - retorna defaultValue se inválido
 * @param value - Valor a ser normalizado
 * @param defaultValue - Valor padrão (default: 0)
 * @returns Número válido ou defaultValue
 */
export function normalizeNumber(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Normaliza números - retorna null para "não informado"
 * Use quando null tem significado semântico diferente de 0
 * @param value - Valor a ser normalizado
 * @returns Número válido ou null
 */
export function normalizeNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Normaliza booleanos - sempre retorna true ou false literal
 * @param value - Valor a ser normalizado
 * @param defaultValue - Valor padrão (default: false)
 * @returns Boolean literal
 */
export function normalizeBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return defaultValue;
}

/**
 * Normaliza datas para formato ISO 8601 (YYYY-MM-DD)
 * @param value - Valor a ser normalizado
 * @returns String no formato YYYY-MM-DD ou null
 */
export function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  
  // Se já está no formato correto, retorna direto
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  
  // Usar componentes locais para evitar problemas de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Normaliza datas para formato ISO 8601 completo (YYYY-MM-DDTHH:mm:ssZ)
 * @param value - Valor a ser normalizado
 * @returns String no formato ISO 8601 completo ou null
 */
export function normalizeDatetime(value: unknown): string | null {
  if (!value) return null;
  
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString();
}

/**
 * Normaliza arrays - sempre retorna array (vazio se inválido)
 * @param value - Valor a ser normalizado
 * @returns Array do tipo especificado
 */
export function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * Normaliza enums - valida contra allowlist
 * @param value - Valor a ser normalizado
 * @param allowlist - Lista de valores permitidos
 * @param defaultValue - Valor padrão se inválido
 * @returns Valor válido do enum
 */
export function normalizeEnum<T extends string>(
  value: unknown,
  allowlist: readonly T[],
  defaultValue: T
): T {
  if (typeof value === 'string' && allowlist.includes(value as T)) {
    return value as T;
  }
  return defaultValue;
}

/**
 * Normaliza enums numéricos
 * @param value - Valor a ser normalizado
 * @param allowlist - Lista de valores permitidos
 * @param defaultValue - Valor padrão se inválido
 * @returns Valor válido do enum numérico
 */
export function normalizeNumericEnum<T extends number>(
  value: unknown,
  allowlist: readonly T[],
  defaultValue: T
): T {
  const num = Number(value);
  if (!isNaN(num) && allowlist.includes(num as T)) {
    return num as T;
  }
  return defaultValue;
}

/**
 * Normaliza objeto JSON do banco de dados
 * @param value - Valor JSON do Supabase
 * @param defaultValue - Valor padrão se inválido
 * @returns Objeto tipado ou valor padrão
 */
export function normalizeJson<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  
  if (typeof value === 'object') {
    return value as T;
  }
  
  return defaultValue;
}

/**
 * Remove valores undefined de um objeto (para inserts no Supabase)
 * @param obj - Objeto a ser limpo
 * @returns Objeto sem propriedades undefined
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  
  return result;
}

/**
 * Valida e normaliza email
 * @param value - Valor a ser normalizado
 * @returns Email em lowercase ou string vazia
 */
export function normalizeEmail(value: unknown): string {
  const email = normalizeString(value).toLowerCase();
  // Validação básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : '';
}

/**
 * Normaliza telefone - remove caracteres não numéricos
 * @param value - Valor a ser normalizado
 * @returns Apenas dígitos ou string vazia
 */
export function normalizePhone(value: unknown): string {
  return normalizeString(value).replace(/\D/g, '');
}

/**
 * Normaliza CPF - remove caracteres não numéricos
 * @param value - Valor a ser normalizado
 * @returns CPF com apenas dígitos ou string vazia
 */
export function normalizeCPF(value: unknown): string {
  return normalizeString(value).replace(/\D/g, '');
}

/**
 * Normaliza CNPJ - remove caracteres não numéricos
 * @param value - Valor a ser normalizado
 * @returns CNPJ com apenas dígitos ou string vazia
 */
export function normalizeCNPJ(value: unknown): string {
  return normalizeString(value).replace(/\D/g, '');
}
