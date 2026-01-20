import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateConsequenceScore, 
  calculateFreqProbScore, 
  calculateCategory, 
  calculateSignificance 
} from "@/types/laia";
import { createLAIASector } from './laiaService';

// ============ Types ============

export interface ParsedLAIARow {
  rowNumber: number;
  sector_code: string;
  aspect_code: string;
  activity_operation: string;
  environmental_aspect: string;
  environmental_impact: string;
  temporality: 'passada' | 'atual' | 'futura';
  operational_situation: 'normal' | 'anormal' | 'emergencia';
  incidence: 'direto' | 'indireto';
  impact_class: 'benefico' | 'adverso';
  scope: 'local' | 'regional' | 'global';
  severity: 'baixa' | 'media' | 'alta';
  consequence_score: number;
  frequency_probability: 'baixa' | 'media' | 'alta';
  freq_prob_score: number;
  total_score: number;
  category: 'desprezivel' | 'moderado' | 'critico';
  has_legal_requirements: boolean;
  has_stakeholder_demand: boolean;
  has_strategic_options: boolean;
  significance: 'significativo' | 'nao_significativo';
  control_types: string[];
  existing_controls: string;
  legislation_reference: string;
  has_lifecycle_control: boolean;
  lifecycle_stages: string[];
  output_actions: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRows: ParsedLAIARow[];
  invalidRows: { row: ParsedLAIARow; errors: string[] }[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    sectorsFound: string[];
    newSectors: string[];
  };
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
  sectorsCreated: string[];
}

// ============ Column Mapping ============

const COLUMN_MAP: Record<string, string> = {
  // Sector code
  'cod set': 'sector_code',
  'codigo setor': 'sector_code',
  'setor': 'sector_code',
  
  // Aspect code
  'cod': 'aspect_code',
  'codigo': 'aspect_code',
  'cod set . cod asp/imp': 'aspect_code',
  
  // Aspect & Impact
  'aspecto ambiental': 'environmental_aspect',
  'aspecto': 'environmental_aspect',
  'impacto ambiental': 'environmental_impact',
  'impacto': 'environmental_impact',
  
  // Activity
  'atividade/operacao': 'activity_operation',
  'atividade / operacao': 'activity_operation',
  'atividade': 'activity_operation',
  'operacao': 'activity_operation',
  
  // Characterization
  'temporalidade': 'temporality',
  'situacao operacional': 'operational_situation',
  'situacao': 'operational_situation',
  'incidencia': 'incidence',
  'classe do impacto': 'impact_class',
  'classe': 'impact_class',
  'abrangencia': 'scope',
  'severidade': 'severity',
  
  // Scoring
  'consequencia': 'consequence_score',
  'frequencia/probabilidade': 'frequency_probability',
  'freq/prob': 'frequency_probability',
  'frequencia': 'frequency_probability',
  'total': 'total_score',
  'soma (cons + fre pro)': 'total_score',
  'categoria': 'category',
  
  // Significance factors
  'req. legais': 'has_legal_requirements',
  'requisitos legais': 'has_legal_requirements',
  'dpi': 'has_stakeholder_demand',
  'demanda partes interessadas': 'has_stakeholder_demand',
  'oe': 'has_strategic_options',
  'opcoes estrategicas': 'has_strategic_options',
  
  // Significance result
  'significancia': 'significance',
  'enquadramento': 'significance',
  
  // Controls
  'tipo de controle': 'control_types',
  'tipos de controle': 'control_types',
  'tipos': 'control_types',
  'controles existentes': 'existing_controls',
  'controle existente': 'existing_controls',
  
  // Legislation
  'legislacao/norma': 'legislation_reference',
  'legislacao': 'legislation_reference',
  'norma': 'legislation_reference',
  'link legislacao': 'legislation_reference',
  
  // Lifecycle
  'controle ciclo de vida': 'has_lifecycle_control',
  'ciclo de vida': 'has_lifecycle_control',
  'existe controle ou influencia suficiente em algum estagio?': 'has_lifecycle_control',
  'etapas ciclo de vida': 'lifecycle_stages',
  'etapas': 'lifecycle_stages',
  'em qual(is) estagio(s)?': 'lifecycle_stages',
  
  // Output
  'acoes saidas': 'output_actions',
  'acoes': 'output_actions',
  'saidas': 'output_actions',
  'saida(s) com base na avaliacao.': 'output_actions',
};

