import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from '@/utils/formErrorHandler';

// ============= Types =============

// Unit evaluation from Excel column (POA, PIR, GO, etc.)
export interface UnitEvaluation {
  unitCode: string;      // POA, PIR, GO, etc.
  value: string;         // 1, 2, 3, x, z
  applicability: 'real' | 'potential' | 'na' | 'pending';
  complianceStatus: 'conforme' | 'adequacao' | 'pending' | 'na';
}

export interface ParsedLegislation {
  rowNumber: number;
  norm_type: string;
  norm_number: string;
  title: string;
  summary: string;
  issuing_body: string;
  publication_date: string;
  jurisdiction: string;
  state: string;
  municipality: string;
  theme_name: string;
  subtheme_name: string;
  overall_applicability: string;
  overall_status: string;
  full_text_url: string;
  review_frequency_days: number;
  observations: string;
  evidence_text: string;           // Campo "Evidências" para conciliação
  // Campos extras do formato Gabardo
  compliance_details: string;      // "Observações como é atendido"
  general_notes: string;           // "Observações gerais, envios datas e responsáveis"
  states_list: string;             // UFs múltiplos
  municipalities_list: string;     // Municípios múltiplos (formato SP)
  // Avaliações por unidade
  unitEvaluations: UnitEvaluation[];
}

// Unit mapping for import
export interface UnitMapping {
  excelCode: string;
  branchId: string | null;
  branchName?: string;
  autoMatched: boolean;
}

export interface LegislationValidation {
  rowNumber: number;
  title: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LegislationImportResult {
  success: boolean;
  imported: number;
  updated: number;
  evidencesAdded: number;
  unitCompliancesCreated: number;  // NEW: unit compliance records created
  errors: number;
  warnings: number;
  details: Array<{
    rowNumber: number;
    title: string;
    status: 'success' | 'error' | 'warning' | 'updated';
    message: string;
  }>;
  createdEntities: {
    themes: string[];
    subthemes: string[];
  };
  unitsByBranch: Record<string, number>;  // NEW: count by branch name
}

export interface LegislationImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentLegislation?: string;
  stage: 'preparing' | 'creating_entities' | 'importing' | 'finalizing';
}

// ============= Constants =============

export const VALID_NORM_TYPES = [
  // Tipos originais
  'Lei', 'Lei Complementar', 'Decreto', 'Portaria', 'Resolução',
  'Instrução Normativa', 'NBR', 'NR', 'Deliberação', 'Medida Provisória',
  'Convenção', 'Tratado', 'Outro',
  // Tipos adicionais do formato Gabardo
  'Constituição Federal', 'Constituição', 'Decreto-Lei', 'Emenda Constitucional',
  'Circular', 'Circular SUSEP', 'Portaria Conjunta', 'Portaria Interministerial',
  'Ato Declaratório', 'Ato Declaratório Interpretativo', 'Ato Normativo',
  'Resolução CONTRAN', 'Resolução CONAMA', 'Resolução ANTT', 'Resolução CNEN',
  'Resolução CNRH', 'Resolução CGSIM', 'Resolução ANS', 'Resolução ANVISA',
  'Instrução Normativa IBAMA', 'Instrução Normativa SRF', 'Instrução Normativa RFB',
  'Portaria MMA', 'Portaria DNIT', 'Portaria MTE', 'Portaria INMETRO',
  'Norma Regulamentadora', 'Anexo', 'Lei Ordinária', 'Súmula', 'Parecer Normativo',
  // Tipos do formato NBR/Internacional
  'NBR ABNT', 'NBR ISO', 'NBR NM', 'ISO', 'ABNT NBR',
  'Decreto Supremo', 'Decreto Supremo MTC',
  'Deliberação CONTRAN', 'Resolução MERCOSUL', 'Decisão MERCOSUL',
  'Portaria COANA', 'Instrução Normativa RFB RF', 'Resolução SUSEP',
  'Decreto Lei', 'Regulamento Técnico', 'Acordo Internacional',
  // Tipos específicos do Estado de São Paulo
  'Constituição do Estado de São Paulo', 'Constituição Estadual',
  'Portaria CBMSP', 'Instrução Técnica CBMSP', 'Parecer Técnico CBMSP',
  'Decisão CETESB', 'Decisão de Diretoria CETESB', 'Decreto CETESB',
  'Norma Técnica CETESB', 'Memorando CETESB',
  'Resolução SMA', 'Resolução SIMA', 'Resolução SEMIL', 'Resolução SS',
  'Comunicado CVS', 'Portaria CVS',
  'Portaria DAEE', 'Portaria DEPRN', 'Portaria DETRAN', 'Portaria CREA-SP',
  'Deliberação CONSEMA',
  'Resolução Conjunta SES-SMA-SSRH', 'Resolução SMA-SS',
  // Tipos específicos do Estado do Rio Grande do Sul
  'Decisão Normativa DAER', 'Decisão Normativa DAER RS', 'Decisão Normativa DAER RS DAER',
  'Decisão Normativa', 'Decisão',
  'Instrução Normativa CBMRS', 'Instrução Normativa CBMRS/DSPCI',
  'Portaria CBMRS', 'Resolução Técnica CBMRS', 'Resolução Técnica CBM',
  'Resolução Técnica CBM de Transição CBMRS',
  'Diretriz Técnica FEPAM', 'Portaria FEPAM', 'Resolução FEPAM',
  'Instrução Normativa DRH', 'Portaria DRH',
  'Resolução CONSEMA RS', 'Portaria SEMA RS'
];

export const VALID_JURISDICTIONS = ['federal', 'estadual', 'municipal', 'nbr', 'internacional'];

export const VALID_APPLICABILITIES = ['real', 'potential', 'na', 'revoked', 'pending'];

