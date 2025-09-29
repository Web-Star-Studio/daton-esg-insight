import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Email inválido').optional().or(z.literal(''));
export const phoneSchema = z.string().optional();
export const cnpjSchema = z.string().optional();
export const cpfSchema = z.string().optional();

// Text field schemas
export const requiredStringSchema = (fieldName: string, maxLength = 255) => 
  z.string()
    .trim()
    .min(1, `${fieldName} é obrigatório`)
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`);

export const optionalStringSchema = (maxLength = 255) => 
  z.string()
    .trim()
    .max(maxLength, `Texto deve ter no máximo ${maxLength} caracteres`)
    .optional();

// Number schemas
export const positiveNumberSchema = (fieldName: string) =>
  z.number()
    .min(0, `${fieldName} deve ser um valor positivo`);

export const optionalPositiveNumberSchema = () =>
  z.number()
    .min(0, 'Valor deve ser positivo')
    .optional();

// Date schemas
export const dateSchema = z.date({
  message: 'Data é obrigatória'
});

export const optionalDateSchema = z.date().optional();

export const futureDateSchema = z.date()
  .refine(date => date > new Date(), {
    message: 'Data deve ser futura'
  });

// Common form schemas
export const contactFormSchema = z.object({
  name: requiredStringSchema('Nome', 100),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: requiredStringSchema('Mensagem', 1000)
});

export const addressSchema = z.object({
  street: requiredStringSchema('Rua', 255),
  number: requiredStringSchema('Número', 20),
  complement: optionalStringSchema(100),
  neighborhood: requiredStringSchema('Bairro', 100),
  city: requiredStringSchema('Cidade', 100),
  state: requiredStringSchema('Estado', 2),
  zipCode: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
});

// File validation
export const fileSchema = z.object({
  name: requiredStringSchema('Nome do arquivo'),
  size: z.number().max(10 * 1024 * 1024, 'Arquivo deve ter no máximo 10MB'),
  type: z.string()
});

// URL validation
export const urlSchema = z.string()
  .url('URL inválida')
  .optional()
  .or(z.literal(''));

// Custom validation functions
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
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

// Custom Zod schemas with validators
export const cnpjValidationSchema = z.string()
  .optional()
  .refine(
    value => !value || validateCNPJ(value),
    { message: 'CNPJ inválido' }
  );

export const cpfValidationSchema = z.string()
  .optional()
  .refine(
    value => !value || validateCPF(value),
    { message: 'CPF inválido' }
  );

// Date range validation
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema
}).refine(
  data => data.endDate >= data.startDate,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['endDate']
  }
);