// ============ Value Mappings ============

const TEMPORALITY_MAP: Record<string, 'passada' | 'atual' | 'futura'> = {
  'p': 'passada',
  'passada': 'passada',
  'a': 'atual',
  'atual': 'atual',
  'f': 'futura',
  'futura': 'futura',
  'a/f': 'atual', // Default to atual when both
  'f/a': 'atual',
};

const OPERATIONAL_SITUATION_MAP: Record<string, 'normal' | 'anormal' | 'emergencia'> = {
  'n': 'normal',
  'normal': 'normal',
  'a': 'anormal',
  'anormal': 'anormal',
  'e': 'emergencia',
  'emergência': 'emergencia',
  'emergencia': 'emergencia',
};

const INCIDENCE_MAP: Record<string, 'direto' | 'indireto'> = {
  'sc': 'direto',
  'sob controle': 'direto',
  'controle': 'direto',
  'direto': 'direto',
  'si': 'indireto',
  'sob influência': 'indireto',
  'influência': 'indireto',
  'indireto': 'indireto',
};

const IMPACT_CLASS_MAP: Record<string, 'benefico' | 'adverso'> = {
  'a': 'adverso',
  'adverso': 'adverso',
  'b': 'benefico',
  'benéfico': 'benefico',
  'benefico': 'benefico',
};

const SCOPE_MAP: Record<string, 'local' | 'regional' | 'global'> = {
  'l': 'local',
  'local': 'local',
  'r': 'regional',
  'regional': 'regional',
  'g': 'global',
  'global': 'global',
};

const SEVERITY_MAP: Record<string, 'baixa' | 'media' | 'alta'> = {
  'b': 'baixa',
  'baixa': 'baixa',
  'm': 'media',
  'média': 'media',
  'media': 'media',
  'a': 'alta',
  'alta': 'alta',
};

const FREQUENCY_MAP: Record<string, 'baixa' | 'media' | 'alta'> = {
  'b': 'baixa',
  'baixa': 'baixa',
  'm': 'media',
  'média': 'media',
  'media': 'media',
  'a': 'alta',
  'alta': 'alta',
};

const CATEGORY_MAP: Record<string, 'desprezivel' | 'moderado' | 'critico'> = {
  'desprezível': 'desprezivel',
  'desprezivel': 'desprezivel',
  'moderado': 'moderado',
  'crítico': 'critico',
  'critico': 'critico',
};

const SIGNIFICANCE_MAP: Record<string, 'significativo' | 'nao_significativo'> = {
  'significativo': 'significativo',
  'sig': 'significativo',
  's': 'significativo',
  'nao significativo': 'nao_significativo',
  'nao sig': 'nao_significativo',
  'ns': 'nao_significativo',
  'n': 'nao_significativo',
};

// ============ Helper Functions ============

function cleanText(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    // Remove numeric prefixes like "1)", "12)", etc.
    .replace(/^\d+\)\s*/, '')
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseBoolean(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  const str = String(value).toLowerCase().trim();
  return str === '1' || str === 'sim' || str === 'yes' || str === 'true' || str === 'x';
}

function parseControlTypes(value: unknown): string[] {
  if (!value) return [];
  const str = cleanText(value);
  const types = str.split(/[,\/;]/).map(t => t.trim().toUpperCase()).filter(Boolean);
  const validTypes = ['ST', 'CO', 'MO', 'PRE', 'NC'];
  return types.filter(t => validTypes.includes(t));
}

