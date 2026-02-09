import { ConvexHttpClient } from "convex/browser";
import { supabase } from "@/integrations/supabase/client";
import type {
  EmissionSupplierContract,
  EmissionSupplierSyncInput,
} from "@ws/shared";

export interface EmissionSupplier {
  id: string;
  company_id: string;
  supplier_name: string;
  cnpj?: string;
  category: string;
  contact_email?: string;
  contact_phone?: string;
  has_inventory: boolean;
  scope_3_category: string;
  annual_emissions_estimate?: number | null;
  data_quality_score: number;
  notes?: string;
  status?: "Ativo" | "Inativo" | "Suspenso";
  created_at: string;
  updated_at: string;
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexEnabled =
  import.meta.env.VITE_USE_CONVEX_SUPPLIERS === "true" && !!convexUrl;
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

async function getCurrentUserCompanyId(): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("Empresa não encontrada para o usuário");
  }

  return profile.company_id;
}

async function convexQuery<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.query(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

async function convexMutation<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.mutation(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

function toIsoOrNow(value: string | undefined | null): string {
  return value || new Date().toISOString();
}

function normalizeSupplierRow(
  row: Partial<EmissionSupplier> & Pick<EmissionSupplier, "id" | "company_id" | "supplier_name" | "category">,
): EmissionSupplier {
  return {
    id: row.id,
    company_id: row.company_id,
    supplier_name: row.supplier_name,
    cnpj: row.cnpj || undefined,
    category: row.category,
    contact_email: row.contact_email || undefined,
    contact_phone: row.contact_phone || undefined,
    has_inventory: row.has_inventory ?? false,
    scope_3_category: row.scope_3_category || "1",
    annual_emissions_estimate: row.annual_emissions_estimate ?? null,
    data_quality_score: row.data_quality_score ?? 3,
    notes: row.notes || undefined,
    status: row.status || "Ativo",
    created_at: toIsoOrNow(row.created_at),
    updated_at: toIsoOrNow(row.updated_at || row.created_at),
  };
}

function mapContractToModel(
  supplier: EmissionSupplierContract,
): EmissionSupplier {
  return normalizeSupplierRow({
    id: supplier.sourceId || supplier.id,
    company_id: supplier.companyId,
    supplier_name: supplier.supplierName,
    cnpj: supplier.cnpj,
    category: supplier.category,
    contact_email: supplier.contactEmail,
    contact_phone: supplier.contactPhone,
    has_inventory: supplier.hasInventory,
    scope_3_category: supplier.scope3Category,
    annual_emissions_estimate: supplier.annualEmissionsEstimate ?? null,
    data_quality_score: supplier.dataQualityScore,
    notes: supplier.notes,
    status: supplier.status,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
  });
}

function mapModelToConvexSyncInput(
  supplier: EmissionSupplier,
): EmissionSupplierSyncInput {
  return {
    sourceId: supplier.id,
    companyId: supplier.company_id,
    supplierName: supplier.supplier_name,
    cnpj: supplier.cnpj,
    category: supplier.category,
    contactEmail: supplier.contact_email,
    contactPhone: supplier.contact_phone,
    hasInventory: supplier.has_inventory,
    scope3Category: supplier.scope_3_category,
    annualEmissionsEstimate: supplier.annual_emissions_estimate ?? undefined,
    dataQualityScore: supplier.data_quality_score,
    notes: supplier.notes,
    status: supplier.status,
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,
  };
}

async function getSuppliersFromSupabase(
  companyId: string,
): Promise<Array<EmissionSupplier>> {
  const { data, error } = await supabase
    .from("emission_suppliers")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<EmissionSupplier>).map((row) =>
    normalizeSupplierRow({
      ...row,
      status: "Ativo",
      id: row.id,
      company_id: row.company_id,
      supplier_name: row.supplier_name,
      category: row.category,
    }),
  );
}

async function syncSupplierToConvex(supplier: EmissionSupplier): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("suppliers:upsertEmissionSupplierBySourceId", {
      ...mapModelToConvexSyncInput(supplier),
    });
  } catch (error) {
    console.warn("Failed to sync supplier to Convex", error);
  }
}

