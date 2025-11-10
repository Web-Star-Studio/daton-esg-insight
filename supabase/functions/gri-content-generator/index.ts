import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  reportId: string;
  sectionKey?: string;
  contentType?: string;
  metadataType?: 'ceo_message' | 'executive_summary' | 'methodology';
  context?: string;
  regenerate?: boolean;
  sdgData?: any[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ContentRequest = await req.json();
    const { reportId, sectionKey, contentType, metadataType, context, regenerate, sdgData } = requestData;

    console.log('Generating content for:', { reportId, sectionKey, contentType, metadataType, regenerate });

    // Get company context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Company not found');
    }

    // Get company data for context
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, cnpj, sector, employees_count')
      .eq('id', profile.company_id)
      .single();

    // Get report data
    const { data: report } = await supabaseClient
      .from('gri_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    // Fetch comprehensive company data for context
    const companyContext = await fetchCompanyData(supabaseClient, profile.company_id, report?.year);

    // Generate content using AI
    let generatedContent: string;
    
    if (sectionKey === 'sdg_alignment' && sdgData) {
      // Generate SDG-specific content
      generatedContent = await generateSDGContent(company?.name || 'Organização', report, sdgData);
    } else if (metadataType) {
      // Generate metadata content (CEO message, executive summary, methodology)
      generatedContent = await generateMetadataContent(
        metadataType,
        company?.name || 'Organização',
        report,
        companyContext
      );
    } else if (sectionKey && contentType) {
      // Generate section content
      generatedContent = await generateContentWithAI(
        sectionKey, 
        contentType,
        company?.name || 'Organização', 
        report,
        companyContext,
        context
      );
    } else {
      throw new Error('Either metadataType or sectionKey/contentType must be provided');
    }

    // Log generation for analytics
    await supabaseClient
      .from('ai_performance_metrics')
      .insert({
        company_id: profile.company_id,
        metric_date: new Date().toISOString().split('T')[0],
        documents_processed: 1,
        auto_approved_count: 0,
        manual_review_count: 1
      });

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        metadata: {
          sectionKey,
          contentType,
          generatedAt: new Date().toISOString(),
          regenerated: regenerate || false
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in gri-content-generator:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Fetch comprehensive company data for context
async function fetchCompanyData(supabaseClient: any, companyId: string, year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  // Fetch emissions data
  const { data: emissions } = await supabaseClient
    .from('calculated_emissions')
    .select('total_co2e, activity_data(emission_sources(scope, source_name))')
    .gte('calculation_date', `${currentYear}-01-01`)
    .lte('calculation_date', `${currentYear}-12-31`);

  // Fetch employees data
  const { data: employees } = await supabaseClient
    .from('employees')
    .select('id, gender, department, birth_date, status')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  // Fetch goals
  const { data: goals } = await supabaseClient
    .from('goals')
    .select('*')
    .eq('company_id', companyId);

  // Fetch safety incidents
  const { data: safetyIncidents } = await supabaseClient
    .from('safety_incidents')
    .select('*')
    .eq('company_id', companyId)
    .gte('incident_date', `${currentYear}-01-01`);

  // Fetch training programs
  const { data: trainingPrograms } = await supabaseClient
    .from('training_programs')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  // Fetch policies
  const { data: policies } = await supabaseClient
    .from('corporate_policies')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  // Calculate aggregated metrics
  const totalEmissions = emissions?.reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0;
  const employeeCount = employees?.length || 0;
  const goalsCount = goals?.length || 0;
  const activeGoals = goals?.filter(g => g.status === 'Em Andamento')?.length || 0;
  const completedGoals = goals?.filter(g => g.status === 'Concluída')?.length || 0;
  
  return {
    emissions: {
      total: totalEmissions,
      scope1: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 1).reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0,
      scope2: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 2).reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0,
      scope3: emissions?.filter(e => e.activity_data?.emission_sources?.scope === 3).reduce((sum, e) => sum + (e.total_co2e || 0), 0) || 0,
    },
    employees: {
      total: employeeCount,
      byGender: employees?.reduce((acc, e) => {
        const gender = e.gender || 'Não informado';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byDepartment: employees?.reduce((acc, e) => {
        const dept = e.department || 'Não informado';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
    },
    goals: {
      total: goalsCount,
      active: activeGoals,
      completed: completedGoals,
      progressRate: goalsCount > 0 ? (completedGoals / goalsCount) * 100 : 0,
    },
    safety: {
      incidents: safetyIncidents?.length || 0,
      daysLost: safetyIncidents?.reduce((sum, i) => sum + (i.days_lost || 0), 0) || 0,
    },
    training: {
      programs: trainingPrograms?.length || 0,
    },
    policies: {
      total: policies?.length || 0,
    },
  };
}

// Generate metadata content (CEO message, executive summary, methodology)
async function generateMetadataContent(
  metadataType: 'ceo_message' | 'executive_summary' | 'methodology',
  companyName: string,
  report: any,
  companyContext: any
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const year = report?.year || new Date().getFullYear();
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, using metadata fallback');
    return generateMetadataFallback(metadataType, companyName, year, companyContext);
  }

  const prompts: Record<string, { system: string; user: string }> = {
    'ceo_message': {
      system: 'Você é um especialista em comunicação corporativa de sustentabilidade. Gere uma mensagem do CEO/Presidente que seja inspiradora, autêntica e que demonstre comprometimento genuíno com sustentabilidade.',
      user: `Gere uma mensagem do CEO/Presidente de ${companyName} para o relatório de sustentabilidade ${year}.

Dados da empresa:
- ${companyContext.employees.total} funcionários
- ${companyContext.goals.total} metas ESG (${companyContext.goals.completed} concluídas)
- ${companyContext.emissions.total.toFixed(2)} tCO2e de emissões
- ${companyContext.policies.total} políticas corporativas

A mensagem deve:
1. Ter tom pessoal e inspirador (2-3 parágrafos)
2. Mencionar conquistas do ano
3. Reconhecer desafios
4. Reafirmar compromisso com sustentabilidade
5. Integrar dados de forma natural`
    },
    'executive_summary': {
      system: 'Você é um especialista em relatórios de sustentabilidade GRI. Gere um sumário executivo objetivo que apresente os principais destaques do relatório.',
      user: `Gere um sumário executivo para o relatório GRI ${year} de ${companyName}.

Dados principais:
- Funcionários: ${companyContext.employees.total}
- Emissões totais: ${companyContext.emissions.total.toFixed(2)} tCO2e
- Metas ESG: ${companyContext.goals.total} (${companyContext.goals.active} ativas)
- Incidentes de segurança: ${companyContext.safety.incidents}
- Programas de treinamento: ${companyContext.training.programs}

O sumário deve:
1. Apresentar destaques principais (3-4 parágrafos)
2. Incluir KPIs mais relevantes
3. Mencionar conquistas e progressos
4. Ser objetivo e factual
5. Seguir estrutura clara`
    },
    'methodology': {
      system: 'Você é um especialista em metodologias de relatório GRI Standards. Gere uma descrição clara e técnica da metodologia utilizada.',
      user: `Gere uma seção de metodologia para o relatório GRI ${year} de ${companyName}.

A seção deve explicar:
1. Framework utilizado (GRI Standards)
2. Processo de coleta de dados
3. Período de reporte e limites
4. Verificação e asseguração
5. Princípios de qualidade aplicados

Use 3-4 parágrafos técnicos mas claros.`
    }
  };

  const prompt = prompts[metadataType];
  if (!prompt) {
    return generateMetadataFallback(metadataType, companyName, year, companyContext);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || generateMetadataFallback(metadataType, companyName, year, companyContext);

  } catch (error) {
    console.error('Error generating metadata with AI:', error);
    return generateMetadataFallback(metadataType, companyName, year, companyContext);
  }
}

// Fallback for metadata generation
function generateMetadataFallback(
  metadataType: string,
  companyName: string,
  year: number,
  companyContext: any
): string {
  const templates: Record<string, string> = {
    'ceo_message': `É com grande satisfação que apresento o Relatório de Sustentabilidade ${year} de ${companyName}. Este documento reflete nosso compromisso contínuo com práticas empresariais responsáveis e transparentes.

No ano de ${year}, avançamos significativamente em nossas iniciativas ESG, com ${companyContext.goals.completed} metas concluídas e ${companyContext.employees.total} colaboradores engajados em nossa jornada sustentável. Reconhecemos os desafios que ainda temos pela frente, especialmente no que diz respeito à gestão de emissões (${companyContext.emissions.total.toFixed(2)} tCO2e) e à implementação de práticas cada vez mais sustentáveis.

Seguiremos trabalhando incansavelmente para criar valor compartilhado, equilibrando crescimento econômico com responsabilidade ambiental e social. Este relatório é uma demonstração de nossa transparência e accountability perante todos os nossos stakeholders.`,

    'executive_summary': `O Relatório de Sustentabilidade ${year} de ${companyName} apresenta nosso desempenho ESG de forma abrangente e transparente, seguindo os padrões GRI Standards.

Principais destaques do período:
• ${companyContext.employees.total} colaboradores em nossa força de trabalho
• ${companyContext.emissions.total.toFixed(2)} tCO2e de emissões totais de GEE
• ${companyContext.goals.total} metas ESG estabelecidas (${companyContext.goals.completed} concluídas)
• ${companyContext.safety.incidents} incidentes de segurança registrados
• ${companyContext.training.programs} programas de treinamento ativos

Este relatório demonstra nosso compromisso com melhoria contínua e prestação de contas, fornecendo informações relevantes para tomada de decisão de nossos stakeholders.`,

    'methodology': `Este relatório foi elaborado em conformidade com os GRI Standards, o framework mais amplamente utilizado globalmente para relatórios de sustentabilidade. O período de reporte compreende o ano calendário de ${year}.

Os dados apresentados foram coletados através de sistemas internos de gestão, validados por responsáveis de área e consolidados pela equipe de sustentabilidade. Processos de controle de qualidade foram aplicados para garantir precisão e completude das informações. Quando dados precisos não estavam disponíveis, utilizamos estimativas conservadoras claramente identificadas no relatório.

Os limites organizacionais do relatório incluem todas as operações de ${companyName}, abrangendo ${companyContext.employees.total} colaboradores. Dados de emissões de Escopo 3 podem incluir estimativas baseadas em fatores de emissão setoriais quando dados primários de terceiros não estão disponíveis.`,
  };

  return templates[metadataType] || `Conteúdo de ${metadataType} para ${companyName} - ${year}.`;
}

// Generate SDG-specific content
async function generateSDGContent(
  companyName: string,
  report: any,
  sdgData: any[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, using SDG fallback');
    return generateSDGFallback(companyName, report?.year || new Date().getFullYear(), sdgData);
  }

  const systemPrompt = `Você é um especialista em sustentabilidade e relatórios GRI.
Gere um texto profissional e detalhado para a seção "Objetivos de Desenvolvimento Sustentável (ODS)" de um relatório de sustentabilidade.

Diretrizes:
- Use linguagem clara, objetiva e profissional
- Integre dados quantitativos quando disponíveis
- Mencione as metas específicas da Agenda 2030
- Inclua referência ao Pacto Global
- Foque em informação material e relevante
- Use parágrafos bem estruturados
- Tenha aproximadamente 800-1200 palavras`;

  const userPrompt = `Gere um texto profissional para a seção "ODS" do relatório de sustentabilidade ${report?.year || new Date().getFullYear()} de ${companyName}.

**Dados dos ODS selecionados:**
${JSON.stringify(sdgData, null, 2)}

O texto deve:
1. Comece explicando brevemente a importância dos ODS para a estratégia da empresa
2. Para cada ODS selecionado:
   - Descreva como ele se relaciona com as operações da empresa
   - Mencione as metas específicas da Agenda 2030 adotadas
   - Apresente as ações realizadas de forma detalhada
   - Destaque os resultados mensuráveis alcançados
   - Mencione os compromissos futuros
3. Inclua uma seção sobre o alinhamento com o Pacto Global da ONU
4. Use linguagem profissional, objetiva e baseada em evidências
5. Use formatação Markdown para estruturar o texto (## para títulos, ** para negrito, - para listas)
6. Seja específico e evite frases genéricas`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || generateSDGFallback(companyName, report?.year || new Date().getFullYear(), sdgData);

  } catch (error) {
    console.error('Error generating SDG content with AI:', error);
    return generateSDGFallback(companyName, report?.year || new Date().getFullYear(), sdgData);
  }
}

function generateSDGFallback(companyName: string, year: number, sdgData: any[]): string {
  let text = `# Objetivos de Desenvolvimento Sustentável (ODS)\n\n`;
  text += `${companyName} adota os seguintes Objetivos de Desenvolvimento Sustentável (ODS) da Agenda 2030 como parte integrante de sua estratégia de sustentabilidade:\n\n`;

  sdgData.forEach((item, index) => {
    text += `## ODS ${item.sdg_number}\n\n`;
    text += `**Nível de Contribuição:** ${item.impact_level || 'Médio'}\n\n`;
    
    if (item.selected_targets && item.selected_targets.length > 0) {
      text += `**Metas adotadas:** ${item.selected_targets.join(', ')}\n\n`;
    }
    
    if (item.actions_taken) {
      text += `**Ações realizadas:** ${item.actions_taken}\n\n`;
    }
    
    if (item.results_achieved) {
      text += `**Resultados alcançados:** ${item.results_achieved}\n\n`;
    }
    
    if (index < sdgData.length - 1) {
      text += `---\n\n`;
    }
  });

  text += `\n## Alinhamento com o Pacto Global\n\n`;
  text += `Esta seleção de ODS está alinhada aos princípios do Pacto Global da ONU, demonstrando o compromisso de ${companyName} com práticas empresariais responsáveis.`;

  return text;
}

// Generate content using Lovable AI
async function generateContentWithAI(
  sectionKey: string,
  contentType: string,
  companyName: string,
  report: any,
  companyContext: any,
  additionalContext?: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, using template fallback');
    return generateFallbackContent(sectionKey, companyName, report, companyContext);
  }

  const systemPrompt = buildSystemPrompt(sectionKey, contentType);
  const userPrompt = buildUserPrompt(sectionKey, companyName, report, companyContext, additionalContext);

  console.log('Calling Lovable AI for content generation...');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      console.warn('No content generated, using fallback');
      return generateFallbackContent(sectionKey, companyName, report, companyContext);
    }

    console.log('Content generated successfully with AI');
    return generatedText;

  } catch (error) {
    console.error('Error generating content with AI:', error);
    return generateFallbackContent(sectionKey, companyName, report, companyContext);
  }
}

