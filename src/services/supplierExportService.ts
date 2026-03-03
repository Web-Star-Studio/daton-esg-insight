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

interface BusinessUnitOption {
  id: string;
  name: string;
}

const normalizeText = (value?: string | null): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const cleanDocumentNumber = (value?: string | null): string =>
  (value || '').replace(/\D/g, '');

const getSupplierDocumentValue = (supplier: {
  person_type: string;
  cnpj: string | null;
  cpf: string | null;
}) => (supplier.person_type === 'PJ' ? supplier.cnpj : supplier.cpf) || '';

const buildFullAddress = (supplier: ParsedSupplier): string =>
  `${supplier.street || ''}, ${supplier.number || ''} - ${supplier.neighborhood || ''}, ${supplier.city || ''} - ${supplier.state || ''}, CEP: ${supplier.zip_code || ''}`;

const mapBusinessUnits = (unitsJson: unknown): BusinessUnitOption[] => {
  if (!Array.isArray(unitsJson)) return [];

  return unitsJson.map((unit, index) => {
    if (typeof unit === 'string') {
      return {
        id: `unit-${index}`,
        name: unit,
      };
    }

    if (typeof unit === 'object' && unit !== null) {
      const raw = unit as Record<string, unknown>;
      const unitId = raw.id ? String(raw.id) : `unit-${index}`;
      const unitName =
        (typeof raw.name === 'string' && raw.name) ||
        (typeof raw.label === 'string' && raw.label) ||
        unitId;

      return {
        id: unitId,
        name: unitName,
      };
    }

    return {
      id: `unit-${index}`,
      name: String(unit),
    };
  });
};

