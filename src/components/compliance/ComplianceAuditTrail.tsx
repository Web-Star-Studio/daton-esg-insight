import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { AUDIT_ACTION_TYPES, type AuditActionType } from '@/types/enums';
import { normalizeString, normalizeEnum } from '@/utils/dataNormalization';

interface AuditEntry {
  id: string;
  action_type: AuditActionType;
  description: string;
  user_id: string;
  created_at: string;
  details_json: Record<string, unknown> | null;
  user_name?: string;
  user_initials?: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'task_created':
    case 'requirement_added':
      return <Plus className="h-4 w-4 text-green-600" />;
    case 'task_updated':
    case 'requirement_updated':
    case 'status_changed':
      return <Edit className="h-4 w-4 text-blue-600" />;
    case 'task_completed':
    case 'approval_granted':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'task_deleted':
    case 'approval_rejected':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'bulk_update':
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getActionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (action) {
    case 'task_created':
    case 'task_completed':
    case 'approval_granted':
      return 'default';
    case 'task_updated':
    case 'status_changed':
    case 'requirement_updated':
      return 'secondary';
    case 'task_deleted':
    case 'approval_rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    task_created: 'TAREFA CRIADA',
    task_updated: 'TAREFA ATUALIZADA',
    task_completed: 'TAREFA CONCLUÍDA',
    task_deleted: 'TAREFA REMOVIDA',
    requirement_added: 'REQUISITO ADICIONADO',
    requirement_updated: 'REQUISITO ATUALIZADO',
    bulk_update: 'ATUALIZAÇÃO EM LOTE',
    status_changed: 'STATUS ALTERADO',
    approval_requested: 'APROVAÇÃO SOLICITADA',
    approval_granted: 'APROVAÇÃO CONCEDIDA',
    approval_rejected: 'APROVAÇÃO REJEITADA',
    document_uploaded: 'DOCUMENTO ENVIADO',
    comment_added: 'COMENTÁRIO ADICIONADO'
  };
  return labels[action] || action.toUpperCase().replace(/_/g, ' ');
};

export function ComplianceAuditTrail() {
  const { data: auditTrailData = [], isLoading } = useQuery({
    queryKey: ['compliance-audit-trail'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action_type,
          description,
          user_id,
          created_at,
          details_json
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch user names for display
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

      return (data || []).map(entry => {
        const userName = normalizeString(userMap.get(entry.user_id) || 'Usuário');
        const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
        
        return {
          id: entry.id,
          action_type: normalizeEnum(entry.action_type, AUDIT_ACTION_TYPES, 'task_updated'),
          description: normalizeString(entry.description),
          user_id: entry.user_id,
          created_at: entry.created_at,
          details_json: entry.details_json as Record<string, unknown> | null,
          user_name: userName,
          user_initials: initials
        } as AuditEntry;
      });
    },
    staleTime: 30000, // 30 seconds
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trilha de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditTrailData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trilha de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhuma atividade registrada</p>
            <p className="text-xs">As ações do sistema aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Trilha de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 pr-4">
          <div className="space-y-4">
            {auditTrailData.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Linha vertical conectora */}
                {index < auditTrailData.length - 1 && (
                  <div className="absolute left-5 top-12 w-px h-8 bg-border" />
                )}
                
                <div className="flex gap-3">
                  {/* Ícone da ação */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 bg-background flex items-center justify-center">
                    {getActionIcon(entry.action_type)}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {entry.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">
                              {entry.user_initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {entry.user_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={getActionColor(entry.action_type)}
                          className="text-xs"
                        >
                          {getActionLabel(entry.action_type)}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground text-right">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.created_at).date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(entry.created_at).time}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalhes adicionais */}
                    {entry.details_json && Object.keys(entry.details_json).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        {Object.entries(entry.details_json).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}:
                            </span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}