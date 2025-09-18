import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing ${documentType} document: ${file.name}, size: ${file.size} bytes`);

    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = file.type;

    // Prepare the prompt for MTR extraction
    const extractionPrompt = `
    Analise este documento MTR (Manifesto de Transporte de Resíduos) e extraia os seguintes dados em formato JSON:

    {
      "mtr_number": "número do manifesto ou controle",
      "collection_date": "data da coleta no formato YYYY-MM-DD",
      "waste_description": "descrição detalhada do resíduo",
      "waste_class": "classe do resíduo (Classe I - Perigoso, Classe II A - Não Inerte, ou Classe II B - Inerte)",
      "quantity": número da quantidade,
      "unit": "unidade (kg, tonelada, Litros, m³)",
      "transporter_name": "nome da empresa transportadora",
      "transporter_cnpj": "CNPJ do transportador",
      "destination_name": "nome da empresa destinadora",
      "destination_cnpj": "CNPJ do destinador", 
      "final_treatment_type": "tipo de destinação final (Reciclagem, Aterro Sanitário, Incineração, Co-processamento, etc.)",
      "confidence_score": número de 0 a 100 indicando sua confiança na extração
    }

    Se algum campo não for encontrado no documento, retorne null para esse campo.
    Seja preciso na extração e indique sua confiança geral no resultado.
    Procure por informações em tabelas, campos de formulário e texto corrido.
    `;

    // Call OpenAI Vision API
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: extractionPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64File}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('OpenAI response:', openaiResult);

    // Extract the JSON from the response
    let extractedData;
    try {
      const content = openaiResult.choices[0].message.content;
      console.log('Raw content:', content);
      
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in OpenAI response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse extracted data');
    }

    // Log successful extraction
    console.log('Extracted data:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: extractedData,
        processing_info: {
          file_name: file.name,
          file_size: file.size,
          mime_type: mimeType,
          document_type: documentType,
          processed_at: new Date().toISOString()
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
    console.error('Error in MTR OCR processor:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to process MTR document'
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