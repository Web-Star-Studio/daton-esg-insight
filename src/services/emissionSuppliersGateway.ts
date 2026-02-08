import { ConvexHttpClient } from "convex/browser";
import { supabase } from "@/integrations/supabase/client";
import type {
  EmissionSupplierContract,
  EmissionSupplierInput,
  EmissionSupplierUpdate,
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

function mapContractToModel(
  supplier: EmissionSupplierContract,
): EmissionSupplier {
  return {
    id: supplier.id,
    company_id: supplier.companyId,
    supplier_name: supplier.supplierName,
    cnpj: supplier.cnpj,
    category: supplier.category,
    contact_email: supplier.contactEmail,
    contact_phone: supplier.contactPhone,
    has_inventory: supplier.hasInventory,
    scope_3_category: supplier.scope3Category,
    annual_emissions_estimate: supplier.annualEmissionsEstimate,
    data_quality_score: supplier.dataQualityScore,
    notes: supplier.notes,
    status: supplier.status,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
  };
}

function mapInputToContractInput(
  supplier: Omit<EmissionSupplier, "id" | "company_id" | "created_at" | "updated_at">,
): EmissionSupplierInput {
  return {
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
  };
}

function mapUpdatesToContract(
  updates: Partial<EmissionSupplier>,
): EmissionSupplierUpdate {
  const mapped: EmissionSupplierUpdate = {};

  if (updates.supplier_name !== undefined) mapped.supplierName = updates.supplier_name;
  if (updates.cnpj !== undefined) mapped.cnpj = updates.cnpj;
  if (updates.category !== undefined) mapped.category = updates.category;
  if (updates.contact_email !== undefined) mapped.contactEmail = updates.contact_email;
  if (updates.contact_phone !== undefined) mapped.contactPhone = updates.contact_phone;
  if (updates.has_inventory !== undefined) mapped.hasInventory = updates.has_inventory;
  if (updates.scope_3_category !== undefined) mapped.scope3Category = updates.scope_3_category;
  if (updates.annual_emissions_estimate !== undefined) {
    mapped.annualEmissionsEstimate =
      updates.annual_emissions_estimate === null
        ? undefined
        : updates.annual_emissions_estimate;
  }
  if (updates.data_quality_score !== undefined) {
    mapped.dataQualityScore = updates.data_quality_score;
  }
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  if (updates.status !== undefined) mapped.status = updates.status;

  return mapped;
}

export async function getEmissionSuppliers(): Promise<Array<EmissionSupplier>> {
  if (!convexEnabled) {
    const { data, error } = await supabase
      .from("emission_suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Array<EmissionSupplier>;
  }

  const companyId = await getCurrentUserCompanyId();
  const suppliers = await convexQuery<Array<EmissionSupplierContract>>(
    "suppliers:getEmissionSuppliers",
    { companyId },
  );
  return suppliers.map(mapContractToModel);
}

export async function createEmissionSupplier(
  supplier: Omit<EmissionSupplier, "id" | "company_id" | "created_at" | "updated_at">,
): Promise<EmissionSupplier> {
  if (!convexEnabled) {
    const companyId = await getCurrentUserCompanyId();
    const { data, error } = await supabase
      .from("emission_suppliers")
      .insert({
        ...supplier,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmissionSupplier;
  }

  const companyId = await getCurrentUserCompanyId();
  const id = await convexMutation<string>("suppliers:createEmissionSupplier", {
    companyId,
    ...mapInputToContractInput(supplier),
  });
  const suppliers = await getEmissionSuppliers();
  const created = suppliers.find((item) => item.id === id);
  if (!created) {
    throw new Error("Fornecedor criado, mas não encontrado após atualização");
  }
  return created;
}

export async function updateEmissionSupplier(
  id: string,
  updates: Partial<EmissionSupplier>,
): Promise<EmissionSupplier> {
  if (!convexEnabled) {
    const { data, error } = await supabase
      .from("emission_suppliers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as EmissionSupplier;
  }

  await convexMutation<string>("suppliers:updateEmissionSupplier", {
    id,
    updates: mapUpdatesToContract(updates),
  });
  const suppliers = await getEmissionSuppliers();
  const updated = suppliers.find((item) => item.id === id);
  if (!updated) {
    throw new Error("Fornecedor atualizado, mas não encontrado após atualização");
  }
  return updated;
}

export async function deleteEmissionSupplier(id: string): Promise<void> {
  if (!convexEnabled) {
    const { error } = await supabase
      .from("emission_suppliers")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return;
  }

  await convexMutation<null>("suppliers:deleteEmissionSupplier", { id });
}
