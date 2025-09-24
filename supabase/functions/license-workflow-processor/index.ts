import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowProcessRequest {
  licenseId?: string;
  action: 'upload' | 'analyze' | 'reconcile';
  file?: {
    name: string;
    type: string;
    data: string; // base64
  };
  reconciliationData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting license workflow processing...');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    console.log(`Processing workflow for user: ${user.id}`);

    // Get user's company
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    const { action, licenseId, file, reconciliationData } = await req.json() as WorkflowProcessRequest;

    switch (action) {
      case 'upload':
        return await handleUpload(supabaseClient, user.id, profile.company_id, file!);
      
      case 'analyze':
        return await handleAnalyze(supabaseClient, licenseId!);
      
      case 'reconcile':
        return await handleReconcile(supabaseClient, licenseId!, reconciliationData);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in license-workflow-processor:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

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
      related_id: crypto.randomUUID(), // This will be the license ID
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
      id: document.related_id,
      company_id: companyId,
      name: 'Processando...',
      type: 'LO',
      status: 'Ativa',
      issuing_body: 'Identificando...',
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      ai_processing_status: 'processing',
      ai_confidence_score: 0
    })
    .select()
    .single();

  if (licenseError) {
    throw new Error(`License creation failed: ${licenseError.message}`);
  }

  // Start AI analysis in background
  console.log('Starting background AI analysis...');
  
  // Call the existing license-document-analyzer function
  const analysisPromise = supabaseClient.functions.invoke('license-document-analyzer', {
    body: { filePath }
  });

  // Don't wait for analysis to complete - return immediately
  analysisPromise.then(async (result: any) => {
    console.log('AI analysis completed:', result);
    
    if (result.data?.success && result.data?.data) {
      // Update license with extracted data
      const extractedData = result.data.data;
      
      await supabaseClient
        .from('licenses')
        .update({
          name: extractedData.license_number || 'Não identificado',
          type: extractedData.license_type || 'LO',
          process_number: extractedData.process_number,
          issue_date: extractedData.issue_date,
          expiration_date: extractedData.valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issuing_body: extractedData.issuing_body || 'Identificando...',
          conditions: extractedData.conditions ? JSON.stringify(extractedData.conditions) : null,
          ai_processing_status: 'completed',
          ai_confidence_score: result.data.confidence || 0,
          ai_extracted_data: extractedData
        })
        .eq('id', document.related_id);

      // Update document status
      await supabaseClient
        .from('documents')
        .update({
          ai_processing_status: 'completed',
          ai_confidence_score: result.data.confidence || 0
        })
        .eq('id', document.id);

    } else {
      // Update as failed
      await supabaseClient
        .from('licenses')
        .update({
          ai_processing_status: 'failed',
          status: 'Vencida'
        })
        .eq('id', document.related_id);

      await supabaseClient
        .from('documents')
        .update({
          ai_processing_status: 'failed'
        })
        .eq('id', document.id);
    }
  }).catch((error: any) => {
    console.error('Background analysis failed:', error);
  });

  return new Response(JSON.stringify({
    success: true,
    licenseId: document.related_id,
    documentId: document.id,
    message: 'Upload realizado com sucesso. Análise IA iniciada em segundo plano.'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAnalyze(supabaseClient: any, licenseId: string) {
  console.log('Handling analysis request for license:', licenseId);
  
  // Get license and document data
  const { data: license } = await supabaseClient
    .from('licenses')
    .select(`
      *,
      documents!documents_related_id_fkey(*)
    `)
    .eq('id', licenseId)
    .single();

  if (!license) {
    throw new Error('License not found');
  }

  const document = license.documents?.[0];
  if (!document) {
    throw new Error('No document found for license');
  }

  // Call AI analysis
  const { data: result } = await supabaseClient.functions.invoke('license-document-analyzer', {
    body: { filePath: document.file_path }
  });

  if (result?.success) {
    // Update license with extracted data
    const extractedData = result.data;
    
    await supabaseClient
      .from('licenses')
      .update({
        name: extractedData.license_number || license.name,
        type: extractedData.license_type || license.type,
        process_number: extractedData.process_number,
        issue_date: extractedData.issue_date,
        expiration_date: extractedData.valid_until || license.expiration_date,
        issuing_body: extractedData.issuing_body || license.issuing_body,
        conditions: extractedData.conditions ? JSON.stringify(extractedData.conditions) : license.conditions,
        ai_processing_status: 'completed',
        ai_confidence_score: result.confidence || 0,
        ai_extracted_data: extractedData,
        status: 'Ativa'
      })
      .eq('id', licenseId);
  }

  return new Response(JSON.stringify({
    success: result?.success || false,
    data: result?.data,
    confidence: result?.confidence || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

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
      conditions: reconciliationData.conditions,
      status: 'Ativa',
      ai_processing_status: 'approved'
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