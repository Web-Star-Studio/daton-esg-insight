import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface AIInsightRequest {
  card_type: string
  card_data: any
  context?: any
}

interface AIRecommendation {
  id: string
  title: string
  description: string
  action_type: 'quick_win' | 'strategic' | 'urgent'
  estimated_impact: string
  implementation_effort: 'low' | 'medium' | 'high'
  target_module?: string
}

interface AIInsight {
  id: string
  card_type: 'esg_score' | 'emissions' | 'waste' | 'license' | 'performance'
  insight_type: 'contextual' | 'comparative' | 'predictive' | 'recommendation'
  message: string
  detailed_analysis?: string
  recommendations: AIRecommendation[]
  confidence: number
  benchmark_data?: {
    current_value: string
    sector_average: string
    best_practice: string
    percentile: string
  }
  trigger_condition: string
  created_at: Date
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const { card_type, card_data, context } = await req.json() as AIInsightRequest

    console.log(`Generating AI insights for ${card_type}...`)
    const insights = await generateInsights(card_type, card_data, profile, supabaseClient)

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-insights-engine function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateInsights(cardType: string, cardData: any, profile: any, supabaseClient: any): Promise<AIInsight[]> {
  console.log(`Fetching company data for insights...`)
  
  // Fetch comprehensive company data
  const companyData = await fetchCompanyData(profile.company_id, supabaseClient)
  
  // Get company profile for context
  const { data: company } = await supabaseClient
    .from('companies')
    .select('name, sector')
    .eq('id', profile.company_id)
    .single()

  const context = {
    company_name: company?.name || 'Empresa',
    company_sector: company?.sector || 'Não especificado',
    user_name: profile.full_name,
    ...companyData
  }

  console.log(`Calling OpenAI for ${cardType} analysis...`)
  const insights = await callOpenAIForInsights(cardType, cardData, context)
  
  return insights
}

async function fetchCompanyData(companyId: string, supabaseClient: any) {
  console.log('Fetching comprehensive company data...')
  
  const [
    { data: emissions },
    { data: licenses },
    { data: goals },
    { data: assets },
    { data: esgMetrics },
    { data: auditFindings }
  ] = await Promise.all([
    supabaseClient.from('calculated_emissions').select('*').limit(100),
    supabaseClient.from('licenses').select('*').eq('company_id', companyId),
    supabaseClient.from('goals').select('*').eq('company_id', companyId),
    supabaseClient.from('assets').select('*').eq('company_id', companyId),
    supabaseClient.from('esg_metrics').select('*').eq('company_id', companyId),
    supabaseClient.from('audit_findings').select('*').limit(50)
  ])

  return {
    emissions_data: emissions || [],
    licenses_data: licenses || [],
    goals_data: goals || [],
    assets_data: assets || [],
    esg_metrics: esgMetrics || [],
    audit_findings: auditFindings || []
  }
}

async function callOpenAIForInsights(cardType: string, cardData: any, context: any): Promise<AIInsight[]> {
  if (!openAIApiKey) {
    console.error('OpenAI API key not found')
    return []
  }

  const prompt = buildPromptForCardType(cardType, cardData, context)
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise ambiental, ESG e sustentabilidade corporativa. Analise os dados fornecidos e gere insights acionáveis em português brasileiro.
            
Retorne SEMPRE um JSON válido seguindo exatamente esta estrutura:
{
  "insights": [
    {
      "id": "string",
      "card_type": "string",
      "insight_type": "contextual|comparative|predictive|recommendation",
      "message": "string",
      "detailed_analysis": "string",
      "recommendations": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "action_type": "quick_win|strategic|urgent",
          "estimated_impact": "string",
          "implementation_effort": "low|medium|high",
          "target_module": "string"
        }
      ],
      "confidence": 0.95,
      "benchmark_data": {
        "current_value": "string",
        "sector_average": "string", 
        "best_practice": "string",
        "percentile": "string"
      },
      "trigger_condition": "string",
      "created_at": "${new Date().toISOString()}"
    }
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    console.log('OpenAI Raw Response:', content)
    
    // Parse JSON response
    const parsedResponse = JSON.parse(content)
    return parsedResponse.insights || []

  } catch (error) {
    console.error('Error calling OpenAI:', error)
    // Return fallback insights instead of empty array
    return generateFallbackInsights(cardType, cardData, context)
  }
}

