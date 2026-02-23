import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Droplets, Zap, Cloud, Trash2 } from 'lucide-react';
import { AlertMonitoringService } from '@/services/alertMonitoring';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';

interface IntelligentAlert {
  type: 'water' | 'energy' | 'emissions' | 'waste';
  value: number;
  average: number;
  percentage: number;
}

const VALID_ALERT_TYPES: IntelligentAlert['type'][] = ['water', 'energy', 'emissions', 'waste'];

const isIntelligentAlert = (value: unknown): value is IntelligentAlert => {
  if (!value || typeof value !== 'object') return false;
  const alert = value as Record<string, unknown>;

  return (
    typeof alert.type === 'string' &&
    VALID_ALERT_TYPES.includes(alert.type as IntelligentAlert['type']) &&
    typeof alert.value === 'number' &&
    typeof alert.average === 'number' &&
    typeof alert.percentage === 'number'
  );
};

export function AlertsPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (data?.company_id) {
          setCompanyId(data.company_id);
        }
      }
    };

    fetchCompanyId();
  }, []);

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['intelligent-alerts', companyId],
    queryFn: () => companyId ? AlertMonitoringService.checkAllAlerts(companyId) : [],
    enabled: !!companyId,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });
  const alerts = Array.isArray(alertsData) ? alertsData.filter(isIntelligentAlert) : [];

  if (!companyId || isLoading) return null;
  if (alerts.length === 0) return null;

  const getIcon = (type: string) => {
    const icons = {
      water: Droplets,
      energy: Zap,
      emissions: Cloud,
      waste: Trash2
    };
    return icons[type as keyof typeof icons] || AlertTriangle;
  };

  const getRoute = (type: string) => {
    const routes = {
      water: '/monitoramento-agua',
      energy: '/monitoramento-energia',
      emissions: '/inventario-gee',
      waste: '/residuos'
    };
    const targetRoute = routes[type as keyof typeof routes];
    const isDemoRoute = location.pathname.startsWith('/demo');

    if (!targetRoute) {
      return isDemoRoute ? '/demo' : '/dashboard';
    }

    return isDemoRoute ? `/demo${targetRoute}` : targetRoute;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      water: 'Água',
      energy: 'Energia',
      emissions: 'Emissões',
      waste: 'Resíduos'
    };
    return labels[type as keyof typeof labels];
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertas Inteligentes
        </CardTitle>
        <CardDescription>
          Consumos ou emissões acima da média histórica detectados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getIcon(alert.type);
          const alertKey = `${alert.type}-${alert.value}-${alert.average}-${alert.percentage}`;
          return (
            <Alert key={alertKey} variant="destructive">
              <Icon className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{getTypeLabel(alert.type)}</span>
                <span className="flex items-center gap-1 text-sm font-normal">
                  <TrendingUp className="h-3 w-3" />
                  +{alert.percentage.toFixed(1)}%
                </span>
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Valor atual:</span>
                    <span className="font-semibold">{alert.value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Média histórica:</span>
                    <span>{alert.average.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate(getRoute(alert.type))}
                >
                  Ver Detalhes
                </Button>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
