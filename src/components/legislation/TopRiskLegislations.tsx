import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";
import type { RiskLegislation, StatusBucket } from "@/hooks/useBranchComplianceStats";

interface Props {
  legislations: RiskLegislation[] | undefined;
  isLoading: boolean;
}

const STATUS_COLOR: Record<StatusBucket, string> = {
  conforme: "bg-emerald-500",
  plano_acao: "bg-rose-500",
  pending: "bg-amber-500",
  na: "bg-slate-300 dark:bg-slate-600",
  outros: "bg-slate-400 dark:bg-slate-500",
};

const STATUS_LABEL: Record<StatusBucket, string> = {
  conforme: "Conforme",
  plano_acao: "Plano de ação",
  pending: "Pendente",
  na: "Não aplicável",
  outros: "Outros",
};

const formatNum = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const BranchDot: React.FC<{ code: string | null; name: string; status: StatusBucket | null }> = ({
  code,
  name,
  status,
}) => (
  <TooltipProvider>
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ring-1 ring-background ${
            status ? STATUS_COLOR[status] : "bg-slate-200 dark:bg-slate-700"
          }`}
          role="img"
          aria-label={`${code || name}: ${status ? STATUS_LABEL[status] : "sem avaliação"}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <strong>{code || name}</strong>
        {status && <span className="ml-1 opacity-80">— {STATUS_LABEL[status]}</span>}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const TopRiskLegislations: React.FC<Props> = ({ legislations, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Normas em maior risco
        </CardTitle>
        <CardDescription>
          Legislações com mais filiais em plano de ação ou pendentes de avaliação
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !legislations || legislations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
            <ShieldCheck className="h-10 w-10 mb-2 text-emerald-500 opacity-70" />
            <p className="text-sm font-medium">Nenhuma norma em risco</p>
            <p className="text-xs mt-1">Todas as avaliações estão conformes ou não aplicáveis.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {legislations.map(leg => (
              <li key={leg.id}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-muted/40 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => navigate(`/licenciamento/legislacoes/${leg.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={leg.title}>
                      {leg.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {leg.normType}
                      {leg.normNumber ? ` ${leg.normNumber}` : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {leg.branchStatuses.map(b => (
                        <BranchDot key={b.branchId} code={b.code} name={b.name} status={b.status} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {leg.planoAcao > 0 && (
                      <span className="text-xs tabular-nums font-medium text-rose-600 dark:text-rose-400">
                        {formatNum(leg.planoAcao)} plano{leg.planoAcao !== 1 ? "s" : ""}
                      </span>
                    )}
                    {leg.pending > 0 && (
                      <span className="text-xs tabular-nums text-amber-600 dark:text-amber-400">
                        {formatNum(leg.pending)} pend.
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
