import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from '@/utils/formErrorHandler';

// ============= Types =============

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
  // Campos extras do formato Gabardo
  compliance_details: string;      // "Observações como é atendido"
  general_notes: string;           // "Observações gerais, envios datas e responsáveis"
  states_list: string;             // UFs múltiplos
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
  errors: number;
  warnings: number;
  details: Array<{
    rowNumber: number;
    title: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>;
  createdEntities: {
    themes: string[];
    subthemes: string[];
  };
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
  'Norma Regulamentadora', 'Anexo', 'Lei Ordinária', 'Súmula', 'Parecer Normativo'
];

export const VALID_JURISDICTIONS = ['federal', 'estadual', 'municipal', 'nbr', 'internacional'];

export const VALID_APPLICABILITIES = ['real', 'potential', 'na', 'revoked', 'pending'];

export const VALID_STATUSES = ['conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'na', 'pending'];

export const COMMON_ISSUING_BODIES = [
  'IBAMA', 'CONAMA', 'MMA', 'MTE', 'ANP', 'ANVISA', 'CETESB', 'ABNT',
  'Presidência da República', 'Ministério do Trabalho', 'Ministério do Meio Ambiente'
];

// ============= Helpers =============

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
    
    // Look for key columns
    const hasTipo = cellValues.some(v => v.includes('TIPO') && v.includes('NORMA'));
    const hasTitulo = cellValues.some(v => v.includes('TÍTULO') || v.includes('TITULO') || v.includes('EMENTA'));
    const hasJurisdicao = cellValues.some(v => v.includes('JURISD'));
    
    if ((hasTipo || hasTitulo) && (hasTitulo || hasJurisdicao)) {
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
  
  // DD/MM/YYYY format
  const brMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

function normalizeJurisdiction(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('federal')) return 'federal';
  if (normalized.includes('estadual')) return 'estadual';
  if (normalized.includes('municipal')) return 'municipal';
  if (normalized.includes('nbr') || normalized.includes('abnt')) return 'nbr';
  if (normalized.includes('internac')) return 'internacional';
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
  return 'pending';
}

function parseState(stateValue: string): { state: string; statesList: string } {
  if (!stateValue) return { state: '', statesList: '' };
  
  // Se contém vírgulas, são múltiplos estados
  if (stateValue.includes(',')) {
    const states = stateValue.split(',').map(s => s.trim()).filter(Boolean);
    // Se são muitos estados (provavelmente todos), não preencher UF individual
    if (states.length > 20) {
      return { state: '', statesList: stateValue };
    }
    // Retornar o primeiro estado e a lista completa
    return { state: states[0], statesList: stateValue };
  }
  
  return { state: stateValue.trim(), statesList: '' };
}

function getColumnValue(row: any, ...possibleNames: string[]): string {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }
  return '';
}

// ============= Main Functions =============