function parseLifecycleStages(value: unknown): string[] {
  if (!value) return [];
  const str = cleanText(value);
  return str.split(/[,\/;]/).map(s => s.trim()).filter(Boolean);
}

function parseLifecycleControl(value: unknown): boolean {
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return str.includes('sim') || str.includes('controle') || str.includes('influência') || str.includes('influencia');
}

function findHeaderRow(sheet: XLSX.WorkSheet): { headerRow: number; headers: Record<string, number> } | null {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Search first 20 rows for header
  for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
    const headers: Record<string, number> = {};
    let hasAspect = false;
    let hasSector = false;
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell?.v) {
        const headerText = normalizeKey(String(cell.v));
        const mappedKey = COLUMN_MAP[headerText];
        if (mappedKey) {
          headers[mappedKey] = col;
        }
        
        // Detect key columns with flexible matching
        if (headerText.includes('aspecto ambiental') || 
            headerText.includes('cod asp') ||
            headerText.includes('cod set . cod')) {
          hasAspect = true;
        }
        if (headerText.includes('cod set') || 
            headerText.includes('setor') ||
            (headerText.includes('cod') && headerText.includes('set'))) {
          hasSector = true;
        }
      }
    }
    
    // Found header row if we have both sector and aspect identifiers
    if (hasAspect && hasSector && Object.keys(headers).length >= 5) {
      return { headerRow: row, headers };
    }
  }
  
  return null;
}

// ============ Main Functions ============

