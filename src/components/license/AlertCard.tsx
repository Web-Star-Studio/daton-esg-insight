import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle2, Eye, AlarmClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertCardProps {
  alert: {
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    due_date?: string;
    status: string;
    created_at: string;
    source_condition_id?: string;
    related_observation_id?: string;
  };
  onResolve?: () => void;
  onSnooze?: () => void;
  onViewSource?: () => void;
  className?: string;
}

const severityConfig = {
  critical: {
    color: "destructive",
    icon: AlertTriangle,
    label: "Crítico",
    bgClass: "bg-destructive/10",
  },
  high: {
    color: "destructive",
    icon: AlertTriangle,
    label: "Alto",
    bgClass: "bg-orange-500/10",
  },
  medium: {
    color: "default",
    icon: Clock,
    label: "Médio",
    bgClass: "bg-yellow-500/10",
  },
  low: {
    color: "secondary",
    icon: Clock,
    label: "Baixo",
    bgClass: "bg-blue-500/10",
  },
};

export function AlertCard({ alert, onResolve, onSnooze, onViewSource, className = "" }: AlertCardProps) {
  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
  const Icon = config.icon;

  const isResolved = alert.status === "resolved";
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className={`p-4 ${config.bgClass} border-l-4 ${isResolved ? "opacity-60" : ""} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon className={`h-5 w-5 ${isResolved ? "text-muted-foreground" : "text-destructive"}`} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={config.color as any}>{config.label}</Badge>
                <Badge variant="outline" className="text-xs">
                  {alert.alert_type === "renewal" ? "Renovação" : 
                   alert.alert_type === "condition_due" ? "Condicionante" : 
                   alert.alert_type === "inspection" ? "Fiscalização" : "Geral"}
                </Badge>
                {isResolved && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolvido
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm">{alert.title}</h4>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{alert.message}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Criado {timeAgo}</span>
            {alert.due_date && (
              <span>
                Vence em{" "}
                {formatDistanceToNow(new Date(alert.due_date), {
                  locale: ptBR,
                })}
              </span>
            )}
          </div>

          {!isResolved && (
            <div className="flex items-center gap-2 pt-2">
              {(alert.source_condition_id || alert.related_observation_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewSource}
                  className="gap-2"
                >
                  <Eye className="h-3 w-3" />
                  Ver Origem
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={onResolve}
                className="gap-2"
              >
                <CheckCircle2 className="h-3 w-3" />
                Resolver
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSnooze}
                className="gap-2"
              >
                <AlarmClock className="h-3 w-3" />
                Adiar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
