import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useLAIAAssessments, useLAIADashboardStats } from "@/hooks/useLAIA";
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Eye,
  Filter,
  Leaf,
  X
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { LAIAAssessment } from "@/types/laia";

export interface LAIADashboardFilters {
  category?: string;
  significance?: string;
  temporality?: string;
  operational_situation?: string;
  incidence?: string;
  impact_class?: string;
}

interface LAIADashboardProps {
  branchId?: string;
  onCardClick?: (filter?: LAIADashboardFilters) => void;
  onAssessmentClick?: (assessment: LAIAAssessment) => void;
}

type CharacterizationDimension = "temporality" | "operational_situation" | "incidence" | "impact_class";

const CHARACTERIZATION_LABELS: Record<CharacterizationDimension, Record<string, string>> = {
  temporality: {
    passada: "Passada",
    atual: "Atual",
    futura: "Futura",
  },
  operational_situation: {
    normal: "Normal",
    anormal: "Anormal",
    emergencia: "Emergência",
  },
  incidence: {
    direto: "Direto",
    indireto: "Indireto",
  },
  impact_class: {
    benefico: "Benéfico",
    adverso: "Adverso",
  },
};

const CHARACTERIZATION_TITLES: Record<CharacterizationDimension, string> = {
  temporality: "Temporalidade",
  operational_situation: "Situação Operacional",
  incidence: "Incidência",
  impact_class: "Classe de Impacto",
};

const getCharacterizationLabel = (dimension: CharacterizationDimension, value: string) => {
  return CHARACTERIZATION_LABELS[dimension][value] ?? value;
};

const CHART_COLORS = {
  temporality: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'],
  operational_situation: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))'],
  incidence: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'],
  impact_class: ['hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)'], // green / red
};

function CharacterizationChart({ 
  title, 
  dimension,
  data, 
  colors,
  selectedValue,
  onSelect,
}: { 
  title: string; 
  dimension: CharacterizationDimension;
  data: { name: string; value: number }[]; 
  colors: string[];
  selectedValue?: string;
  onSelect: (dimension: CharacterizationDimension, value: string) => void;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={70}
                innerRadius={30}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) => onSelect(dimension, entry.name)}
                className="cursor-pointer outline-none"
              >
                {data.map((item, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    opacity={!selectedValue || selectedValue === item.name ? 1 : 0.35}
                    stroke={selectedValue === item.name ? "hsl(var(--foreground))" : "hsl(var(--background))"}
                    strokeWidth={selectedValue === item.name ? 3 : 2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={(value: number) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  'Avaliações'
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{getCharacterizationLabel(dimension, String(value))}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DrillDownList({
  selected,
  assessments,
  onClear,
  onAssessmentClick,
}: {
  selected: { dimension: CharacterizationDimension; value: string };
  assessments: LAIAAssessment[];
  onClear: () => void;
  onAssessmentClick?: (assessment: LAIAAssessment) => void;
}) {
  const dimensionLabel = CHARACTERIZATION_TITLES[selected.dimension];
  const valueLabel = getCharacterizationLabel(selected.dimension, selected.value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {dimensionLabel}: {valueLabel}
          </CardTitle>
          <CardDescription>
            {assessments.length} avaliação(ões) compondo o recorte selecionado
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Limpar seleção">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px] pr-3">
          <div className="space-y-2">
            {assessments.map((assessment) => (
              <button
                key={assessment.id}
                type="button"
                onClick={() => onAssessmentClick?.(assessment)}
                className="w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{assessment.aspect_code}</Badge>
                      {assessment.sector?.name && <Badge variant="secondary">{assessment.sector.name}</Badge>}
                    </div>
                    <p className="font-medium text-foreground">{assessment.environmental_aspect}</p>
                    <p className="text-sm text-muted-foreground">{assessment.environmental_impact}</p>
                    <p className="text-xs text-muted-foreground">{assessment.activity_operation}</p>
                  </div>
                  <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function LAIADashboard({ branchId, onCardClick, onAssessmentClick }: LAIADashboardProps) {
  const { data: stats, isLoading, error } = useLAIADashboardStats(branchId);
  const { data: assessments = [] } = useLAIAAssessments({ branch_id: branchId, status: "ativo" });
  const [selectedDrillDown, setSelectedDrillDown] = useState<{ dimension: CharacterizationDimension; value: string } | null>(null);

  const drillDownAssessments = useMemo(() => {
    if (!selectedDrillDown) return [];
    return assessments.filter((assessment) => assessment[selectedDrillDown.dimension] === selectedDrillDown.value);
  }, [assessments, selectedDrillDown]);

  const handleChartSelect = (dimension: CharacterizationDimension, value: string) => {
    setSelectedDrillDown((current) => (
      current?.dimension === dimension && current.value === value ? null : { dimension, value }
    ));
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onCardClick?.()}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aspectos</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Aspectos ambientais cadastrados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onCardClick?.({ significance: "significativo" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Significativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.significativos}</div>
            <p className="text-xs text-muted-foreground">
              Requerem ação/controle
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onCardClick?.({ category: "critico" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.criticos}</div>
            <p className="text-xs text-muted-foreground">
              Prioridade máxima
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onCardClick?.({ significance: "nao_significativo" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Significativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.nao_significativos}</div>
            <p className="text-xs text-muted-foreground">
              Sob controle adequado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Characterization Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <CharacterizationChart 
          title="Temporalidade" 
          data={stats.by_temporality} 
          colors={CHART_COLORS.temporality} 
        />
        <CharacterizationChart 
          title="Situação Operacional" 
          data={stats.by_operational_situation} 
          colors={CHART_COLORS.operational_situation} 
        />
        <CharacterizationChart 
          title="Incidência" 
          data={stats.by_incidence} 
          colors={CHART_COLORS.incidence} 
        />
        <CharacterizationChart 
          title="Classe de Impacto" 
          data={stats.by_impact_class} 
          colors={CHART_COLORS.impact_class} 
        />
      </div>
    </div>
  );
}
