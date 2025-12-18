/**
 * ReportSummaryCard - Card de resumo do relatório
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditReportData } from "@/services/audit/reports";
import { Calendar, User, Target, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportSummaryCardProps {
  data: AuditReportData;
}

export function ReportSummaryCard({ data }: ReportSummaryCardProps) {
  const { audit, scoring } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'conditional': return 'bg-yellow-500';
      case 'em_execucao': return 'bg-blue-500';
      case 'concluida': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{audit.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{audit.audit_type}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{audit.status}</Badge>
            {scoring?.status && (
              <Badge className={getStatusColor(scoring.status)}>
                {scoring.status === 'passed' ? 'Aprovado' : 
                 scoring.status === 'failed' ? 'Reprovado' : 
                 scoring.status === 'conditional' ? 'Condicional' : 'Pendente'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm font-medium">
                {formatDate(audit.start_date)} - {formatDate(audit.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Auditor Líder</p>
              <p className="text-sm font-medium">{audit.lead_auditor || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Entidade</p>
              <p className="text-sm font-medium">{audit.target_entity || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Normas</p>
              <p className="text-sm font-medium">{data.standards.length} norma(s)</p>
            </div>
          </div>
        </div>

        {audit.scope && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Escopo</p>
            <p className="text-sm">{audit.scope}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
