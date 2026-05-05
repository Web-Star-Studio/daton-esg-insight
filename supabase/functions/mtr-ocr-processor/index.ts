import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { aiCall } from "../_shared/ai-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `Você é um especialista em análise de documentos MTR (Manifesto de Transporte de Resíduos).

Analise este documento MTR e extraia os seguintes dados em formato JSON:

{
  "mtr_number": "número do manifesto ou controle",
  "collection_date": "data da coleta no formato YYYY-MM-DD",
  "waste_description": "descrição detalhada do resíduo",
  "waste_class": "classe do resíduo (Classe I - Perigoso, Classe II A - Não Inerte, ou Classe II B - Inerte)",
  "quantity": número da quantidade (apenas o número),
  "unit": "unidade (kg, tonelada, Litros, m³)",
  "transporter_name": "nome da empresa transportadora",
  "transporter_cnpj": "CNPJ do transportador (apenas números)",
  "destination_name": "nome da empresa destinadora",
  "destination_cnpj": "CNPJ do destinador (apenas números)", 
  "final_treatment_type": "tipo de destinação final (Reciclagem, Aterro Sanitário, Incineração, Co-processamento, etc.)",
  "confidence_score": número de 0 a 100 indicando sua confiança na extração
}

REGRAS IMPORTANTES:
1. Se algum campo não for encontrado no documento, retorne null para esse campo.
2. Seja preciso na extração e indique sua confiança geral no resultado.
3. Procure por informações em tabelas, campos de formulário e texto corrido.
4. Para CNPJs, extraia apenas os números (sem pontos, barras ou hífens).
5. Para datas, converta para o formato YYYY-MM-DD.
6. Para quantidades, extraia apenas o valor numérico.
7. Retorne APENAS o JSON, sem explicações adicionais.`;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const companyId = (formData.get('company_id') as string | null) ?? null;
    const userId = (formData.get('user_id') as string | null) ?? null;

    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    console.warn(`Processando documento ${documentType}: ${file.name}, tamanho: ${file.size} bytes`);

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = file.type;

    console.warn(`Tipo MIME: ${mimeType}, enviando para Lovable AI Gateway via aiCall...`);

    type GeminiResponse = {
      choices?: Array<{ message?: { content?: string } }>;
    };

    let aiResult: GeminiResponse;
    try {
      aiResult = await aiCall<GeminiResponse>(
        {
          functionName: 'mtr-ocr-processor',
          featureTag: 'mtr-ocr',
          companyId,
          userId,
          meta: {
            file_name: file.name,
            file_size: file.size,
            mime_type: mimeType,
            document_type: documentType,
          },
        },
        {
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: EXTRACTION_PROMPT },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analise este documento MTR e extraia os dados conforme solicitado:',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64File}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 1500,
          temperature: 0.1,
        },
      );
    } catch (gatewayErr) {
      const status = (gatewayErr as { status?: number })?.status ?? 0;
      if (status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Limite de requisições excedido. Por favor, aguarde alguns segundos e tente novamente.',
            hint: 'rate_limit',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace Lovable.',
            hint: 'payment_required',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      throw gatewayErr;
    }

    console.warn('Resposta da IA recebida');

    // Extract the JSON from the response
    let extractedData;
    try {
      const content = aiResult.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }
      
      console.warn('Conteúdo bruto:', content.substring(0, 500));
      
      // Clean markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      // Try to find JSON in the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Nenhum JSON encontrado na resposta da IA');
      }
    } catch (parseError) {
      console.error('Erro ao processar resposta:', parseError);
      throw new Error('Falha ao processar os dados extraídos');
    }

    // Log successful extraction
    console.warn('Dados extraídos com sucesso:', JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: extractedData,
        processing_info: {
          file_name: file.name,
          file_size: file.size,
          mime_type: mimeType,
          document_type: documentType,
          processed_at: new Date().toISOString(),
          ai_model: 'google/gemini-3-flash-preview'
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro no processador MTR OCR:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: 'Falha ao processar documento MTR'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});
