import { supabase } from "@/integrations/supabase/client";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";

export interface DocumentBranch {
  id: string;
  document_id: string;
  branch_id: string;
  created_at: string;
}

export async function linkDocumentToBranches(
  documentId: string,
  branchIds: string[]
): Promise<void> {
  if (branchIds.length === 0) return;

  const rows = branchIds.map((branchId) => ({
    document_id: documentId,
    branch_id: branchId,
  }));

  const { error } = await supabase
    .from("document_branches" as any)
    .insert(rows);

  if (error) throw new Error(`Erro ao vincular filiais: ${error.message}`);
}

export async function getDocumentBranches(
  documentId: string
): Promise<Array<{ id: string; branch_id: string; branch_name: string; branch_code: string | null }>> {
  const { data, error } = await supabase
    .from("document_branches" as any)
    .select("id, branch_id, branches:branch_id(id, name, code)")
    .eq("document_id", documentId);

  if (error) throw new Error(`Erro ao buscar filiais: ${error.message}`);

  return (data || []).map((row: any) => ({
    id: row.id,
    branch_id: row.branch_id,
    branch_name: row.branches?.name || "",
    branch_code: row.branches?.code || null,
  }));
}

export async function getDocumentsBranchesMap(
  documentIds: string[]
): Promise<Record<string, Array<{ branch_id: string; name: string; code: string | null }>>> {
  if (documentIds.length === 0) return {};

  const { data, error } = await supabase
    .from("document_branches" as any)
    .select("document_id, branch_id, branches:branch_id(name, code)")
    .in("document_id", documentIds);

  if (error) return {};

  const map: Record<string, Array<{ branch_id: string; name: string; code: string | null }>> = {};
  (data || []).forEach((row: any) => {
    if (!map[row.document_id]) map[row.document_id] = [];
    map[row.document_id].push({
      branch_id: row.branch_id,
      name: row.branches?.name || "",
      code: row.branches?.code || null,
    });
  });

  return map;
}

export async function removeDocumentBranch(id: string): Promise<void> {
  const { error } = await supabase
    .from("document_branches" as any)
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Erro ao remover filial: ${error.message}`);
}

export async function updateDocumentBranches(
  documentId: string,
  branchIds: string[]
): Promise<void> {
  // Delete all existing links
  await supabase
    .from("document_branches" as any)
    .delete()
    .eq("document_id", documentId);

  // Re-insert
  if (branchIds.length > 0) {
    await linkDocumentToBranches(documentId, branchIds);
  }
}
