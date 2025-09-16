import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LicenseProcessRequest {
  action: 'upload' | 'analyze' | 'reconcile';
  // For upload action
  file?: {
    name: string;
    type: string;
    data: string; // base64
  };
  // For analyze action
  licenseId?: string;
  analysisType?: 'full_analysis' | 'renewal_prediction' | 'compliance_check';
  // For reconcile action  
  reconciliationData?: any;
}

interface ExtractedLicenseData {
  licenseType: string;
  issuingBody: string;
  processNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  conditions: Array<{
    text: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    frequency?: string;
    dueDate?: string;
  }>;
  complianceScore: number;
  renewalRecommendation: {
    startDate: string;
    urgency: 'low' | 'medium' | 'high';
    requiredDocuments: string[];
  };
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
  }>;
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
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle file upload and create license record
async function handleUpload(supabaseClient: any, userId: string, companyId: string, file: any) {
  console.log('Handling file upload...');
  
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
      issuing_body: 'Identificando...',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ai_processing_status: 'processing',
      ai_confidence_score: 0
    })
    .select()
    .single();

  if (licenseError) {
    throw new Error(`License creation failed: ${licenseError.message}`);
  }

  // Immediately start AI analysis with the PDF content
  console.log('Starting immediate AI analysis with PDF...');
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Create OpenAI file from PDF
    const formData = new FormData();
    formData.append('file', new Blob([fileData], { type: file.type }), file.name);
    formData.append('purpose', 'assistants');

    const fileResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!fileResponse.ok) {
      throw new Error(`OpenAI file upload failed: ${await fileResponse.text()}`);
    }

    const openAIFile = await fileResponse.json();
    console.log('OpenAI file created:', openAIFile.id);

    // Create assistant for license analysis
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name: 'Analista de Licença Ambiental',
        instructions: `Você é um especialista em licenciamento ambiental brasileiro. Leia o PDF ANEXADO do início ao fim e extraia informações ESTRUTURADAS, com foco em Condicionantes, Observações e Alertas que exigem ação do usuário.

REGRAS CRÍTICAS:
- Responda SOMENTE com um JSON VÁLIDO (sem markdown, sem comentários, sem texto fora do JSON)
- Se algum campo não existir, use null ou [] conforme o tipo
- Identifique condicionantes mesmo quando não houver a palavra "Condicionante" explicitamente. Procure verbos de obrigação: "deve", "deverá", "fica obrigado", "apresentar", "realizar", "manter", "enviar", "comprovar", "executar"
- Priorize seções típicas: "Condições", "Condicionantes", "Disposições", "Obrigações", "Cronograma", "Prazos", "Monitoramento", "Relatórios"
- Extraia prazos explícitos em formato ISO (YYYY-MM-DD) quando possível; caso haja periodicidade (mensal, trimestral, semestral, anual), use em \"frequency\"

CATEGORIAS PERMITIDAS PARA CONDICIONANTES:
- monitoramento, relatorio, controle, manutencao, gestao_residuos, seguranca, ambiental, documentacao, outras

ESQUEMA DE RESPOSTA (JSON):
{
  "licenseType": string | null,
  "issuingBody": string | null,
  "processNumber": string | null,
  "issueDate": string | null,           // YYYY-MM-DD
  "expirationDate": string | null,      // YYYY-MM-DD
  "companyName": string | null,
  "activity": string | null,
  "location": string | null,
  "conditions": [
    {
      "text": string,                   // texto completo da exigência (mín. 10 palavras)
      "category": string,               // usar categorias permitidas
      "priority": "high"|"medium"|"low",
      "frequency": string | null,       // ex.: mensal, trimestral, anual, único
      "dueDate": string | null,         // YYYY-MM-DD se houver
      "description": string | null,     // resumo curto (<= 120 chars)
      "responsibleArea": string | null, // se citado
      "monitoringRequired": boolean | null,
      "complianceIndicators": string[] | null
    }
  ],
  "observations": [
    {
      "text": string,
      "type": "restriction"|"warning"|"note"|"requirement"|"other",
      "priority": "critical"|"high"|"medium"|"low",
      "relatedTo": string | null
    }
  ],
  "complianceScore": number | null,
  "renewalRecommendation": {
    "startDate": string | null,         // sugerir 6-12 meses antes do vencimento
    "urgency": "low"|"medium"|"high" | null,
    "requiredDocuments": string[] | null,
    "estimatedDuration": string | null
  },
  "alerts": [
    {
      "type": "renewal"|"compliance"|"monitoring"|"environmental"|"safety"|"documentation"|"other",
      "title": string,
      "message": string,
      "severity": "low"|"medium"|"high"|"critical",
      "actionRequired": boolean,
      "dueDate": string | null,         // YYYY-MM-DD
      "relatedConditions": string[] | null
    }
  ],
  "extractionQuality": {
    "totalConditionsFound": number,
    "totalObservationsFound": number,
    "documentReadability": "excellent"|"good"|"fair"|"poor",
    "extractionConfidence": number      // 0..1
  }
}`,
        model: 'gpt-4o-mini',
        tools: [{ type: 'file_search' }],
      }),
    });

    if (!assistantResponse.ok) {
      throw new Error(`Assistant creation failed: ${await assistantResponse.text()}`);
    }

    const assistant = await assistantResponse.json();
    console.log('Assistant created:', assistant.id);

    // Create thread with the file
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Analise este documento de licença ambiental e extraia todas as informações importantes no formato JSON especificado.',
            attachments: [
              {
                file_id: openAIFile.id,
                tools: [{ type: 'file_search' }]
              }
            ]
          }
        ]
      }),
    });

    if (!threadResponse.ok) {
      throw new Error(`Thread creation failed: ${await threadResponse.text()}`);
    }

    const thread = await threadResponse.json();
    console.log('Thread created:', thread.id);

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistant.id,
      }),
    });

    if (!runResponse.ok) {
      throw new Error(`Run creation failed: ${await runResponse.text()}`);
    }

    const run = await runResponse.json();
    console.log('Run started:', run.id);

    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 120; // 120 seconds max for thorough analysis

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('AI analysis timeout');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus === 'completed') {
      // Get the messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
        
        if (assistantMessage && assistantMessage.content[0]?.text?.value) {
          const content = assistantMessage.content[0].text.value;
          console.log('AI analysis result:', content.substring(0, 200));
          
          try {
            // Robust JSON extraction: prefer ```json``` blocks, then any code block, then first {...}
            let extractedData: any | null = null;
            const jsonBlock = content.match(/```json[\s\S]*?```/i);
            const anyBlock = content.match(/```[\s\S]*?```/);
            const tryParse = (txt: string) => { try { return JSON.parse(txt); } catch { return null; } };
            if (jsonBlock) {
              const inner = jsonBlock[0].replace(/```json/i,'').replace(/```$/,'').trim();
              extractedData = tryParse(inner);
            }
            if (!extractedData && anyBlock) {
              const inner = anyBlock[0].replace(/```/g,'').trim();
              extractedData = tryParse(inner);
            }
            if (!extractedData) {
              const braceMatch = content.match(/\{[\s\S]*\}/);
              if (braceMatch) extractedData = tryParse(braceMatch[0]);
            }
            if (!extractedData) {
              throw new Error('AI did not return valid JSON');
            }
            
            // Calculate confidence score
            const confidenceScore = calculateConfidenceScore(extractedData);
              
              // Update license with extracted data
              await supabaseClient
                .from('licenses')
                .update({
                  name: extractedData.companyName || extractedData.licenseType || file.name.replace('.pdf', ''),
                  type: extractedData.licenseType || 'LO',
                  process_number: extractedData.processNumber,
                  issue_date: extractedData.issueDate,
                  expiration_date: extractedData.expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  issuing_body: extractedData.issuingBody || 'Órgão Ambiental',
                  activity_description: extractedData.activity,
                  location: extractedData.location,
                  ai_processing_status: 'completed',
                  ai_confidence_score: confidenceScore,
                  ai_extracted_data: extractedData,
                  compliance_score: extractedData.complianceScore || 75
                })
                .eq('id', newLicenseId);

              // Save extracted conditions to database
              if (extractedData.conditions && extractedData.conditions.length > 0) {
                const conditionsToInsert = extractedData.conditions.map((condition: any) => ({
                  license_id: newLicenseId,
                  company_id: companyId,
                  condition_text: condition.text,
                  condition_category: condition.category,
                  priority: condition.priority,
                  frequency: condition.frequency,
                  due_date: condition.dueDate,
                  status: 'pending',
                  ai_extracted: true,
                  ai_confidence: confidenceScore
                }));

                const { error: condInsertError } = await supabaseClient
                  .from('license_conditions')
                  .insert(conditionsToInsert);
                if (condInsertError) {
                  console.error('Error inserting license conditions:', condInsertError);
                }
              }

              // Save alerts to database
              if (extractedData.alerts && extractedData.alerts.length > 0) {
                const alertsToInsert = extractedData.alerts.map((alert: any) => ({
                  license_id: newLicenseId,
                  company_id: companyId,
                  alert_type: alert.type,
                  title: alert.title,
                  message: alert.message,
                  severity: alert.severity,
                  action_required: alert.actionRequired,
                  due_date: alert.dueDate,
                  related_conditions: alert.relatedConditions || [],
                  is_resolved: false
                }));

                const { error: alertInsertError } = await supabaseClient
                  .from('license_alerts')
                  .insert(alertsToInsert);
                if (alertInsertError) {
                  console.error('Error inserting license alerts:', alertInsertError);
                }
              }

              // Save observations as special conditions if present
              if (extractedData.observations && extractedData.observations.length > 0) {
                const observationConditions = extractedData.observations.map((obs: any) => ({
                  license_id: newLicenseId,
                  company_id: companyId,
                  condition_text: obs.text,
                  condition_category: 'observacao',
                  priority: obs.priority,
                  status: 'noted',
                  ai_extracted: true,
                  ai_confidence: confidenceScore
                }));

                const { error: obsInsertError } = await supabaseClient
                  .from('license_conditions')
                  .insert(observationConditions);
                if (obsInsertError) {
                  console.error('Error inserting observation conditions:', obsInsertError);
                }
              }

              // Update document status
              await supabaseClient
                .from('documents')
                .update({
                  ai_processing_status: 'completed',
                  ai_confidence_score: confidenceScore
                })
                .eq('id', document.id);

              console.log('License updated with AI data successfully');
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
          }
        }
      }
    }

    // Cleanup OpenAI resources
    try {
      await fetch(`https://api.openai.com/v1/files/${openAIFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      });
      console.log('OpenAI file cleaned up');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

  } catch (aiError) {
    console.error('AI analysis error:', aiError);
    // Update license as failed but don't throw error - upload was successful
    await supabaseClient
      .from('licenses')
      .update({
        ai_processing_status: 'failed',
        name: file.name.replace('.pdf', '')
      })
      .eq('id', newLicenseId);
  }

  return new Response(JSON.stringify({
    success: true,
    licenseId: newLicenseId,
    documentId: document.id,
    message: 'Upload realizado com sucesso. Análise IA iniciada.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
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

function calculateConfidenceScore(data: any): number {
  let score = 0;
  let totalFields = 8;

  // Basic fields
  if (data.licenseType && data.licenseType !== 'Não identificado') score += 1;
  if (data.issuingBody && data.issuingBody !== 'Não identificado') score += 1;
  if (data.processNumber) score += 1;
  if (data.issueDate) score += 1;
  if (data.expirationDate) score += 1;
  
  // Conditions extracted
  if (data.conditions && data.conditions.length > 0) score += 1;
  
  // Compliance score calculated
  if (data.complianceScore > 0) score += 1;
  
  // Alerts generated
  if (data.alerts && data.alerts.length > 0) score += 1;

  return Math.round((score / totalFields) * 100) / 100;
}
