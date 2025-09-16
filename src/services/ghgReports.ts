import { supabase } from "@/integrations/supabase/client";
import { getEmissionStats } from "./emissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface GHGReport {
  id: string;
  company_id: string;
  report_year: number;
  report_type: 'annual' | 'verification' | 'rpe';
  scope_1_total: number;
  scope_2_location_total: number;
  scope_2_market_total: number;
  scope_3_total: number;
  biogenic_co2: number;
  methodology_version: string;
  verification_status: 'not_verified' | 'third_party' | 'internal' | 'limited_assurance' | 'reasonable_assurance';
  report_data: any;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReportData {
  company_info: {
    name: string;
    cnpj: string;
    sector: string;
    address?: string;
  };
  inventory_info: {
    year: number;
    methodology_version: string;
    reporting_date: string;
    responsible_person: string;
    verification_status: string;
  };
  emissions_summary: {
    scope_1: number;
    scope_2_location: number;
    scope_2_market: number;
    scope_3: number;
    total: number;
    biogenic_co2: number;
  };
  detailed_emissions: {
    scope_1: Array<{category: string; subcategory?: string; emissions: number; unit: string}>;
    scope_2: Array<{category: string; subcategory?: string; emissions: number; unit: string}>;
    scope_3: Array<{category: string; subcategory?: string; emissions: number; unit: string}>;
  };
  calculation_methodology: {
    emission_factors_used: Array<{source: string; category: string; factor_value: number; unit: string}>;
    assumptions: string[];
    data_quality: string;
    uncertainty_assessment?: string;
  };
  comparisons: {
    previous_year?: {
      year: number;
      scope_1: number;
      scope_2: number;
      scope_3: number;
      total: number;
    };
    industry_benchmark?: {
      sector_average: number;
      comparison_metric: string;
    };
  };
  [key: string]: any; // Allow index signature for Json compatibility
}

// Gerar relatório anual completo
export async function generateAnnualReport(year: number): Promise<GHGReport> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  // Buscar dados da empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single();

  // Obter estatísticas de emissões atuais
  const emissionsStats = await getEmissionStats();

  // Buscar emissões detalhadas por categoria
  const detailedEmissions = await getDetailedEmissions();

  // Buscar fatores de emissão utilizados
  const emissionFactors = await getUsedEmissionFactors();

  // Montar dados do relatório
  const reportData: ReportData = {
    company_info: {
      name: company?.name || 'Empresa',
      cnpj: company?.cnpj || '',
      sector: company?.sector || 'Não informado',
    },
    inventory_info: {
      year: year,
      methodology_version: '2025.0.1',
      reporting_date: format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
      responsible_person: profile.full_name || 'Responsável',
      verification_status: 'not_verified'
    },
    emissions_summary: {
      scope_1: emissionsStats.escopo1 || 0,
      scope_2_location: emissionsStats.escopo2 || 0,
      scope_2_market: 0, // Implementar cálculo market-based quando disponível
      scope_3: emissionsStats.escopo3 || 0,
      total: emissionsStats.total || 0,
      biogenic_co2: 0 // Implementar cálculo de CO2 biogênico
    },
    detailed_emissions: detailedEmissions,
    calculation_methodology: {
      emission_factors_used: emissionFactors,
      assumptions: [
        'Fatores de emissão baseados no GHG Protocol brasileiro 2025.0.1',
        'GWP baseados no IPCC AR5 (CH4=28, N2O=265)',
        'Dados de atividade coletados internamente',
        'Período de inventário: janeiro a dezembro de ' + year
      ],
      data_quality: 'Dados primários coletados internamente com verificação de qualidade'
    },
    comparisons: {
      // Implementar comparação com ano anterior quando disponível
    }
  };

  // Salvar relatório no banco
  const { data: report, error } = await supabase
    .from('ghg_reports')
    .upsert({
      company_id: profile.company_id,
      report_year: year,
      report_type: 'annual' as const,
      scope_1_total: reportData.emissions_summary.scope_1,
      scope_2_location_total: reportData.emissions_summary.scope_2_location,
      scope_2_market_total: reportData.emissions_summary.scope_2_market,
      scope_3_total: reportData.emissions_summary.scope_3,
      biogenic_co2: reportData.emissions_summary.biogenic_co2,
      methodology_version: '2025.0.1',
      verification_status: 'not_verified' as const,
      report_data: reportData as any
    }, {
      onConflict: 'company_id,report_year,report_type'
    })
    .select()
    .single();

  if (error) throw error;
  return report as GHGReport;
}

