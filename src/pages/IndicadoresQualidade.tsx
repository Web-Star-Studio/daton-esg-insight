import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QualityIndicatorDashboard from '@/components/QualityIndicatorDashboard';
import { AlertsManagementCenter } from '@/components/AlertsManagementCenter';
import { StatisticalProcessControl } from '@/components/StatisticalProcessControl';
import { TargetManagementDashboard } from '@/components/TargetManagementDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, AlertTriangle, Activity, Target, Calendar } from 'lucide-react';

const IndicadoresQualidade = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tour="quality-header">
        <div>
          <h1 className="text-3xl font-bold">Indicadores de Qualidade SGQ</h1>
          <p className="text-muted-foreground">
            Sistema de Gestão da Qualidade - Controle e monitoramento de indicadores
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Indicadores</span>
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Metas</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Tendências</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Análises</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <QualityIndicatorDashboard />
        </TabsContent>

        <TabsContent value="indicators">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Indicadores</CardTitle>
              <CardDescription>
                Configure e gerencie todos os indicadores de qualidade da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityIndicatorDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets">
          <TargetManagementDashboard />
        </TabsContent>

        <TabsContent value="alerts" data-tour="audit-section">
          <AlertsManagementCenter />
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Controle Estatístico do Processo</CardTitle>
              <CardDescription>
                Análise avançada com gráficos de controle e capacidade do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatisticalProcessControl />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análises Críticas</CardTitle>
              <CardDescription>
                Registre e acompanhe análises críticas periódicas e por desvio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Análises Críticas</h3>
                <p className="text-muted-foreground">
                  Sistema de análises críticas será implementado em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IndicadoresQualidade;