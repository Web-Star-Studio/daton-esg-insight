import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SystemPerformanceData } from '@/services/analyticsService';

interface AnalyticsPerformanceTabProps {
  systemPerformanceData: SystemPerformanceData | null;
}

export function AnalyticsPerformanceTab({ systemPerformanceData }: AnalyticsPerformanceTabProps) {
  const formatValue = (value: number, decimals: number = 2) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tempo de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(systemPerformanceData?.responseTime || 0, 0)}ms
            </div>
            <Progress 
              value={Math.min(100, (300 - (systemPerformanceData?.responseTime || 0)) / 3)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatValue(systemPerformanceData?.uptime || 0, 2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(systemPerformanceData?.throughput || 0, 0)}
            </div>
            <p className="text-xs text-muted-foreground">req/min</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uso de Recursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">CPU</span>
              <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.cpu || 0, 1)}%</span>
            </div>
            <Progress value={systemPerformanceData?.resourceUsage.cpu || 0} />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Memória</span>
              <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.memory || 0, 1)}%</span>
            </div>
            <Progress value={systemPerformanceData?.resourceUsage.memory || 0} />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Armazenamento</span>
              <span className="text-sm">{formatValue(systemPerformanceData?.resourceUsage.storage || 0, 1)}%</span>
            </div>
            <Progress value={systemPerformanceData?.resourceUsage.storage || 0} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
