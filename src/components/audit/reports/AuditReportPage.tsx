/**
 * AuditReportPage - Página completa de relatório da auditoria
 */

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditReport } from "@/hooks/audit/useReports";
import { ReportSummaryCard } from "./ReportSummaryCard";
import { SessionsReportTable } from "./SessionsReportTable";
import { OccurrencesReportTable } from "./OccurrencesReportTable";
import { ConformityChart } from "./ConformityChart";
import { ExportButtons } from "./ExportButtons";
import { ScoreCard } from "../scoring/ScoreCard";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface AuditReportPageProps {
  auditId: string;
  onBack?: () => void;
}

export function AuditReportPage({ auditId, onBack }: AuditReportPageProps) {
  const { data: reportData, isLoading, refetch, isRefetching } = useAuditReport(auditId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Não foi possível carregar o relatório</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Relatório de Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Gerado em {new Date(reportData.generatedAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <ExportButtons reportData={reportData} />
        </div>
      </div>

      {/* Summary */}
      <ReportSummaryCard data={reportData} />

      {/* Score and Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard
          totalScore={reportData.scoring?.total_score || 0}
          maxScore={reportData.scoring?.max_possible_score || 100}
          percentage={reportData.scoring?.percentage || 0}
          conformingItems={reportData.scoring?.conforming_items || 0}
          nonConformingItems={reportData.scoring?.non_conforming_items || 0}
          partialItems={reportData.scoring?.partial_items || 0}
          naItems={reportData.scoring?.na_items || 0}
          totalItems={reportData.scoring?.total_items || 0}
          respondedItems={reportData.scoring?.responded_items || 0}
          grade={reportData.scoring?.grade}
          status={reportData.scoring?.status}
        />
        <ConformityChart scoring={reportData.scoring} />
      </div>

      {/* Sessions */}
      <SessionsReportTable sessions={reportData.sessions} />

      {/* Occurrences */}
      <OccurrencesReportTable occurrences={reportData.occurrences} />

      {/* Standards */}
      {reportData.standards.length > 0 && (
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Normas Aplicadas</h3>
          <div className="flex flex-wrap gap-2">
            {reportData.standards.map((std) => (
              <span 
                key={std.id}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {std.name} {std.version && `(${std.version})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
