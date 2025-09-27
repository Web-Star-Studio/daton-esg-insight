import { supabase } from '@/integrations/supabase/client';
import handleServiceError from '@/utils/errorHandler';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'emissions' | 'quality' | 'compliance' | 'esg' | 'gri' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule?: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  filters: Record<string, any>;
  recipients?: string[];
  template?: string;
  dataSources: string[];
}

export interface ReportData {
  metadata: {
    reportId: string;
    generatedAt: Date;
    period: { start: Date; end: Date };
    filters: Record<string, any>;
  };
  sections: Array<{
    title: string;
    type: 'chart' | 'table' | 'summary' | 'text';
    data: any;
    visualConfig?: any;
  }>;
  summary: {
    totalRecords: number;
    keyInsights: string[];
    recommendations: string[];
    complianceScore?: number;
  };
}

class AdvancedReportingService {
  async generateReport(config: ReportConfig): Promise<ReportData> {
    try {
      const reportData: ReportData = {
        metadata: {
          reportId: config.id,
          generatedAt: new Date(),
          period: this.getPeriodFromFilters(config.filters),
          filters: config.filters
        },
        sections: [],
        summary: {
          totalRecords: 0,
          keyInsights: [],
          recommendations: []
        }
      };

      // Generate sections based on report type
      switch (config.type) {
        case 'emissions':
          reportData.sections = await this.generateEmissionsReport(config);
          break;
        case 'quality':
          reportData.sections = await this.generateQualityReport(config);
          break;
        case 'compliance':
          reportData.sections = await this.generateComplianceReport(config);
          break;
        case 'esg':
          reportData.sections = await this.generateESGReport(config);
          break;
        case 'gri':
          reportData.sections = await this.generateGRIReport(config);
          break;
        case 'custom':
          reportData.sections = await this.generateCustomReport(config);
          break;
      }

      // Generate summary and insights
      reportData.summary = await this.generateReportSummary(reportData.sections);

      return reportData;
    } catch (error) {
      throw handleServiceError.handle(error, { function: 'generateReport' });
    }
  }