export async function parseLAIAExcel(file: File): Promise<{ rows: ParsedLAIARow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const headerInfo = findHeaderRow(sheet);
        if (!headerInfo) {
          throw new Error('Não foi possível encontrar a linha de cabeçalho. Verifique se o arquivo contém colunas como "COD SET", "ASPECTO AMBIENTAL", etc.');
        }
        
        const { headerRow, headers } = headerInfo;
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        const rows: ParsedLAIARow[] = [];
        
        for (let row = headerRow + 1; row <= range.e.r; row++) {
          const getCellValue = (key: string): string => {
            const col = headers[key];
            if (col === undefined) return '';
            const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
            return cleanText(cell?.v);
          };
          
          const sectorCode = getCellValue('sector_code');
          const aspectCode = getCellValue('aspect_code');
          
          // Skip empty rows
          if (!sectorCode && !aspectCode) continue;
          
          const temporalityRaw = getCellValue('temporality').toLowerCase();
          const situationRaw = getCellValue('operational_situation').toLowerCase();
          const incidenceRaw = getCellValue('incidence').toLowerCase();
          const impactClassRaw = getCellValue('impact_class').toLowerCase();
          const scopeRaw = getCellValue('scope').toLowerCase();
          const severityRaw = getCellValue('severity').toLowerCase();
          const frequencyRaw = getCellValue('frequency_probability').toLowerCase();
          
          const temporality = TEMPORALITY_MAP[temporalityRaw] || 'atual';
          const operational_situation = OPERATIONAL_SITUATION_MAP[situationRaw] || 'normal';
          const incidence = INCIDENCE_MAP[incidenceRaw] || 'direto';
          const impact_class = IMPACT_CLASS_MAP[impactClassRaw] || 'adverso';
          const scope = SCOPE_MAP[scopeRaw] || 'local';
          const severity = SEVERITY_MAP[severityRaw] || 'baixa';
          const frequency_probability = FREQUENCY_MAP[frequencyRaw] || 'baixa';
          
          const consequence_score = parseInt(getCellValue('consequence_score')) || calculateConsequenceScore(scope, severity);
          const freq_prob_score = parseInt(getCellValue('freq_prob_score')) || calculateFreqProbScore(frequency_probability);
          const total_score = parseInt(getCellValue('total_score')) || (consequence_score + freq_prob_score);
          
          const categoryRaw = getCellValue('category').toLowerCase();
          const category = CATEGORY_MAP[categoryRaw] || calculateCategory(total_score);
          
          const has_legal_requirements = parseBoolean(getCellValue('has_legal_requirements'));
          const has_stakeholder_demand = parseBoolean(getCellValue('has_stakeholder_demand'));
          const has_strategic_options = parseBoolean(getCellValue('has_strategic_options'));
          
          const significanceRaw = getCellValue('significance').toLowerCase();
          const significance = SIGNIFICANCE_MAP[significanceRaw] || calculateSignificance(
            category,
            has_legal_requirements,
            has_stakeholder_demand,
            has_strategic_options
          );
          
          rows.push({
            rowNumber: row + 1,
            sector_code: sectorCode,
            aspect_code: aspectCode,
            activity_operation: getCellValue('activity_operation'),
            environmental_aspect: getCellValue('environmental_aspect'),
            environmental_impact: getCellValue('environmental_impact'),
            temporality,
            operational_situation,
            incidence,
            impact_class,
            scope,
            severity,
            consequence_score,
            frequency_probability,
            freq_prob_score,
            total_score,
            category,
            has_legal_requirements,
            has_stakeholder_demand,
            has_strategic_options,
            significance,
            control_types: parseControlTypes(getCellValue('control_types')),
            existing_controls: getCellValue('existing_controls'),
            legislation_reference: getCellValue('legislation_reference'),
            has_lifecycle_control: parseLifecycleControl(getCellValue('has_lifecycle_control')),
            lifecycle_stages: parseLifecycleStages(getCellValue('lifecycle_stages')),
            output_actions: getCellValue('output_actions'),
          });
        }
        
        resolve({ rows, headers: Object.keys(headers) });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export async function validateLAIAImport(
  rows: ParsedLAIARow[],
  companyId: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validRows: ParsedLAIARow[] = [];
  const invalidRows: { row: ParsedLAIARow; errors: string[] }[] = [];
  
  // Get existing sectors
  const { data: existingSectors } = await supabase
    .from('laia_sectors')
    .select('code, id')
    .eq('company_id', companyId);
  
  const existingSectorCodes = new Set((existingSectors || []).map(s => s.code.toUpperCase()));
  const sectorsFound = new Set<string>();
  const newSectors = new Set<string>();
  
  // Get existing aspect codes to check duplicates
  const { data: existingAssessments } = await supabase
    .from('laia_assessments')
    .select('aspect_code')
    .eq('company_id', companyId);
  
  const existingAspectCodes = new Set((existingAssessments || []).map(a => a.aspect_code));
  
  for (const row of rows) {
    const rowErrors: string[] = [];
    
    // Required fields
    if (!row.sector_code) {
      rowErrors.push('Código do setor é obrigatório');
      errors.push({ row: row.rowNumber, field: 'sector_code', message: 'Código do setor é obrigatório' });
    } else {
      sectorsFound.add(row.sector_code.toUpperCase());
      if (!existingSectorCodes.has(row.sector_code.toUpperCase())) {
        newSectors.add(row.sector_code.toUpperCase());
        warnings.push({ 
          row: row.rowNumber, 
          field: 'sector_code', 
          message: `Setor "${row.sector_code}" não existe e será criado automaticamente` 
        });
      }
    }
    
    if (!row.environmental_aspect) {
      rowErrors.push('Aspecto ambiental é obrigatório');
      errors.push({ row: row.rowNumber, field: 'environmental_aspect', message: 'Aspecto ambiental é obrigatório' });
    }
    
    if (!row.environmental_impact) {
      rowErrors.push('Impacto ambiental é obrigatório');
      errors.push({ row: row.rowNumber, field: 'environmental_impact', message: 'Impacto ambiental é obrigatório' });
    }
    
    // Check for duplicates
    if (row.aspect_code && existingAspectCodes.has(row.aspect_code)) {
      warnings.push({ 
        row: row.rowNumber, 
        field: 'aspect_code', 
        message: `Código de aspecto "${row.aspect_code}" já existe - novo código será gerado` 
      });
    }
    
    // Optional field warnings
    if (!row.activity_operation) {
      warnings.push({ row: row.rowNumber, field: 'activity_operation', message: 'Atividade/Operação não informada' });
    }
    
    if (rowErrors.length === 0) {
      validRows.push(row);
    } else {
      invalidRows.push({ row, errors: rowErrors });
    }
  }
  
  return {
    isValid: invalidRows.length === 0,
    errors,
    warnings,
    validRows,
    invalidRows,
    stats: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      sectorsFound: Array.from(sectorsFound),
      newSectors: Array.from(newSectors),
    },
  };
}

export async function importLAIAAssessments(
  rows: ParsedLAIARow[],
  companyId: string,
  options?: {
    createMissingSectors?: boolean;
    branchId?: string | null;
    onProgress?: (current: number, total: number, message: string) => void;
  }
): Promise<ImportResult> {
  const { createMissingSectors = true, branchId, onProgress } = options || {};
  
  const sectorsCreated: string[] = [];
  const errors: { row: number; message: string }[] = [];
  let imported = 0;
  
  // Get or create sectors
  const { data: existingSectors } = await supabase
    .from('laia_sectors')
    .select('code, id')
    .eq('company_id', companyId);
  
  const sectorMap = new Map((existingSectors || []).map(s => [s.code.toUpperCase(), s.id]));
  
  // Find missing sectors
  const missingSectors = new Set<string>();
  for (const row of rows) {
    if (row.sector_code && !sectorMap.has(row.sector_code.toUpperCase())) {
      missingSectors.add(row.sector_code.toUpperCase());
    }
  }
  
  // Create missing sectors
  if (createMissingSectors && missingSectors.size > 0) {
    onProgress?.(0, rows.length, `Criando ${missingSectors.size} setor(es)...`);
    
    for (const sectorCode of missingSectors) {
      try {
        const newSector = await createLAIASector({
          code: sectorCode,
          name: `Setor ${sectorCode}`,
          description: 'Criado automaticamente pela importação',
        });
        sectorMap.set(sectorCode, newSector.id);
        sectorsCreated.push(sectorCode);
      } catch (err) {
        console.error(`Erro ao criar setor ${sectorCode}:`, err);
      }
    }
  }
  
  // Import assessments
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.(i + 1, rows.length, `Importando linha ${row.rowNumber}...`);
    
    const sectorId = sectorMap.get(row.sector_code.toUpperCase());
    if (!sectorId) {
      errors.push({ row: row.rowNumber, message: `Setor "${row.sector_code}" não encontrado` });
      continue;
    }
    
    try {
      // Get next aspect code
      const { data: lastAssessment } = await supabase
        .from('laia_assessments')
        .select('aspect_code')
        .eq('sector_id', sectorId)
        .order('aspect_code', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let nextNumber = 1;
      if (lastAssessment?.aspect_code) {
        const parts = lastAssessment.aspect_code.split('.');
        if (parts.length === 2) {
          nextNumber = parseInt(parts[1], 10) + 1;
        }
      }
      
      const aspect_code = `${row.sector_code}.${String(nextNumber).padStart(2, '0')}`;
      
      const { error: insertError } = await supabase
        .from('laia_assessments')
        .insert({
          company_id: companyId,
          sector_id: sectorId,
          branch_id: branchId || null,
          aspect_code,
          activity_operation: row.activity_operation || 'Não especificada',
          environmental_aspect: row.environmental_aspect,
          environmental_impact: row.environmental_impact,
          temporality: row.temporality,
          operational_situation: row.operational_situation,
          incidence: row.incidence,
          impact_class: row.impact_class,
          scope: row.scope,
          severity: row.severity,
          consequence_score: row.consequence_score,
          frequency_probability: row.frequency_probability,
          freq_prob_score: row.freq_prob_score,
          total_score: row.total_score,
          category: row.category,
          has_legal_requirements: row.has_legal_requirements,
          has_stakeholder_demand: row.has_stakeholder_demand,
          has_strategic_options: row.has_strategic_options,
          significance: row.significance,
          control_types: row.control_types,
          existing_controls: row.existing_controls || null,
          legislation_reference: row.legislation_reference || null,
          has_lifecycle_control: row.has_lifecycle_control,
          lifecycle_stages: row.lifecycle_stages,
          output_actions: row.output_actions || null,
          status: 'ativo',
        });
      
      if (insertError) {
        errors.push({ row: row.rowNumber, message: insertError.message });
      } else {
        imported++;
      }
    } catch (err) {
      errors.push({ row: row.rowNumber, message: String(err) });
    }
  }
  
  return {
    success: errors.length === 0,
    imported,
    failed: errors.length,
    errors,
    sectorsCreated,
  };
}

