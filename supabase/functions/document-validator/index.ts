import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  overallQuality: number;
  validFields: string[];
  invalidFields: Array<{ field: string; reason: string }>;
  suggestions: string[];
  confidence: number;
  enrichedData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedData, documentType, companyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate and enrich data
    const validationResult = await validateAndEnrichData(
      extractedData,
      documentType,
      companyId,
      supabaseClient
    );

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validateAndEnrichData(
  extractedData: any,
  documentType: string,
  companyId: string,
  supabaseClient: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    overallQuality: 0,
    validFields: [],
    invalidFields: [],
    suggestions: [],
    confidence: 0,
    enrichedData: { ...extractedData }
  };

  const records = extractedData.structured_data?.records || [extractedData.structured_data];

  for (const record of records) {
    if (!record) continue;

    // Validate based on document type
    switch (documentType) {
      case 'emissions_spreadsheet':
      case 'emissions_report':
        validateEmissionsRecord(record, result);
        await enrichEmissionsRecord(record, companyId, supabaseClient, result);
        break;
      
      case 'waste_invoice':
        validateWasteRecord(record, result);
        await enrichWasteRecord(record, companyId, supabaseClient, result);
        break;
      
      case 'employee_spreadsheet':
        validateEmployeeRecord(record, result);
        break;
      
      case 'goals_spreadsheet':
        validateGoalRecord(record, result);
        break;
      
      case 'environmental_license':
        validateLicenseRecord(record, result);
        break;
    }
  }

  // Calculate overall quality
  const totalFields = result.validFields.length + result.invalidFields.length;
  result.overallQuality = totalFields > 0 ? (result.validFields.length / totalFields) * 100 : 0;
  
  // Calculate confidence based on quality and completeness
  result.confidence = Math.min(result.overallQuality, 95);

  return result;
}

function validateEmissionsRecord(record: any, result: ValidationResult) {
  // Required fields
  if (record.source_name && typeof record.source_name === 'string') {
    result.validFields.push('source_name');
  } else {
    result.invalidFields.push({ field: 'source_name', reason: 'Nome da fonte é obrigatório' });
  }

  if ([1, 2, 3].includes(record.scope)) {
    result.validFields.push('scope');
  } else {
    result.invalidFields.push({ field: 'scope', reason: 'Escopo deve ser 1, 2 ou 3' });
  }

  if (typeof record.quantity === 'number' && record.quantity >= 0) {
    result.validFields.push('quantity');
  } else {
    result.invalidFields.push({ field: 'quantity', reason: 'Quantidade deve ser numérica e positiva' });
  }

  // Optional but important fields
  if (record.unit) {
    result.validFields.push('unit');
  } else {
    result.suggestions.push('Adicionar unidade de medida para melhor rastreamento');
  }

  if (record.total_co2e !== undefined) {
    if (typeof record.total_co2e === 'number' && record.total_co2e >= 0) {
      result.validFields.push('total_co2e');
    } else {
      result.invalidFields.push({ field: 'total_co2e', reason: 'Emissões devem ser numéricas e positivas' });
    }
  }

  // Date validation
  if (record.period_start) {
    if (isValidDate(record.period_start)) {
      result.validFields.push('period_start');
    } else {
      result.invalidFields.push({ field: 'period_start', reason: 'Data de início inválida' });
    }
  }

  if (record.period_end) {
    if (isValidDate(record.period_end)) {
      result.validFields.push('period_end');
      
      // Check if end is after start
      if (record.period_start && new Date(record.period_end) < new Date(record.period_start)) {
        result.invalidFields.push({ field: 'period_end', reason: 'Data fim deve ser posterior à data início' });
      }
    } else {
      result.invalidFields.push({ field: 'period_end', reason: 'Data de fim inválida' });
    }
  }
}

async function enrichEmissionsRecord(
  record: any,
  companyId: string,
  supabaseClient: any,
  result: ValidationResult
) {
  // Try to find matching emission source
  if (record.source_name) {
    const { data: existingSources } = await supabaseClient
      .from('emission_sources')
      .select('id, source_name, scope, category')
      .eq('company_id', companyId)
      .ilike('source_name', `%${record.source_name}%`)
      .limit(1);

    if (existingSources && existingSources.length > 0) {
      record.existing_source_id = existingSources[0].id;
      result.suggestions.push(`Fonte similar encontrada: "${existingSources[0].source_name}" - considere atualizar em vez de criar nova`);
    }
  }

  // Suggest category based on scope and name
  if (!record.category) {
    if (record.scope === 1) {
      if (record.source_name?.toLowerCase().includes('diesel') || 
          record.source_name?.toLowerCase().includes('gasolina')) {
        record.category = 'Combustão Móvel';
      } else if (record.source_name?.toLowerCase().includes('gerador')) {
        record.category = 'Combustão Estacionária';
      }
    } else if (record.scope === 2) {
      record.category = 'Energia Elétrica';
    }

    if (record.category) {
      result.suggestions.push(`Categoria sugerida: ${record.category}`);
    }
  }
}