// Build system prompt based on section and content type
function buildSystemPrompt(sectionKey: string, contentType: string): string {
  return `Você é um especialista em relatórios de sustentabilidade GRI Standards. 
Sua tarefa é gerar conteúdo profissional, factual e bem estruturado para relatórios GRI.

Diretrizes:
- Use linguagem clara, objetiva e profissional
- Integre dados quantitativos quando disponíveis
- Siga as melhores práticas dos GRI Standards
- Mantenha consistência com padrões de relatório de sustentabilidade
- Foque em informação material e relevante
- Use parágrafos bem estruturados
- Evite jargão excessivo mas use terminologia técnica apropriada

Tipo de conteúdo: ${contentType}
Seção: ${sectionKey}`;
}

// Build user prompt with company data
function buildUserPrompt(
  sectionKey: string,
  companyName: string,
  report: any,
  companyContext: any,
  additionalContext?: string
): string {
  const year = report?.year || new Date().getFullYear();
  
  return `Gere conteúdo para a seção "${sectionKey}" do relatório GRI de sustentabilidade.

Informações da Empresa:
- Nome: ${companyName}
- Ano do relatório: ${year}

Dados disponíveis:
- Emissões totais: ${companyContext.emissions.total.toFixed(2)} tCO2e
  - Escopo 1: ${companyContext.emissions.scope1.toFixed(2)} tCO2e
  - Escopo 2: ${companyContext.emissions.scope2.toFixed(2)} tCO2e
  - Escopo 3: ${companyContext.emissions.scope3.toFixed(2)} tCO2e
- Total de funcionários: ${companyContext.employees.total}
- Metas ESG: ${companyContext.goals.total} (${companyContext.goals.active} ativas, ${companyContext.goals.completed} concluídas)
- Incidentes de segurança: ${companyContext.safety.incidents}
- Programas de treinamento: ${companyContext.training.programs}
- Políticas corporativas: ${companyContext.policies.total}

${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Gere um texto de 3-4 parágrafos bem estruturados que:
1. Apresente a abordagem da empresa para este tema
2. Integre os dados quantitativos fornecidos de forma natural
3. Demonstre compromisso com melhoria contínua
4. Seja específico e factual (baseado nos dados reais)
5. Siga as diretrizes dos GRI Standards para esta seção

Importante: Use apenas os dados fornecidos. Se um dado for zero ou ausente, mencione que está em fase de implementação ou desenvolvimento.`;
}

