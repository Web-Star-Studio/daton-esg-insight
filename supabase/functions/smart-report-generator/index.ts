import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: 'emissions' | 'quality' | 'compliance' | 'esg' | 'gri' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  sections?: string[];
  includeCharts?: boolean;
  includeInsights?: boolean;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  config?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.company_id) throw new Error('Company not found');
    
    const requestData: ReportRequest = await req.json();
    
    console.log('Generating smart report:', {
      type: requestData.reportType,
      dateRange: requestData.dateRange,
      companyId: profile.company_id
    });
    
    // Fetch data based on report type
    const reportData = await fetchReportData(
      supabase,
      profile.company_id,
      requestData.reportType,
      requestData.dateRange,
      requestData.filters || {}
    );
    
    // Generate charts if requested
    const charts = requestData.includeCharts 
      ? await generateCharts(reportData, requestData.reportType)
      : [];
    
    // Generate AI insights if requested
    const insights = requestData.includeInsights
      ? await generateAIInsights(lovableApiKey, reportData, requestData.reportType)
      : null;
    
    // Calculate key metrics
    const metrics = calculateMetrics(reportData, requestData.reportType);
    
    const response = {
      success: true,
      report: {
        type: requestData.reportType,
        generatedAt: new Date().toISOString(),
        period: requestData.dateRange,
        data: reportData,
        metrics,
        charts,
        insights,
        summary: generateSummary(reportData, metrics, insights)
      }
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchReportData(
  supabase: any,
  companyId: string,
  reportType: string,
  dateRange: { start: string; end: string },
  filters: Record<string, any>
) {
  const data: any = {};
  
  switch (reportType) {
    case 'emissions':
      const { data: emissions } = await supabase
        .from('calculated_emissions')
        .select(`
          *,
          activity_data (
            *,
            emission_sources (*)
          )
        `)
        .gte('calculation_date', dateRange.start)
        .lte('calculation_date', dateRange.end);
      
      data.emissions = emissions || [];
      data.totalCO2e = emissions?.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0;
      data.byScope = {
        scope1: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 1)
          .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0,
        scope2: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 2)
          .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0,
        scope3: emissions?.filter((e: any) => e.activity_data?.emission_sources?.scope === 3)
          .reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0,
      };
      break;
      
    case 'quality':
      const { data: ncs } = await supabase
        .from('non_conformities')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
      
      data.nonConformities = ncs || [];
      data.totalNCs = ncs?.length || 0;
      data.byStatus = (ncs || []).reduce((acc: any, nc: any) => {
        acc[nc.status] = (acc[nc.status] || 0) + 1;
        return acc;
      }, {});
      break;
      
    case 'compliance':
      const { data: licenses } = await supabase
        .from('licenses')
        .select('*')
        .eq('company_id', companyId);
      
      data.licenses = licenses || [];
      data.totalLicenses = licenses?.length || 0;
      data.expiringSoon = licenses?.filter((l: any) => {
        const expiryDate = new Date(l.expiry_date);
        const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      }).length || 0;
      break;
      
    case 'esg':
      const { data: risks } = await supabase
        .from('esg_risks')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Ativo');
      
      data.risks = risks || [];
      data.totalRisks = risks?.length || 0;
      data.criticalRisks = risks?.filter((r: any) => r.inherent_risk_level === 'Crítico').length || 0;
      data.byCategory = (risks || []).reduce((acc: any, risk: any) => {
        acc[risk.category] = (acc[risk.category] || 0) + 1;
        return acc;
      }, {});
      break;
  }
  
  return data;
}

