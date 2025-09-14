import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentAnalysisRequest {
  filePath: string;
}

interface ExtractedLicenseFormData {
  license_type?: string
  license_number?: string
  process_number?: string
  issue_date?: string
  valid_from?: string
  valid_until?: string
  company?: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  activity?: string
  area_size_m2?: number
  previous_license_revoked?: string
  conditions?: LicenseCondition[]
  confidence?: number
  _evidence_chars?: number
}

interface LicenseCondition {
  code?: string
  section_title?: string
  text: string
  category?: string
  deadline_days?: number | null
  law_refs?: string
  source_snippet?: string
  confidence?: number
}

// Enhanced prompt for environmental license data extraction
function getEnvironmentalLicensePrompt(): string {
  return `Você é um agente de extração de dados ambientais. Receberá como entrada o conteúdo integral de um documento de licenciamento (PDF convertido em texto/tabelas). Esse documento pode ser uma Licença de Operação (LO), Licença Prévia (LP), Licença de Instalação (LI) ou outro tipo similar.

Seu trabalho é extrair apenas informações que estão de fato no documento e devolvê-las em JSON válido conforme o schema fornecido.

Regras obrigatórias:
- Nunca invente informações. Se um campo não existir, simplesmente não retorne esse campo.
- Sempre inclua um campo confidence de 0 a 1 e um source_snippet com o trecho textual que comprova cada dado extraído.
- Datas devem ser padronizadas no formato YYYY-MM-DD.
- CNPJs devem ser formatados com pontuação (99.999.999/9999-99).
- Coordenadas devem ser numéricas (latitude/longitude).
- Condicionantes/condições devem vir com código (se existir), texto, categoria resumida e snippet.
- Se o documento estiver ilegível ou não houver dados suficientes, retorne apenas: { "confidence": 0.0, "_evidence_chars": 0 }

JSON Schema a seguir:
{
  "type":"object",
  "properties":{
    "license_type":{"type":"string"},
    "license_number":{"type":"string"},
    "process_number":{"type":"string"},
    "issue_date":{"type":"string","format":"date"},
    "valid_from":{"type":"string","format":"date"},
    "valid_until":{"type":"string","format":"date"},
    "company":{"type":"string"},
    "cnpj":{"type":"string"},
    "address":{"type":"string"},
    "city":{"type":"string"},
    "state":{"type":"string"},
    "latitude":{"type":"number"},
    "longitude":{"type":"number"},
    "activity":{"type":"string"},
    "area_size_m2":{"type":"number"},
    "previous_license_revoked":{"type":"string"},
    "conditions":{"type":"array","items":{
      "type":"object",
      "properties":{
        "code":{"type":"string"},
        "section_title":{"type":"string"},
        "text":{"type":"string"},
        "category":{"type":"string"},
        "deadline_days":{"type":["integer","null"]},
        "law_refs":{"type":"string"},
        "source_snippet":{"type":"string"},
        "confidence":{"type":"number"}
      },
      "required":["text"]
    }},
    "confidence":{"type":"number"},
    "_evidence_chars":{"type":"integer"}
  },
  "required":["confidence","_evidence_chars"]
}

Instruções para interpretação:
- Identifique e preencha apenas os campos realmente encontrados no documento.
- Os campos são flexíveis: se a licença não traz "coordenadas" ou "área", esses campos não aparecem.
- Em "conditions", cada condicionante deve ser um item do array com:
  - código (se houver, ex. "3.1.1")
  - título da seção (ex. "Quanto aos Resíduos Sólidos")
  - texto integral da condição
  - categoria curta (ex. residuos, emissoes, ruido, oleos, riscos)
  - snippet literal do trecho no documento
- Use _evidence_chars para somar o total de caracteres dos snippets coletados (medida de "quanto conteúdo real foi usado").

Saída esperada:
- Sempre um único JSON válido que obedece ao schema.
- Não adicione explicações nem comentários fora do JSON.`;
}

// Utility function to extract JSON from AI response
function extractJsonFromText(text: string): any {
  console.log('Attempting to extract JSON from AI response...');
  
  // Remove markdown code blocks and extra whitespace
  let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try to find JSON content between braces
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanText);
    console.log('JSON extraction successful');
    return parsed;
  } catch (error) {
    console.log('Primary JSON parsing failed, attempting cleanup...');
    
    // Try to extract just the JSON object more aggressively
    const startBrace = cleanText.indexOf('{');
    const endBrace = cleanText.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const jsonPart = cleanText.substring(startBrace, endBrace + 1);
      
      try {
        const parsed = JSON.parse(jsonPart);
        console.log('JSON extraction successful after cleanup');
        return parsed;
      } catch (secondError) {
        console.error('Failed to parse JSON after cleanup:', secondError);
        throw new Error(`Invalid JSON format: ${secondError.message}`);
      }
    }
    
    throw new Error(`Unable to extract valid JSON: ${error.message}`);
  }
}

