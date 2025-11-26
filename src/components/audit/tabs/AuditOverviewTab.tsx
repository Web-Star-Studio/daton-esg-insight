import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Clock, Users, Target } from "lucide-react";

interface AuditOverviewTabProps {
  audit: any;
  plan: any;
}

export function AuditOverviewTab({ audit, plan }: AuditOverviewTabProps) {
  const { data: findings } = useQuery({
    queryKey: ['audit-findings', audit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', audit.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: responses } = useQuery({
    queryKey: ['checklist-responses', audit.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_checklist_responses')
        .select('*')
        .eq('audit_id', audit.id);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    totalResponses: responses?.length || 0,
    conforming: responses?.filter(r => r.response === 'conforme').length || 0,
    nonConforming: responses?.filter(r => r.response === 'nao_conforme').length || 0,
    findings: {
      total: findings?.length || 0,
      critical: findings?.filter(f => f.severity === 'critical').length || 0,
      major: findings?.filter(f => f.severity === 'major').length || 0,
      minor: findings?.filter(f => f.severity === 'minor').length || 0,
      observation: findings?.filter(f => f.severity === 'observation').length || 0,
    },
  };

  const progress = stats.totalResponses > 0 
    ? (stats.conforming / stats.totalResponses) * 100 
    : 0;

  return (
    <div className="grid gap-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformidade</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.conforming} de {stats.totalResponses} itens
            </p>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achados</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.findings.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.findings.critical} críticos, {stats.findings.major} maiores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalResponses > 0 ? ((stats.totalResponses / 100) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Checklist em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {audit.status?.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              Estado atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Auditoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Objetivo</p>
              <p className="text-sm">{plan?.objective || audit.description || 'Não definido'}</p>
            </div>

            {plan?.scope_areas && plan.scope_areas.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Áreas de Escopo</p>
                <div className="flex flex-wrap gap-2">
                  {plan.scope_areas.map((area: string, idx: number) => (
                    <Badge key={idx} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Metodologia</p>
              <p className="text-sm">{plan?.methodology || 'Não especificada'}</p>
            </div>

            {plan?.location && (
              <div>
                <p className="text-sm text-muted-foreground">Local</p>
                <p className="text-sm">{plan.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Achados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Críticos</span>
              </div>
              <span className="text-sm font-medium">{stats.findings.critical}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm">Maiores</span>
              </div>
              <span className="text-sm font-medium">{stats.findings.major}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Menores</span>
              </div>
              <span className="text-sm font-medium">{stats.findings.minor}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Observações</span>
              </div>
              <span className="text-sm font-medium">{stats.findings.observation}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Total</span>
              </div>
              <span className="text-sm font-bold">{stats.findings.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
