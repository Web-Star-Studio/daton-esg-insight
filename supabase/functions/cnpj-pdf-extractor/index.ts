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

function getRelevantCnpjSnippet(text: string): string {
  const upper = text.toUpperCase();
  const anchors = ['CNPJ', 'NÚMERO DE INSCRIÇÃO', 'INSCRIÇÃO', 'COMPROVANTE', 'MATRIZ', 'FILIAL'];
  let idx = -1;
  for (const a of anchors) {
    idx = upper.indexOf(a);
    if (idx !== -1) break;
  }

  // Keep a bounded window to avoid dumping huge/garbled PDF text to the model.
  if (idx === -1) return text.slice(0, 6000);
  const start = Math.max(0, idx - 2000);
  const end = Math.min(text.length, idx + 4000);
  return text.slice(start, end);
}

// Simple PDF text extraction - works for text-based PDFs
function extractTextFromPDF(base64Data: string): string {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    
    // Convert to text and extract readable content
    // PDF text is often found between "stream" and "endstream" markers
    // and in text objects marked by "BT" (begin text) and "ET" (end text)
    
    let text = '';
    
    // Look for text content in the PDF
    // This is a simplified extraction that works for many text-based PDFs
    const regex = /\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(binaryString)) !== null) {
      const content = match[1];
      // Filter out binary/control characters
      const cleanContent = content.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
      if (cleanContent.length > 1) {
        text += cleanContent + ' ';
      }
    }
    
    // Also try to find hex-encoded text
    const hexRegex = /<([0-9A-Fa-f]+)>/g;
    while ((match = hexRegex.exec(binaryString)) !== null) {
      try {
        const hex = match[1];
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          const charCode = parseInt(hex.substr(i, 2), 16);
          if (charCode >= 32 && charCode <= 126) {
            decoded += String.fromCharCode(charCode);
          }
        }
        if (decoded.length > 1) {
          text += decoded + ' ';
        }
      } catch {
        // Ignore hex decode errors
      }
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
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

    const body = await req.json();
    const { pdfBase64, imageBase64, fileName, fileType } = body;

    // Determine if we have an image or PDF
    const isImage = fileType?.startsWith('image/') || imageBase64;
    const base64Data = imageBase64 || pdfBase64;

    if (!base64Data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Arquivo não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${fileName || 'unknown'}, type: ${fileType || 'unknown'}, isImage: ${isImage}`);

    let openaiResponse;
    let pdfExtractedText = '';

    if (isImage) {
      // For images, use Vision API directly
      const mimeType = fileType || 'image/png';
      
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                  text: 'Extraia os dados do comprovante de CNPJ desta imagem:'
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
    } else {
      // For PDFs, try to extract text and use text-based GPT-4
      console.log('Processing PDF - attempting text extraction');
      
      pdfExtractedText = extractTextFromPDF(base64Data);
      console.log(`Extracted text length: ${pdfExtractedText.length}`);
      
      if (pdfExtractedText.length < 50) {
        // Not enough text extracted - PDF might be image-based
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Este PDF parece ser uma imagem digitalizada. Por favor, faça upload de uma imagem (PNG, JPG) do cartão CNPJ, ou tire um print/screenshot do documento.',
            hint: 'image_required'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cnpjHint = extractCNPJFromText(pdfExtractedText);
      const snippet = getRelevantCnpjSnippet(pdfExtractedText);
      console.log('PDF CNPJ regex hint:', cnpjHint ? 'found' : 'not_found');

      // Use text-based GPT-4 to parse the extracted content
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
Sua tarefa é extrair informações do texto de um Comprovante de Inscrição e de Situação Cadastral (Cartão CNPJ) da Receita Federal do Brasil.

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
 - Retorne APENAS o JSON, sem texto adicional
 - Se o CNPJ estiver no texto sem formatação (apenas números), formate corretamente (00.000.000/0000-00)`
            },
            {
              role: 'user',
              content: `Extraia os dados do seguinte texto de um comprovante de CNPJ.

Dica: um possível CNPJ detectado por regex é: ${cnpjHint || 'N/A'}

TEXTO (trecho mais relevante):\n\n${snippet}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
        }),
      });
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar documento com IA. Tente enviar uma imagem (PNG/JPG) do documento.' }),
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
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível interpretar os dados extraídos. Tente um arquivo com melhor qualidade.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize/repair missing CNPJ (common failure mode)
    if (!extractedData.cnpj) {
      const fromModelText = extractCNPJFromText(content);
      const fromPdfText = pdfExtractedText ? extractCNPJFromText(pdfExtractedText) : null;
      extractedData.cnpj = fromModelText || fromPdfText || undefined;
      console.log('CNPJ recovery:', {
        fromModelText: !!fromModelText,
        fromPdfText: !!fromPdfText,
      });
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
