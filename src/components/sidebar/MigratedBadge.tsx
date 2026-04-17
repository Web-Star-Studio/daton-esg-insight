import { AlertTriangle } from "lucide-react";
import { getMigrationInfo } from "@/config/migratedModules";
import { cn } from "@/lib/utils";

interface MigratedBadgeProps {
  path: string;
  className?: string;
}

/**
 * Indicador de aviso exibido em itens do sidebar cuja funcionalidade
 * será migrada/já foi migrada para o novo sistema Daton.
 * Renderiza um pequeno triângulo de alerta amarelo (ou vermelho se descontinuado).
 */
export function MigratedBadge({ path, className }: MigratedBadgeProps) {
  if (!path || path === "#") return null;
  const info = getMigrationInfo(path);
  if (!info) return null;

  const isDeprecated = info.status === "deprecated";

  return (
    <span
      title={
        isDeprecated
          ? `${info.v1Title} foi descontinuado — em breve indisponível nesta versão`
          : `${info.v1Title} será migrado para o novo Daton em breve`
      }
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        isDeprecated ? "text-destructive" : "text-warning",
        className
      )}
      aria-label={
        isDeprecated
          ? "Funcionalidade descontinuada"
          : "Funcionalidade será migrada em breve"
      }
    >
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}