export const VALID_STATUSES = ['conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'na', 'pending', 'parcial'];

export const COMMON_ISSUING_BODIES = [
  'IBAMA', 'CONAMA', 'MMA', 'MTE', 'ANP', 'ANVISA', 'CETESB', 'ABNT',
  'Presidência da República', 'Ministério do Trabalho', 'Ministério do Meio Ambiente'
];

// ============= Helpers =============

// Find the sheet containing legislations (for multi-sheet files like FPLAN)
function findLegislationsSheet(workbook: XLSX.WorkBook): string {
  // Try to find sheet that contains legislation headers
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet['!ref']) continue;
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Scan first 15 rows for header patterns
    for (let row = 0; row <= Math.min(range.e.r, 15); row++) {
      const values: string[] = [];
      for (let col = range.s.c; col <= Math.min(range.e.c, 30); col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell?.v) values.push(String(cell.v).toUpperCase().trim());
      }
      
      // Check for Gabardo FPLAN format patterns
      const hasTipo = values.some(v => v === 'TIPO' || v.includes('TIPO DE NORMA'));
      const hasNumero = values.some(v => v === 'Nº' || v === 'N°' || v === 'NÚMERO' || v === 'NUMERO');
      const hasTematica = values.some(v => v.includes('TEMÁTICA') || v.includes('TEMATICA'));
      const hasResumo = values.some(v => v.includes('RESUMO') || v.includes('TÍTULO'));
      const hasData = values.some(v => v.includes('DATA') && v.includes('PUBLICAÇÃO'));
      
      // If we find key columns, this is the correct sheet
      if ((hasTipo && hasNumero) || (hasTematica && hasResumo) || (hasTipo && hasData)) {
        console.log(`[findLegislationsSheet] Found legislation sheet: "${sheetName}" at row ${row}`);
        return sheetName;
      }
    }
  }
  
  // Fallback: first sheet
  console.log(`[findLegislationsSheet] Using fallback: first sheet "${workbook.SheetNames[0]}"`);
  return workbook.SheetNames[0];
}

