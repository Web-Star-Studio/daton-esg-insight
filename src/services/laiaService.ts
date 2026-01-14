import { supabase } from "@/integrations/supabase/client";
import type { LAIASector, LAIAAssessment, LAIAAssessmentFormData, LAIADashboardStats } from "@/types/laia";
import { 
  calculateConsequenceScore, 
  calculateFreqProbScore, 
  calculateCategory, 
  calculateSignificance 
} from "@/types/laia";

// ============ Sectors ============

export async function getLAIASectors(): Promise<LAIASector[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");

  const { data, error } = await supabase
    .from("laia_sectors")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("code");

  if (error) throw error;
  return (data ?? []) as LAIASector[];
}

export async function createLAIASector(sector: { code: string; name: string; description?: string }): Promise<LAIASector> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");

  const { data, error } = await supabase
    .from("laia_sectors")
    .insert({
      company_id: profile.company_id,
      code: sector.code,
      name: sector.name,
      description: sector.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LAIASector;
}

export async function updateLAIASector(id: string, sector: Partial<LAIASector>): Promise<LAIASector> {
  const { data, error } = await supabase
    .from("laia_sectors")
    .update({
      code: sector.code,
      name: sector.name,
      description: sector.description,
      is_active: sector.is_active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as LAIASector;
}

export async function deleteLAIASector(id: string): Promise<void> {
  const { error } = await supabase
    .from("laia_sectors")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============ Assessments ============

export async function getLAIAAssessments(filters?: {
  sector_id?: string;
  category?: string;
  significance?: string;
  status?: string;
}): Promise<LAIAAssessment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");

  let query = supabase
    .from("laia_assessments")
    .select(`
      *,
      sector:laia_sectors(id, code, name),
      responsible_user:profiles!laia_assessments_responsible_user_id_fkey(full_name)
    `)
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (filters?.sector_id) {
    query = query.eq("sector_id", filters.sector_id);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.significance) {
    query = query.eq("significance", filters.significance);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as LAIAAssessment[];
}

export async function getLAIAAssessmentById(id: string): Promise<LAIAAssessment | null> {
  const { data, error } = await supabase
    .from("laia_assessments")
    .select(`
      *,
      sector:laia_sectors(id, code, name),
      responsible_user:profiles!laia_assessments_responsible_user_id_fkey(full_name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as LAIAAssessment;
}

export async function getNextAspectCode(sectorId: string): Promise<string> {
  const { data: sector } = await supabase
    .from("laia_sectors")
    .select("code")
    .eq("id", sectorId)
    .single();

  if (!sector) throw new Error("Setor não encontrado");

  const { data: assessments } = await supabase
    .from("laia_assessments")
    .select("aspect_code")
    .eq("sector_id", sectorId)
    .order("aspect_code", { ascending: false })
    .limit(1);

  const lastCode = assessments?.[0]?.aspect_code;
  let nextNumber = 1;

  if (lastCode) {
    const parts = lastCode.split(".");
    if (parts.length === 2) {
      nextNumber = parseInt(parts[1], 10) + 1;
    }
  }

  return `${sector.code}.${String(nextNumber).padStart(2, "0")}`;
}

export async function createLAIAAssessment(formData: LAIAAssessmentFormData): Promise<LAIAAssessment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");

  // Calculate scores
  const consequence_score = calculateConsequenceScore(formData.scope, formData.severity);
  const freq_prob_score = calculateFreqProbScore(formData.frequency_probability);
  const total_score = consequence_score + freq_prob_score;
  const category = calculateCategory(total_score);
  const significance = calculateSignificance(
    category,
    formData.has_legal_requirements,
    formData.has_stakeholder_demand,
    formData.has_strategic_options
  );

  // Get next aspect code
  const aspect_code = await getNextAspectCode(formData.sector_id);

  const { data, error } = await supabase
    .from("laia_assessments")
    .insert({
      company_id: profile.company_id,
      sector_id: formData.sector_id,
      aspect_code,
      activity_operation: formData.activity_operation,
      environmental_aspect: formData.environmental_aspect,
      environmental_impact: formData.environmental_impact,
      temporality: formData.temporality,
      operational_situation: formData.operational_situation,
      incidence: formData.incidence,
      impact_class: formData.impact_class,
      scope: formData.scope,
      severity: formData.severity,
      consequence_score,
      frequency_probability: formData.frequency_probability,
      freq_prob_score,
      total_score,
      category,
      has_legal_requirements: formData.has_legal_requirements,
      has_stakeholder_demand: formData.has_stakeholder_demand,
      has_strategic_options: formData.has_strategic_options,
      significance,
      control_types: formData.control_types,
      existing_controls: formData.existing_controls || null,
      legislation_reference: formData.legislation_reference || null,
      has_lifecycle_control: formData.has_lifecycle_control,
      lifecycle_stages: formData.lifecycle_stages,
      output_actions: formData.output_actions || null,
      responsible_user_id: formData.responsible_user_id || profile.id,
      notes: formData.notes || null,
      status: 'ativo',
    })
    .select(`
      *,
      sector:laia_sectors(id, code, name),
      responsible_user:profiles!laia_assessments_responsible_user_id_fkey(full_name)
    `)
    .single();

  if (error) throw error;
  return data as LAIAAssessment;
}

export async function updateLAIAAssessment(id: string, formData: Partial<LAIAAssessmentFormData>): Promise<LAIAAssessment> {
  const updateData: Record<string, unknown> = { ...formData };

  // Recalculate scores if relevant fields changed
  if (formData.scope && formData.severity) {
    updateData.consequence_score = calculateConsequenceScore(formData.scope, formData.severity);
  }
  if (formData.frequency_probability) {
    updateData.freq_prob_score = calculateFreqProbScore(formData.frequency_probability);
  }

  // Get current data to recalculate if needed
  const { data: current } = await supabase
    .from("laia_assessments")
    .select("consequence_score, freq_prob_score, has_legal_requirements, has_stakeholder_demand, has_strategic_options")
    .eq("id", id)
    .single();

  if (current) {
    const consequence_score = (updateData.consequence_score as number) ?? current.consequence_score;
    const freq_prob_score = (updateData.freq_prob_score as number) ?? current.freq_prob_score;
    const total_score = consequence_score + freq_prob_score;
    const category = calculateCategory(total_score);
    const significance = calculateSignificance(
      category,
      formData.has_legal_requirements ?? current.has_legal_requirements,
      formData.has_stakeholder_demand ?? current.has_stakeholder_demand,
      formData.has_strategic_options ?? current.has_strategic_options
    );

    updateData.total_score = total_score;
    updateData.category = category;
    updateData.significance = significance;
  }

  const { data, error } = await supabase
    .from("laia_assessments")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      sector:laia_sectors(id, code, name),
      responsible_user:profiles!laia_assessments_responsible_user_id_fkey(full_name)
    `)
    .single();

  if (error) throw error;
  return data as LAIAAssessment;
}

export async function deleteLAIAAssessment(id: string): Promise<void> {
  const { error } = await supabase
    .from("laia_assessments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============ Dashboard Stats ============

export async function getLAIADashboardStats(): Promise<LAIADashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");

  const { data: assessments, error } = await supabase
    .from("laia_assessments")
    .select(`
      id,
      category,
      significance,
      sector:laia_sectors(name)
    `)
    .eq("company_id", profile.company_id)
    .eq("status", "ativo");

  if (error) throw error;

  const stats: LAIADashboardStats = {
    total: assessments?.length ?? 0,
    significativos: 0,
    nao_significativos: 0,
    criticos: 0,
    moderados: 0,
    despreziveis: 0,
    by_sector: [],
  };

  const sectorCounts: Record<string, number> = {};

  assessments?.forEach((a) => {
    if (a.significance === "significativo") stats.significativos++;
    else stats.nao_significativos++;

    if (a.category === "critico") stats.criticos++;
    else if (a.category === "moderado") stats.moderados++;
    else stats.despreziveis++;

    const sectorName = (a.sector as { name: string } | null)?.name ?? "Sem Setor";
    sectorCounts[sectorName] = (sectorCounts[sectorName] ?? 0) + 1;
  });

  stats.by_sector = Object.entries(sectorCounts)
    .map(([sector_name, count]) => ({ sector_name, count }))
    .sort((a, b) => b.count - a.count);

  return stats;
}
