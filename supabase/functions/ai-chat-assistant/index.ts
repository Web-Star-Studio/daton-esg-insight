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

// Context-aware system prompt
const getSystemPrompt = (currentPage: string, userData?: any) => {
  const basePrompt = `Você é um assistente inteligente de ESG e sustentabilidade. Você tem acesso a todos os dados da empresa e pode:
- Responder perguntas sobre licenças, emissões, metas, auditorias, documentos
- Explicar métricas e gráficos
- Sugerir ações e navegação
- Criar filtros e buscar dados específicos

Contexto atual: O usuário está na página "${currentPage}"

IMPORTANTE: 
- Seja conciso e direto
- Use dados reais quando disponível
- Sugira ações práticas
- Se não tiver dados, mencione isso claramente
- Responda sempre em português brasileiro
- Use linguagem profissional mas acessível`;

  return basePrompt;
};

// Query builders for different data types
const queryBuilders = {
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
    
    return await query;
  },
  
  emissions: async (companyId: string) => {
    return await supabase
      .from('calculated_emissions')
      .select(`
        *,
        activity_data!inner(
          emission_sources!inner(company_id)
        )
      `)
      .eq('activity_data.emission_sources.company_id', companyId);
  },
  
  goals: async (companyId: string) => {
    return await supabase
      .from('goals')
      .select(`
        *,
        goal_progress_updates(progress_percentage, updated_at)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
  },
  
  documents: async (companyId: string, filter?: string) => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId);
    
    if (filter) {
      query = query.or(`file_name.ilike.%${filter}%,ai_extracted_category.ilike.%${filter}%`);
    }
    
    return await query;
  }
};

// Intent detection and data fetching
const processUserIntent = async (message: string, companyId: string, currentPage: string) => {
  const msg = message.toLowerCase();
  let relevantData = null;
  let context = '';
  
  try {
    // License-related queries
    if (msg.includes('licen') || msg.includes('venc') || msg.includes('expi')) {
      const { data } = await queryBuilders.licenses(companyId, msg);
      relevantData = data;
      context = `Dados de licenças encontrados: ${data?.length || 0} licenças`;
    }
    
    // Emissions-related queries
    else if (msg.includes('emiss') || msg.includes('carbon') || msg.includes('co2') || msg.includes('ghg')) {
      const { data } = await queryBuilders.emissions(companyId);
      relevantData = data;
      const totalEmissions = data?.reduce((sum, item) => sum + (item.total_co2e || 0), 0) || 0;
      context = `Dados de emissões: ${totalEmissions.toFixed(2)} tCO2e total`;
    }
    
    // Goals-related queries
    else if (msg.includes('meta') || msg.includes('objetivo') || msg.includes('alvo')) {
      const { data } = await queryBuilders.goals(companyId);
      relevantData = data;
      context = `Dados de metas: ${data?.length || 0} metas encontradas`;
    }
    
    // Documents-related queries
    else if (msg.includes('document') || msg.includes('arquivo') || msg.includes('pdf')) {
      let filter = '';
      if (msg.includes('licen')) filter = 'licen';
      if (msg.includes('audit')) filter = 'audit';
      
      const { data } = await queryBuilders.documents(companyId, filter);
      relevantData = data;
      context = `Documentos encontrados: ${data?.length || 0} arquivos`;
    }
    
    // General stats for dashboard queries
    else if (msg.includes('resumo') || msg.includes('overview') || msg.includes('dashboard')) {
      const [licenses, emissions, goals] = await Promise.all([
        queryBuilders.licenses(companyId),
        queryBuilders.emissions(companyId),
        queryBuilders.goals(companyId)
      ]);
      
      relevantData = {
        licenses: licenses.data,
        emissions: emissions.data,
        goals: goals.data
      };
      
      context = `Resumo geral: ${licenses.data?.length} licenças, ${goals.data?.length} metas, ${emissions.data?.reduce((sum, item) => sum + (item.total_co2e || 0), 0).toFixed(2)} tCO2e`;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    context = 'Erro ao buscar dados';
  }
  
  return { relevantData, context };
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

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    // Process user intent and fetch relevant data
    const { relevantData, context } = await processUserIntent(message, profile.company_id, currentPage);
    
    // Prepare OpenAI request
    const systemPrompt = getSystemPrompt(currentPage);
    const userPrompt = `${message}

Contexto da consulta: ${context}
Dados relevantes: ${relevantData ? JSON.stringify(relevantData, null, 2) : 'Nenhum dado específico encontrado'}`;

    console.log('Sending request to OpenAI with context:', context);

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Suggest navigation or actions based on content
    let suggestedActions = [];
    const msg = message.toLowerCase();
    
    if (msg.includes('licen') && currentPage !== 'licenciamento') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Licenças', path: '/licenciamento' });
    }
    if (msg.includes('meta') && currentPage !== 'metas') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Metas', path: '/metas' });
    }
    if (msg.includes('emiss') && currentPage !== 'inventario-gee') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Inventário GEE', path: '/inventario-gee' });
    }
    if (msg.includes('document') && currentPage !== 'documentos') {
      suggestedActions.push({ type: 'navigate', label: 'Ver Documentos', path: '/documentos' });
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      context,
      suggestedActions,
      dataFound: !!relevantData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});