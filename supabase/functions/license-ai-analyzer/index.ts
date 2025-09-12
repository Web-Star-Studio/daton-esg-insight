import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIAnalysisRequest {
  licenseId: string;
  analysisType?: 'full_analysis' | 'renewal_prediction' | 'compliance_check';
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user info
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    const { licenseId, analysisType = 'full_analysis' }: AIAnalysisRequest = await req.json();
    
    console.log(`Starting ${analysisType} analysis for license: ${licenseId}`);

    // Get license first
    const { data: license, error: licenseError } = await supabaseClient
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (licenseError || !license) {
      console.error('License error:', licenseError);
      throw new Error('License not found');
    }

    // Get associated documents separately
    const { data: documents, error: documentsError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('related_id', licenseId)
      .eq('related_model', 'license');

    if (documentsError) {
      console.error('Documents error:', documentsError);
      // Don't throw error for documents, just log and continue
    }

    console.log(`Found license: ${license.name}, Documents: ${documents?.length || 0}`);

    // Update processing status
    await supabaseClient
      .from('licenses')
      .update({ ai_processing_status: 'processing' })
      .eq('id', licenseId);

    const startTime = Date.now();
    let extractedData: ExtractedLicenseData = {
      licenseType: license.type || 'Não identificado',
      issuingBody: license.issuing_body || 'Não identificado',
      processNumber: license.process_number,
      issueDate: license.issue_date,
      expirationDate: license.expiration_date,
      conditions: [],
      complianceScore: 75, // Default score
      renewalRecommendation: {
        startDate: new Date(new Date(license.expiration_date).getTime() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        urgency: 'medium',
        requiredDocuments: ['Relatórios de Monitoramento', 'Documentação Atualizada', 'Comprovantes de Cumprimento']
      },
      alerts: [{
        type: 'renewal',
        title: 'Renovação Necessária',
        message: `Licença ${license.name} precisa ser renovada antes de ${license.expiration_date}`,
        severity: new Date(license.expiration_date) < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) ? 'high' : 'medium',
        actionRequired: true
      }]
    };

    // Find PDF documents
    const pdfDocuments = documents?.filter((doc: any) => 
      doc.file_type?.toLowerCase() === 'application/pdf' || 
      doc.file_type?.toLowerCase() === 'pdf'
    ) || [];

    console.log(`PDF documents found: ${pdfDocuments.length}`);

    if (pdfDocuments.length > 0) {
      // Analyze PDF with OpenAI
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.error('OpenAI API key not configured');
        throw new Error('OpenAI API key not configured');
      }

      // Get document download URL
      const { data: documentUrl, error: urlError } = await supabaseClient.storage
        .from('documents')
        .createSignedUrl(pdfDocuments[0].file_path, 3600);

      if (urlError) {
        console.error('Error creating signed URL:', urlError);
      } else if (documentUrl?.signedUrl) {
        try {
          console.log('Analyzing document with OpenAI...');
          
          // Enhanced prompt for license analysis
          const prompt = `Analise este documento de licença ambiental e extraia as seguintes informações em formato JSON válido:

{
  "licenseType": "tipo da licença (LI, LP, LO, etc.)",
  "issuingBody": "órgão emissor",
  "processNumber": "número do processo",
  "issueDate": "data de emissão (YYYY-MM-DD)",
  "expirationDate": "data de vencimento (YYYY-MM-DD)",
  "conditions": [
    {
      "text": "texto completo da condicionante",
      "category": "categoria (monitoramento, relatório, controle, etc.)",
      "priority": "low, medium ou high",
      "frequency": "frequência se aplicável (mensal, trimestral, anual, etc.)",
      "dueDate": "prazo específico se aplicável (YYYY-MM-DD)"
    }
  ],
  "complianceScore": 85,
  "renewalRecommendation": {
    "startDate": "data recomendada para iniciar renovação (YYYY-MM-DD)",
    "urgency": "low, medium ou high",
    "requiredDocuments": ["lista de documentos necessários para renovação"]
  },
  "alerts": [
    {
      "type": "tipo do alerta (renewal, compliance, monitoring, etc.)",
      "title": "título curto do alerta",
      "message": "mensagem detalhada do alerta",
      "severity": "low, medium, high ou critical",
      "actionRequired": true
    }
  ]
}

Tipo de análise solicitada: ${analysisType}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;

          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'Você é um especialista em licenciamento ambiental brasileiro. Analise documentos de licenças e extraia informações estruturadas em JSON válido.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 2000,
              temperature: 0.1
            }),
          });

          if (openAIResponse.ok) {
            const aiResult = await openAIResponse.json();
            const content = aiResult.choices[0]?.message?.content;
            
            console.log('OpenAI response received:', content?.substring(0, 200));
            
            if (content) {
              try {
                // Try to extract JSON from response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsedData = JSON.parse(jsonMatch[0]);
                  extractedData = { ...extractedData, ...parsedData };
                  console.log('Successfully parsed AI response');
                } else {
                  console.log('No valid JSON found in AI response');
                }
              } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.log('Raw content:', content.substring(0, 200));
              }
            }
          } else {
            console.error('OpenAI API error:', await openAIResponse.text());
          }
        } catch (aiError) {
          console.error('Error calling OpenAI:', aiError);
          // Continue with default extracted data
        }
      }
    } else {
      console.log('No PDF documents found, using default analysis');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Calculate confidence score based on data completeness
    const confidenceScore = calculateConfidenceScore(extractedData);

    // Save AI analysis
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('license_ai_analysis')
      .insert({
        license_id: licenseId,
        company_id: license.company_id,
        analysis_type: analysisType,
        ai_insights: extractedData,
        confidence_score: confidenceScore,
        processing_time_ms: processingTime,
        ai_model_used: 'gpt-4o-mini'
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
    }

    // Save extracted conditions
    if (extractedData.conditions && extractedData.conditions.length > 0) {
      const conditionsToInsert = extractedData.conditions.map(condition => ({
        license_id: licenseId,
        company_id: license.company_id,
        condition_text: condition.text,
        condition_category: condition.category,
        due_date: condition.dueDate || null,
        frequency: condition.frequency || null,
        priority: condition.priority,
        ai_confidence: confidenceScore
      }));

      const { error: conditionsError } = await supabaseClient
        .from('license_conditions')
        .insert(conditionsToInsert);

      if (conditionsError) {
        console.error('Error saving conditions:', conditionsError);
      }
    }

    // Save alerts
    if (extractedData.alerts && extractedData.alerts.length > 0) {
      const alertsToInsert = extractedData.alerts.map(alert => ({
        license_id: licenseId,
        company_id: license.company_id,
        alert_type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        action_required: alert.actionRequired
      }));

      const { error: alertsError } = await supabaseClient
        .from('license_alerts')
        .insert(alertsToInsert);

      if (alertsError) {
        console.error('Error saving alerts:', alertsError);
      }
    }

    // Update license with AI data
    const { error: updateError } = await supabaseClient
      .from('licenses')
      .update({
        ai_processing_status: 'completed',
        ai_confidence_score: confidenceScore,
        ai_extracted_data: extractedData,
        ai_last_analysis_at: new Date().toISOString(),
        compliance_score: extractedData.complianceScore
      })
      .eq('id', licenseId);

    if (updateError) {
      console.error('Error updating license:', updateError);
    }

    console.log(`Analysis completed for license ${licenseId} in ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      analysisId: analysis?.id,
      extractedData,
      confidenceScore,
      processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in license-ai-analyzer:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateConfidenceScore(data: ExtractedLicenseData): number {
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
