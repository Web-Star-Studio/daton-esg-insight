import { NormalizationOptions } from '@/services/deduplication';

/**
 * Normaliza texto para comparação e detecção de duplicatas
 * Aplica transformações como trim, lowercase, remoção de acentos, etc.
 */
export function normalizeText(
  text: string | null | undefined,
  options?: NormalizationOptions
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = text;

  const opts: NormalizationOptions = {
    trim: true,
    lowercase: true,
    remove_accents: true,
    remove_special_chars: false,
    normalize_whitespace: true,
    ...options
  };

  // Trim - remover espaços nas pontas
  if (opts.trim) {
    result = result.trim();
  }

  // Normalizar múltiplos espaços em um único
  if (opts.normalize_whitespace) {
    result = result.replace(/\s+/g, ' ');
  }

  // Converter para minúsculas
  if (opts.lowercase) {
    result = result.toLowerCase();
  }

  // Remover acentos usando normalização Unicode
  if (opts.remove_accents) {
    result = result
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos
  }

  // Remover caracteres especiais (mantém apenas letras, números e espaços)
  if (opts.remove_special_chars) {
    result = result.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  return result;
}

/**
 * Compara duas strings após normalização
 */
export function compareNormalized(
  text1: string | null | undefined,
  text2: string | null | undefined,
  options?: NormalizationOptions
): boolean {
  const normalized1 = normalizeText(text1, options);
  const normalized2 = normalizeText(text2, options);
  return normalized1 === normalized2;
}

/**
 * Exemplos de uso e casos de teste
 */
export const normalizationExamples = {
  basic: {
    input: '  João da Silva  ',
    output: 'joao da silva',
    description: 'Normalização completa (trim, lowercase, remove acentos)'
  },
  caseInsensitive: {
    input: 'MARIA JOSÉ',
    output: 'maria jose',
    description: 'Maiúsculas para minúsculas + acentos'
  },
  whitespace: {
    input: 'São   Paulo    SP',
    output: 'sao paulo sp',
    description: 'Múltiplos espaços normalizados'
  },
  specialChars: {
    input: 'R$ 1.234,56',
    output: 'r 123456',
    description: 'Com remove_special_chars ativado'
  },
  cpf: {
    input: '123.456.789-00',
    output: '12345678900',
    description: 'CPF normalizado (remove pontuação)'
  },
  email: {
    input: '  USUARIO@EMAIL.COM  ',
    output: 'usuario@email.com',
    description: 'Email normalizado'
  }
};

/**
 * Testa normalização com diferentes opções
 */
export function testNormalization(text: string): Record<string, string> {
  return {
    original: text,
    default: normalizeText(text),
    onlyTrim: normalizeText(text, { 
      trim: true, 
      lowercase: false, 
      remove_accents: false 
    }),
    onlyLowercase: normalizeText(text, { 
      trim: false, 
      lowercase: true, 
      remove_accents: false 
    }),
    noAccents: normalizeText(text, { 
      trim: true, 
      lowercase: false, 
      remove_accents: true 
    }),
    full: normalizeText(text, { 
      trim: true, 
      lowercase: true, 
      remove_accents: true, 
      remove_special_chars: true,
      normalize_whitespace: true
    })
  };
}
