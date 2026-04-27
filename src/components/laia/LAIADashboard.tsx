import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLAIAAssessments, useLAIADashboardStats } from "@/hooks/useLAIA";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Leaf,
  X,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  IMPACT_CLASS_OPTIONS,
  INCIDENCE_OPTIONS,
  OPERATIONAL_SITUATION_OPTIONS,
  TEMPORALITY_OPTIONS,
  getCategoryColor,
  getSignificanceColor,
} from "@/types/laia";
import type { LAIAAssessment } from "@/types/laia";

export interface LAIADashboardFilters {
  category?: string;
  significance?: string;
}

interface LAIADashboardProps {
  branchId?: string;
  onCardClick?: (filter?: LAIADashboardFilters) => void;
  onAssessmentClick?: (assessment: LAIAAssessment) => void;
}

const CHART_COLORS = {
  temporality: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'],
  operational_situation: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))'],
  incidence: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'],
  impact_class: ['hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)'], // green / red
};

type CharacterizationField = 'temporality' | 'operational_situation' | 'incidence' | 'impact_class';

function buildLabelMap(options: ReadonlyArray<{ value: string; label: string }>): Record<string, string> {
  return options.reduce<Record<string, string>>((acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  }, {});
}

const FIELD_LABELS: Record<CharacterizationField, Record<string, string>> = {
  temporality: buildLabelMap(TEMPORALITY_OPTIONS),
  operational_situation: buildLabelMap(OPERATIONAL_SITUATION_OPTIONS),
  incidence: buildLabelMap(INCIDENCE_OPTIONS),
  impact_class: buildLabelMap(IMPACT_CLASS_OPTIONS),
};

function CharacterizationChart({
  title,
  data,
  colors,
  field,
  assessments,
  onItemClick,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  field: CharacterizationField;
  assessments: LAIAAssessment[];
  onItemClick?: (assessment: LAIAAssessment) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const labelMap = FIELD_LABELS[field];

  const filteredItems = useMemo(() => {
    if (!selectedKey) return [];
    return assessments.filter(a => String(a[field] ?? '') === selectedKey);
  }, [selectedKey, assessments, field]);

  const handleSliceClick = (entry: any) => {
    const key = entry?.name ?? entry?.value;
    if (typeof key !== 'string' || !key) return;
    setSelectedKey(prev => (prev === key ? null : key));
  };

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

  const tooltipFormatter = (value: number, _name: string, payload: any) => {
    const rawName = payload?.payload?.name ?? '';
    const niceName = labelMap[rawName] ?? rawName;
    return [`${value} (${((value / total) * 100).toFixed(1)}%)`, niceName];
  };

  const legendFormatter = (value: string) => (
    <span className="text-xs text-muted-foreground">{labelMap[value] ?? value}</span>
  );

  const selectedLabel = selectedKey ? (labelMap[selectedKey] ?? selectedKey) : null;

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
                onClick={handleSliceClick}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => {
                  const isSelected = selectedKey === entry.name;
                  const isDimmed = selectedKey !== null && !isSelected;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={isDimmed ? 0.35 : 1}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={tooltipFormatter}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                onClick={handleSliceClick as any}
                formatter={legendFormatter}
                wrapperStyle={{ cursor: 'pointer' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {selectedKey && (
          <div className="mt-3 border-t pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{selectedLabel}</span>
                <Badge variant="secondary" className="font-normal">
                  {filteredItems.length} {filteredItems.length === 1 ? 'avaliação' : 'avaliações'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setSelectedKey(null)}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Nenhuma avaliação encontrada para esta categoria.
              </p>
            ) : (
              <ul className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
                {filteredItems.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onItemClick?.(item)}
                      className="w-full text-left rounded-md border border-border/50 px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                              {item.aspect_code}
                            </span>
                            {item.sector?.code && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                · {item.sector.code}
                              </span>
                            )}
                          </div>
                          <p className="font-medium truncate">{item.environmental_aspect}</p>
                          <p className="text-muted-foreground truncate">
                            {item.activity_operation}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getSignificanceColor(item.significance)}`}
                          >
                            {item.significance === 'significativo' ? 'Sig.' : 'Não sig.'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getCategoryColor(item.category)}`}
                          >
                            {item.category}
                          </Badge>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LAIADashboard({ branchId, onCardClick, onAssessmentClick }: LAIADashboardProps) {
  const { data: stats, isLoading, error } = useLAIADashboardStats(branchId);
  const { data: assessments } = useLAIAAssessments(branchId ? { branch_id: branchId } : undefined);
  const assessmentList = assessments ?? [];

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
      <div className="grid gap-4 md:grid-cols-2 items-start">
        <CharacterizationChart
          title="Temporalidade"
          data={stats.by_temporality}
          colors={CHART_COLORS.temporality}
          field="temporality"
          assessments={assessmentList}
          onItemClick={onAssessmentClick}
        />
        <CharacterizationChart
          title="Situação Operacional"
          data={stats.by_operational_situation}
          colors={CHART_COLORS.operational_situation}
          field="operational_situation"
          assessments={assessmentList}
          onItemClick={onAssessmentClick}
        />
        <CharacterizationChart
          title="Incidência"
          data={stats.by_incidence}
          colors={CHART_COLORS.incidence}
          field="incidence"
          assessments={assessmentList}
          onItemClick={onAssessmentClick}
        />
        <CharacterizationChart
          title="Classe de Impacto"
          data={stats.by_impact_class}
          colors={CHART_COLORS.impact_class}
          field="impact_class"
          assessments={assessmentList}
          onItemClick={onAssessmentClick}
        />
      </div>
    </div>
  );
}
