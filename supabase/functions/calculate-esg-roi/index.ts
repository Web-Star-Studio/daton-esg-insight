import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

interface ROIRequest {
  companyId: string;
  projectType: 'goal' | 'social_project' | 'conservation_activity' | 'training_program';
  projectId: string;
  year?: number;
}

interface ROIResult {
  projectId: string;
  projectType: string;
  totalInvestment: number;
  estimatedBenefits: number;
  roi: number;
  carbonImpact: number;
  socialImpact: string;
  breakdown: {
    directCosts: number;
    indirectCosts: number;
    financialBenefits: number;
    nonFinancialBenefits: number;
  };
  transactions: Array<{
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    const { companyId, projectType, projectId, year }: ROIRequest = await req.json()

    if (!companyId || !projectType || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentYear = year || new Date().getFullYear()

    // 1. Buscar investimentos diretos (contas a pagar vinculadas)
    const { data: payables, error: payablesError } = await supabaseClient
      .from('accounts_payable')
      .select('*')
      .eq('company_id', companyId)
      .eq('esg_related_project_id', projectId)
      .gte('due_date', `${currentYear}-01-01`)
      .lte('due_date', `${currentYear}-12-31`)

    if (payablesError) throw payablesError

    // 2. Buscar vínculos financeiros indiretos
    const { data: links, error: linksError } = await supabaseClient
      .from('esg_financial_links')
      .select(`
        *,
        accounts_payable!inner(final_amount, due_date, invoice_number),
        accounts_receivable!inner(final_amount, due_date, invoice_number)
      `)
      .eq('company_id', companyId)
      .eq('related_project_id', projectId)
      .eq('related_project_type', projectType)

    if (linksError) throw linksError

    // 3. Calcular custos diretos e indiretos
    const directCosts = payables?.reduce((sum, p) => sum + Number(p.final_amount || 0), 0) || 0
    
    let indirectCosts = 0
    let carbonImpact = 0
    const transactions: ROIResult['transactions'] = []

    // Processar vínculos
    if (links) {
      for (const link of links) {
        const allocation = Number(link.allocation_percentage || 100) / 100
        carbonImpact += Number(link.carbon_impact_estimate || 0)
        
        // Adicionar transação vinculada
        if (link.financial_entity_type === 'accounts_payable' && link.accounts_payable) {
          const amount = Number(link.accounts_payable.final_amount || 0) * allocation
          indirectCosts += amount
          transactions.push({
            type: 'Despesa',
            amount,
            date: link.accounts_payable.due_date,
            description: `NF: ${link.accounts_payable.invoice_number || 'N/A'}`
          })
        }
      }
    }

    // Adicionar transações diretas
    payables?.forEach(p => {
      transactions.push({
        type: 'Despesa Direta',
        amount: Number(p.final_amount || 0),
        date: p.due_date,
        description: `NF: ${p.invoice_number || 'N/A'}`
      })
      carbonImpact += Number(p.carbon_impact_estimate || 0)
    })

    const totalInvestment = directCosts + indirectCosts

    // 4. Calcular benefícios estimados baseados no tipo de projeto
    let estimatedBenefits = 0
    let socialImpact = 'N/A'

    switch (projectType) {
      case 'conservation_activity':
        // Benefício: valor do carbono sequestrado (estimativa R$ 50/tCO2e)
        if (carbonImpact < 0) {
          estimatedBenefits = Math.abs(carbonImpact) * 50
          socialImpact = `${Math.abs(carbonImpact).toFixed(2)} tCO2e sequestradas`
        }
        break
      
      case 'training_program':
        // Benefício: redução de turnover e aumento de produtividade (estimativa 20% do investimento)
        estimatedBenefits = totalInvestment * 0.20
        socialImpact = 'Melhoria em capacitação e retenção de talentos'
        break
      
      case 'social_project':
        // Benefício: impacto social (estimativa 30% retorno indireto)
        estimatedBenefits = totalInvestment * 0.30
        socialImpact = 'Impacto positivo na comunidade e reputação'
        break
      
      case 'goal':
        // Benefício: depende da meta específica (estimativa conservadora 15%)
        estimatedBenefits = totalInvestment * 0.15
        socialImpact = 'Progresso em objetivos ESG estratégicos'
        break
    }

    // 5. Calcular ROI
    const roi = totalInvestment > 0 
      ? ((estimatedBenefits - totalInvestment) / totalInvestment) * 100 
      : 0

    const result: ROIResult = {
      projectId,
      projectType,
      totalInvestment,
      estimatedBenefits,
      roi: Math.round(roi * 100) / 100,
      carbonImpact,
      socialImpact,
      breakdown: {
        directCosts,
        indirectCosts,
        financialBenefits: estimatedBenefits * 0.6, // 60% benefícios financeiros
        nonFinancialBenefits: estimatedBenefits * 0.4, // 40% benefícios não-financeiros
      },
      transactions: transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error calculating ESG ROI:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
