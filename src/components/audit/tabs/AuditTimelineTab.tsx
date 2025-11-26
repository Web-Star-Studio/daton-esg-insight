import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, FileText } from "lucide-react";

interface AuditTimelineTabProps {
  auditId: string;
}

export function AuditTimelineTab({ auditId }: AuditTimelineTabProps) {
  const { data: activities } = useQuery({
    queryKey: ['audit-timeline', auditId],
    queryFn: async () => {
      // Buscar diferentes tipos de atividades
      const [findings, responses, plan] = await Promise.all([
        supabase.from('audit_findings').select('*, created_at').eq('audit_id', auditId),
        supabase.from('audit_checklist_responses').select('*, created_at').eq('audit_id', auditId),
        supabase.from('audit_plans').select('*, created_at').eq('audit_id', auditId).maybeSingle(),
      ]);

      const timeline: any[] = [];

      findings.data?.forEach(f => {
        timeline.push({
          type: 'finding',
          date: f.created_at,
          description: `Achado criado: ${f.description?.substring(0, 50)}...`,
          severity: f.severity,
        });
      });

      responses.data?.forEach(r => {
        timeline.push({
          type: 'response',
          date: r.created_at,
          description: `Checklist respondido: ${r.response}`,
        });
      });

      if (plan.data) {
        timeline.push({
          type: 'plan',
          date: plan.data.created_at,
          description: 'Plano de auditoria criado',
        });
      }

      return timeline.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Timeline da Auditoria</h3>
        <p className="text-sm text-muted-foreground">
          Histórico completo de atividades e mudanças
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {activities && activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {activity.type === 'finding' && <FileText className="h-5 w-5" />}
                      {activity.type === 'response' && <Clock className="h-5 w-5" />}
                      {activity.type === 'plan' && <User className="h-5 w-5" />}
                    </div>
                  </div>
                  <div className="flex-1 pb-6 border-b last:border-0">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma atividade registrada</h3>
              <p className="text-muted-foreground">
                As atividades aparecerão aqui conforme a auditoria progride.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
