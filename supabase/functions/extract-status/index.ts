import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusRequest {
  file_id?: string;
  extraction_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: 'unauthorized' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { file_id, extraction_id }: StatusRequest = await req.json();
    
    if (!file_id && !extraction_id) {
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: 'file_id or extraction_id required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let fileData = null;
    let extractionData = null;

    if (file_id) {
      // Get file status
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', file_id)
        .eq('user_id', user.id)
        .single();

      if (fileError || !file) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'file not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      fileData = file;

      // If file has extraction, get it
      if (file.status === 'extracted') {
        const { data: extraction } = await supabase
          .from('extractions')
          .select('*')
          .eq('file_id', file_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        extractionData = extraction;
      }
    } else if (extraction_id) {
      // Get extraction directly
      const { data: extraction, error: extractionError } = await supabase
        .from('extractions')
        .select(`
          *,
          files!inner(*)
        `)
        .eq('id', extraction_id)
        .eq('files.user_id', user.id)
        .single();

      if (extractionError || !extraction) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'extraction not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      extractionData = extraction;
      fileData = extraction.files;
    }

    // Determine status and progress
    let status = 'unknown';
    let progress = 0;
    let message = '';

    if (fileData) {
      switch (fileData.status) {
        case 'uploaded':
          status = 'uploaded';
          progress = 0;
          message = 'Preparando arquivo';
          break;
        case 'parsed':
          status = 'parsing';
          progress = 30;
          message = 'Extraindo texto';
          break;
        case 'extracted':
          status = 'completed';
          progress = 100;
          message = 'Extração concluída';
          break;
        case 'failed':
          status = 'failed';
          progress = 0;
          message = fileData.error || 'Erro na extração';
          break;
      }
    }

    // Count staging items if extraction exists
    let itemsCount = 0;
    if (extractionData) {
      const { count } = await supabase
        .from('extraction_items_staging')
        .select('*', { count: 'exact', head: true })
        .eq('extraction_id', extractionData.id);

      itemsCount = count || 0;
    }

    return new Response(JSON.stringify({
      status,
      progress,
      message,
      file_id: fileData?.id,
      extraction_id: extractionData?.id,
      items_count: itemsCount,
      quality_score: extractionData?.quality_score,
      created_at: fileData?.created_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in extract-status:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});