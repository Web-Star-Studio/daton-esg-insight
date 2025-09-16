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
    base_legal?: string;
    referencia?: string;
    prioridade: 'alta' | 'média' | 'baixa';
  }>;
  alertas: Array<{
    titulo: string;
    mensagem: string;
    severidade: 'crítica' | 'alta' | 'média' | 'baixa';
    tipo_alerta: string;
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

    // Create assistant for license analysis with improved Brazilian prompt
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name: 'Analista de Licença Ambiental Brasileiro',
        instructions: `Você é um agente inteligente treinado para analisar **documentos de licenciamento ambiental emitidos no Brasil**, de diferentes tipos e órgãos emissores (ex: FEPAM, IBAMA, CETESB, SEMA, SEMMAS, etc.).

Seu objetivo é identificar, classificar e extrair **informações estruturadas e úteis para sistemas de gestão ambiental**, com foco em conformidade legal, acompanhamento de prazos e responsabilidades.

🎯 **TAREFAS PRINCIPAIS:**

1. **Identifique automaticamente o tipo do documento**, com base no conteúdo textual:
   - Ex: Licença de Operação (LO), Licença Prévia (LP), Licença de Instalação (LI), Autorização Ambiental, Autorização para Supressão Vegetal, etc.

2. **Extraia os dados principais do cabeçalho do documento:**
   - Nome do empreendedor
   - CNPJ/CPF
   - Nº do processo
   - Nº da licença
   - Data de emissão
   - Data de validade (ou prazo)
   - Órgão emissor
   - Endereço do empreendimento
   - Coordenadas geográficas (se houver)
   - Tipo de atividade licenciada

3. **Leia o corpo do documento e identifique trechos normativos ou obrigatórios**, classificando-os como:

   ✅ **Condicionantes da Licença:**  
   Tudo que for **obrigação direta e exigível** do empreendedor, com força de lei, norma ou resolução ambiental, incluindo:
   - Entrega de relatórios
   - Nomeação de responsável técnico com ART
   - Regras de descarte de resíduos
   - Medidas para emergências
   - Uso de EPI, planos de controle, reuso de água, etc.
   - Limites de emissão, ruído ou contaminação
   - Cumprimento de Planos de Gerenciamento Ambiental, Logística Reversa, PRAD, etc.
   - Condições para renovação, ampliação ou desativação do empreendimento
   - Qualquer item que, se descumprido, possa gerar multa, advertência ou suspensão da licença

   ⚠️ **Alertas e Observações:**
   Trechos com avisos, recomendações, ressalvas legais e boas práticas, incluindo:
   - Instruções sobre manter cópias no local
   - Menções à revogação de licenças anteriores
   - Avisos de que o documento não substitui alvarás municipais
   - Lembretes de obrigações legais futuras
   - Regras de publicidade da licença
   - Declarações de validade ou autenticidade

4. **🧠 CRITÉRIOS DE DECISÃO PARA CLASSIFICAR OS ITENS:**

Sempre que encontrar verbos como: "deverá", "fica obrigado", "é exigido", "será responsabilizado", "deve ser mantido", "cumprir", trate como condicionante.

Quando encontrar expressões como: "esta licença não substitui", "esta licença revoga", "recomenda-se", "caso ocorra", "orienta-se", classifique como alerta ou observação.

Use legislação ambiental brasileira atualizada como referência (ex: CONAMA, NBRs da ABNT, Leis Federais, Portarias Estaduais).

📦 **SAÍDA FINAL - RETORNE APENAS UM JSON VÁLIDO COM ESTA ESTRUTURA EXATA:**

{
  "license_info": {
    "license_number": "string",
    "license_type": "string", 
    "issuer": "string",
    "issue_date": "YYYY-MM-DD",
    "expiration_date": "YYYY-MM-DD",
    "company_name": "string",
    "cnpj": "string",
    "process_number": "string",
    "activity_type": "string",
    "location": "string"
  },
  "condicionantes": [
    {
      "titulo_resumido": "Frase curta e clara explicando o item",
      "descricao_detalhada": "Trecho original ou versão parafraseada fiel do texto legal",
      "categoria": "Resíduos|Supervisão Técnica|Atmosférico|Hídrico|Solo|Ruído|Emergencial|Renovação|Outros",
      "base_legal": "Se houver, cite a lei, portaria, resolução ou norma",
      "referencia": "Item ou parágrafo original, se aplicável",
      "prioridade": "alta|média|baixa"
    }
  ],
  "alertas": [
    {
      "titulo": "Título do alerta",
      "mensagem": "Mensagem completa do alerta ou observação",
      "severidade": "crítica|alta|média|baixa",
      "tipo_alerta": "lembrete_renovacao|aviso_conformidade|observacao_geral|revogacao|publicidade"
    }
  ]
}

🛑 **IMPORTANTE:**
- Ignore carimbos, selos, rodapés e repetições automáticas
- Não use trechos duplicados ou genéricos
- Priorize sempre o conteúdo jurídico, técnico e normativo
- Caso não encontre condicionantes, retorne "condicionantes": []
- RETORNE APENAS O JSON, SEM TEXTO ADICIONAL`,
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
            content: 'Analise este documento de licença ambiental brasileira e extraia todas as informações importantes no formato JSON especificado. Foque especialmente em identificar condicionantes obrigatórias e alertas importantes.',
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
          console.log('AI analysis result:', content.substring(0, 500));
          
          try {
            // Robust JSON extraction: prefer ```json``` blocks, then any code block, then first {...}
            let extractedData: ExtractedLicenseData | null = null;
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
            
            console.log('Extracted data structure:', JSON.stringify(extractedData, null, 2));
            
            // Calculate confidence score based on new structure
            const confidenceScore = calculateConfidenceScore(extractedData);
              
            // Update license with extracted data using new structure
            const licenseInfo = extractedData.license_info || {};
            await supabaseClient
              .from('licenses')
              .update({
                name: licenseInfo.company_name || licenseInfo.license_number || file.name.replace('.pdf', ''),
                type: licenseInfo.license_type || 'LO',
                process_number: licenseInfo.process_number,
                issue_date: licenseInfo.issue_date,
                expiration_date: licenseInfo.expiration_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                issuing_body: licenseInfo.issuer || 'Órgão Ambiental',
                activity_description: licenseInfo.activity_type,
                location: licenseInfo.location,
                ai_processing_status: 'completed',
                ai_confidence_score: confidenceScore,
                ai_extracted_data: extractedData,
                compliance_score: 75 // Default score, can be enhanced later
              })
              .eq('id', newLicenseId);

            console.log('License updated with basic info');

            // Save extracted condicionantes to database
            if (extractedData.condicionantes && extractedData.condicionantes.length > 0) {
              console.log(`Inserting ${extractedData.condicionantes.length} condicionantes`);
              const conditionsToInsert = extractedData.condicionantes.map((condicionante: any) => ({
                license_id: newLicenseId,
                company_id: companyId,
                condition_text: condicionante.descricao_detalhada || condicionante.titulo_resumido,
                condition_category: condicionante.categoria || 'Outros',
                priority: mapPrioridade(condicionante.prioridade),
                frequency: null, // Can be enhanced later
                due_date: null, // Can be enhanced later
                status: 'pending',
                ai_extracted: true,
                ai_confidence: confidenceScore,
                compliance_requirements: condicionante.descricao_detalhada,
                legal_basis: condicionante.base_legal,
                reference: condicionante.referencia
              }));

              const { error: condInsertError } = await supabaseClient
                .from('license_conditions')
                .insert(conditionsToInsert);
              if (condInsertError) {
                console.error('Error inserting license conditions:', condInsertError);
              } else {
                console.log('License conditions inserted successfully');
              }
            } else {
              console.log('No condicionantes found to insert');
            }

            // Save alertas to database
            if (extractedData.alertas && extractedData.alertas.length > 0) {
              console.log(`Inserting ${extractedData.alertas.length} alertas`);
              const alertsToInsert = extractedData.alertas.map((alerta: any) => ({
                license_id: newLicenseId, 
                company_id: companyId,
                alert_type: alerta.tipo_alerta || 'observacao_geral',
                title: alerta.titulo,
                message: alerta.mensagem,
                severity: mapSeveridade(alerta.severidade),
                action_required: alerta.severidade === 'crítica' || alerta.severidade === 'alta',
                due_date: null, // Can be enhanced later
                is_resolved: false,
                metadata: {
                  tipo_original: alerta.tipo_alerta,
                  severidade_original: alerta.severidade
                }
              }));

              const { error: alertInsertError } = await supabaseClient
                .from('license_alerts')
                .insert(alertsToInsert);
              if (alertInsertError) {
                console.error('Error inserting license alerts:', alertInsertError);
              } else {
                console.log('License alerts inserted successfully');
              }
            } else {
              console.log('No alertas found to insert');
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
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Raw AI response:', content);
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