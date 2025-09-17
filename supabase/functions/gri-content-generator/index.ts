import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting GRI content generation...');
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Parse request body - handle different action types
    const body = await req.json();
    const { action, reportId, sectionKey, contentType, context, regenerate, format } = body;
    
    // Handle legacy format from AIContentGeneratorModal
    if (body.prompt && !action) {
      const legacyReportId = body.reportId;
      const legacySectionKey = body.sectionType;
      const legacyContentType = body.sectionTitle;
      const legacyContext = body.prompt;
      
      console.log(`Generating GRI content for section: ${legacySectionKey}, type: ${legacyContentType}`);
      
      return await handleSectionGeneration(supabaseClient, {
        reportId: legacyReportId,
        sectionKey: legacySectionKey,
        contentType: legacyContentType,
        context: legacyContext,
        regenerate: false
      });
    }

    console.log(`GRI content generator called with action: ${action}, reportId: ${reportId}`);

    // Handle different actions
    switch (action) {
      case 'preview':
      case 'export':
        return await handleReportGeneration(supabaseClient, reportId, format);
      
      default:
        // Section generation (requires sectionKey)
        if (!sectionKey) {
          return new Response(
            JSON.stringify({ error: 'sectionKey is required for content generation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Generating GRI content for section: ${sectionKey}, type: ${contentType}`);
        
        return await handleSectionGeneration(supabaseClient, {
          reportId,
          sectionKey,
          contentType,
          context,
          regenerate
        });
    }

  } catch (error) {
    console.error('Error in GRI content generator:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate GRI content', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Handle section generation
async function handleSectionGeneration(supabaseClient: any, params: any) {
  const { reportId, sectionKey, contentType, context, regenerate } = params;
  
  // Get report and company information
  const { data: reportData } = await supabaseClient
    .from('gri_reports')
    .select(`
      *,
      companies!inner(name, sector)
    `)
    .eq('id', reportId)
    .single();

  if (!reportData) {
    return new Response('Report not found', { status: 404, headers: corsHeaders });
  }

  // Get relevant indicators and existing content
  const { data: indicatorData } = await supabaseClient
    .from('gri_indicator_data')
    .select(`
      *,
      indicator:gri_indicators_library(*)
    `)
    .eq('report_id', reportId);

  // Get existing section content if not regenerating
  let existingContent = '';
  if (!regenerate) {
    const { data: sectionData } = await supabaseClient
      .from('gri_report_sections')
      .select('content')
      .eq('report_id', reportId)
      .eq('section_key', sectionKey)
      .single();
    
    existingContent = sectionData?.content || '';
  }

  // Generate content using AI
  const generatedContent = await generateGRIContent({
    reportData,
    sectionKey,
    contentType,
    context,
    indicatorData,
    existingContent,
    regenerate
  });

  // Update the section in database
  await supabaseClient
    .from('gri_report_sections')
    .upsert({
      report_id: reportId,
      section_key: sectionKey,
      content: generatedContent,
      ai_generated_content: true,
      last_ai_update: new Date().toISOString(),
      is_complete: generatedContent.length > 50,
      completion_percentage: generatedContent.length > 100 ? 100 : 50,
    });

  // Recalculate report completion
  await supabaseClient.rpc('calculate_gri_report_completion', {
    p_report_id: reportId
  });

  console.log('GRI content generated successfully');

  return new Response(
    JSON.stringify({ 
      success: true, 
      content: generatedContent,
      section_key: sectionKey
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle report generation for preview/export
async function handleReportGeneration(supabaseClient: any, reportId: string, format?: string) {
  try {
    console.log(`Generating full report for ${format || 'preview'}, reportId: ${reportId}`);
    
    // Get complete report data
    const { data: report } = await supabaseClient
      .from('gri_reports')
      .select(`
        *,
        companies!inner(name, sector, cnpj)
      `)
      .eq('id', reportId)
      .single();

    if (!report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all report sections
    const { data: sections } = await supabaseClient
      .from('gri_report_sections')
      .select('*')
      .eq('report_id', reportId)
      .order('section_key');

    // Get all indicators with data
    const { data: indicators } = await supabaseClient
      .from('gri_indicator_data')
      .select(`
        *,
        indicator:gri_indicators_library(*)
      `)
      .eq('report_id', reportId)
      .order('indicator.code');

    // Generate HTML report
    const htmlContent = generateHTMLReport({
      report,
      sections: sections || [],
      indicators: indicators || []
    });

    console.log(`Generated HTML report with ${htmlContent.length} characters`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: htmlContent,
        format: format || 'html'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate report', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  } catch (error) {
    console.error('Error in GRI content generator:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate GRI content', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateGRIContent({
  reportData,
  sectionKey,
  contentType,
  context,
  indicatorData,
  existingContent,
  regenerate
}: {
  reportData: any;
  sectionKey: string;
  contentType: string;
  context: any;
  indicatorData: any[];
  existingContent: string;
  regenerate: boolean;
}): Promise<string> {
  if (!openAIApiKey) {
    console.log('OpenAI API key not found, returning template content');
    return generateTemplateContent(sectionKey, reportData);
  }

  const prompt = buildGRIPrompt({
    reportData,
    sectionKey,
    contentType,
    context,
    indicatorData,
    existingContent,
    regenerate
  });

  try {
    console.log('Calling OpenAI API for GRI content generation...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em relatórios de sustentabilidade GRI. Sua função é gerar conteúdo profissional, técnico e alinhado com as melhores práticas GRI para relatórios corporativos de sustentabilidade.
            
            DIRETRIZES IMPORTANTES:
            - Use linguagem institucional profissional
            - Siga rigorosamente os padrões GRI
            - Inclua dados quantitativos quando disponíveis
            - Mantenha transparência e objetividade
            - Use formatação em markdown quando apropriado
            - Sugira onde dados adicionais são necessários`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI content generated successfully');
    return content;

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateTemplateContent(sectionKey, reportData);
  }
}

function buildGRIPrompt({
  reportData,
  sectionKey,
  contentType,
  context,
  indicatorData,
  existingContent,
  regenerate
}: any): string {
  const companyName = reportData.companies?.name || 'a organização';
  const sector = reportData.companies?.sector || 'não especificado';
  const year = reportData.year;

  let prompt = `Gere conteúdo para a seção "${sectionKey}" do relatório de sustentabilidade GRI ${year} da empresa "${companyName}" do setor "${sector}".`;

  // Add section-specific instructions
  switch (sectionKey) {
    case 'organizational_profile':
      prompt += `\n\nGere o perfil organizacional incluindo:
      - Visão geral da empresa e suas atividades
      - Estrutura organizacional
      - Localização das operações
      - Propriedade e forma jurídica`;
      break;
      
    case 'strategy':
      prompt += `\n\nGere conteúdo sobre estratégia de sustentabilidade incluindo:
      - Declaração de estratégia da alta liderança
      - Principais impactos, riscos e oportunidades
      - Compromissos e metas de sustentabilidade`;
      break;
      
    case 'environmental_performance':
      prompt += `\n\nGere conteúdo sobre performance ambiental incluindo:
      - Consumo de energia e água
      - Emissões de gases de efeito estufa
      - Gestão de resíduos
      - Impactos na biodiversidade`;
      break;
      
    case 'social_performance':
      prompt += `\n\nGere conteúdo sobre performance social incluindo:
      - Práticas de emprego
      - Saúde e segurança ocupacional
      - Treinamento e educação
      - Diversidade e igualdade de oportunidades`;
      break;
  }

  // Add available indicator data
  if (indicatorData && indicatorData.length > 0) {
    prompt += `\n\nDados de indicadores disponíveis:\n`;
    indicatorData.forEach((indicator: any) => {
      if (indicator.indicator && (indicator.numeric_value || indicator.text_value || indicator.percentage_value)) {
        prompt += `- ${indicator.indicator.code}: ${indicator.indicator.title}\n`;
        if (indicator.numeric_value) prompt += `  Valor: ${indicator.numeric_value} ${indicator.indicator.unit || ''}\n`;
        if (indicator.text_value) prompt += `  Descrição: ${indicator.text_value}\n`;
        if (indicator.percentage_value) prompt += `  Percentual: ${indicator.percentage_value}%\n`;
      }
    });
  }

  // Add existing content context if not regenerating
  if (existingContent && !regenerate) {
    prompt += `\n\nConteúdo existente para referência:\n${existingContent}`;
    prompt += `\n\nPor favor, melhore e expanda o conteúdo existente mantendo as informações já inseridas.`;
  }

  prompt += `\n\nGere um conteúdo profissional, bem estruturado e alinhado aos padrões GRI. Use markdown para formatação.`;

  return prompt;
}

function generateTemplateContent(sectionKey: string, reportData: any): string {
  const companyName = reportData.companies?.name || '[Nome da Empresa]';
  const year = reportData.year;

  const templates: Record<string, string> = {
    organizational_profile: `# Perfil Organizacional

## Sobre ${companyName}

${companyName} é uma organização comprometida com práticas sustentáveis e transparência em suas operações. Este relatório apresenta nosso desempenho em sustentabilidade para o ano de ${year}.

### Principais Atividades
[Descrever as principais atividades da organização]

### Localização das Operações
[Informar onde a organização opera]

### Estrutura Organizacional
[Descrever a estrutura legal e operacional]

*Este conteúdo é um modelo base. Por favor, personalize com informações específicas da sua organização.*`,

    strategy: `# Estratégia de Sustentabilidade

## Mensagem da Liderança

A sustentabilidade está no centro da estratégia de ${companyName}. Reconhecemos nossa responsabilidade em contribuir para um futuro mais sustentável.

## Principais Impactos, Riscos e Oportunidades

### Impactos Positivos
[Listar principais impactos positivos]

### Riscos Identificados  
[Descrever principais riscos relacionados à sustentabilidade]

### Oportunidades
[Identificar oportunidades de melhoria e crescimento sustentável]

*Este conteúdo é um modelo base. Por favor, personalize com informações específicas da sua estratégia.*`,

    environmental_performance: `# Performance Ambiental

## Gestão Ambiental

${companyName} implementa práticas de gestão ambiental baseadas nos melhores padrões internacionais.

## Principais Indicadores Ambientais

### Energia
[Reportar consumo energético e iniciativas de eficiência]

### Emissões
[Detalhar emissões de GEE por escopo]

### Água
[Informar consumo e gestão de recursos hídricos]

### Resíduos
[Descrever geração e destinação de resíduos]

*Este conteúdo é um modelo base. Por favor, personalize com dados específicos da sua performance ambiental.*`
  };

  return templates[sectionKey] || `# ${sectionKey}

Conteúdo da seção ${sectionKey} para ${companyName} - ${year}.

*Este é um modelo base. Por favor, personalize com informações específicas da sua organização.*`;
}

// Generate complete HTML report
function generateHTMLReport(data: any): string {
  const { report, sections, indicators } = data;
  const companyName = report.companies?.name || 'Empresa';
  const year = report.year;
  
  let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório GRI ${year} - ${companyName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .report-header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .report-title { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .report-subtitle { font-size: 1.2rem; opacity: 0.9; }
        .section {
            background: white;
            margin: 2rem 0;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h1 { color: #2563eb; border-bottom: 3px solid #e5e7eb; padding-bottom: 0.5rem; }
        .section h2 { color: #374151; margin-top: 2rem; }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .metadata-item {
            padding: 1rem;
            background: #f3f4f6;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .metadata-label { font-weight: bold; color: #374151; margin-bottom: 0.5rem; }
        .indicators-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .indicator-card {
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .indicator-code { font-weight: bold; color: #2563eb; margin-bottom: 0.5rem; }
        .indicator-title { font-size: 1.1rem; margin-bottom: 1rem; color: #374151; }
        .indicator-value { font-size: 1.3rem; font-weight: bold; color: #059669; }
        .print-break { page-break-before: always; }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1 class="report-title">Relatório de Sustentabilidade GRI</h1>
        <p class="report-subtitle">${companyName} • ${year}</p>
    </div>`;

  // Report metadata
  html += `
    <div class="section">
        <h1>Informações do Relatório</h1>
        <div class="metadata-grid">
            <div class="metadata-item">
                <div class="metadata-label">Padrão GRI</div>
                <div>${report.gri_standard_version}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Período de Reporte</div>
                <div>${report.reporting_period_start} a ${report.reporting_period_end}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Status</div>
                <div>${report.status}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Progresso</div>
                <div>${report.completion_percentage}% completo</div>
            </div>
        </div>`;

  // Executive Summary
  if (report.executive_summary) {
    html += `
        <h2>Sumário Executivo</h2>
        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${report.executive_summary.replace(/\n/g, '<br>')}
        </div>`;
  }

  // CEO Message
  if (report.ceo_message) {
    html += `
        <h2>Mensagem da Liderança</h2>
        <div style="background: #fefce8; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #eab308;">
            ${report.ceo_message.replace(/\n/g, '<br>')}
        </div>`;
  }

  html += `</div>`;

  // Sections
  if (sections.length > 0) {
    sections.forEach((section: any) => {
      if (section.content) {
        html += `
            <div class="section print-break">
                <h1>${section.section_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h1>
                <div>${section.content.replace(/\n/g, '<br>').replace(/#{1,6}\s/g, '<strong>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</div>
            </div>`;
      }
    });
  }

  // Indicators
  if (indicators.length > 0) {
    html += `
        <div class="section print-break">
            <h1>Indicadores GRI</h1>
            <div class="indicators-grid">`;
    
    indicators.forEach((indicator: any) => {
      if (indicator.indicator && (indicator.numeric_value || indicator.text_value || indicator.percentage_value)) {
        let value = '';
        if (indicator.numeric_value) value = `${indicator.numeric_value} ${indicator.indicator.unit || ''}`;
        else if (indicator.percentage_value) value = `${indicator.percentage_value}%`;
        else if (indicator.text_value) value = indicator.text_value;
        
        html += `
            <div class="indicator-card">
                <div class="indicator-code">${indicator.indicator.code}</div>
                <div class="indicator-title">${indicator.indicator.title}</div>
                <div class="indicator-value">${value}</div>
            </div>`;
      }
    });
    
    html += `</div></div>`;
  }

  html += `
    <div class="section">
        <h1>Informações Técnicas</h1>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>CNPJ:</strong> ${report.companies?.cnpj || 'Não informado'}</p>
    </div>
</body>
</html>`;

  return html;
}