async function syncBatchToConvex(rows: Array<EmissionSupplier>): Promise<void> {
  if (!convexEnabled || rows.length === 0) {
    return;
  }

  const batchSize = 50;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await Promise.allSettled(batch.map((row) => syncSupplierToConvex(row)));
  }
}

export async function getEmissionSuppliers(): Promise<Array<EmissionSupplier>> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const suppliers = await convexQuery<Array<EmissionSupplierContract>>(
        "suppliers:getEmissionSuppliers",
        { companyId },
      );

      const hasUnsyncedRows = suppliers.some((supplier) => !supplier.sourceId);
      const mapped = suppliers.map((supplier) => mapContractToModel(supplier));

      if (mapped.length > 0 && !hasUnsyncedRows) {
        return mapped;
      }
    } catch (error) {
      console.warn("Convex getEmissionSuppliers failed, falling back to Supabase", error);
    }
  }

  const rows = await getSuppliersFromSupabase(companyId);
  await syncBatchToConvex(rows);
  return rows;
}

export async function createEmissionSupplier(
  supplier: Omit<EmissionSupplier, "id" | "company_id" | "created_at" | "updated_at">,
): Promise<EmissionSupplier> {
  const companyId = await getCurrentUserCompanyId();
  const payload = {
    supplier_name: supplier.supplier_name.trim(),
    cnpj: supplier.cnpj || null,
    category: supplier.category,
    contact_email: supplier.contact_email || null,
    contact_phone: supplier.contact_phone || null,
    has_inventory: supplier.has_inventory,
    scope_3_category: supplier.scope_3_category,
    annual_emissions_estimate: supplier.annual_emissions_estimate ?? null,
    data_quality_score: supplier.data_quality_score,
    notes: supplier.notes || null,
    company_id: companyId,
  };

  const { data, error } = await supabase
    .from("emission_suppliers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row = normalizeSupplierRow({
    ...(data as EmissionSupplier),
    status: "Ativo",
    id: data.id,
    company_id: data.company_id,
    supplier_name: data.supplier_name,
    category: data.category,
  });

  await syncSupplierToConvex(row);
  return row;
}

export async function updateEmissionSupplier(
  id: string,
  updates: Partial<EmissionSupplier>,
): Promise<EmissionSupplier> {
  const companyId = await getCurrentUserCompanyId();
  const payload: Record<string, unknown> = { ...updates };

  delete payload.id;
  delete payload.company_id;
  delete payload.created_at;
  delete payload.updated_at;
  delete payload.status;

  if (payload.supplier_name !== undefined) {
    payload.supplier_name = String(payload.supplier_name).trim();
  }
  if (payload.cnpj === undefined) {
    delete payload.cnpj;
  }
  if (payload.contact_email === undefined) {
    delete payload.contact_email;
  }
  if (payload.contact_phone === undefined) {
    delete payload.contact_phone;
  }
  if (payload.notes === undefined) {
    delete payload.notes;
  }

  const { data, error } = await supabase
    .from("emission_suppliers")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row = normalizeSupplierRow({
    ...(data as EmissionSupplier),
    status: "Ativo",
    id: data.id,
    company_id: data.company_id,
    supplier_name: data.supplier_name,
    category: data.category,
  });

  await syncSupplierToConvex(row);
  return row;
}

export async function deleteEmissionSupplier(id: string): Promise<void> {
  const companyId = await getCurrentUserCompanyId();
  const { error } = await supabase
    .from("emission_suppliers")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    throw error;
  }

  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<null>("suppliers:deleteEmissionSupplierBySourceId", {
      companyId,
      sourceId: id,
    });
  } catch (convexError) {
    console.warn("Failed to delete supplier from Convex", convexError);
  }
}
