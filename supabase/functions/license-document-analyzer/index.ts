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

// Helper function to extract text from PDF
async function extractPdfText(fileBlob: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple PDF text extraction looking for readable text patterns
    let text = '';
    let inTextObject = false;
    
    for (let i = 0; i < uint8Array.length - 10; i++) {
      // Look for PDF text markers
      const slice = uint8Array.slice(i, i + 3);
      const str = String.fromCharCode(...slice);
      
      if (str === 'BT ') {
        inTextObject = true;
        i += 2;
        continue;
      }
      
      if (str === 'ET ') {
        inTextObject = false;
        text += '\n';
        i += 2;
        continue;
      }
      
      if (inTextObject && uint8Array[i] >= 32 && uint8Array[i] <= 126) {
        text += String.fromCharCode(uint8Array[i]);
      }
    }
    
    // Clean up extracted text
    return text.replace(/[^\w\s\-\/\(\)\.\,\:]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 8000); // Limit size
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

// Helper function to parse Excel/CSV data
async function parseSpreadsheet(fileBlob: Blob, fileName: string): Promise<string> {
  try {
    const arrayBuffer = await fileBlob.arrayBuffer();
    
    if (fileName.toLowerCase().includes('.csv')) {
      const text = new TextDecoder().decode(arrayBuffer);
      const lines = text.split('\n').slice(0, 50);
      return lines.join('\n');
    } else if (fileName.toLowerCase().includes('.xlsx') || fileName.toLowerCase().includes('.xls')) {
      // Basic Excel content extraction (simplified)
      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(arrayBuffer);
      // Extract readable text patterns
      const readableText = text.replace(/[^\w\s\-\/\(\)\.\,\:]/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
      return readableText.substring(0, 5000);
    }
    
    return '';
  } catch (error) {
    console.error('Error parsing spreadsheet:', error);
    return '';
  }
}

// Helper function to determine file type
function getFileType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  if (['pdf'].includes(extension || '')) return 'pdf';
  if (['xlsx', 'xls', 'csv'].includes(extension || '')) return 'spreadsheet';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image';
  
  return 'unknown';
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

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(documentPath)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`)
    }

    const fileName = documentPath.split('/').pop() || '';
    const fileType = getFileType(fileName);
    
    console.log(`File type detected: ${fileType} for file: ${fileName}`)

    let documentContent = '';
    let useVision = false;
    let signedUrl = '';

    // Process file based on type
    if (fileType === 'pdf') {
      console.log('Extracting text from PDF...');
      documentContent = await extractPdfText(fileData);
      
      // If no text extracted or very little, fallback to vision
      if (documentContent.length < 100) {
        console.log('PDF text extraction yielded little content, using vision API...');
        const { data: signedUrlData, error: urlError } = await supabaseClient.storage
          .from('documents')
          .createSignedUrl(documentPath, 300);
        
        if (!urlError && signedUrlData?.signedUrl) {
          signedUrl = signedUrlData.signedUrl;
          useVision = true;
        }
      }
    } else if (fileType === 'spreadsheet') {
      console.log('Parsing spreadsheet...');
      documentContent = await parseSpreadsheet(fileData, fileName);
    } else if (fileType === 'image') {
      console.log('Using vision API for image...');
      const { data: signedUrlData, error: urlError } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(documentPath, 300);
      
      if (!urlError && signedUrlData?.signedUrl) {
        signedUrl = signedUrlData.signedUrl;
        useVision = true;
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Calling OpenAI API for analysis...')

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare messages based on content type
    const messages = [
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
        
        ${fileType === 'pdf' ? 'Este é um documento PDF convertido para texto.' : ''}
        ${fileType === 'spreadsheet' ? 'Este é um arquivo de planilha convertido para texto.' : ''}

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
      }
    ];

    if (useVision) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:'
          },
          {
            type: 'image_url',
            image_url: {
              url: signedUrl
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analise este documento de licença ambiental e extraia os dados para preenchimento do formulário:

CONTEÚDO DO DOCUMENTO:
${documentContent}`
      });
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useVision ? 'gpt-4o-mini' : 'gpt-4o-mini',
        messages: messages,
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

    console.log(`Analysis completed with overall confidence: ${overallConfidence} using ${useVision ? 'vision' : 'text'} analysis`)

    return new Response(JSON.stringify({
      success: true,
      extracted_data: extractedData,
      overall_confidence: overallConfidence,
      analysis_type: useVision ? 'vision' : 'text',
      file_type: fileType,
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