import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  X,
  Activity,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar
} from "lucide-react";
import { useSupplierDashboardData } from '@/hooks/useSupplierDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface Supplier {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface SupplierDashboardPanelProps {
  supplier: Supplier;
  onClose: () => void;
}

const failureTypeLabels: Record<string, string> = {
  delivery: 'Entrega',
  quality: 'Qualidade',
  document: 'Documentação',
  compliance: 'Conformidade',
  other: 'Outro'
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const severityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};

export const SupplierDashboardPanel: React.FC<SupplierDashboardPanelProps> = ({
  supplier,
  onClose
}) => {
  const { data, isLoading, error } = useSupplierDashboardData(supplier.id);

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'Válida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Vencida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Vencendo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Prepare radar chart data
  const radarData = data ? [
    { subject: 'Qualidade', value: data.performance.qualityScore, fullMark: 10 },
    { subject: 'Entrega', value: data.performance.deliveryScore, fullMark: 10 },
    { subject: 'Serviço', value: data.performance.serviceScore, fullMark: 10 },
    { subject: 'Custo', value: data.performance.costScore, fullMark: 10 },
  ] : [];

  // Prepare failure chart data
  const failureChartData = data ? Object.entries(data.incidents.byType).map(([type, count]) => ({
    name: failureTypeLabels[type] || type,
    value: count
  })) : [];

  const barColors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{supplier.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar dados do fornecedor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{supplier.name}</h2>
          <p className="text-muted-foreground">
            {supplier.type} • Status: <span className="capitalize">{supplier.status}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Contratos Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.contracts.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.contracts.expiring ? `${data.contracts.expiring} vencendo em 30 dias` : 'Nenhum vencendo'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.contracts.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Em {data?.contracts.total || 0} contrato(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.performance.overallScore?.toFixed(1) || '0.0'}/10
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.performance.lastEvaluation 
                    ? `Última: ${format(new Date(data.performance.lastEvaluation), 'dd/MM/yyyy', { locale: ptBR })}`
                    : 'Sem avaliações'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Incidentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes (12 meses)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.incidents.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.incidents.critical ? `${data.incidents.critical} crítico(s)` : 'Nenhum crítico'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : data?.performance.overallScore ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhuma avaliação de performance registrada.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Falhas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : failureChartData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={failureChartData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {failureChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                    <p className="text-sm">Nenhuma falha registrada nos últimos 12 meses.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score breakdown */}
          {data?.performance.overallScore ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento dos Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Qualidade', value: data.performance.qualityScore },
                  { label: 'Entrega', value: data.performance.deliveryScore },
                  { label: 'Serviço', value: data.performance.serviceScore },
                  { label: 'Custo', value: data.performance.costScore },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value?.toFixed(1) || '0.0'}/10</span>
                    </div>
                    <Progress value={(item.value || 0) * 10} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status da Licença</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={getLicenseStatusColor(data?.compliance.licenseStatus || '')}>
                        {data?.compliance.licenseStatus || 'Não informada'}
                      </Badge>
                    </div>
                    {data?.compliance.licenseExpiry && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Validade</span>
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(data.compliance.licenseExpiry), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Aprovados
                      </span>
                      <span className="font-medium">{data?.compliance.documentsApproved || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Pendentes
                      </span>
                      <span className="font-medium">{data?.compliance.documentsPending || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Vencidos
                      </span>
                      <span className="font-medium">{data?.compliance.documentsExpired || 0}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-medium">{data?.compliance.documentsTotal || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Compliance score indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Índice de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const total = data?.compliance.documentsTotal || 0;
                    const approved = data?.compliance.documentsApproved || 0;
                    const score = total > 0 ? (approved / total) * 100 : 0;
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Documentos em conformidade</span>
                          <span className="font-medium">{score.toFixed(0)}%</span>
                        </div>
                        <Progress value={score} className="h-3" />
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : data?.history.failures.length ? (
                <div className="space-y-3">
                  {data.history.failures.map((failure) => (
                    <div 
                      key={failure.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {failureTypeLabels[failure.type] || failure.type}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={severityColors[failure.severity]}
                          >
                            {severityLabels[failure.severity] || failure.severity}
                          </Badge>
                        </div>
                        {failure.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {failure.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(failure.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="text-sm">Nenhuma falha registrada nos últimos 12 meses.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : data?.history.evaluations.length ? (
                <div className="space-y-2">
                  {data.history.evaluations.map((evaluation) => (
                    <div 
                      key={evaluation.id} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(evaluation.date), "MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {evaluation.overallScore.toFixed(1)}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhuma avaliação registrada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
