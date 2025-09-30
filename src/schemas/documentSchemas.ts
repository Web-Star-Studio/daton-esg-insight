import { z } from 'zod';
import { requiredStringSchema, optionalStringSchema, dateSchema, futureDateSchema } from './commonSchemas';

// Schema para upload de documento
export const documentUploadSchema = z.object({
  file_name: requiredStringSchema('Nome do arquivo', 255),
  file_type: requiredStringSchema('Tipo do arquivo', 100),
  file_size: z.number().positive('Tamanho deve ser positivo').max(104857600, 'Arquivo deve ter no máximo 100MB'),
  related_model: z.enum(['emission_source', 'audit', 'compliance', 'training', 'process', 'general'], {
    message: 'Modelo relacionado inválido'
  }),
  related_id: z.string().uuid('ID relacionado inválido'),
  document_type: z.enum(['interno', 'externo', 'normativo', 'registro']).default('interno'),
  tags: z.array(z.string()).optional()
});

// Schema para documento controlado
export const controlledDocumentSchema = z.object({
  code: requiredStringSchema('Código do documento', 50),
  file_name: requiredStringSchema('Nome do arquivo', 255),
  document_type: z.enum(['interno', 'externo', 'normativo', 'registro']),
  controlled_copy: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
  approval_status: z.enum(['rascunho', 'em_aprovacao', 'aprovado', 'rejeitado', 'obsoleto']).default('rascunho'),
  effective_date: dateSchema.optional(),
  review_frequency: z.enum(['mensal', 'trimestral', 'semestral', 'anual', 'bienal']).default('anual'),
  next_review_date: futureDateSchema.optional(),
  responsible_department: optionalStringSchema(100),
  retention_period_days: z.number().int().positive('Período de retenção deve ser positivo').optional(),
  distribution_list: z.array(z.string().uuid()).optional()
});

// Schema para metadados extraídos por IA
export const documentAIMetadataSchema = z.object({
  document_id: z.string().uuid('ID do documento inválido'),
  ai_processing_status: z.enum(['pending', 'processing', 'completed', 'failed']),
  ai_extracted_category: optionalStringSchema(100),
  ai_confidence_score: z.number().min(0).max(1).optional(),
  extracted_data: z.record(z.string(), z.unknown()).optional(),
  processing_errors: z.array(z.string()).optional()
});

// Schema para pasta de documentos
export const documentFolderSchema = z.object({
  folder_name: requiredStringSchema('Nome da pasta', 200),
  parent_folder_id: z.string().uuid('ID da pasta pai inválido').optional(),
  description: optionalStringSchema(500),
  access_level: z.enum(['public', 'restricted', 'confidential']).default('restricted')
});

// Tipos exportados
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type ControlledDocumentInput = z.infer<typeof controlledDocumentSchema>;
export type DocumentAIMetadataInput = z.infer<typeof documentAIMetadataSchema>;
export type DocumentFolderInput = z.infer<typeof documentFolderSchema>;
