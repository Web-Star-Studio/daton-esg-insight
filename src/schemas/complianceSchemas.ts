import { z } from 'zod';
import { requiredStringSchema, optionalStringSchema, dateSchema, futureDateSchema, urlSchema } from './commonSchemas';

// Schema para requisito regulatório
export const regulatoryRequirementSchema = z.object({
  title: requiredStringSchema('Título do requisito', 300),
  reference_code: requiredStringSchema('Código de referência', 100),
  jurisdiction: z.enum(['Federal', 'Estadual', 'Municipal'], {
    message: 'Jurisdição inválida'
  }),
  summary: requiredStringSchema('Resumo', 1000),
  source_url: urlSchema.optional(),
  effective_date: dateSchema.optional(),
  category: z.enum(['environmental', 'safety', 'quality', 'labor', 'other']).optional(),
  compliance_priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium')
});

// Schema para tarefa de compliance
export const complianceTaskSchema = z.object({
  requirement_id: z.string().uuid('ID do requisito inválido').optional(),
  title: requiredStringSchema('Título da tarefa', 200),
  description: optionalStringSchema(1000),
  assigned_to_user_id: z.string().uuid('ID do responsável inválido').optional(),
  due_date: futureDateSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).default('pending'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']).default('once')
});

// Schema para evidência de compliance
export const complianceEvidenceSchema = z.object({
  task_id: z.string().uuid('ID da tarefa inválido'),
  evidence_type: z.enum(['document', 'report', 'certification', 'inspection', 'training', 'other']),
  description: requiredStringSchema('Descrição', 500),
  document_id: z.string().uuid('ID do documento inválido').optional(),
  evidence_date: dateSchema,
  verified_by_user_id: z.string().uuid('ID do verificador inválido').optional(),
  verification_date: dateSchema.optional(),
  is_valid: z.boolean().default(true),
  expiry_date: futureDateSchema.optional()
});

// Schema para licença ambiental
export const environmentalLicenseSchema = z.object({
  license_number: requiredStringSchema('Número da licença', 100),
  license_type: z.enum(['LP', 'LI', 'LO', 'LAU', 'LAS', 'Outras'], {
    message: 'Tipo de licença inválido'
  }),
  issuing_authority: requiredStringSchema('Órgão emissor', 200),
  issue_date: dateSchema,
  expiry_date: futureDateSchema,
  status: z.enum(['active', 'expired', 'suspended', 'cancelled', 'in_renewal']).default('active'),
  scope: optionalStringSchema(1000),
  conditions: optionalStringSchema(2000),
  renewal_reminder_days: z.number().int().positive().default(90)
}).refine(
  (data) => data.expiry_date > data.issue_date,
  {
    message: 'Data de validade deve ser posterior à data de emissão',
    path: ['expiry_date']
  }
);

// Schema para relatório de compliance
export const complianceReportSchema = z.object({
  report_title: requiredStringSchema('Título do relatório', 200),
  reporting_period_start: dateSchema,
  reporting_period_end: dateSchema,
  compliance_rate: z.number().min(0).max(100),
  total_requirements: z.number().int().min(0),
  compliant_requirements: z.number().int().min(0),
  non_compliant_requirements: z.number().int().min(0),
  in_progress_requirements: z.number().int().min(0),
  summary: requiredStringSchema('Resumo', 2000),
  recommendations: optionalStringSchema(2000)
}).refine(
  (data) => data.reporting_period_end >= data.reporting_period_start,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['reporting_period_end']
  }
);

// Tipos exportados
export type RegulatoryRequirementInput = z.infer<typeof regulatoryRequirementSchema>;
export type ComplianceTaskInput = z.infer<typeof complianceTaskSchema>;
export type ComplianceEvidenceInput = z.infer<typeof complianceEvidenceSchema>;
export type EnvironmentalLicenseInput = z.infer<typeof environmentalLicenseSchema>;
export type ComplianceReportInput = z.infer<typeof complianceReportSchema>;
