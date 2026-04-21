import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Hourglass,
  ShieldCheck,
} from "lucide-react";
import type {
  BranchComplianceStats,
  BranchFocus,
  BranchFocusItem,
} from "@/hooks/useBranchComplianceStats";

interface Props {
  branch: BranchComplianceStats | null;
  focus: BranchFocus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const numberFmt = new Intl.NumberFormat("pt-BR");
const pctFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const KpiMini: React.FC<{
  label: string;
  value: React.ReactNode;
  tone: "neutral" | "good" | "warn" | "bad";
  icon?: React.ReactNode;
}> = ({ label, value, tone, icon }) => {
  const cls = {
    neutral: "bg-muted/60",
    good: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/60",
    warn: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/60",
    bad: "bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/60",
  }[tone];
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
};

const LegislationItem: React.FC<{
  item: BranchFocusItem;
  onClick: () => void;
}> = ({ item, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-start gap-2 py-2.5 px-2 text-left hover:bg-muted/40 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium line-clamp-2" title={item.title}>
        {item.title}
      </p>
      <p className="text-xs text-muted-foreground font-mono mt-0.5">
        {item.normType}
        {item.normNumber ? ` ${item.normNumber}` : ""}
      </p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
  </button>
);

export const BranchDrillDrawer: React.FC<Props> = ({
  branch,
  focus,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  if (!branch) return null;

  const branchLabel = branch.code || branch.name;
  const planoAcao = focus?.planoAcao ?? [];
  const pending = focus?.pending ?? [];
  const totalAplicaveis = branch.total - branch.na;
  const complianceTone: "good" | "warn" | "bad" =
    branch.complianceRate >= 0.85 ? "good" : branch.complianceRate >= 0.6 ? "warn" : "bad";

  const goToLegislation = (id: string) => {
    onOpenChange(false);
    navigate(`/licenciamento/legislacoes/${id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl truncate">{branchLabel}</SheetTitle>
              <SheetDescription className="text-xs">
                {branch.name}
                {branch.city ? ` · ${branch.city}` : ""}
                {branch.state ? ` / ${branch.state}` : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <section className="grid grid-cols-2 gap-3">
            <KpiMini
              label="Conformidade"
              value={`${pctFmt.format(branch.complianceRate * 100)}%`}
              tone={complianceTone}
              icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiMini
              label="Total de avaliações"
              value={numberFmt.format(branch.total)}
              tone="neutral"
            />
            <KpiMini
              label="Plano de ação"
              value={numberFmt.format(branch.planoAcao)}
              tone={branch.planoAcao === 0 ? "good" : branch.planoAcao < 10 ? "warn" : "bad"}
              icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiMini
              label="Pendentes"
              value={numberFmt.format(branch.pending)}
              tone={branch.pending === 0 ? "good" : branch.pending < 10 ? "warn" : "bad"}
              icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
            />
          </section>

          <p className="text-xs text-muted-foreground mt-3">
            Conformes: <strong className="tabular-nums">{numberFmt.format(branch.conforme)}</strong> de{" "}
            <strong className="tabular-nums">{numberFmt.format(totalAplicaveis)}</strong> aplicáveis ·{" "}
            Não aplicáveis: <strong className="tabular-nums">{numberFmt.format(branch.na)}</strong>
          </p>

          <Separator className="my-5" />

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-rose-500" />
                Plano de ação
                {planoAcao.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {numberFmt.format(planoAcao.length)}
                  </Badge>
                )}
              </h3>
            </div>
            {planoAcao.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Nenhuma norma em plano de ação nesta filial.
              </p>
            ) : (
              <div className="divide-y">
                {planoAcao.slice(0, 30).map(item => (
                  <LegislationItem key={item.id} item={item} onClick={() => goToLegislation(item.id)} />
                ))}
                {planoAcao.length > 30 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... e mais {numberFmt.format(planoAcao.length - 30)} itens
                  </p>
                )}
              </div>
            )}
          </section>

          <Separator className="my-5" />

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-amber-500" />
                Pendentes de avaliação
                {pending.length > 0 && (
                  <Badge variant="outline" className="ml-1 border-amber-400 text-amber-700 dark:text-amber-300">
                    {numberFmt.format(pending.length)}
                  </Badge>
                )}
              </h3>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Nenhuma pendência nesta filial.
              </p>
            ) : (
              <div className="divide-y">
                {pending.slice(0, 30).map(item => (
                  <LegislationItem key={item.id} item={item} onClick={() => goToLegislation(item.id)} />
                ))}
                {pending.length > 30 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ... e mais {numberFmt.format(pending.length - 30)} itens
                  </p>
                )}
              </div>
            )}
          </section>

          {branch.total === 0 && (
            <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Esta filial não tem nenhuma avaliação registrada. Verifique o mapeamento
                na próxima importação ou adicione avaliações manualmente.
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate(`/licenciamento/legislacoes/relatorios?branchId=${branch.branchId}`);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver em Relatórios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
