import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateDisplay } from "@/utils/dateUtils";
import { 
  History, 
  Plus, 
  Pencil, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HistoryEntry {
  id: string;
  action: string;
  old_values: any;
  new_values: any;
  changed_by: string | null;
  changed_at: string;
  changed_by_user?: { full_name: string } | null;
}

interface LegislationHistoryTimelineProps {
  legislationId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'status_changed':
      return <RefreshCw className="h-4 w-4" />;
    case 'revoked':
      return <XCircle className="h-4 w-4" />;
    case 'updated':
    default:
      return <Pencil className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'bg-green-500';
    case 'status_changed':
      return 'bg-blue-500';
    case 'revoked':
      return 'bg-red-500';
    case 'updated':
    default:
      return 'bg-muted-foreground';
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'created':
      return 'Legislação criada';
    case 'status_changed':
      return 'Status alterado';
    case 'revoked':
      return 'Legislação revogada';
    case 'updated':
      return 'Legislação atualizada';
    default:
      return action;
  }
};

const formatChangeDescription = (oldValues: any, newValues: any): string[] => {
  const changes: string[] = [];
  
  if (!oldValues || !newValues) return changes;
  
  const fieldsToTrack: Record<string, string> = {
    title: 'Título',
    overall_applicability: 'Aplicabilidade',
    overall_status: 'Status',
    responsible_user_id: 'Responsável',
    next_review_date: 'Próxima revisão',
    summary: 'Ementa',
    observations: 'Observações',
    jurisdiction: 'Jurisdição',
    theme_id: 'Macrotema',
    subtheme_id: 'Subtema',
  };
  
  const statusLabels: Record<string, string> = {
    conforme: 'Conforme',
    para_conhecimento: 'Para Conhecimento',
    adequacao: 'Adequação',
    plano_acao: 'Plano de Ação',
    pending: 'Pendente',
  };
  
  const applicabilityLabels: Record<string, string> = {
    real: 'Real',
    potential: 'Potencial',
    revoked: 'Revogada',
    na: 'Não Aplicável',
    pending: 'Pendente',
  };
  
  for (const [field, label] of Object.entries(fieldsToTrack)) {
    if (oldValues[field] !== newValues[field]) {
      let oldVal = oldValues[field] || '-';
      let newVal = newValues[field] || '-';
      
      if (field === 'overall_status') {
        oldVal = statusLabels[oldVal] || oldVal;
        newVal = statusLabels[newVal] || newVal;
      }
      
      if (field === 'overall_applicability') {
        oldVal = applicabilityLabels[oldVal] || oldVal;
        newVal = applicabilityLabels[newVal] || newVal;
      }
      
      if (field === 'next_review_date' || field === 'last_review_date') {
        if (oldVal !== '-') oldVal = formatDateDisplay(oldVal);
        if (newVal !== '-') newVal = formatDateDisplay(newVal);
      }
      
      changes.push(`${label}: ${oldVal} → ${newVal}`);
    }
  }
  
  return changes;
};

export const LegislationHistoryTimeline: React.FC<LegislationHistoryTimelineProps> = ({
  legislationId,
}) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['legislation-history', legislationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legislation_history')
        .select(`
          *,
          changed_by_user:profiles!legislation_history_changed_by_fkey(full_name)
        `)
        .eq('legislation_id', legislationId)
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      return data as HistoryEntry[];
    },
    enabled: !!legislationId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum histórico de alterações encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const changes = formatChangeDescription(entry.old_values, entry.new_values);
        
        return (
          <div key={entry.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
            )}
            
            {/* Icon */}
            <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white ${getActionColor(entry.action)}`}>
              {getActionIcon(entry.action)}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{getActionLabel(entry.action)}</span>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </Badge>
              </div>
              
              {entry.changed_by_user && (
                <p className="text-sm text-muted-foreground mt-1">
                  Por: {entry.changed_by_user.full_name}
                </p>
              )}
              
              {changes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {changes.map((change, i) => (
                    <p key={i} className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {change}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
