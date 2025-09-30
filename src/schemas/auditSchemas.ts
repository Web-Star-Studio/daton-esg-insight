import { z } from 'zod';
import { requiredStringSchema, optionalStringSchema, dateSchema, futureDateSchema } from './commonSchemas';

// Schema para auditoria
export const auditSchema = z.object({
  title: requiredStringSchema('Título da auditoria', 200),
  audit_type: z.enum(['interna', 'externa', 'certificacao', 'follow-up'], {
    message: 'Tipo de auditoria inválido'
  }),
  start_date: dateSchema,
  end_date: futureDateSchema.optional(),
  auditor: optionalStringSchema(100),
  scope: optionalStringSchema(1000),
  status: z.enum(['Planejada', 'Em Andamento', 'Concluída', 'Cancelada']).default('Planejada')
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['end_date']
  }
);

// Schema para finding (não conformidade/observação)
export const findingSchema = z.object({
  audit_id: z.string().uuid('ID da auditoria inválido'),
  finding_type: z.enum(['non_conformity', 'observation', 'opportunity'], {
    message: 'Tipo de finding inválido'
  }),
  severity: z.enum(['critical', 'major', 'minor', 'low']),
  title: requiredStringSchema('Título', 200),
  description: requiredStringSchema('Descrição', 2000),
  requirement_reference: optionalStringSchema(200),
  evidence: optionalStringSchema(1000),
  root_cause: optionalStringSchema(1000),
  corrective_action: optionalStringSchema(1000),
  responsible_user_id: z.string().uuid('ID do responsável inválido').optional(),
  due_date: futureDateSchema.optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'verified', 'closed']).default('open')
});

// Schema para plano de ação corretiva
export const correctiveActionSchema = z.object({
  finding_id: z.string().uuid('ID do finding inválido'),
  action_description: requiredStringSchema('Descrição da ação', 1000),
  responsible_user_id: z.string().uuid('ID do responsável inválido'),
  target_date: futureDateSchema,
  completion_date: dateSchema.optional(),
  effectiveness_verification: optionalStringSchema(1000),
  status: z.enum(['planned', 'in_progress', 'completed', 'verified']).default('planned')
});

// Schema para resultado de auditoria
export const auditResultSchema = z.object({
  audit_id: z.string().uuid('ID da auditoria inválido'),
  overall_rating: z.enum(['excellent', 'good', 'acceptable', 'needs_improvement', 'inadequate']),
  total_findings: z.number().int().min(0),
  critical_findings: z.number().int().min(0),
  major_findings: z.number().int().min(0),
  minor_findings: z.number().int().min(0),
  observations: z.number().int().min(0),
  summary: requiredStringSchema('Resumo', 2000),
  recommendations: optionalStringSchema(2000)
});

// Tipos exportados
export type AuditInput = z.infer<typeof auditSchema>;
export type FindingInput = z.infer<typeof findingSchema>;
export type CorrectiveActionInput = z.infer<typeof correctiveActionSchema>;
export type AuditResultInput = z.infer<typeof auditResultSchema>;
