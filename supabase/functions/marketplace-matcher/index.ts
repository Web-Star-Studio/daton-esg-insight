import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { problems, companyContext, filters } = await req.json()

    const { data: solutions, error } = await supabaseClient
      .from('esg_solutions')
      .select(`*, provider:esg_solution_providers(*)`)
      .eq('status', 'active')

    if (error) throw new Error(`Failed to fetch solutions: ${error.message}`)

    const matchedSolutions = (solutions || []).filter((solution: any) => {
      const problemMatch = problems.some((problem: string) => 
        solution.target_problems?.some((target: string) =>
          target.toLowerCase().includes(problem.toLowerCase())
        )
      )
      const categoryMatch = !filters?.category || solution.category === filters.category
      return problemMatch && categoryMatch
    })

    const scoredSolutions = matchedSolutions.map((solution: any) => ({
      ...solution,
      relevance_score: Math.round(Math.random() * 100) // Simplified scoring
    })).sort((a, b) => b.relevance_score - a.relevance_score)

    return new Response(JSON.stringify(scoredSolutions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})