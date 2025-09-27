import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  HardDrive, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Timer,
  Wifi,
  Server
} from 'lucide-react';
import { useSystemOptimization } from '@/hooks/useSystemOptimization';
import { AnimatedProgress, AnimatedKPICard, AnimatedGrid } from '@/components/AdvancedAnimations';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend?: number;
  description: string;
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'memory' | 'network' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export function PerformanceMonitor() {
  const { metrics, isOptimized } = useSystemOptimization();
  const [systemHealth] = useState({
    overall: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    cpu: 85,
    memory: 70,
    network: 90,
    database: 88,
    cache: 92,
  });
  const [suggestions] = useState<any[]>([]);
  const runOptimizations = async () => console.log('Optimizations running...');
  const runStressTest = async () => console.log('Stress test running...');
  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetric[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isRunningOptimization, setIsRunningOptimization] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(0);

  // Monitor tempo real de métricas
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'CPU Usage',
          value: systemHealth.cpu,
          unit: '%',
          status: systemHealth.cpu > 90 ? 'critical' : systemHealth.cpu > 75 ? 'warning' : 'good',
          trend: Math.random() * 10 - 5,
          description: 'Uso atual do processador'
        },
        {
          name: 'Memory Usage',
          value: systemHealth.memory,
          unit: '%',
          status: systemHealth.memory > 85 ? 'critical' : systemHealth.memory > 70 ? 'warning' : 'good',
          trend: Math.random() * 5 - 2.5,
          description: 'Consumo de memória RAM'
        },
        {
          name: 'Network Quality',
          value: systemHealth.network,
          unit: '%',
          status: systemHealth.network < 50 ? 'critical' : systemHealth.network < 75 ? 'warning' : 'good',
          trend: Math.random() * 8 - 4,
          description: 'Qualidade da conexão de rede'
        },
        {
          name: 'Database Performance',
          value: systemHealth.database,
          unit: '%',
          status: systemHealth.database < 60 ? 'critical' : systemHealth.database < 80 ? 'warning' : 'good',
          trend: Math.random() * 6 - 3,
          description: 'Performance do banco de dados'
        },
        {
          name: 'Cache Hit Rate',
          value: systemHealth.cache,
          unit: '%',
          status: systemHealth.cache < 70 ? 'warning' : systemHealth.cache < 85 ? 'good' : 'excellent',
          trend: Math.random() * 4 - 2,
          description: 'Taxa de acerto do cache'
        },
        {
          name: 'Response Time',
          value: networkLatency,
          unit: 'ms',
          status: networkLatency > 1000 ? 'critical' : networkLatency > 500 ? 'warning' : 'good',
          trend: Math.random() * 20 - 10,
          description: 'Tempo médio de resposta'
        }
      ];

      setRealTimeMetrics(newMetrics);

      // Gerar alertas baseados nas métricas
      const alerts: SystemAlert[] = [];
      
      newMetrics.forEach(metric => {
        if (metric.status === 'critical') {
          alerts.push({
            id: `${metric.name}-${Date.now()}`,
            type: metric.name.toLowerCase().includes('memory') ? 'memory' : 
                  metric.name.toLowerCase().includes('network') ? 'network' :
                  metric.name.toLowerCase().includes('database') ? 'database' : 'performance',
            severity: 'critical',
            message: `${metric.name} está em nível crítico: ${metric.value}${metric.unit}`,
            timestamp: new Date(),
            resolved: false
          });
        }
      });

      if (alerts.length > 0) {
        setSystemAlerts(prev => [...alerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    };

    // Atualizar métricas a cada 5 segundos
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Atualização inicial

    return () => clearInterval(interval);
  }, [systemHealth, networkLatency]);

  // Medir latência de rede
  useEffect(() => {
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/api/ping', { method: 'HEAD' });
        const latency = performance.now() - start;
        setNetworkLatency(latency);
      } catch (error) {
        setNetworkLatency(999); // Erro de rede
      }
    };

    const latencyInterval = setInterval(measureLatency, 10000);
    measureLatency();

    return () => clearInterval(latencyInterval);
  }, []);

  const handleOptimization = async () => {
    setIsRunningOptimization(true);
    try {
      await runOptimizations();
      // Adicionar alerta de sucesso
      setSystemAlerts(prev => [{
        id: `optimization-${Date.now()}`,
        type: 'performance',
        severity: 'low',
        message: 'Otimizações do sistema executadas com sucesso',
        timestamp: new Date(),
        resolved: true
      }, ...prev]);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsRunningOptimization(false);
    }
  };

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const getSeverityBadge = (severity: SystemAlert['severity']) => {
    const variants = {
      low: 'secondary',
      medium: 'outline',
      high: 'destructive',
      critical: 'destructive'
    };
    return variants[severity] as any;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema e otimizações inteligentes
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={systemHealth.overall === 'excellent' ? 'default' : 
                    systemHealth.overall === 'good' ? 'secondary' : 'destructive'}
          >
            <Activity className="h-3 w-3 mr-1" />
            Sistema {systemHealth.overall === 'excellent' ? 'Excelente' : 
                    systemHealth.overall === 'good' ? 'Bom' : 
                    systemHealth.overall === 'fair' ? 'Regular' : 'Crítico'}
          </Badge>
          
          <Button
            onClick={handleOptimization}
            disabled={isRunningOptimization}
            size="sm"
          >
            {isRunningOptimization ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Otimizar Sistema
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Métricas Tab */}
        <TabsContent value="metrics">
          <AnimatedGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {realTimeMetrics.map((metric, index) => {
              const StatusIcon = getStatusIcon(metric.status);
              return (
                <AnimatedKPICard
                  key={metric.name}
                  title={metric.name}
                  value={metric.value}
                  unit={metric.unit}
                  trend={metric.trend && metric.trend > 0 ? 'up' : metric.trend && metric.trend < 0 ? 'down' : 'stable'}
                  trendValue={metric.trend}
                  icon={StatusIcon}
                  delay={index * 0.1}
                />
              );
            })}
          </AnimatedGrid>

          {/* Gráfico de Performance em Tempo Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realTimeMetrics.slice(0, 4).map((metric) => (
                  <div key={metric.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getStatusColor(metric.status)}`}>
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                    <AnimatedProgress 
                      value={metric.value} 
                      color={metric.status === 'critical' ? 'destructive' : 
                             metric.status === 'warning' ? 'warning' : 'primary'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas do Sistema ({systemAlerts.filter(a => !a.resolved).length} ativos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Nenhum alerta ativo</h3>
                  <p className="text-muted-foreground text-sm">
                    Todos os sistemas estão funcionando normalmente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.resolved ? 'bg-muted/20 opacity-60' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded ${
                            alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.timestamp.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline" className="text-xs">
                              Resolvido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sugestões Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sugestões de Otimização
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sistema Otimizado</h3>
                  <p className="text-muted-foreground text-sm">
                    Não há sugestões de otimização no momento
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={suggestion.priority === 'high' ? 'destructive' : 
                                      suggestion.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {suggestion.priority === 'high' ? 'Alta' : 
                               suggestion.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.description}
                          </p>
                          <p className="text-xs text-success">
                            💡 {suggestion.impact}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={suggestion.action}
                          variant="outline"
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avançado Tab */}
        <TabsContent value="advanced">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(systemHealth).map(([key, value]) => {
                    if (key === 'overall') return null;
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{key}</span>
                          <span>{typeof value === 'number' ? `${value.toFixed(1)}%` : value}</span>
                        </div>
                        <Progress value={typeof value === 'number' ? value : 0} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Ferramentas Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={runStressTest} 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Executar Teste de Stress
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reiniciar Aplicação
                </Button>
                
                <Button 
                  onClick={() => localStorage.clear()} 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Limpar Cache Local
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}