import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from '@/utils/formErrorHandler';
import { logger } from '@/utils/logger';

// ============= Types =============

// Unit evaluation from Excel column (POA, PIR, GO, etc.)
export interface UnitEvaluation {
  unitCode: string;      // POA, PIR, GO, etc.
  value: string;         // 1, 2, 3, x, z
  applicability: 'real' | 'potential' | 'na' | 'pending';
  complianceStatus: 'conforme' | 'adequacao' | 'plano_acao' | 'pending' | 'na';
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

// Unit mapping for import.
// Um mapping representa o destino de uma coluna da planilha.
// - branchId definido → avaliação vai para uma única filial.
// - propagateBranchIds definido → avaliação é replicada para todas as filiais
//   do UF `propagateState` (útil para colunas como SC, ES, CE que representam
//   estado inteiro quando há múltiplas filiais naquele UF).
// - ambos nulos → coluna ignorada no import.
export interface UnitMapping {
  excelCode: string;
  branchId: string | null;
  branchName?: string;
  autoMatched: boolean;
  propagateState?: string;
  propagateBranchIds?: string[];
  propagateBranchNames?: string[];
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
  unmatchedRows: ParsedLegislation[];     // Rows not found in DB (simplified format)
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

function extractNormTypeFromTitle(title: string): string {
  const patterns: [RegExp, string][] = [
    [/^Lei Complementar/i, 'Lei Complementar'],
    [/^Lei Federal/i, 'Lei'],
    [/^Lei Ordinária/i, 'Lei Ordinária'],
    [/^Lei\s/i, 'Lei'],
    [/^Decreto-Lei/i, 'Decreto-Lei'],
    [/^Decreto\s/i, 'Decreto'],
    [/^Resolução CONAMA/i, 'Resolução CONAMA'],
    [/^Resolução\s/i, 'Resolução'],
    [/^Portaria\s/i, 'Portaria'],
    [/^Instrução Normativa/i, 'Instrução Normativa'],
    [/^Norma Regulamentadora/i, 'Norma Regulamentadora'],
    [/^NR\s/i, 'NR'],
    [/^NBR\s/i, 'NBR'],
    [/^Constituição/i, 'Constituição Federal'],
    [/^Art\.?\s/i, 'Outros'],
    [/^Deliberação/i, 'Deliberação'],
    [/^Medida Provisória/i, 'Medida Provisória'],
    [/^Emenda Constitucional/i, 'Emenda Constitucional'],
  ];
  for (const [regex, type] of patterns) {
    if (regex.test(title)) return type;
  }
  return 'Outros';
}

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
        if (cell?.v) values.push(String(cell.v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim());
      }
      
      // Check for Gabardo FPLAN format patterns (accent-normalized)
      const hasTipo = values.some(v => v === 'TIPO' || v.includes('TIPO DE NORMA'));
      const hasNumero = values.some(v => v === 'N' || v === 'N°' || v === 'NUMERO');
      const hasTematica = values.some(v => v.includes('TEMATICA'));
      const hasResumo = values.some(v => v.includes('RESUMO') || v.includes('TITULO'));
      const hasData = values.some(v => v.includes('DATA') && v.includes('PUBLICACAO'));
      const hasAplicabilidade = values.some(v => v.includes('APLICABILIDADE'));
      
