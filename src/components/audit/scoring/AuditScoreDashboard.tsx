/**
 * AuditScoreDashboard - Dashboard completo de pontuação da auditoria
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreCard } from "./ScoreCard";
import { OccurrenceSummary } from "./OccurrenceSummary";
import { ScoringConfigPanel } from "./ScoringConfigPanel";
import { useScoringConfig, useScoringResult, useCalculateScore, useUpdateScoringConfig } from "@/hooks/audit/useScoring";
import { Calculator, RefreshCw, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditScoreDashboardProps {
  auditId: string;
  companyId: string;
}

export function AuditScoreDashboard({ auditId, companyId }: AuditScoreDashboardProps) {
  const [activeTab, setActiveTab] = useState("score");
  
  const { data: config, isLoading: loadingConfig } = useScoringConfig(auditId);
  const { data: result, isLoading: loadingResult } = useScoringResult(auditId);
  const calculateScore = useCalculateScore();
  const updateConfig = useUpdateScoringConfig();

  const handleCalculate = () => {
    calculateScore.mutate(auditId);
  };

  const handleSaveConfig = (configData: any) => {
    updateConfig.mutate({
      auditId,
      companyId,
      config: configData
    });
  };

  if (loadingConfig || loadingResult) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pontuação & Resultados</h2>
        <Button onClick={handleCalculate} disabled={calculateScore.isPending}>
          {calculateScore.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Recalcular Pontuação
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="score">Pontuação</TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-1" />
            Configuração
          </TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ScoreCard
              totalScore={result?.total_score || 0}
              maxScore={result?.max_possible_score || 100}
              percentage={result?.percentage || 0}
              conformingItems={result?.conforming_items || 0}
              nonConformingItems={result?.non_conforming_items || 0}
              partialItems={result?.partial_items || 0}
              naItems={result?.na_items || 0}
              totalItems={result?.total_items || 0}
              respondedItems={result?.responded_items || 0}
              grade={result?.grade}
              status={result?.status}
            />

            <OccurrenceSummary
              ncMajorCount={result?.nc_major_count || 0}
              ncMinorCount={result?.nc_minor_count || 0}
              observationCount={result?.observation_count || 0}
              opportunityCount={result?.opportunity_count || 0}
              ncMajorPenalty={config?.nc_major_penalty}
              ncMinorPenalty={config?.nc_minor_penalty}
              observationPenalty={config?.observation_penalty}
              opportunityBonus={config?.opportunity_bonus}
            />
          </div>

          {/* Info de última atualização */}
          {result?.calculated_at && (
            <p className="text-sm text-muted-foreground text-center">
              Última atualização: {new Date(result.calculated_at).toLocaleString('pt-BR')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <ScoringConfigPanel
            config={config}
            onSave={handleSaveConfig}
            isSaving={updateConfig.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
