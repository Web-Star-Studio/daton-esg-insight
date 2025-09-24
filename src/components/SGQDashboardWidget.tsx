import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  FileText,
  ArrowRight
} from 'lucide-react';
import { qualityManagementService } from '@/services/qualityManagement';

const SGQDashboardWidget = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['quality-dashboard'],
    queryFn: () => qualityManagementService.getQualityDashboard(),
  });

  const { data: indicators } = useQuery({
    queryKey: ['quality-indicators'],
    queryFn: () => qualityManagementService.getQualityIndicators(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gestão da Qualidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const qualityScore = indicators?.qualityScore || 0;
  const totalNCs = dashboard?.metrics.totalNCs || 0;
  const openNCs = dashboard?.metrics.openNCs || 0;
  const overdueActions = dashboard?.metrics.overdueActions || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Sistema de Gestão da Qualidade</span>
            </CardTitle>
            <CardDescription>Visão geral do SGQ da organização</CardDescription>
          </div>
          <Link to="/quality-dashboard">
            <Button variant="outline" size="sm">
              Ver Detalhes
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Índice de Qualidade</span>
            <div className="flex items-center space-x-2">
              <Badge variant={qualityScore >= 80 ? 'default' : 
                            qualityScore >= 60 ? 'secondary' : 'destructive'}>
                {qualityScore}%
              </Badge>
              {qualityScore >= 80 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
            </div>
          </div>
          <Progress value={qualityScore} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-destructive">{totalNCs}</div>
            <div className="text-xs text-muted-foreground">Total NCs</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-warning">{openNCs}</div>
            <div className="text-xs text-muted-foreground">Em Aberto</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">{overdueActions}</div>
            <div className="text-xs text-muted-foreground">Em Atraso</div>
          </div>
        </div>

        {/* Recent NCs Preview */}
        {dashboard?.recentNCs && dashboard.recentNCs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">NCs Recentes</h4>
            <div className="space-y-1">
              {dashboard.recentNCs.slice(0, 2).map((nc) => (
                <div key={nc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                  <span className="truncate flex-1">{nc.title}</span>
                  <Badge 
                    variant={nc.severity === 'Alta' ? 'destructive' : 
                            nc.severity === 'Média' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {nc.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Link to="/nao-conformidades" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-1" />
              NCs
            </Button>
          </Link>
          <Link to="/plano-acao-5w2h" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-1" />
              Ações
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SGQDashboardWidget;