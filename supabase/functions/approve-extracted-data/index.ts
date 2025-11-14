import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Re-detecta a tabela correta com base nos campos extraídos
 * Serve como camada de segurança para corrigir classificações incorretas
 */
function intelligentTableDetection(extractedFields: any, declaredTable: string): string {
  const fieldNames = Object.keys(extractedFields).map(k => k.toLowerCase());
  const fieldContent = JSON.stringify(extractedFields).toLowerCase();
  
  // Detectar dados de resíduos com alta confiança
  if (
    fieldNames.some(f => f.includes('residuo') || f.includes('waste')) ||
    extractedFields.residuos_por_mes ||
    extractedFields.tipos_residuos_quantidades_kg
  ) {
    if (declaredTable !== 'waste_logs') {
      console.log('🔍 INTELLIGENT DETECTION: Correcting table from', declaredTable, '→ waste_logs');
    }
    return 'waste_logs';
  }
  
  // Detectar fornecedores com alta confiança
  if (extractedFields.cnpj && (extractedFields.nome || extractedFields.razao_social)) {
    if (declaredTable !== 'suppliers') {
      console.log('🔍 INTELLIGENT DETECTION: Correcting table from', declaredTable, '→ suppliers');
    }
    return 'suppliers';
  }
  
  // Manter tabela declarada se não detectar nada específico
  console.log('🔍 INTELLIGENT DETECTION: Keeping declared table', declaredTable);
  return declaredTable;
}

interface ApprovalRequest {
  preview_id: string;
  edited_data?: Record<string, any>;
  approval_notes?: string;
}

interface WasteLogInsert {
  company_id: string;
  mtr_number: string;
  waste_description: string;
  waste_class: 'I' | 'II-A' | 'II-B';
  collection_date: string;
  quantity: number;
  unit: string;
  destination_name?: string | null;
  cost?: number | null;
  status: string;
}

interface SupplierInsert {
  company_id: string;
  name: string;
  cnpj?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  supplier_type?: string | null;
  status: string;
}

const monthMap: Record<string, number> = {
  'JAN': 1, 'JANEIRO': 1,
  'FEV': 2, 'FEVEREIRO': 2,
  'MAR': 3, 'MARÇO': 3, 'MARCO': 3,
  'ABR': 4, 'ABRIL': 4,
  'MAI': 5, 'MAIO': 5,
  'JUN': 6, 'JUNHO': 6,
  'JUL': 7, 'JULHO': 7,
  'AGO': 8, 'AGOSTO': 8,
  'SET': 9, 'SETEMBRO': 9,
  'OUT': 10, 'OUTUBRO': 10,
  'NOV': 11, 'NOVEMBRO': 11,
  'DEZ': 12, 'DEZEMBRO': 12
};

function classifyWaste(description: string): 'I' | 'II-A' | 'II-B' {
  const lowerDesc = (description || '').toLowerCase();
  
  const dangerous = ['perigoso', 'óleo', 'contaminado', 'químico', 'tóxico', 'inflamável'];
  const recyclable = ['papel', 'plástico', 'metal', 'sucata', 'vidro', 'alumínio', 'papelão'];
  
  if (dangerous.some(word => lowerDesc.includes(word))) return 'I';
  if (recyclable.some(word => lowerDesc.includes(word))) return 'II-A';
  return 'II-B';
}

function transformWasteData(extractedFields: any, companyId: string): WasteLogInsert[] {
  console.log('🔄 Transforming waste data:', JSON.stringify(extractedFields).substring(0, 500));
  
  const records: WasteLogInsert[] = [];
  const residuosPorMes = extractedFields.residuos_por_mes || {};
  const year = extractedFields.data_start?.substring(0, 4) || new Date().getFullYear().toString();
  
  for (const [month, items] of Object.entries(residuosPorMes)) {
    if (!Array.isArray(items)) continue;
    
    const monthUpper = month.toUpperCase();
    const monthNum = monthMap[monthUpper] || 1;
    
    for (const item of items) {
      const collectionDate = `${year}-${String(monthNum).padStart(2, '0')}-15`;
      
      // Generate unique MTR
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const mtrNumber = `MTR-${year}${String(monthNum).padStart(2, '0')}-${random}`;
      
      records.push({
        company_id: companyId,
        mtr_number: mtrNumber,
        waste_description: item.tipo_residuo || 'Não especificado',
        waste_class: classifyWaste(item.tipo_residuo),
        collection_date: collectionDate,
        quantity: parseFloat(item.quantidade) || 0,
        unit: (item.unidade_medida || 'KG').toUpperCase(),
        destination_name: item.receptor || item.destinacao || null,
        cost: parseFloat(item.pago) || parseFloat(item.valor_receber) || null,
        status: 'ativo'
      });
    }
  }
  
  console.log(`✅ Transformed ${records.length} waste records`);
  return records;
}

