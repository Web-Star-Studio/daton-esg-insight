import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, RefreshCw, CheckCircle, AlertTriangle, XCircle, 
  Database, Shield, HardDrive, Clock, Server, Activity 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { healthChecker, type HealthCheckResult, type HealthStatus } from '@/utils/healthCheck';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const StatusIcon = ({ status }: { status: HealthStatus['status'] }) => {
  switch (status) {
    case 'pass':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warn':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'fail':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
};

const StatusBadge = ({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) => {
  const variants = {
    healthy: { label: 'Saudável', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    degraded: { label: 'Degradado', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    unhealthy: { label: 'Crítico', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };

  const variant = variants[status];
  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export const HealthCheckModule = () => {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Additional security check - login failures in last hour
  const { data: loginFailures } = useQuery({
    queryKey: ['login-failures-alert'],
    queryFn: async () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { count, error } = await supabase
        .from('login_history')
        .select('*', { count: 'exact', head: true })
        .eq('login_success', false)
        .gte('created_at', oneHourAgo.toISOString());

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  const runHealthCheck = async () => {
    setIsRunning(true);
    try {
      const result = await healthChecker.runHealthCheck();
      setHealthResult(result);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Run initial health check
  useEffect(() => {
    runHealthCheck();
  }, []);

  const checkItems = healthResult ? [
    { key: 'database', icon: Database, label: 'Banco de Dados', ...healthResult.checks.database },
    { key: 'auth', icon: Shield, label: 'Autenticação', ...healthResult.checks.auth },
    { key: 'storage', icon: HardDrive, label: 'Armazenamento', ...healthResult.checks.storage },
    { key: 'configuration', icon: Server, label: 'Configuração', ...healthResult.checks.configuration },
  ] : [];

  const hasAlerts = (loginFailures && loginFailures > 20) || healthResult?.status === 'unhealthy';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Monitoramento em tempo real da infraestrutura
                </CardDescription>
              </div>
              {healthResult && <StatusBadge status={healthResult.status} />}
            </div>
            <Button onClick={runHealthCheck} disabled={isRunning} variant="outline">
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Novamente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lastCheck && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              Última verificação: {format(lastCheck, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </div>
          )}

          {isRunning && !healthResult ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : healthResult ? (
            <div className="grid gap-4 md:grid-cols-2">
              {checkItems.map(item => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                >
                  <StatusIcon status={item.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                    {item.responseTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo de resposta: {item.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Alerts */}
      {hasAlerts && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loginFailures && loginFailures > 20 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Possível Ataque de Força Bruta</AlertTitle>
                <AlertDescription>
                  Detectadas {loginFailures} falhas de login na última hora. 
                  Considere revisar os logs e bloquear IPs suspeitos.
                </AlertDescription>
              </Alert>
            )}

            {healthResult?.status === 'unhealthy' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Serviço Crítico Indisponível</AlertTitle>
                <AlertDescription>
                  Um ou mais serviços essenciais estão com falha. 
                  Verifique os detalhes acima e tome ação imediata.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="font-mono font-medium">{healthResult?.version || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ambiente</p>
              <p className="font-mono font-medium">{healthResult?.environment || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status do Servidor</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Online</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