function generateCharts(reportData: any, reportType: string): ChartData[] {
  const charts: ChartData[] = [];
  
  switch (reportType) {
    case 'emissions':
      if (reportData.byScope) {
        charts.push({
          type: 'pie',
          title: 'Emissões por Escopo',
          data: [
            { name: 'Escopo 1', value: reportData.byScope.scope1 },
            { name: 'Escopo 2', value: reportData.byScope.scope2 },
            { name: 'Escopo 3', value: reportData.byScope.scope3 }
          ],
          xAxis: 'name',
          yAxis: 'value'
        });
      }
      
      if (reportData.emissions?.length > 0) {
        const monthlyData = reportData.emissions.reduce((acc: any, e: any) => {
          const month = new Date(e.calculation_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          acc[month] = (acc[month] || 0) + e.total_co2e;
          return acc;
        }, {});
        
        charts.push({
          type: 'line',
          title: 'Tendência Mensal de Emissões',
          data: Object.entries(monthlyData).map(([month, value]) => ({ month, value })),
          xAxis: 'month',
          yAxis: 'value'
        });
      }
      break;
      
    case 'quality':
      if (reportData.byStatus) {
        charts.push({
          type: 'bar',
          title: 'Não Conformidades por Status',
          data: Object.entries(reportData.byStatus).map(([status, count]) => ({ status, count })),
          xAxis: 'status',
          yAxis: 'count'
        });
      }
      break;
      
    case 'esg':
      if (reportData.byCategory) {
        charts.push({
          type: 'bar',
          title: 'Riscos ESG por Categoria',
          data: Object.entries(reportData.byCategory).map(([category, count]) => ({ category, count })),
          xAxis: 'category',
          yAxis: 'count'
        });
      }
      break;
  }
  
  return charts;
}

async function generateAIInsights(apiKey: string, reportData: any, reportType: string) {
  try {
    const prompt = buildInsightsPrompt(reportData, reportType);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de dados ESG e sustentabilidade. Analise os dados fornecidos e gere insights acionáveis, tendências e recomendações.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_insights",
            description: "Generate structured insights from report data",
            parameters: {
              type: "object",
              properties: {
                keyFindings: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 principais descobertas dos dados"
                },
                trends: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tendências identificadas"
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      impact: { type: "string" }
                    }
                  }
                },
                risks: {
                  type: "array",
                  items: { type: "string" },
                  description: "Riscos identificados"
                },
                opportunities: {
                  type: "array",
                  items: { type: "string" },
                  description: "Oportunidades identificadas"
                }
              },
              required: ["keyFindings", "recommendations"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      })
    });
    
    if (!response.ok) {
      console.error('AI insights error:', response.status, await response.text());
      return null;
    }
    
    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    
    return null;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
}

function buildInsightsPrompt(reportData: any, reportType: string): string {
  let prompt = `Analise os seguintes dados de ${reportType} e gere insights:\n\n`;
  
  prompt += `Dados: ${JSON.stringify(reportData, null, 2)}\n\n`;
  prompt += `Gere insights estruturados incluindo:\n`;
  prompt += `- Principais descobertas (key findings)\n`;
  prompt += `- Tendências identificadas\n`;
  prompt += `- Recomendações acionáveis com prioridades\n`;
  prompt += `- Riscos potenciais\n`;
  prompt += `- Oportunidades de melhoria\n`;
  
  return prompt;
}

function calculateMetrics(reportData: any, reportType: string) {
  const metrics: any = {};
  
  switch (reportType) {
    case 'emissions':
      metrics.totalEmissions = reportData.totalCO2e || 0;
      metrics.scope1Percentage = reportData.totalCO2e > 0 
        ? ((reportData.byScope?.scope1 || 0) / reportData.totalCO2e * 100).toFixed(1)
        : 0;
      metrics.scope2Percentage = reportData.totalCO2e > 0
        ? ((reportData.byScope?.scope2 || 0) / reportData.totalCO2e * 100).toFixed(1)
        : 0;
      metrics.scope3Percentage = reportData.totalCO2e > 0
        ? ((reportData.byScope?.scope3 || 0) / reportData.totalCO2e * 100).toFixed(1)
        : 0;
      break;
      
    case 'quality':
      metrics.totalNonConformities = reportData.totalNCs || 0;
      metrics.openNCs = reportData.byStatus?.['Aberta'] || 0;
      metrics.closedNCs = reportData.byStatus?.['Fechada'] || 0;
      metrics.resolutionRate = reportData.totalNCs > 0
        ? ((metrics.closedNCs / reportData.totalNCs) * 100).toFixed(1)
        : 0;
      break;
      
    case 'compliance':
      metrics.totalLicenses = reportData.totalLicenses || 0;
      metrics.expiringSoon = reportData.expiringSoon || 0;
      metrics.complianceRate = reportData.totalLicenses > 0
        ? (((reportData.totalLicenses - reportData.expiringSoon) / reportData.totalLicenses) * 100).toFixed(1)
        : 100;
      break;
      
    case 'esg':
      metrics.totalRisks = reportData.totalRisks || 0;
      metrics.criticalRisks = reportData.criticalRisks || 0;
      metrics.riskScore = reportData.totalRisks > 0
        ? ((reportData.criticalRisks / reportData.totalRisks) * 100).toFixed(1)
        : 0;
      break;
  }
  
  return metrics;
}

function generateSummary(reportData: any, metrics: any, insights: any) {
  const summary: any = {
    overview: `Relatório gerado com sucesso`,
    dataPoints: 0,
    metricsCalculated: Object.keys(metrics).length
  };
  
  // Count data points
  Object.values(reportData).forEach((value: any) => {
    if (Array.isArray(value)) {
      summary.dataPoints += value.length;
    }
  });
  
  if (insights) {
    summary.insightsGenerated = (insights.keyFindings?.length || 0) + 
                                (insights.recommendations?.length || 0);
    summary.hasAIAnalysis = true;
  }
  
  return summary;
}
