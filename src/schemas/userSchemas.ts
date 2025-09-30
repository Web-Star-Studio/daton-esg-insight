import { z } from 'zod';
import { emailSchema, phoneSchema, requiredStringSchema, optionalStringSchema } from './commonSchemas';

// Schema para perfil de usuário
export const userProfileSchema = z.object({
  full_name: requiredStringSchema('Nome completo', 200),
  email: emailSchema,
  phone: phoneSchema.optional(),
  department: optionalStringSchema(100),
  position: optionalStringSchema(100),
  role: z.enum(['admin', 'manager', 'user', 'auditor', 'viewer']).default('user'),
  is_active: z.boolean().default(true)
});

// Schema para atualização de perfil
export const updateProfileSchema = z.object({
  full_name: requiredStringSchema('Nome completo', 200).optional(),
  phone: phoneSchema.optional(),
  department: optionalStringSchema(100).optional(),
  position: optionalStringSchema(100).optional(),
  avatar_url: z.string().url('URL do avatar inválida').optional()
});

// Schema para configurações de usuário
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  notifications_enabled: z.boolean().default(true),
  email_notifications: z.boolean().default(true),
  dashboard_layout: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
  default_view: z.enum(['dashboard', 'inventory', 'analytics']).default('dashboard')
});

// Schema para convite de usuário
export const userInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'user', 'auditor', 'viewer']),
  department: optionalStringSchema(100),
  message: optionalStringSchema(500)
});

// Schema para autenticação
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
});

export const registerSchema = z.object({
  full_name: requiredStringSchema('Nome completo', 200),
  email: emailSchema,
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirm_password: z.string()
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'As senhas não coincidem',
    path: ['confirm_password']
  }
);

// Tipos exportados
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type UserInviteInput = z.infer<typeof userInviteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
