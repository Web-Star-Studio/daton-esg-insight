import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  try {
    const { indicatorCode, companyId, reportId } = await req.json();
    
    console.log(`Auto-filling indicator: ${indicatorCode} for company: ${companyId}`);

    // First, try database function for data-based suggestions
    const { data: dbSuggestion } = await supabaseClient.rpc('get_indicator_suggested_value', {
      p_company_id: companyId,
      p_indicator_code: indicatorCode
    });

    // If database has a suggestion with actual value, use it
    if (dbSuggestion && dbSuggestion.suggested_value !== null && dbSuggestion.suggested_value !== undefined) {
      console.log(`Using database suggestion for ${indicatorCode}`);
      return new Response(JSON.stringify(dbSuggestion), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no database suggestion, use AI to generate intelligent default
    console.log(`No database data, generating AI suggestion for ${indicatorCode}`);
    
    // Fetch company and indicator details
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, sector, cnpj')
      .eq('id', companyId)
      .single();

    const { data: indicator } = await supabaseClient
      .from('gri_indicators_library')
      .select('*')
      .eq('code', indicatorCode)
      .single();

    if (!indicator) {
      return new Response(JSON.stringify({ 
        error: 'Indicator not found',
        suggested_value: null,
        confidence: 'none'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI suggestion
    const aiSuggestion = await generateAISuggestion(
      lovableApiKey!,
      indicator,
      company,
      companyId,
      supabaseClient
    );

    return new Response(JSON.stringify(aiSuggestion), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-fill:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      suggested_value: null,
      confidence: 'none'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAISuggestion(
  apiKey: string,
  indicator: any,
  company: any,
  companyId: string,
  supabaseClient: any
) {
  if (!apiKey) {
    console.log('No LOVABLE_API_KEY, returning template');
    return generateTemplateSuggestion(indicator, company);
  }

  try {
    // Gather context about the company
    const context = await gatherCompanyContext(companyId, supabaseClient);
    
    const prompt = buildAIPrompt(indicator, company, context);
    
    console.log('Calling Lovable AI for suggestion...');
    
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
            content: 'Você é um especialista em relatórios de sustentabilidade GRI. Sua tarefa é sugerir valores realistas e adequados para indicadores GRI baseado no contexto da empresa. Responda APENAS com o valor sugerido, sem explicações adicionais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestedValue = data.choices[0].message.content.trim();
    
    return {
      suggested_value: suggestedValue,
      data_source: 'ai_generated',
      confidence: 'medium',
      unit: indicator.unit,
      note: 'Valor sugerido por IA - requer validação'
    };

  } catch (error) {
    console.error('Error calling AI:', error);
    return generateTemplateSuggestion(indicator, company);
  }
}

async function gatherCompanyContext(companyId: string, supabaseClient: any) {
  const context: any = {};

  // Check for employee data
  const { data: employees, count: employeeCount } = await supabaseClient
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'Ativo');
  
  context.employeeCount = employeeCount || 0;

  // Check for emission data
  const { data: emissions, count: emissionCount } = await supabaseClient
    .from('emission_sources')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  context.hasEmissionData = (emissionCount || 0) > 0;

  // Check for governance data
  const { data: board, count: boardCount } = await supabaseClient
    .from('board_members')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
  
  context.hasBoardData = (boardCount || 0) > 0;

  return context;
}

function buildAIPrompt(indicator: any, company: any, context: any) {
  const companyInfo = `
Empresa: ${company?.name || 'Empresa'}
Setor: ${company?.sector || 'Não especificado'}
Funcionários: ${context.employeeCount || 'Não informado'}
Possui dados de emissões: ${context.hasEmissionData ? 'Sim' : 'Não'}
Possui estrutura de governança: ${context.hasBoardData ? 'Sim' : 'Não'}
`;

  const indicatorInfo = `
Código GRI: ${indicator.code}
Nome: ${indicator.title}
Descrição: ${indicator.description}
Tipo de dado: ${indicator.data_type}
Orientação: ${indicator.guidance_text || 'N/A'}
`;

  return `${companyInfo}

${indicatorInfo}

Com base nas informações da empresa, sugira um valor apropriado para este indicador GRI. 

IMPORTANTE:
- Se o tipo de dado for "Texto", forneça uma resposta textual clara e objetiva (máximo 3 parágrafos)
- Se for "Numérico", forneça apenas um número
- Se for "Percentual", forneça apenas um número (sem o símbolo %)
- Se for "Booleano", responda apenas "Sim" ou "Não"
- Se for "Data", forneça no formato YYYY-MM-DD
- Baseie-se no contexto da empresa
- Seja realista e conservador nas estimativas
- Para dados que a empresa claramente não possui, sugira valores básicos ou mínimos apropriados`;
}

function generateTemplateSuggestion(indicator: any, company: any) {
  const companyName = company?.name || 'a empresa';
  
  // Template suggestions based on data type and common indicators
  if (indicator.data_type === 'Texto') {
    return {
      suggested_value: getTextTemplate(indicator.code, companyName),
      data_source: 'template',
      confidence: 'low',
      unit: indicator.unit,
      note: 'Valor de template - requer personalização'
    };
  }

  if (indicator.data_type === 'Numérico') {
    return {
      suggested_value: 0,
      data_source: 'template',
      confidence: 'low',
      unit: indicator.unit,
      note: 'Valor inicial - requer dados reais'
    };
  }

  if (indicator.data_type === 'Percentual') {
    return {
      suggested_value: 0,
      data_source: 'template',
      confidence: 'low',
      unit: '%',
      note: 'Valor inicial - requer cálculo real'
    };
  }

  return {
    suggested_value: 'Informação a ser coletada',
    data_source: 'template',
    confidence: 'none',
    unit: indicator.unit,
    note: 'Template genérico'
  };
}

function getTextTemplate(code: string, companyName: string) {
  const templates: Record<string, string> = {
    'GRI 3-2': 'Os temas materiais identificados incluem: governança corporativa, gestão de emissões, desenvolvimento de pessoas, ética e integridade, e impactos na comunidade.',
    'GRI 2-6': `${companyName} atua no setor de serviços/produtos, com operações concentradas no Brasil. A cadeia de valor inclui fornecedores locais e nacionais, com foco em parcerias estratégicas de longo prazo.`,
    '2-1': `${companyName} é uma sociedade empresarial limitada com sede no Brasil, atuando no mercado nacional com foco em excelência operacional e sustentabilidade.`,
    'GRI 2-4': 'Não houve reformulações significativas de informações em relação aos relatórios anteriores.',
    'GRI 2-29': 'O engajamento com stakeholders é realizado através de canais de comunicação regulares, pesquisas de satisfação, reuniões periódicas e mecanismos de feedback estruturados.',
    '2-5': 'Este relatório não foi submetido a verificação externa independente. A organização considera implementar asseguração externa em relatórios futuros.',
    'GRI 2-22': 'A organização está comprometida com o desenvolvimento sustentável, integrando práticas ESG em suas operações e buscando melhorias contínuas em seu desempenho socioambiental.',
    'GRI 3-1': 'O processo de avaliação de materialidade envolveu análise de impactos significativos, consultas com stakeholders internos e externos, e alinhamento com objetivos estratégicos da organização.'
  };

  return templates[code] || `Informação sobre ${code} para ${companyName}. Este conteúdo requer personalização com dados específicos da organização.`;
}
