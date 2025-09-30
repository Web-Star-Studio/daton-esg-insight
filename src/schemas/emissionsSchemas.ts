import { z } from 'zod';
import { requiredStringSchema, optionalStringSchema, positiveNumberSchema, dateSchema } from './commonSchemas';

// Schema para fonte de emissão
export const emissionSourceSchema = z.object({
  name: requiredStringSchema('Nome da fonte', 100),
  scope: z.enum(['Escopo 1', 'Escopo 2', 'Escopo 3'], {
    message: 'Escopo deve ser 1, 2 ou 3'
  }),
  category: requiredStringSchema('Categoria', 100),
  description: optionalStringSchema(500)
});

// Schema para dados de atividade de emissão
export const emissionActivitySchema = z.object({
  emission_source_id: z.string().uuid('ID da fonte de emissão inválido'),
  activity_date: dateSchema,
  quantity: positiveNumberSchema('Quantidade'),
  unit: requiredStringSchema('Unidade', 50),
  emission_factor: z.number().positive('Fator de emissão deve ser positivo').optional(),
  co2_emissions: z.number().positive('Emissões CO2 devem ser positivas').optional(),
  ch4_emissions: z.number().positive('Emissões CH4 devem ser positivas').optional(),
  n2o_emissions: z.number().positive('Emissões N2O devem ser positivas').optional(),
  notes: optionalStringSchema(1000)
});

// Schema para cálculo de emissões
export const emissionCalculationSchema = z.object({
  source_id: z.string().uuid('ID da fonte inválido'),
  period_start: dateSchema,
  period_end: dateSchema,
  total_co2e: positiveNumberSchema('Total CO2e'),
  methodology: requiredStringSchema('Metodologia', 100),
  calculation_details: z.record(z.string(), z.unknown()).optional()
}).refine(
  (data) => data.period_end >= data.period_start,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['period_end']
  }
);

// Schema para inventário de emissões
export const emissionInventorySchema = z.object({
  inventory_year: z.number().int().min(2000).max(2100),
  scope_1_total: z.number().positive('Total Escopo 1 deve ser positivo').optional(),
  scope_2_total: z.number().positive('Total Escopo 2 deve ser positivo').optional(),
  scope_3_total: z.number().positive('Total Escopo 3 deve ser positivo').optional(),
  total_emissions: positiveNumberSchema('Total de emissões'),
  status: z.enum(['draft', 'in_review', 'completed', 'published']),
  methodology_standard: requiredStringSchema('Padrão metodológico', 100),
  verification_status: z.enum(['not_verified', 'in_verification', 'verified']).optional()
});

// Tipos exportados
export type EmissionSourceInput = z.infer<typeof emissionSourceSchema>;
export type EmissionActivityInput = z.infer<typeof emissionActivitySchema>;
export type EmissionCalculationInput = z.infer<typeof emissionCalculationSchema>;
export type EmissionInventoryInput = z.infer<typeof emissionInventorySchema>;