export function downloadLAIATemplate(): void {
  const headers = [
    'COD SET',
    'ATIVIDADE/OPERAÇÃO',
    'ASPECTO AMBIENTAL',
    'IMPACTO AMBIENTAL',
    'TEMPORALIDADE',
    'SITUAÇÃO OPERACIONAL',
    'INCIDÊNCIA',
    'CLASSE DO IMPACTO',
    'ABRANGÊNCIA',
    'SEVERIDADE',
    'FREQ/PROB',
    'REQ. LEGAIS',
    'DPI',
    'OE',
    'TIPO DE CONTROLE',
    'CONTROLES EXISTENTES',
    'LEGISLAÇÃO/NORMA',
    'CONTROLE CICLO DE VIDA',
    'ETAPAS CICLO DE VIDA',
    'AÇÕES SAÍDAS',
  ];
  
  const exampleRow = [
    'ADM',
    'Uso de ar condicionado',
    'Consumo de energia elétrica',
    'Esgotamento de recursos naturais',
    'A',
    'N',
    'SC',
    'A',
    'R',
    'M',
    'A',
    '1',
    '',
    '',
    'CO,MO',
    'Manutenção preventiva',
    'Lei 12.305/2010',
    'Sim, controle',
    'Operação/Processo Interno',
    'Reduzir consumo',
  ];
  
  const instructions = [
    ['INSTRUÇÕES DE PREENCHIMENTO'],
    [''],
    ['NOTA: A filial pode ser selecionada durante o assistente de importação.'],
    ['Todas as avaliações do arquivo serão vinculadas à mesma filial selecionada.'],
    [''],
    ['TEMPORALIDADE: P=Passada, A=Atual, F=Futura'],
    ['SITUAÇÃO OPERACIONAL: N=Normal, A=Anormal, E=Emergência'],
    ['INCIDÊNCIA: SC=Sob Controle (Direto), SI=Sob Influência (Indireto)'],
    ['CLASSE DO IMPACTO: A=Adverso, B=Benéfico'],
    ['ABRANGÊNCIA: L=Local, R=Regional, G=Global'],
    ['SEVERIDADE: B=Baixa, M=Média, A=Alta'],
    ['FREQ/PROB: B=Baixa, M=Média, A=Alta'],
    ['REQ. LEGAIS / DPI / OE: 1=Sim, vazio=Não'],
    ['TIPO DE CONTROLE: ST=Sistemas de Tratamento, CO=Controles Operacionais, MO=Monitoramento, PRE=Planos de Resposta a Emergências, NC=Nenhum Controle'],
    ['CONTROLE CICLO DE VIDA: "Sim, controle", "Sim, influência" ou "Não há"'],
  ];
  
  const wb = XLSX.utils.book_new();
  
  // Data sheet
  const wsData = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  wsData['!cols'] = headers.map(() => ({ wch: 25 }));
  XLSX.utils.book_append_sheet(wb, wsData, 'Dados');
  
  // Instructions sheet
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instruções');
  
  XLSX.writeFile(wb, 'template_laia_importacao.xlsx');
}
