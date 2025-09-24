import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { riskManagementService } from "@/services/riskManagement";
import { opportunitiesService } from "@/services/opportunities";
import { riskOccurrencesService } from "@/services/riskOccurrences";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export function RiskManagementDashboard() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['risk-management-stats'],
    queryFn: () => riskManagementService.getDashboardData()
  });

  const { data: opportunityMetrics, isLoading: opportunityLoading } = useQuery({
    queryKey: ['opportunity-metrics'],
    queryFn: () => opportunitiesService.getOpportunityMetrics()
  });

  const { data: occurrenceMetrics, isLoading: occurrenceLoading } = useQuery({
    queryKey: ['occurrence-metrics'],
    queryFn: () => riskOccurrencesService.getOccurrenceMetrics()
  });

  const { data: complianceStatus } = useQuery({
    queryKey: ['compliance-status'],
    queryFn: () => riskManagementService.getComplianceStatus()
  });

  const { data: upcomingReviews } = useQuery({
    queryKey: ['upcoming-reviews'],
    queryFn: () => riskManagementService.getUpcomingReviews()
  });

  if (statsLoading || opportunityLoading || occurrenceLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {};
  const oppMetrics = opportunityMetrics || {};
  const occMetrics = occurrenceMetrics || {};

  // Preparar dados para gráficos
  const riskTrendData = stats.trend || [];
  const opportunityLevelData = Object.entries(oppMetrics.byLevel || {}).map(([level, count]) => ({
    name: level,
    value: count as number
  }));

  const impactData = Object.entries(occMetrics.byImpact || {}).map(([impact, count]) => ({
    name: impact,
    value: count as number
  }));

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Riscos</p>
              <p className="text-2xl font-bold">{stats.total_risks || 0}</p>
              <p className="text-xs text-muted-foreground">
                {stats.critical_risks || 0} críticos
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
              <p className="text-2xl font-bold">{oppMetrics.total || 0}</p>
              <p className="text-xs text-muted-foreground">
                {oppMetrics.inImplementation || 0} em implementação
              </p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ocorrências (2024)</p>
              <p className="text-2xl font-bold">{occMetrics.thisYear || 0}</p>
              <p className="text-xs text-destructive">
                Impacto: R$ {(occMetrics.totalFinancialImpact || 0).toLocaleString()}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-warning" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ROI Potencial</p>
              <p className="text-2xl font-bold">{Math.round(oppMetrics.potentialROI || 0)}%</p>
              <p className="text-xs text-muted-foreground">
                Valor: R$ {(oppMetrics.totalPotentialValue || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-success" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Riscos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Riscos (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stackId="2"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Oportunidades por Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={opportunityLevelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {opportunityLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ocorrências por Impacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Ocorrências por Impacto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--warning))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status de Conformidade ISO 31000 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Conformidade ISO 31000
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Geral</span>
              <Badge variant={complianceStatus?.compliance >= 80 ? "default" : "secondary"}>
                {complianceStatus?.compliance || 0}%
              </Badge>
            </div>
            <Progress value={complianceStatus?.compliance || 0} className="w-full" />
            
            <div className="space-y-2">
              {complianceStatus?.requirements?.map((req: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{req.name}</span>
                  <Badge 
                    variant={req.status === 'Conforme' ? 'default' : req.status === 'Parcial' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revisões Pendentes */}
      {upcomingReviews && upcomingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Revisões Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReviews.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {item.risk_title || item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.type === 'risk' ? 'Risco' : 'Oportunidade'} • 
                      Revisão: {new Date(item.next_review_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {item.inherent_risk_level || item.opportunity_level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}