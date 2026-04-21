import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, BarChart3, AlertTriangle } from "lucide-react";
import { useBranchComplianceStats } from "@/hooks/useBranchComplianceStats";
import { LegislationAnalyticsKPIs } from "@/components/legislation/LegislationAnalyticsKPIs";
import { BranchComplianceRanking } from "@/components/legislation/BranchComplianceRanking";
import { TopRiskLegislations } from "@/components/legislation/TopRiskLegislations";
import { ComplianceStatusDonut } from "@/components/legislation/ComplianceStatusDonut";
import { NormTypeDistribution } from "@/components/legislation/NormTypeDistribution";
import { DataQualityBanner } from "@/components/legislation/DataQualityBanner";
import { BranchDrillDrawer } from "@/components/legislation/BranchDrillDrawer";

const JURISDICTIONS: Array<{ value: string; label: string }> = [
  { value: "federal", label: "Federal" },
  { value: "estadual", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
  { value: "nbr", label: "NBR" },
  { value: "internacional", label: "Internacional" },
];

const LegislationAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [jurisdiction, setJurisdiction] = useState<string>("federal");
  const [drillBranchId, setDrillBranchId] = useState<string | null>(null);
  const { data, isLoading, error } = useBranchComplianceStats(jurisdiction);

  const handleBranchClick = (branchId: string) => setDrillBranchId(branchId);

  const selectedBranch = drillBranchId
    ? data?.branches.find(b => b.branchId === drillBranchId) ?? null
    : null;
  const selectedFocus = drillBranchId ? data?.branchFocus[drillBranchId] ?? null : null;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Painel Analítico | Legislações</title>
        <meta
          name="description"
          content="Visão analítica de conformidade legal cruzada entre filiais"
        />
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/licenciamento/legislacoes")}
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Painel analítico
            </h1>
            <p className="text-muted-foreground mt-1">
              Comparação cruzada de conformidade legal entre filiais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Jurisdição:</span>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map(j => (
                <SelectItem key={j.value} value={j.value}>
                  {j.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falha ao carregar indicadores</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Erro desconhecido."}
          </AlertDescription>
        </Alert>
      )}

      <DataQualityBanner issues={data?.dataQuality} />

      <LegislationAnalyticsKPIs data={data} isLoading={isLoading} />

      <BranchComplianceRanking
        branches={data?.branches}
        isLoading={isLoading}
        onBranchClick={handleBranchClick}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TopRiskLegislations legislations={data?.topRiskLegislations} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <ComplianceStatusDonut totals={data?.totals} isLoading={isLoading} />
        </div>
      </div>

      <NormTypeDistribution stats={data?.normTypeStats} isLoading={isLoading} />

      <BranchDrillDrawer
        branch={selectedBranch}
        focus={selectedFocus}
        open={drillBranchId !== null}
        onOpenChange={o => {
          if (!o) setDrillBranchId(null);
        }}
      />
    </div>
  );
};

export default LegislationAnalytics;
