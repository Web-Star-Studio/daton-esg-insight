import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function ComplianceStatusWidget({ companyId }: { companyId: string }) {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['compliance-status', companyId],
    queryFn: async () => {
      // Check licenses
      const { data: licenses } = await supabase
        .from('licenses')
        .select('status')
        .eq('company_id', companyId);

      const activeLicenses = licenses?.filter((l: any) => l.status === 'Ativa').length || 0;
      const totalLicenses = licenses?.length || 0;

      // Check overdue tasks
      const { data: tasks } = await supabase
        .from('data_collection_tasks')
        .select('status')
        .eq('company_id', companyId)
        .lt('due_date', new Date().toISOString());

      const overdueTasks = tasks?.filter(t => t.status === 'Pendente').length || 0;

      // Check goals  
      const { data: goals }: any = await supabase
        .from('goals')
        .select('current_value, target_value, status')
        .eq('company_id', companyId);

      const goalsOnTrack = goals?.filter((g: any) => {
        const progress = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0;
        return progress >= 50 && (g.status === 'Ativa' || g.status === 'No Caminho Certo');
      }).length || 0;
      const totalGoals = goals?.length || 0;

      const score = totalLicenses > 0 
        ? ((activeLicenses / totalLicenses) * 40) + 
          ((overdueTasks === 0 ? 30 : 0)) + 
          ((goalsOnTrack / Math.max(totalGoals, 1)) * 30)
        : 0;

      return {
        score: Math.round(score),
        activeLicenses,
        totalLicenses,
        overdueTasks,
        goalsOnTrack,
        totalGoals
      };
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Status de Conformidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-3xl font-bold ${getStatusColor(compliance?.score || 0)}`}>
                {compliance?.score}%
              </span>
              <span className="text-sm text-muted-foreground">
                Score Geral
              </span>
            </div>
            <Progress value={compliance?.score || 0} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Licenças Ativas
              </span>
              <span className="font-medium">
                {compliance?.activeLicenses}/{compliance?.totalLicenses}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Tarefas Atrasadas
              </span>
              <span className="font-medium">{compliance?.overdueTasks}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Metas no Prazo
              </span>
              <span className="font-medium">
                {compliance?.goalsOnTrack}/{compliance?.totalGoals}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
