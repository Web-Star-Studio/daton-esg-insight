/**
 * Centralized Form Validation Schemas
 * 
 * Production-ready Zod schemas for form validation across the application.
 * All schemas follow the CTO directive for strict input validation.
 */

import { z } from 'zod';
import { passwordSchema } from '@/utils/passwordValidation';

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z.string()
    .min(1, 'Senha é obrigatória')
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form schema with password complexity requirements
 */
export const registerSchema = z.object({
  company_name: z.string()
    .trim()
    .min(1, 'Nome da empresa é obrigatório')
    .max(255, 'Nome da empresa muito longo'),
  cnpj: z.string()
    .transform(v => v.replace(/[^\d]/g, ''))
    .refine(v => v.length === 14, 'CNPJ deve ter 14 dígitos'),
  user_name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

/**
 * Phone number schema (Brazilian format: 10 or 11 digits)
 */
export const phoneSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => {
    if (!v || v === '') return true; // Optional field
    return v.length >= 10 && v.length <= 11;
  }, {
    message: 'Telefone inválido (10 ou 11 dígitos)'
  })
  .optional()
  .or(z.literal(''));

/**
 * Email schema with strict validation
 */
export const emailSchema = z.string()
  .trim()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .optional()
  .or(z.literal(''));

/**
 * Required email schema
 */
export const requiredEmailSchema = z.string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo');

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

/**
 * CPF schema with check digit validation
 */
export const cpfSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => {
    if (!v || v === '') return true; // Optional field
    if (v.length !== 11) return false;
    if (/^(\d)\1+$/.test(v)) return false; // Reject repeated digits
    
    // CPF check digit algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(v[i]) * (10 - i);
    let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(v[9]) !== d1) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(v[i]) * (11 - i);
    let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(v[10]) === d2;
  }, { message: 'CPF inválido' })
  .optional()
  .or(z.literal(''));

/**
 * CNPJ schema with check digit validation
 */
export const cnpjSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => {
    if (!v || v === '') return true; // Optional field
    if (v.length !== 14) return false;
    if (/^(\d)\1+$/.test(v)) return false; // Reject repeated digits
    
    // CNPJ check digit algorithm
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(v[i]) * weights1[i];
    let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(v[12]) !== d1) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(v[i]) * weights2[i];
    let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(v[13]) === d2;
  }, { message: 'CNPJ inválido' })
  .optional()
  .or(z.literal(''));

/**
 * Required CNPJ schema
 */
export const requiredCnpjSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => v.length === 14, 'CNPJ deve ter 14 dígitos')
  .refine(v => {
    if (/^(\d)\1+$/.test(v)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(v[i]) * weights1[i];
    let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(v[12]) !== d1) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(v[i]) * weights2[i];
    let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(v[13]) === d2;
  }, { message: 'CNPJ inválido' });

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

/**
 * CEP schema (Brazilian postal code: 8 digits)
 */
export const cepSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => {
    if (!v || v === '') return true;
    return v.length === 8;
  }, { message: 'CEP deve ter 8 dígitos' })
  .optional()
  .or(z.literal(''));

// ============================================================================
// COMMON FIELD SCHEMAS
// ============================================================================

/**
 * Required name field
 */
export const requiredNameSchema = z.string()
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(255, 'Nome muito longo');

/**
 * Optional name field
 */
export const optionalNameSchema = z.string()
  .trim()
  .max(255, 'Nome muito longo')
  .optional()
  .or(z.literal(''));

/**
 * Date schema (ISO 8601: YYYY-MM-DD)
 */
export const dateSchema = z.string()
  .refine(v => {
    if (!v || v === '') return true;
    const date = new Date(v);
    return !isNaN(date.getTime());
  }, { message: 'Data inválida' })
  .optional()
  .or(z.literal(''));

/**
 * Required date schema
 */
export const requiredDateSchema = z.string()
  .min(1, 'Data é obrigatória')
  .refine(v => {
    const date = new Date(v);
    return !isNaN(date.getTime());
  }, { message: 'Data inválida' });

/**
 * URL schema
 */
export const urlSchema = z.string()
  .refine(v => {
    if (!v || v === '') return true;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, { message: 'URL inválida' })
  .optional()
  .or(z.literal(''));

/**
 * Positive number schema
 */
export const positiveNumberSchema = z.number()
  .min(0, 'Valor deve ser maior ou igual a zero')
  .optional();

/**
 * Notes/description schema with max length
 */
export const notesSchema = z.string()
  .trim()
  .max(5000, 'Texto muito longo (máximo 5000 caracteres)')
  .optional()
  .or(z.literal(''));
