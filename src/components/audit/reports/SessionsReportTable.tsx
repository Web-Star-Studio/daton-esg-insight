/**
 * SessionsReportTable - Tabela de sessões para relatório
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuditReportData } from "@/services/audit/reports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionsReportTableProps {
  sessions: AuditReportData['sessions'];
}

export function SessionsReportTable({ sessions }: SessionsReportTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-500';
      case 'em_execucao': return 'bg-blue-500';
      case 'planejada': return 'bg-muted';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'planejada': 'Planejada',
      'em_execucao': 'Em Execução',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões de Auditoria</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sessão registrada
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sessão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Itens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>
                    {session.scheduled_date 
                      ? format(new Date(session.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)} variant="secondary">
                      {getStatusLabel(session.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={session.progress} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">
                        {session.progress.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {session.responded_items} / {session.total_items}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
