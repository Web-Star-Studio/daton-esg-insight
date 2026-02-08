export type ModuleKey = "social" | "quality" | "suppliers";

export type ProviderId = "supabase" | "convex";

export interface CompanyScopedEntity {
  companyId: string;
}

export interface SocialProjectSummary extends CompanyScopedEntity {
  id: string;
  name: string;
  status: "Planejado" | "Em Andamento" | "Concluido" | "Cancelado";
}

export interface QualityNcSummary extends CompanyScopedEntity {
  id: string;
  title: string;
  severity: "Baixa" | "Media" | "Alta" | "Critica";
  status: "Aberta" | "Em Andamento" | "Resolvida" | "Fechada";
}

export interface SupplierSummary extends CompanyScopedEntity {
  id: string;
  personType: "PF" | "PJ";
  displayName: string;
  status: "Ativo" | "Inativo" | "Suspenso";
}

export * from "./social";
export * from "./quality";
export * from "./suppliers";
