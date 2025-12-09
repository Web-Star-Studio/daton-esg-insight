import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LegislationStatusBadgeProps {
  type: 'applicability' | 'status';
  value: string;
  className?: string;
}

const applicabilityConfig: Record<string, { label: string; className: string }> = {
  real: { label: "Real", className: "bg-pink-500 text-white hover:bg-pink-600" },
  potential: { label: "Potencial", className: "bg-gray-800 text-white hover:bg-gray-900" },
  revoked: { label: "Revogada", className: "bg-gray-400 text-white hover:bg-gray-500" },
  na: { label: "N/A", className: "bg-gray-200 text-gray-700 hover:bg-gray-300" },
  pending: { label: "Pendente", className: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  conforme: { label: "Conforme", className: "bg-green-500 text-white hover:bg-green-600" },
  para_conhecimento: { label: "Para Conhecimento", className: "bg-blue-500 text-white hover:bg-blue-600" },
  adequacao: { label: "Adequação", className: "bg-orange-500 text-white hover:bg-orange-600" },
  plano_acao: { label: "Plano de Ação", className: "bg-red-500 text-white hover:bg-red-600" },
  pending: { label: "Pendente", className: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500" },
};

export const LegislationStatusBadge: React.FC<LegislationStatusBadgeProps> = ({
  type,
  value,
  className,
}) => {
  const config = type === 'applicability' ? applicabilityConfig : statusConfig;
  const item = config[value] || { label: value, className: "bg-muted text-muted-foreground" };

  return (
    <Badge className={cn("font-medium", item.className, className)}>
      {item.label}
    </Badge>
  );
};

export const JurisdictionBadge: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const config: Record<string, { label: string; className: string }> = {
    federal: { label: "Federal", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    estadual: { label: "Estadual", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    municipal: { label: "Municipal", className: "bg-amber-100 text-amber-800 border-amber-200" },
    nbr: { label: "NBR", className: "bg-purple-100 text-purple-800 border-purple-200" },
    internacional: { label: "Internacional", className: "bg-sky-100 text-sky-800 border-sky-200" },
  };

  const item = config[value] || { label: value, className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={cn("font-medium", item.className, className)}>
      {item.label}
    </Badge>
  );
};
