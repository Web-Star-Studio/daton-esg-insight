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

    // Parse request body - handle both old and new payload formats
    let reportId, sectionKey, contentType, context, regenerate;
    const body = await req.json();
    
    if (body.prompt) {
      // Legacy format from AIContentGeneratorModal
      reportId = body.reportId;
      sectionKey = body.sectionType;
      contentType = body.sectionTitle;
      context = body.prompt;
      regenerate = false;
    } else {
      // New format
      ({ reportId, sectionKey, contentType, context, regenerate } = body);
    }

    console.log(`Generating GRI content for section: ${sectionKey}, type: ${contentType}`);

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