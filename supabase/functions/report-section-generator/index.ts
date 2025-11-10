import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SectionGenerationRequest {
  reportId: string;
  templateKey: string;
  regenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { reportId, templateKey, regenerate = false }: SectionGenerationRequest = await req.json();

    console.log(`Generating section: ${templateKey} for report: ${reportId}`);

    // Buscar template
    const { data: template, error: templateError } = await supabase
      .from('report_section_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Buscar relatório
    const { data: report, error: reportError } = await supabase
      .from('gri_reports')
      .select('*, companies(name)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Verificar se já existe seção gerada
    if (!regenerate) {
      const { data: existing } = await supabase
        .from('report_generated_sections')
        .select('*')
        .eq('report_id', reportId)
        .eq('template_id', template.id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ section: existing, message: 'Section already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Coletar dados das fontes necessárias
    const collectedData = await collectDataFromSources(
      supabase,
      report.company_id,
      template.required_data_sources,
      report.year
    );

    // Gerar conteúdo com IA
    const generatedText = await generateContentWithAI(
      template,
      report,
      collectedData
    );

    // Gerar visuais
    const generatedVisuals = await generateVisuals(
      template,
      collectedData
    );

    // Salvar seção gerada
    const sectionData = {
      report_id: reportId,
      template_id: template.id,
      section_content: collectedData,
      generated_text: generatedText,
      generated_visuals: generatedVisuals,
      data_sources_used: template.required_data_sources,
      ai_generated: true,
      generation_timestamp: new Date().toISOString(),
      last_data_refresh: new Date().toISOString(),
    };

    if (regenerate) {
      // Atualizar seção existente
      const { data: updated, error: updateError } = await supabase
        .from('report_generated_sections')
        .update(sectionData)
        .eq('report_id', reportId)
        .eq('template_id', template.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ section: updated, message: 'Section regenerated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Criar nova seção
      const { data: created, error: createError } = await supabase
        .from('report_generated_sections')
        .insert(sectionData)
        .select()
        .single();

      if (createError) throw createError;

      return new Response(
        JSON.stringify({ section: created, message: 'Section generated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error generating section:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function collectDataFromSources(
  supabase: any,
  companyId: string,
  sources: string[],
  year: number
) {
  const data: any = {};

  for (const source of sources) {
    try {
      switch (source) {
        case 'emissions':
          const { data: emissions } = await supabase
            .from('calculated_emissions')
            .select('*')
            .eq('company_id', companyId)
            .gte('emission_date', `${year}-01-01`)
            .lte('emission_date', `${year}-12-31`);
          data.emissions = emissions || [];
          break;

        case 'employees':
          const { data: employees } = await supabase
            .from('employees')
            .select('*')
            .eq('company_id', companyId);
          data.employees = employees || [];
          break;

        case 'training_programs':
          const { data: training } = await supabase
            .from('training_programs')
            .select('*')
            .eq('company_id', companyId);
          data.training = training || [];
          break;

        case 'safety_incidents':
          const { data: incidents } = await supabase
            .from('safety_incidents')
            .select('*')
            .eq('company_id', companyId)
            .gte('incident_date', `${year}-01-01`)
            .lte('incident_date', `${year}-12-31`);
          data.incidents = incidents || [];
          break;

        case 'goals':
          const { data: goals } = await supabase
            .from('goals')
            .select('*')
            .eq('company_id', companyId);
          data.goals = goals || [];
          break;

        case 'non_conformities':
          const { data: nonConformities } = await supabase
            .from('non_conformities')
            .select('*')
            .eq('company_id', companyId);
          data.nonConformities = nonConformities || [];
          break;

        case 'gri_indicators':
          const { data: indicators } = await supabase
            .from('gri_indicator_data')
            .select('*, gri_indicators_library(*)')
            .eq('company_id', companyId);
          data.indicators = indicators || [];
          break;
      }
    } catch (error) {
      console.error(`Error collecting data from ${source}:`, error);
    }
  }

  return data;
}

async function generateContentWithAI(
  template: any,
  report: any,
  collectedData: any
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    return generateFallbackContent(template, report, collectedData);
  }

  const systemPrompt = `Você é um especialista em relatórios de sustentabilidade (GRI, SASB, TCFD).
Gere conteúdo profissional, técnico e baseado em dados para a seção "${template.template_name}" do relatório.`;

  const userPrompt = buildPromptForTemplate(template, report, collectedData);

  try {
    const response = await fetch('https://api.lovable.app/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI:', error);
    return generateFallbackContent(template, report, collectedData);
  }
}

function buildPromptForTemplate(template: any, report: any, data: any): string {
  const companyName = report.companies?.name || 'a empresa';
  const year = report.year;

  let prompt = `Gere a seção "${template.template_name}" para o relatório de sustentabilidade ${year} de ${companyName}.\n\n`;

  // Adicionar dados disponíveis
  if (data.emissions && data.emissions.length > 0) {
    const total = data.emissions.reduce((sum: number, e: any) => sum + (e.total_emissions || 0), 0);
    prompt += `**Emissões de GEE:** ${total.toFixed(2)} tCO2e\n`;
  }

  if (data.employees && data.employees.length > 0) {
    prompt += `**Força de Trabalho:** ${data.employees.length} colaboradores\n`;
    const women = data.employees.filter((e: any) => e.gender === 'F').length;
    const men = data.employees.filter((e: any) => e.gender === 'M').length;
    prompt += `  - Mulheres: ${women} (${((women/data.employees.length)*100).toFixed(1)}%)\n`;
    prompt += `  - Homens: ${men} (${((men/data.employees.length)*100).toFixed(1)}%)\n`;
  }

  if (data.training && data.training.length > 0) {
    prompt += `**Treinamentos:** ${data.training.length} programas de treinamento\n`;
  }

  if (data.incidents && data.incidents.length > 0) {
    prompt += `**Incidentes de Segurança:** ${data.incidents.length} registrados\n`;
  }

  if (data.goals && data.goals.length > 0) {
    prompt += `**Metas ESG:** ${data.goals.length} metas estabelecidas\n`;
  }

  prompt += `\n**Instruções:**\n`;
  prompt += `1. Escreva em português brasileiro profissional\n`;
  prompt += `2. Use markdown para formatação (## títulos, **negrito**)\n`;
  prompt += `3. Baseie-se nos dados fornecidos\n`;
  prompt += `4. Inclua métricas e números específicos\n`;
  prompt += `5. Mantenha tom objetivo e técnico\n`;
  prompt += `6. Tamanho: 600-1000 palavras\n`;

  return prompt;
}

function generateFallbackContent(template: any, report: any, data: any): string {
  const companyName = report.companies?.name || 'a empresa';
  
  let content = `## ${template.template_name}\n\n`;
  content += `${template.description}\n\n`;
  content += `Este relatório apresenta informações sobre ${companyName} para o ano de ${report.year}.\n\n`;

  if (data.emissions && data.emissions.length > 0) {
    const total = data.emissions.reduce((sum: number, e: any) => sum + (e.total_emissions || 0), 0);
    content += `### Emissões de GEE\n\nDurante o período, foram registradas emissões totais de **${total.toFixed(2)} tCO2e**.\n\n`;
  }

  if (data.employees && data.employees.length > 0) {
    content += `### Força de Trabalho\n\nA empresa conta com **${data.employees.length} colaboradores** em suas operações.\n\n`;
  }

  return content;
}

async function generateVisuals(template: any, data: any): Promise<any[]> {
  const visuals: any[] = [];

  if (data.emissions && data.emissions.length > 0) {
    const scope1 = data.emissions.reduce((sum: number, e: any) => sum + (e.scope_1_emissions || 0), 0);
    const scope2 = data.emissions.reduce((sum: number, e: any) => sum + (e.scope_2_emissions || 0), 0);
    const scope3 = data.emissions.reduce((sum: number, e: any) => sum + (e.scope_3_emissions || 0), 0);

    visuals.push({
      type: 'pie_chart',
      title: 'Distribuição de Emissões por Escopo',
      data: [
        { name: 'Escopo 1', value: Math.round(scope1) },
        { name: 'Escopo 2', value: Math.round(scope2) },
        { name: 'Escopo 3', value: Math.round(scope3) }
      ],
      config: { dataKey: 'value', nameKey: 'name' }
    });
  }

  if (data.employees && data.employees.length > 0) {
    const women = data.employees.filter((e: any) => e.gender === 'F').length;
    const men = data.employees.filter((e: any) => e.gender === 'M').length;

    visuals.push({
      type: 'bar_chart',
      title: 'Distribuição por Gênero',
      data: [
        { name: 'Mulheres', value: women },
        { name: 'Homens', value: men }
      ],
      config: { dataKey: 'value', xAxisKey: 'name' }
    });
  }

  if (data.training && data.training.length > 0) {
    visuals.push({
      type: 'table',
      title: 'Programas de Treinamento',
      data: data.training.slice(0, 10).map((t: any) => ({
        'Programa': t.name || 'N/A',
        'Status': t.status || 'N/A',
        'Participantes': t.participants_count || 0
      })),
      config: { columns: ['Programa', 'Status', 'Participantes'] }
    });
  }

  return visuals;
}
