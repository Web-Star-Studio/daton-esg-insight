import { Navigate } from "react-router-dom";
import { useHasBetaAccess } from "@/lib/betaFeatures";

// Wrapper de rota: redireciona quem não é beta-tester pra home. Usar em
// rotas em rollout limitado (ver BETA_FEATURE_SIDEBAR_IDS em betaFeatures.ts).
export function BetaRouteGuard({ children }: { children: React.ReactNode }) {
  const hasAccess = useHasBetaAccess();
  if (!hasAccess) return <Navigate to="/" replace />;
  return <>{children}</>;
}
