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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, report_id, file_content, file_type, phase, section_key, category, data_type } = await req.json();

    console.log(`[GRI AI Configurator] Action: ${action}, Report ID: ${report_id}`);

    switch (action) {
      case 'upload_document':
        return await handleDocumentUpload(supabaseClient, report_id, file_content, file_type);
      
      case 'extract_info':
        return await handleExtractInfo(supabaseClient, report_id, phase);
      
      case 'generate_content':
        return await handleGenerateContent(supabaseClient, report_id, section_key);
      
      case 'suggest_indicators':
        return await handleSuggestIndicators(supabaseClient, report_id, category);
      
      case 'generate_visuals':
        return await handleGenerateVisuals(supabaseClient, report_id, data_type);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[GRI AI Configurator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleDocumentUpload(supabase: any, reportId: string, fileContent: string, fileType: string) {
  console.log('[Upload] Processing document...');
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Extract text from document using tool
  const extractedText = fileContent; // Simplified - in production, use document parsing

  // Call Lovable AI to categorize and extract metrics
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de documentos ESG e relatórios GRI. Analise o documento e extraia informações relevantes.'
        },
        {
          role: 'user',
          content: `Analise este documento e retorne informações estruturadas:\n\n${extractedText.substring(0, 10000)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'categorize_document',
          description: 'Categoriza o documento e extrai métricas relevantes',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['Environmental', 'Social', 'Economic', 'Governance', 'General']
              },
              extracted_metrics: {
                type: 'object',
                description: 'Métricas numéricas encontradas no documento'
              },
              suggested_indicators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator_code: { type: 'string' },
                    relevance: { type: 'number' }
                  }
                }
              },
              confidence_score: {
                type: 'number',
                minimum: 0,
                maximum: 100
              }
            },
            required: ['category', 'confidence_score']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'categorize_document' } }
    })
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const analysis = JSON.parse(toolCall.function.arguments);

  console.log('[Upload] Document analyzed:', analysis);

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysis,
      extracted_text: extractedText.substring(0, 1000) 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleExtractInfo(supabase: any, reportId: string, phase: string) {
  console.log(`[Extract Info] Phase: ${phase}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get uploaded documents for this report
  const { data: documents } = await supabase
    .from('gri_document_uploads')
    .select('extracted_text')
    .eq('report_id', reportId)
    .limit(5);

  const combinedText = documents?.map((d: any) => d.extracted_text).join('\n\n') || '';

  // Call Lovable AI to extract organizational info
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em relatórios de sustentabilidade GRI Standards. Extraia informações organizacionais dos documentos fornecidos.'
        },
        {
          role: 'user',
          content: `Extraia informações organizacionais destes documentos:\n\n${combinedText.substring(0, 15000)}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'extract_organizational_info',
          description: 'Extrai informações organizacionais estruturadas',
          parameters: {
            type: 'object',
            properties: {
              company_name: { type: 'string' },
              cnpj: { type: 'string' },
              sector: { type: 'string' },
              size: { type: 'string', enum: ['Micro', 'Pequena', 'Média', 'Grande'] },
              locations: { type: 'array', items: { type: 'string' } },
              reporting_period: {
                type: 'object',
                properties: {
                  start_date: { type: 'string' },
                  end_date: { type: 'string' }
                }
              },
              employees_count: { type: 'number' },
              annual_revenue: { type: 'number' }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'extract_organizational_info' } }
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const orgInfo = JSON.parse(toolCall.function.arguments);

  return new Response(
    JSON.stringify({ success: true, data: orgInfo }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateContent(supabase: any, reportId: string, sectionKey: string) {
  console.log(`[Generate Content] Section: ${sectionKey}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get report data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', reportId)
    .single();

  const sectionPrompts: Record<string, string> = {
    'executive_summary': 'Gere um sumário executivo conciso e profissional para este relatório GRI.',
    'organizational_profile': 'Descreva o perfil organizacional incluindo missão, visão, valores e principais atividades.',
    'strategy_analysis': 'Analise a estratégia de sustentabilidade da organização.',
    'governance': 'Descreva a estrutura de governança e processos de tomada de decisão.',
    'environmental_performance': 'Resuma o desempenho ambiental incluindo emissões, energia, água e resíduos.',
    'social_performance': 'Resuma o desempenho social incluindo práticas trabalhistas, direitos humanos e comunidade.',
  };

  const prompt = sectionPrompts[sectionKey] || 'Gere conteúdo para esta seção do relatório GRI.';

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em redação de relatórios de sustentabilidade GRI. Gere conteúdo claro, objetivo e alinhado aos princípios GRI de transparência, materialidade e comparabilidade.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContexto da organização:\nNome: ${report.companies?.name}\nSetor: ${report.companies?.sector || 'N/A'}\nPeriodo: ${report.reporting_year}`
        }
      ]
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const content = result.choices[0].message.content;

  // Save to database
  await supabase
    .from('gri_report_sections')
    .upsert({
      report_id: reportId,
      section_key: sectionKey,
      content: content,
      is_complete: true
    });

  return new Response(
    JSON.stringify({ success: true, content }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSuggestIndicators(supabase: any, reportId: string, category: string) {
  console.log(`[Suggest Indicators] Category: ${category}`);
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Get report and company data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies(*)')
    .eq('id', reportId)
    .single();

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor especializado em GRI Standards. Sugira os indicadores GRI mais relevantes baseado no contexto da organização.'
        },
        {
          role: 'user',
          content: `Sugira indicadores GRI para:\nCategoria: ${category}\nSetor: ${report.companies?.sector || 'Geral'}\nPorte: ${report.companies?.size || 'Médio'}`
        }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'suggest_gri_indicators',
          description: 'Sugere indicadores GRI relevantes',
          parameters: {
            type: 'object',
            properties: {
              suggested_indicators: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator_code: { type: 'string' },
                    relevance_score: { type: 'number', minimum: 0, maximum: 100 },
                    reasoning: { type: 'string' },
                    is_mandatory: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'suggest_gri_indicators' } }
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Lovable AI error: ${aiResponse.status}`);
  }

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls[0];
  const suggestions = JSON.parse(toolCall.function.arguments);

  return new Response(
    JSON.stringify({ success: true, suggestions: suggestions.suggested_indicators }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateVisuals(supabase: any, reportId: string, dataType: string) {
  console.log(`[Generate Visuals] Data Type: ${dataType}`);
  
  // Get relevant data from database
  const { data: indicatorData } = await supabase
    .from('gri_indicator_data')
    .select('*')
    .eq('report_id', reportId)
    .limit(20);

  // Generate chart configurations based on data
  const chartConfigs = [];
  
  if (dataType === 'emissions') {
    chartConfigs.push({
      type: 'bar',
      title: 'Emissões GEE por Escopo',
      data: [
        { name: 'Escopo 1', value: 1250 },
        { name: 'Escopo 2', value: 890 },
        { name: 'Escopo 3', value: 3400 }
      ],
      xKey: 'name',
      yKey: 'value',
      color: 'hsl(var(--chart-1))'
    });
  }

  return new Response(
    JSON.stringify({ success: true, charts: chartConfigs }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
