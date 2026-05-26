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
  return `Você é um agente de extração de dados ambientais. Receberá um documento de licenciamento (PDF / texto / tabelas) emitido por qualquer órgão ambiental brasileiro — federal (IBAMA), estadual (CETESB, FEPAM, IAT, IMA, INEA, FEAM, IEMA, SEMAD, IAP, SEMACE etc.), municipal (SEMMA, SMMA, SMAM, fundações como FCAM) ou similar. Layouts variam drasticamente entre órgãos.

Tipos possíveis para license_type (escolha o que melhor descreve o documento):
- "LP"  = Licença Prévia
- "LI"  = Licença de Instalação
- "LO"  = Licença de Operação (variações: "L.O.", "L. O.", "LO Nº", "Licença Ambiental de Operação")
- "LOC" = Licença de Operação Corretiva
- "LAS" = Licença Ambiental Simplificada / Única / "Licença Ambiental de Funcionamento" (LAF) municipal
- "DA"  = Dispensa Ambiental, "Declaração de Atividade Dispensada", "Declaração de Atividade Não Constante", "Certidão de Atividade Não Sujeita a Licenciamento", documentos que declaram "atividade isenta" ou "não sujeita ao licenciamento ambiental"
- "Outra" = autorização, outorga, certidão genérica

Seu trabalho é extrair apenas informações que estão de fato no documento e devolvê-las em JSON válido conforme o schema fornecido.

Regras obrigatórias:
- Nunca invente informações. Se um campo não existir, simplesmente não retorne esse campo.
- Sempre inclua um campo confidence de 0 a 1 e um source_snippet com o trecho textual que comprova cada dado extraído.
- Datas devem ser padronizadas no formato YYYY-MM-DD. Aceite datas em DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY ou com mês por extenso ("28 de junho de 2032") no documento e converta para ISO antes de responder.
- Quando encontrar "Período de validade: DD/MM/YYYY a DD/MM/YYYY" (FEPAM e outros), use a SEGUNDA data como valid_until.
- Documentos do tipo "DA" tipicamente NÃO têm valid_until/issue_date de expiração — neste caso, omita o campo (NÃO invente data).
- CNPJs devem ser formatados com pontuação (99.999.999/9999-99).
- Coordenadas devem ser numéricas (latitude/longitude).
- Condicionantes/condições devem vir com código (se existir), texto, categoria resumida e snippet. Para documentos de Dispensa que não trazem condicionantes explícitas, capture as restrições implícitas (ex.: "não está localizado em APP", "atividade limitada a...") como conditions categorizadas como "Gestão".
- Normalize "issuer" usando a sigla oficial do órgão emissor quando reconhecível (CETESB, FEPAM, INEA, IAT, IMA, FEAM, FCAM, IBAMA etc.) seguida da UF entre parênteses quando aplicável.
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
  console.warn('Attempting to extract JSON from AI response...');
  
  // Remove markdown code blocks and extra whitespace
  let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  // Try to find JSON content between braces
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanText);
    console.warn('JSON extraction successful');
    return parsed;
  } catch (error) {
    console.warn('Primary JSON parsing failed, attempting cleanup...');
    
    // Try to extract just the JSON object more aggressively
    const startBrace = cleanText.indexOf('{');
    const endBrace = cleanText.lastIndexOf('}');
    
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const jsonPart = cleanText.substring(startBrace, endBrace + 1);
      
      try {
        const parsed = JSON.parse(jsonPart);
        console.warn('JSON extraction successful after cleanup');
        return parsed;
      } catch (secondError) {
        console.error('Failed to parse JSON after cleanup:', secondError);
        throw new Error(`Invalid JSON format: ${secondError instanceof Error ? secondError.message : String(secondError)}`);
      }
    }
    
    throw new Error(`Unable to extract valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Parse date strings em formatos brasileiros variados para ISO (YYYY-MM-DD).
// Cobre: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (FEPAM, CETESB), e datas por
// extenso em português ("28 de junho de 2032"). Documentos municipais
// escaneados frequentemente trazem datas com ponto, formato que o parser
// antigo ignorava.
const PT_MONTHS: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

function buildIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// position controla qual data extrair em strings com range:
// - 'first' (default) \u2192 in\u00edcio do range (correto para issue_date / valid_from)
// - 'last'             \u2192 fim do range (correto para valid_until)
type DatePosition = 'first' | 'last';

function parseDate(
  dateStr: string,
  position: DatePosition = 'first',
): string | null {
  if (!dateStr) return null;
  const raw = dateStr.trim();
  if (!raw) return null;

  // J\u00e1 ISO? Valida combina\u00e7\u00f5es inv\u00e1lidas (Feb 30 etc.).
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return buildIsoDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10));
  }

  const numericMatches = [
    ...raw.matchAll(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g),
  ];
  if (numericMatches.length > 0) {
    const picked =
      position === 'last'
        ? numericMatches[numericMatches.length - 1]
        : numericMatches[0];
    const [, day, month, year] = picked;
    return buildIsoDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }

  const ascii = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const writtenMatches = [
    ...ascii.matchAll(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/g),
  ];
  if (writtenMatches.length > 0) {
    const picked =
      position === 'last'
        ? writtenMatches[writtenMatches.length - 1]
        : writtenMatches[0];
    const [, day, mName, year] = picked;
    const month = PT_MONTHS[mName];
    if (month) {
      return buildIsoDate(parseInt(year, 10), month, parseInt(day, 10));
    }
  }

  return null;
}

