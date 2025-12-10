import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { AlertTriangle, CheckCircle, Clock, FileText, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UnitComplianceStats } from "@/hooks/useUnitComplianceStats";

interface UnitComplianceChartsProps {
  stats: UnitComplianceStats;
  branchName: string;
}

const STATUS_COLORS: Record<string, string> = {
  conforme: "#22c55e",
  para_conhecimento: "#3b82f6",
  adequacao: "#f59e0b",
  plano_acao: "#ef4444",
  pending: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  conforme: "Conforme",
  para_conhecimento: "Para Conhecimento",
  adequacao: "Em Adequação",
  plano_acao: "Plano de Ação",
  pending: "Pendente",
};

const APPLICABILITY_COLORS: Record<string, string> = {
  real: "#ec4899",
  potential: "#8b5cf6",
  na: "#9ca3af",
  revoked: "#64748b",
};

const APPLICABILITY_LABELS: Record<string, string> = {
  real: "Real",
  potential: "Potencial",
  na: "Não Aplicável",
  revoked: "Revogada",
};

export const UnitComplianceSummaryCard: React.FC<UnitComplianceChartsProps> = ({ stats, branchName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Resumo - {branchName}
        </CardTitle>
        <CardDescription>Visão geral da conformidade legal da unidade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Total Avaliadas</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg text-center">
            <p className="text-sm text-green-700 dark:text-green-300">Taxa de Conformidade</p>
            <p className="text-3xl font-bold text-green-600">{stats.complianceRate}%</p>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-lg text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">Pendências</p>
            <p className="text-3xl font-bold text-amber-600">{stats.pendencias.length}</p>
          </div>
          <div className="bg-destructive/10 p-4 rounded-lg text-center">
            <p className="text-sm text-destructive">Planos de Ação</p>
            <p className="text-3xl font-bold text-destructive">{stats.planosAcao.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UnitStatusPieChart: React.FC<{ stats: UnitComplianceStats }> = ({ stats }) => {
  const data = Object.entries(stats.byStatus)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#9ca3af",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {data.map((entry, index) => (
            <Badge 
              key={index} 
              variant="outline"
              style={{ borderColor: entry.color, color: entry.color }}
            >
              {entry.name}: {entry.value}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const UnitApplicabilityChart: React.FC<{ stats: UnitComplianceStats }> = ({ stats }) => {
  const data = Object.entries(stats.byApplicability)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: APPLICABILITY_LABELS[key] || key,
      value,
      color: APPLICABILITY_COLORS[key] || "#9ca3af",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por Aplicabilidade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const UnitPendingRequirementsTable: React.FC<{ pendencias: UnitComplianceStats['pendencias'] }> = ({ pendencias }) => {
  if (pendencias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Pendências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
            Nenhuma pendência registrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Pendências ({pendencias.length})
        </CardTitle>
        <CardDescription>Requisitos pendentes de atendimento</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Norma</TableHead>
              <TableHead>Legislação</TableHead>
              <TableHead>Pendência</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendencias.slice(0, 10).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.norm_number}</TableCell>
                <TableCell className="max-w-[200px] truncate">{p.legislation_title}</TableCell>
                <TableCell className="max-w-[300px] truncate">{p.pending_requirements}</TableCell>
                <TableCell>{p.responsible_user_name || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pendencias.length > 10 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Mostrando 10 de {pendencias.length} pendências
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const UnitActionPlansTable: React.FC<{ planosAcao: UnitComplianceStats['planosAcao'] }> = ({ planosAcao }) => {
  if (planosAcao.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-5 w-5 text-primary" />
            Planos de Ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
            Nenhum plano de ação em andamento
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-5 w-5 text-destructive" />
          Planos de Ação ({planosAcao.length})
        </CardTitle>
        <CardDescription>Ações corretivas em andamento</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Norma</TableHead>
              <TableHead>Legislação</TableHead>
              <TableHead>Plano de Ação</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planosAcao.slice(0, 10).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.norm_number}</TableCell>
                <TableCell className="max-w-[180px] truncate">{p.legislation_title}</TableCell>
                <TableCell className="max-w-[250px] truncate">{p.action_plan}</TableCell>
                <TableCell>
                  {p.deadline ? (
                    <Badge variant={isOverdue(p.deadline) ? "destructive" : "outline"}>
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(p.deadline), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>{p.responsible_user_name || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {planosAcao.length > 10 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Mostrando 10 de {planosAcao.length} planos de ação
          </p>
        )}
      </CardContent>
    </Card>
  );
};
