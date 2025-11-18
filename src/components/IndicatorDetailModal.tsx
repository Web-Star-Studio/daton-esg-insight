import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  FileText
} from 'lucide-react';
import { qualityIndicatorsService } from '@/services/qualityIndicators';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface IndicatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorId: string;
  onAddMeasurement: () => void;
}

export const IndicatorDetailModal: React.FC<IndicatorDetailModalProps> = ({
  isOpen,
  onClose,
  indicatorId,
  onAddMeasurement
}) => {
  const { data: indicator, isLoading } = useQuery({
    queryKey: ['indicator-detail', indicatorId],
    queryFn: () => qualityIndicatorsService.getIndicator(indicatorId),
    enabled: isOpen && !!indicatorId
  });

  const activeTarget = indicator?.indicator_targets?.find((t: any) => t.is_active);
  const measurements = indicator?.indicator_measurements?.sort((a: any, b: any) => 
    new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
  ) || [];

  // Preparar dados para o gráfico
  const chartData = [...measurements]
    .reverse()
    .map((m: any) => ({
      date: new Date(m.measurement_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      fullDate: new Date(m.measurement_date).toLocaleDateString('pt-BR'),
      valor: m.measured_value,
      meta: activeTarget?.target_value,
      limiteInferior: activeTarget?.lower_limit,
      limiteSuperior: activeTarget?.upper_limit
    }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : indicator ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl mb-2">{indicator.name}</DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {indicator.category}
                    </Badge>
                    <Badge variant="secondary">
                      {indicator.frequency === 'daily' ? 'Diário' : 
                       indicator.frequency === 'weekly' ? 'Semanal' :
                       indicator.frequency === 'monthly' ? 'Mensal' : 'Trimestral'}
                    </Badge>
                    <Badge>
                      {measurements.length} {measurements.length === 1 ? 'medição' : 'medições'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={onAddMeasurement}>
                  <Activity className="h-4 w-4 mr-2" />
                  Nova Medição
                </Button>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="measurements">Medições</TabsTrigger>
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="targets">Metas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações do Indicador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {indicator.description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Descrição</p>
                        <p className="text-sm text-muted-foreground">{indicator.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Unidade de Medida</p>
                        <p className="text-sm text-muted-foreground">{indicator.measurement_unit}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Tipo de Medição</p>
                        <p className="text-sm text-muted-foreground">
                          {indicator.measurement_type === 'manual' ? 'Manual' :
                           indicator.measurement_type === 'automatic' ? 'Automático' : 'Calculado'}
                        </p>
                      </div>
                      {indicator.data_source && (
                        <div>
                          <p className="text-sm font-medium mb-1">Fonte de Dados</p>
                          <p className="text-sm text-muted-foreground">{indicator.data_source}</p>
                        </div>
                      )}
                      {indicator.collection_method && (
                        <div>
                          <p className="text-sm font-medium mb-1">Método de Coleta</p>
                          <p className="text-sm text-muted-foreground">{indicator.collection_method}</p>
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    {measurements.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {measurements[0].measured_value}
                          </p>
                          <p className="text-xs text-muted-foreground">Última Medição</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {(measurements.reduce((acc: number, m: any) => acc + m.measured_value, 0) / measurements.length).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Média</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {activeTarget?.target_value || '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">Meta Atual</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="measurements" className="space-y-4">
                {measurements.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma medição registrada ainda</p>
                      <Button onClick={onAddMeasurement} className="mt-4">
                        Registrar Primeira Medição
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {measurements.map((measurement: any, index: number) => (
                      <Card key={measurement.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-bold">
                                  {measurement.measured_value} {indicator.measurement_unit}
                                </span>
                                <Badge variant={
                                  measurement.deviation_level === 'none' ? 'default' :
                                  measurement.deviation_level === 'warning' ? 'outline' : 'destructive'
                                }>
                                  {measurement.deviation_level === 'none' ? 'Dentro da meta' :
                                   measurement.deviation_level === 'warning' ? 'Atenção' : 'Crítico'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(measurement.measurement_date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>

                              {measurement.notes && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium mb-1">Observações:</p>
                                  <p className="text-muted-foreground">{measurement.notes}</p>
                                </div>
                              )}

                              {measurement.measurement_period_start && measurement.measurement_period_end && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Período: {new Date(measurement.measurement_period_start).toLocaleDateString('pt-BR')} até {new Date(measurement.measurement_period_end).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                            
                            {index === 0 && (
                              <Badge variant="secondary">Mais Recente</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="chart">
                {measurements.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma medição para exibir no gráfico</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tendência das Medições</CardTitle>
                      <CardDescription>
                        Evolução do indicador ao longo do tempo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ value: indicator.measurement_unit, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            labelFormatter={(value) => chartData.find(d => d.date === value)?.fullDate || value}
                            formatter={(value: any) => [value, indicator.measurement_unit]}
                          />
                          <Legend />
                          
                          {activeTarget && (
                            <>
                              <ReferenceLine 
                                y={activeTarget.target_value} 
                                stroke="hsl(var(--primary))" 
                                strokeDasharray="5 5" 
                                label={{ value: 'Meta', position: 'right', fontSize: 12 }}
                              />
                              {activeTarget.upper_limit && (
                                <ReferenceLine 
                                  y={activeTarget.upper_limit} 
                                  stroke="hsl(var(--warning))" 
                                  strokeDasharray="3 3" 
                                  label={{ value: 'Lim. Superior', position: 'right', fontSize: 12 }}
                                />
                              )}
                              {activeTarget.lower_limit && (
                                <ReferenceLine 
                                  y={activeTarget.lower_limit} 
                                  stroke="hsl(var(--warning))" 
                                  strokeDasharray="3 3" 
                                  label={{ value: 'Lim. Inferior', position: 'right', fontSize: 12 }}
                                />
                              )}
                            </>
                          )}
                          
                          <Line 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 7 }}
                            name="Medição"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="targets">
                {activeTarget ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Meta Atual</CardTitle>
                      <CardDescription>
                        Válida desde {new Date(activeTarget.valid_from).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <Target className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Valor Meta</p>
                            <p className="text-2xl font-bold">
                              {activeTarget.target_value} {indicator.measurement_unit}
                            </p>
                          </div>
                        </div>

                        {activeTarget.upper_limit && (
                          <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <TrendingUp className="h-8 w-8 text-warning" />
                            <div>
                              <p className="text-sm text-muted-foreground">Limite Superior</p>
                              <p className="text-2xl font-bold">
                                {activeTarget.upper_limit} {indicator.measurement_unit}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeTarget.lower_limit && (
                          <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <TrendingUp className="h-8 w-8 text-warning transform rotate-180" />
                            <div>
                              <p className="text-sm text-muted-foreground">Limite Inferior</p>
                              <p className="text-2xl font-bold">
                                {activeTarget.lower_limit} {indicator.measurement_unit}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeTarget.critical_upper_limit && (
                          <div className="flex items-center gap-3 p-4 border border-destructive rounded-lg">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                            <div>
                              <p className="text-sm text-muted-foreground">Limite Crítico Superior</p>
                              <p className="text-2xl font-bold">
                                {activeTarget.critical_upper_limit} {indicator.measurement_unit}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeTarget.critical_lower_limit && (
                          <div className="flex items-center gap-3 p-4 border border-destructive rounded-lg">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                            <div>
                              <p className="text-sm text-muted-foreground">Limite Crítico Inferior</p>
                              <p className="text-2xl font-bold">
                                {activeTarget.critical_lower_limit} {indicator.measurement_unit}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma meta definida para este indicador</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
