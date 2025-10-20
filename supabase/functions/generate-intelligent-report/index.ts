import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { templateId, parameters } = await req.json();

    // Create job
    const { data: job, error: jobError } = await supabase
      .from("report_generation_jobs")
      .insert({
        company_id: profile.company_id,
        user_id: user.id,
        template_id: templateId,
        template_name: getTemplateName(templateId),
        status: "queued",
        progress: 0,
        parameters,
        estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Start background processing (don't await)
    processReportGeneration(job.id, templateId, parameters, profile.company_id, supabase);

    return new Response(JSON.stringify({ 
      success: true, 
      jobId: job.id,
      message: "Relatório em geração"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processReportGeneration(
  jobId: string,
  templateId: string,
  parameters: any,
  companyId: string,
  supabase: any
) {
  try {
    // Update to processing
    await supabase
      .from("report_generation_jobs")
      .update({ status: "processing", started_at: new Date().toISOString(), progress: 10 })
      .eq("id", jobId);

    // Stage 1: Fetch data (20%)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from("report_generation_jobs")
      .update({ progress: 20 })
      .eq("id", jobId);

    const reportData = await fetchReportData(templateId, parameters, companyId, supabase);

    // Stage 2: Generate insights (40%)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from("report_generation_jobs")
      .update({ progress: 40 })
      .eq("id", jobId);

    const insights = await generateInsights(reportData, templateId);

    // Stage 3: Create document (60%)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from("report_generation_jobs")
      .update({ progress: 60 })
      .eq("id", jobId);

    // Stage 4: Format & upload (80%)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from("report_generation_jobs")
      .update({ progress: 80 })
      .eq("id", jobId);

    // Simulate document generation
    const outputUrls = [`/reports/${jobId}.pdf`];

    // Stage 5: Complete (100%)
    await supabase
      .from("report_generation_jobs")
      .update({
        status: "completed",
        progress: 100,
        insights,
        output_urls: outputUrls,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

  } catch (error) {
    console.error("Error processing report:", error);
    await supabase
      .from("report_generation_jobs")
      .update({
        status: "failed",
        error_message: error.message,
      })
      .eq("id", jobId);
  }
}

async function fetchReportData(templateId: string, parameters: any, companyId: string, supabase: any) {
  const data: any = {};

  // Fetch relevant data based on template
  if (templateId.includes("esg") || templateId.includes("quality")) {
    const { data: emissions } = await supabase
      .from("calculated_emissions")
      .select("*")
      .eq("company_id", companyId)
      .limit(100);
    data.emissions = emissions;
  }

  if (templateId.includes("quality")) {
    const { data: nonConformities } = await supabase
      .from("non_conformities")
      .select("*")
      .eq("company_id", companyId)
      .limit(100);
    data.nonConformities = nonConformities;
  }

  return data;
}

async function generateInsights(reportData: any, templateId: string) {
  // Simulate AI insight generation
  const insights = [];

  if (reportData.emissions && reportData.emissions.length > 0) {
    const totalEmissions = reportData.emissions.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0);
    insights.push({
      type: "trend",
      priority: "high",
      title: "Análise de Emissões",
      description: `Total de ${totalEmissions.toFixed(2)} tCO2e detectado. Recomenda-se revisar fontes de Escopo 1.`,
      confidence: 89,
    });
  }

  if (reportData.nonConformities && reportData.nonConformities.length > 0) {
    const openNCs = reportData.nonConformities.filter((nc: any) => nc.status !== "Fechada").length;
    if (openNCs > 0) {
      insights.push({
        type: "warning",
        priority: "high",
        title: "Não Conformidades Abertas",
        description: `${openNCs} não conformidades abertas requerem atenção imediata.`,
        confidence: 95,
      });
    }
  }

  return insights;
}

function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    "esg-executive-ai": "ESG Executivo com IA",
    "quality-predictive": "Análise Preditiva de Qualidade",
    "emissions-smart": "Inventário GEE Inteligente",
    "governance-dashboard": "Dashboard de Governança",
    "compliance-smart": "Monitor de Compliance",
  };
  return names[templateId] || templateId;
}