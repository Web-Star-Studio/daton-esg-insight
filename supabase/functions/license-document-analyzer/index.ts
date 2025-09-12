import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentAnalysisRequest {
  documentPath: string;
}

interface ExtractedLicenseFormData {
  nome: string;
  tipo: string;
  orgaoEmissor: string;
  numeroProcesso: string;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  condicionantes: string;
  confidence_scores: {
    nome: number;
    tipo: number;
    orgaoEmissor: number;
    numeroProcesso: number;
    dataEmissao: number;
    dataVencimento: number;
    status: number;
    condicionantes: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    console.log(`Starting document analysis for user: ${user.id}`)

    const { documentPath }: DocumentAnalysisRequest = await req.json()

    if (!documentPath) {
      throw new Error('Document path is required')
    }

    console.log(`Analyzing document: ${documentPath}`)

    // Get signed URL for the document
    const { data: signedUrlData, error: urlError } = await supabaseClient.storage
      .from('documents')
      .createSignedUrl(documentPath, 300) // 5 minutes

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to get document URL: ${urlError?.message}`)
    }

    console.log('Got signed URL, calling OpenAI API...')

    // Call OpenAI API for document analysis
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Você é um especialista em análise de documentos de licenças ambientais brasileiras. 
            Analise o documento de licença ambiental e extraia EXATAMENTE as seguintes informações para preenchimento de um formulário:

            INSTRUÇÕES ESPECÍFICAS:
            1. Nome: Identifique o nome/título da licença (ex: "Licença de Operação - Fábrica Principal")
            2. Tipo: Determine o tipo exato (LP, LI, LO, LAS, LOC, ou Outra)
            3. Órgão Emissor: Identifique o órgão ambiental (IBAMA, CETESB, FEPAM, etc.)
            4. Número do Processo: Encontre o número oficial do processo/documento
            5. Data de Emissão: Data no formato YYYY-MM-DD
            6. Data de Vencimento: Data no formato YYYY-MM-DD
            7. Status: "Ativa" se vigente, ou outro status apropriado
            8. Condicionantes: Liste todas as condicionantes/exigências encontradas

            IMPORTANTE: Para cada campo, atribua uma pontuação de confiança de 0 a 1.
            Se não encontrar informação específica, use string vazia e confiança 0.

            Responda APENAS com um JSON válido no formato:
            {
              "nome": "string",
              "tipo": "string",
              "orgaoEmissor": "string", 
              "numeroProcesso": "string",
              "dataEmissao": "YYYY-MM-DD",
              "dataVencimento": "YYYY-MM-DD",
              "status": "string",
              "condicionantes": "string",
              "confidence_scores": {
                "nome": 0.8,
                "tipo": 0.9,
                "orgaoEmissor": 0.95,
                "numeroProcesso": 0.85,
                "dataEmissao": 0.9,
                "dataVencimento": 0.9,
                "status": 0.7,
                "condicionantes": 0.8
              }
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: signedUrlData.signedUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`)
    }

    const openAIResult = await openAIResponse.json()
    console.log('OpenAI response received')

    if (!openAIResult.choices || !openAIResult.choices[0]) {
      throw new Error('Invalid OpenAI response structure')
    }

    let extractedData: ExtractedLicenseFormData
    try {
      const aiContent = openAIResult.choices[0].message.content
      console.log('AI extracted content:', aiContent)
      extractedData = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      throw new Error('Failed to parse AI analysis results')
    }

    // Calculate overall confidence score
    const confidenceValues = Object.values(extractedData.confidence_scores)
    const overallConfidence = confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length

    console.log(`Analysis completed with overall confidence: ${overallConfidence}`)

    return new Response(JSON.stringify({
      success: true,
      extracted_data: extractedData,
      overall_confidence: overallConfidence,
      analysis_timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in license-document-analyzer:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})