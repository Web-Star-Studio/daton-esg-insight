import { useAuth } from "@/contexts/AuthContext";

// Lista de emails autorizados a usar features em rollout limitado
// (Sugestões de Legislação + Cartas Mensais). Normalize sempre lowercase
// antes de comparar — emails podem vir capitalizados de import legacy.
const BETA_FEATURE_EMAILS = new Set<string>([
  "jpbs@cesar.school",
  "joaopedrobatista010@gmail.com",
]);

// IDs dos itens do AppSidebar gated. Mantido aqui (não no Sidebar) pra
// quando liberar geral basta esvaziar este Set sem caçar referências.
export const BETA_FEATURE_SIDEBAR_IDS = new Set<string>([
  "licensing-suggestions",
  "licensing-monthly-letters",
]);

export function hasBetaAccess(email: string | null | undefined): boolean {
  if (!email) return false;
  return BETA_FEATURE_EMAILS.has(email.toLowerCase().trim());
}

export function useHasBetaAccess(): boolean {
  const { user } = useAuth();
  return hasBetaAccess(user?.email);
}
