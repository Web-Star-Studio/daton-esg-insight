import React from "react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface LegislationStats {
  total: number;
  byApplicability: Record<string, number>;
  byStatus: Record<string, number>;
  byJurisdiction: Record<string, number>;
  alerts: number;
}

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
  para_conhecimento: 'Para Conhecimento',
  adequacao: 'Em Adequação',
  plano_acao: 'Plano de Ação',
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

// Custom tooltip for pie charts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          Quantidade: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ApplicabilityPieChart: React.FC<{ stats: LegislationStats }> = ({ stats }) => {
  const data: ChartData[] = Object.entries(stats.byApplicability)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: APPLICABILITY_LABELS[key] || key,
      value,
      color: APPLICABILITY_COLORS[key] || '#6b7280',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Aplicabilidade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Aplicabilidade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const StatusBarChart: React.FC<{ stats: LegislationStats }> = ({ stats }) => {
  const data = Object.entries(stats.byStatus)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      fill: STATUS_COLORS[key] || '#6b7280',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const JurisdictionPieChart: React.FC<{ stats: LegislationStats }> = ({ stats }) => {
  const data: ChartData[] = Object.entries(stats.byJurisdiction)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: JURISDICTION_LABELS[key] || key,
      value,
      color: JURISDICTION_COLORS[key] || '#6b7280',
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por Jurisdição</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Jurisdição</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ComplianceOverviewChart: React.FC<{ stats: LegislationStats }> = ({ stats }) => {
  const realCount = stats.byApplicability.real || 0;
  const conformeCount = stats.byStatus.conforme || 0;
  const nonConformeCount = realCount - conformeCount;

  const data = [
    { name: 'Conforme', value: conformeCount, color: '#22c55e' },
    { name: 'Não Conforme', value: Math.max(0, nonConformeCount), color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (data.length === 0 || realCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Índice de Conformidade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const conformePercentage = realCount > 0 ? Math.round((conformeCount / realCount) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Índice de Conformidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">{conformePercentage}%</p>
            <p className="text-sm text-muted-foreground">de conformidade</p>
            <p className="text-xs text-muted-foreground mt-2">
              {conformeCount} de {realCount} legislações reais
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AlertsSummaryCard: React.FC<{ stats: LegislationStats }> = ({ stats }) => {
  return (
    <Card className={stats.alerts > 0 ? 'border-destructive/50' : ''}>
      <CardHeader>
        <CardTitle className="text-lg">Alertas Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[150px]">
          <div className="text-center">
            <p className={`text-5xl font-bold ${stats.alerts > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {stats.alerts}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.alerts === 0 
                ? 'Nenhum alerta ativo' 
                : stats.alerts === 1 
                  ? 'legislação requer atenção'
                  : 'legislações requerem atenção'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
