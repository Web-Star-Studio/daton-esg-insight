import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GRIIndexGenerationRequest {
  report_id: string;
  regenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { report_id, regenerate = false } = await req.json() as GRIIndexGenerationRequest;

    // Fetch report data
    const { data: report, error: reportError } = await supabase
      .from('gri_reports')
      .select('*, companies(*)')
      .eq('id', report_id)
      .single();

    if (reportError) throw reportError;

    // Fetch report sections
    const { data: sections, error: sectionsError } = await supabase
      .from('gri_report_sections')
      .select('*')
      .eq('report_id', report_id)
      .order('order_index');

    if (sectionsError) throw sectionsError;

    // Fetch filled indicators
    const { data: filledIndicators, error: indicatorsError } = await supabase
      .from('gri_indicator_data')
      .select('*, indicator:gri_indicators_library(*)')
      .eq('report_id', report_id);

    if (indicatorsError) throw indicatorsError;

    // Fetch all GRI indicators from library
    const { data: allIndicators, error: libError } = await supabase
      .from('gri_indicators_library')
      .select('*')
      .order('code');

    if (libError) throw libError;

    // Check if index already exists
    if (!regenerate) {
      const { data: existing } = await supabase
        .from('gri_content_index_items')
        .select('id')
        .eq('report_id', report_id)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ message: 'Index already exists', existing: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare content for AI analysis
    const sectionsContent = sections?.map(s => `
### ${s.title} (Seção ${s.order_index})
${s.content?.substring(0, 2000) || 'Sem conteúdo'}
`).join('\n\n') || '';

    const filledIndicatorsText = filledIndicators?.map(i => {
      const value = i.quantitative_value || i.qualitative_value || i.text_description || 'N/A';
      return `- ${i.indicator.code}: ${i.indicator.title}\n  Valor: ${value}`;
    }).join('\n') || 'Nenhum indicador preenchido';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // AI Prompt
    const systemPrompt = `Você é um especialista em GRI Standards e relatórios de sustentabilidade.

Analise o conteúdo do relatório e identifique quais indicadores GRI são atendidos.

Para cada indicador:
1. Verifique se há conteúdo que atende o indicador
2. Identifique a seção onde está localizado
3. Extraie trecho relevante (máx 500 chars)
4. Avalie score de confiança (0.0 a 1.0)
5. Classifique status: fully_reported, partially_reported, not_applicable, omitted

Priorize indicadores obrigatórios GRI 2 (Universal).`;

    const userPrompt = `Analise este relatório GRI:

**Relatório:** ${report.title} (${report.year})
**Empresa:** ${report.companies?.name || 'N/A'}

**Seções:**
${sectionsContent}

**Indicadores Preenchidos:**
${filledIndicatorsText}

Retorne JSON:
{
  "content_index_items": [
    {
      "indicator_code": "GRI 2-1",
      "disclosure_status": "fully_reported",
      "section_reference": "1. Perfil Organizacional",
      "related_content": "Trecho...",
      "ai_confidence_score": 0.95,
      "page_number": 5
    }
  ]
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);
    const items = result.content_index_items || [];

    // Save to database
    const indexItems = items.map((item: any) => {
      const indicator = allIndicators?.find(ind => ind.code === item.indicator_code);
      const section = sections?.find(s => s.title.includes(item.section_reference?.split('.')[0] || ''));
      
      return {
        report_id,
        indicator_id: indicator?.id || null,
        indicator_code: item.indicator_code,
        indicator_title: indicator?.title || item.indicator_code,
        indicator_description: indicator?.description,
        disclosure_status: item.disclosure_status || 'fully_reported',
        section_reference: item.section_reference,
        page_number: item.page_number,
        related_content: item.related_content?.substring(0, 500),
        ai_confidence_score: item.ai_confidence_score,
        ai_identified: true,
        manually_verified: false,
        report_section_id: section?.id
      };
    }).filter((item: any) => item.indicator_id); // Only save valid indicators

    if (regenerate) {
      // Delete existing items
      await supabase
        .from('gri_content_index_items')
        .delete()
        .eq('report_id', report_id);
    }

    const { data: savedItems, error: saveError } = await supabase
      .from('gri_content_index_items')
      .insert(indexItems)
      .select();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({
        success: true,
        items_generated: savedItems?.length || 0,
        items: savedItems
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in gri-index-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
