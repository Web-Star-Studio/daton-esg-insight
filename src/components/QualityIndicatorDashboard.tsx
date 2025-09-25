import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Activity, Plus, Bell, CheckCircle2 } from 'lucide-react';
import { useQualityDashboard, useIndicatorAlerts } from '@/services/qualityIndicators';
import { Skeleton } from '@/components/ui/skeleton';
import { IndicatorCreationModal } from './IndicatorCreationModal';
import { IndicatorMeasurementModal } from './IndicatorMeasurementModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface QualityIndicatorDashboardProps {
  className?: string;
}

export const QualityIndicatorDashboard: React.FC<QualityIndicatorDashboardProps> = ({ className }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');

  const { data: dashboardData, isLoading } = useQualityDashboard();
  const { data: alerts } = useIndicatorAlerts();

  const handleAddMeasurement = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setIsMeasurementModalOpen(true);
  };

  const getDeviationColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getDeviationIcon = (level?: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <TrendingUp className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalIndicators = dashboardData?.indicators?.length || 0;
  const criticalAlerts = alerts?.filter(alert => alert.alert_level === 'critical')?.length || 0;
  const warningAlerts = alerts?.filter(alert => alert.alert_level === 'warning')?.length || 0;
  const recentMeasurements = dashboardData?.recentMeasurements?.length || 0;

  // Preparar dados para gráficos
  const chartData = dashboardData?.indicators?.map(indicator => ({
    name: indicator.name,
    target: 100, // Placeholder
    actual: Math.random() * 120, // Placeholder - seria calculado baseado nas medições
  })) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicadores Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIndicators}</div>
            <p className="text-xs text-muted-foreground">
              Monitoramento contínuo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requer ação imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Atenção</CardTitle>
            <Bell className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{warningAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Monitoramento próximo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medições (30 dias)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMeasurements}</div>
            <p className="text-xs text-muted-foreground">
              Dados coletados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="indicators" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="alerts">Alertas ({(criticalAlerts + warningAlerts)})</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Indicador
          </Button>
        </div>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores de Qualidade</CardTitle>
              <CardDescription>
                Monitore e gerencie os indicadores de qualidade da sua organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.indicators?.map((indicator) => (
                  <div key={indicator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{indicator.name}</h3>
                        <Badge variant="outline">{indicator.category}</Badge>
                        <Badge variant="outline">{indicator.frequency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {indicator.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">
                          Unidade: {indicator.measurement_unit}
                        </span>
                        <span className="text-sm">
                          Tipo: {indicator.measurement_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddMeasurement(indicator.id)}
                      >
                        Registrar Medição
                      </Button>
                    </div>
                  </div>
                ))}
                
                {totalIndicators === 0 && (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum indicador cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando seu primeiro indicador de qualidade
                    </p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Indicador
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Desvios</CardTitle>
              <CardDescription>
                Alertas automáticos de desvios nos indicadores de qualidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts?.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviationIcon(alert.alert_level)}
                      <div>
                        <h3 className="font-medium">{alert.alert_message}</h3>
                        <p className="text-sm text-muted-foreground">
                          Indicador: {alert.quality_indicators?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Valor medido: {alert.indicator_measurements?.measured_value} em {alert.indicator_measurements?.measurement_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getDeviationColor(alert.alert_level)}>
                        {alert.alert_level === 'critical' ? 'Crítico' : 'Atenção'}
                      </Badge>
                      {!alert.is_acknowledged && (
                        <Button variant="outline" size="sm">
                          Reconhecer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {alerts?.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum alerta ativo</h3>
                    <p className="text-muted-foreground">
                      Todos os indicadores estão dentro dos limites esperados
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Indicadores</CardTitle>
              <CardDescription>
                Análise comparativa entre meta e performance atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="target" fill="hsl(var(--muted))" name="Meta" />
                    <Bar dataKey="actual" fill="hsl(var(--primary))" name="Atual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências dos Indicadores</CardTitle>
              <CardDescription>
                Evolução histórica dos principais indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Tendência"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IndicatorCreationModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <IndicatorMeasurementModal 
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        indicatorId={selectedIndicatorId}
      />
    </div>
  );
};