function buildPromptForCardType(cardType: string, cardData: any, context: any): string {
  const baseContext = `
Empresa: ${context.company_name}
Setor: ${context.company_sector}
Usuário: ${context.user_name}

Dados da empresa disponíveis:
- ${context.emissions_data.length} registros de emissões
- ${context.licenses_data.length} licenças
- ${context.goals_data.length} metas definidas
- ${context.assets_data.length} ativos
- ${context.esg_metrics.length} métricas ESG
- ${context.audit_findings.length} achados de auditoria
`

  switch (cardType) {
    case 'esg_score':
      return `${baseContext}
      
Card Type: ESG Score Analysis
Dados do card: ${JSON.stringify(cardData)}

Analise o score ESG atual da empresa e gere insights sobre:
1. Comparação com benchmarks do setor
2. Áreas de melhoria prioritárias  
3. Oportunidades de avanço
4. Riscos de conformidade
5. Recomendações específicas para melhoria do score

Considere as métricas ESG disponíveis: ${JSON.stringify(context.esg_metrics.slice(0, 10))}
Considere as metas da empresa: ${JSON.stringify(context.goals_data.slice(0, 5))}`

    case 'emissions_total':
    case 'emissions':
      return `${baseContext}
      
Card Type: Emissions Analysis  
Dados do card: ${JSON.stringify(cardData)}

Analise as emissões da empresa e gere insights sobre:
1. Tendências nas emissões por escopo
2. Comparação com metas de redução
3. Identificação de fontes principais
4. Oportunidades de redução
5. Compliance com regulamentações

Dados de emissões disponíveis: ${JSON.stringify(context.emissions_data.slice(0, 20))}
Metas relacionadas: ${JSON.stringify(context.goals_data.filter((g: any) => g.metric_key?.includes('emission')))}`

    case 'license_compliance':
    case 'licenses':
      return `${baseContext}
      
Card Type: License Compliance Analysis
Dados do card: ${JSON.stringify(cardData)}

Analise o status das licenças ambientais e gere insights sobre:
1. Licenças próximas do vencimento
2. Condicionantes pendentes
3. Riscos de não conformidade
4. Necessidades de renovação
5. Alertas críticos

Licenças da empresa: ${JSON.stringify(context.licenses_data.slice(0, 10))}
Achados de auditoria: ${JSON.stringify(context.audit_findings.slice(0, 5))}`

    case 'waste_management':
    case 'waste':
      return `${baseContext}
      
Card Type: Waste Management Analysis
Dados do card: ${JSON.stringify(cardData)}

Analise a gestão de resíduos e gere insights sobre:
1. Eficiência na gestão de resíduos
2. Oportunidades de reciclagem
3. Compliance com destinação
4. Redução na geração
5. Otimização de custos

Dados de ativos relacionados: ${JSON.stringify(context.assets_data.filter((a: any) => a.asset_type?.toLowerCase().includes('waste')))}`

    default:
      return `${baseContext}
      
Card Type: ${cardType}
Dados do card: ${JSON.stringify(cardData)}

Analise os dados fornecidos e gere insights relevantes sobre performance ambiental, oportunidades de melhoria, riscos e recomendações específicas para esta empresa no setor ${context.company_sector}.`
  }
}

function generateFallbackInsights(cardType: string, cardData: any, context: any): AIInsight[] {
  console.log('Generating fallback insights due to OpenAI error')
  
  const baseInsight: AIInsight = {
    id: crypto.randomUUID(),
    card_type: cardType as any,
    insight_type: 'contextual',
    message: '',
    detailed_analysis: '',
    recommendations: [],
    confidence: 0.75,
    trigger_condition: 'fallback_analysis',
    created_at: new Date()
  }

  switch (cardType) {
    case 'esg_score':
      return [{
        ...baseInsight,
        message: 'Análise ESG indisponível temporariamente. Recomendamos revisar as métricas manualmente.',
        detailed_analysis: 'O sistema de IA está temporariamente indisponível. Verifique suas métricas ESG na seção de Performance.',
        recommendations: [{
          id: crypto.randomUUID(),
          title: 'Revisar Métricas ESG',
          description: 'Acesse a seção de performance para revisar suas métricas ESG atuais',
          action_type: 'quick_win',
          estimated_impact: 'Melhoria na visibilidade dos dados',
          implementation_effort: 'low',
          target_module: 'performance'
        }]
      }]
      
    case 'emissions':
      return [{
        ...baseInsight,
        message: 'Sistema de análise de emissões temporariamente indisponível. Verifique seus dados de emissões.',
        detailed_analysis: 'Recomendamos revisar manualmente os dados de emissões na seção de Inventário GEE.',
        recommendations: [{
          id: crypto.randomUUID(),
          title: 'Verificar Inventário de Emissões',
          description: 'Acesse o inventário GEE para revisar suas emissões atuais',
          action_type: 'quick_win',
          estimated_impact: 'Melhor controle das emissões',
          implementation_effort: 'low',
          target_module: 'emissions'
        }]
      }]
      
    default:
      return [{
        ...baseInsight,
        message: 'Análise de IA temporariamente indisponível. Sistema em manutenção.',
        detailed_analysis: 'O sistema de insights está sendo atualizado. Tente novamente em alguns minutos.',
        recommendations: []
      }]
  }
}