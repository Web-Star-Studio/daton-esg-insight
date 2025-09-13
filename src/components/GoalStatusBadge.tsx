import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";

interface GoalStatusBadgeProps {
  status: "No Caminho Certo" | "Atenção Necessária" | "Atingida" | "Atrasada";
  className?: string;
}

export function GoalStatusBadge({ status, className }: GoalStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "No Caminho Certo":
        return {
          variant: "default" as const,
          className: "bg-success text-success-foreground border-success/20",
          icon: CheckCircle,
          label: "No Caminho"
        };
      case "Atenção Necessária":
        return {
          variant: "secondary" as const,
          className: "bg-warning text-warning-foreground border-warning/20",
          icon: AlertTriangle,
          label: "Atenção"
        };
      case "Atingida":
        return {
          variant: "default" as const,
          className: "bg-accent text-accent-foreground border-accent/20",
          icon: CheckCircle,
          label: "Atingida"
        };
      case "Atrasada":
        return {
          variant: "destructive" as const,
          className: "bg-destructive text-destructive-foreground border-destructive/20",
          icon: XCircle,
          label: "Atrasada"
        };
      default:
        return {
          variant: "outline" as const,
          className: "",
          icon: Clock,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} border gap-1 ${className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}