import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  FileText, Download, Users, TrendingUp, Building, CalendarIcon,
  DollarSign, Gift, Filter, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees, getEmployeesStats } from '@/services/employees';
import { getBenefitStats } from '@/services/benefits';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface EmployeeReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: string;
}

export function EmployeeReportsModal({ isOpen, onClose, initialReportType }: EmployeeReportsModalProps) {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    branch: 'all',
    position: 'all',
    employee: 'all',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const { selectedCompany } = useCompany();

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches-for-reports', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('company_id', selectedCompany.id)
        .in('status', ['Ativo', 'Ativa'])
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedCompany?.id,
  });

  useEffect(() => {
    if (isOpen && initialReportType) {
      setSelectedReportType(initialReportType);
    }
  }, [isOpen, initialReportType]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: isOpen,
  });

  const { data: employeeStats } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
    enabled: isOpen,
  });

  const { data: benefitStats } = useQuery({
    queryKey: ['benefit-stats'],
    queryFn: getBenefitStats,
    enabled: isOpen,
  });

  const departments = useMemo(() =>
    [...new Set(employees.map(e => e.department).filter(Boolean))].sort() as string[],
    [employees]
  );

  const positions = useMemo(() =>
    [...new Set(employees.map(e => e.position).filter(Boolean))].sort() as string[],
    [employees]
  );

  const getBranchLabel = (branchId: string | null | undefined) => {
    if (!branchId) return '';
    const b = branches.find(br => br.id === branchId);
    return b ? (b.code ? `${b.code} - ${b.name}` : b.name) : '';
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '';
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
  };

  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      if (filters.department !== 'all' && emp.department !== filters.department) return false;
      if (filters.status !== 'all' && emp.status !== filters.status) return false;
      if (filters.branch !== 'all' && emp.branch_id !== filters.branch) return false;
      if (filters.position !== 'all' && emp.position !== filters.position) return false;
      if (filters.employee !== 'all' && emp.id !== filters.employee) return false;
      if (filters.startDate && new Date(emp.hire_date) < filters.startDate) return false;
      if (filters.endDate && new Date(emp.hire_date) > filters.endDate) return false;
      return true;
    });
  };

  const getEmployeeReport = () => {
    const filtered = getFilteredEmployees();
    // Ordenação: Filial > Departamento > Cargo > Nome
    const sorted = [...filtered].sort((a, b) => {
      const brA = getBranchLabel(a.branch_id); const brB = getBranchLabel(b.branch_id);
      return brA.localeCompare(brB)
        || (a.department || '').localeCompare(b.department || '')
        || (a.position || '').localeCompare(b.position || '')
        || a.full_name.localeCompare(b.full_name);
    });

    return {
      headers: ['CPF', 'Nome Completo', 'E-mail', 'Telefone', 'Filial', 'Departamento',
        'Cargo', 'Data Admissão', 'Data Demissão', 'Status', 'Tipo Contrato', 'Localização'],
      data: sorted.map(emp => [
        emp.cpf || '', emp.full_name, emp.email || '', emp.phone || '',
        getBranchLabel(emp.branch_id), emp.department || '', emp.position || '',
        formatDate(emp.hire_date), formatDate(emp.termination_date),
        emp.status, emp.employment_type, emp.location || ''
      ])
    };
  };

  const getDiversityReport = () => {
    const filtered = getFilteredEmployees();
    const genderData = filtered.reduce((acc: Record<string, number>, emp) => {
      const g = emp.gender || 'Não informado';
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});

    return {
      headers: ['Gênero', 'Quantidade', 'Percentual'],
      data: Object.entries(genderData).map(([gender, count]) => [
        gender, count, ((count / filtered.length) * 100).toFixed(1) + '%'
      ])
    };
  };

  const getDepartmentReport = () => {
    const filtered = getFilteredEmployees();
    const deptMap = filtered.reduce((acc: Record<string, { total: number; active: number }>, emp) => {
      const d = emp.department || 'Sem departamento';
      if (!acc[d]) acc[d] = { total: 0, active: 0 };
      acc[d].total++;
      if (emp.status === 'Ativo') acc[d].active++;
      return acc;
    }, {});

    return {
      headers: ['Departamento', 'Total Funcionários', 'Funcionários Ativos', 'Percentual'],
      data: Object.entries(deptMap).map(([dept, data]) => [
        dept, data.total, data.active,
        ((data.total / filtered.length) * 100).toFixed(1) + '%'
      ])
    };
  };

  const getBenefitReport = () => {
    return {
      headers: ['Métrica', 'Valor'],
      data: [
        ['Custo Total Mensal de Benefícios', `R$ ${benefitStats?.totalBenefitsCost?.toLocaleString('pt-BR') || '0'}`],
        ['Taxa de Participação', `${benefitStats?.benefitParticipation || 0}%`],
        ['Total de Inscrições', benefitStats?.totalEnrollments || 0],
        ['Total de Funcionários', benefitStats?.totalEmployees || 0]
      ]
    };
  };

  const getSalaryReport = () => {
    const filtered = getFilteredEmployees().filter(emp => emp.salary);
    const sorted = [...filtered].sort((a, b) =>
      getBranchLabel(a.branch_id).localeCompare(getBranchLabel(b.branch_id))
      || (a.department || '').localeCompare(b.department || '')
      || (a.position || '').localeCompare(b.position || '')
      || a.full_name.localeCompare(b.full_name)
    );

    return {
      headers: ['CPF', 'Nome', 'Filial', 'Departamento', 'Cargo', 'Salário'],
      data: sorted.map(emp => [
        emp.cpf || '', emp.full_name, getBranchLabel(emp.branch_id),
        emp.department || '', emp.position || '',
        `R$ ${emp.salary?.toLocaleString('pt-BR') || '0'}`
      ])
    };
  };

  const getTurnoverReport = () => {
    const filtered = getFilteredEmployees();
    const currentYear = new Date().getFullYear();
    const hiredThisYear = filtered.filter(emp =>
      new Date(emp.hire_date).getFullYear() === currentYear
    ).length;

    const inactiveEmployees = filtered.filter(emp => emp.status === 'Inativo').length;
    const activeEmployees = filtered.filter(emp => emp.status === 'Ativo').length;

    const turnoverRate = filtered.length > 0 ? (inactiveEmployees / filtered.length * 100).toFixed(1) : '0';
    const retentionRate = filtered.length > 0 ? (activeEmployees / filtered.length * 100).toFixed(1) : '0';

    return {
      headers: ['Métrica', 'Valor'],
      data: [
        ['Contratações no Ano', hiredThisYear],
        ['Funcionários Ativos', activeEmployees],
        ['Funcionários Inativos', inactiveEmployees],
        ['Taxa de Turnover', `${turnoverRate}%`],
        ['Taxa de Retenção', `${retentionRate}%`]
      ]
    };
  };

  const generateReport = async () => {
    if (!selectedReportType) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    try {
      let reportData: { headers: string[]; data: any[][] } | null = null;
      let fileName = '';

      switch (selectedReportType) {
        case 'employees':
          reportData = getEmployeeReport();
          fileName = 'Relatorio_Funcionarios';
          break;
        case 'diversity':
          reportData = getDiversityReport();
          fileName = 'Relatorio_Diversidade';
          break;
        case 'departments':
          reportData = getDepartmentReport();
          fileName = 'Relatorio_Departamentos';
          break;
        case 'benefits':
          reportData = getBenefitReport();
          fileName = 'Relatorio_Beneficios';
          break;
        case 'salaries':
          reportData = getSalaryReport();
          fileName = 'Relatorio_Salarial';
          break;
        case 'turnover':
          reportData = getTurnoverReport();
          fileName = 'Relatorio_Turnover';
          break;
        default:
          toast.error('Tipo de relatório não implementado');
          return;
      }

      if (!reportData || reportData.data.length === 0) {
        toast.error('Nenhum dado encontrado com os filtros selecionados');
        return;
      }

      // Export to Excel
      const wsData = [reportData.headers, ...reportData.data];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-width columns
      const colWidths = reportData.headers.map((h, i) => {
        let maxLen = h.length;
        reportData!.data.forEach(row => {
          const cellLen = String(row[i] ?? '').length;
          if (cellLen > maxLen) maxLen = cellLen;
        });
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

      const fullFileName = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fullFileName);
      toast.success('Relatório Excel gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    }
  };

  const reportTypes = [
    {
      id: 'employees',
      name: 'Relatório de Funcionários',
      description: 'Lista completa de funcionários com informações detalhadas',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      id: 'diversity',
      name: 'Análise de Diversidade',
      description: 'Distribuição por gênero, etnia e outros fatores',
      icon: BarChart3,
      color: 'text-purple-500'
    },
    {
      id: 'departments',
      name: 'Relatório por Departamento',
      description: 'Análise de funcionários por departamento',
      icon: Building,
      color: 'text-green-500'
    },
    {
      id: 'benefits',
      name: 'Relatório de Benefícios',
      description: 'Custos e participação em benefícios',
      icon: Gift,
      color: 'text-pink-500'
    },
    {
      id: 'salaries',
      name: 'Análise Salarial',
      description: 'Informações salariais por cargo e departamento',
      icon: DollarSign,
      color: 'text-yellow-500'
    },
    {
      id: 'turnover',
      name: 'Relatório de Turnover',
      description: 'Taxa de rotatividade e retenção de funcionários',
      icon: TrendingUp,
      color: 'text-red-500'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatórios de RH
          </DialogTitle>
          <DialogDescription>
            Configure filtros e gere relatórios detalhados sobre funcionários em formato Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Total Funcionários</p>
                    <p className="text-2xl font-bold">{employeeStats?.totalEmployees || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Departamentos</p>
                    <p className="text-2xl font-bold">{departments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Custo Benefícios</p>
                    <p className="text-2xl font-bold">
                      R$ {(benefitStats?.totalBenefitsCost || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Taxa Retenção</p>
                    <p className="text-2xl font-bold">
                      {employees.length > 0
                        ? Math.round((employees.filter(e => e.status === 'Ativo').length / employees.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Configure filtros para personalizar o relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Filial</Label>
                  <Select value={filters.branch} onValueChange={v => setFilters(p => ({ ...p, branch: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todas as filiais" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as filiais</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code ? `${b.code} - ${b.name}` : b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={filters.department} onValueChange={v => setFilters(p => ({ ...p, department: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos os departamentos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os departamentos</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select value={filters.position} onValueChange={v => setFilters(p => ({ ...p, position: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos os cargos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cargos</SelectItem>
                      {positions.map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Licença">Licença</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Funcionário Específico</Label>
                  <Select value={filters.employee} onValueChange={v => setFilters(p => ({ ...p, employee: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todos os funcionários" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os funcionários</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}{emp.cpf ? ` (${emp.cpf})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filters.startDate} onSelect={d => setFilters(p => ({ ...p, startDate: d }))} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filters.endDate} onSelect={d => setFilters(p => ({ ...p, endDate: d }))} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Relatório</CardTitle>
              <CardDescription>
                Selecione o tipo de relatório que deseja gerar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedReportType === report.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedReportType(report.id)}
                  >
                    <div className="flex items-start gap-3">
                      <report.icon className={`h-5 w-5 mt-0.5 ${report.color}`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      </div>
                      {selectedReportType === report.id && (
                        <Badge variant="default" className="ml-2">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={generateReport} disabled={!selectedReportType}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
