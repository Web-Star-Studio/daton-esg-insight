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

const EXTRACTION_PROMPT = `Você é um especialista em extração de dados de documentos brasileiros.
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
- Retorne APENAS o JSON, sem texto adicional`;

function extractCNPJFromText(text: string): string | null {
  // Matches formatted or unformatted CNPJ
  const formatted = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/);
  if (formatted) return formatted[0];

  const digits = text.replace(/\D/g, '');
  const raw = digits.match(/\b\d{14}\b/);
  if (!raw) return null;

  const cnpj = raw[0];
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function getMimeType(fileType: string | undefined, isImage: boolean): string {
  if (fileType) return fileType;
  return isImage ? 'image/png' : 'application/pdf';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { pdfBase64, imageBase64, fileName, fileType } = body;

    const isImage = fileType?.startsWith('image/') || !!imageBase64;
    const base64Data = imageBase64 || pdfBase64;

    if (!base64Data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Arquivo não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${fileName || 'unknown'}, type: ${fileType || 'unknown'}, isImage: ${isImage}`);

    const mimeType = getMimeType(fileType, isImage);
    
    // Use Lovable AI Gateway with Google Gemini Vision for ALL file types
    // Gemini 2.5 Flash has native multimodal support for both images and PDFs
    console.log('Sending to Lovable AI Gateway (google/gemini-2.5-flash)');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: EXTRACTION_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados do comprovante de CNPJ deste documento:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
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

    // Handle rate limits and payment issues
    if (aiResponse.status === 429) {
      console.error('Rate limit exceeded');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Limite de requisições excedido. Aguarde alguns segundos e tente novamente.',
          hint: 'rate_limit'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (aiResponse.status === 402) {
      console.error('Payment required');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Créditos de IA esgotados. Entre em contato com o suporte.',
          hint: 'payment_required'
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI Gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao processar documento com IA. Tente novamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI response received');

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair dados do documento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let extractedData: Partial<ExtractedCNPJData>;
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
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível interpretar os dados extraídos. Tente um arquivo com melhor qualidade.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try to extract CNPJ from the response text if not in JSON
    if (!extractedData.cnpj) {
      const fromModelText = extractCNPJFromText(content);
      extractedData.cnpj = fromModelText || undefined;
      console.log('CNPJ recovery from text:', !!fromModelText);
    }

    // Validate that we got at least the CNPJ
    if (!extractedData.cnpj) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'CNPJ não encontrado no documento. Verifique se é um cartão CNPJ válido ou tente uma imagem com melhor qualidade.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Successfully extracted CNPJ:', extractedData.cnpj);

    // Transform to frontend format
    const transformedData = {
      cnpj: extractedData.cnpj,
      name: extractedData.nome || '',
      tradeName: extractedData.nomeFantasia ?? null,
      address: extractedData.logradouro || '',
      streetNumber: extractedData.numero || '',
      neighborhood: extractedData.bairro || '',
      cep: extractedData.cep?.replace(/\D/g, '') || '',
      city: extractedData.cidade || '',
      state: extractedData.uf || '',
      phone: extractedData.telefone ?? null,
      email: extractedData.email ?? null,
      status: extractedData.situacao ?? null,
      openingDate: extractedData.dataAbertura ?? null,
    };

    return new Response(
      JSON.stringify({ success: true, data: transformedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing CNPJ document:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno ao processar documento' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
