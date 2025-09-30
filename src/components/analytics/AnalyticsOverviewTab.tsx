import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalyticsData, UserActivityData, SystemPerformanceData } from '@/services/analyticsService';

interface AnalyticsOverviewTabProps {
  emissionsData: AnalyticsData | null;
  qualityData: AnalyticsData | null;
  complianceData: AnalyticsData | null;
  userActivityData: UserActivityData | null;
  systemPerformanceData: SystemPerformanceData | null;
}

export function AnalyticsOverviewTab({
  emissionsData,
  qualityData,
  complianceData,
  userActivityData,
  systemPerformanceData,
}: AnalyticsOverviewTabProps) {
  const formatValue = (value: number, decimals: number = 2) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tendências Principais</CardTitle>
            <CardDescription>Evolução dos principais indicadores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={emissionsData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Emissões (tCO2e)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade dos Usuários</CardTitle>
            <CardDescription>Top ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData?.topActions.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Insights Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emissionsData?.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {complianceData?.metrics.overdueTasks ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <p className="text-sm">
                  {complianceData.metrics.overdueTasks} tarefas em atraso
                </p>
              </div>
            ) : null}
            {qualityData?.metrics.criticalNonConformities ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-sm">
                  {qualityData.metrics.criticalNonConformities} NCs críticas
                </p>
              </div>
            ) : null}
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <p className="text-sm">Sistema funcionando normalmente</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tempo de Resposta</span>
              <Badge variant="outline">
                {formatValue(systemPerformanceData?.responseTime || 0, 0)}ms
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Uptime</span>
              <Badge variant="outline">
                {formatValue(systemPerformanceData?.uptime || 0, 2)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Taxa de Erro</span>
              <Badge variant="outline">
                {formatValue(systemPerformanceData?.errorRate || 0, 3)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
