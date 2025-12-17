import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle, Clock, Users, AlertTriangle } from "lucide-react";

interface SessionProgressCardProps {
  session: {
    id: string;
    name: string;
    description?: string | null;
    status?: string | null;
    total_items?: number | null;
    responded_items?: number | null;
    session_date?: string | null;
    auditor_id?: string | null;
    auditee_id?: string | null;
  };
  onExecute: (sessionId: string) => void;
  occurrencesCount?: number;
}

export function SessionProgressCard({ session, onExecute, occurrencesCount = 0 }: SessionProgressCardProps) {
  const total = session.total_items || 0;
  const responded = session.responded_items || 0;
  const progress = total > 0 ? (responded / total) * 100 : 0;

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    'Pendente': { label: 'Pendente', variant: 'secondary' },
    'Em_Andamento': { label: 'Em Andamento', variant: 'default' },
    'Concluida': { label: 'Concluída', variant: 'outline' },
  };

  const status = statusConfig[session.status || 'Pendente'] || statusConfig['Pendente'];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{session.name}</CardTitle>
            {session.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
            )}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{responded}/{total} itens</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {session.session_date && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(session.session_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {(session.auditor_id || session.auditee_id) && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Participantes definidos</span>
            </div>
          )}
          {occurrencesCount > 0 && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{occurrencesCount} ocorrência(s)</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            onClick={() => onExecute(session.id)}
            variant={session.status === 'Concluida' ? 'outline' : 'default'}
            size="sm"
          >
            {session.status === 'Concluida' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Revisar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {session.status === 'Em_Andamento' ? 'Continuar' : 'Iniciar'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
