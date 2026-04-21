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

// Envolve em aspas e mostra espaços/quebras invisíveis como "·" pra ficar
// óbvio o que diferencia variantes como "PORTARIA IBAMA" vs "PORTARIA  IBAMA".
const renderWhitespace = (s: string): string => {
  if (!s) return "(vazio)";
  return `"${s.replace(/ /g, "·").replace(/\t/g, "→").replace(/\r?\n/g, "↵")}"`;
};

export const DataQualityBanner: React.FC<Props> = ({ issues }) => {
  const [open, setOpen] = useState(false);

  if (!issues || !issues.hasAny) return null;

  const categoryCount = [
    issues.branchesWithoutEvaluations.length,
    issues.legislationsWithoutEvaluations,
    issues.typeCasingDuplicates.length,
    issues.suspiciousDates.length,
  ].filter(n => n > 0).length;

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/60">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              {categoryCount === 1
                ? "Dado precisa de atenção em 1 ponto"
                : `Dado precisa de atenção em ${categoryCount} pontos`}
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 flex flex-wrap gap-2 mt-1">
              {issues.branchesWithoutEvaluations.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.branchesWithoutEvaluations.length} filial{issues.branchesWithoutEvaluations.length !== 1 ? "is" : ""} sem avaliações
                </Badge>
              )}
              {issues.legislationsWithoutEvaluations > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.legislationsWithoutEvaluations} norma{issues.legislationsWithoutEvaluations !== 1 ? "s" : ""} nunca avaliada{issues.legislationsWithoutEvaluations !== 1 ? "s" : ""}
                </Badge>
              )}
              {issues.typeCasingDuplicates.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.typeCasingDuplicates.length} tipo{issues.typeCasingDuplicates.length !== 1 ? "s" : ""} com formatos diferentes
                </Badge>
              )}
              {issues.suspiciousDates.length > 0 && (
                <Badge variant="outline" className="border-amber-400 text-amber-900 dark:text-amber-100">
                  {issues.suspiciousDates.length} data{issues.suspiciousDates.length !== 1 ? "s" : ""} impossível{issues.suspiciousDates.length !== 1 ? "is" : ""}
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
                <p className="font-medium mb-1">Normas nunca avaliadas</p>
                <p className="text-xs">
                  <strong>{issues.legislationsWithoutEvaluations}</strong> legislação(ões) ainda não tem nenhuma
                  avaliação registrada em qualquer filial. Pode significar imports antigos sem mapeamento
                  ou normas cadastradas manualmente que ainda não foram revisadas.
                </p>
              </section>
            )}

            {issues.typeCasingDuplicates.length > 0 && (
              <section>
                <p className="font-medium mb-1">Tipos com formatos diferentes</p>
                <p className="text-xs opacity-80 mb-1.5">
                  O mesmo tipo aparece com grafias distintas (maiúscula/minúscula, espaço duplo, acento).
                  Espaços invisíveis são marcados com <code>·</code>. Padronizar ajuda a agrupar corretamente.
                </p>
                <ul className="space-y-1">
                  {issues.typeCasingDuplicates.slice(0, 8).map(d => (
                    <li key={d.canonical} className="text-xs flex flex-wrap items-center gap-1.5">
                      {d.variants.map(v => (
                        <code
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 font-mono text-[11px]"
                        >
                          {renderWhitespace(v)}
                        </code>
                      ))}
                    </li>
                  ))}
                </ul>
                {issues.typeCasingDuplicates.length > 8 && (
                  <p className="text-xs mt-1 opacity-70">
                    ... e mais {issues.typeCasingDuplicates.length - 8} grupo(s).
                  </p>
                )}
              </section>
            )}

            {issues.suspiciousDates.length > 0 && (
              <section>
                <p className="font-medium mb-1">Datas de publicação impossíveis</p>
                <p className="text-xs opacity-80 mb-1.5">
                  Datas no futuro ou anteriores a 1900 — geralmente vêm de erros de digitação na planilha
                  (ex.: ano &quot;34&quot; interpretado como 2034 em vez de 1934).
                </p>
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
