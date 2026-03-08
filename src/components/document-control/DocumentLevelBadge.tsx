import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DocumentLevel = 
  | "nivel_1_msg" 
  | "nivel_2_psg" 
  | "nivel_3_it_pso" 
  | "nivel_4_rg" 
  | "nivel_5_fplan";

const LEVEL_CONFIG: Record<DocumentLevel, { label: string; prefix: string; className: string }> = {
  nivel_1_msg: { label: "Nível 1 – MSG", prefix: "MSG", className: "bg-primary/10 text-primary border-primary/30" },
  nivel_2_psg: { label: "Nível 2 – PSG", prefix: "PSG", className: "bg-accent/50 text-accent-foreground border-accent" },
  nivel_3_it_pso: { label: "Nível 3 – IT/PSO", prefix: "IT", className: "bg-secondary text-secondary-foreground border-secondary" },
  nivel_4_rg: { label: "Nível 4 – RG", prefix: "RG", className: "bg-muted text-muted-foreground border-border" },
  nivel_5_fplan: { label: "Nível 5 – FPLAN", prefix: "FPLAN", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export const LEVEL_OPTIONS = Object.entries(LEVEL_CONFIG).map(([value, config]) => ({
  value: value as DocumentLevel,
  label: config.label,
  prefix: config.prefix,
}));

export function getCodePrefix(level: DocumentLevel): string {
  return LEVEL_CONFIG[level]?.prefix ?? "";
}

interface DocumentLevelBadgeProps {
  level: DocumentLevel | null | undefined;
  className?: string;
}

export function DocumentLevelBadge({ level, className }: DocumentLevelBadgeProps) {
  if (!level) return null;
  const config = LEVEL_CONFIG[level];
  if (!config) return null;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
