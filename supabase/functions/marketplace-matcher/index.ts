import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { problems, companyContext, filters } = await req.json();

    console.log('Matching solutions for problems:', problems);

    // Buscar todas as soluções ativas
    const { data: solutions, error } = await supabase
      .from('esg_solutions')
      .select(`
        *,
        esg_solution_providers!inner(*)
      `)
      .eq('status', 'active')
      .eq('esg_solution_providers.status', 'active')
      .eq('esg_solution_providers.verified', true);

    if (error) {
      throw error;
    }

    // Filtrar soluções baseado nos problemas identificados
    let matchedSolutions = solutions?.filter(solution => {
      // Verificar se algum problema target da solução corresponde aos problemas da empresa
      const hasMatchingProblem = solution.target_problems?.some(targetProblem => 
        problems.some(problem => 
          problem.toLowerCase().includes(targetProblem.toLowerCase()) || 
          targetProblem.toLowerCase().includes(problem.toLowerCase())
        )
      );

      // Aplicar filtros se fornecidos
      if (filters?.category && solution.category !== filters.category) {
        return false;
      }
      
      if (filters?.price_range && solution.price_range !== filters.price_range) {
        return false;
      }

      return hasMatchingProblem;
    }) || [];

    // Se não houver matches diretos, usar IA para encontrar soluções relevantes
    if (matchedSolutions.length === 0 && openAIApiKey) {
      console.log('No direct matches found, using AI for intelligent matching...');
      
      const aiMatchingPrompt = `
      Analise os seguintes problemas ESG identificados em uma empresa:
      ${problems.join(', ')}
      
      Contexto da empresa: ${JSON.stringify(companyContext)}
      
      Das seguintes soluções disponíveis, quais são as mais relevantes? 
      Retorne apenas um array JSON com os IDs das soluções mais relevantes (máximo 5):
      
      ${solutions?.map(s => `ID: ${s.id}, Título: ${s.title}, Categoria: ${s.category}, Problemas-alvo: ${s.target_problems?.join(', ')}`).join('\n')}
      `;

      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Você é um especialista em soluções ESG. Retorne apenas um array JSON válido com IDs das soluções mais relevantes.' 
              },
              { role: 'user', content: aiMatchingPrompt }
            ],
            max_tokens: 500,
            temperature: 0.3
          }),
        });

        const aiData = await aiResponse.json();
        const relevantIds = JSON.parse(aiData.choices[0].message.content);
        
        matchedSolutions = solutions?.filter(s => relevantIds.includes(s.id)) || [];
        console.log('AI found', matchedSolutions.length, 'relevant solutions');
      } catch (aiError) {
        console.error('AI matching failed:', aiError);
        // Fallback para busca por categoria se IA falhar
        matchedSolutions = solutions?.slice(0, 5) || [];
      }
    }

    // Calcular score de relevância para cada solução
    const scoredSolutions = matchedSolutions.map(solution => {
      let relevanceScore = 0;
      
      // Score baseado em problemas matching
      const matchingProblems = solution.target_problems?.filter(target => 
        problems.some(problem => 
          problem.toLowerCase().includes(target.toLowerCase()) ||
          target.toLowerCase().includes(problem.toLowerCase())
        )
      ) || [];
      
      relevanceScore += matchingProblems.length * 10;
      
      // Score baseado em rating do provider
      relevanceScore += (solution.esg_solution_providers.rating || 0) * 2;
      
      // Score baseado em verificação
      if (solution.esg_solution_providers.verified) {
        relevanceScore += 5;
      }
      
      // Score baseado se é featured
      if (solution.is_featured) {
        relevanceScore += 3;
      }

      return {
        ...solution,
        relevance_score: relevanceScore,
        matching_problems: matchingProblems
      };
    });

    // Ordenar por relevância
    scoredSolutions.sort((a, b) => b.relevance_score - a.relevance_score);

    return new Response(
      JSON.stringify({
        solutions: scoredSolutions,
        total_matches: scoredSolutions.length,
        ai_powered: matchedSolutions.length > 0 && problems.length > 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in marketplace-matcher:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});