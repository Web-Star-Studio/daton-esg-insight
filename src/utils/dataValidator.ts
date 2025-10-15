// Data Validator - Validação inteligente de dados extraídos
import { DataQualityScore } from '@/components/ai/DataQualityBadge';

export interface ValidationRule {
  field: string;
  type: 'required' | 'numeric' | 'date' | 'email' | 'range' | 'format';
  params?: any;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
  quality: DataQualityScore;
}

/**
 * Valida dados extraídos baseado em regras inteligentes
 */
export function validateExtractedData(
  data: Record<string, any>[],
  rules?: ValidationRule[]
): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  const qualityIssues: DataQualityScore['issues'] = [];
  const recommendations: string[] = [];
  
  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: [{ field: 'data', message: 'Nenhum dado fornecido', severity: 'high' }],
      warnings: [],
      quality: { score: 0, issues: [], recommendations: ['Forneça dados para validação'] }
    };
  }

  const fields = Object.keys(data[0]);
  let qualityScore = 100;

  // Apply custom rules if provided
  if (rules && rules.length > 0) {
    rules.forEach(rule => {
      data.forEach((row, idx) => {
        const value = row[rule.field];
        
        switch (rule.type) {
          case 'required':
            if (!value || value === '') {
              errors.push({
                field: rule.field,
                message: rule.message || `Campo obrigatório vazio na linha ${idx + 1}`,
                severity: 'high'
              });
              qualityScore -= 5;
            }
            break;
            
          case 'numeric':
            if (value && isNaN(parseFloat(value))) {
              errors.push({
                field: rule.field,
                message: rule.message || `Valor não numérico na linha ${idx + 1}`,
                severity: 'medium'
              });
              qualityScore -= 3;
            }
            break;
            
          case 'date':
            if (value && isNaN(Date.parse(value))) {
              errors.push({
                field: rule.field,
                message: rule.message || `Data inválida na linha ${idx + 1}`,
                severity: 'medium'
              });
              qualityScore -= 3;
            }
            break;
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
              errors.push({
                field: rule.field,
                message: rule.message || `Email inválido na linha ${idx + 1}`,
                severity: 'medium'
              });
              qualityScore -= 2;
            }
            break;
            
          case 'range':
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && rule.params) {
              if (rule.params.min !== undefined && numValue < rule.params.min) {
                warnings.push({
                  field: rule.field,
                  message: `Valor ${numValue} abaixo do mínimo ${rule.params.min} na linha ${idx + 1}`
                });
              }
              if (rule.params.max !== undefined && numValue > rule.params.max) {
                warnings.push({
                  field: rule.field,
                  message: `Valor ${numValue} acima do máximo ${rule.params.max} na linha ${idx + 1}`
                });
              }
            }
            break;
        }
      });
    });
  }

  // Intelligent automatic validations
  
  // 1. Check for missing values
  fields.forEach(field => {
    const missingCount = data.filter(row => !row[field] || row[field] === '').length;
    const missingPercentage = (missingCount / data.length) * 100;
    
    if (missingPercentage > 0) {
      if (missingPercentage > 30) {
        qualityIssues.push({
          type: 'missing',
          field,
          description: `${missingPercentage.toFixed(0)}% dos valores estão faltando`,
          severity: missingPercentage > 60 ? 'high' : 'medium'
        });
        qualityScore -= missingPercentage > 60 ? 15 : 8;
        recommendations.push(`Revisar e preencher valores faltantes em "${field}"`);
      } else {
        warnings.push({
          field,
          message: `${missingCount} valor(es) faltando (${missingPercentage.toFixed(1)}%)`
        });
        qualityScore -= 2;
      }
    }
  });

  // 2. Check for duplicates
  const uniqueRows = new Set(data.map(row => JSON.stringify(row))).size;
  if (uniqueRows < data.length) {
    const duplicateCount = data.length - uniqueRows;
    qualityIssues.push({
      type: 'duplicate',
      field: 'all',
      description: `${duplicateCount} registro(s) duplicado(s) encontrado(s)`,
      severity: 'medium'
    });
    qualityScore -= 10;
    recommendations.push('Remover registros duplicados antes de importar');
  }

  // 3. Check for outliers in numeric fields
  fields.forEach(field => {
    const numericValues = data
      .map(row => parseFloat(row[field]))
      .filter(val => !isNaN(val));
    
    if (numericValues.length > 5) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const stdDev = Math.sqrt(
        numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      );
      
      const outliers = numericValues.filter(val => 
        Math.abs(val - mean) > 3 * stdDev
      );
      
      if (outliers.length > 0) {
        qualityIssues.push({
          type: 'outlier',
          field,
          description: `${outliers.length} valor(es) atípico(s) detectado(s)`,
          severity: 'low'
        });
        qualityScore -= 3;
        recommendations.push(`Verificar valores atípicos em "${field}": ${outliers.slice(0, 3).join(', ')}`);
      }
    }
  });

  // 4. Check for format consistency
  fields.forEach(field => {
    const values = data.map(row => String(row[field] || '')).filter(v => v);
    
    if (values.length > 1) {
      // Check if all non-empty values have same format (e.g., all dates, all numbers)
      const formats = new Set(values.map(v => {
        if (!isNaN(parseFloat(v))) return 'numeric';
        if (!isNaN(Date.parse(v))) return 'date';
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
        return 'text';
      }));
      
      if (formats.size > 1) {
        qualityIssues.push({
          type: 'inconsistent',
          field,
          description: 'Formatos de dados inconsistentes',
          severity: 'low'
        });
        qualityScore -= 5;
        recommendations.push(`Padronizar formato dos dados em "${field}"`);
      }
    }
  });

  // 5. Smart field detection and suggestions
  fields.forEach(field => {
    const fieldLower = field.toLowerCase();
    const sampleValue = data[0][field];
    
    // Date fields
    if ((fieldLower.includes('data') || fieldLower.includes('date')) && 
        sampleValue && isNaN(Date.parse(sampleValue))) {
      warnings.push({
        field,
        message: 'Campo parece ser data mas formato não foi reconhecido'
      });
      recommendations.push(`Verificar formato de data em "${field}" (use: YYYY-MM-DD ou DD/MM/YYYY)`);
    }
    
    // Email fields
    if ((fieldLower.includes('email') || fieldLower.includes('e-mail')) && 
        sampleValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sampleValue)) {
      warnings.push({
        field,
        message: 'Campo parece ser email mas formato está inválido'
      });
      recommendations.push(`Verificar formato de email em "${field}"`);
    }
    
    // Numeric fields
    if ((fieldLower.includes('valor') || fieldLower.includes('quantidade') || 
         fieldLower.includes('total') || fieldLower.includes('amount')) && 
        sampleValue && isNaN(parseFloat(sampleValue))) {
      warnings.push({
        field,
        message: 'Campo parece ser numérico mas contém texto'
      });
      recommendations.push(`Converter "${field}" para formato numérico`);
    }
  });

  const quality: DataQualityScore = {
    score: Math.max(0, Math.round(qualityScore)),
    issues: qualityIssues,
    recommendations: recommendations.slice(0, 5) // Top 5 recommendations
  };

  return {
    isValid: errors.filter(e => e.severity === 'high').length === 0,
    errors,
    warnings,
    quality
  };
}

