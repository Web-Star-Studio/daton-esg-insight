import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Cpu, 
  Database, 
  Gauge, 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useSystemOptimization } from '@/hooks/useSystemOptimization';
import { useToast } from '@/hooks/use-toast';

interface SystemPerformanceMonitorProps {
  className?: string;
}

export const SystemPerformanceMonitor: React.FC<SystemPerformanceMonitorProps> = ({ className }) => {
  const { metrics, settings, updateSettings, optimizeCache, isOptimized, recommendations } = useSystemOptimization();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'good': return <Activity className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Gauge className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeCache();
      toast({
        title: "Sistema Otimizado",
        description: "Cache limpo e dados críticos pré-carregados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro na Otimização",
        description: "Falha ao otimizar o sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Configuração Atualizada",
      description: `${key} foi atualizado com sucesso`,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Monitor de Performance do Sistema</span>
            {getHealthIcon(metrics.system_health)}
            <Badge 
              variant={metrics.system_health === 'excellent' ? 'default' : 'secondary'}
              className={getHealthColor(metrics.system_health)}
            >
              {metrics.system_health.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Último update: {metrics.last_updated.toLocaleTimeString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="space-y-1">
                <Progress value={metrics.performance_score} className="h-2" />
                <span className="text-xs text-muted-foreground">{metrics.performance_score}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Memória</span>
              </div>
              <div className="space-y-1">
                <Progress value={metrics.memory_usage} className="h-2" />
                <span className="text-xs text-muted-foreground">{metrics.memory_usage}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Cache</span>
              </div>
              <div className="space-y-1">
                <Progress value={metrics.cache_hit_rate} className="h-2" />
                <span className="text-xs text-muted-foreground">{metrics.cache_hit_rate}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">API</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold">{metrics.api_response_time}ms</div>
                <span className="text-xs text-muted-foreground">Tempo resposta</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configurações de Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-refresh">Atualização Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Atualiza dados em tempo real
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={settings.auto_refresh_enabled}
                onCheckedChange={(checked) => 
                  handleSettingChange('auto_refresh_enabled', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="background-sync">Sincronização Background</Label>
                <p className="text-xs text-muted-foreground">
                  Sincroniza dados quando inativo
                </p>
              </div>
              <Switch
                id="background-sync"
                checked={settings.background_sync}
                onCheckedChange={(checked) => 
                  handleSettingChange('background_sync', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Modo de Performance</Label>
              <Select
                value={settings.performance_mode}
                onValueChange={(value) => 
                  handleSettingChange('performance_mode', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4" />
                      <span>Performance Máxima</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="balanced">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Balanceado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="battery">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Economia de Bateria</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.cache_optimization && (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Taxa de cache baixa detectada. Considere otimizar o cache para melhor performance.
                </AlertDescription>
              </Alert>
            )}

            {recommendations.memory_cleanup && (
              <Alert>
                <Cpu className="h-4 w-4" />
                <AlertDescription>
                  Uso de memória elevado. Recomendamos fechar abas desnecessárias.
                </AlertDescription>
              </Alert>
            )}

            {recommendations.api_optimization && (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Tempo de resposta da API alto. Verifique sua conexão de internet.
                </AlertDescription>
              </Alert>
            )}

            {isOptimized && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Sistema está funcionando otimamente! Nenhuma ação necessária.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Métricas em Tempo Real</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Usuários ativos:</span>
                  <span>{metrics.active_users}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cache duration:</span>
                  <span>{Math.round(settings.cache_duration / 1000 / 60)}min</span>
                </div>
                <div className="flex justify-between">
                  <span>Throttle notifications:</span>
                  <span>{settings.notification_throttle / 1000}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemPerformanceMonitor;