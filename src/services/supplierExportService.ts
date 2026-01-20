import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import type {
  DocumentComplianceIndicator,
  DocumentComplianceEvolution,
  SupplierDocumentCompliance,
  PerformanceIndicator,
  PerformanceEvolution,
  SupplierPerformanceRanking,
  PortalParticipationIndicator,
  SupplierParticipation
} from './supplierIndicatorsService';

// Export Document Compliance Report
export function exportDocumentComplianceReport(
  indicators: DocumentComplianceIndicator,
  evolution: DocumentComplianceEvolution[],
  bySupplier: SupplierDocumentCompliance[],
  period: string,
  format: 'excel' | 'csv' = 'excel'
) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['Relatório de Conformidade Documental [AVA1]'],
    ['Período:', period],
    [''],
    ['Resumo Geral'],
    ['Total Avaliados', indicators.totalEvaluated],
    ['Conformes', indicators.compliant],
    ['Não Conformes', indicators.nonCompliant],
    ['Taxa de Conformidade', `${indicators.complianceRate.toFixed(1)}%`]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  const evolutionHeaders = ['Mês', 'Conformes', 'Não Conformes', 'Taxa (%)'];
  const evolutionRows = evolution.map(e => [e.month, e.compliant, e.nonCompliant, e.rate.toFixed(1)]);
  const wsEvolution = XLSX.utils.aoa_to_sheet([evolutionHeaders, ...evolutionRows]);
  XLSX.utils.book_append_sheet(wb, wsEvolution, 'Evolução');

  const supplierHeaders = ['Fornecedor', 'Total Documentos', 'Conformes', 'Taxa (%)'];
  const supplierRows = bySupplier.map(s => [s.supplierName, s.totalDocuments, s.compliantDocuments, s.complianceRate.toFixed(1)]);
  const wsSuppliers = XLSX.utils.aoa_to_sheet([supplierHeaders, ...supplierRows]);
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Por Fornecedor');

  const fileName = `conformidade_documental_${period.replace(/\//g, '-')}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), fileName);
}

// Export Performance Report
export function exportPerformanceReport(
  indicators: PerformanceIndicator,
  evolution: PerformanceEvolution[],
  topSuppliers: SupplierPerformanceRanking[],
  lowSuppliers: SupplierPerformanceRanking[],
  period: string,
  format: 'excel' | 'csv' = 'excel'
) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['Relatório de Conformidade de Fornecimento [AVA2]'],
    ['Período:', period],
    [''],
    ['Resumo Geral'],
    ['Total Avaliados', indicators.totalEvaluated],
    ['Nota Média Geral', indicators.averageScore.toFixed(2)],
    ['Nota Qualidade', indicators.qualityScore.toFixed(2)],
    ['Nota Entrega', indicators.deliveryScore.toFixed(2)],
    ['Nota Preço', indicators.priceScore.toFixed(2)]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  const evolutionHeaders = ['Mês', 'Média Geral', 'Qualidade', 'Entrega', 'Preço'];
  const evolutionRows = evolution.map(e => [e.month, e.averageScore.toFixed(2), e.qualityScore.toFixed(2), e.deliveryScore.toFixed(2), e.priceScore.toFixed(2)]);
  const wsEvolution = XLSX.utils.aoa_to_sheet([evolutionHeaders, ...evolutionRows]);
  XLSX.utils.book_append_sheet(wb, wsEvolution, 'Evolução');

  const topHeaders = ['Posição', 'Fornecedor', 'Nota Média', 'Avaliações'];
  const topRows = topSuppliers.map((s, i) => [i + 1, s.supplierName, s.averageScore.toFixed(2), s.evaluationCount]);
  const wsTop = XLSX.utils.aoa_to_sheet([topHeaders, ...topRows]);
  XLSX.utils.book_append_sheet(wb, wsTop, 'Top Fornecedores');

  const fileName = `conformidade_fornecimento_${period.replace(/\//g, '-')}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), fileName);
}

// Export Portal Participation Report
export function exportPortalParticipationReport(
  indicators: PortalParticipationIndicator,
  bySupplier: SupplierParticipation[],
  period: string,
  format: 'excel' | 'csv' = 'excel'
) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['Relatório de Participação no Portal [EXT1]'],
    ['Período:', period],
    [''],
    ['Treinamentos'],
    ['Total Enviados', indicators.trainings.total],
    ['Concluídos', indicators.trainings.completed],
    ['Taxa de Conclusão', `${indicators.trainings.rate.toFixed(1)}%`],
    [''],
    ['Leituras Obrigatórias'],
    ['Total Enviadas', indicators.readings.total],
    ['Confirmadas', indicators.readings.confirmed],
    ['Taxa de Confirmação', `${indicators.readings.rate.toFixed(1)}%`],
    [''],
    ['Pesquisas'],
    ['Total Enviadas', indicators.surveys.total],
    ['Respondidas', indicators.surveys.responded],
    ['Taxa de Resposta', `${indicators.surveys.rate.toFixed(1)}%`]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  const fileName = `participacao_portal_${period.replace(/\//g, '-')}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), fileName);
}

// Export Suppliers List
export async function exportSuppliersList(companyId: string, format: 'excel' | 'csv' = 'excel') {
  const { data: suppliers, error } = await (supabase
    .from('managed_suppliers' as any)
    .select('*')
    .eq('company_id', companyId) as any);

  if (error || !suppliers?.length) {
    throw new Error('Nenhum fornecedor encontrado');
  }

  const headers = ['CNPJ/CPF', 'Tipo', 'Razão Social', 'Nome Fantasia', 'Responsável', 'Telefone', 'Email', 'Status'];
  const rows = suppliers.map((s: any) => [
    s.document_number || '',
    s.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
    s.corporate_name || '',
    s.trade_name || '',
    s.contact_name || '',
    s.contact_phone || '',
    s.contact_email || '',
    s.status || 'ativo'
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');

  const fileName = `fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), fileName);
}

