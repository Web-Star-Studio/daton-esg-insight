/**
 * Parameter Normalizer Utility
 * Handles inconsistencies between camelCase and snake_case parameters
 * across edge functions for better interoperability
 */

export interface NormalizedDocumentParams {
  filePath: string;
  fileType: string;
  documentId?: string;
  companyId?: string;
  useVision?: boolean;
  useCache?: boolean;
}

export interface NormalizedProcessingParams {
  documentId: string;
  companyId?: string;
  mode?: string;
  parsedContent?: string;
  skipParse?: boolean;
  autoInsertThreshold?: number;
}

/**
 * Normalizes document-related parameters from any case format to camelCase
 */
export function normalizeDocumentParams(input: any): NormalizedDocumentParams {
  return {
    filePath: input.filePath || input.file_path,
    fileType: input.fileType || input.file_type,
    documentId: input.documentId || input.document_id,
    companyId: input.companyId || input.company_id,
    useVision: input.useVision ?? input.use_vision ?? false,
    useCache: input.useCache ?? input.use_cache ?? true,
  };
}

/**
 * Normalizes processing-related parameters
 */
export function normalizeProcessingParams(input: any): NormalizedProcessingParams {
  return {
    documentId: input.documentId || input.document_id,
    companyId: input.companyId || input.company_id,
    mode: input.mode || 'exploratory',
    parsedContent: input.parsedContent || input.parsed_content,
    skipParse: input.skipParse ?? input.skip_parse ?? false,
    autoInsertThreshold: input.autoInsertThreshold ?? input.auto_insert_threshold ?? 0.8,
  };
}

/**
 * Validates required parameters and returns missing fields
 */
export function validateRequiredParams(
  params: Record<string, any>,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(param => 
    params[param] === undefined || params[param] === null || params[param] === ''
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Creates a standardized error response for missing parameters
 */
export function createMissingParamsError(missing: string[], received: string[]): {
  success: false;
  error: string;
  details: {
    missing_params: string[];
    received_params: string[];
    hint: string;
  };
} {
  return {
    success: false,
    error: `Missing required parameters: ${missing.join(', ')}`,
    details: {
      missing_params: missing,
      received_params: received,
      hint: 'Check API documentation for correct parameter names and formats'
    }
  };
}
