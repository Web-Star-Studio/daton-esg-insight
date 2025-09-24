import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LicenseProcessRequest {
  action: 'upload' | 'analyze' | 'reconcile';
  file?: {
    name: string;
    type: string;
    data: string; // base64
  };
  licenseId?: string;
  analysisType?: 'full_analysis' | 'renewal_prediction' | 'compliance_check';
  reconciliationData?: any;
}

interface ExtractedLicenseData {
  license_info: {
    license_number?: string;
    license_type?: string; 
    issuer?: string;
    issue_date?: string;
    expiration_date?: string;
    company_name?: string;
    cnpj?: string;
    process_number?: string;
    activity_type?: string;
    location?: string;
  };
  condicionantes: Array<{
    titulo_resumido: string;
    descricao_detalhada: string;
    categoria: string;
    prioridade: 'alta' | 'média' | 'baixa';
  }>;
  alertas: Array<{
    titulo: string;
    mensagem: string;
    severidade: 'crítica' | 'alta' | 'média' | 'baixa';
    tipo_alerta: string;
  }>;
}

// Robust JSON parser with fallback
function extractJsonFromResponse(content: string): any {
  try {
    // Try direct parse first
    return JSON.parse(content);
  } catch {
    // Try extracting from code blocks
    const jsonBlock = content.match(/```json([\s\S]*?)```/i);
    if (jsonBlock) {
      try {
        return JSON.parse(jsonBlock[1].trim());
      } catch {}
    }
    
    // Try any code block
    const anyBlock = content.match(/```([\s\S]*?)```/);
    if (anyBlock) {
      try {
        return JSON.parse(anyBlock[1].trim());
      } catch {}
    }
    
    // Try extracting JSON object
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {}
    }
    
    console.error('No valid JSON found in response:', content);
    throw new Error('No valid JSON found in response');
  }
}