      // If we find key columns, this is the correct sheet
      if ((hasTipo && hasNumero) || (hasTematica && hasResumo) || (hasTipo && hasData) || (hasResumo && hasAplicabilidade)) {
        logger.debug(`Found legislation sheet: "${sheetName}" at row ${row}`, 'import');
        return sheetName;
      }
    }
  }
  
  // Fallback: first sheet
  logger.debug(`Using fallback: first sheet "${workbook.SheetNames[0]}"`, 'import');
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
        cellValues.push(String(cell.v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim());
      }
    }
    
    // Original patterns (accent-normalized)
    const hasTipoNorma = cellValues.some(v => v.includes('TIPO') && v.includes('NORMA'));
    const hasTitulo = cellValues.some(v => v.includes('TITULO') || v.includes('EMENTA'));
    const hasJurisdicao = cellValues.some(v => v.includes('JURISD'));
    
    // Gabardo FPLAN format patterns (accent-normalized)
    const hasTipoSimples = cellValues.some(v => v === 'TIPO');
    const hasNumero = cellValues.some(v => v === 'N' || v === 'N°' || v === 'NUMERO');
    const hasTematica = cellValues.some(v => v.includes('TEMATICA'));
    const hasResumoTitulo = cellValues.some(v => v.includes('RESUMO E TITULO') || v.includes('RESUMO'));
    const hasDataPublicacao = cellValues.some(v => v.includes('DATA') && v.includes('PUBLICACAO'));
    const hasAplicabilidade = cellValues.some(v => v.includes('APLICABILIDADE'));
    
    // Expanded condition
    const hasOriginalPattern = (hasTipoNorma || hasTitulo) && (hasTitulo || hasJurisdicao);
    const hasGabardoPattern = (hasTipoSimples && hasNumero && hasTematica) || 
                              (hasTematica && hasResumoTitulo) ||
                              (hasTipoSimples && hasDataPublicacao) ||
                              (hasResumoTitulo && hasAplicabilidade);
    
    if (hasOriginalPattern || hasGabardoPattern) {
      logger.debug(`Found header at row ${row}, columns: ${cellValues.slice(0, 10).join(', ')}`, 'import');
      return row;
    }
  }
  
  return 0;
}

