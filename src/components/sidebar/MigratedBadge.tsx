import { getMigrationInfo } from "@/config/migratedModules";
import { cn } from "@/lib/utils";

interface MigratedBadgeProps {
  path: string;
  className?: string;
}

/**
 * Pequeno badge "v2" exibido em itens do sidebar cuja funcionalidade
 * já foi migrada para o novo sistema Daton.
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
          ? `${info.v1Title} foi descontinuado — use o novo Daton`
          : `${info.v1Title} migrou para o novo Daton`
      }
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-bold uppercase leading-[14px] tracking-wide",
        isDeprecated
          ? "border-destructive/40 bg-destructive/15 text-destructive"
          : "border-yellow-500/40 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
        className
      )}
      aria-label={isDeprecated ? "Descontinuado, migrou para v2" : "Migrado para v2"}
    >
      v2
    </span>
  );
}
