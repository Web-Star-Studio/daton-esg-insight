import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PGRSDocumentRequest {
  planId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { planId } = await req.json() as PGRSDocumentRequest

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get plan data with all related information
    const { data: plan, error: planError } = await supabase
      .from('pgrs_plans')
      .select(`
        *,
        sources:pgrs_waste_sources(
          *,
          waste_types:pgrs_waste_types(*)
        ),
        procedures:pgrs_procedures(*),
        goals:pgrs_goals(*)
      `)
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Error fetching PGRS plan:', planError)
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get company information
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', plan.company_id)
      .single()

    if (companyError || !company) {
      console.error('Error fetching company:', companyError)
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate PDF document data
    const documentHtml = generatePGRSHtml({
      company,
      plan,
      sources: plan.sources || [],
      procedures: plan.procedures || [],
      goals: plan.goals || []
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: documentHtml,
        plan_name: plan.plan_name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in PGRS document generator:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generatePGRSHtml(data: any): string {
  const { company, plan, sources, procedures, goals } = data
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PGRS - ${company.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0066cc;
        }
        .header h1 {
          color: #0066cc;
          margin-bottom: 10px;
        }
        .company-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #0066cc;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .section h3 {
          color: #333;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          text-align: left;
          padding: 12px;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .procedure-item, .goal-item {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          border-left: 4px solid #0066cc;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        .signature-area {
          margin-top: 60px;
          text-align: center;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          width: 300px;
          margin: 0 auto 10px;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PLANO DE GERENCIAMENTO DE RESÍDUOS SÓLIDOS</h1>
        <h2>(PGRS)</h2>
        <p><strong>${company.name}</strong></p>
        <p>Versão: ${plan.version} | Data: ${new Date(plan.created_at).toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="company-info">
        <h3>Identificação da Empresa</h3>
        <p><strong>Razão Social:</strong> ${company.name}</p>
        <p><strong>CNPJ:</strong> ${company.cnpj}</p>
        <p><strong>Endereço:</strong> ${company.headquarters_address || 'Não informado'}</p>
      </div>

      <div class="section">
        <h2>1. DIAGNÓSTICO DE RESÍDUOS SÓLIDOS</h2>
        <h3>1.1. Fontes Geradoras e Tipos de Resíduos</h3>
        
        ${sources.map((source: any, index: number) => `
          <div class="source-section">
            <h4>1.1.${index + 1}. ${source.source_name}</h4>
            <p><strong>Tipo:</strong> ${source.source_type}</p>
            <p><strong>Localização:</strong> ${source.location}</p>
            <p><strong>Descrição:</strong> ${source.description}</p>
            
            ${source.waste_types && source.waste_types.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Resíduo</th>
                    <th>Classe</th>
                    <th>Código IBAMA</th>
                    <th>Qtd/Mês</th>
                    <th>Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  ${source.waste_types.map((wt: any) => `
                    <tr>
                      <td>${wt.waste_name}</td>
                      <td>${wt.hazard_class}</td>
                      <td>${wt.ibama_code}</td>
                      <td>${wt.estimated_quantity_monthly}</td>
                      <td>${wt.unit}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Nenhum tipo de resíduo cadastrado.</p>'}
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>2. PROCEDIMENTOS OPERACIONAIS</h2>
        ${procedures.map((proc: any, index: number) => `
          <div class="procedure-item">
            <h4>2.${index + 1}. ${proc.title}</h4>
            <p><strong>Tipo:</strong> ${proc.procedure_type}</p>
            <p><strong>Descrição:</strong> ${proc.description}</p>
            <p><strong>Infraestrutura:</strong> ${proc.infrastructure_details}</p>
            <p><strong>Responsável:</strong> ${proc.responsible_role}</p>
            <p><strong>Frequência:</strong> ${proc.frequency}</p>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>3. METAS E OBJETIVOS</h2>
        ${goals.map((goal: any, index: number) => `
          <div class="goal-item">
            <h4>3.${index + 1}. ${goal.goal_type}</h4>
            <p><strong>Valor Baseline:</strong> ${goal.baseline_value} ${goal.unit}</p>
            <p><strong>Meta:</strong> ${goal.target_value} ${goal.unit}</p>
            <p><strong>Prazo:</strong> ${new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>4. CRONOGRAMA DE IMPLEMENTAÇÃO</h2>
        <p>As ações definidas neste plano deverão ser implementadas conforme cronograma estabelecido, considerando:</p>
        <ul>
          <li>Treinamento de equipes</li>
          <li>Adequação de infraestrutura</li>
          <li>Implementação de procedimentos</li>
          <li>Monitoramento e avaliação</li>
        </ul>
      </div>

      <div class="section">
        <h2>5. RESPONSABILIDADES</h2>
        <p>Responsável Técnico conforme definido nos procedimentos operacionais.</p>
      </div>

      <div class="section">
        <h2>6. MONITORAMENTO E INDICADORES</h2>
        <p>O monitoramento será realizado através de:</p>
        <ul>
          <li>Acompanhamento das metas estabelecidas</li>
          <li>Registros de movimentação de resíduos</li>
          <li>Relatórios periódicos de desempenho</li>
          <li>Auditorias internas</li>
        </ul>
      </div>

      <div class="signature-area">
        <div class="signature-line"></div>
        <p>Responsável Técnico</p>
        <p>${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="footer">
        <p>Documento gerado automaticamente pelo Sistema Daton</p>
        <p>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `
}