import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { DataQualityIssues } from "@/hooks/useBranchComplianceStats";

interface Props {
  issues: DataQualityIssues | undefined;
}

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const issueCount = (i: DataQualityIssues) =>
  i.branchesWithoutEvaluations.length +
  (i.legislationsWithoutEvaluations > 0 ? 1 : 0) +
  i.typeCasingDuplicates.length +
  i.suspiciousDates.length;

export const DataQualityBanner: React.FC<Props> = ({ issues }) => {
  const [open, setOpen] = useState(false);

  if (!issues || !issues.hasAny) return null;

  const count = issueCount(issues);

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/60">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              {count} {count === 1 ? "ponto de atenção" : "pontos de atenção"} no dado
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 flex flex-wrap gap-2 mt-1">
              {issues.branchesWithoutEvaluations.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.branchesWithoutEvaluations.length} filial{issues.branchesWithoutEvaluations.length !== 1 ? "is" : ""} sem avaliações
                </Badge>
              )}
              {issues.legislationsWithoutEvaluations > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.legislationsWithoutEvaluations} legislaç{issues.legislationsWithoutEvaluations !== 1 ? "ões" : "ão"} sem avaliação
                </Badge>
              )}
              {issues.typeCasingDuplicates.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.typeCasingDuplicates.length} tipo{issues.typeCasingDuplicates.length !== 1 ? "s" : ""} duplicado{issues.typeCasingDuplicates.length !== 1 ? "s" : ""} por formato
                </Badge>
              )}
              {issues.suspiciousDates.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.suspiciousDates.length} data{issues.suspiciousDates.length !== 1 ? "s" : ""} suspeita{issues.suspiciousDates.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </AlertDescription>
          </div>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
              >
                {open ? (
                  <>Ocultar detalhes <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Ver detalhes <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent />
          </Collapsible>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="space-y-3 text-sm text-amber-900 dark:text-amber-100 pt-2 border-t border-amber-200 dark:border-amber-900/50">
            {issues.branchesWithoutEvaluations.length > 0 && (
              <section>
                <p className="font-medium mb-1">Filiais sem avaliações</p>
                <div className="flex flex-wrap gap-1.5">
                  {issues.branchesWithoutEvaluations.map(b => (
                    <Badge key={b.branchId} variant="secondary" className="font-mono">
                      {b.code || b.name}
                      {b.state ? <span className="ml-1 opacity-60">({b.state})</span> : null}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs mt-1 opacity-80">
                  Essas filiais não foram mapeadas ou a planilha não tinha coluna correspondente.
                  Re-importe mapeando ou adicione avaliações manualmente.
                </p>
              </section>
            )}

            {issues.legislationsWithoutEvaluations > 0 && (
              <section>
                <p className="font-medium mb-1">Legislações órfãs</p>
                <p className="text-xs">
                  <strong>{issues.legislationsWithoutEvaluations}</strong> legislação(ões) sem nenhuma avaliação por filial.
                  Podem ser entries vindas de imports anteriores que ficaram sem conciliação.
                </p>
              </section>
            )}

            {issues.typeCasingDuplicates.length > 0 && (
              <section>
                <p className="font-medium mb-1">Tipos de norma duplicados por formato</p>
                <ul className="space-y-1">
                  {issues.typeCasingDuplicates.slice(0, 8).map(d => (
                    <li key={d.canonical} className="text-xs">
                      <span className="font-mono opacity-70">{d.canonical}:</span>{" "}
                      {d.variants.map((v, i) => (
                        <React.Fragment key={v}>
                          <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 font-mono text-[11px]">
                            {v || "(vazio)"}
                          </code>
                          {i < d.variants.length - 1 ? " vs " : ""}
                        </React.Fragment>
                      ))}
                    </li>
                  ))}
                </ul>
                {issues.typeCasingDuplicates.length > 8 && (
                  <p className="text-xs mt-1 opacity-70">
                    ... e mais {issues.typeCasingDuplicates.length - 8} duplicata(s) similares.
                  </p>
                )}
                <p className="text-xs mt-1 opacity-80">
                  Recomendado unificar o formato (maiúsculas, espaço único, acento padrão).
                </p>
              </section>
            )}

            {issues.suspiciousDates.length > 0 && (
              <section>
                <p className="font-medium mb-1">Datas de publicação suspeitas</p>
                <ul className="space-y-1">
                  {issues.suspiciousDates.slice(0, 8).map(s => (
                    <li key={s.id} className="text-xs flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className={`shrink-0 font-mono ${
                          s.reason === "future"
                            ? "border-rose-400 text-rose-700 dark:text-rose-300"
                            : "border-amber-400 text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {formatDate(s.publicationDate)}
                      </Badge>
                      <span className="min-w-0 truncate">
                        <span className="font-mono">{s.normType}{s.normNumber ? ` ${s.normNumber}` : ""}</span>
                        <span className="opacity-70"> — {s.title.slice(0, 80)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {issues.suspiciousDates.length > 8 && (
                  <p className="text-xs mt-1 opacity-70">
                    ... e mais {issues.suspiciousDates.length - 8} data(s) suspeita(s).
                  </p>
                )}
              </section>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Alert>
  );
};