// Gerar relatório para RPE (Registro Público de Emissões)
export async function generateRPEReport(year: number): Promise<GHGReport> {
  const annualReport = await generateAnnualReport(year);
  
  // Formato específico do RPE - dados simplificados
  const rpeData = {
    ...annualReport.report_data,
    rpe_format: {
      total_emissions: annualReport.scope_1_total + annualReport.scope_2_location_total + annualReport.scope_3_total,
      scope_1_combustion_stationary: 0, // Extrair dados específicos
      scope_1_combustion_mobile: 0,
      scope_1_fugitive: 0,
      scope_1_industrial_processes: 0,
      scope_2_electricity: annualReport.scope_2_location_total,
      scope_3_selected_categories: annualReport.scope_3_total
    }
  };

  const { data: rpeReport, error } = await supabase
    .from('ghg_reports')
    .upsert({
      company_id: annualReport.company_id,
      report_year: year,
      report_type: 'rpe' as const,
      scope_1_total: annualReport.scope_1_total,
      scope_2_location_total: annualReport.scope_2_location_total,
      scope_2_market_total: annualReport.scope_2_market_total,
      scope_3_total: annualReport.scope_3_total,
      biogenic_co2: annualReport.biogenic_co2,
      methodology_version: annualReport.methodology_version,
      verification_status: annualReport.verification_status,
      report_data: rpeData as any
    }, {
      onConflict: 'company_id,report_year,report_type'
    })
    .select()
    .single();

  if (error) throw error;
  return rpeReport as GHGReport;
}

// Obter relatórios existentes
export async function getGHGReports(year?: number): Promise<GHGReport[]> {
  let query = supabase
    .from('ghg_reports')
    .select('*')
    .order('report_year', { ascending: false })
    .order('created_at', { ascending: false });

  if (year) {
    query = query.eq('report_year', year);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GHGReport[];
}

// Exportar relatório em diferentes formatos
export async function exportReport(reportId: string, format: 'pdf' | 'xlsx' | 'json'): Promise<Blob> {
  const { data: report, error } = await supabase
    .from('ghg_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) throw error;

  switch (format) {
    case 'json':
      return new Blob([JSON.stringify(report.report_data, null, 2)], { type: 'application/json' });
    
    case 'xlsx':
      // Implementar export Excel usando uma biblioteca como xlsx
      return await exportToExcel(report as GHGReport);
    
    case 'pdf':
      // Implementar export PDF
      return await exportToPDF(report as GHGReport);
    
    default:
      throw new Error('Formato não suportado');
  }
}

// Obter emissões detalhadas por categoria
async function getDetailedEmissions() {
  const { data: emissions } = await supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      activity_data (
        emission_sources (
          scope,
          category,
          subcategory
        )
      )
    `);

  const scope1: Array<{category: string; subcategory?: string; emissions: number; unit: string}> = [];
  const scope2: Array<{category: string; subcategory?: string; emissions: number; unit: string}> = [];
  const scope3: Array<{category: string; subcategory?: string; emissions: number; unit: string}> = [];

  const categoryTotals: Record<string, {scope: number; emissions: number; subcategory?: string}> = {};

  emissions?.forEach(emission => {
    const source = emission.activity_data?.emission_sources;
    if (!source) return;

    const key = `${source.scope}-${source.category}-${source.subcategory || ''}`;
    
    if (!categoryTotals[key]) {
      categoryTotals[key] = {
        scope: source.scope,
        emissions: 0,
        subcategory: source.subcategory
      };
    }
    
    categoryTotals[key].emissions += emission.total_co2e || 0;
  });

  Object.entries(categoryTotals).forEach(([key, data]) => {
    const [scope, category] = key.split('-');
    const item = {
      category,
      subcategory: data.subcategory,
      emissions: Math.round(data.emissions * 100) / 100,
      unit: 'tCO₂e'
    };

    if (data.scope === 1) scope1.push(item);
    else if (data.scope === 2) scope2.push(item);
    else if (data.scope === 3) scope3.push(item);
  });

  return { scope_1: scope1, scope_2: scope2, scope_3: scope3 };
}

// Obter fatores de emissão utilizados
async function getUsedEmissionFactors() {
  const { data: factors } = await supabase
    .from('calculated_emissions')
    .select(`
      emission_factors (
        name,
        category,
        source,
        co2_factor,
        ch4_factor,
        n2o_factor,
        activity_unit
      )
    `);

  const uniqueFactors = factors?.reduce((acc: any[], curr) => {
    const factor = curr.emission_factors;
    if (!factor) return acc;

    const existing = acc.find(f => 
      f.source === factor.source && 
      f.category === factor.category && 
      f.factor_value === factor.co2_factor
    );

    if (!existing) {
      acc.push({
        source: factor.source,
        category: factor.category,
        factor_value: factor.co2_factor,
        unit: `kg CO₂/${factor.activity_unit}`
      });
    }

    return acc;
  }, []) || [];

  return uniqueFactors;
}

// Placeholder para export Excel
async function exportToExcel(report: GHGReport): Promise<Blob> {
  // Implementar usando biblioteca como xlsx ou exceljs
  const csvContent = generateCSVContent(report);
  return new Blob([csvContent], { type: 'text/csv' });
}

// Placeholder para export PDF
async function exportToPDF(report: GHGReport): Promise<Blob> {
  // Implementar usando biblioteca como jsPDF ou puppeteer
  const htmlContent = generateHTMLReport(report);
  return new Blob([htmlContent], { type: 'text/html' });
}

// Gerar conteúdo CSV simplificado
function generateCSVContent(report: GHGReport): string {
  const data = report.report_data as ReportData;
  
  const lines = [
    'Relatório de Emissões GEE',
    `Empresa,${data.company_info.name}`,
    `Ano de Referência,${data.inventory_info.year}`,
    `Metodologia,${data.inventory_info.methodology_version}`,
    '',
    'Resumo de Emissões (tCO₂e)',
    `Escopo 1,${data.emissions_summary.scope_1}`,
    `Escopo 2 (Localização),${data.emissions_summary.scope_2_location}`,
    `Escopo 3,${data.emissions_summary.scope_3}`,
    `Total,${data.emissions_summary.total}`,
    '',
    'Emissões Detalhadas por Categoria',
    'Escopo,Categoria,Emissões (tCO₂e)'
  ];

  // Adicionar detalhes por categoria
  data.detailed_emissions.scope_1.forEach(item => {
    lines.push(`1,${item.category},${item.emissions}`);
  });

  data.detailed_emissions.scope_2.forEach(item => {
    lines.push(`2,${item.category},${item.emissions}`);
  });

  data.detailed_emissions.scope_3.forEach(item => {
    lines.push(`3,${item.category},${item.emissions}`);
  });

  return lines.join('\n');
}

// Gerar HTML do relatório
function generateHTMLReport(report: GHGReport): string {
  const data = report.report_data as ReportData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório GHG Protocol - ${data.company_info.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .summary-table { width: 100%; border-collapse: collapse; }
        .summary-table th, .summary-table td { border: 1px solid #ccc; padding: 8px; text-align: right; }
        .summary-table th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Emissões de Gases de Efeito Estufa</h1>
        <h2>${data.company_info.name}</h2>
        <p>Ano de Referência: ${data.inventory_info.year}</p>
      </div>
      
      <div class="section">
        <h3>Resumo de Emissões</h3>
        <table class="summary-table">
          <tr><th>Escopo</th><th>Emissões (tCO₂e)</th></tr>
          <tr><td>Escopo 1</td><td>${data.emissions_summary.scope_1}</td></tr>
          <tr><td>Escopo 2</td><td>${data.emissions_summary.scope_2_location}</td></tr>
          <tr><td>Escopo 3</td><td>${data.emissions_summary.scope_3}</td></tr>
          <tr><th>Total</th><th>${data.emissions_summary.total}</th></tr>
        </table>
      </div>
      
      <div class="section">
        <h3>Metodologia</h3>
        <p><strong>Versão:</strong> ${data.inventory_info.methodology_version}</p>
        <p><strong>Data do Relatório:</strong> ${data.inventory_info.reporting_date}</p>
        <p><strong>Responsável:</strong> ${data.inventory_info.responsible_person}</p>
      </div>
    </body>
    </html>
  `;
}

// Atualizar status de verificação
export async function updateVerificationStatus(
  reportId: string, 
  status: GHGReport['verification_status']
): Promise<GHGReport> {
  const { data, error } = await supabase
    .from('ghg_reports')
    .update({ verification_status: status })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as GHGReport;
}