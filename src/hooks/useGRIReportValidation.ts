import { useState, useCallback } from 'react';
import { type GRIReport, type GRIIndicatorData } from '@/services/griReports';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function useGRIReportValidation() {
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  const validateReport = useCallback((report: GRIReport): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // Validate basic report info
    if (!report.title || report.title.length < 5) {
      issues.push({
        field: 'title',
        message: 'O título do relatório deve ter pelo menos 5 caracteres',
        severity: 'error'
      });
    }

    if (!report.year || report.year < 2000 || report.year > new Date().getFullYear() + 1) {
      issues.push({
        field: 'year',
        message: 'Ano do relatório inválido',
        severity: 'error'
      });
    }

    if (!report.reporting_period_start || !report.reporting_period_end) {
      issues.push({
        field: 'reporting_period',
        message: 'Período de reporte deve ser especificado',
        severity: 'error'
      });
    }

    if (report.reporting_period_start && report.reporting_period_end) {
      const start = new Date(report.reporting_period_start);
      const end = new Date(report.reporting_period_end);
      
      if (start >= end) {
        issues.push({
          field: 'reporting_period',
          message: 'A data de início deve ser anterior à data de fim',
          severity: 'error'
        });
      }

      // Check if period is reasonable (not more than 2 years)
      const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 2) {
        issues.push({
          field: 'reporting_period',
          message: 'Período de reporte parece muito longo (mais de 2 anos)',
          severity: 'warning'
        });
      }
    }

    // Validate completion percentage
    if (report.completion_percentage < 30 && report.status !== 'Rascunho') {
      issues.push({
        field: 'completion_percentage',
        message: `Relatório com apenas ${report.completion_percentage}% concluído não deveria ter status "${report.status}"`,
        severity: 'warning'
      });
    }

    // Check for published reports
    if (report.status === 'Publicado' && !report.publication_date) {
      issues.push({
        field: 'publication_date',
        message: 'Relatório publicado deve ter data de publicação',
        severity: 'error'
      });
    }

    setValidationIssues(issues);
    return issues;
  }, []);

  const validateIndicatorData = useCallback((indicatorData: GRIIndicatorData[]): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    
    // Check for mandatory indicators without data
    const mandatoryIncomplete = indicatorData.filter(
      ind => ind.indicator?.is_mandatory && !ind.is_complete
    );

    if (mandatoryIncomplete.length > 0) {
      issues.push({
        field: 'indicators',
        message: `${mandatoryIncomplete.length} indicadores obrigatórios ainda não estão completos`,
        severity: 'warning'
      });
    }

    // Check for indicators with values but missing methodology
    const missingMethodology = indicatorData.filter(
      ind => (ind.numeric_value || ind.text_value) && !ind.methodology
    );

    if (missingMethodology.length > 0) {
      issues.push({
        field: 'indicators',
        message: `${missingMethodology.length} indicadores têm valores mas falta descrição de metodologia`,
        severity: 'info'
      });
    }

    // Check for numeric indicators without units
    const missingUnits = indicatorData.filter(
      ind => ind.numeric_value && !ind.unit && ind.indicator?.data_type === 'Numérico'
    );

    if (missingUnits.length > 0) {
      issues.push({
        field: 'indicators',
        message: `${missingUnits.length} indicadores numéricos sem unidade de medida especificada`,
        severity: 'warning'
      });
    }

    setValidationIssues(prev => [...prev, ...issues]);
    return issues;
  }, []);

  const clearValidation = useCallback(() => {
    setValidationIssues([]);
  }, []);

  const hasErrors = validationIssues.some(issue => issue.severity === 'error');
  const hasWarnings = validationIssues.some(issue => issue.severity === 'warning');

  return {
    validationIssues,
    validateReport,
    validateIndicatorData,
    clearValidation,
    hasErrors,
    hasWarnings,
    isValid: !hasErrors
  };
}
