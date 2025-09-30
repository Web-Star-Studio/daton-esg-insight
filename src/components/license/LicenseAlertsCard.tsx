import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type?: string;
  due_date?: string;
  action_required?: boolean;
}

interface LicenseAlertsCardProps {
  alerts?: Alert[];
  isLoading: boolean;
  onResolve: (alertId: string) => void;
}

export function LicenseAlertsCard({ alerts, isLoading, onResolve }: LicenseAlertsCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      "critical": { variant: "destructive" as const, className: "bg-destructive text-destructive-foreground" },
      "high": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "medium": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
      "low": { variant: "outline" as const, className: "bg-muted/10" }
    };

    const config = severityMap[severity as keyof typeof severityMap] || severityMap["medium"];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {severity === 'critical' ? 'Crítico' : severity === 'high' ? 'Alto' : severity === 'medium' ? 'Médio' : 'Baixo'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Alertas e Observações
          {alerts && alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border rounded space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{alert.alert_type?.replace('_', ' ')}</span>
                      {alert.due_date && (
                        <>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(alert.due_date)}</span>
                        </>
                      )}
                      {alert.action_required && (
                        <>
                          <span>•</span>
                          <span className="text-destructive font-medium">Ação Requerida</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onResolve(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum alerta ativo</p>
            <p className="text-xs mt-1">Alertas importantes serão exibidos aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
