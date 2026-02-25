import { supabase } from "@/integrations/supabase/client";

export interface LAIARevision {
  id: string;
  company_id: string;
  revision_number: number;
  title: string;
  description: string | null;
  status: 'rascunho' | 'validada' | 'finalizada';
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: { full_name: string } | null;
  validator?: { full_name: string } | null;
  changes_count?: number;
}

export interface LAIARevisionChange {
  id: string;
  revision_id: string;
  entity_type: 'assessment' | 'sector';
  entity_id: string;
  change_type: 'created' | 'updated' | 'deleted';
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  branch_id: string | null;
  changed_by: string | null;
  changed_at: string;
  // Joined
  changer?: { full_name: string } | null;
}

export interface ChangeInput {
  entity_type: 'assessment' | 'sector';
  entity_id: string;
  change_type: 'created' | 'updated' | 'deleted';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  branch_id?: string;
}

// Field labels for diff display
export const FIELD_LABELS: Record<string, string> = {
  activity_operation: "Atividade/Operação",
  environmental_aspect: "Aspecto Ambiental",
  environmental_impact: "Impacto Ambiental",
  temporality: "Temporalidade",
  operational_situation: "Situação Operacional",
  incidence: "Incidência",
  impact_class: "Classe do Impacto",
  scope: "Abrangência",
  severity: "Severidade",
  frequency_probability: "Frequência/Probabilidade",
  has_legal_requirements: "Requisitos Legais",
  has_stakeholder_demand: "Demanda de Partes Interessadas",
  has_strategic_options: "Opções Estratégicas",
  control_types: "Tipos de Controle",
  existing_controls: "Controles Existentes",
  legislation_reference: "Referência Legal",
  has_lifecycle_control: "Controle de Ciclo de Vida",
  lifecycle_stages: "Etapas do Ciclo de Vida",
  output_actions: "Ações de Saída",
  notes: "Observações",
  sector_id: "Setor",
  code: "Código",
  name: "Nome",
  description: "Descrição",
  is_active: "Ativo",
};

async function getUserCompanyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) throw new Error("Usuário sem empresa associada");
  return profile.company_id;
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  return user.id;
}

export async function getRevisions(companyId?: string): Promise<LAIARevision[]> {
  const cid = companyId || await getUserCompanyId();

  const { data, error } = await supabase
    .from("laia_revisions" as any)
    .select(`
      *,
      creator:profiles!laia_revisions_created_by_fkey(full_name),
      validator:profiles!laia_revisions_validated_by_fkey(full_name)
    `)
    .eq("company_id", cid)
    .order("revision_number", { ascending: false });

  if (error) throw error;

  // Get changes count for each revision
  const revisions = (data || []) as any[];
  const revisionIds = revisions.map((r: any) => r.id);

  if (revisionIds.length > 0) {
    const { data: changes } = await supabase
      .from("laia_revision_changes" as any)
      .select("revision_id")
      .in("revision_id", revisionIds);

    const countMap: Record<string, number> = {};
    (changes || []).forEach((c: any) => {
      countMap[c.revision_id] = (countMap[c.revision_id] || 0) + 1;
    });

    revisions.forEach((r: any) => {
      r.changes_count = countMap[r.id] || 0;
    });
  }

  return revisions as LAIARevision[];
}

export async function getRevisionById(id: string): Promise<LAIARevision & { changes: LAIARevisionChange[] }> {
  const { data, error } = await supabase
    .from("laia_revisions" as any)
    .select(`
      *,
      creator:profiles!laia_revisions_created_by_fkey(full_name),
      validator:profiles!laia_revisions_validated_by_fkey(full_name)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: changes, error: changesError } = await supabase
    .from("laia_revision_changes" as any)
    .select("*")
    .eq("revision_id", id)
    .order("changed_at", { ascending: true });

  if (changesError) throw changesError;

  return {
    ...(data as any),
    changes: (changes || []) as unknown as LAIARevisionChange[],
  };
}

export async function getOrCreateDraftRevision(): Promise<LAIARevision> {
  const companyId = await getUserCompanyId();
  const userId = await getUserId();

  // Check for existing draft
  const { data: existing } = await supabase
    .from("laia_revisions" as any)
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "rascunho")
    .maybeSingle();

  if (existing) return existing as any as LAIARevision;

  // Get next revision number
  const { data: maxData } = await supabase
    .from("laia_revisions" as any)
    .select("revision_number")
    .eq("company_id", companyId)
    .order("revision_number", { ascending: false })
    .limit(1);

  const nextNumber = ((maxData as any[])?.[0]?.revision_number || 0) + 1;

  const { data, error } = await supabase
    .from("laia_revisions" as any)
    .insert({
      company_id: companyId,
      revision_number: nextNumber,
      title: '',
      status: 'rascunho',
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any as LAIARevision;
}

export async function addChangesToRevision(revisionId: string, changes: ChangeInput[]): Promise<void> {
  const userId = await getUserId();

  const rows = changes.map(c => ({
    revision_id: revisionId,
    entity_type: c.entity_type,
    entity_id: c.entity_id,
    change_type: c.change_type,
    field_name: c.field_name || null,
    old_value: c.old_value || null,
    new_value: c.new_value || null,
    branch_id: c.branch_id || null,
    changed_by: userId,
  }));

  const { error } = await supabase
    .from("laia_revision_changes" as any)
    .insert(rows);

  if (error) throw error;
}

export async function validateRevision(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("laia_revisions" as any)
    .update({
      status: 'validada',
      validated_by: userId,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function finalizeRevision(id: string, title: string, description?: string): Promise<void> {
  const { error } = await supabase
    .from("laia_revisions" as any)
    .update({
      status: 'finalizada',
      title,
      description: description || null,
      finalized_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function updateRevisionTitle(id: string, title: string, description?: string): Promise<void> {
  const { error } = await supabase
    .from("laia_revisions" as any)
    .update({
      title,
      description: description || null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteRevision(id: string): Promise<void> {
  const { error } = await supabase
    .from("laia_revisions" as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getPendingChangesCount(): Promise<number> {
  const companyId = await getUserCompanyId();

  const { data: draft } = await supabase
    .from("laia_revisions" as any)
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "rascunho")
    .maybeSingle();

  if (!draft) return 0;

  const { data: changes } = await supabase
    .from("laia_revision_changes" as any)
    .select("id")
    .eq("revision_id", (draft as any).id);

  return (changes || []).length;
}

// Utility: compute field-level changes between old and new data
export function computeChanges(
  entityType: 'assessment' | 'sector',
  entityId: string,
  branchId: string | undefined,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fieldsToTrack: string[]
): ChangeInput[] {
  return fieldsToTrack
    .filter(field => JSON.stringify(oldData[field]) !== JSON.stringify(newData[field]))
    .map(field => ({
      entity_type: entityType,
      entity_id: entityId,
      change_type: 'updated' as const,
      field_name: field,
      old_value: JSON.stringify(oldData[field]),
      new_value: JSON.stringify(newData[field]),
      branch_id: branchId,
    }));
}
