import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { Activity, Clock, TrendingUp, Zap } from "lucide-react";

export function PerformanceMetrics() {
  const metrics = performanceMonitor.getAllMetrics();
  
  // Get unique metric names
  const uniqueMetricNames = Array.from(new Set(metrics.map(m => m.name)));
  
  // Calculate stats for each metric
  const metricStats = uniqueMetricNames.map(name => ({
    name,
    stats: performanceMonitor.getMetricStats(name)
  })).filter(m => m.stats !== null);

  // Get Web Vitals
  const webVitals = {
    lcp: performanceMonitor.getMetricStats('web_vital_lcp'),
    fid: performanceMonitor.getMetricStats('web_vital_fid'),
    cls: performanceMonitor.getMetricStats('web_vital_cls'),
  };

  const formatMs = (ms: number) => ms.toFixed(2) + 'ms';
  
  const getVitalStatus = (name: string, value: number) => {
    if (name === 'lcp') {
      if (value <= 2500) return 'text-success';
      if (value <= 4000) return 'text-warning';
      return 'text-destructive';
    }
    if (name === 'fid') {
      if (value <= 100) return 'text-success';
      if (value <= 300) return 'text-warning';
      return 'text-destructive';
    }
    if (name === 'cls') {
      if (value <= 0.1) return 'text-success';
      if (value <= 0.25) return 'text-warning';
      return 'text-destructive';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Web Vitals
          </CardTitle>
          <CardDescription>Métricas de experiência do usuário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Largest Contentful Paint (LCP)</p>
              {webVitals.lcp ? (
                <>
                  <p className={`text-2xl font-bold ${getVitalStatus('lcp', webVitals.lcp.average)}`}>
                    {formatMs(webVitals.lcp.average)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {formatMs(webVitals.lcp.min)} | Max: {formatMs(webVitals.lcp.max)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando dados...</p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">First Input Delay (FID)</p>
              {webVitals.fid ? (
                <>
                  <p className={`text-2xl font-bold ${getVitalStatus('fid', webVitals.fid.average)}`}>
                    {formatMs(webVitals.fid.average)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {formatMs(webVitals.fid.min)} | Max: {formatMs(webVitals.fid.max)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando dados...</p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Cumulative Layout Shift (CLS)</p>
              {webVitals.cls ? (
                <>
                  <p className={`text-2xl font-bold ${getVitalStatus('cls', webVitals.cls.average)}`}>
                    {webVitals.cls.average.toFixed(3)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {webVitals.cls.min.toFixed(3)} | Max: {webVitals.cls.max.toFixed(3)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando dados...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas Personalizadas
          </CardTitle>
          <CardDescription>Performance de operações da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          {metricStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma métrica registrada ainda. As métricas aparecerão conforme você usa a aplicação.
            </p>
          ) : (
            <div className="space-y-4">
              {metricStats
                .filter(m => !m.name.startsWith('web_vital_'))
                .map(({ name, stats }) => (
                  <div key={name} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {stats!.count} medições
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Média</p>
                        <p className="font-semibold">{formatMs(stats!.average)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mín</p>
                        <p className="font-semibold">{formatMs(stats!.min)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Máx</p>
                        <p className="font-semibold">{formatMs(stats!.max)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P95</p>
                        <p className="font-semibold">{formatMs(stats!.p95)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Métricas Recentes
          </CardTitle>
          <CardDescription>Últimas 20 medições de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.slice(-20).reverse().map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{metric.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{formatMs(metric.value)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
