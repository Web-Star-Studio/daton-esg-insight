/**
 * Password Validation Utilities
 * 
 * Implements strong password policies for security compliance.
 * Minimum requirements: 8 characters, uppercase, lowercase, number, special char.
 */

import { z } from 'zod';

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

/**
 * Zod schema for password validation with detailed error messages
 */
export const passwordSchema = z.string()
  .min(
    PASSWORD_REQUIREMENTS.minLength, 
    `Senha deve ter no mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`
  )
  .regex(
    /[A-Z]/, 
    'Senha deve conter pelo menos uma letra maiúscula'
  )
  .regex(
    /[a-z]/, 
    'Senha deve conter pelo menos uma letra minúscula'
  )
  .regex(
    /[0-9]/, 
    'Senha deve conter pelo menos um número'
  )
  .regex(
    /[^A-Za-z0-9]/, 
    'Senha deve conter pelo menos um caractere especial (!@#$%^&*)'
  );

/**
 * Validates a password and returns detailed result
 * 
 * @param password - Password string to validate
 * @returns Object with validity flag and array of error messages
 */
export const validatePassword = (password: string): { 
  valid: boolean; 
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const result = passwordSchema.safeParse(password);
  
  // Calculate password strength
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^A-Za-z0-9]/.test(password)) strengthScore++;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 4) strength = 'medium';
  if (strengthScore >= 6) strength = 'strong';
  
  if (result.success) {
    return { valid: true, errors: [], strength };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(e => e.message),
    strength,
  };
};

/**
 * Individual requirement check results for UI feedback
 */
export interface PasswordRequirementCheck {
  label: string;
  met: boolean;
}

/**
 * Get individual requirement checks for password strength indicator UI
 * 
 * @param password - Password string to check
 * @returns Array of requirement checks with labels and status
 */
export const getPasswordRequirementChecks = (password: string): PasswordRequirementCheck[] => {
  return [
    {
      label: `Mínimo ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
      met: password.length >= PASSWORD_REQUIREMENTS.minLength,
    },
    {
      label: 'Uma letra maiúscula',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Uma letra minúscula',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Um número',
      met: /[0-9]/.test(password),
    },
    {
      label: 'Um caractere especial (!@#$%^&*)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
};

/**
 * Validates password confirmation match
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Whether passwords match
 */
export const validatePasswordMatch = (
  password: string, 
  confirmPassword: string
): boolean => {
  return password === confirmPassword && password.length > 0;
};
