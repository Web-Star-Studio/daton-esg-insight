import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Target, CheckCircle, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { AnalyticsData, UserActivityData } from '@/services/analyticsService';

interface AnalyticsHeaderProps {
  emissionsData: AnalyticsData | null;
  qualityData: AnalyticsData | null;
  complianceData: AnalyticsData | null;
  userActivityData: UserActivityData | null;
}

export function AnalyticsHeader({
  emissionsData,
  qualityData,
  complianceData,
  userActivityData,
}: AnalyticsHeaderProps) {
  const formatValue = (value: number, decimals: number = 2) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Emissões Totais</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatValue(emissionsData?.metrics.total || 0)} tCO2e
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getChangeIcon(emissionsData?.metrics.change || 0)}
            <span>
              {Math.abs(emissionsData?.metrics.change || 0).toFixed(1)}% vs período anterior
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score Qualidade</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatValue(qualityData?.metrics.qualityScore || 0, 0)}%
          </div>
          <Progress 
            value={qualityData?.metrics.qualityScore || 0} 
            className="mt-2" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatValue(complianceData?.metrics.complianceScore || 0, 0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {complianceData?.metrics.overdueTasks || 0} tarefas em atraso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userActivityData?.activeUsers || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Engajamento: {formatValue(userActivityData?.userEngagement || 0, 1)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
