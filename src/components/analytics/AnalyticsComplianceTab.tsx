import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { AnalyticsData } from '@/services/analyticsService';

interface AnalyticsComplianceTabProps {
  complianceData: AnalyticsData | null;
}

export function AnalyticsComplianceTab({ complianceData }: AnalyticsComplianceTabProps) {
  const formatValue = (value: number, decimals: number = 2) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(complianceData?.metrics.complianceScore || 0, 0)}%
            </div>
            <Progress value={complianceData?.metrics.complianceScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tarefas Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {complianceData?.metrics.completedTasks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {complianceData?.metrics.overdueTasks || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Licenças Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {complianceData?.metrics.expiredLicenses || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights de Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {complianceData?.insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
