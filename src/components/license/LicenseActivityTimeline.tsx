import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock, Edit, FileText, Archive, MessageSquare, ListChecks, Upload, FileEdit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActivityTimeline } from '@/services/licenseActivityHistory';

interface LicenseActivityTimelineProps {
  licenseId: string;
}

const iconMap: Record<string, any> = {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Archive,
  MessageSquare,
  ListChecks,
  Upload,
  FileEdit,
  Activity
};

export function LicenseActivityTimeline({ licenseId }: LicenseActivityTimelineProps) {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['license-activity', licenseId],
    queryFn: () => getActivityTimeline(licenseId)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Timeline de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando atividades...</p>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Timeline de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Timeline de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 max-h-[600px] overflow-y-auto">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {timeline.map((event, index) => {
            const IconComponent = iconMap[event.icon] || Activity;
            
            return (
              <div key={event.id} className="relative flex gap-4 pb-4">
                {/* Icon */}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-border ${event.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.date), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-1">
                      {event.description}
                    </p>
                  )}
                  
                  {event.user && (
                    <p className="text-xs text-muted-foreground">
                      por <span className="font-medium">{event.user}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
