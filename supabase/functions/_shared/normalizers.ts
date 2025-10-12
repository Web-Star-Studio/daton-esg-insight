/**
 * Sistema de Normalização de Dados Extraídos
 * Converte unidades, corrige OCR, padroniza formatos
 */

import { validateField, type ValidationResult } from './validators.ts';

export interface NormalizationResult {
  normalizedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  dataQualityIssues: string[];
  appliedCorrections: string[];
}

/**
 * Converte unidades de medida automaticamente
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): { value: number; applied: boolean } {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  
  // Massa
  const massConversions: Record<string, Record<string, number>> = {
    'kg': { 'kg': 1, 't': 0.001, 'toneladas': 0.001, 'g': 1000 },
    'g': { 'kg': 0.001, 't': 0.000001, 'toneladas': 0.000001, 'g': 1 },
    't': { 'kg': 1000, 't': 1, 'toneladas': 1, 'g': 1000000 },
    'toneladas': { 'kg': 1000, 't': 1, 'toneladas': 1, 'g': 1000000 }
  };
  
  // Volume
  const volumeConversions: Record<string, Record<string, number>> = {
    'l': { 'l': 1, 'm³': 0.001, 'm3': 0.001, 'litros': 1, 'ml': 1000 },
    'litros': { 'l': 1, 'm³': 0.001, 'm3': 0.001, 'litros': 1, 'ml': 1000 },
    'ml': { 'l': 0.001, 'm³': 0.000001, 'm3': 0.000001, 'litros': 0.001, 'ml': 1 },
    'm³': { 'l': 1000, 'm³': 1, 'm3': 1, 'litros': 1000, 'ml': 1000000 },
    'm3': { 'l': 1000, 'm³': 1, 'm3': 1, 'litros': 1000, 'ml': 1000000 }
  };
  
  // Energia
  const energyConversions: Record<string, Record<string, number>> = {
    'kwh': { 'kwh': 1, 'mwh': 0.001, 'gj': 0.0036 },
    'mwh': { 'kwh': 1000, 'mwh': 1, 'gj': 3.6 },
    'gj': { 'kwh': 277.778, 'mwh': 0.278, 'gj': 1 }
  };
  
  // Tentar conversões
  if (massConversions[from]?.[to]) {
    return { value: value * massConversions[from][to], applied: true };
  }
  
  if (volumeConversions[from]?.[to]) {
    return { value: value * volumeConversions[from][to], applied: true };
  }
  
  if (energyConversions[from]?.[to]) {
    return { value: value * energyConversions[from][to], applied: true };
  }
  
  return { value, applied: false };
}

/**
 * Corrige erros comuns de OCR
 */
export function fixOCRErrors(text: string): { corrected: string; changes: string[] } {
  const changes: string[] = [];
  let corrected = text;
  
  const ocrFixes = [
    { from: /\bO(\d)/g, to: '0$1', desc: 'O → 0 antes de número' },
    { from: /(\d)O\b/g, to: '$10', desc: 'O → 0 depois de número' },
    { from: /\bl(\d)/g, to: '1$1', desc: 'l → 1 antes de número' },
    { from: /(\d)l\b/g, to: '$11', desc: 'l → 1 depois de número' },
    { from: /\bS(\d)/g, to: '5$1', desc: 'S → 5 antes de número' },
    { from: /\bB(\d)/g, to: '8$1', desc: 'B → 8 antes de número' },
    { from: /\|/g, to: 'I', desc: '| → I' },
    { from: /L\s*i\s*c\s*e\s*n\s*[cç]\s*a/gi, to: 'Licença', desc: 'Correção espaçamento "Licença"' },
    { from: /L\s*¡\s*c/gi, to: 'Lic', desc: 'Correção caractere especial em "Lic"' },
    { from: /R\s*\$\s*/g, to: 'R$ ', desc: 'Normalização R$' }
  ];
  
  for (const fix of ocrFixes) {
    const before = corrected;
    corrected = corrected.replace(fix.from, fix.to as string);
    if (before !== corrected) {
      changes.push(fix.desc);
    }
  }
  
  return { corrected, changes };
}

/**
 * Normaliza tipo de licença expandindo abreviações
 */
export function normalizeLicenseType(type: string): string {
  const typeMap: Record<string, string> = {
    'lic. op.': 'Licença de Operação',
    'lic op': 'Licença de Operação',
    'lo': 'Licença de Operação',
    'lic. prev.': 'Licença Prévia',
    'lic prev': 'Licença Prévia',
    'lp': 'Licença Prévia',
    'lic. inst.': 'Licença de Instalação',
    'lic inst': 'Licença de Instalação',
    'li': 'Licença de Instalação',
    'lau': 'Licença Ambiental Única',
    'aut. amb.': 'Autorização Ambiental',
    'aut amb': 'Autorização Ambiental'
  };
  
  const normalized = type.toLowerCase().trim();
  return typeMap[normalized] || type;
}

/**
 * Normaliza status baseado em palavras-chave
 */
export function normalizeStatus(status: string, context: 'license' | 'general' = 'general'): string {
  const statusLower = status.toLowerCase().trim();
  
  if (context === 'license') {
    if (statusLower.includes('ativ') || statusLower.includes('vigent') || statusLower.includes('válid')) {
      return 'Ativa';
    }
    if (statusLower.includes('vencid') || statusLower.includes('expirad') || statusLower.includes('invalid')) {
      return 'Vencida';
    }
    if (statusLower.includes('renov') || statusLower.includes('processo')) {
      return 'Em Renovação';
    }
    if (statusLower.includes('suspend') || statusLower.includes('cancelad')) {
      return 'Suspensa';
    }
  }
  
  return status;
}