function validateWasteRecord(record: any, result: ValidationResult) {
  if (record.waste_type) {
    result.validFields.push('waste_type');
  } else {
    result.invalidFields.push({ field: 'waste_type', reason: 'Tipo de resíduo é obrigatório' });
  }

  if (typeof record.quantity === 'number' && record.quantity > 0) {
    result.validFields.push('quantity');
  } else {
    result.invalidFields.push({ field: 'quantity', reason: 'Quantidade deve ser positiva' });
  }

  if (record.unit) {
    result.validFields.push('unit');
  }

  if (record.disposal_method) {
    result.validFields.push('disposal_method');
  } else {
    result.suggestions.push('Adicionar método de destinação para compliance');
  }
}

async function enrichWasteRecord(
  record: any,
  companyId: string,
  supabaseClient: any,
  result: ValidationResult
) {
  // Classify waste if not already classified
  if (!record.waste_class) {
    const recyclableTypes = ['plástico', 'papel', 'metal', 'vidro'];
    const wasteTypeLower = (record.waste_type || '').toLowerCase();
    
    if (recyclableTypes.some(type => wasteTypeLower.includes(type))) {
      record.waste_class = 'IIA';
      record.is_recyclable = true;
      result.suggestions.push('Resíduo classificado como Classe IIA (Não Inerte) - reciclável');
    }
  }
}

function validateEmployeeRecord(record: any, result: ValidationResult) {
  if (record.full_name && record.full_name.trim().length > 2) {
    result.validFields.push('full_name');
  } else {
    result.invalidFields.push({ field: 'full_name', reason: 'Nome completo é obrigatório' });
  }

  if (record.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    result.validFields.push('email');
  } else if (record.email) {
    result.invalidFields.push({ field: 'email', reason: 'Email inválido' });
  }

  if (record.cpf) {
    const cpfClean = record.cpf.replace(/\D/g, '');
    if (cpfClean.length === 11) {
      result.validFields.push('cpf');
    } else {
      result.invalidFields.push({ field: 'cpf', reason: 'CPF deve ter 11 dígitos' });
    }
  }

  if (record.birth_date && isValidDate(record.birth_date)) {
    result.validFields.push('birth_date');
  }

  if (record.hire_date && isValidDate(record.hire_date)) {
    result.validFields.push('hire_date');
  }
}

function validateGoalRecord(record: any, result: ValidationResult) {
  if (record.goal_name) {
    result.validFields.push('goal_name');
  } else {
    result.invalidFields.push({ field: 'goal_name', reason: 'Nome da meta é obrigatório' });
  }

  if (record.category) {
    result.validFields.push('category');
  }

  if (typeof record.target_value === 'number') {
    result.validFields.push('target_value');
  } else {
    result.invalidFields.push({ field: 'target_value', reason: 'Valor alvo é obrigatório' });
  }

  if (record.target_date && isValidDate(record.target_date)) {
    result.validFields.push('target_date');
    
    // Check if target date is in the future
    if (new Date(record.target_date) < new Date()) {
      result.suggestions.push('Data alvo está no passado - considere revisar');
    }
  }

  if (typeof record.baseline_value === 'number') {
    result.validFields.push('baseline_value');
  }
}

function validateLicenseRecord(record: any, result: ValidationResult) {
  if (record.license_number) {
    result.validFields.push('license_number');
  } else {
    result.invalidFields.push({ field: 'license_number', reason: 'Número da licença é obrigatório' });
  }

  if (record.license_type) {
    result.validFields.push('license_type');
  }

  if (record.expiry_date && isValidDate(record.expiry_date)) {
    result.validFields.push('expiry_date');
    
    const daysUntilExpiry = Math.floor(
      (new Date(record.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      result.suggestions.push('⚠️ URGENTE: Licença vencida - renovar imediatamente');
    } else if (daysUntilExpiry < 90) {
      result.suggestions.push(`⚠️ Licença vence em ${daysUntilExpiry} dias - iniciar processo de renovação`);
    }
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
