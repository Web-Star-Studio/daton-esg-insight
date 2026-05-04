import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getEmployeesInExperiencePeriod,
  resolveExperienceContract,
  revertExperienceContract,
  type Employee,
  type EmployeeInExperience,
} from '@/services/employees';
import { formatDateDisplay } from '@/utils/dateUtils';

interface Props {
  onViewEmployee: (employee: Employee) => void;
}

const UNDO_SECONDS = 10;

function showUndoToast(name: string, label: string, onUndo: () => void) {
  let remaining = UNDO_SECONDS;
  let undone = false;

  const makeAction = () => ({
    label: `Desfazer (${remaining}s)`,
    onClick: () => {
      undone = true;
      onUndo();
    },
  });

  const id = toast.success(label, {
    description: name,
    duration: UNDO_SECONDS * 1000,
    action: makeAction(),
  });

  const interval = setInterval(() => {
    remaining--;
    if (remaining <= 0 || undone) {
      clearInterval(interval);
      return;
    }
    toast.success(label, {
      id,
      description: name,
      duration: remaining * 1000,
      action: makeAction(),
    });
  }, 1000);
}

export function EmployeeExperienceContractTab({ onViewEmployee }: Props) {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees-experience-period'],
    queryFn: getEmployeesInExperiencePeriod,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['employees-experience-period'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
  };

  const { mutate: revert } = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'efetivado' | 'nao_renovado' }) =>
      revertExperienceContract(id, decision),
    onSuccess: invalidate,
    onError: () => toast.error('Erro ao desfazer. Verifique o banco e tente novamente.'),
  });

  const { mutate: resolve } = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'efetivado' | 'nao_renovado' }) =>
      resolveExperienceContract(id, decision),
    onSuccess: (_, { id, decision }) => {
      invalidate();
      const emp = employees.find((e) => e.id === id);
      const label = decision === 'efetivado' ? 'Efetivado' : 'Não renovado';
      showUndoToast(emp?.full_name ?? '', label, () => revert({ id, decision }));
    },
    onError: () => toast.error('Erro ao registrar decisão. Tente novamente.'),
  });

  const alertCount = employees.filter((e) => e.alertFor45 || e.alertFor90).length;

  const addDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return formatDateDisplay(d.toISOString().split('T')[0]) || '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando contratos de experiência...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Em Período de Experiência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">colaboradores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertCount}</div>
            <p className="text-xs text-muted-foreground">vencimento em até 5 dias</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos de Experiência</CardTitle>
          <CardDescription>
            Colaboradores no período probatório (45 + 45 dias). Após a decisão, você tem {UNDO_SECONDS}s para desfazer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum colaborador em período de experiência no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Colaborador</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Admissão</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Progresso</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Período</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Venc. 1º (45d)</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Venc. 2º (90d)</th>
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 font-medium text-muted-foreground">Decisão</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td
                        className="py-3 pr-4 cursor-pointer"
                        onClick={() => onViewEmployee(emp)}
                      >
                        <div className="font-medium">{emp.full_name}</div>
                        {emp.department && (
                          <div className="text-xs text-muted-foreground">{emp.department}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDateDisplay(emp.hire_date) || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((emp.daysInCompany / 90) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {emp.daysInCompany}d
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={emp.period === 1 ? 'secondary' : 'outline'}>
                          {emp.period}º Período
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-xs text-muted-foreground">{addDays(emp.hire_date, 45)}</div>
                        {emp.alertFor45 && emp.daysTo45 !== null && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {emp.daysTo45}d
                          </Badge>
                        )}
                        {emp.daysTo45 === null && (
                          <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
                            Encerrado
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-xs text-muted-foreground">{addDays(emp.hire_date, 90)}</div>
                        {emp.alertFor90 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {emp.daysTo90}d
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {emp.alertFor45 || emp.alertFor90 ? (
                          <Badge variant="destructive">Atenção</Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                            onClick={() => resolve({ id: emp.id, decision: 'efetivado' })}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Efetivar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => resolve({ id: emp.id, decision: 'nao_renovado' })}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Não renovar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
