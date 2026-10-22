import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { buildPainelRedirect, isLandingPath } from "@/config/externalApp";

/** Envia qualquer rota que não seja da landing page para o painel externo. */
export function PainelRedirectGuard({ children }: { children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const isLanding = isLandingPath(pathname);

  useEffect(() => {
    if (!isLanding) window.location.replace(buildPainelRedirect(pathname, search, hash));
  }, [isLanding, pathname, search, hash]);

  if (!isLanding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Redirecionando para o painel Daton...
      </div>
    );
  }
  return <>{children}</>;
}
