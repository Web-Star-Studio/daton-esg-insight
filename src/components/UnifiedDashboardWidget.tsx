import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, FileText, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PredictiveQualityWidget } from './PredictiveQualityWidget';
import { RealtimeReportingWidget } from './RealtimeReportingWidget';
import { useRealtimeReporting } from '@/hooks/useRealtimeReporting';

interface UnifiedDashboardWidgetProps {
  className?: string;
}

export const UnifiedDashboardWidget: React.FC<UnifiedDashboardWidgetProps> = ({ className }) => {
  const { urgentReports, highPriorityInsights, stats } = useRealtimeReporting();

  const systemHealthScore = Math.round((stats.successRate + 85 + 92) / 3); // Average of success rate, quality score, compliance

  return (
    <Card className={`p-8 h-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Sistema Integrado
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Visão unificada de qualidade, relatórios e conformidade
          </p>
        </div>
        <Badge variant={systemHealthScore > 85 ? 'default' : 'secondary'}>
          {systemHealthScore}% Saúde
        </Badge>
      </div>
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.processing}</div>
            <div className="text-xs text-muted-foreground">Processando</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{urgentReports.length}</div>
            <div className="text-xs text-muted-foreground">Relatórios Urgentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{highPriorityInsights.length}</div>
            <div className="text-xs text-muted-foreground">Insights Críticos</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Eficiência Geral</span>
            <span>{systemHealthScore}%</span>
          </div>
          <Progress value={systemHealthScore} className="h-3" />
        </div>

        {/* Integrated Widgets */}
        <Tabs defaultValue="quality" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quality">Qualidade</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="quality">
            <PredictiveQualityWidget />
          </TabsContent>

          <TabsContent value="reports">
            <RealtimeReportingWidget />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {highPriorityInsights.length > 0 ? (
              <div className="space-y-3">
                {highPriorityInsights.slice(0, 3).map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-destructive">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <div>
                            <p className="text-sm font-medium">{insight.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Alta
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum insight crítico no momento
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sistema funcionando dentro dos parâmetros normais
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default UnifiedDashboardWidget;