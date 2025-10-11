import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { logger } from '@/utils/logger';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  issues: string[];
  lastCheck: Date;
}

export function ProductionHealthWidget() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    score: 100,
    issues: [],
    lastCheck: new Date()
  });

  useEffect(() => {
    const checkHealth = () => {
      const metrics = performanceMonitor.getAllMetrics();
      const logs = logger.getRecentLogs(50);
      
      // Calculate health score
      let score = 100;
      const issues: string[] = [];
      
      // Check for errors in logs
      const errorLogs = logs.filter(log => log.level === 'error');
      if (errorLogs.length > 5) {
        score -= 20;
        issues.push(`${errorLogs.length} erros recentes detectados`);
      }
      
      // Check performance metrics
      const lcpStats = performanceMonitor.getMetricStats('web_vital_lcp');
      if (lcpStats && lcpStats.average > 2500) {
        score -= 15;
        issues.push('LCP acima do ideal (>2.5s)');
      }
      
      const fidStats = performanceMonitor.getMetricStats('web_vital_fid');
      if (fidStats && fidStats.average > 100) {
        score -= 15;
        issues.push('FID acima do ideal (>100ms)');
      }
      
      // Check for API errors
      const apiErrors = metrics.filter(m => m.name.includes('error'));
      if (apiErrors.length > 10) {
        score -= 20;
        issues.push('Múltiplos erros de API detectados');
      }
      
      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (score < 50) {
        status = 'critical';
      } else if (score < 80) {
        status = 'warning';
      }
      
      setHealth({
        status,
        score: Math.max(0, score),
        issues,
        lastCheck: new Date()
      });
      
      logger.info('Health check completed', { status, score, issueCount: issues.length });
    };
    
    // Initial check
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy':
        return 'Saudável';
      case 'warning':
        return 'Atenção';
      case 'critical':
        return 'Crítico';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Saúde do Sistema</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
        <CardDescription>Monitoramento em tempo real</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score de Saúde</span>
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute h-full transition-all duration-500 ${
                health.score >= 80 ? 'bg-success' : 
                health.score >= 50 ? 'bg-warning' : 
                'bg-destructive'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className="font-semibold">{health.score}/100</span>
            <span>100</span>
          </div>
        </div>

        {/* Issues */}
        {health.issues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Problemas Detectados</span>
            </div>
            <ul className="space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index} className="text-xs text-muted-foreground pl-6">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Check */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>
            Última verificação: {health.lastCheck.toLocaleTimeString('pt-BR')}
          </span>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => navigate('/production-monitoring')}
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