/**
 * Valida dados ESG específicos
 */
export function validateESGData(
  data: Record<string, any>[],
  category: 'emissions' | 'waste' | 'energy' | 'water' | 'social'
): ValidationResult {
  const categoryRules: Record<string, ValidationRule[]> = {
    emissions: [
      { field: 'fonte', type: 'required', message: 'Fonte de emissão é obrigatória' },
      { field: 'quantidade', type: 'numeric', message: 'Quantidade deve ser numérica' },
      { field: 'unidade', type: 'required', message: 'Unidade é obrigatória' },
      { field: 'periodo', type: 'date', message: 'Período deve ser uma data válida' }
    ],
    waste: [
      { field: 'tipo_residuo', type: 'required', message: 'Tipo de resíduo é obrigatório' },
      { field: 'quantidade', type: 'numeric', message: 'Quantidade deve ser numérica' },
      { field: 'destinacao', type: 'required', message: 'Destinação é obrigatória' }
    ],
    energy: [
      { field: 'consumo', type: 'numeric', message: 'Consumo deve ser numérico' },
      { field: 'unidade', type: 'required', message: 'Unidade é obrigatória' }
    ],
    water: [
      { field: 'consumo', type: 'numeric', message: 'Consumo deve ser numérico' },
      { field: 'fonte', type: 'required', message: 'Fonte é obrigatória' }
    ],
    social: [
      { field: 'colaboradores', type: 'numeric', message: 'Número de colaboradores deve ser numérico' }
    ]
  };

  const rules = categoryRules[category] || [];
  return validateExtractedData(data, rules);
}

/**
 * Gera relatório de validação formatado
 */
export function formatValidationReport(result: ValidationResult): string {
  let report = `## Relatório de Validação de Dados\n\n`;
  
  report += `### Qualidade Geral: ${result.quality.score}/100\n\n`;
  
  if (result.errors.length > 0) {
    report += `### Erros Críticos (${result.errors.length})\n`;
    result.errors.forEach((error, idx) => {
      report += `${idx + 1}. **${error.field}**: ${error.message} [${error.severity}]\n`;
    });
    report += `\n`;
  }
  
  if (result.warnings.length > 0) {
    report += `### Avisos (${result.warnings.length})\n`;
    result.warnings.slice(0, 5).forEach((warning, idx) => {
      report += `${idx + 1}. **${warning.field}**: ${warning.message}\n`;
    });
    if (result.warnings.length > 5) {
      report += `... e mais ${result.warnings.length - 5} avisos\n`;
    }
    report += `\n`;
  }
  
  if (result.quality.recommendations.length > 0) {
    report += `### Recomendações\n`;
    result.quality.recommendations.forEach((rec, idx) => {
      report += `${idx + 1}. ${rec}\n`;
    });
    report += `\n`;
  }
  
  report += `### Status: ${result.isValid ? '✅ Dados válidos para importação' : '❌ Corrija os erros antes de importar'}\n`;
  
  return report;
}
