import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedCNPJData {
  cnpj: string;
  nome: string;
  nomeFantasia: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  telefone: string | null;
  email: string | null;
  situacao: string | null;
  dataAbertura: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pdfBase64, fileName } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing PDF: ${fileName || 'unknown'}`);

    // Call OpenAI Vision API to extract data from PDF
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extração de dados de documentos brasileiros.
Sua tarefa é extrair informações do Comprovante de Inscrição e de Situação Cadastral (Cartão CNPJ) da Receita Federal do Brasil.

Extraia os seguintes campos e retorne APENAS um JSON válido (sem markdown, sem explicações):
{
  "cnpj": "00.000.000/0000-00",
  "nome": "RAZÃO SOCIAL DA EMPRESA",
  "nomeFantasia": "NOME FANTASIA" ou null,
  "logradouro": "RUA/AVENIDA NOME",
  "numero": "123",
  "bairro": "NOME DO BAIRRO",
  "cep": "00000000",
  "cidade": "NOME DA CIDADE",
  "uf": "UF",
  "telefone": "(00) 0000-0000" ou null,
  "email": "email@empresa.com.br" ou null,
  "situacao": "ATIVA" ou "INAPTA" etc,
  "dataAbertura": "01/01/2000" ou null
}

Regras importantes:
- O CNPJ deve estar formatado com pontos, barras e traço
- O CEP deve conter apenas números (8 dígitos)
- O UF deve ser a sigla de 2 letras
- Se algum campo não for encontrado, use null
- Retorne APENAS o JSON, sem texto adicional`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados do comprovante de CNPJ desta imagem/documento:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar documento com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received');

    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair dados do documento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let extractedData: ExtractedCNPJData;
    try {
      let jsonString = content.trim();
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível interpretar os dados extraídos. Tente um PDF com melhor qualidade.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that we got at least the CNPJ
    if (!extractedData.cnpj) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CNPJ não encontrado no documento. Verifique se é um cartão CNPJ válido.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted CNPJ:', extractedData.cnpj);

    // Transform to frontend format
    const transformedData = {
      cnpj: extractedData.cnpj,
      name: extractedData.nome || '',
      tradeName: extractedData.nomeFantasia || null,
      address: extractedData.logradouro || '',
      streetNumber: extractedData.numero || '',
      neighborhood: extractedData.bairro || '',
      cep: extractedData.cep?.replace(/\D/g, '') || '',
      city: extractedData.cidade || '',
      state: extractedData.uf || '',
      phone: extractedData.telefone || null,
      email: extractedData.email || null,
      status: extractedData.situacao || null,
      openingDate: extractedData.dataAbertura || null,
    };

    return new Response(
      JSON.stringify({ success: true, data: transformedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing CNPJ PDF:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno ao processar PDF' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
