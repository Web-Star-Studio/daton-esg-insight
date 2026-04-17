import { getMigrationInfo } from "@/config/migratedModules";
import { cn } from "@/lib/utils";

interface MigratedBadgeProps {
  path: string;
  className?: string;
}

/**
 * Indicador discreto exibido em itens do sidebar cuja funcionalidade
 * será migrada/já foi migrada para o novo sistema Daton.
 * Renderiza uma pequena bolinha amarela (ou vermelha se descontinuado).
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
        "inline-block h-2 w-2 rounded-full shrink-0",
        isDeprecated ? "bg-destructive" : "bg-warning",
        className
      )}
      aria-label={
        isDeprecated
          ? "Funcionalidade descontinuada"
          : "Funcionalidade será migrada em breve"
      }
    />
  );
}