// Converte serial date do Excel (dias desde 1899-12-30) para ISO yyyy-mm-dd.
// Serial 1 = 1900-01-01, 73050 ≈ 2099-12-31. Aceita leis antigas (ex.: 12610 = 1934).
// Rejeita números 4-dígitos 1800..2100 que parecem "ano solto" (ex.: "1988"
// digitado sozinho na célula não é serial válido, são milênios deslocados).
function excelSerialToIso(serial: number): string {
  if (!Number.isFinite(serial)) return '';
  if (serial >= 1800 && serial <= 2100) return '';
  if (serial < 1 || serial > 73050) return '';
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  if (y < 1800 || y > 2100) return '';
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';

  // ISO yyyy-mm-dd (possivelmente com hora)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }

  // DD/MM/YYYY (formato brasileiro)
  const brMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // MM/DD/YY (americano curto, ex.: 4/14/86).
  // Desambigua século comparando com ano atual: se 20XX > ano atual, usa 19XX.
  const usShortMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (usShortMatch) {
    const [, month, day, year] = usShortMatch;
    const yearNum = parseInt(year);
    const currentYear = new Date().getUTCFullYear();
    const fullYear = (2000 + yearNum) > currentYear ? `19${year.padStart(2, '0')}` : `20${year.padStart(2, '0')}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Serial do Excel (ex.: "45572" = 2024-10-07). Alguns arquivos — sobretudo
  // planilhas sem fórmula — mantêm a data como número cru.
  if (/^\d+(\.\d+)?$/.test(dateStr.trim())) {
    const asSerial = excelSerialToIso(parseFloat(dateStr));
    if (asSerial) return asSerial;
    // Número fora da faixa de serial (ex.: ano solto "1988") — não temos
    // dia/mês, preferimos não inventar data a arriscar dado inválido.
    return '';
  }

  // Fallback: tenta parser nativo, mas só aceita resultado em faixa plausível.
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      if (y >= 1900 && y <= 2100) {
        return date.toISOString().split('T')[0];
      }
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

// Normalize string for accent-insensitive, case-insensitive matching
function normalizeKey(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getColumnValue(row: any, ...possibleNames: string[]): string {
  // Fast path: exact match
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }
  // Fallback: normalized matching (handles Unicode accent differences)
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);
    const matchingKey = rowKeys.find(k => normalizeKey(k) === normalizedName);
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  // Last resort: partial/contains matching
  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);
    const matchingKey = rowKeys.find(k =>
      normalizeKey(k).includes(normalizedName) || normalizedName.includes(normalizeKey(k))
    );
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  return '';
}

// ============= Unit Detection & Mapping =============

// Known unit codes from Gabardo format
const KNOWN_UNIT_CODES = ['POA', 'PIR', 'GO', 'PREAL', 'SBC', 'SJP', 'DUC', 'IRA', 'SC', 'ES', 'CE', 'CHUÍ', 'CHUI', 'BA', 'PE', 'RJ'];

// Detect unit columns. Primeiro filtra candidatos por header, depois (se houver
// dados) valida que os valores da coluna são majoritariamente 1/2/3/x/z — isso
// evita falsos positivos como TIPO, STATUS, FONTE que também têm header curto.
export function detectUnitColumns(headers: string[], rows: Record<string, unknown>[] = []): string[] {
  const normalizedCodes = KNOWN_UNIT_CODES.map(c => normalizeKey(c));
  const excludedCodes = [
    'uf', 'id', 'url', 'ok', 'na', 'nr', 'nbr',
    'tipo', 'status', 'fonte', 'data', 'tema', 'link', 'site',
    'texto', 'resumo', 'titulo', 'ementa', 'numero', 'descricao',
    'obs', 'notas', 'area', 'orgao',
  ];

  const candidates = headers.filter(h => {
    const nk = normalizeKey(h);
    const upper = nk.toUpperCase();
    if (excludedCodes.includes(nk)) return false;
    if (normalizedCodes.includes(nk)) return true;
    return upper.length <= 6 && /^[A-Z]{2,6}$/.test(upper);
  });

  if (rows.length === 0) return candidates;

  // Valida por amostra de dados: ≥70% dos valores não-vazios precisam ser unit-like.
  return candidates.filter(col => {
    let total = 0;
    let unitLike = 0;
    for (const row of rows) {
      const v = row[col];
      if (v === undefined || v === null || v === '') continue;
      total++;
      const s = String(v).trim().toLowerCase();
      if (s === '1' || s === '2' || s === '3' || s === 'x' || s === 'z') unitLike++;
    }
    return total >= 3 && unitLike / total >= 0.7;
  });
}

// Map unit value (1, 2, 3, x, z) to applicability and status.
// Semântica da planilha Gabardo:
//   1 = Não Aplicável (N/A)
//   2 = OK / Conforme
//   3 = Precisa de Plano de Ação
//   x = Sem Avaliação
//   z = Não Pertinente à unidade
export function mapUnitValue(value: string): UnitEvaluation | null {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();

  switch (normalized) {
    case '1':
      return {
        unitCode: '',
        value: '1',
        applicability: 'na',
        complianceStatus: 'na',
      };
    case '2':
      return {
        unitCode: '',
        value: '2',
        applicability: 'real',
        complianceStatus: 'conforme',
      };
    case '3':
      return {
        unitCode: '',
        value: '3',
        applicability: 'real',
        complianceStatus: 'plano_acao',
      };
    case 'x':
      return {
        unitCode: '',
        value: 'x',
        applicability: 'pending',
        complianceStatus: 'pending',
      };
    case 'z':
      return {
        unitCode: '',
        value: 'z',
        applicability: 'na',
        complianceStatus: 'na',
      };
    default:
      return null;
  }
}

// ============= Main Functions =============

export interface ParseLegislationResult {
  legislations: ParsedLegislation[];
  detectedUnitColumns: string[];
  hasExplicitNormTypeColumn: boolean;
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
        
        logger.debug(`Using sheet: "${sheetName}" from ${workbook.SheetNames.length} sheets`, 'import');
        
        const headerRow = findHeaderRow(worksheet);
        logger.debug(`Header found at row: ${headerRow}`, 'import');
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          range: headerRow
        });
        
        logger.debug(`Parsed ${jsonData.length} rows`, 'import');
        
        // Get headers from first data row to detect unit columns
        const firstRow = jsonData[0] as any;
        const headers = firstRow ? Object.keys(firstRow) : [];
        logger.debug(`Headers: ${headers.slice(0, 15).join(', ')}`, 'import');
        const detectedUnitColumns = detectUnitColumns(headers, jsonData as Record<string, unknown>[]);
        
        // Detect if spreadsheet has an explicit norm_type column
        const headersNormalized = headers.map(h => h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim());
        const hasExplicitNormTypeColumn = headersNormalized.some(h => 
          h === 'TIPO' || h === 'TIPO DE NORMA' || h.includes('TIPO DE NORMA')
        );
        
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
          
          // NEW: Get URL from multiple possible column names including Gabardo format.
          // Se veio um domínio solto (www.foo.br...), prefixa https:// para virar
          // URL válida — comum quando o usuário cola só o domínio na planilha.
          let fullTextUrl = getColumnValue(row,
            'URL Texto Integral', 'URL', 'Link', 'LINK',
            'FONTE', 'Fonte', 'URL TEXTO INTEGRAL'
          );
          if (fullTextUrl) {
            const trimmed = fullTextUrl.trim();
            if (/^www\./i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
              fullTextUrl = 'https://' + trimmed;
            }
          }
          
          // NEW: Get evidence from multiple possible column names
          const evidenceText = getColumnValue(row, 
            'Evidências', 'Evidencias', 'EVIDÊNCIAS', 'EVIDENCIAS',
            'EVIDÊNCIA DE ATENDIMENTO', 'Evidência de Atendimento'
          );
          
          // NEW: Get status from multiple possible column names including Gabardo format
          const statusFromAtendimento = getColumnValue(row, 'ATENDIMENTO', 'Atendimento');
          const finalStatus = statusRaw || statusFromAtendimento;

          // Auto-extract norm_type from title if not found in columns.
          // Normaliza: primeira linha (células com CR/LF são comuns na planilha
          // do Gabardo) e colapsa espaços. Limite alinhado ao DB (VARCHAR(100)).
          let normType = getColumnValue(row, 'Tipo de Norma', 'Tipo', 'TIPO DE NORMA', 'TIPO');
          if (!normType && title) {
            normType = extractNormTypeFromTitle(title);
          }
          normType = normType.split(/[\r\n]+/)[0].replace(/\s+/g, ' ').trim().slice(0, 100);

          // Default jurisdiction to 'federal' if not found
          const jurisdictionFinal = jurisdiction || 'federal';
          
          return {
            rowNumber: headerRow + index + 2,
            norm_type: normType,
            norm_number: normNumber,
            title,
            summary: cleanHtmlFromText(getColumnValue(row, 'Resumo', 'RESUMO', 'Descrição', 'DESCRIÇÃO')),
            issuing_body: getColumnValue(row, 'Órgão Emissor', 'Orgão Emissor', 'Órgão', 'ÓRGÃO EMISSOR', 'ÓRGÃO'),
            publication_date: publicationDate,
            jurisdiction: jurisdictionFinal,
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
        
        resolve({ legislations: filtered, detectedUnitColumns, hasExplicitNormTypeColumn });
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
      // Busca flexível, agora também ignora acentos — captura variações comuns
      // de digitação como "RESOLUÇAO CONTRAN" vs "Resolução CONTRAN".
      const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const typed = stripAccents(leg.norm_type.toLowerCase().trim());
      const isRecognized = VALID_NORM_TYPES.some(t => {
        const valid = stripAccents(t.toLowerCase());
        return valid === typed || typed.includes(valid) || valid.includes(typed);
      });
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

// Expande um UnitMapping em 1..N destinos (branchId + rótulo para stats).
// Propagação por UF produz múltiplos destinos; mapeamento simples produz um.
function expandMappingTargets(mapping: UnitMapping): Array<{ branchId: string; displayName: string }> {
  if (mapping.propagateBranchIds && mapping.propagateBranchIds.length > 0) {
    return mapping.propagateBranchIds.map((id, idx) => ({
      branchId: id,
      displayName: mapping.propagateBranchNames?.[idx] || mapping.excelCode,
    }));
  }
  if (mapping.branchId) {
    return [{
      branchId: mapping.branchId,
      displayName: mapping.branchName || mapping.excelCode,
    }];
  }
  return [];
}

export async function importLegislations(
  legislations: ParsedLegislation[],
  options: {
    skipExisting: boolean;
    createMissingThemes: boolean;
    isSimplifiedFormat?: boolean;  // When true, skip INSERT for unmatched rows
    forceCreate?: boolean;         // When true, force INSERT even in simplified format
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
    unmatchedRows: [],
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
      .select('id, title, norm_type, norm_number, summary')
      .eq('company_id', companyId);

    // Normaliza texto (lowercase, sem acentos, espaços colapsados) para
    // comparação tolerante de título/tipo/número durante conciliação.
    const normalizeText = (s: string | null | undefined) =>
      (s || '').toString().toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const titleHash = (s: string | null | undefined) => normalizeText(s).slice(0, 80);

    type ExistingEntry = { id: string; title: string; titleHash: string; normTypeNorm: string };

    // Map principal: norm_type|norm_number → lista de entries. Guardamos TODAS
    // as entries com o mesmo par tipo+número (podem ser leis distintas com mesmo
    // número, ex.: DECRETO 10088 Convenção 174 vs Convenção 170 da OIT).
    const byTypeNum = new Map<string, ExistingEntry[]>();
    // Maps secundários para fallback quando não há norm_number na planilha.
    const byTitleExact = new Map<string, ExistingEntry>();
    const bySummaryPrefix = new Map<string, ExistingEntry>();

    (existingLegislations || []).forEach(l => {
      const entry: ExistingEntry = {
        id: l.id,
        title: l.title || '',
        titleHash: titleHash(l.title),
        normTypeNorm: normalizeText(l.norm_type),
      };
      if (l.norm_type && l.norm_number) {
        const key = `${l.norm_type.toLowerCase()}|${l.norm_number.toLowerCase()}`;
        const list = byTypeNum.get(key);
        if (list) list.push(entry); else byTypeNum.set(key, [entry]);
      }
      if (l.title && !byTitleExact.has(normalizeText(l.title))) {
        byTitleExact.set(normalizeText(l.title), entry);
      }
      if (l.summary) {
        const k = normalizeText(l.summary).slice(0, 150);
        if (!bySummaryPrefix.has(k)) bySummaryPrefix.set(k, entry);
      }
    });

    // Encontra melhor candidato entre N entries com mesmo tipo+número.
    // Prioridade: título idêntico → título genérico (igual ao tipo ou vazio)
    // → null (nenhum match → criar nova entry como lei distinta).
    const findBestCandidate = (
      candidates: ExistingEntry[],
      rowTitleHash: string,
      rowTypeNorm: string,
    ): ExistingEntry | null => {
      if (candidates.length === 0) return null;
      const exact = candidates.find(c => c.titleHash === rowTitleHash);
      if (exact) return exact;
      // Se o título da DB entry é "genérico" (vazio ou = norm_type), pode ser
      // seed antigo. Aceita merge apenas se houver 1 candidato genérico — caso
      // contrário não dá pra decidir e criamos nova entry.
      const generic = candidates.filter(c => !c.titleHash || c.titleHash === rowTypeNorm);
      if (generic.length === 1 && candidates.length === 1) return generic[0];
      // Se o título da linha da planilha é genérico e só há 1 candidato, usa.
      if (!rowTitleHash && candidates.length === 1) return candidates[0];
      return null;
    };
    
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
        if (options.isSimplifiedFormat) {
          // Simplified format only needs title (used as summary key for matching)
          if (!leg.title) {
            result.warnings++;
            result.details.push({
              rowNumber: leg.rowNumber,
              title: '(sem texto)',
              status: 'warning',
              message: 'Linha sem texto para identificação - ignorada',
            });
            continue;
          }
        } else {
          // Full format requires norm_type, title and jurisdiction
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
        }
        
        // Conciliação: quando há mais de uma entry com mesmo norm_type+norm_number
        // (ex.: DECRETO 10088 aparece 2x na planilha com Convenção 174 e 170 da OIT),
        // desempatamos pelo título. Assim leis distintas com número repetido viram
        // entries separadas no DB em vez de colapsarem e sobrescreverem avaliações.
        let existingLegislation: { id: string; title: string } | null = null;

        if (leg.norm_type && leg.norm_number) {
          const key = `${leg.norm_type.toLowerCase()}|${leg.norm_number.toLowerCase()}`;
          const candidates = byTypeNum.get(key) || [];
          const best = findBestCandidate(
            candidates,
            titleHash(leg.title),
            normalizeText(leg.norm_type),
          );
          if (best) existingLegislation = { id: best.id, title: best.title };
        }

        if (!existingLegislation && leg.title) {
          const byTitle = byTitleExact.get(normalizeText(leg.title));
          if (byTitle) existingLegislation = { id: byTitle.id, title: byTitle.title };
        }

        // Terceira tentativa: match por summary (formatos simplificados em que
        // "RESUMO E TÍTULO" da planilha corresponde ao campo summary no DB).
        if (!existingLegislation && leg.title) {
          const k = normalizeText(leg.title).slice(0, 150);
          const bySum = bySummaryPrefix.get(k);
          if (bySum) existingLegislation = { id: bySum.id, title: bySum.title };
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
                evidence_type: 'documento',
                uploaded_by: profile.id
              });
            
            if (!evidenceError) {
              result.evidencesAdded++;
              evidenceMessage = ' + evidência adicionada';
            }
          }
          
          // NOVO: Criar/atualizar unit compliance para legislação existente
          if (options.unitMappings && leg.unitEvaluations && leg.unitEvaluations.length > 0) {
            type ComplianceRecord = {
              legislation_id: string;
              branch_id: string;
              company_id: string;
              applicability: string;
              compliance_status: string;
              evidence_notes: string | null;
              evaluated_at: string;
              evaluated_by: string;
            };
            const complianceRecords: ComplianceRecord[] = [];
            const branchLabelById = new Map<string, string>();

            for (const evaluation of leg.unitEvaluations) {
              const mapping = options.unitMappings.find(m =>
                m.excelCode.toUpperCase() === evaluation.unitCode.toUpperCase()
              );
              if (!mapping) continue;

              for (const target of expandMappingTargets(mapping)) {
                branchLabelById.set(target.branchId, target.displayName);
                complianceRecords.push({
                  legislation_id: existingLegislation.id,
                  branch_id: target.branchId,
                  company_id: companyId,
                  applicability: evaluation.applicability,
                  compliance_status: evaluation.complianceStatus,
                  evidence_notes: leg.evidence_text?.trim() || null,
                  evaluated_at: new Date().toISOString(),
                  evaluated_by: profile.id,
                });
              }
            }

            if (complianceRecords.length > 0) {
              // Deduplicate by (legislation_id, branch_id) — last row wins
              const uniqueMap = new Map<string, ComplianceRecord>();
              for (const rec of complianceRecords) {
                uniqueMap.set(`${rec.legislation_id}:${rec.branch_id}`, rec);
              }
              const dedupedRecords = Array.from(uniqueMap.values());

              const { error: complianceError } = await supabase
                .from('legislation_unit_compliance')
                .upsert(dedupedRecords, { onConflict: 'legislation_id,branch_id' });

              if (!complianceError) {
                result.unitCompliancesCreated += dedupedRecords.length;
                unitComplianceMessage = ` + ${dedupedRecords.length} avaliação(ões) por unidade`;
                for (const rec of dedupedRecords) {
                  const branchLabel = branchLabelById.get(rec.branch_id) || rec.branch_id;
                  result.unitsByBranch[branchLabel] = (result.unitsByBranch[branchLabel] || 0) + 1;
                }
              } else {
                console.error('Erro ao atualizar unit compliance:', complianceError);
                result.errors++;
                result.details.push({
                  rowNumber: leg.rowNumber,
                  title: leg.title,
                  status: 'error',
                  message: `Erro ao salvar compliance: ${complianceError.message}`,
                });
                continue;
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
        
        // Para formato simplificado (sem coluna Tipo de Norma explícita),
        // não tenta INSERT de novas legislações — apenas atualiza existentes
        // A menos que forceCreate esteja ativo
        if (options.isSimplifiedFormat && !options.forceCreate) {
          result.warnings++;
          result.unmatchedRows.push(leg);
          result.details.push({
            rowNumber: leg.rowNumber,
            title: leg.title?.substring(0, 60) || '(sem título)',
            status: 'warning',
            message: 'Legislação não encontrada no banco de dados - importação ignorada',
          });
          continue;
        }
        
        // Se forceCreate e sem norm_type, usar 'Outro' como fallback
        if (options.forceCreate && (!leg.norm_type || leg.norm_type === '')) {
          leg.norm_type = 'Outro';
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

        // Adiciona ao mapa para que linhas subsequentes do mesmo lote que tenham
        // tipo+número+título iguais a essa recém-inserida sejam reconciliadas.
        // Leis distintas com mesmo número mas TÍTULO diferente não casam aqui,
        // então cada uma vira sua própria entry — comportamento correto.
        if (newLeg?.id && leg.norm_type && leg.norm_number) {
          const key = `${leg.norm_type.toLowerCase()}|${leg.norm_number.toLowerCase()}`;
          const entry: ExistingEntry = {
            id: newLeg.id,
            title: leg.title || '',
            titleHash: titleHash(leg.title),
            normTypeNorm: normalizeText(leg.norm_type),
          };
          const list = byTypeNum.get(key);
          if (list) list.push(entry); else byTypeNum.set(key, [entry]);
        }
        
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
                evidence_type: 'documento',
                uploaded_by: profile.id
              });
            
            if (!evidenceError) {
              result.evidencesAdded++;
              evidenceMessage = ' + evidência';
            }
          }
          
          // Criar unit compliance para cada avaliação mapeada
          if (options.unitMappings && leg.unitEvaluations && leg.unitEvaluations.length > 0) {
            type ComplianceRecord = {
              legislation_id: string;
              branch_id: string;
              company_id: string;
              applicability: string;
              compliance_status: string;
              evidence_notes: string | null;
              evaluated_at: string;
              evaluated_by: string;
            };
            const complianceRecords: ComplianceRecord[] = [];
            const branchLabelById = new Map<string, string>();

            for (const evaluation of leg.unitEvaluations) {
              const mapping = options.unitMappings.find(m =>
                m.excelCode.toUpperCase() === evaluation.unitCode.toUpperCase()
              );
              if (!mapping) continue;

              for (const target of expandMappingTargets(mapping)) {
                branchLabelById.set(target.branchId, target.displayName);
                complianceRecords.push({
                  legislation_id: newLeg.id,
                  branch_id: target.branchId,
                  company_id: companyId,
                  applicability: evaluation.applicability,
                  compliance_status: evaluation.complianceStatus,
                  evidence_notes: leg.evidence_text?.trim() || null,
                  evaluated_at: new Date().toISOString(),
                  evaluated_by: profile.id,
                });
              }
            }

            // Batch insert compliance records
            if (complianceRecords.length > 0) {
              // Deduplicate by (legislation_id, branch_id) — last row wins
              const uniqueMap = new Map<string, ComplianceRecord>();
              for (const rec of complianceRecords) {
                uniqueMap.set(`${rec.legislation_id}:${rec.branch_id}`, rec);
              }
              const dedupedRecords = Array.from(uniqueMap.values());

              const { error: complianceError } = await supabase
                .from('legislation_unit_compliance')
                .upsert(dedupedRecords, { onConflict: 'legislation_id,branch_id' });

              if (!complianceError) {
                result.unitCompliancesCreated += dedupedRecords.length;
                unitComplianceMessage = ` + ${dedupedRecords.length} unidade(s)`;
                for (const rec of dedupedRecords) {
                  const branchLabel = branchLabelById.get(rec.branch_id) || rec.branch_id;
                  result.unitsByBranch[branchLabel] = (result.unitsByBranch[branchLabel] || 0) + 1;
                }
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
  // Colunas-exemplo de unidades. Cada coluna pode ser:
  //   - código de filial (ex.: POA, SBC, SJP) → mapeia 1:1
  //   - sigla de UF (ex.: SC, ES, CE) → pode propagar para todas as filiais do UF
  // Valores: 1=N/A, 2=OK, 3=Plano de Ação, x=Sem Avaliação, z=Não Pertinente
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
      'POA': '2', 'SBC': '2', 'SJP': '2', 'GO': '2',
      'SC': '2', 'ES': '2', 'CE': '2',
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
      'POA': '3', 'SBC': '2', 'SJP': '3', 'GO': 'x',
      'SC': '2', 'ES': '1', 'CE': 'z',
      'Aplicabilidade': 'real',
      'Status': 'plano_acao',
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
      'POA': 'x', 'SBC': 'x', 'SJP': 'x', 'GO': 'x',
      'SC': 'x', 'ES': 'x', 'CE': 'x',
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
    { 'Coluna': 'Colunas de Unidades (POA, SBC, GO, SC, ES, ...)', 'Obrigatório': 'Não', 'Valores Aceitos': '1=N/A, 2=OK/Conforme, 3=Precisa de Plano de Ação, x=Sem Avaliação, z=Não Pertinente. Use código de filial para mapeamento 1:1 ou sigla de UF (SC, ES, CE, ...) para replicar a avaliação em todas as filiais daquele estado.' },
    { 'Coluna': 'Aplicabilidade', 'Obrigatório': 'Não', 'Valores Aceitos': VALID_APPLICABILITIES.join(', ') + ' (padrão: pending)' },
    { 'Coluna': 'Status', 'Obrigatório': 'Não', 'Valores Aceitos': VALID_STATUSES.join(', ') + ' (padrão: pending)' },
    { 'Coluna': 'URL Texto Integral', 'Obrigatório': 'Não', 'Valores Aceitos': 'URL válida começando com http:// ou https://' },
    { 'Coluna': 'Frequência Revisão (dias)', 'Obrigatório': 'Não', 'Valores Aceitos': 'Número inteiro (padrão: 365)' },
    { 'Coluna': 'Evidências', 'Obrigatório': 'Não', 'Valores Aceitos': 'Texto com evidências de conformidade (será adicionado à seção de evidências da legislação)' },
  ];

  const legendSheet = [
    { 'Valor': '1', 'Significado': 'N/A (Não Aplicável)' },
    { 'Valor': '2', 'Significado': 'OK (Conforme)' },
    { 'Valor': '3', 'Significado': 'Precisa de Plano de Ação' },
    { 'Valor': 'x', 'Significado': 'Sem Avaliação' },
    { 'Valor': 'z', 'Significado': 'Não Pertinente à unidade' },
  ];

  const workbook = XLSX.utils.book_new();

  const dataSheet = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Legislações');

  const instructSheet = XLSX.utils.json_to_sheet(instructionSheet);
  XLSX.utils.book_append_sheet(workbook, instructSheet, 'Instruções');

  const legend = XLSX.utils.json_to_sheet(legendSheet);
  legend['!cols'] = [{ wch: 8 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, legend, 'Legenda Unidades');

  XLSX.writeFile(workbook, 'template_importacao_legislacoes.xlsx');
}
