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

  try {
    const { messages, companyId, currentPage } = await req.json();
    
    console.log('Daton AI Chat request:', { companyId, currentPage, messageCount: messages?.length });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get company data for context
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name, sector, cnpj')
      .eq('id', companyId)
      .single();

    // Define tools for AI to access data
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_emissions_data",
          description: "Buscar dados de emissões de GEE da empresa, incluindo totais por escopo e fontes de emissão",
          parameters: {
            type: "object",
            properties: {
              scope: {
                type: "string",
                enum: ["1", "2", "3", "all"],
                description: "Escopo de emissões (1, 2, 3 ou 'all' para todos)"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_licenses_status",
          description: "Verificar status de licenças ambientais, incluindo vencimentos próximos",
          parameters: {
            type: "object",
            properties: {
              urgency: {
                type: "string",
                enum: ["all", "expiring_soon", "expired"],
                description: "Filtrar por urgência"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_goals_progress",
          description: "Obter progresso das metas ESG e de sustentabilidade da empresa",
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["all", "environmental", "social", "governance"],
                description: "Categoria das metas"
              }
            }
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_compliance_status",
          description: "Verificar status geral de conformidade regulatória",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_waste_metrics",
          description: "Obter métricas de gestão de resíduos",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_employee_metrics",
          description: "Obter dados sobre colaboradores e métricas sociais",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      }
    ];

    // Build system prompt with context
    const systemPrompt = `Você é o Assistente IA do Daton, um sistema especializado em gestão ESG (Ambiental, Social e Governança).

**Empresa atual:** ${company?.name || 'Empresa'}
**Setor:** ${company?.sector || 'N/A'}
**Página atual:** ${currentPage || 'dashboard'}

**Suas capacidades:**
- Analisar dados de emissões de GEE
- Verificar status de licenças ambientais
- Acompanhar progresso de metas ESG
- Analisar conformidade regulatória
- Fornecer insights sobre gestão de resíduos
- Analisar métricas sociais e de colaboradores

**Como responder:**
- Seja direto, claro e objetivo
- Use dados reais quando disponíveis
- Forneça insights acionáveis
- Sugira próximos passos quando apropriado
- Use emojis para destacar informações importantes
- Organize informações em bullets ou tabelas quando necessário
- Sempre que acessar dados, mencione a fonte

**Contexto da página atual:** ${getPageContext(currentPage)}`;

    // Call Lovable AI with tool calling
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Check if AI wants to call tools
    const choice = data.choices[0];
    
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      console.log('AI requested tool calls:', choice.message.tool_calls);
      
      // Execute tool calls
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, functionArgs);
          
          const result = await executeTool(functionName, functionArgs, companyId, supabaseClient);
          
          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            name: functionName,
            content: JSON.stringify(result)
          };
        })
      );

      // Send tool results back to AI for final response
      const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            choice.message,
            ...toolResults
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!finalResponse.ok) {
        throw new Error(`AI API error: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const assistantMessage = finalData.choices[0].message.content;
      
      return new Response(JSON.stringify({ 
        message: assistantMessage,
        dataAccessed: toolResults.map((r: any) => r.name)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tool calls, return direct response
    const assistantMessage = choice.message.content;
    
    return new Response(JSON.stringify({ 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daton-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getPageContext(page: string): string {
  const contexts: Record<string, string> = {
    'dashboard': 'Você está na página principal. Forneça visão geral e KPIs importantes.',
    'inventario-gee': 'Página de inventário de GEE. Foque em emissões, fontes e análise de carbono.',
    'licenciamento': 'Página de licenciamento ambiental. Foque em licenças, vencimentos e conformidade.',
    'metas': 'Página de metas ESG. Foque em progresso, OKRs e objetivos de sustentabilidade.',
    'gestao-esg': 'Página de gestão ESG. Forneça análise holística de performance ESG.',
    'documentos': 'Página de documentos. Ajude com gestão documental e organização.',
    'auditoria': 'Página de auditoria. Foque em conformidade e auditorias.',
  };
  return contexts[page] || 'Contexto geral do sistema.';
}

async function executeTool(
  toolName: string, 
  args: any, 
  companyId: string, 
  supabase: any
): Promise<any> {
  console.log(`Executing tool: ${toolName} for company ${companyId}`);

  switch (toolName) {
    case 'get_emissions_data': {
      const { scope } = args;
      
      // Get emission sources
      let query = supabase
        .from('emission_sources')
        .select('*, calculated_emissions(total_co2e, calculation_date)')
        .eq('company_id', companyId);
      
      if (scope !== 'all') {
        query = query.eq('scope', parseInt(scope));
      }
      
      const { data: sources, error } = await query;
      
      if (error) {
        console.error('Error fetching emissions:', error);
        return { error: 'Erro ao buscar dados de emissões' };
      }

      // Calculate totals by scope
      const totalsByScope = sources?.reduce((acc: any, source: any) => {
        const scopeKey = `scope${source.scope}`;
        const emissions = source.calculated_emissions?.[0]?.total_co2e || 0;
        acc[scopeKey] = (acc[scopeKey] || 0) + emissions;
        return acc;
      }, {}) || {};

      return {
        totalSources: sources?.length || 0,
        totalsByScope,
        totalEmissions: Object.values(totalsByScope).reduce((a: any, b: any) => a + b, 0),
        sources: sources?.map(s => ({
          name: s.name,
          category: s.category,
          scope: s.scope,
          emissions: s.calculated_emissions?.[0]?.total_co2e || 0
        })) || []
      };
    }

    case 'get_licenses_status': {
      const { urgency } = args;
      const now = new Date().toISOString();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('licenses')
        .select('*')
        .eq('company_id', companyId);
      
      if (urgency === 'expiring_soon') {
        query = query.gte('expiration_date', now).lte('expiration_date', thirtyDaysFromNow);
      } else if (urgency === 'expired') {
        query = query.lt('expiration_date', now);
      }
      
      const { data: licenses, error } = await query.order('expiration_date');
      
      if (error) {
        console.error('Error fetching licenses:', error);
        return { error: 'Erro ao buscar licenças' };
      }

      return {
        total: licenses?.length || 0,
        expiringSoon: licenses?.filter(l => 
          new Date(l.expiration_date) > new Date() && 
          new Date(l.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length || 0,
        expired: licenses?.filter(l => new Date(l.expiration_date) < new Date()).length || 0,
        licenses: licenses?.map(l => ({
          name: l.name,
          type: l.type,
          status: l.status,
          expirationDate: l.expiration_date,
          daysUntilExpiration: Math.ceil((new Date(l.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        })) || []
      };
    }

    case 'get_goals_progress': {
      const { category } = args;
      
      let query = supabase
        .from('goals')
        .select('*')
        .eq('company_id', companyId);
      
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data: goals, error } = await query;
      
      if (error) {
        console.error('Error fetching goals:', error);
        return { error: 'Erro ao buscar metas' };
      }

      const summary = {
        total: goals?.length || 0,
        onTrack: goals?.filter(g => g.progress >= 80).length || 0,
        atRisk: goals?.filter(g => g.progress >= 50 && g.progress < 80).length || 0,
        delayed: goals?.filter(g => g.progress < 50).length || 0,
        averageProgress: goals?.reduce((sum, g) => sum + (g.progress || 0), 0) / (goals?.length || 1),
        goals: goals?.map(g => ({
          name: g.name,
          category: g.category,
          progress: g.progress,
          targetDate: g.target_date,
          status: g.status
        })) || []
      };

      return summary;
    }

    case 'get_compliance_status': {
      // Check various compliance indicators
      const [licensesResult, auditsResult, risksResult] = await Promise.all([
        supabase.from('licenses').select('*').eq('company_id', companyId).eq('status', 'Ativa'),
        supabase.from('audits').select('*').eq('company_id', companyId),
        supabase.from('risks').select('*').eq('company_id', companyId).in('risk_level', ['Alto', 'Crítico'])
      ]);

      return {
        activeLicenses: licensesResult.data?.length || 0,
        recentAudits: auditsResult.data?.length || 0,
        highRisks: risksResult.data?.length || 0,
        complianceScore: calculateComplianceScore(licensesResult.data, risksResult.data)
      };
    }

    case 'get_waste_metrics': {
      const { data: wasteLogs, error } = await supabase
        .from('waste_logs')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) {
        console.error('Error fetching waste data:', error);
        return { error: 'Erro ao buscar dados de resíduos' };
      }

      const byClass = wasteLogs?.reduce((acc: any, log: any) => {
        const classKey = log.class || 'Não classificado';
        acc[classKey] = (acc[classKey] || 0) + (log.quantity || 0);
        return acc;
      }, {}) || {};

      return {
        totalRecords: wasteLogs?.length || 0,
        totalQuantity: wasteLogs?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0,
        byClass,
        recycled: wasteLogs?.filter(l => l.final_destination?.includes('Reciclagem')).length || 0
      };
    }

    case 'get_employee_metrics': {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'Ativo');
      
      if (error) {
        console.error('Error fetching employee data:', error);
        return { error: 'Erro ao buscar dados de colaboradores' };
      }

      return {
        totalActive: employees?.length || 0,
        byDepartment: employees?.reduce((acc: any, emp: any) => {
          const dept = emp.department || 'Não especificado';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {}) || {},
        averageTenure: 'N/A' // Could calculate if we have hire_date
      };
    }

    default:
      return { error: `Ferramenta desconhecida: ${toolName}` };
  }
}

function calculateComplianceScore(licenses: any[], risks: any[]): number {
  let score = 100;
  
  // Penalize for missing/expired licenses
  const inactiveLicenses = licenses?.filter(l => l.status !== 'Ativa').length || 0;
  score -= inactiveLicenses * 5;
  
  // Penalize for high risks
  score -= (risks?.length || 0) * 10;
  
  return Math.max(0, Math.min(100, score));
}
