import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Loader2, Download, Filter, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useAuditTrail, useAuditUsers, useAuditActionTypes, exportAuditLogsToCSV, type AuditTrailFilters } from '@/hooks/admin/useAuditTrail';
import { toast } from 'sonner';

const ACTION_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CREATE: { label: 'Criação', variant: 'default' },
  UPDATE: { label: 'Atualização', variant: 'secondary' },
  DELETE: { label: 'Exclusão', variant: 'destructive' },
  LOGIN: { label: 'Login', variant: 'outline' },
  LOGOUT: { label: 'Logout', variant: 'outline' },
  user_created: { label: 'Usuário Criado', variant: 'default' },
  admin_user_created: { label: 'Usuário Criado', variant: 'default' },
  admin_user_updated: { label: 'Usuário Atualizado', variant: 'secondary' },
  admin_user_role_changed: { label: 'Role Alterado', variant: 'secondary' },
  admin_user_deactivated: { label: 'Desativado', variant: 'destructive' },
  admin_user_deleted: { label: 'Excluído', variant: 'destructive' },
  admin_password_reset_sent: { label: 'Reset Senha', variant: 'outline' },
  settings_updated: { label: 'Config Alterada', variant: 'secondary' },
  audit_created: { label: 'Auditoria', variant: 'default' },
};

export const AuditTrailModule = () => {
  const [filters, setFilters] = useState<AuditTrailFilters>({
    page: 1,
    limit: 20,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, logs, total, totalPages } = useAuditTrail(filters);
  const { data: users } = useAuditUsers();
  const { data: actionTypes } = useAuditActionTypes();

  const handleFilterChange = useCallback((key: keyof AuditTrailFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setFilters(prev => ({
      ...prev,
      startDate: range?.from,
      endDate: range?.to,
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: 20 });
    setDateRange(undefined);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAuditLogsToCSV({
        userId: filters.userId,
        actionType: filters.actionType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      toast.success('Logs exportados com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar logs');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = filters.userId || filters.actionType || filters.startDate || filters.endDate;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trilha de Auditoria</CardTitle>
            <CardDescription>
              Logs de atividade dos últimos 90 dias ({total} registros)
            </CardDescription>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || isLoading}
            variant="outline"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select 
            value={filters.userId || 'all'} 
            onValueChange={(v) => handleFilterChange('userId', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os usuários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.actionType || 'all'} 
            onValueChange={(v) => handleFilterChange('actionType', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as ações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {actionTypes?.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateRangeChange}
            className="w-[280px]"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-[150px]">Ação</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <span className="text-sm text-muted-foreground mt-2 block">Carregando...</span>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => {
                  const badge = ACTION_BADGES[log.action_type] || { label: log.action_type, variant: 'outline' as const };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user_name}</span>
                          <span className="text-xs text-muted-foreground">{log.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate" title={log.description}>
                        {log.description}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {filters.page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange('page', filters.page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page === totalPages}
                onClick={() => handleFilterChange('page', filters.page + 1)}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
