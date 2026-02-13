import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductionReadinessCard } from "./ProductionReadinessCard";
import { ProductionReadinessChecker } from "@/utils/productionReadinessChecker";
import { healthChecker, HealthCheckResult } from "@/utils/healthCheck";
import { PRODUCTION_CONFIG } from "@/utils/productionConfig";
import { RefreshCw, Download, Activity } from "lucide-react";
import { toast } from "sonner";

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  critical: boolean;
}

interface ReadinessResult {
  isReady: boolean;
  checks: ReadinessCheck[];
  criticalFailures: ReadinessCheck[];
  warnings: ReadinessCheck[];
}

export function SystemStatusDashboard() {
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runChecks = async () => {
    setIsChecking(true);
    try {
      // Run production readiness checks
      const checker = new ProductionReadinessChecker();
      const result = await checker.runAllChecks();
      setReadinessResult(result);
      
      // Run health checks
      const health = await healthChecker.runHealthCheck();
      setHealthResult(health);
      
      if (result.isReady && health.status === 'healthy') {
        toast.success("Sistema pronto para produção!");
      } else if (result.criticalFailures.length > 0 || health.status === 'unhealthy') {
        toast.error("Problemas críticos encontrados");
      } else {
        toast.warning("Sistema operacional com avisos");
      }
    } catch (error) {
      toast.error("Erro ao executar verificações");
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadReport = () => {
    if (!readinessResult) return;
    
    const checker = new ProductionReadinessChecker();
    const report = checker.generateReport();
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-readiness-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Relatório baixado com sucesso");
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="space-y-6">
      {/* System Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{PRODUCTION_CONFIG.SYSTEM_NAME}</CardTitle>
              <CardDescription>Versão {PRODUCTION_CONFIG.VERSION}</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={runChecks}
                disabled={isChecking}
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Verificar Novamente
              </Button>
              {readinessResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReport}
                  className="flex-1 sm:flex-none whitespace-nowrap"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Modo Desenvolvimento</p>
              <p className="text-2xl font-bold">
                {process.env.NODE_ENV === 'production' ? 'Não' : 'Sim'}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">Mock Data</p>
              <p className="text-xl sm:text-2xl font-bold truncate">
                {PRODUCTION_CONFIG.FEATURES.MOCK_DATA_DISABLED ? 'Desabilitado' : 'Habilitado'}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground">Cache</p>
              <p className="text-xl sm:text-2xl font-bold">
                {PRODUCTION_CONFIG.PERFORMANCE.ENABLE_CACHING ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground">Logging</p>
              <p className="text-xl sm:text-2xl font-bold capitalize">
                {PRODUCTION_CONFIG.LOGGING.LEVEL}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Check Results */}
      {healthResult && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Check
                </CardTitle>
                <CardDescription>Status dos serviços do sistema</CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold shrink-0 ${
                healthResult.status === 'healthy' 
                  ? 'bg-success/10 text-success' 
                  : healthResult.status === 'degraded'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {healthResult.status === 'healthy' ? '✓ Saudável' : 
                 healthResult.status === 'degraded' ? '⚠ Degradado' : '✗ Crítico'}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(healthResult.checks).map(([key, check]) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      check.status === 'pass' 
                        ? 'bg-success' 
                        : check.status === 'warn'
                        ? 'bg-warning'
                        : 'bg-destructive'
                    }`} />
                    <div>
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <p className="text-xs text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                  {check.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {check.responseTime}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Readiness Check Results */}
      {readinessResult && (
        <ProductionReadinessCard
          checks={readinessResult.checks}
          isReady={readinessResult.isReady}
          criticalFailures={readinessResult.criticalFailures}
          warnings={readinessResult.warnings}
        />
      )}

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades</CardTitle>
          <CardDescription>Status das funcionalidades configuradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {Object.entries(PRODUCTION_CONFIG.FEATURES).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">
                  {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`text-sm font-semibold ${value ? 'text-success' : 'text-muted-foreground'}`}>
                  {value ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