function transformSupplierData(extractedFields: any, companyId: string): SupplierInsert[] {
  console.log('🔄 Transforming supplier data');
  
  const records: SupplierInsert[] = [];
  
  // Handle single supplier
  if (extractedFields.nome || extractedFields.razao_social) {
    records.push({
      company_id: companyId,
      name: extractedFields.nome || extractedFields.razao_social || 'Fornecedor',
      cnpj: extractedFields.cnpj || null,
      contact_person: extractedFields.contato || null,
      email: extractedFields.email || null,
      phone: extractedFields.telefone || extractedFields.phone || null,
      address: extractedFields.endereco || extractedFields.address || null,
      supplier_type: extractedFields.tipo || 'geral',
      status: 'ativo'
    });
  }
  
  // Handle array of suppliers
  if (Array.isArray(extractedFields.fornecedores)) {
    for (const supplier of extractedFields.fornecedores) {
      records.push({
        company_id: companyId,
        name: supplier.nome || supplier.razao_social || 'Fornecedor',
        cnpj: supplier.cnpj || null,
        contact_person: supplier.contato || null,
        email: supplier.email || null,
        phone: supplier.telefone || null,
        address: supplier.endereco || null,
        supplier_type: supplier.tipo || 'geral',
        status: 'ativo'
      });
    }
  }
  
  console.log(`✅ Transformed ${records.length} supplier records`);
  return records;
}

function validateWasteRecord(record: WasteLogInsert): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.mtr_number) errors.push('MTR obrigatório');
  if (!record.waste_description) errors.push('Descrição do resíduo obrigatória');
  if (!record.collection_date) errors.push('Data de coleta obrigatória');
  if (!record.quantity || record.quantity <= 0) errors.push('Quantidade inválida');
  if (!record.unit) errors.push('Unidade obrigatória');
  
  return { valid: errors.length === 0, errors };
}

