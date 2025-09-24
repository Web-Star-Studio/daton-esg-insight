import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Brain, Clock, Download, FileText, TrendingUp, Zap } from 'lucide-react';
import { intelligentReportingService } from '@/services/intelligentReporting';

interface RealtimeReportingWidgetProps {
  className?: string;
}

export const RealtimeReportingWidget: React.FC<RealtimeReportingWidgetProps> = ({ className }) => {
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [recentInsights, setRecentInsights] = useState<any[]>([]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['widget-smart-templates'],
    queryFn: () => intelligentReportingService.getSmartReportTemplates(),
    refetchInterval: 60000,
  });

  const { data: insights } = useQuery({
    queryKey: ['widget-recent-insights'],
    queryFn: () => intelligentReportingService.generateReportInsights('esg', {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date()
    }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (insights) {
      setRecentInsights(insights.slice(0, 3)); // Show only top 3
    }
  }, [insights]);

  const urgentTemplates = templates?.filter(t => 
    new Date(t.next_generation).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  ) || [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>Central de Relatórios</span>
          <Badge variant="outline" className="ml-auto">
            <Zap className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </CardTitle>
        <CardDescription>
          Insights em tempo real e relatórios inteligentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Reports */}
        {urgentTemplates.length > 0 && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {urgentTemplates.length} relatório(s) com geração próxima
                </span>
                <Button size="sm" variant="outline">
                  Ver Todos
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Processando
            </h4>
            {activeJobs.map((job) => (
              <div key={job.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{job.name}</span>
                  <span>{job.progress}%</span>
                </div>
                <Progress value={job.progress} className="h-1" />
              </div>
            ))}
          </div>
        )}

        {/* Recent Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights Recentes
          </h4>
          {recentInsights.length > 0 ? (
            <div className="space-y-2">
              {recentInsights.map((insight) => (
                <div key={insight.id} className="p-2 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {insight.description}
                      </p>
                    </div>
                    <Badge 
                      variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum insight recente encontrado
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ações Rápidas</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Gerar ESG
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Relatórios
            </Button>
          </div>
        </div>

        {/* AI Templates Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{templates?.length || 0} templates ativos</span>
            <span>{templates?.filter(t => t.ai_enhanced).length || 0} com IA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeReportingWidget;