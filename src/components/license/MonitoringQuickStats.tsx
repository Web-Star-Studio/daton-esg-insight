import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, FileText, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';
import { Link } from 'react-router-dom';

export function MonitoringQuickStats() {
  const { data: stats } = useQuery({
    queryKey: ['monitoring-quick-stats'],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany) return null;

      const { data: alerts } = await supabase
        .from('license_alerts')
        .select('id, severity')
        .eq('company_id', userAndCompany.company_id);

      const { data: observations } = await supabase
        .from('license_observations')
        .select('id, requires_followup')
        .eq('company_id', userAndCompany.company_id)
        .eq('is_archived', false);

      return {
        totalAlerts: alerts?.length || 0,
        criticalAlerts: alerts?.filter(a => a.severity === 'critical').length || 0,
        totalObservations: observations?.length || 0,
        followupRequired: observations?.filter(o => o.requires_followup).length || 0
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Link to="/license-monitoring">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                <div className="text-sm text-muted-foreground">Alertas Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-10 w-10 text-red-600" />
            <div>
              <div className="text-2xl font-bold">{stats.criticalAlerts}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{stats.totalObservations}</div>
              <div className="text-sm text-muted-foreground">Observações</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-10 w-10 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{stats.followupRequired}</div>
              <div className="text-sm text-muted-foreground">Followup</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