// Parse date from Brazilian format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let tempFileName: string | undefined;
  
  try {
    console.log('Starting comprehensive document analysis...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    console.log(`Starting document analysis for user: ${user.id}`);

    // Get request data
    const { filePath } = await req.json() as DocumentAnalysisRequest;
    
    // Generate unique temp filename
    tempFileName = `temp-analysis-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.pdf`;
    
    console.log(`Downloading document: ${filePath}`);

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log('=== PHASE 1: OPENAI FILES UPLOAD ===');
    
    // Convert blob to form data for OpenAI Files API
    const formData = new FormData();
    formData.append('file', fileData, tempFileName);
    formData.append('purpose', 'assistants');

    console.log('Uploading PDF to OpenAI Files API...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Upload file to OpenAI
    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload to OpenAI: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log(`File uploaded to OpenAI with ID: ${uploadResult.id}`);

    console.log('=== PHASE 2: AI ANALYSIS WITH FILE_SEARCH ===');

    // Create assistant with file_search capability
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: "Environmental License Analyzer",
        instructions: getEnvironmentalLicensePrompt(),
        model: "gpt-4o",
        tools: [{ type: "file_search" }]
      })
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      throw new Error(`Failed to create assistant: ${assistantResponse.status} - ${errorText}`);
    }

    const assistant = await assistantResponse.json();
    console.log(`Assistant created with ID: ${assistant.id}`);

    // Create thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      throw new Error(`Failed to create thread: ${threadResponse.status} - ${errorText}`);
    }

    const thread = await threadResponse.json();
    console.log(`Thread created with ID: ${thread.id}`);

    // Add message to thread with file attachment
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: "user",
        content: "Analise este documento de licenciamento ambiental e extraia todos os dados conforme as instruções fornecidas. Retorne apenas o JSON válido.",
        attachments: [{
          file_id: uploadResult.id,
          tools: [{ type: "file_search" }]
        }]
      })
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Failed to add message: ${messageResponse.status} - ${errorText}`);
    }

    console.log('Message added to thread with PDF attachment');

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistant.id,
        max_completion_tokens: 4000
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Failed to run assistant: ${runResponse.status} - ${errorText}`);
    }

    const run = await runResponse.json();
    console.log(`Run started with ID: ${run.id}`);

    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts with 2s intervals = 2 minutes max

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Run timeout: Analysis took too long');
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const statusResult = await statusResponse.json();
      runStatus = statusResult.status;
      console.log(`Run status: ${runStatus}`);
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus}`);
    }

    console.log('=== PHASE 3: RESULT PROCESSING ===');

    // Get messages from thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      throw new Error(`Failed to get messages: ${messagesResponse.status} - ${errorText}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage || !assistantMessage.content[0]) {
      throw new Error('No response from assistant');
    }

    const aiResponse = assistantMessage.content[0].text.value;
    console.log(`AI response length: ${aiResponse.length}`);

    // Extract and validate JSON
    const extractedData = extractJsonFromText(aiResponse);
    
    // Post-process dates
    if (extractedData.issue_date && !extractedData.issue_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.issue_date = parseDate(extractedData.issue_date);
    }
    if (extractedData.valid_from && !extractedData.valid_from.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.valid_from = parseDate(extractedData.valid_from);
    }
    if (extractedData.valid_until && !extractedData.valid_until.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.valid_until = parseDate(extractedData.valid_until);
    }

    // Calculate final confidence and processing time
    const processingTime = Date.now() - startTime;
    const confidence = Math.round((extractedData.confidence || 0) * 100);
    
    console.log(`Analysis completed: confidence=${confidence}%, processing_time=${processingTime}ms`);

    // Cleanup: Delete assistant, thread, and file from OpenAI
    try {
      await fetch(`https://api.openai.com/v1/assistants/${assistant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      await fetch(`https://api.openai.com/v1/files/${uploadResult.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });

      console.log('OpenAI resources cleaned up');
    } catch (cleanupError) {
      console.error('Failed to cleanup OpenAI resources:', cleanupError);
    }

    // Return results
    const response = {
      success: true,
      data: extractedData,
      confidence: confidence,
      processing_time_ms: processingTime,
      analysis_method: 'openai_files_api'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in license-document-analyzer function:', error);
    
    const processingTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      processing_time_ms: processingTime,
      confidence: 0,
      data: {
        confidence: 0,
        _evidence_chars: 0
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});