const formatImportError = (message: string, personType: 'PF' | 'PJ'): string => {
  if (message.includes('duplicate key value')) {
    if (personType === 'PJ') return 'CNPJ já cadastrado para esta empresa';
    return 'CPF já cadastrado para esta empresa';
  }

  if (message.includes('idx_supplier_management_cnpj_unique')) {
    return 'CNPJ já cadastrado para esta empresa';
  }

  if (message.includes('idx_supplier_management_cpf_unique')) {
    return 'CPF já cadastrado para esta empresa';
  }

  return message;
};

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
  const { data: suppliers, error } = await supabase
    .from('supplier_management')
    .select('person_type, cnpj, cpf, company_name, full_name, nickname, responsible_name, phone_1, email, status')
    .eq('company_id', companyId);

  if (error || !suppliers?.length) {
    throw new Error('Nenhum fornecedor encontrado');
  }

  const headers = ['CNPJ/CPF', 'Tipo', 'Razão Social/Nome', 'Nome Fantasia', 'Responsável', 'Telefone', 'Email', 'Status'];
  const rows = suppliers.map((s) => [
    getSupplierDocumentValue(s),
    s.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
    s.person_type === 'PJ' ? s.company_name || '' : s.full_name || '',
    s.nickname || '',
    s.responsible_name || '',
    s.phone_1 || '',
    s.email || '',
    s.status || 'Ativo'
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
    'Responsável (obrigatório PJ)', 
    'Telefone *', 
    'Email (obrigatório PJ)', 
    'CEP *',
    'Logradouro *',
    'Número *',
    'Bairro *',
    'Cidade *', 
    'Estado *',
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
  row_number?: number;
  document_number: string;
  person_type: 'PF' | 'PJ';
  person_type_source?: string;
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
          .map((row, rowIndex) => ({ row, rowNumber: rowIndex + 2 }))
          .filter(({ row }) => row.length > 0 && row[0])
          .map(({ row, rowNumber }) => {
            const personTypeSource = String(row[1] || '').trim().toUpperCase();
            const normalizedPersonType: 'PF' | 'PJ' = personTypeSource === 'PF' ? 'PF' : 'PJ';

            return {
              row_number: rowNumber,
              document_number: String(row[0] || '').trim(),
              person_type: normalizedPersonType,
              person_type_source: personTypeSource || undefined,
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
            };
          });

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
  let validData: ParsedSupplier[] = [];
  const documentRows = new Map<string, number[]>();

  data.forEach((supplier, index) => {
    const row = supplier.row_number || index + 2;
    let hasError = false;
    const cleanDocument = cleanDocumentNumber(supplier.document_number);
    const typeInput = (supplier.person_type_source || '').trim().toUpperCase();

    if (!cleanDocument) {
      errors.push({ row, field: 'CNPJ/CPF', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!typeInput) {
      errors.push({ row, field: 'Tipo (PF/PJ)', message: 'Campo obrigatório' });
      hasError = true;
    } else if (typeInput !== 'PF' && typeInput !== 'PJ') {
      errors.push({ row, field: 'Tipo (PF/PJ)', message: 'Valor inválido. Use PF ou PJ' });
      hasError = true;
    }
    if (!supplier.corporate_name) {
      errors.push({ row, field: 'Razão Social/Nome', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.contact_phone) {
      errors.push({ row, field: 'Telefone', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.zip_code) {
      errors.push({ row, field: 'CEP', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.street) {
      errors.push({ row, field: 'Logradouro', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.number) {
      errors.push({ row, field: 'Número', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.neighborhood) {
      errors.push({ row, field: 'Bairro', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.city) {
      errors.push({ row, field: 'Cidade', message: 'Campo obrigatório' });
      hasError = true;
    }
    if (!supplier.state) {
      errors.push({ row, field: 'Estado', message: 'Campo obrigatório' });
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

    if (supplier.person_type === 'PJ') {
      if (!supplier.contact_name) {
        errors.push({ row, field: 'Responsável', message: 'Campo obrigatório para PJ' });
        hasError = true;
      }
      if (!supplier.contact_email) {
        errors.push({ row, field: 'Email', message: 'Campo obrigatório para PJ' });
        hasError = true;
      }
    }

    if (cleanDocument) {
      if (supplier.person_type === 'PJ' && cleanDocument.length !== 14) {
        errors.push({ row, field: 'CNPJ', message: 'Documento inválido para PJ (14 dígitos)' });
        hasError = true;
      }
      if (supplier.person_type === 'PF' && cleanDocument.length !== 11) {
        errors.push({ row, field: 'CPF', message: 'Documento inválido para PF (11 dígitos)' });
        hasError = true;
      }

      const duplicateRows = documentRows.get(cleanDocument) || [];
      duplicateRows.push(row);
      documentRows.set(cleanDocument, duplicateRows);
    }

    if (!hasError) {
      validData.push(supplier);
    }
  });

  const duplicatedRows = new Set<number>();
  documentRows.forEach((rows, cleanDocument) => {
    if (rows.length < 2) return;
    rows.forEach((row) => {
      duplicatedRows.add(row);
      errors.push({
        row,
        field: 'CNPJ/CPF',
        message: `Documento duplicado no arquivo (${cleanDocument})`,
      });
    });
  });

  if (duplicatedRows.size > 0) {
    validData = validData.filter((supplier) => !duplicatedRows.has(supplier.row_number || 0));
  }

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
  const { data: categories, error: categoriesError } = await supabase
    .from('supplier_categories')
    .select('id, name')
    .eq('company_id', companyId);
  
  const { data: types, error: typesError } = await supabase
    .from('supplier_types')
    .select('id, name')
    .eq('company_id', companyId);

  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('business_units')
    .eq('id', companyId)
    .single();

  const { data: existingSuppliers, error: existingSuppliersError } = await supabase
    .from('supplier_management')
    .select('cnpj, cpf')
    .eq('company_id', companyId);

  if (categoriesError) throw new Error(`Erro ao buscar categorias: ${categoriesError.message}`);
  if (typesError) throw new Error(`Erro ao buscar tipos: ${typesError.message}`);
  if (companyError) throw new Error(`Erro ao buscar unidades: ${companyError.message}`);
  if (existingSuppliersError) throw new Error(`Erro ao buscar fornecedores existentes: ${existingSuppliersError.message}`);

  const units = mapBusinessUnits(companyData?.business_units);
  const categoryMap = new Map((categories || []).map((c) => [normalizeText(c.name), c.id]));
  const typeMap = new Map((types || []).map((t) => [normalizeText(t.name), t.id]));
  const unitMap = new Map(units.map((u) => [normalizeText(u.name), u.id]));
  const existingDocuments = new Set<string>();

  (existingSuppliers || []).forEach((supplier) => {
    const cnpj = cleanDocumentNumber(supplier.cnpj);
    const cpf = cleanDocumentNumber(supplier.cpf);
    if (cnpj) existingDocuments.add(cnpj);
    if (cpf) existingDocuments.add(cpf);
  });

  for (let i = 0; i < data.length; i++) {
    const supplier = data[i];
    const row = supplier.row_number || i + 2;
    const cleanDocument = cleanDocumentNumber(supplier.document_number);
    const businessUnitName = supplier.business_unit || '';
    const categoryName = supplier.category_name || '';
    const typeName = supplier.type_name || '';
    const unitId = unitMap.get(normalizeText(businessUnitName));
    const categoryId = categoryMap.get(normalizeText(categoryName));
    const typeId = typeMap.get(normalizeText(typeName));
    const documentLabel = supplier.person_type === 'PJ' ? 'CNPJ' : 'CPF';
    let insertedSupplierId: string | null = null;

    if (!unitId) {
      failed++;
      errors.push({ row, message: `Unidade "${businessUnitName}" não encontrada` });
      continue;
    }
    if (!categoryId) {
      failed++;
      errors.push({ row, message: `Categoria "${categoryName}" não encontrada` });
      continue;
    }
    if (!typeId) {
      failed++;
      errors.push({ row, message: `Tipo "${typeName}" não encontrado` });
      continue;
    }
    if (existingDocuments.has(cleanDocument)) {
      failed++;
      errors.push({ row, message: `${documentLabel} já cadastrado para esta empresa` });
      continue;
    }

    try {
      // Insert supplier
      const { data: insertedSupplier, error } = await supabase
        .from('supplier_management')
        .insert({
          company_id: companyId,
          person_type: supplier.person_type,
          full_name: supplier.person_type === 'PF' ? supplier.corporate_name : null,
          cpf: supplier.person_type === 'PF' ? cleanDocument : null,
          company_name: supplier.person_type === 'PJ' ? supplier.corporate_name : null,
          cnpj: supplier.person_type === 'PJ' ? cleanDocument : null,
          responsible_name: supplier.person_type === 'PJ' ? supplier.contact_name || null : null,
          nickname: supplier.trade_name,
          full_address: buildFullAddress(supplier),
          cep: supplier.zip_code,
          street: supplier.street,
          street_number: supplier.number,
          neighborhood: supplier.neighborhood,
          city: supplier.city,
          state: supplier.state,
          phone_1: supplier.contact_phone || '',
          email: supplier.contact_email,
          status: 'Ativo'
        })
        .select('id')
        .single();

      if (error) {
        failed++;
        errors.push({ row, message: formatImportError(error.message, supplier.person_type) });
        continue;
      }

      const supplierId = insertedSupplier?.id;
      if (!supplierId) {
        failed++;
        errors.push({ row, message: 'Erro ao obter ID do fornecedor' });
        continue;
      }
      insertedSupplierId = supplierId;

      // Create assignments for category, type, and unit
      const { error: unitError } = await supabase
        .from('supplier_unit_assignments')
        .insert({
          company_id: companyId,
          supplier_id: supplierId,
          business_unit_id: unitId,
        });

      if (unitError) {
        throw new Error(`Falha ao vincular unidade: ${unitError.message}`);
      }

      const { error: catError } = await supabase
        .from('supplier_category_assignments')
        .insert({
          company_id: companyId,
          supplier_id: supplierId,
          category_id: categoryId,
        });

      if (catError) {
        throw new Error(`Falha ao vincular categoria: ${catError.message}`);
      }

      const { error: typeError } = await supabase
        .from('supplier_type_assignments')
        .insert({
          company_id: companyId,
          supplier_id: supplierId,
          supplier_type_id: typeId,
        });

      if (typeError) {
        throw new Error(`Falha ao vincular tipo: ${typeError.message}`);
      }

      success++;
      existingDocuments.add(cleanDocument);
    } catch (err: any) {
      if (insertedSupplierId) {
        const { error: rollbackError } = await supabase
          .from('supplier_management')
          .delete()
          .eq('id', insertedSupplierId);

        if (rollbackError) {
          errors.push({
            row,
            message: `Falha ao reverter cadastro após erro: ${rollbackError.message}`,
          });
        }
      }

      failed++;
      errors.push({ row, message: formatImportError(err.message || 'Erro', supplier.person_type) });
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