  private async generateEmissionsReport(config: ReportConfig) {
    const sections = [];

    // Emissions overview
    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select(`
        *,
        activity_data (
          *,
          emission_sources (*)
        )
      `)
      .gte('calculation_date', config.filters.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .lte('calculation_date', config.filters.endDate || new Date());

    sections.push({
      title: 'Resumo de Emissões',
      type: 'summary' as const,
      data: {
        totalEmissions: emissions?.reduce((sum, e) => sum + e.total_co2e, 0) || 0,
        scope1: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 1)
          .reduce((sum, e) => sum + e.total_co2e, 0) || 0,
        scope2: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 2)
          .reduce((sum, e) => sum + e.total_co2e, 0) || 0,
        scope3: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 3)
          .reduce((sum, e) => sum + e.total_co2e, 0) || 0,
      }
    });

    // Monthly trend chart
    sections.push({
      title: 'Tendência Mensal de Emissões',
      type: 'chart' as const,
      data: emissions,
      visualConfig: {
        chartType: 'line',
        xAxis: 'calculation_date',
        yAxis: 'total_co2e',
        groupBy: 'month'
      }
    });

    return sections;
  }

  private async generateQualityReport(config: ReportConfig) {
    const sections = [];

    // Quality indicators
    const { data: indicators } = await supabase
      .from('quality_indicators')
      .select('*')
      .eq('company_id', config.filters.companyId);

    sections.push({
      title: 'Indicadores de Qualidade',
      type: 'table' as const,
      data: indicators
    });

    // Non-conformities
    const { data: nonConformities } = await supabase
      .from('non_conformities')
      .select('*')
      .eq('company_id', config.filters.companyId)
      .gte('created_at', config.filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    sections.push({
      title: 'Não Conformidades',
      type: 'chart' as const,
      data: nonConformities,
      visualConfig: {
        chartType: 'bar',
        groupBy: 'status'
      }
    });

    return sections;
  }

  private async generateComplianceReport(config: ReportConfig) {
    const sections = [];

    // Compliance tasks
    const { data: tasks } = await supabase
      .from('compliance_tasks')
      .select('*')
      .eq('company_id', config.filters.companyId);

    const completedTasks = tasks?.filter(t => t.status === 'Concluído').length || 0;
    const totalTasks = tasks?.length || 0;
    const complianceScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    sections.push({
      title: 'Score de Compliance',
      type: 'summary' as const,
      data: {
        score: complianceScore,
        completed: completedTasks,
        total: totalTasks,
        overdue: tasks?.filter(t => t.status === 'Pendente' && new Date(t.due_date) < new Date()).length || 0
      }
    });

    return sections;
  }

  private async generateESGReport(config: ReportConfig) {
    const sections = [];

    // ESG risks
    const { data: risks } = await supabase
      .from('esg_risks')
      .select('*')
      .eq('company_id', config.filters.companyId);

    sections.push({
      title: 'Riscos ESG',
      type: 'chart' as const,
      data: risks,
      visualConfig: {
        chartType: 'pie',
        groupBy: 'inherent_risk_level'
      }
    });

    return sections;
  }

  private async generateGRIReport(config: ReportConfig) {
    const sections = [];

    // GRI indicators
    const { data: indicators } = await supabase
      .from('gri_indicator_data')
      .select(`
        *,
        gri_indicators_library (*)
      `)
      .eq('report_id', config.filters.reportId);

    sections.push({
      title: 'Indicadores GRI',
      type: 'table' as const,
      data: indicators
    });

    return sections;
  }

  private async generateCustomReport(config: ReportConfig) {
    const sections = [];

    // Execute custom queries based on data sources
    for (const source of config.dataSources) {
      try {
        // Only query known safe tables to avoid TypeScript errors
        const validTables = ['calculated_emissions', 'activity_data', 'emission_sources', 'quality_indicators', 'non_conformities', 'compliance_tasks'];
        
        if (!validTables.includes(source)) {
          sections.push({
            title: `Dados: ${source}`,
            type: 'table' as const,
            data: [{ message: `Tabela ${source} não disponível` }]
          });
          continue;
        }

        const { data } = await supabase
          .from(source as any)
          .select('*')
          .limit(100);

        sections.push({
          title: `Dados: ${source}`,
          type: 'table' as const,
          data: data || []
        });
      } catch (error) {
        console.error(`Error fetching data from ${source}:`, error);
        sections.push({
          title: `Dados: ${source}`,
          type: 'table' as const,
          data: [{ error: `Erro ao buscar dados de ${source}` }]
        });
      }
    }

    return sections;
  }

  private async generateReportSummary(sections: any[]) {
    const totalRecords = sections.reduce((sum, section) => {
      return sum + (Array.isArray(section.data) ? section.data.length : 0);
    }, 0);

    const keyInsights = [
      'Dados coletados com sucesso',
      `Total de ${totalRecords} registros processados`,
      'Análise completa disponível nas seções detalhadas'
    ];

    const recommendations = [
      'Revisar tendências identificadas',
      'Implementar ações corretivas quando necessário',
      'Monitorar métricas-chave continuamente'
    ];

    return {
      totalRecords,
      keyInsights,
      recommendations
    };
  }

  private getPeriodFromFilters(filters: Record<string, any>) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = filters.endDate ? new Date(filters.endDate) : new Date();
    
    return { start, end };
  }

  async exportReport(reportData: ReportData, format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<Blob> {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      
      case 'csv':
        return this.exportToCSV(reportData);
      
      case 'excel':
        return this.exportToExcel(reportData);
      
      case 'pdf':
        return this.exportToPDF(reportData);
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToCSV(reportData: ReportData): Blob {
    const csvContent = reportData.sections
      .filter(section => section.type === 'table')
      .map(section => {
        if (!section.data || !Array.isArray(section.data) || section.data.length === 0) {
          return `${section.title}\nNo data available\n\n`;
        }
        const headers = Object.keys(section.data[0]).join(',');
        const rows = section.data.map((row: any) => Object.values(row).join(',')).join('\n');
        return `${section.title}\n${headers}\n${rows}\n\n`;
      })
      .join('');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private exportToExcel(reportData: ReportData): Blob {
    // Simplified Excel export - in production, use libraries like SheetJS
    const content = JSON.stringify(reportData, null, 2);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private exportToPDF(reportData: ReportData): Blob {
    // Simplified PDF export - in production, use libraries like jsPDF
    const content = JSON.stringify(reportData, null, 2);
    return new Blob([content], { type: 'application/pdf' });
  }

  async scheduleReport(config: ReportConfig): Promise<void> {
    if (config.schedule === 'manual') return;

    // Store scheduled report configuration (placeholder - would need database table)
    console.log('Scheduling report:', config.name, 'for', config.schedule);
  }

  private calculateNextRun(schedule: string): Date {
    const now = new Date();
    
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        return nextQuarter;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  async getReportTemplates(): Promise<ReportConfig[]> {
    const templates: ReportConfig[] = [
      {
        id: 'emissions-monthly',
        name: 'Relatório Mensal de Emissões',
        description: 'Análise completa das emissões de GEE do período',
        type: 'emissions',
        format: 'pdf',
        schedule: 'monthly',
        filters: {},
        dataSources: ['calculated_emissions', 'activity_data', 'emission_sources']
      },
      {
        id: 'quality-dashboard',
        name: 'Dashboard de Qualidade',
        description: 'Indicadores e não conformidades de qualidade',
        type: 'quality',
        format: 'excel',
        schedule: 'weekly',
        filters: {},
        dataSources: ['quality_indicators', 'non_conformities', 'audit_findings']
      },
      {
        id: 'compliance-status',
        name: 'Status de Compliance',
        description: 'Situação das obrigações regulatórias',
        type: 'compliance',
        format: 'pdf',
        schedule: 'monthly',
        filters: {},
        dataSources: ['compliance_tasks', 'licenses', 'legal_requirements']
      },
      {
        id: 'esg-comprehensive',
        name: 'Relatório ESG Completo',
        description: 'Análise abrangente de fatores ESG',
        type: 'esg',
        format: 'pdf',
        schedule: 'quarterly',
        filters: {},
        dataSources: ['esg_risks', 'goals', 'calculated_emissions', 'board_members']
      }
    ];

    return templates;
  }
}

export const advancedReportingService = new AdvancedReportingService();