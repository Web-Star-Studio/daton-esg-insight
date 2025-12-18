/**
 * OccurrencesReportTable - Tabela de ocorrências para relatório
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuditReportData } from "@/services/audit/reports";
import { ReportsService } from "@/services/audit/reports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertOctagon, AlertTriangle, Eye, Lightbulb } from "lucide-react";

interface OccurrencesReportTableProps {
  occurrences: AuditReportData['occurrences'];
}

export function OccurrencesReportTable({ occurrences }: OccurrencesReportTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nc_maior': return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'nc_menor': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'observacao': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'oportunidade': return <Lightbulb className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fechada': return 'bg-green-500';
      case 'em_tratamento': return 'bg-blue-500';
      case 'aberta': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'alta': return 'text-red-500';
      case 'media': return 'text-yellow-500';
      case 'baixa': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  // Group by type
  const groupedOccurrences = occurrences.reduce((acc, occ) => {
    if (!acc[occ.occurrence_type]) {
      acc[occ.occurrence_type] = [];
    }
    acc[occ.occurrence_type].push(occ);
    return acc;
  }, {} as Record<string, typeof occurrences>);

  const typeOrder = ['nc_maior', 'nc_menor', 'observacao', 'oportunidade'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ocorrências</CardTitle>
          <div className="flex gap-2 text-sm">
            <span className="flex items-center gap-1">
              <AlertOctagon className="h-3 w-3 text-red-500" />
              {occurrences.filter(o => o.occurrence_type === 'nc_maior').length}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              {occurrences.filter(o => o.occurrence_type === 'nc_menor').length}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-yellow-500" />
              {occurrences.filter(o => o.occurrence_type === 'observacao').length}
            </span>
            <span className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-green-500" />
              {occurrences.filter(o => o.occurrence_type === 'oportunidade').length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {occurrences.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma ocorrência registrada
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeOrder.map(type => 
                groupedOccurrences[type]?.map((occ) => (
                  <TableRow key={occ.id}>
                    <TableCell>{getTypeIcon(occ.occurrence_type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{occ.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {occ.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(occ.status)} variant="secondary">
                        {ReportsService.getStatusLabel(occ.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={getPriorityColor(occ.priority)}>
                        {occ.priority ? ReportsService.getPriorityLabel(occ.priority) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {occ.due_date 
                        ? format(new Date(occ.due_date), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