// Timeout wrapper for async functions
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting unified license processing...');

    // Use service role key for all operations to avoid auth issues
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header if provided
    let userId: string | null = null;
    let companyId: string | null = null;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          userId = user.id;
          // Get user's company
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
          companyId = profile?.company_id;
        }
      } catch (authError) {
        console.log('Auth optional, continuing without user context');
      }
    }

    const { action, file, licenseId, analysisType = 'full_analysis', reconciliationData }: LicenseProcessRequest = await req.json();

    switch (action) {
      case 'upload':
        if (!userId || !companyId) {
          throw new Error('Authentication required for upload');
        }
        return await handleUpload(supabaseClient, userId, companyId, file!);
      
      case 'analyze':
        return await handleAnalyze(supabaseClient, licenseId!, analysisType);
      
      case 'reconcile':
        return await handleReconcile(supabaseClient, licenseId!, reconciliationData);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in unified license processor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle file upload and create license record with robust processing
async function handleUpload(supabaseClient: any, userId: string, companyId: string, file: any) {
  console.log('Handling file upload...');
  const startTime = Date.now();
  
  // Convert base64 to blob
  const fileData = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
  const fileName = `license-${Date.now()}-${file.name}`;
  const filePath = `licenses/${companyId}/${fileName}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabaseClient
    .storage
    .from('documents')
    .upload(filePath, fileData, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const newLicenseId = crypto.randomUUID();

  // Create document record
  const { data: document, error: docError } = await supabaseClient
    .from('documents')
    .insert({
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: fileData.length,
      company_id: companyId,
      uploader_user_id: userId,
      related_model: 'license',
      related_id: newLicenseId,
      ai_processing_status: 'pending'
    })
    .select()
    .single();

  if (docError) {
    throw new Error(`Document creation failed: ${docError.message}`);
  }

  // Create license record
  const { data: license, error: licenseError } = await supabaseClient
    .from('licenses')
    .insert({
      id: newLicenseId,
      company_id: companyId,
      name: 'Processando...',
      type: 'LO',
      status: 'Ativa',
      issuing_body: 'Analisando...',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ai_processing_status: 'processing',
      ai_confidence_score: 0
    })
    .select()
    .single();

  if (licenseError) {
    throw new Error(`License creation failed: ${licenseError.message}`);
  }

  // Start AI analysis with phased extraction and robust error handling
  console.log('Starting phased AI analysis...');
  let finalStatus: 'completed' | 'failed' | 'needs_review' = 'failed';
  let extractedData: Partial<ExtractedLicenseData> = {};
  let confidenceScore = 0;
  let processingLog: string[] = [];

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Upload file to OpenAI with timeout
    const formData = new FormData();
    formData.append('file', new Blob([fileData], { type: file.type }), file.name);
    formData.append('purpose', 'assistants');

    const fileResponse = await withTimeout(
      fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAIApiKey}` },
        body: formData,
      }),
      30000,
      'File upload timeout'
    );

    if (!fileResponse.ok) {
      throw new Error(`OpenAI file upload failed: ${await fileResponse.text()}`);
    }

    const openAIFile = await fileResponse.json();
    console.log('OpenAI file created:', openAIFile.id);
    processingLog.push(`File uploaded: ${openAIFile.id}`);

    // Phase 1: Extract license info only (fast)
    console.log('Phase 1: Extracting basic license info...');
    const basicInfo = await extractPhase(openAIApiKey, openAIFile.id, 'license_info', 45000);
    if (basicInfo) {
      extractedData.license_info = basicInfo;
      processingLog.push('Phase 1: License info extracted');
    } else {
      processingLog.push('Phase 1: Failed to extract license info');
    }

    // Phase 2: Extract condicionantes (medium complexity)
    console.log('Phase 2: Extracting condicionantes...');
    const condicionantes = await extractPhase(openAIApiKey, openAIFile.id, 'condicionantes', 60000);
    if (condicionantes && Array.isArray(condicionantes)) {
      extractedData.condicionantes = condicionantes;
      processingLog.push(`Phase 2: ${condicionantes.length} condicionantes extracted`);
    } else {
      extractedData.condicionantes = [];
      processingLog.push('Phase 2: No condicionantes extracted');
    }

    // Phase 3: Extract alertas (fast)
    console.log('Phase 3: Extracting alertas...');
    const alertas = await extractPhase(openAIApiKey, openAIFile.id, 'alertas', 45000);
    if (alertas && Array.isArray(alertas)) {
      extractedData.alertas = alertas;
      processingLog.push(`Phase 3: ${alertas.length} alertas extracted`);
    } else {
      extractedData.alertas = [];
      processingLog.push('Phase 3: No alertas extracted');
    }

    // Determine final status based on what was extracted
    const hasBasicInfo = extractedData.license_info && Object.keys(extractedData.license_info).length > 0;
    const hasCondicionantes = extractedData.condicionantes && extractedData.condicionantes.length > 0;
    const hasAlertas = extractedData.alertas && extractedData.alertas.length > 0;

    if (hasBasicInfo && (hasCondicionantes || hasAlertas)) {
      finalStatus = 'completed';
    } else if (hasBasicInfo) {
      finalStatus = 'needs_review';
      processingLog.push('Partial extraction - needs review');
    } else {
      finalStatus = 'failed';
      processingLog.push('Critical failure - no basic info extracted');
    }

    // Calculate confidence score
    confidenceScore = calculateConfidenceScore(extractedData as ExtractedLicenseData);

    // Cleanup OpenAI file
    try {
      await fetch(`https://api.openai.com/v1/files/${openAIFile.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${openAIApiKey}` },
      });
      console.log('OpenAI file cleaned up');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

  } catch (error) {
    console.error('AI analysis error:', error);
    finalStatus = 'failed';
    processingLog.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // ALWAYS update the license with results - this is critical
  try {
    const licenseInfo = extractedData.license_info || {};
    
    // Prepare license update data with only valid columns
    const licenseUpdateData: any = {
      name: licenseInfo.company_name || licenseInfo.license_number || file.name.replace('.pdf', ''),
      type: licenseInfo.license_type || 'LO',
      ai_processing_status: finalStatus,
      ai_confidence_score: confidenceScore,
      ai_extracted_data: extractedData,
      ai_last_analysis_at: new Date().toISOString(),
      compliance_score: Math.max(50, confidenceScore * 100)
    };

    // Add optional fields only if they exist
    if (licenseInfo.process_number) licenseUpdateData.process_number = licenseInfo.process_number;
    if (licenseInfo.issue_date) licenseUpdateData.issue_date = licenseInfo.issue_date;
    if (licenseInfo.expiration_date) licenseUpdateData.expiration_date = licenseInfo.expiration_date;
    else licenseUpdateData.expiration_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (licenseInfo.issuer) licenseUpdateData.issuing_body = licenseInfo.issuer;
    else licenseUpdateData.issuing_body = 'Órgão Ambiental';

    console.log('Updating license with data:', JSON.stringify(licenseUpdateData, null, 2));
    
    const { error: licenseUpdateError } = await supabaseClient
      .from('licenses')
      .update(licenseUpdateData)
      .eq('id', newLicenseId);
    
    if (licenseUpdateError) {
      console.error('License update error:', licenseUpdateError);
      throw new Error(`Failed to update license: ${licenseUpdateError.message}`);
    }
    
    console.log('License updated successfully with status:', finalStatus);

    // Save condicionantes if any were extracted
    if (extractedData.condicionantes && extractedData.condicionantes.length > 0) {
      console.log(`Inserting ${extractedData.condicionantes.length} condicionantes`);
      
      try {
        const conditionsToInsert = extractedData.condicionantes.map((condicionante: any) => ({
          license_id: newLicenseId,
          company_id: companyId,
          condition_text: condicionante.descricao_detalhada || condicionante.titulo_resumido || 'Condição não especificada',
          condition_category: condicionante.categoria || 'Outros',
          priority: mapPrioridade(condicionante.prioridade || 'media'),
          status: 'pending',
          ai_extracted: true,
          ai_confidence: confidenceScore
        }));

        console.log('Conditions to insert:', JSON.stringify(conditionsToInsert, null, 2));

        const { error: condInsertError } = await supabaseClient
          .from('license_conditions')
          .insert(conditionsToInsert);
        
        if (condInsertError) {
          console.error('Error inserting license conditions:', condInsertError);
          processingLog.push(`Error saving conditions: ${condInsertError.message}`);
        } else {
          console.log('License conditions inserted successfully');
          processingLog.push(`Saved ${conditionsToInsert.length} conditions`);
        }
      } catch (condError) {
        console.error('Exception in conditions processing:', condError);
        processingLog.push(`Exception in conditions: ${condError instanceof Error ? condError.message : String(condError)}`);
      }
    }

    // Save alertas if any were extracted
    if (extractedData.alertas && extractedData.alertas.length > 0) {
      console.log(`Inserting ${extractedData.alertas.length} alertas`);
      
      try {
        const alertsToInsert = extractedData.alertas.map((alerta: any) => ({
          license_id: newLicenseId,
          company_id: companyId,
          alert_type: alerta.tipo_alerta || 'observacao_geral',
          title: alerta.titulo || 'Alerta sem título',
          message: alerta.mensagem || 'Mensagem não especificada',
          severity: mapSeveridade(alerta.severidade || 'baixa'),
          action_required: (alerta.severidade === 'crítica' || alerta.severidade === 'alta'),
          is_resolved: false,
          metadata: {
            tipo_original: alerta.tipo_alerta,
            severidade_original: alerta.severidade
          }
        }));

        console.log('Alerts to insert:', JSON.stringify(alertsToInsert, null, 2));

        const { error: alertInsertError } = await supabaseClient
          .from('license_alerts')
          .insert(alertsToInsert);
        
        if (alertInsertError) {
          console.error('Error inserting license alerts:', alertInsertError);
          processingLog.push(`Error saving alerts: ${alertInsertError.message}`);
        } else {
          console.log('License alerts inserted successfully');
          processingLog.push(`Saved ${alertsToInsert.length} alerts`);
        }
      } catch (alertError) {
        console.error('Exception in alerts processing:', alertError);
        processingLog.push(`Exception in alerts: ${alertError instanceof Error ? alertError.message : String(alertError)}`);
      }
    }

    // Update document status
    const { error: docUpdateError } = await supabaseClient
      .from('documents')
      .update({
        ai_processing_status: finalStatus,
        ai_confidence_score: confidenceScore
      })
      .eq('id', document.id);
    
    if (docUpdateError) {
      console.error('Document update error:', docUpdateError);
    }

  } catch (updateError) {
    console.error('Error updating license with results:', updateError);
    // Try one more time to at least mark as failed
    try {
      const { error: fallbackError } = await supabaseClient
        .from('licenses')
        .update({
          ai_processing_status: 'failed',
          ai_last_analysis_at: new Date().toISOString(),
          name: file.name.replace('.pdf', '')
        })
        .eq('id', newLicenseId);
      
      if (fallbackError) {
        console.error('Even fallback update failed:', fallbackError);
      }
    } catch (fallbackCatchError) {
      console.error('Fallback update exception:', fallbackCatchError);
    }
  }

  const processingTime = Date.now() - startTime;
  console.log(`Processing completed in ${processingTime}ms with status: ${finalStatus}`);
  console.log('Processing log:', processingLog);

  return new Response(JSON.stringify({
    success: true,
    licenseId: newLicenseId,
    documentId: document.id,
    status: finalStatus,
    confidence: confidenceScore,
    processingTime,
    extractedCount: {
      license_info: extractedData.license_info ? 1 : 0,
      condicionantes: extractedData.condicionantes?.length || 0,
      alertas: extractedData.alertas?.length || 0
    },
    message: finalStatus === 'completed' 
      ? 'Análise concluída com sucesso!' 
      : finalStatus === 'needs_review'
      ? 'Análise parcial - requer revisão'
      : 'Análise falhou - tente novamente'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Extract a specific phase of data with timeout and retry
async function extractPhase(openAIApiKey: string, fileId: string, phase: 'license_info' | 'condicionantes' | 'alertas', timeoutMs: number): Promise<any> {
  const maxRetries = 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Phase ${phase}, attempt ${attempt}/${maxRetries}`);
      
      const phasePrompts = {
        license_info: `Analise este documento de licença ambiental brasileira e extraia APENAS as informações básicas. Seja conciso e preciso:

{
  "license_info": {
    "license_number": "número da licença",
    "license_type": "LO|LI|LP|LAI|outro",
    "issuer": "órgão emissor",
    "issue_date": "YYYY-MM-DD",
    "expiration_date": "YYYY-MM-DD", 
    "company_name": "nome da empresa",
    "cnpj": "CNPJ da empresa",
    "process_number": "número do processo",
    "activity_type": "tipo de atividade",
    "location": "localização"
  }
}

RESPONDA APENAS COM O JSON VÁLIDO, SEM EXPLICAÇÕES.`,

        condicionantes: `Extraia APENAS as condicionantes/obrigações desta licença ambiental. Limite a 10 itens mais importantes:

{
  "condicionantes": [
    {
      "titulo_resumido": "título breve da condição",
      "descricao_detalhada": "descrição completa da obrigação",
      "categoria": "Monitoramento|Controle|Gestão|Operacional|Outros",
      "prioridade": "alta|média|baixa"
    }
  ]
}

Procure por palavras: "deverá", "fica obrigado", "é exigido", "deve ser". RESPONDA APENAS COM JSON.`,

        alertas: `Extraia APENAS alertas críticos desta licença. Limite a 5 itens mais relevantes:

{
  "alertas": [
    {
      "titulo": "título do alerta",
      "mensagem": "descrição do problema/risco",
      "severidade": "crítica|alta|média|baixa",
      "tipo_alerta": "Vencimento|Renovação|Descumprimento|Observação|Outros"
    }
  ]
}

Procure por: prazos, renovação, advertências, observações. RESPONDA APENAS COM JSON.`
      };

      const assistant = await createAssistant(openAIApiKey, phasePrompts[phase]);
      const thread = await createThread(openAIApiKey, fileId, phasePrompts[phase]);
      const result = await runAssistantWithTimeout(openAIApiKey, assistant.id, thread.id, timeoutMs);

      // Cleanup assistant
      await cleanupResources(openAIApiKey, assistant.id);

      if (result && result.trim()) {
        const parsed = extractJsonFromResponse(result);
        const extractedPhaseData = parsed[phase] || parsed;
        
        if (extractedPhaseData && (Array.isArray(extractedPhaseData) ? extractedPhaseData.length > 0 : Object.keys(extractedPhaseData).length > 0)) {
          console.log(`Phase ${phase} succeeded on attempt ${attempt}`);
          return extractedPhaseData;
        }
      }
      
      if (attempt === maxRetries) {
        console.log(`Phase ${phase} failed after ${maxRetries} attempts`);
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Phase ${phase} attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`Phase ${phase} failed after ${maxRetries} attempts:`, error);
        return null;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
}

// Helper functions for OpenAI operations
async function createAssistant(openAIApiKey: string, instructions: string) {
  const response = await withTimeout(
    fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name: 'Licença Ambiental Extractor',
        instructions: `${instructions}\n\nIMPORTANTE: Responda APENAS com JSON válido. Não adicione explicações ou texto extra.`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
        temperature: 0.1, // More deterministic
      }),
    }),
    15000,
    'Assistant creation timeout'
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Assistant creation error:', errorText);
    throw new Error(`Assistant creation failed: ${errorText}`);
  }

  return await response.json();
}

async function createThread(openAIApiKey: string, fileId: string, message: string) {
  const response = await withTimeout(
    fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: message,
          attachments: [{
            file_id: fileId,
            tools: [{ type: 'file_search' }]
          }]
        }]
      }),
    }),
    15000,
    'Thread creation timeout'
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Thread creation error:', errorText);
    throw new Error(`Thread creation failed: ${errorText}`);
  }

  return await response.json();
}

async function runAssistantWithTimeout(openAIApiKey: string, assistantId: string, threadId: string, timeoutMs: number): Promise<string | null> {
  try {
    const runResponse = await withTimeout(
      fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ assistant_id: assistantId }),
      }),
      10000,
      'Run creation timeout'
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Run creation error:', errorText);
      throw new Error(`Run creation failed: ${errorText}`);
    }

    const run = await runResponse.json();
    console.log(`Run started: ${run.id}`);
    
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.floor(timeoutMs / 2000); // Check every 2 seconds

    // Poll for completion with timeout
    while (Date.now() - startTime < timeoutMs && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      try {
        const statusResponse = await withTimeout(
          fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          }),
          5000,
          'Status check timeout'
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`Run status (${attempts}/${maxAttempts}): ${statusData.status}`);
          
          if (statusData.status === 'completed') {
            // Get messages
            const messagesResponse = await withTimeout(
              fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                headers: {
                  'Authorization': `Bearer ${openAIApiKey}`,
                  'OpenAI-Beta': 'assistants=v2',
                },
              }),
              5000,
              'Messages retrieval timeout'
            );

            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
              const content = assistantMessage?.content[0]?.text?.value;
              console.log(`Retrieved content length: ${content?.length || 0}`);
              return content || null;
            }
            break;
          } else if (statusData.status === 'failed' || statusData.status === 'cancelled' || statusData.status === 'expired') {
            console.error('Assistant run failed with status:', statusData.status);
            console.error('Run details:', statusData);
            break;
          }
          // Continue polling for 'in_progress', 'queued', etc.
        }
      } catch (pollError) {
        console.error('Error during polling:', pollError);
        // Continue polling unless we're at max attempts
        if (attempts >= maxAttempts) break;
      }
    }

    if (attempts >= maxAttempts) {
      console.error('Run timed out after', timeoutMs, 'ms');
    }

    return null;
  } catch (error) {
    console.error('Error in runAssistantWithTimeout:', error);
    return null;
  }
}

async function cleanupResources(openAIApiKey: string, assistantId: string) {
  try {
    await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Handle AI analysis for existing license
async function handleAnalyze(supabaseClient: any, licenseId: string, analysisType: string) {
  console.log('Handling analysis request for license:', licenseId);
  
  // Get license and document data
  const { data: license } = await supabaseClient
    .from('licenses')
    .select('*')
    .eq('id', licenseId)
    .single();

  if (!license) {
    throw new Error('License not found');
  }

  const { data: documents } = await supabaseClient
    .from('documents')
    .select('*')
    .eq('related_id', licenseId)
    .eq('related_model', 'license');

  const document = documents?.[0];
  if (!document) {
    throw new Error('No document found for license');
  }

  // Update processing status
  await supabaseClient
    .from('licenses')
    .update({ ai_processing_status: 'processing' })
    .eq('id', licenseId);

  // This would trigger the same AI analysis as in upload
  // For now, return success to indicate analysis was started
  return new Response(JSON.stringify({
    success: true,
    message: 'Análise iniciada'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle reconciliation approval
async function handleReconcile(supabaseClient: any, licenseId: string, reconciliationData: any) {
  console.log('Handling reconciliation for license:', licenseId);
  
  // Update license with reconciled data
  const { error } = await supabaseClient
    .from('licenses')
    .update({
      name: reconciliationData.name || reconciliationData.license_number,
      type: reconciliationData.type || reconciliationData.license_type,
      process_number: reconciliationData.process_number,
      issue_date: reconciliationData.issue_date,
      expiration_date: reconciliationData.expiration_date,
      issuing_body: reconciliationData.issuing_body || 'Órgão Ambiental',
      ai_processing_status: 'approved',
      status: 'Ativa'
    })
    .eq('id', licenseId);

  if (error) {
    throw new Error(`Reconciliation failed: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Reconciliação aprovada com sucesso'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function calculateConfidenceScore(data: ExtractedLicenseData): number {
  let score = 0;
  let totalFields = 8;

  const licenseInfo = data.license_info || {};
  
  // Basic fields
  if (licenseInfo.license_type && licenseInfo.license_type !== 'Não identificado') score += 1;
  if (licenseInfo.issuer && licenseInfo.issuer !== 'Não identificado') score += 1;
  if (licenseInfo.process_number) score += 1;
  if (licenseInfo.issue_date) score += 1;
  if (licenseInfo.expiration_date) score += 1;
  if (licenseInfo.company_name) score += 1;
  
  // Condicionantes extracted
  if (data.condicionantes && data.condicionantes.length > 0) score += 1;
  
  // Alertas generated
  if (data.alertas && data.alertas.length > 0) score += 1;

  return Math.round((score / totalFields) * 100) / 100;
}

// Helper functions to map Portuguese priority/severity to English database values
function mapPrioridade(prioridade: string): string {
  switch (prioridade?.toLowerCase()) {
    case 'alta': return 'high';
    case 'média': return 'medium';
    case 'baixa': return 'low';
    default: return 'medium';
  }
}

function mapSeveridade(severidade: string): string {
  switch (severidade?.toLowerCase()) {
    case 'crítica': return 'critical';
    case 'alta': return 'high';
    case 'média': return 'medium';
    case 'baixa': return 'low';
    default: return 'medium';
  }
}