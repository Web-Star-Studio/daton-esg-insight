import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { useLegislationStats } from "@/hooks/data/useLegislations";

const APPLICABILITY_COLORS: Record<string, string> = {
  real: '#ec4899',
  potential: '#f59e0b',
  revoked: '#6b7280',
  na: '#94a3b8',
  pending: '#fbbf24',
};

const APPLICABILITY_LABELS: Record<string, string> = {
  real: 'Real',
  potential: 'Potencial',
  revoked: 'Revogada',
  na: 'N/A',
  pending: 'Pendente',
};

const STATUS_COLORS: Record<string, string> = {
  conforme: '#22c55e',
  para_conhecimento: '#3b82f6',
  adequacao: '#f59e0b',
  plano_acao: '#ef4444',
  pending: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  conforme: 'Conforme',
  para_conhecimento: 'Conhecimento',
  adequacao: 'Adequação',
  plano_acao: 'Plano Ação',
  pending: 'Pendente',
};

const JURISDICTION_COLORS: Record<string, string> = {
  federal: '#6366f1',
  estadual: '#8b5cf6',
  municipal: '#a855f7',
  nbr: '#14b8a6',
  internacional: '#06b6d4',
};

const JURISDICTION_LABELS: Record<string, string> = {
  federal: 'Federal',
  estadual: 'Estadual',
  municipal: 'Municipal',
  nbr: 'NBR',
  internacional: 'Internacional',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">
          Qtd: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Compact Compliance Donut Chart
const CompactComplianceChart: React.FC<{ stats: any }> = ({ stats }) => {
  const realCount = stats?.byApplicability?.real || 0;
  const conformeCount = stats?.byStatus?.conforme || 0;
  const nonConformeCount = Math.max(0, realCount - conformeCount);
  const conformePercentage = realCount > 0 ? Math.round((conformeCount / realCount) * 100) : 0;

  const data = [
    { name: 'Conforme', value: conformeCount, color: '#22c55e' },
    { name: 'Não Conforme', value: nonConformeCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (realCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Conformidade</h4>
      <div className="relative">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{conformePercentage}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {conformeCount}/{realCount} reais
      </p>
    </div>
  );
};

// Compact Status List with Progress Bars
const CompactStatusChart: React.FC<{ stats: any }> = ({ stats }) => {
  const data = Object.entries(stats?.byStatus || {})
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value: value as number,
      color: STATUS_COLORS[key] || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">Por Status</h4>
      <div className="flex flex-col gap-2.5 flex-1 justify-center px-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 truncate" title={item.name}>
              {item.name}
            </span>
            <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-xs font-semibold w-6 text-right tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Compact Applicability Pie Chart
const CompactApplicabilityChart: React.FC<{ stats: any }> = ({ stats }) => {
  const data = Object.entries(stats?.byApplicability || {})
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: APPLICABILITY_LABELS[key] || key,
      value: value as number,
      color: APPLICABILITY_COLORS[key] || '#6b7280',
    }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Aplicabilidade</h4>
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={50}
            dataKey="value"
            label={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-1">
        {data.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Compact Jurisdiction Pie Chart
const CompactJurisdictionChart: React.FC<{ stats: any }> = ({ stats }) => {
  const data = Object.entries(stats?.byJurisdiction || {})
    .filter(([_, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      name: JURISDICTION_LABELS[key] || key,
      value: value as number,
      color: JURISDICTION_COLORS[key] || '#6b7280',
    }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Sem dados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Jurisdição</h4>
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={50}
            dataKey="value"
            label={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-1">
        {data.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LegislationDashboardCharts: React.FC = () => {
  const { data: stats, isLoading } = useLegislationStats();
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dashboard de Conformidade
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center min-h-[180px]">
                <CompactComplianceChart stats={stats} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 min-h-[180px]">
                <CompactStatusChart stats={stats} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center min-h-[180px]">
                <CompactApplicabilityChart stats={stats} />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center min-h-[180px]">
                <CompactJurisdictionChart stats={stats} />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
