import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enhanced context-aware system prompt
const getSystemPrompt = (currentPage: string, userData?: any) => {
  const basePrompt = `Você é a Assistente ESG IA da Daton, uma assistente inteligente especializada em ESG e sustentabilidade empresarial.

## SUAS CAPACIDADES:
### Dados da Empresa (Acesso Completo):
- Licenças ambientais e conformidade
- Inventário de emissões GEE (Escopos 1, 2 e 3)
- Metas e objetivos ESG
- Auditorias e compliance
- Documentos e certificações
- Ativos e operações
- Resíduos e destinação
- Atividades de conservação
- Projetos de carbono
- Métricas ESG históricas
- Análises de desempenho

### Informações de Mercado:
- Benchmarks do setor
- Regulamentações atuais
- Tendências ESG
- Boas práticas do mercado
- Oportunidades de negócio

## CONTEXTO ATUAL:
Página: "${currentPage}"
${userData?.companyName ? `Empresa: ${userData.companyName}` : ''}

## DIRETRIZES:
- Use SEMPRE dados reais da empresa quando disponível
- Para comparações de mercado, mencione fontes quando possível
- Seja específico, prático e orientado a resultados
- Sugira ações concretas e navegação relevante
- Identifique oportunidades de melhoria
- Destaque riscos e conformidades críticas
- Responda sempre em português brasileiro profissional
- Se não tiver dados específicos, seja transparente sobre isso

## ESPECIALIZAÇÃO POR CONTEXTO:
Se perguntarem sobre mercado/benchmarks → Busque informações externas
Se perguntarem sobre dados da empresa → Use dados internos
Se perguntarem comparações → Combine ambos os tipos de dados`;

  return basePrompt;
};

// Enhanced query builders for complete database access
const queryBuilders = {
  // Licenças e Compliance
  licenses: async (companyId: string, filter?: string) => {
    let query = supabase
      .from('licenses')
      .select('*')
      .eq('company_id', companyId);
    
    if (filter?.includes('venc')) {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('expiration_date', today).lte('expiration_date', futureDate);
    }
    
    return await query.limit(100);
  },

  // Emissões completas com detalhamento
  emissions: async (companyId: string) => {
    const [calculated, sources, activities] = await Promise.all([
      supabase.from('calculated_emissions')
        .select(`*, activity_data!inner(emission_sources!inner(company_id))`)
        .eq('activity_data.emission_sources.company_id', companyId),
      supabase.from('emission_sources')
        .select('*')
        .eq('company_id', companyId),
      supabase.from('activity_data')
        .select(`*, emission_sources!inner(company_id)`)
        .eq('emission_sources.company_id', companyId)
    ]);
    
    return { calculated: calculated.data, sources: sources.data, activities: activities.data };
  },

  // Metas e progresso
  goals: async (companyId: string) => {
    return await supabase
      .from('goals')
      .select(`
        *,
        goal_progress_updates(progress_percentage, updated_at, current_value)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  // Auditorias e findings
  audits: async (companyId: string) => {
    return await supabase
      .from('audits')
      .select(`
        *,
        audit_findings(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  // Documentos e AI processing
  documents: async (companyId: string, filter?: string) => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId);
    
    if (filter) {
      query = query.or(`file_name.ilike.%${filter}%,ai_extracted_category.ilike.%${filter}%,tags.cs.{${filter}}`);
    }
    
    return await query.order('upload_date', { ascending: false }).limit(50);
  },

  // Ativos e infraestrutura
  assets: async (companyId: string) => {
    return await supabase
      .from('assets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  // Resíduos
  waste: async (companyId: string) => {
    return await supabase
      .from('waste_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('log_date', { ascending: false })
      .limit(100);
  },

  // Projetos de carbono
  carbonProjects: async (companyId: string) => {
    const [projects, purchases, retirements] = await Promise.all([
      supabase.from('carbon_projects').select('*').eq('company_id', companyId),
      supabase.from('credit_purchases').select('*').eq('company_id', companyId),
      supabase.from('credit_retirements').select('*').eq('company_id', companyId)
    ]);
    
    return { projects: projects.data, purchases: purchases.data, retirements: retirements.data };
  },

  // Atividades de conservação
  conservation: async (companyId: string) => {
    return await supabase
      .from('conservation_activities')
      .select(`
        *,
        activity_monitoring(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },

  // Métricas ESG
  esgMetrics: async (companyId: string) => {
    return await supabase
      .from('esg_metrics')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: false })
      .limit(100);
  },

  // Compliance tasks
  compliance: async (companyId: string) => {
    return await supabase
      .from('compliance_tasks')
      .select('*')
      .eq('company_id', companyId)
      .order('due_date', { ascending: true });
  },

  // Relatórios gerados
  reports: async (companyId: string) => {
    return await supabase
      .from('generated_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('generation_date', { ascending: false })
      .limit(20);
  },

  // Company profile
  company: async (companyId: string) => {
    return await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
  }
};

// Web search for market intelligence
const searchMarketInfo = async (query: string) => {
  try {
    // Simulação de busca de mercado - em produção, conectar com API real
    const searchTerms = query.toLowerCase();
    let marketContext = '';
    
    if (searchTerms.includes('esg') || searchTerms.includes('sustentabil')) {
      marketContext = `Mercado ESG Brasil 2024: Crescimento de 15% em investimentos ESG, novas regulamentações da CVM sobre disclosure de sustentabilidade, tendência de integração de critérios ESG em decisões de investimento.`;
    }
    
    if (searchTerms.includes('emiss') || searchTerms.includes('carbon')) {
      marketContext = `Mercado de Carbono: Preço médio do crédito de carbono em R$ 45-60/tCO2e, regulamentação do mercado brasileiro em desenvolvimento, crescimento de 25% em projetos VCS no Brasil.`;
    }
    
    if (searchTerms.includes('licen') || searchTerms.includes('ambient')) {
      marketContext = `Licenciamento Ambiental: Digitalização de processos em 70% dos órgãos estaduais, prazo médio de análise de 180 dias, tendência de licenciamento por adesão e compromisso.`;
    }
    
    return marketContext;
  } catch (error) {
    console.error('Error fetching market info:', error);
    return '';
  }
};

// Enhanced intent detection and comprehensive data fetching
const processUserIntent = async (message: string, companyId: string, currentPage: string) => {
  const msg = message.toLowerCase();
  let relevantData = null;
  let context = '';
  let marketInfo = '';
  
  try {
    // Detect if user is asking for market/external information
    const isMarketQuery = msg.includes('mercado') || msg.includes('benchmark') || msg.includes('setor') || 
                         msg.includes('regulament') || msg.includes('tendência') || msg.includes('brasil') ||
                         msg.includes('comparar') || msg.includes('média do mercado') || msg.includes('concorr');

    // Fetch market information if needed
    if (isMarketQuery) {
      marketInfo = await searchMarketInfo(message);
    }

    // License-related queries
    if (msg.includes('licen') || msg.includes('venc') || msg.includes('expi') || msg.includes('conform')) {
      const { data } = await queryBuilders.licenses(companyId, msg);
      relevantData = { licenses: data };
      
      const expired = data?.filter(l => new Date(l.expiration_date) < new Date()).length || 0;
      const nearExpiry = data?.filter(l => {
        const expDate = new Date(l.expiration_date);
        const today = new Date();
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expDate >= today && expDate <= futureDate;
      }).length || 0;
      
      context = `Licenças: ${data?.length || 0} total, ${expired} vencidas, ${nearExpiry} vencendo em 30 dias`;
    }
    
    // Comprehensive emissions queries
    else if (msg.includes('emiss') || msg.includes('carbon') || msg.includes('co2') || msg.includes('ghg') || msg.includes('escopo')) {
      const emissionsData = await queryBuilders.emissions(companyId);
      relevantData = emissionsData;
      
      const totalEmissions = emissionsData.calculated?.reduce((sum, item) => sum + (item.total_co2e || 0), 0) || 0;
      const scopeBreakdown = emissionsData.sources?.reduce((acc, source) => {
        acc[`scope${source.scope}`] = (acc[`scope${source.scope}`] || 0) + 1;
        return acc;
      }, {});
      
      context = `Emissões: ${totalEmissions.toFixed(2)} tCO2e total, ${emissionsData.sources?.length || 0} fontes, Escopos: ${JSON.stringify(scopeBreakdown)}`;
    }
    
    // Goals and targets
    else if (msg.includes('meta') || msg.includes('objetivo') || msg.includes('alvo') || msg.includes('target')) {
      const { data } = await queryBuilders.goals(companyId);
      relevantData = { goals: data };
      
      const onTrack = data?.filter(g => g.status === 'No Caminho Certo').length || 0;
      const delayed = data?.filter(g => g.status === 'Em Atraso').length || 0;
      
      context = `Metas: ${data?.length || 0} total, ${onTrack} no caminho certo, ${delayed} em atraso`;
    }
    
    // Audits and findings
    else if (msg.includes('audit') || msg.includes('finding') || msg.includes('não conformidade')) {
      const { data } = await queryBuilders.audits(companyId);
      relevantData = { audits: data };
      
      const openFindings = data?.reduce((acc, audit) => acc + (audit.audit_findings?.filter(f => f.status === 'Aberta').length || 0), 0);
      context = `Auditorias: ${data?.length || 0} realizadas, ${openFindings} findings abertas`;
    }
    
    // Assets and infrastructure
    else if (msg.includes('ativo') || msg.includes('equipamento') || msg.includes('infraestr')) {
      const { data } = await queryBuilders.assets(companyId);
      relevantData = { assets: data };
      
      const operational = data?.filter(a => a.operational_status === 'Operacional').length || 0;
      context = `Ativos: ${data?.length || 0} total, ${operational} operacionais`;
    }
    
    // Waste management
    else if (msg.includes('resíduo') || msg.includes('lixo') || msg.includes('destinação')) {
      const { data } = await queryBuilders.waste(companyId);
      relevantData = { waste: data };
      
      const totalWaste = data?.reduce((sum, log) => sum + (log.quantity || 0), 0) || 0;
      context = `Resíduos: ${data?.length || 0} registros, ${totalWaste.toFixed(2)} kg total`;
    }
    
    // Carbon projects and credits
    else if (msg.includes('crédito') || msg.includes('projeto') || msg.includes('compensação')) {
      const carbonData = await queryBuilders.carbonProjects(companyId);
      relevantData = carbonData;
      
      const totalCredits = carbonData.purchases?.reduce((sum, p) => sum + (p.quantity_tco2e || 0), 0) || 0;
      const totalRetired = carbonData.retirements?.reduce((sum, r) => sum + (r.quantity_tco2e || 0), 0) || 0;
      
      context = `Carbono: ${carbonData.projects?.length || 0} projetos, ${totalCredits} tCO2e comprados, ${totalRetired} tCO2e aposentados`;
    }
    
    // Conservation activities
    else if (msg.includes('conservação') || msg.includes('floresta') || msg.includes('plantio')) {
      const { data } = await queryBuilders.conservation(companyId);
      relevantData = { conservation: data };
      
      const totalArea = data?.reduce((sum, activity) => sum + (activity.area_size || 0), 0) || 0;
      context = `Conservação: ${data?.length || 0} atividades, ${totalArea} hectares`;
    }
    
    // Documents with enhanced AI context
    else if (msg.includes('document') || msg.includes('arquivo') || msg.includes('pdf') || msg.includes('certific')) {
      let filter = '';
      if (msg.includes('licen')) filter = 'licen';
      if (msg.includes('audit')) filter = 'audit';
      if (msg.includes('certific')) filter = 'certific';
      
      const { data } = await queryBuilders.documents(companyId, filter);
      relevantData = { documents: data };
      
      const processed = data?.filter(d => d.ai_processing_status === 'processed').length || 0;
      context = `Documentos: ${data?.length || 0} total, ${processed} processados por IA`;
    }
    
    // ESG metrics and performance
    else if (msg.includes('desempenho') || msg.includes('indicador') || msg.includes('kpi') || msg.includes('métrica')) {
      const { data } = await queryBuilders.esgMetrics(companyId);
      relevantData = { esgMetrics: data };
      
      const latestMetrics = data?.filter(m => {
        const date = new Date(m.period);
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        return date >= threeMonthsAgo;
      }).length || 0;
      
      context = `Métricas ESG: ${data?.length || 0} total, ${latestMetrics} dos últimos 3 meses`;
    }
    
    // Compliance tasks
    else if (msg.includes('compliance') || msg.includes('tarefa') || msg.includes('prazo')) {
      const { data } = await queryBuilders.compliance(companyId);
      relevantData = { compliance: data };
      
      const overdue = data?.filter(t => new Date(t.due_date) < new Date() && t.status === 'Pendente').length || 0;
      const upcoming = data?.filter(t => {
        const due = new Date(t.due_date);
        const today = new Date();
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return due >= today && due <= futureDate;
      }).length || 0;
      
      context = `Compliance: ${data?.length || 0} tarefas, ${overdue} em atraso, ${upcoming} vencendo em 30 dias`;
    }
    
    // Comprehensive dashboard overview
    else if (msg.includes('resumo') || msg.includes('overview') || msg.includes('dashboard') || msg.includes('geral')) {
      const [company, licenses, emissions, goals, audits, compliance] = await Promise.all([
        queryBuilders.company(companyId),
        queryBuilders.licenses(companyId),
        queryBuilders.emissions(companyId),
        queryBuilders.goals(companyId),
        queryBuilders.audits(companyId),
        queryBuilders.compliance(companyId)
      ]);
      
      relevantData = {
        company: company.data,
        licenses: licenses.data,
        emissions: emissions.data,
        goals: goals.data,
        audits: audits.data,
        compliance: compliance.data
      };
      
      const totalEmissions = emissions.data?.calculated?.reduce((sum, item) => sum + (item.total_co2e || 0), 0) || 0;
      context = `Overview Completo: ${licenses.data?.length} licenças, ${totalEmissions.toFixed(2)} tCO2e, ${goals.data?.length} metas, ${audits.data?.length} auditorias, ${compliance.data?.length} tarefas compliance`;
    }
    
    // Default - try to get relevant data based on current page
    else {
      switch (currentPage) {
        case 'licenciamento':
          const { data: licData } = await queryBuilders.licenses(companyId);
          relevantData = { licenses: licData };
          context = `Contexto Licenciamento: ${licData?.length || 0} licenças`;
          break;
        case 'metas':
          const { data: goalData } = await queryBuilders.goals(companyId);
          relevantData = { goals: goalData };
          context = `Contexto Metas: ${goalData?.length || 0} metas`;
          break;
        case 'inventario-gee':
          const emData = await queryBuilders.emissions(companyId);
          relevantData = emData;
          context = `Contexto GEE: ${emData.calculated?.length || 0} cálculos de emissão`;
          break;
        default:
          context = 'Pergunta geral - dados contextuais limitados';
      }
    }
    
  } catch (error) {
    console.error('Error fetching data:', error);
    context = `Erro ao buscar dados: ${error.message}`;
  }
  
  return { relevantData, context, marketInfo };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, currentPage = 'dashboard', userId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Get user's company and profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        company_id,
        full_name,
        companies(name, sector, cnpj)
      `)
      .eq('id', userId)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    // Process user intent and fetch comprehensive data
    const { relevantData, context, marketInfo } = await processUserIntent(message, profile.company_id, currentPage);
    
    // Prepare enhanced OpenAI request
    const systemPrompt = getSystemPrompt(currentPage, { 
      companyName: profile.companies?.name,
      sector: profile.companies?.sector 
    });
    
    let userPrompt = `Pergunta do usuário: ${message}

## CONTEXTO DA EMPRESA:
${context}

## DADOS ENCONTRADOS:
${relevantData ? JSON.stringify(relevantData, null, 2) : 'Nenhum dado específico encontrado para esta consulta.'}`;

    // Add market intelligence if available
    if (marketInfo) {
      userPrompt += `

## INFORMAÇÕES DE MERCADO:
${marketInfo}`;
    }

    console.log('Sending enhanced request to OpenAI with context:', context);
    console.log('Market info included:', !!marketInfo);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Enhanced navigation suggestions based on comprehensive analysis
    let suggestedActions = [];
    const msg = message.toLowerCase();
    
    // Smart navigation suggestions
    if ((msg.includes('licen') || msg.includes('venc')) && currentPage !== 'licenciamento') {
      suggestedActions.push({ type: 'navigate', label: 'Ir para Licenciamento', path: '/licenciamento' });
    }
    if ((msg.includes('meta') || msg.includes('objetivo')) && currentPage !== 'metas') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Metas ESG', path: '/metas' });
    }
    if ((msg.includes('emiss') || msg.includes('carbon') || msg.includes('ghg')) && currentPage !== 'inventario-gee') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Inventário GEE', path: '/inventario-gee' });
    }
    if ((msg.includes('document') || msg.includes('arquivo')) && currentPage !== 'documentos') {
      suggestedActions.push({ type: 'navigate', label: 'Gerenciar Documentos', path: '/documentos' });
    }
    if ((msg.includes('audit') || msg.includes('finding')) && currentPage !== 'auditoria') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Auditorias', path: '/auditoria' });
    }
    if ((msg.includes('ativo') || msg.includes('equipamento')) && currentPage !== 'ativos') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Ativos', path: '/ativos' });
    }
    if ((msg.includes('resíduo') || msg.includes('destinação')) && currentPage !== 'residuos') {
      suggestedActions.push({ type: 'navigate', label: 'Gestão de Resíduos', path: '/residuos' });
    }
    if ((msg.includes('crédito') || msg.includes('projeto')) && currentPage !== 'projetos-carbono') {
      suggestedActions.push({ type: 'navigate', label: 'Projetos de Carbono', path: '/projetos-carbono' });
    }
    if ((msg.includes('conservação') || msg.includes('plantio')) && currentPage !== 'registrar-atividade-conservacao') {
      suggestedActions.push({ type: 'navigate', label: 'Atividades de Conservação', path: '/registrar-atividade-conservacao' });
    }
    if ((msg.includes('compliance') || msg.includes('tarefa')) && currentPage !== 'compliance') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Compliance', path: '/compliance' });
    }
    if ((msg.includes('relatório') || msg.includes('report')) && currentPage !== 'relatorios') {
      suggestedActions.push({ type: 'navigate', label: 'Gerar Relatórios', path: '/relatorios' });
    }
    if ((msg.includes('desempenho') || msg.includes('analytics')) && currentPage !== 'desempenho') {
      suggestedActions.push({ type: 'navigate', label: 'Análise de Desempenho', path: '/desempenho' });
    }

    // Action suggestions based on data analysis
    if (relevantData) {
      // License expiry warnings
      if (relevantData.licenses) {
        const nearExpiry = relevantData.licenses.filter(l => {
          const expDate = new Date(l.expiration_date);
          const today = new Date();
          const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          return expDate >= today && expDate <= futureDate;
        });
        
        if (nearExpiry.length > 0) {
          suggestedActions.push({ 
            type: 'action', 
            label: `⚠️ ${nearExpiry.length} licença(s) vencendo em breve`, 
            path: '/licenciamento' 
          });
        }
      }
      
      // Goals behind schedule
      if (relevantData.goals) {
        const delayed = relevantData.goals.filter(g => g.status === 'Em Atraso');
        if (delayed.length > 0) {
          suggestedActions.push({ 
            type: 'action', 
            label: `📈 ${delayed.length} meta(s) precisam atenção`, 
            path: '/metas' 
          });
        }
      }
      
      // Open audit findings
      if (relevantData.audits) {
        const openFindings = relevantData.audits.reduce((acc, audit) => 
          acc + (audit.audit_findings?.filter(f => f.status === 'Aberta').length || 0), 0);
        if (openFindings > 0) {
          suggestedActions.push({ 
            type: 'action', 
            label: `🔍 ${openFindings} finding(s) para resolver`, 
            path: '/auditoria' 
          });
        }
      }
      
      // Overdue compliance tasks
      if (relevantData.compliance) {
        const overdue = relevantData.compliance.filter(t => 
          new Date(t.due_date) < new Date() && t.status === 'Pendente');
        if (overdue.length > 0) {
          suggestedActions.push({ 
            type: 'action', 
            label: `⏰ ${overdue.length} tarefa(s) em atraso`, 
            path: '/compliance' 
          });
        }
      }
    }

    // Market opportunity suggestions
    if (marketInfo) {
      if (msg.includes('crédito') || msg.includes('carbon')) {
        suggestedActions.push({ 
          type: 'action', 
          label: '💡 Explorar oportunidades de carbono', 
          path: '/projetos-carbono' 
        });
      }
      if (msg.includes('esg') || msg.includes('sustentabil')) {
        suggestedActions.push({ 
          type: 'action', 
          label: '📊 Ver benchmarks ESG', 
          path: '/desempenho' 
        });
      }
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      context,
      marketInfo: marketInfo || null,
      suggestedActions: suggestedActions.slice(0, 4), // Limit to 4 suggestions
      dataFound: !!relevantData,
      companyName: profile.companies?.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Nossa equipe técnica foi notificada. Tente novamente em alguns momentos ou reformule sua pergunta.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});