// Import Template Download
export function downloadSupplierImportTemplate() {
  const headers = [
    'CNPJ/CPF *', 
    'Tipo (PF/PJ) *', 
    'Razão Social/Nome *', 
    'Nome Fantasia', 
    'Responsável', 
    'Telefone', 
    'Email', 
    'CEP',
    'Logradouro',
    'Número',
    'Bairro',
    'Cidade', 
    'Estado',
    'Estado/Unidade *',
    'Categoria *',
    'Tipo de Fornecedor *',
    'Observações'
  ];
  const exampleRow = [
    '12.345.678/0001-90', 
    'PJ', 
    'Empresa Exemplo LTDA', 
    'Exemplo', 
    'João Silva', 
    '(11) 99999-9999', 
    'contato@exemplo.com', 
    '01234-567',
    'Rua Exemplo',
    '123',
    'Centro',
    'São Paulo', 
    'SP',
    'Matriz',
    'Serviços',
    'Transporte',
    ''
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), 'template_importacao_fornecedores.xlsx');
}

// Parse Import File
export interface ParsedSupplier {
  document_number: string;
  person_type: 'PF' | 'PJ';
  corporate_name: string;
  trade_name?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  business_unit?: string;
  category_name?: string;
  type_name?: string;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { row: number; field: string; message: string }[];
  validData: ParsedSupplier[];
}

export async function parseSupplierImportFile(file: File): Promise<ParsedSupplier[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const rows = jsonData.slice(1);
        const suppliers: ParsedSupplier[] = rows
          .filter(row => row.length > 0 && row[0])
          .map(row => ({
            document_number: String(row[0] || '').trim(),
            person_type: String(row[1] || 'PJ').toUpperCase() === 'PF' ? 'PF' : 'PJ',
            corporate_name: String(row[2] || '').trim(),
            trade_name: String(row[3] || '').trim() || undefined,
            contact_name: String(row[4] || '').trim() || undefined,
            contact_phone: String(row[5] || '').trim() || undefined,
            contact_email: String(row[6] || '').trim() || undefined,
            zip_code: String(row[7] || '').trim() || undefined,
            street: String(row[8] || '').trim() || undefined,
            number: String(row[9] || '').trim() || undefined,
            neighborhood: String(row[10] || '').trim() || undefined,
            city: String(row[11] || '').trim() || undefined,
            state: String(row[12] || '').trim() || undefined,
            business_unit: String(row[13] || '').trim() || undefined,
            category_name: String(row[14] || '').trim() || undefined,
            type_name: String(row[15] || '').trim() || undefined,
            notes: String(row[16] || '').trim() || undefined,
          }));

        resolve(suppliers);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateSupplierImportData(data: ParsedSupplier[]): ValidationResult {
  const errors: { row: number; field: string; message: string }[] = [];
  const validData: ParsedSupplier[] = [];

  data.forEach((supplier, index) => {
    const row = index + 2;
    let hasError = false;

    if (!supplier.document_number) {
      errors.push({ row, field: 'CNPJ/CPF', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.corporate_name) {
      errors.push({ row, field: 'Razão Social', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.business_unit) {
      errors.push({ row, field: 'Estado/Unidade', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.category_name) {
      errors.push({ row, field: 'Categoria', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.type_name) {
      errors.push({ row, field: 'Tipo de Fornecedor', message: 'Campo obrigatório' });
      hasError = true;
    }

    if (!hasError) validData.push(supplier);
  });

  return { isValid: errors.length === 0, errors, validData };
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function importSuppliers(companyId: string, data: ParsedSupplier[]): Promise<ImportResult> {
  let success = 0;
  let failed = 0;
  const errors: { row: number; message: string }[] = [];

  // Pre-fetch categories, types, and units for mapping
  const { data: categories } = await supabase
    .from('supplier_categories')
    .select('id, name')
    .eq('company_id', companyId) as any;
  
  const { data: types } = await supabase
    .from('supplier_types')
    .select('id, name')
    .eq('company_id', companyId) as any;
  
  const { data: units } = await (supabase
    .from('business_units' as any)
    .select('id, name')
    .eq('company_id', companyId) as any);

  const categoryMap = new Map((categories || []).map((c: any) => [c.name.toLowerCase(), c.id]));
  const typeMap = new Map((types || []).map((t: any) => [t.name.toLowerCase(), t.id]));
  const unitMap = new Map((units || []).map((u: any) => [u.name.toLowerCase(), u.id]));

  for (let i = 0; i < data.length; i++) {
    const supplier = data[i];
    try {
      // Insert supplier
      const { data: insertedSupplier, error } = await (supabase
        .from('managed_suppliers' as any)
        .insert({
          company_id: companyId,
          document_number: supplier.document_number,
          person_type: supplier.person_type,
          corporate_name: supplier.corporate_name,
          trade_name: supplier.trade_name,
          contact_name: supplier.contact_name,
          contact_phone: supplier.contact_phone,
          contact_email: supplier.contact_email,
          zip_code: supplier.zip_code,
          street: supplier.street,
          number: supplier.number,
          neighborhood: supplier.neighborhood,
          city: supplier.city,
          state: supplier.state,
          notes: supplier.notes,
          status: 'ativo'
        })
        .select('id')
        .single() as any);

      if (error) {
        failed++;
        errors.push({ row: i + 2, message: error.message });
        continue;
      }

      const supplierId = insertedSupplier?.id;
      if (!supplierId) {
        failed++;
        errors.push({ row: i + 2, message: 'Erro ao obter ID do fornecedor' });
        continue;
      }

      // Create assignments for category, type, and unit
      const assignmentErrors: string[] = [];

      // Unit assignment
      if (supplier.business_unit) {
        const unitId = unitMap.get(supplier.business_unit.toLowerCase());
        if (unitId) {
          const { error: unitError } = await (supabase
            .from('supplier_unit_assignments' as any)
            .insert({
              company_id: companyId,
              supplier_id: supplierId,
              business_unit_id: unitId,
            }) as any);
          if (unitError) assignmentErrors.push(`Unidade: ${unitError.message}`);
        } else {
          assignmentErrors.push(`Unidade "${supplier.business_unit}" não encontrada`);
        }
      }

      // Category assignment
      if (supplier.category_name) {
        const categoryId = categoryMap.get(supplier.category_name.toLowerCase());
        if (categoryId) {
          const { error: catError } = await (supabase
            .from('supplier_category_assignments' as any)
            .insert({
              company_id: companyId,
              supplier_id: supplierId,
              category_id: categoryId,
            }) as any);
          if (catError) assignmentErrors.push(`Categoria: ${catError.message}`);
        } else {
          assignmentErrors.push(`Categoria "${supplier.category_name}" não encontrada`);
        }
      }

      // Type assignment
      if (supplier.type_name) {
        const typeId = typeMap.get(supplier.type_name.toLowerCase());
        if (typeId) {
          const { error: typeError } = await (supabase
            .from('supplier_type_assignments' as any)
            .insert({
              company_id: companyId,
              supplier_id: supplierId,
              supplier_type_id: typeId,
            }) as any);
          if (typeError) assignmentErrors.push(`Tipo: ${typeError.message}`);
        } else {
          assignmentErrors.push(`Tipo "${supplier.type_name}" não encontrada`);
        }
      }

      if (assignmentErrors.length > 0) {
        // Supplier was created but with assignment warnings
        success++;
        errors.push({ row: i + 2, message: `Criado com avisos: ${assignmentErrors.join('; ')}` });
      } else {
        success++;
      }
    } catch (err: any) {
      failed++;
      errors.push({ row: i + 2, message: err.message || 'Erro' });
    }
  }

  return { success, failed, errors };
}

// ==================== IMPORTAÇÃO DE DOCUMENTOS ====================

// Template para importação de documentos
export function downloadDocumentImportTemplate() {
  const headers = ['Nome do Documento *', 'Peso (1-5) *', 'Descrição'];
  const exampleRow = ['Alvará de Funcionamento', '5', 'Documento obrigatório para operação'];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Documentos');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), 'template_importacao_documentos.xlsx');
}

// Interface para documento parseado
export interface ParsedDocument {
  document_name: string;
  weight: number;
  description?: string;
}

// Parse do arquivo de documentos
export async function parseDocumentImportFile(file: File): Promise<ParsedDocument[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const rows = jsonData.slice(1);
        const documents: ParsedDocument[] = rows
          .filter(row => row.length > 0 && row[0])
          .map(row => ({
            document_name: String(row[0] || '').trim(),
            weight: parseInt(String(row[1] || '3'), 10) || 3,
            description: String(row[2] || '').trim() || undefined,
          }));

        resolve(documents);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo de documentos.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// Validação dos documentos
export interface DocumentValidationResult {
  isValid: boolean;
  errors: { row: number; field: string; message: string }[];
  validData: ParsedDocument[];
}

export function validateDocumentImportData(data: ParsedDocument[]): DocumentValidationResult {
  const errors: { row: number; field: string; message: string }[] = [];
  const validData: ParsedDocument[] = [];

  data.forEach((doc, index) => {
    const row = index + 2;
    let hasError = false;

    if (!doc.document_name) {
      errors.push({ row, field: 'Nome do Documento', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (doc.weight < 1 || doc.weight > 5) {
      errors.push({ row, field: 'Peso', message: 'Peso deve ser entre 1 e 5' });
      hasError = true;
    }

    if (!hasError) validData.push(doc);
  });

  return { isValid: errors.length === 0, errors, validData };
}

// Importação dos documentos
export interface DocumentImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function importDocuments(companyId: string, data: ParsedDocument[]): Promise<DocumentImportResult> {
  let success = 0;
  let failed = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < data.length; i++) {
    const doc = data[i];
    try {
      const { error } = await supabase
        .from('supplier_required_documents')
        .insert({
          company_id: companyId,
          document_name: doc.document_name,
          weight: doc.weight,
          description: doc.description,
          is_active: true
        });

      if (error) {
        failed++;
        errors.push({ row: i + 2, message: error.message });
      } else {
        success++;
      }
    } catch (err: any) {
      failed++;
      errors.push({ row: i + 2, message: err.message || 'Erro' });
    }
  }

  return { success, failed, errors };
}
