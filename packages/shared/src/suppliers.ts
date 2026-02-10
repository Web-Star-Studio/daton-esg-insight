export interface EmissionSupplierContract {
  id: string;
  companyId: string;
  supplierName: string;
  cnpj?: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  hasInventory: boolean;
  scope3Category: string;
  annualEmissionsEstimate?: number;
  dataQualityScore: number;
  notes?: string;
  status: "Ativo" | "Inativo" | "Suspenso";
  createdAt: string;
  updatedAt: string;
}

export interface EmissionSupplierInput {
  supplierName: string;
  cnpj?: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  hasInventory: boolean;
  scope3Category: string;
  annualEmissionsEstimate?: number;
  dataQualityScore: number;
  notes?: string;
  status?: "Ativo" | "Inativo" | "Suspenso";
}

export interface EmissionSupplierUpdate {
  supplierName?: string;
  cnpj?: string;
  category?: string;
  contactEmail?: string;
  contactPhone?: string;
  hasInventory?: boolean;
  scope3Category?: string;
  annualEmissionsEstimate?: number;
  dataQualityScore?: number;
  notes?: string;
  status?: "Ativo" | "Inativo" | "Suspenso";
}