// Fallback content generation without AI
function generateFallbackContent(
  sectionKey: string,
  companyName: string,
  report: any,
  companyContext: any
): string {
  const year = report?.year || new Date().getFullYear();
  const templates: Record<string, string> = {
    'organizational_profile': `${companyName} é uma organização comprometida com práticas sustentáveis e responsabilidade corporativa. Com ${companyContext.employees.total} funcionários, operamos mantendo os mais altos padrões de ética e governança.

Nossa estrutura organizacional é projetada para garantir eficiência operacional e transparência em todas as nossas atividades. No ano de ${year}, fortalecemos nosso compromisso com sustentabilidade através de ${companyContext.policies.total} políticas corporativas ativas que guiam nossas operações diárias.

A cadeia de valor engloba desde o relacionamento com fornecedores até a entrega final aos clientes, sempre buscando minimizar impactos ambientais e maximizar benefícios sociais em cada etapa do processo.`,

    'strategy': `A estratégia de sustentabilidade de ${companyName} está profundamente integrada ao nosso modelo de negócio. Reconhecemos que o sucesso empresarial sustentável depende do equilíbrio entre performance econômica, responsabilidade ambiental e impacto social positivo.

Com ${companyContext.goals.total} metas ESG estabelecidas (${companyContext.goals.active} ativas, ${companyContext.goals.completed} concluídas), demonstramos compromisso concreto com resultados mensuráveis. Estes objetivos não são apenas aspirações, mas compromissos com prazos definidos.

Investimos em inovação, tecnologia e capacitação para garantir que ${companyName} esteja preparada para os desafios e oportunidades do futuro sustentável.`,

    'governance': `A governança corporativa de ${companyName} é estruturada para garantir supervisão eficaz e prestação de contas. Com ${companyContext.policies.total} políticas corporativas ativas, nosso mais alto órgão de governança supervisiona ativamente questões de sustentabilidade.

Processos formais de comunicação garantem que preocupações críticas, incluindo questões éticas e de sustentabilidade, sejam escaladas apropriadamente. A transparência e accountability são pilares fundamentais de nossa estrutura de governança.

Mantemos conformidade rigorosa com regulamentações e padrões internacionais de governança, fortalecendo continuamente nossos mecanismos de controle e supervisão.`,

    'stakeholder_engagement': `${companyName} reconhece a importância do engajamento contínuo com stakeholders. Identificamos e priorizamos stakeholders com base em sua influência e interesse em nossas operações e impactos.

Nossos principais grupos incluem empregados (${companyContext.employees.total} colaboradores), clientes, fornecedores, comunidades locais, investidores e órgãos reguladores. Para cada grupo, desenvolvemos abordagens adequadas de engajamento.

O feedback dos stakeholders influencia diretamente nossa estratégia. Realizamos análise de materialidade anualmente para priorizar temas ESG mais relevantes.`,

    'material_topics': `A determinação de temas materiais de ${companyName} segue abordagem rigorosa e inclusiva, considerando impactos econômicos, ambientais e sociais significativos.

Nossa análise para ${year} identificou temas prioritários que refletem onde temos maiores impactos e onde stakeholders expressam maior interesse. Estes incluem questões relacionadas a mudanças climáticas, gestão de recursos, diversidade e governança ética.

Revisamos periodicamente nossos temas materiais para garantir relevância à medida que contextos e expectativas evoluem.`,

    'economic_performance': `O desempenho econômico de ${companyName} reflete nossa capacidade de gerar e distribuir valor de forma sustentável. Em ${year}, geramos valor através de receitas operacionais e distribuímos entre stakeholders.

Reconhecemos implicações financeiras das mudanças climáticas em nosso modelo de negócio. Identificamos riscos e oportunidades relacionados a regulamentações, preferências de consumidores e eficiência energética.

Mantemos compromisso com práticas de remuneração justa e priorizamos fornecedores locais quando possível, contribuindo para desenvolvimento regional.`,

    'environmental_performance': `${companyName} monitora rigorosamente seu desempenho ambiental. Em ${year}, nossas emissões totais foram de ${companyContext.emissions.total.toFixed(2)} tCO2e, distribuídas entre Escopo 1 (${companyContext.emissions.scope1.toFixed(2)} tCO2e), Escopo 2 (${companyContext.emissions.scope2.toFixed(2)} tCO2e) e Escopo 3 (${companyContext.emissions.scope3.toFixed(2)} tCO2e).

Estamos implementando iniciativas de redução de emissões e eficiência energética como parte de nossa estratégia ambiental. Investimos em energias renováveis e tecnologias limpas para descarbonizar operações.

Mantemos conformidade rigorosa com legislação ambiental e investimos continuamente em proteção ambiental e gestão responsável de recursos.`,

    'social_performance': `A força de trabalho de ${companyName} conta com ${companyContext.employees.total} profissionais. Promovemos diversidade, equidade e inclusão em todos os níveis organizacionais.

A saúde e segurança é prioridade absoluta, com ${companyContext.safety.incidents} incidentes registrados em ${year}. Investimos em desenvolvimento através de ${companyContext.training.programs} programas de treinamento ativos.

Respeitamos rigorosamente direitos humanos, mantemos políticas de não discriminação e engajamos ativamente com comunidades locais em projetos de desenvolvimento social.`,

    'ethics_integrity': `${companyName} mantém compromisso inabalável com ética e integridade em todas as operações. Com ${companyContext.policies.total} políticas corporativas ativas, estabelecemos padrões claros de conduta ética.

Nosso código de ética e conduta é comunicado a todos os colaboradores e stakeholders. Mantemos mecanismos confidenciais para relato de preocupações éticas e irregularidades.

Processos de due diligence garantem que parceiros e fornecedores compartilhem nossos valores éticos. Mantemos tolerância zero para corrupção, suborno e práticas antiéticas.`,

    'reporting_practices': `Este relatório de sustentabilidade de ${companyName} para o ano de ${year} foi elaborado seguindo os GRI Standards, framework mais amplamente utilizado globalmente para relatórios de sustentabilidade.

O período de reporte compreende ${year} e inclui dados consolidados de nossas operações. A verificação externa e asseguração de dados são práticas que estamos implementando progressivamente.

Mantemos compromisso com transparência e melhoria contínua em nossas práticas de reporte, buscando sempre aumentar qualidade e completude das informações divulgadas.`,
  };

  return templates[sectionKey] || `${companyName} mantém compromisso com práticas sustentáveis na área de ${sectionKey}.

No ano de ${year}, registramos os seguintes dados relevantes:
- ${companyContext.employees.total} funcionários
- ${companyContext.goals.total} metas ESG (${companyContext.goals.completed} concluídas)
- ${companyContext.emissions.total.toFixed(2)} tCO2e de emissões totais
- ${companyContext.policies.total} políticas corporativas ativas

Continuamos desenvolvendo nossas práticas ESG e reportando nosso progresso de forma clara e mensurável conforme os padrões GRI.`;
}