function validateSupplierRecord(record: SupplierInsert): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.name) errors.push('Nome do fornecedor obrigatório');
  
  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('=== 🚀 APPROVAL PROCESS START ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    console.log('✅ Company found:', profile.company_id);

    // Parse request
    const { preview_id, edited_data, approval_notes }: ApprovalRequest = await req.json();
    
    if (!preview_id) {
      throw new Error('preview_id é obrigatório');
    }

    console.log('📋 Preview ID:', preview_id);
    console.log('✏️ Has edited data:', !!edited_data);

    // Get preview data
    const { data: preview, error: previewError } = await supabase
      .from('extracted_data_preview')
      .select(`
        *,
        extraction_job:document_extraction_jobs(
          id,
          document_id,
          documents(id, file_name)
        )
      `)
      .eq('id', preview_id)
      .single();

    if (previewError || !preview) {
      console.error('❌ Preview not found:', previewError);
      throw new Error('Preview não encontrado');
    }

    console.log('✅ Preview loaded:', {
      target_table: preview.target_table,
      validation_status: preview.validation_status
    });

    // Use edited data if provided, otherwise use original
    const finalData = edited_data || preview.extracted_fields;

    // 🔍 INTELLIGENT TABLE DETECTION
    // Re-check the target table based on actual extracted fields
    const declaredTable = preview.target_table;
    const targetTable = intelligentTableDetection(finalData, declaredTable);

    if (targetTable !== declaredTable) {
      console.log(`⚠️ TABLE MISMATCH DETECTED: "${declaredTable}" → "${targetTable}"`);
      console.log('📊 Extracted fields sample:', JSON.stringify(finalData).substring(0, 300));
    }

    // Transform and validate data based on target table
    let recordsToInsert: any[] = [];
    let validationErrors: string[] = [];

    if (targetTable === 'waste_logs') {
      recordsToInsert = transformWasteData(finalData, profile.company_id);
      
      // Validate each record
      for (const record of recordsToInsert) {
        const validation = validateWasteRecord(record);
        if (!validation.valid) {
          validationErrors.push(...validation.errors);
        }
      }
    } else if (targetTable === 'suppliers') {
      recordsToInsert = transformSupplierData(finalData, profile.company_id);
      
      // Validate each record
      for (const record of recordsToInsert) {
        const validation = validateSupplierRecord(record);
        if (!validation.valid) {
          validationErrors.push(...validation.errors);
        }
      }
    } else {
      throw new Error(`Tabela alvo não suportada: ${targetTable}`);
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors);
      throw new Error(`Erros de validação: ${validationErrors.join(', ')}`);
    }

    console.log(`📊 Records to insert: ${recordsToInsert.length}`);
    if (recordsToInsert.length > 0) {
      console.log('📄 Sample record:', JSON.stringify(recordsToInsert[0]));
    } else {
      console.warn('⚠️ NO RECORDS GENERATED');
      console.warn('📋 Target table:', targetTable);
      console.warn('📄 Extracted fields:', JSON.stringify(finalData).substring(0, 500));
      console.warn('🔍 Available field keys:', Object.keys(finalData));
      
      // Sugestões de correção
      if (targetTable === 'suppliers' && finalData.residuos_por_mes) {
        console.error('❌ CRITICAL: Supplier table selected but data contains waste information!');
        console.error('💡 SUGGESTION: This preview should target "waste_logs" instead');
      }
    }

    // Check for duplicates (only for waste_logs with MTR)
    if (targetTable === 'waste_logs' && recordsToInsert.length > 0) {
      const mtrNumbers = recordsToInsert.map((r: any) => r.mtr_number);
      const { data: existingMTRs } = await supabase
        .from('waste_logs')
        .select('mtr_number')
        .in('mtr_number', mtrNumbers);

      if (existingMTRs && existingMTRs.length > 0) {
        const existingSet = new Set(existingMTRs.map(e => e.mtr_number));
        recordsToInsert = recordsToInsert.filter((r: any) => !existingSet.has(r.mtr_number));
        console.log(`⚠️ Filtered ${existingMTRs.length} duplicate MTRs`);
      }
    }

    let insertedCount = 0;

    // Insert records
    if (recordsToInsert.length > 0) {
      const { data: insertResult, error: insertError } = await supabase
        .from(targetTable)
        .insert(recordsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw new Error(`Falha ao inserir dados: ${insertError.message}`);
      }

      insertedCount = insertResult?.length || 0;
      console.log(`✅ Successfully inserted ${insertedCount} records into ${targetTable}`);
    } else {
      console.log('⚠️ No new records to insert (all duplicates or empty)');
    }

    // Update preview status
    const { error: updateError } = await supabase
      .from('extracted_data_preview')
      .update({ validation_status: 'Aprovado' })
      .eq('id', preview_id);

    if (updateError) {
      console.error('⚠️ Failed to update preview status:', updateError);
    } else {
      console.log('✅ Preview status updated to Aprovado');
    }

    // Count edited fields
    const editedFields: Array<{ field: string; old_value: string; new_value: string }> = [];
    if (edited_data) {
      Object.keys(edited_data).forEach(field => {
        const oldValue = preview.extracted_fields[field];
        const newValue = edited_data[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          editedFields.push({
            field,
            old_value: JSON.stringify(oldValue),
            new_value: JSON.stringify(newValue)
          });
        }
      });
    }

    // Create approval audit log
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    const { error: auditError } = await supabase
      .from('data_approval_audit')
      .insert({
        company_id: profile.company_id,
        preview_id: preview_id,
        document_id: preview.extraction_job?.document_id,
        approved_by_user_id: user.id,
        action: editedFields.length > 0 ? 'edited' : 'approved',
        original_data: preview.extracted_fields,
        edited_data: edited_data || null,
        confidence_scores: preview.confidence_scores || {},
        target_table: targetTable,
        records_affected: insertedCount,
        approval_notes: approval_notes,
        processing_time_seconds: processingTime
      });

    if (auditError) {
      console.error('⚠️ Failed to create audit log:', auditError);
    } else {
      console.log('✅ Audit log created');
    }

    const response = {
      success: true,
      records_inserted: insertedCount,
      target_table: targetTable,
      processing_time_seconds: processingTime,
      edited_fields_count: editedFields.length
    };

    console.log('=== ✅ APPROVAL PROCESS COMPLETE ===');
    console.log('Response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== ❌ APPROVAL PROCESS FAILED ===');
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