/**
 * Infere unidade baseada no contexto quando não especificada
 */
export function inferUnit(fieldName: string, value: number): string {
  const field = fieldName.toLowerCase();
  
  // Massa/Peso
  if (field.includes('peso') || field.includes('mass') || field.includes('residuo') || field.includes('waste')) {
    return value >= 1000 ? 'toneladas' : 'kg';
  }
  
  // Volume
  if (field.includes('volume') || field.includes('agua') || field.includes('water')) {
    return value >= 1000 ? 'm³' : 'litros';
  }
  
  // Energia
  if (field.includes('energia') || field.includes('energy') || field.includes('consumo') || field.includes('kwh')) {
    return value >= 1000 ? 'MWh' : 'kWh';
  }
  
  // Área
  if (field.includes('area') || field.includes('hectare')) {
    return 'hectares';
  }
  
  // Distância
  if (field.includes('distancia') || field.includes('distance') || field.includes('km')) {
    return 'km';
  }
  
  return 'unidade';
}

/**
 * Normaliza todos os campos extraídos
 */
export function normalizeExtractedData(
  extractedFields: Record<string, any>,
  tableName: string
): NormalizationResult {
  const normalizedFields: Record<string, any> = {};
  const fieldConfidence: Record<string, number> = {};
  const dataQualityIssues: string[] = [];
  const appliedCorrections: string[] = [];
  
  for (const [fieldName, value] of Object.entries(extractedFields)) {
    if (!value) {
      normalizedFields[fieldName] = null;
      fieldConfidence[fieldName] = 0;
      dataQualityIssues.push(`Campo "${fieldName}" está vazio`);
      continue;
    }
    
    const valueStr = String(value);
    
    // Aplicar correções OCR
    const { corrected: ocrCorrected, changes: ocrChanges } = fixOCRErrors(valueStr);
    if (ocrChanges.length > 0) {
      appliedCorrections.push(`${fieldName}: ${ocrChanges.join(', ')}`);
    }
    
    // Validar e normalizar campo
    const validation: ValidationResult = validateField(fieldName, ocrCorrected);
    
    normalizedFields[fieldName] = validation.normalizedValue;
    fieldConfidence[fieldName] = validation.confidence;
    
    if (validation.issues.length > 0) {
      dataQualityIssues.push(`${fieldName}: ${validation.issues.join(', ')}`);
    }
    
    if (validation.corrections.length > 0) {
      appliedCorrections.push(`${fieldName}: ${validation.corrections.join(', ')}`);
    }
    
    // Normalizações específicas por tipo de tabela
    if (tableName === 'licenses') {
      if (fieldName === 'license_type' && typeof normalizedFields[fieldName] === 'string') {
        const normalized = normalizeLicenseType(normalizedFields[fieldName]);
        if (normalized !== normalizedFields[fieldName]) {
          appliedCorrections.push(`${fieldName}: Abreviação expandida para "${normalized}"`);
          normalizedFields[fieldName] = normalized;
        }
      }
      
      if (fieldName === 'status' && typeof normalizedFields[fieldName] === 'string') {
        normalizedFields[fieldName] = normalizeStatus(normalizedFields[fieldName], 'license');
      }
    }
    
    // Inferir unidade se for número sem unidade especificada
    if (fieldName.includes('quantity') || fieldName.includes('quantidade')) {
      if (typeof normalizedFields[fieldName] === 'number' && !extractedFields[`${fieldName}_unit`]) {
        const inferredUnit = inferUnit(fieldName, normalizedFields[fieldName] as number);
        normalizedFields[`${fieldName}_unit`] = inferredUnit;
        appliedCorrections.push(`Unidade inferida para ${fieldName}: ${inferredUnit}`);
      }
    }
  }
  
  return {
    normalizedFields,
    fieldConfidence,
    dataQualityIssues,
    appliedCorrections
  };
}

/**
 * Valida regras de negócio específicas
 */
export function validateBusinessRules(
  fields: Record<string, any>,
  tableName: string
): string[] {
  const issues: string[] = [];
  
  if (tableName === 'licenses') {
    // Validade deve ser futura
    if (fields.expiration_date) {
      const expDate = new Date(fields.expiration_date);
      if (expDate < new Date()) {
        issues.push('Data de validade está no passado - licença pode estar vencida');
      }
    }
    
    // Data de emissão deve ser anterior à validade
    if (fields.issue_date && fields.expiration_date) {
      const issueDate = new Date(fields.issue_date);
      const expDate = new Date(fields.expiration_date);
      if (issueDate >= expDate) {
        issues.push('Data de emissão é posterior à data de validade');
      }
    }
  }
  
  if (tableName === 'waste_logs') {
    // Quantidade deve ser positiva
    if (fields.quantity && fields.quantity <= 0) {
      issues.push('Quantidade de resíduo deve ser maior que zero');
    }
    
    // Data não pode ser futura
    if (fields.log_date) {
      const logDate = new Date(fields.log_date);
      if (logDate > new Date()) {
        issues.push('Data de registro está no futuro');
      }
    }
  }
  
  if (tableName === 'energy_consumption' || tableName === 'water_consumption') {
    // Consumo deve ser positivo
    const qtyField = tableName === 'energy_consumption' ? 'quantity_kwh' : 'quantity_m3';
    if (fields[qtyField] && fields[qtyField] <= 0) {
      issues.push('Quantidade consumida deve ser maior que zero');
    }
  }
  
  return issues;
}
