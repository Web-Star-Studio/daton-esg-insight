import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Printer, BarChart3, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { format, subMonths, subQuarters, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auditService } from '@/services/audit';
import { useAuditReportExport } from '@/hooks/useAuditReportExport';
import { toast } from 'sonner';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year';

export const AuditReportsTab = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const { exportAuditReportToPDF, isExporting } = useAuditReportExport();

  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => auditService.getAudits(),
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['all-audit-findings'],
    queryFn: () => auditService.getAllFindings(),
  });

  const filteredAudits = useMemo(() => {
    if (periodFilter === 'all') return audits;

    const now = new Date();
    let startDate: Date;

    switch (periodFilter) {
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'quarter':
        startDate = subQuarters(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      default:
        return audits;
    }

    return audits.filter(audit => {
      const auditDate = new Date(audit.created_at);
      return auditDate >= startDate;
    });
  }, [audits, periodFilter]);

  const stats = useMemo(() => {
    const total = filteredAudits.length;
    const byStatus = filteredAudits.reduce((acc, audit) => {
      acc[audit.status] = (acc[audit.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = filteredAudits.reduce((acc, audit) => {
      const type = audit.audit_type || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus, byType };
  }, [filteredAudits]);

  const handleExportPDF = () => {
    exportAuditReportToPDF(filteredAudits, findings, stats);
  };

  const handlePrint = () => {
    window.print();
    toast.success('Enviando para impressão...');
  };

  const isLoading = auditsLoading || findingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Carregando dados do relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Relatórios de Auditoria</CardTitle>
              <CardDescription>Análises e estatísticas consolidadas</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleExportPDF} disabled={isExporting}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Auditorias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as auditorias registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['Concluída'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round(((stats.byStatus['Concluída'] || 0) / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['Em Andamento'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round(((stats.byStatus['Em Andamento'] || 0) / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus['Planejada'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round(((stats.byStatus['Planejada'] || 0) / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byType).length > 0 ? (
              Object.entries(stats.byType).map(([type, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{type}</span>
                      <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byStatus).length > 0 ? (
              Object.entries(stats.byStatus).map(([status, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{status}</span>
                      <span className="text-muted-foreground">{count} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-secondary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auditorias Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auditorias Recentes</CardTitle>
          <CardDescription>Últimas 10 auditorias registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAudits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.slice(0, 10).map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.title || 'Sem título'}</TableCell>
                    <TableCell>{audit.audit_type || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        audit.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                        audit.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {audit.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {audit.created_at ? format(new Date(audit.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma auditoria encontrada</h3>
              <p className="text-muted-foreground">
                Não há auditorias registradas no período selecionado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