// withTimeout idêntico ao de license-ai-analyzer — wrapper de fetch com
// limite de tempo, usado em callVisionWithPdf abaixo.
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// OCR fallback: sobe o PDF como purpose='user_data' e chama gpt-4o via
// chat.completions, que tem OCR nativo. Usado quando o file_search do
// Assistants API retorna conteúdo vazio (PDFs escaneados sem layer texto).
async function callVisionWithPdf(
  openAIApiKey: string,
  fileBytes: Uint8Array,
  fileName: string,
  fileType: string,
  prompt: string,
  timeoutMs: number,
): Promise<string | null> {
  let uploadedFileId: string | undefined;
  try {
    const formData = new FormData();
    formData.append('file', new Blob([fileBytes], { type: fileType }), fileName);
    formData.append('purpose', 'user_data');

    const uploadResp = await withTimeout(
      fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAIApiKey}` },
        body: formData,
      }),
      30000,
      'OCR file upload timeout',
    );
    if (!uploadResp.ok) {
      console.error('OCR file upload failed:', await uploadResp.text());
      return null;
    }
    const uploaded = await uploadResp.json();
    uploadedFileId = uploaded.id;

    const chatResp = await withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${prompt}\n\nIMPORTANTE: Este documento pode estar escaneado. Use OCR nativo. RESPONDA APENAS COM JSON VÁLIDO.`,
              },
              { type: 'file', file: { file_id: uploadedFileId } },
            ],
          }],
        }),
      }),
      timeoutMs,
      'OCR chat completion timeout',
    );
    if (!chatResp.ok) {
      console.error('OCR chat completion failed:', await chatResp.text());
      return null;
    }
    const result = await chatResp.json();
    return result.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error('OCR fallback error:', error);
    return null;
  } finally {
    if (uploadedFileId) {
      try {
        await fetch(`https://api.openai.com/v1/files/${uploadedFileId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${openAIApiKey}` },
        });
      } catch (cleanupErr) {
        console.warn('OCR file cleanup failed:', cleanupErr);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let tempFileName: string | undefined;
  
  try {
    console.warn('Starting comprehensive document analysis...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    
    if (!authHeader) {
      return new Response('Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    console.warn(`Starting document analysis for user: ${user.id}`);

    // Get request data
    const { filePath } = await req.json() as DocumentAnalysisRequest;

    if (!filePath || typeof filePath !== 'string') {
      return new Response('Invalid file path', { status: 400, headers: corsHeaders });
    }

    // Path validation: o cliente (src/services/licenses.ts) sempre sobe em
    // `${companyId}/_temp/...`. Como esta edge function usa service_role
    // (bypassa RLS), sem validação um usuário autenticado poderia passar
    // qualquer path e baixar arquivo de outra empresa. Resolvemos o
    // company_id do user via profiles e exigimos que filePath começe com
    // `${company_id}/_temp/`.
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      console.error('Profile lookup failed:', profileError);
      return new Response('User has no company', { status: 403, headers: corsHeaders });
    }

    const expectedPrefix = `${profile.company_id}/_temp/`;
    if (!filePath.startsWith(expectedPrefix)) {
      console.error(
        `Path validation failed: user ${user.id} (company ${profile.company_id}) tentou acessar ${filePath}`,
      );
      return new Response('Forbidden: file path outside your company', {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Generate unique temp filename
    tempFileName = `temp-analysis-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.pdf`;

    console.warn(`Downloading document: ${filePath}`);

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.warn('=== PHASE 1: OPENAI FILES UPLOAD ===');
    
    // Convert blob to form data for OpenAI Files API
    const formData = new FormData();
    formData.append('file', fileData, tempFileName);
    formData.append('purpose', 'assistants');

    console.warn('Uploading PDF to OpenAI Files API...');
    
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
    console.warn(`File uploaded to OpenAI with ID: ${uploadResult.id}`);

    console.warn('=== PHASE 2: AI ANALYSIS WITH FILE_SEARCH ===');

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
    console.warn(`Assistant created with ID: ${assistant.id}`);

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
    console.warn(`Thread created with ID: ${thread.id}`);

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

    console.warn('Message added to thread with PDF attachment');

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
    console.warn(`Run started with ID: ${run.id}`);

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
      console.warn(`Run status: ${runStatus}`);
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus}`);
    }

    console.warn('=== PHASE 3: RESULT PROCESSING ===');

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
    console.warn(`AI response length: ${aiResponse.length}`);

    // Extract and validate JSON
    let extractedData = extractJsonFromText(aiResponse);
    let usedOcrFallback = false;

    // OCR fallback: se file_search retornou confidence=0 e nenhum campo
    // útil, provavelmente é PDF escaneado. Tenta gpt-4o vision (que tem
    // OCR nativo) com o mesmo prompt antes de devolver vazio.
    const looksEmpty = (extractedData.confidence ?? 0) === 0 ||
      (!extractedData.license_type && !extractedData.license_number && !extractedData.company);
    if (looksEmpty) {
      console.warn('file_search empty — tentando OCR fallback (gpt-4o vision)');
      const fileBytes = new Uint8Array(await (fileData as Blob).arrayBuffer());
      const visionResult = await callVisionWithPdf(
        openaiApiKey,
        fileBytes,
        tempFileName ?? 'document.pdf',
        (fileData as Blob).type || 'application/pdf',
        getEnvironmentalLicensePrompt(),
        90000,
      );
      if (visionResult) {
        try {
          const visionParsed = extractJsonFromText(visionResult);
          if ((visionParsed.confidence ?? 0) > (extractedData.confidence ?? 0)) {
            extractedData = visionParsed;
            extractedData._used_ocr_fallback = true;
            usedOcrFallback = true;
            console.warn('OCR fallback succeeded');
          }
        } catch (parseErr) {
          console.warn('OCR fallback returned invalid JSON:', parseErr);
        }
      }
    }
    
    // Post-process dates
    if (extractedData.issue_date && !extractedData.issue_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.issue_date = parseDate(extractedData.issue_date);
    }
    if (extractedData.valid_from && !extractedData.valid_from.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.valid_from = parseDate(extractedData.valid_from);
    }
    if (extractedData.valid_until && !extractedData.valid_until.match(/^\d{4}-\d{2}-\d{2}$/)) {
      extractedData.valid_until = parseDate(extractedData.valid_until, 'last');
    }

    // Calculate final confidence and processing time
    const processingTime = Date.now() - startTime;
    const confidence = Math.round((extractedData.confidence || 0) * 100);
    
    console.warn(`Analysis completed: confidence=${confidence}%, processing_time=${processingTime}ms`);

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

      console.warn('OpenAI resources cleaned up');
    } catch (cleanupError) {
      console.error('Failed to cleanup OpenAI resources:', cleanupError);
    }

    // Return results
    const response = {
      success: true,
      data: extractedData,
      confidence: confidence,
      processing_time_ms: processingTime,
      analysis_method: usedOcrFallback ? 'openai_vision_ocr' : 'openai_files_api',
      used_ocr_fallback: usedOcrFallback,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in license-document-analyzer function:', error);
    
    const processingTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error),
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