function findHeaderRow(worksheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let row = range.s.r; row <= Math.min(range.e.r, 15); row++) {
    const cellValues: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        cellValues.push(String(cell.v).toUpperCase().trim());
      }
    }
    
    // Original patterns
    const hasTipoNorma = cellValues.some(v => v.includes('TIPO') && v.includes('NORMA'));
    const hasTitulo = cellValues.some(v => v.includes('TÍTULO') || v.includes('TITULO') || v.includes('EMENTA'));
    const hasJurisdicao = cellValues.some(v => v.includes('JURISD'));
    
    // NEW: Gabardo FPLAN format patterns
    const hasTipoSimples = cellValues.some(v => v === 'TIPO');
    const hasNumero = cellValues.some(v => v === 'Nº' || v === 'N°' || v === 'NUMERO' || v === 'NÚMERO');
    const hasTematica = cellValues.some(v => v.includes('TEMÁTICA') || v.includes('TEMATICA'));
    const hasResumoTitulo = cellValues.some(v => v.includes('RESUMO E TÍTULO') || v.includes('RESUMO'));
    const hasDataPublicacao = cellValues.some(v => v.includes('DATA') && v.includes('PUBLICAÇÃO'));
    
    // Expanded condition
    const hasOriginalPattern = (hasTipoNorma || hasTitulo) && (hasTitulo || hasJurisdicao);
    const hasGabardoPattern = (hasTipoSimples && hasNumero && hasTematica) || 
                              (hasTematica && hasResumoTitulo) ||
                              (hasTipoSimples && hasDataPublicacao);
    
    if (hasOriginalPattern || hasGabardoPattern) {
      console.log(`[findHeaderRow] Found header at row ${row}, columns: ${cellValues.slice(0, 10).join(', ')}`);
      return row;
    }
  }
  
  return 0;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  // DD/MM/YYYY format (formato brasileiro)
  const brMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // MM/DD/YY formato americano curto (ex: 4/14/86)
  const usShortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usShortMatch) {
    const [, month, day, year] = usShortMatch;
    // Converter ano de 2 dígitos para 4 dígitos
    const yearNum = parseInt(year);
    const fullYear = yearNum > 50 ? `19${year.padStart(2, '0')}` : `20${year.padStart(2, '0')}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try Date parsing
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  
  return '';
}

function normalizeJurisdiction(value: string, uf?: string): string {
  const normalized = value.toLowerCase().trim();
  
  // Variações de federal (incluindo "FEDERAIS" do formato Gabardo)
  if (normalized.includes('federal') || normalized === 'federais') return 'federal';
  if (normalized.includes('estadual')) return 'estadual';
  if (normalized.includes('municipal')) return 'municipal';
  if (normalized.includes('nbr') || normalized.includes('abnt')) return 'nbr';
  if (normalized.includes('internac')) return 'internacional';
  
  // Detectar internacional pelo UF (MERCOSUL, países, etc.)
  if (uf) {
    const ufNorm = uf.toLowerCase();
    if (ufNorm.includes('mercosul') || ufNorm.includes('países') || ufNorm.includes('paises')) {
      return 'internacional';
    }
  }
  
  return normalized;
}

function normalizeApplicability(value: string): string {
  // Remove acentos e normaliza para comparação
  const normalized = value.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (normalized.includes('real') || normalized === 'aplicavel') return 'real';
  if (normalized.includes('potenc')) return 'potential'; // Captura "potencial" e "potêncial" (com erro)
  if (normalized === 'na' || normalized === 'n.a' || normalized.includes('nao aplicavel')) return 'na';
  if (normalized.includes('revog')) return 'revoked';
  return 'pending';
}

function normalizeStatus(value: string): string {
  const normalized = value.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // "OK" e "CONFORME" do formato Gabardo
  if (normalized === 'ok' || normalized.includes('conforme') || normalized.includes('atendido')) return 'conforme';
  if (normalized.includes('conhec')) return 'para_conhecimento';
  if (normalized.includes('adequ')) return 'adequacao';
  if (normalized.includes('plano') || normalized.includes('acao') || normalized.includes('açao')) return 'plano_acao';
  if (normalized === 'na' || normalized === 'n.a') return 'na';
  // Novos status do formato NBR/Internacional
  if (normalized.includes('parcial') || normalized.includes('atencao') || normalized === 'atenção') return 'parcial';
  // Tratar "FALSE" como N/A (formato SP)
  if (normalized === 'false') return 'na';
  return 'pending';
}

// Normalizar número da norma (corrigir vírgulas do Excel)
function normalizeNormNumber(value: string): string {
  if (!value) return '';
  
  let normalized = value.trim();
  
  // Remover underscore ou traço que indica ausência de número
  if (normalized === '_' || normalized === '-') return '';
  
  // Se tem vírgula e parece ser número com separador de milhar
  // Exemplos: "15,726" → "15.726", "23,430" → "23.430"
  if (/^\d{1,3},\d{3}$/.test(normalized)) {
    normalized = normalized.replace(',', '.');
  }
  
  // Para números menores também (ex: "9,516" → "9.516")
  if (/^\d+,\d+$/.test(normalized)) {
    normalized = normalized.replace(',', '.');
  }
  
  return normalized;
}

// Limpar tags HTML de campos de texto (formato RS)
function cleanHtmlFromText(text: string): string {
  if (!text) return '';
  
  // Substituir <br/> e <br> por espaço
  let cleaned = text.replace(/<br\s*\/?>/gi, ' ');
  
  // Remover outras tags HTML se houver
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Normalizar espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Tratar subtemas com tags HTML (ex: "subtema1<br/>subtema2")
function parseSubtheme(value: string): string {
  if (!value) return '';
  
  // Remover tags HTML e pegar primeiro item
  const cleaned = value.replace(/<br\s*\/?>/gi, '|');
  const items = cleaned.split('|').map(s => s.trim()).filter(Boolean);
  
  return items[0] || value;
}

// Parse múltiplos municípios (formato SP)
function parseMunicipality(municipalityValue: string): { 
  municipality: string; 
  municipalitiesList: string; 
} {
  if (!municipalityValue) return { municipality: '', municipalitiesList: '' };
  
  // Se contém vírgulas, são múltiplos municípios
  if (municipalityValue.includes(',')) {
    const municipalities = municipalityValue.split(',').map(s => s.trim()).filter(Boolean);
    // Retornar o primeiro município e a lista completa
    return { 
      municipality: municipalities[0], 
      municipalitiesList: municipalityValue 
    };
  }
  
  return { municipality: municipalityValue.trim(), municipalitiesList: '' };
}

function parseState(stateValue: string): { state: string; statesList: string; isInternational: boolean } {
  if (!stateValue) return { state: '', statesList: '', isInternational: false };
  
  // Detectar UF internacional (MERCOSUL, países, etc.)
  const normalized = stateValue.toLowerCase();
  if (normalized.includes('mercosul') || normalized.includes('países') || normalized.includes('paises') || normalized.includes('associados')) {
    return { 
      state: '', 
      statesList: stateValue, 
      isInternational: true 
    };
  }
  
  // Se contém vírgulas, são múltiplos estados
  if (stateValue.includes(',')) {
    const states = stateValue.split(',').map(s => s.trim()).filter(Boolean);
    // Se são muitos estados (provavelmente todos), não preencher UF individual
    if (states.length > 20) {
      return { state: '', statesList: stateValue, isInternational: false };
    }
    // Retornar o primeiro estado e a lista completa
    return { state: states[0], statesList: stateValue, isInternational: false };
  }
  
  return { state: stateValue.trim(), statesList: '', isInternational: false };
}

function getColumnValue(row: any, ...possibleNames: string[]): string {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }
  return '';
}

// ============= Unit Detection & Mapping =============

// Known unit codes from Gabardo format
const KNOWN_UNIT_CODES = ['POA', 'PIR', 'GO', 'PREAL', 'SBC', 'SJP', 'DUC', 'IRA', 'SC', 'ES', 'CE', 'CHUÍ', 'CHUI', 'BA', 'PE', 'RJ'];

// Detect unit columns from headers
export function detectUnitColumns(headers: string[]): string[] {
  return headers.filter(h => {
    const normalized = h.toUpperCase().trim();
    // Match known codes or short uppercase codes
    return KNOWN_UNIT_CODES.includes(normalized) || 
           (normalized.length <= 6 && /^[A-Z]{2,6}$/.test(normalized) && 
            !['UF', 'ID', 'URL', 'OK', 'NA', 'NR', 'NBR'].includes(normalized));
  });
}

// Map unit value (1, 2, 3, x, z) to applicability and status
// 1 = Real (Aplicável), 2 = Potencial (Provável), 3 = Pendente (Não avaliada)
export function mapUnitValue(value: string): UnitEvaluation | null {
  if (!value) return null;
  
  const normalized = String(value).trim().toLowerCase();
  
  switch (normalized) {
    case '1':
      // Real (Aplicável) - status de conformidade será avaliado separadamente
      return { 
        unitCode: '', 
        value: '1', 
        applicability: 'real', 
        complianceStatus: 'pending' 
      };
    case '2':
      // Potencial (Provável)
      return { 
        unitCode: '', 
        value: '2', 
        applicability: 'potential', 
        complianceStatus: 'pending' 
      };
    case '3':
      // Pendente (Não avaliada)
      return { 
        unitCode: '', 
        value: '3', 
        applicability: 'pending', 
        complianceStatus: 'pending' 
      };
    case 'x':
      // S/AV (Sem Avaliação) - também pendente
      return { 
        unitCode: '', 
        value: 'x', 
        applicability: 'pending', 
        complianceStatus: 'pending' 
      };
    case 'z':
      // n/p (Não Presente) - ignore
      return null;
    default:
      // Unknown value - ignore
      return null;
  }
}

// ============= Main Functions =============

export interface ParseLegislationResult {
  legislations: ParsedLegislation[];
  detectedUnitColumns: string[];
}

export async function parseLegislationExcel(file: File): Promise<ParsedLegislation[]> {
  const result = await parseLegislationExcelWithUnits(file);
  return result.legislations;
}

export async function parseLegislationExcelWithUnits(file: File): Promise<ParseLegislationResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // NEW: Find the correct sheet with legislations
        const sheetName = findLegislationsSheet(workbook);
        const worksheet = workbook.Sheets[sheetName];
        
        console.log(`[parseLegislationExcelWithUnits] Using sheet: "${sheetName}" from ${workbook.SheetNames.length} sheets`);
        
        const headerRow = findHeaderRow(worksheet);
        console.log(`[parseLegislationExcelWithUnits] Header found at row: ${headerRow}`);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          range: headerRow
        });
        
        console.log(`[parseLegislationExcelWithUnits] Parsed ${jsonData.length} rows`);
        
        // Get headers from first data row to detect unit columns
        const firstRow = jsonData[0] as any;
        const headers = firstRow ? Object.keys(firstRow) : [];
        console.log(`[parseLegislationExcelWithUnits] Headers: ${headers.slice(0, 15).join(', ')}`);
        const detectedUnitColumns = detectUnitColumns(headers);
        
        const legislations: ParsedLegislation[] = jsonData.map((row: any, index) => {
          const jurisdictionRaw = getColumnValue(row, 'Jurisdição', 'Jurisdicao', 'JURISDIÇÃO', 'JURISDICAO');
          const applicabilityRaw = getColumnValue(row, 'Aplicabilidade', 'APLICABILIDADE');
          // Suporta duas colunas de status do formato Gabardo
          const statusRaw = getColumnValue(row, 'Status', 'STATUS', 'Situação', 'SITUAÇÃO', 'status');
          const reviewDaysRaw = getColumnValue(row, 'Frequência Revisão (dias)', 'Frequência Revisão', 'Revisão', 'REVISÃO');
          
          // Campos extras do formato Gabardo (limpar HTML do formato RS)
          const complianceDetails = cleanHtmlFromText(getColumnValue(row, 
            'Observações como é atendido', 'OBSERVAÇÕES COMO É ATENDIDO',
            'Como é atendido', 'COMO É ATENDIDO', 'Compliance'
          ));
          const generalNotes = getColumnValue(row, 
            'Observaçãoes gerais, envios datas e responsáveis', 
            'Observações gerais, envios datas e responsáveis',
            'OBSERVAÇÕES GERAIS', 'Observações gerais', 
            'Notas gerais', 'Responsáveis'
          );
          
          // Parse múltiplos estados e detectar internacional
          const stateRaw = getColumnValue(row, 'UF', 'Estado', 'ESTADO');
          const { state, statesList, isInternational } = parseState(stateRaw);
          
          // Determinar jurisdição (passando UF para detectar internacional)
          let jurisdiction = normalizeJurisdiction(jurisdictionRaw, stateRaw);
          if (isInternational && !jurisdiction.includes('internacional')) {
            jurisdiction = 'internacional';
          }
          
          // Parse subtema (remover tags HTML se houver)
          const subthemeRaw = getColumnValue(row, 'Subtema', 'SUBTEMA');
          const subthemeName = parseSubtheme(subthemeRaw);
          
          // Normalizar número da norma (corrigir vírgulas do Excel)
          // NEW: Added 'Nº' and 'N°' for Gabardo format
          const normNumberRaw = getColumnValue(row, 'Número', 'Numero', 'NÚMERO', 'NUMERO', 'Nº', 'N°');
          const normNumber = normalizeNormNumber(normNumberRaw);
          
          // Parse múltiplos municípios (formato SP)
          const municipalityRaw = getColumnValue(row, 'Município', 'Municipio', 'MUNICÍPIO', 'MUNICIPIO', 'Cidade', 'CIDADE');
          const { municipality, municipalitiesList } = parseMunicipality(municipalityRaw);
          
          // Parse unit evaluations from detected columns
          const unitEvaluations: UnitEvaluation[] = [];
          for (const unitCol of detectedUnitColumns) {
            const cellValue = row[unitCol];
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              const evaluation = mapUnitValue(String(cellValue));
              if (evaluation) {
                evaluation.unitCode = unitCol.toUpperCase();
                unitEvaluations.push(evaluation);
              }
            }
          }
          
          // NEW: Get title from multiple possible column names including Gabardo format
          const title = getColumnValue(row, 
            'Título/Ementa', 'Título', 'Titulo', 'Ementa', 
            'TÍTULO', 'TITULO', 'EMENTA',
            'RESUMO E TÍTULO', 'Resumo e Título', 'RESUMO E TITULO'
          );
          
          // NEW: Get theme from multiple possible column names including Gabardo format  
          const themeName = getColumnValue(row, 
            'Macrotema', 'Tema', 'MACROTEMA', 'TEMA',
            'TEMÁTICA', 'Temática', 'TEMATICA', 'Tematica'
          );
          
          // NEW: Get publication date from multiple possible column names
          const publicationDate = parseDate(getColumnValue(row, 
            'Data Publicação', 'Data de Publicação', 'Publicação', 'DATA PUBLICAÇÃO',
            'DATA DA PUBLICAÇÃO', 'Data da Publicação', 'DATA DA PUBLICACAO'
          ));
          
          // NEW: Get URL from multiple possible column names including Gabardo format
          const fullTextUrl = getColumnValue(row, 
            'URL Texto Integral', 'URL', 'Link', 'LINK',
            'FONTE', 'Fonte', 'URL TEXTO INTEGRAL'
          );
          
          // NEW: Get evidence from multiple possible column names
          const evidenceText = getColumnValue(row, 
            'Evidências', 'Evidencias', 'EVIDÊNCIAS', 'EVIDENCIAS',
            'EVIDÊNCIA DE ATENDIMENTO', 'Evidência de Atendimento'
          );
          
          // NEW: Get status from multiple possible column names including Gabardo format
          const statusFromAtendimento = getColumnValue(row, 'ATENDIMENTO', 'Atendimento');
          const finalStatus = statusRaw || statusFromAtendimento;
          
          return {
            rowNumber: headerRow + index + 2,
            norm_type: getColumnValue(row, 'Tipo de Norma', 'Tipo', 'TIPO DE NORMA', 'TIPO'),
            norm_number: normNumber,
            title,
            summary: cleanHtmlFromText(getColumnValue(row, 'Resumo', 'RESUMO', 'Descrição', 'DESCRIÇÃO')),
            issuing_body: getColumnValue(row, 'Órgão Emissor', 'Orgão Emissor', 'Órgão', 'ÓRGÃO EMISSOR', 'ÓRGÃO'),
            publication_date: publicationDate,
            jurisdiction,
            state,
            municipality,
            theme_name: themeName,
            subtheme_name: subthemeName,
            overall_applicability: normalizeApplicability(applicabilityRaw),
            overall_status: normalizeStatus(finalStatus),
            full_text_url: fullTextUrl,
            review_frequency_days: parseInt(reviewDaysRaw) || 365,
            observations: getColumnValue(row, 'Observações', 'Observacoes', 'OBSERVAÇÕES', 'OBSERVACOES', 'Notas', 'NOTAS'),
            evidence_text: evidenceText,
            // Campos extras
            compliance_details: complianceDetails,
            general_notes: generalNotes,
            states_list: statesList,
            municipalities_list: municipalitiesList,
            // Avaliações por unidade
            unitEvaluations,
          };
        });
        
        // Filter out completely empty rows
        const filtered = legislations.filter(leg => leg.title || leg.norm_type || leg.norm_number);
        
        resolve({ legislations: filtered, detectedUnitColumns });
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
}

export async function validateLegislations(
  legislations: ParsedLegislation[],
  companyId: string
): Promise<LegislationValidation[]> {
  // Check existing legislations
  const { data: existingLegislations } = await supabase
    .from('legislations')
    .select('title, norm_number')
    .eq('company_id', companyId);
  
  const existingSet = new Set(
    (existingLegislations || []).map(l => `${l.title?.toLowerCase()}|${l.norm_number?.toLowerCase()}`)
  );
  
  return legislations.map(leg => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required: norm_type
    if (!leg.norm_type) {
      errors.push('Tipo de Norma é obrigatório');
    } else {
      // Verificar se o tipo é reconhecido (busca flexível)
      const normTypeNormalized = leg.norm_type.toLowerCase().trim();
      const isRecognized = VALID_NORM_TYPES.some(t => 
        t.toLowerCase() === normTypeNormalized || 
        normTypeNormalized.includes(t.toLowerCase()) ||
        t.toLowerCase().includes(normTypeNormalized)
      );
      if (!isRecognized) {
        warnings.push(`Tipo de Norma "${leg.norm_type}" não padrão (será importado como está)`);
      }
    }
    
    // Required: title
    if (!leg.title || leg.title.length < 5) {
      errors.push('Título/Ementa é obrigatório (mínimo 5 caracteres)');
    }
    
    // Required: jurisdiction
    if (!leg.jurisdiction) {
      errors.push('Jurisdição é obrigatória');
    } else if (!VALID_JURISDICTIONS.includes(leg.jurisdiction)) {
      errors.push(`Jurisdição "${leg.jurisdiction}" inválida. Use: ${VALID_JURISDICTIONS.join(', ')}`);
    }
    
    // Conditional: state for estadual/municipal (flexibilizado para quando tem states_list)
    if ((leg.jurisdiction === 'estadual' || leg.jurisdiction === 'municipal') && !leg.state && !leg.states_list) {
      errors.push('UF é obrigatório para legislações estaduais/municipais');
    }
    
    // Conditional: municipality for municipal
    if (leg.jurisdiction === 'municipal' && !leg.municipality) {
      warnings.push('Município recomendado para legislações municipais');
    }
    
    // Validate URL format
    if (leg.full_text_url && !leg.full_text_url.match(/^https?:\/\/.+/)) {
      warnings.push('URL do texto integral parece inválida');
    }
    
    // Check duplicates
    const key = `${leg.title?.toLowerCase()}|${leg.norm_number?.toLowerCase()}`;
    if (existingSet.has(key)) {
      warnings.push('Legislação com mesmo título/número já existe');
    }
    
    return {
      rowNumber: leg.rowNumber,
      title: leg.title || '(sem título)',
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  });
}

export async function importLegislations(
  legislations: ParsedLegislation[],
  options: {
    skipExisting: boolean;
    createMissingThemes: boolean;
    unitMappings?: UnitMapping[];  // NEW: mappings for unit columns
    onProgress?: (progress: LegislationImportProgress) => void;
  } = { skipExisting: true, createMissingThemes: true }
): Promise<LegislationImportResult> {
  const result: LegislationImportResult = {
    success: true,
    imported: 0,
    updated: 0,
    evidencesAdded: 0,
    unitCompliancesCreated: 0,
    errors: 0,
    warnings: 0,
    details: [],
    createdEntities: {
      themes: [],
      subthemes: [],
    },
    unitsByBranch: {},
  };
  
  try {
    const { profile } = await formErrorHandler.checkAuth();
    const companyId = profile.company_id;
    
    // Get existing themes and subthemes
    const { data: existingThemes } = await supabase
      .from('legislation_themes')
      .select('id, name')
      .eq('company_id', companyId);
    
    const themeMap = new Map((existingThemes || []).map(t => [t.name.toLowerCase(), t.id]));
    
    // Get existing legislations for duplicate check (incluindo ID para conciliação)
    const { data: existingLegislations } = await supabase
      .from('legislations')
      .select('id, title, norm_type, norm_number')
      .eq('company_id', companyId);
    
    // Map para encontrar legislações existentes por chave
    const existingMap = new Map<string, { id: string; title: string }>();
    (existingLegislations || []).forEach(l => {
      // Chave primária: norm_type + norm_number
      if (l.norm_type && l.norm_number) {
        const key = `${l.norm_type.toLowerCase()}|${l.norm_number.toLowerCase()}`;
        existingMap.set(key, { id: l.id, title: l.title });
      }
      // Chave secundária: título (fallback)
      if (l.title) {
        const titleKey = `title:${l.title.toLowerCase()}`;
        if (!existingMap.has(titleKey)) {
          existingMap.set(titleKey, { id: l.id, title: l.title });
        }
      }
    });
    
    // Nota: existingMap é utilizado para conciliação de legislações
    
    // Subtheme map by theme_id
    const subthemeMap = new Map<string, Map<string, string>>();
    
    options.onProgress?.({
      current: 0,
      total: legislations.length,
      percentage: 0,
      stage: 'preparing'
    });
    
    for (let index = 0; index < legislations.length; index++) {
      const leg = legislations[index];
      
      if (options.onProgress && (index % 3 === 0 || index === legislations.length - 1)) {
        options.onProgress({
          current: index + 1,
          total: legislations.length,
          percentage: Math.round(((index + 1) / legislations.length) * 100),
          currentLegislation: leg.title?.substring(0, 50),
          stage: 'importing'
        });
      }
      
      try {
        // Validate required fields
        if (!leg.norm_type || !leg.title || !leg.jurisdiction) {
          result.errors++;
          result.details.push({
            rowNumber: leg.rowNumber,
            title: leg.title || '(sem título)',
            status: 'error',
            message: 'Campos obrigatórios faltando: Tipo, Título ou Jurisdição',
          });
          continue;
        }
        
        // Check for existing legislation (conciliação)
        // Primeiro tenta por norm_type + norm_number, depois por título
        let existingLegislation: { id: string; title: string } | null = null;
        
        if (leg.norm_type && leg.norm_number) {
          const typeNumberKey = `${leg.norm_type.toLowerCase()}|${leg.norm_number.toLowerCase()}`;
          existingLegislation = existingMap.get(typeNumberKey) || null;
        }
        
        if (!existingLegislation && leg.title) {
          const titleKey = `title:${leg.title.toLowerCase()}`;
          existingLegislation = existingMap.get(titleKey) || null;
        }
        
        // Se encontrou legislação existente, adicionar evidência e unit compliance
        if (existingLegislation) {
          let evidenceMessage = '';
          let unitComplianceMessage = '';
          
          // Adicionar evidência se houver
          if (leg.evidence_text && leg.evidence_text.trim()) {
            const { error: evidenceError } = await supabase
              .from('legislation_evidences')
              .insert({
                legislation_id: existingLegislation.id,
                company_id: companyId,
                title: 'Evidência importada via planilha',
                description: leg.evidence_text.trim(),
                type: 'documento',
                uploaded_by: profile.id
              });
            
            if (!evidenceError) {
              result.evidencesAdded++;
              evidenceMessage = ' + evidência adicionada';
            }
          }
          
          // NOVO: Criar/atualizar unit compliance para legislação existente
          if (options.unitMappings && leg.unitEvaluations && leg.unitEvaluations.length > 0) {
            const complianceRecords: Array<{
              legislation_id: string;
              branch_id: string;
              company_id: string;
              applicability: string;
              compliance_status: string;
              evidence_notes: string | null;
              evaluated_at: string;
              evaluated_by: string;
            }> = [];
            
            for (const evaluation of leg.unitEvaluations) {
              const mapping = options.unitMappings.find(m => 
                m.excelCode.toUpperCase() === evaluation.unitCode.toUpperCase()
              );
              
              if (mapping?.branchId) {
                complianceRecords.push({
                  legislation_id: existingLegislation.id,
                  branch_id: mapping.branchId,
                  company_id: companyId,
                  applicability: evaluation.applicability,
                  compliance_status: evaluation.complianceStatus,
                  evidence_notes: leg.evidence_text?.trim() || null,
                  evaluated_at: new Date().toISOString(),
                  evaluated_by: profile.id,
                });
                
                const branchName = mapping.branchName || mapping.excelCode;
                result.unitsByBranch[branchName] = (result.unitsByBranch[branchName] || 0) + 1;
              }
            }
            
            if (complianceRecords.length > 0) {
              const { error: complianceError } = await supabase
                .from('legislation_unit_compliance')
                .upsert(complianceRecords, { onConflict: 'legislation_id,branch_id' });
              
              if (!complianceError) {
                result.unitCompliancesCreated += complianceRecords.length;
                unitComplianceMessage = ` + ${complianceRecords.length} avaliação(ões) por unidade`;
              } else {
                console.error('Erro ao atualizar unit compliance:', complianceError);
              }
            }
          }
          
          // Registrar resultado
          if (evidenceMessage || unitComplianceMessage) {
            result.updated++;
            result.details.push({
              rowNumber: leg.rowNumber,
              title: leg.title,
              status: 'updated',
              message: 'Legislação atualizada' + evidenceMessage + unitComplianceMessage,
            });
          } else {
            result.warnings++;
            result.details.push({
              rowNumber: leg.rowNumber,
              title: leg.title,
              status: 'warning',
              message: 'Legislação já existe - sem dados para atualizar',
            });
          }
          continue;
        }
        
        // Handle theme
        let themeId: string | null = null;
        if (leg.theme_name && options.createMissingThemes) {
          const themeKey = leg.theme_name.toLowerCase();
          if (!themeMap.has(themeKey)) {
            const { data: newTheme, error: themeError } = await supabase
              .from('legislation_themes')
              .insert({
                company_id: companyId,
                name: leg.theme_name,
                description: `Tema criado via importação`
              })
              .select('id')
              .single();
            
            if (!themeError && newTheme) {
              themeMap.set(themeKey, newTheme.id);
              result.createdEntities.themes.push(leg.theme_name);
            }
          }
          themeId = themeMap.get(themeKey) || null;
        } else if (leg.theme_name) {
          themeId = themeMap.get(leg.theme_name.toLowerCase()) || null;
        }
        
        // Handle subtheme
        let subthemeId: string | null = null;
        if (leg.subtheme_name && themeId && options.createMissingThemes) {
          if (!subthemeMap.has(themeId)) {
            const { data: existingSubthemes } = await supabase
              .from('legislation_subthemes')
              .select('id, name')
              .eq('theme_id', themeId);
            
            subthemeMap.set(themeId, new Map((existingSubthemes || []).map(s => [s.name.toLowerCase(), s.id])));
          }
          
          const themeSubthemes = subthemeMap.get(themeId)!;
          const subthemeKey = leg.subtheme_name.toLowerCase();
          
          if (!themeSubthemes.has(subthemeKey)) {
            const { data: newSubtheme, error: subthemeError } = await supabase
              .from('legislation_subthemes')
              .insert({
                theme_id: themeId,
                company_id: companyId,
                name: leg.subtheme_name,
                description: `Subtema criado via importação`
              })
              .select('id')
              .single();
            
            if (!subthemeError && newSubtheme) {
              themeSubthemes.set(subthemeKey, newSubtheme.id);
              result.createdEntities.subthemes.push(leg.subtheme_name);
            }
          }
          subthemeId = themeSubthemes.get(subthemeKey) || null;
        }
        
        // Insert legislation
        const { error: insertError } = await supabase
          .from('legislations')
          .insert({
            company_id: companyId,
            norm_type: leg.norm_type,
            norm_number: leg.norm_number || null,
            title: leg.title,
            summary: leg.summary || null,
            issuing_body: leg.issuing_body || null,
            publication_date: leg.publication_date || null,
            jurisdiction: leg.jurisdiction,
            state: leg.state || null,
            municipality: leg.municipality || null,
            theme_id: themeId,
            subtheme_id: subthemeId,
            overall_applicability: leg.overall_applicability || 'pending',
            overall_status: leg.overall_status || 'pending',
            full_text_url: leg.full_text_url || null,
            review_frequency_days: leg.review_frequency_days || 365,
            observations: leg.observations || null,
            // Campos extras do formato Gabardo
            compliance_details: leg.compliance_details || null,
            general_notes: leg.general_notes || null,
            states_list: leg.states_list || null,
            municipalities_list: leg.municipalities_list || null,
          });
        
        if (insertError) {
          throw insertError;
        }
        
        // Adicionar ao mapa para evitar duplicatas no mesmo lote
        if (leg.norm_type && leg.norm_number) {
          const newKey = `${leg.norm_type.toLowerCase()}|${leg.norm_number.toLowerCase()}`;
          existingMap.set(newKey, { id: 'new', title: leg.title });
        }
        
        result.imported++;
        
        // Buscar ID da legislação recém criada (needed for evidence and unit compliance)
        const { data: newLeg } = await supabase
          .from('legislations')
          .select('id')
          .eq('company_id', companyId)
          .eq('norm_type', leg.norm_type)
          .eq('title', leg.title)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        let evidenceMessage = '';
        let unitComplianceMessage = '';
        
        if (newLeg) {
          // Se nova legislação tem evidência, criar também
          if (leg.evidence_text && leg.evidence_text.trim()) {
            const { error: evidenceError } = await supabase
              .from('legislation_evidences')
              .insert({
                legislation_id: newLeg.id,
                company_id: companyId,
                title: 'Evidência importada via planilha',
                description: leg.evidence_text.trim(),
                type: 'documento',
                uploaded_by: profile.id
              });
            
            if (!evidenceError) {
              result.evidencesAdded++;
              evidenceMessage = ' + evidência';
            }
          }
          
          // Criar unit compliance para cada avaliação mapeada
          if (options.unitMappings && leg.unitEvaluations && leg.unitEvaluations.length > 0) {
            let unitCount = 0;
            const complianceRecords: Array<{
              legislation_id: string;
              branch_id: string;
              company_id: string;
              applicability: string;
              compliance_status: string;
              evidence_notes: string | null;
              evaluated_at: string;
              evaluated_by: string;
            }> = [];
            
            for (const evaluation of leg.unitEvaluations) {
              const mapping = options.unitMappings.find(m => 
                m.excelCode.toUpperCase() === evaluation.unitCode.toUpperCase()
              );
              
              if (mapping?.branchId) {
                complianceRecords.push({
                  legislation_id: newLeg.id,
                  branch_id: mapping.branchId,
                  company_id: companyId,
                  applicability: evaluation.applicability,
                  compliance_status: evaluation.complianceStatus,
                  evidence_notes: leg.evidence_text?.trim() || null,
                  evaluated_at: new Date().toISOString(),
                  evaluated_by: profile.id,
                });
                
                // Track by branch name
                const branchName = mapping.branchName || mapping.excelCode;
                result.unitsByBranch[branchName] = (result.unitsByBranch[branchName] || 0) + 1;
                unitCount++;
              }
            }
            
            // Batch insert compliance records
            if (complianceRecords.length > 0) {
              const { error: complianceError } = await supabase
                .from('legislation_unit_compliance')
                .upsert(complianceRecords, { onConflict: 'legislation_id,branch_id' });
              
              if (!complianceError) {
                result.unitCompliancesCreated += complianceRecords.length;
                unitComplianceMessage = ` + ${unitCount} unidade(s)`;
              }
            }
          }
        }
        
        result.details.push({
          rowNumber: leg.rowNumber,
          title: leg.title,
          status: 'success',
          message: 'Importado com sucesso' + evidenceMessage + unitComplianceMessage,
        });
        
      } catch (error) {
        result.errors++;
        result.details.push({
          rowNumber: leg.rowNumber,
          title: leg.title || '(sem título)',
          status: 'error',
          message: `Erro: ${(error as Error).message}`,
        });
      }
    }
    
    result.success = result.errors === 0;
    
    options.onProgress?.({
      current: legislations.length,
      total: legislations.length,
      percentage: 100,
      stage: 'finalizing'
    });
    
  } catch (error) {
    result.success = false;
    result.errors = legislations.length;
    result.details.push({
      rowNumber: 0,
      title: '',
      status: 'error',
      message: `Erro geral: ${(error as Error).message}`,
    });
  }
  
  return result;
}

export function downloadLegislationTemplate() {
  const templateData = [
    {
      'Tipo de Norma': 'Lei',
      'Número': '12.305/2010',
      'Título/Ementa': 'Política Nacional de Resíduos Sólidos',
      'Resumo': 'Institui a Política Nacional de Resíduos Sólidos',
      'Órgão Emissor': 'Presidência da República',
      'Data Publicação': '02/08/2010',
      'Jurisdição': 'federal',
      'UF': '',
      'Município': '',
      'Macrotema': 'Meio Ambiente',
      'Subtema': 'Resíduos Sólidos',
      'Aplicabilidade': 'real',
      'Status': 'conforme',
      'URL Texto Integral': 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm',
      'Frequência Revisão (dias)': '365',
      'Evidências': 'Licença ambiental emitida conforme requisitos',
    },
    {
      'Tipo de Norma': 'Resolução',
      'Número': '237/1997',
      'Título/Ementa': 'Licenciamento Ambiental - Etapas e Competências',
      'Resumo': 'Regulamenta os aspectos de licenciamento ambiental',
      'Órgão Emissor': 'CONAMA',
      'Data Publicação': '19/12/1997',
      'Jurisdição': 'federal',
      'UF': '',
      'Município': '',
      'Macrotema': 'Licenciamento',
      'Subtema': 'Procedimentos',
      'Aplicabilidade': 'real',
      'Status': 'adequacao',
      'URL Texto Integral': '',
      'Frequência Revisão (dias)': '180',
      'Evidências': 'Processo de adequação em andamento - prazo: 30/06/2026',
    },
    {
      'Tipo de Norma': 'NBR',
      'Número': '10004/2004',
      'Título/Ementa': 'Classificação de Resíduos Sólidos',
      'Resumo': 'Classifica os resíduos sólidos quanto aos riscos',
      'Órgão Emissor': 'ABNT',
      'Data Publicação': '31/05/2004',
      'Jurisdição': 'nbr',
      'UF': '',
      'Município': '',
      'Macrotema': 'Meio Ambiente',
      'Subtema': 'Resíduos Sólidos',
      'Aplicabilidade': 'potential',
      'Status': 'pending',
      'URL Texto Integral': '',
      'Frequência Revisão (dias)': '365',
      'Evidências': '',
    },
  ];
  
  const instructionSheet = [
    { 'Coluna': 'Tipo de Norma', 'Obrigatório': 'Sim', 'Valores Aceitos': VALID_NORM_TYPES.join(', ') },
    { 'Coluna': 'Número', 'Obrigatório': 'Não', 'Valores Aceitos': 'Texto livre (Ex: 12.305/2010)' },
    { 'Coluna': 'Título/Ementa', 'Obrigatório': 'Sim', 'Valores Aceitos': 'Texto livre (mínimo 5 caracteres)' },
    { 'Coluna': 'Resumo', 'Obrigatório': 'Não', 'Valores Aceitos': 'Texto livre' },
    { 'Coluna': 'Órgão Emissor', 'Obrigatório': 'Não', 'Valores Aceitos': COMMON_ISSUING_BODIES.join(', ') + ', ...' },
    { 'Coluna': 'Data Publicação', 'Obrigatório': 'Não', 'Valores Aceitos': 'DD/MM/AAAA ou AAAA-MM-DD' },
    { 'Coluna': 'Jurisdição', 'Obrigatório': 'Sim', 'Valores Aceitos': VALID_JURISDICTIONS.join(', ') },
    { 'Coluna': 'UF', 'Obrigatório': 'Condicional', 'Valores Aceitos': 'Sigla do estado - obrigatório se estadual/municipal' },
    { 'Coluna': 'Município', 'Obrigatório': 'Condicional', 'Valores Aceitos': 'Nome - recomendado se municipal' },
    { 'Coluna': 'Macrotema', 'Obrigatório': 'Não', 'Valores Aceitos': 'Será criado automaticamente se não existir' },
    { 'Coluna': 'Subtema', 'Obrigatório': 'Não', 'Valores Aceitos': 'Será criado automaticamente se não existir' },
    { 'Coluna': 'Aplicabilidade', 'Obrigatório': 'Não', 'Valores Aceitos': VALID_APPLICABILITIES.join(', ') + ' (padrão: pending)' },
    { 'Coluna': 'Status', 'Obrigatório': 'Não', 'Valores Aceitos': VALID_STATUSES.join(', ') + ' (padrão: pending)' },
    { 'Coluna': 'URL Texto Integral', 'Obrigatório': 'Não', 'Valores Aceitos': 'URL válida começando com http:// ou https://' },
    { 'Coluna': 'Frequência Revisão (dias)', 'Obrigatório': 'Não', 'Valores Aceitos': 'Número inteiro (padrão: 365)' },
    { 'Coluna': 'Evidências', 'Obrigatório': 'Não', 'Valores Aceitos': 'Texto com evidências de conformidade (será adicionado à seção de evidências da legislação)' },
  ];
  
  const workbook = XLSX.utils.book_new();
  
  // Data sheet
  const dataSheet = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Legislações');
  
  // Instructions sheet
  const instructSheet = XLSX.utils.json_to_sheet(instructionSheet);
  XLSX.utils.book_append_sheet(workbook, instructSheet, 'Instruções');
  
  // Adjust column widths
  const colWidths = [
    { wch: 18 }, { wch: 15 }, { wch: 45 }, { wch: 40 },
    { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 5 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
    { wch: 15 }, { wch: 50 }, { wch: 20 }, { wch: 30 },
  ];
  dataSheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, 'template_importacao_legislacoes.xlsx');
}
