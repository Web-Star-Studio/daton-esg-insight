import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Eye, Edit, Plus } from "lucide-react";
import { qualityManagementService } from "@/services/qualityManagement";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentActivity {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  details_json: any;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'article_created':
      return Plus;
    case 'article_updated':
      return Edit;
    case 'article_viewed':
      return Eye;
    default:
      return Clock;
  }
};

const getActivityColor = (actionType: string) => {
  switch (actionType) {
    case 'article_created':
      return 'bg-primary/10 text-primary';
    case 'article_updated':
      return 'bg-secondary/10 text-secondary-foreground';
    case 'article_viewed':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function RecentActivityWidget() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["recent-activities"],
    queryFn: qualityManagementService.getRecentActivities,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="rounded-full bg-muted h-8 w-8"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade recente
                </p>
              </div>
            ) : (
              activities.map((activity: RecentActivity) => {
                const Icon = getActivityIcon(activity.action_type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`rounded-full p-1.5 ${getActivityColor(activity.action_type)}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}