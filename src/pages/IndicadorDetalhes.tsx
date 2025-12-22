import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, FileDown, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, ClipboardList } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { IndicatorActionPlanModal } from "@/components/indicators/IndicatorActionPlanModal";
import { IndicatorExportModal } from "@/components/indicators/IndicatorExportModal";
import { ExtendedQualityIndicator, IndicatorPeriodData } from "@/services/indicatorManagement";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function IndicadorDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showActionPlanModal, setShowActionPlanModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedYear] = useState(new Date().getFullYear());

  // Fetch indicator with all data
  const { data: indicator, isLoading, error: queryError } = useQuery({
    queryKey: ['indicator-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_indicators')
        .select(`
          *,
          indicator_groups(*),
          indicator_targets(*),
          indicator_period_data(*)
        `)
        .eq('id', id!)
        .maybeSingle();

      if (error) {
        console.error('Error fetching indicator:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      // Fetch responsible user name separately if exists
      let responsibleName: string | null = null;
      if (data.responsible_user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.responsible_user_id)
          .maybeSingle();
        responsibleName = profile?.full_name || null;
      }

      const target = data.indicator_targets?.find((t: any) => t.target_year === selectedYear);
      
      return {
        ...data,
        direction: data.direction || 'higher_better',
        auto_analysis: data.auto_analysis || false,
        status: data.status || 'active',
        unit: data.measurement_unit,
        target_value: target?.target_value,
        tolerance_value: target?.tolerance_upper,
        indicator_group: data.indicator_groups,
        responsible_name: responsibleName,
        period_data: (data.indicator_period_data || [])
          .filter((pd: any) => pd.period_year === selectedYear)
          .map((pd: any) => ({
            ...pd,
            year: pd.period_year,
            month: pd.period_month,
            observation: pd.notes
          }))
      } as ExtendedQualityIndicator;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!indicator) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Indicador não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/gestao-indicadores')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const chartData = MONTHS.map((monthName, index) => {
    const monthData = indicator.period_data?.find(pd => pd.month === index + 1);
    return {
      month: monthName,
      valor: monthData?.measured_value ?? null,
      meta: indicator.target_value,
      toleranciaSuperior: indicator.target_value && indicator.tolerance_value 
        ? (indicator.direction === 'higher_better' 
          ? indicator.target_value - indicator.tolerance_value 
          : indicator.target_value + indicator.tolerance_value)
        : null,
      toleranciaInferior: indicator.target_value && indicator.tolerance_value 
        ? (indicator.direction === 'higher_better' 
          ? indicator.target_value + indicator.tolerance_value 
          : indicator.target_value - indicator.tolerance_value)
        : null,
      status: monthData?.status || 'pending'
    };
  });

  // Calculate stats
  const collectedMonths = indicator.period_data?.filter(pd => pd.measured_value !== null) || [];
  const completionRate = Math.round((collectedMonths.length / 12) * 100);
  const avgValue = collectedMonths.length > 0 
    ? collectedMonths.reduce((sum, pd) => sum + (pd.measured_value || 0), 0) / collectedMonths.length
    : null;
  
  const lastValue = collectedMonths.length > 0 
    ? collectedMonths[collectedMonths.length - 1].measured_value 
    : null;
  
  const previousValue = collectedMonths.length > 1 
    ? collectedMonths[collectedMonths.length - 2].measured_value 
    : null;

  const variation = previousValue && lastValue 
    ? ((lastValue - previousValue) / previousValue) * 100 
    : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_target':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Na Meta</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Atenção</Badge>;
      case 'critical':
        return <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" /> Crítico</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
    }
  };

  const getDirectionIcon = () => {
    if (indicator.direction === 'higher_better') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (indicator.direction === 'lower_better') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-blue-500" />;
  };

  const criticalMonths = indicator.period_data?.filter(pd => pd.status === 'critical') || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/gestao-indicadores')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{indicator.name}</h1>
              {indicator.code && (
                <Badge variant="outline">{indicator.code}</Badge>
              )}
              {getStatusBadge(indicator.status)}
            </div>
            <p className="text-muted-foreground">{indicator.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" onClick={() => navigate(`/gestao-indicadores?edit=${id}`)}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
          {criticalMonths.length > 0 && (
            <Button onClick={() => setShowActionPlanModal(true)}>
              <ClipboardList className="h-4 w-4 mr-2" /> Criar Plano de Ação
            </Button>
          )}
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="text-2xl font-bold">
                  {indicator.target_value?.toLocaleString() ?? '-'} {indicator.unit}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Último Valor</p>
                <p className="text-2xl font-bold">
                  {lastValue?.toLocaleString() ?? '-'} {indicator.unit}
                </p>
              </div>
              {getDirectionIcon()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média do Ano</p>
                <p className="text-2xl font-bold">
                  {avgValue?.toFixed(2) ?? '-'} {indicator.unit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variação</p>
                <p className={`text-2xl font-bold ${variation && variation > 0 ? 'text-green-500' : variation && variation < 0 ? 'text-red-500' : ''}`}>
                  {variation ? `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%` : '-'}
                </p>
              </div>
              {variation && variation > 0 ? <TrendingUp className="h-8 w-8 text-green-500" /> : 
               variation && variation < 0 ? <TrendingDown className="h-8 w-8 text-red-500" /> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Coleta do Ano</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
              <Progress value={completionRate} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Indicador - {selectedYear}</CardTitle>
              <CardDescription>
                Valores mensais com meta e tolerâncias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    
                    {/* Tolerance area */}
                    {indicator.tolerance_value && (
                      <Area
                        type="monotone"
                        dataKey="toleranciaSuperior"
                        stroke="none"
                        fill="hsl(var(--primary) / 0.1)"
                        name="Zona de Tolerância"
                      />
                    )}
                    
                    {/* Target line */}
                    {indicator.target_value && (
                      <ReferenceLine 
                        y={indicator.target_value} 
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="5 5"
                        label={{ value: `Meta: ${indicator.target_value}`, position: 'right', fill: 'hsl(var(--primary))' }}
                      />
                    )}
                    
                    {/* Value line */}
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                      connectNulls
                      name="Valor Medido"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Dados Mensais</CardTitle>
              <CardDescription>Valores coletados em {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Desvio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MONTHS.map((monthName, index) => {
                    const monthData = indicator.period_data?.find(pd => pd.month === index + 1);
                    const deviation = monthData?.measured_value && indicator.target_value
                      ? ((monthData.measured_value - indicator.target_value) / indicator.target_value) * 100
                      : null;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{monthName}</TableCell>
                        <TableCell>
                          {monthData?.measured_value?.toLocaleString() ?? '-'} {monthData?.measured_value ? indicator.unit : ''}
                        </TableCell>
                        <TableCell>{indicator.target_value?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell>
                          {deviation !== null ? (
                            <span className={deviation >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(monthData?.status || 'pending')}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {monthData?.observation || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Indicador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-medium">{indicator.code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{indicator.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unidade de Medida</p>
                    <p className="font-medium">{indicator.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência</p>
                    <p className="font-medium capitalize">{indicator.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Medição</p>
                    <p className="font-medium capitalize">{indicator.measurement_type}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Direção</p>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon()}
                      <p className="font-medium">
                        {indicator.direction === 'higher_better' ? 'Maior é Melhor' :
                         indicator.direction === 'lower_better' ? 'Menor é Melhor' : 'Igual é Melhor'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tolerância</p>
                    <p className="font-medium">{indicator.tolerance_value ? `±${indicator.tolerance_value} ${indicator.unit}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grupo</p>
                    <p className="font-medium">{indicator.indicator_group?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="font-medium">{(indicator as any).profiles?.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">{indicator.location || '-'}</p>
                  </div>
                </div>
              </div>

              {indicator.calculation_formula && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">Fórmula de Cálculo</p>
                  <code className="block mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
                    {indicator.calculation_formula}
                  </code>
                </div>
              )}

              {indicator.strategic_objective && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">Objetivo Estratégico</p>
                  <p className="mt-1">{indicator.strategic_objective}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IndicatorActionPlanModal
        open={showActionPlanModal}
        onOpenChange={setShowActionPlanModal}
        indicator={indicator}
        criticalPeriods={criticalMonths}
      />

      <IndicatorExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        indicator={indicator}
        year={selectedYear}
      />
    </div>
  );
}
