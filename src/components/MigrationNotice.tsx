import { useLocation } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMigrationInfo } from "@/config/migratedModules";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "daton.migrationNotice.dismissed";

/**
 * Banner exibido no topo de páginas cuja funcionalidade já foi migrada para a V2.
 * O usuário pode dispensar por sessão (persistido em localStorage por path).
 */
export function MigrationNotice() {
  const { pathname } = useLocation();
  const info = getMigrationInfo(pathname);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!info) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      setDismissed(list.includes(pathname));
    } catch {
      setDismissed(false);
    }
  }, [pathname, info]);

  if (!info || dismissed) return null;

  const handleDismiss = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(pathname)) list.push(pathname);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const isDeprecated = info.status === "deprecated";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between mb-4",
        isDeprecated
          ? "border-destructive/40 bg-destructive/5"
          : "border-warning/40 bg-warning/10"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isDeprecated ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-warning"
          )}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isDeprecated
              ? `${info.v1Title} foi descontinuado nesta versão`
              : `${info.v1Title} migrou para o novo Daton`}
          </p>
          <p className="text-sm text-muted-foreground">
            {isDeprecated
              ? "Acesse a nova versão para continuar usando este módulo."
              : "Em breve esta versão será descontinuada. Recomendamos usar o novo sistema."}
            {info.notes ? <span className="ml-1">{info.notes}</span> : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Dispensar aviso"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
