import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, Eye } from "lucide-react";

interface ReportStatusBadgeProps {
  status: string;
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const statusConfig = {
    'Rascunho': {
      variant: 'secondary' as const,
      icon: FileText,
      label: 'Rascunho',
    },
    'Em Revisão': {
      variant: 'outline' as const,
      icon: Eye,
      label: 'Em Revisão',
    },
    'Publicado': {
      variant: 'default' as const,
      icon: CheckCircle,
      label: 'Publicado',
    },
    'Arquivado': {
      variant: 'secondary' as const,
      icon: Clock,
      label: 'Arquivado',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Rascunho'];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