export async function parseLegislationExcel(file: File): Promise<ParsedLegislation[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const headerRow = findHeaderRow(worksheet);
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          range: headerRow
        });
        
        const legislations: ParsedLegislation[] = jsonData.map((row: any, index) => {
          const jurisdictionRaw = getColumnValue(row, 'Jurisdição', 'Jurisdicao', 'JURISDIÇÃO', 'JURISDICAO');
          const applicabilityRaw = getColumnValue(row, 'Aplicabilidade', 'APLICABILIDADE');
          // Suporta duas colunas de status do formato Gabardo
          const statusRaw = getColumnValue(row, 'Status', 'STATUS', 'Situação', 'SITUAÇÃO', 'status');
          const reviewDaysRaw = getColumnValue(row, 'Frequência Revisão (dias)', 'Frequência Revisão', 'Revisão', 'REVISÃO');
          
          // Campos extras do formato Gabardo
          const complianceDetails = getColumnValue(row, 
            'Observações como é atendido', 'OBSERVAÇÕES COMO É ATENDIDO',
            'Como é atendido', 'COMO É ATENDIDO', 'Compliance'
          );
          const generalNotes = getColumnValue(row, 
            'Observaçãoes gerais, envios datas e responsáveis', 
            'Observações gerais, envios datas e responsáveis',
            'OBSERVAÇÕES GERAIS', 'Observações gerais', 
            'Notas gerais', 'Responsáveis'
          );
          
          // Parse múltiplos estados
          const stateRaw = getColumnValue(row, 'UF', 'Estado', 'ESTADO');
          const { state, statesList } = parseState(stateRaw);
          
          return {
            rowNumber: headerRow + index + 2,
            norm_type: getColumnValue(row, 'Tipo de Norma', 'Tipo', 'TIPO DE NORMA', 'TIPO'),
            norm_number: getColumnValue(row, 'Número', 'Numero', 'NÚMERO', 'NUMERO'),
            title: getColumnValue(row, 'Título/Ementa', 'Título', 'Titulo', 'Ementa', 'TÍTULO', 'TITULO', 'EMENTA'),
            summary: getColumnValue(row, 'Resumo', 'RESUMO', 'Descrição', 'DESCRIÇÃO'),
            issuing_body: getColumnValue(row, 'Órgão Emissor', 'Orgão Emissor', 'Órgão', 'ÓRGÃO EMISSOR', 'ÓRGÃO'),
            publication_date: parseDate(getColumnValue(row, 'Data Publicação', 'Data de Publicação', 'Publicação', 'DATA PUBLICAÇÃO')),
            jurisdiction: normalizeJurisdiction(jurisdictionRaw),
            state,
            municipality: getColumnValue(row, 'Município', 'Municipio', 'MUNICÍPIO', 'MUNICIPIO', 'Cidade', 'CIDADE'),
            theme_name: getColumnValue(row, 'Macrotema', 'Tema', 'MACROTEMA', 'TEMA'),
            subtheme_name: getColumnValue(row, 'Subtema', 'SUBTEMA'),
            overall_applicability: normalizeApplicability(applicabilityRaw),
            overall_status: normalizeStatus(statusRaw),
            full_text_url: getColumnValue(row, 'URL Texto Integral', 'URL', 'Link', 'LINK'),
            review_frequency_days: parseInt(reviewDaysRaw) || 365,
            observations: getColumnValue(row, 'Observações', 'Observacoes', 'OBSERVAÇÕES', 'OBSERVACOES', 'Notas', 'NOTAS'),
            // Campos extras
            compliance_details: complianceDetails,
            general_notes: generalNotes,
            states_list: statesList,
          };
        });
        
        // Filter out completely empty rows
        const filtered = legislations.filter(leg => leg.title || leg.norm_type || leg.norm_number);
        
        resolve(filtered);
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
    onProgress?: (progress: LegislationImportProgress) => void;
  } = { skipExisting: true, createMissingThemes: true }
): Promise<LegislationImportResult> {
  const result: LegislationImportResult = {
    success: true,
    imported: 0,
    errors: 0,
    warnings: 0,
    details: [],
    createdEntities: {
      themes: [],
      subthemes: [],
    },
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
    
    // Get existing legislations for duplicate check
    const { data: existingLegislations } = await supabase
      .from('legislations')
      .select('title, norm_number')
      .eq('company_id', companyId);
    
    const existingSet = new Set(
      (existingLegislations || []).map(l => `${l.title?.toLowerCase()}|${l.norm_number?.toLowerCase()}`)
    );
    
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
        
        // Check duplicate
        const key = `${leg.title.toLowerCase()}|${leg.norm_number?.toLowerCase()}`;
        if (existingSet.has(key)) {
          if (options.skipExisting) {
            result.warnings++;
            result.details.push({
              rowNumber: leg.rowNumber,
              title: leg.title,
              status: 'warning',
              message: 'Legislação já existe - ignorada',
            });
            continue;
          }
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
          });
        
        if (insertError) {
          throw insertError;
        }
        
        existingSet.add(key);
        result.imported++;
        result.details.push({
          rowNumber: leg.rowNumber,
          title: leg.title,
          status: 'success',
          message: 'Importado com sucesso',
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
      'Observações': '',
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
      'Observações': 'Verificar atualizações',
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
      'Observações': 'Avaliar aplicabilidade',
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
    { 'Coluna': 'Observações', 'Obrigatório': 'Não', 'Valores Aceitos': 'Texto livre' },
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
