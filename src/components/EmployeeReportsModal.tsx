import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  FileText, Download, Users, Building, CalendarIcon,
  Filter, Briefcase, UserCheck, GraduationCap, Clock,
  UserPlus, User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

type ReportTypeId =
  | 'employees_by_branch'
  | 'employees_by_position'
  | 'employees_active_inactive'
  | 'trainings_by_period'
  | 'trainings_by_title_hours'
  | 'admissions_dismissals'
  | 'individual_employee';

type FilterField = 'branch' | 'position' | 'department' | 'employee' | 'trainingTitle' | 'workloadHours' | 'status' | 'period';

interface ReportTypeDef {
  id: ReportTypeId;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  filters: FilterField[];
}

const REPORT_TYPES: ReportTypeDef[] = [
  {
    id: 'employees_by_branch',
    name: 'Funcionários por Filial',
    description: 'Lista de funcionários agrupados por filial',
    icon: Building,
    color: 'text-blue-500',
    filters: ['branch', 'department', 'status'],
  },
  {
    id: 'employees_by_position',
    name: 'Funcionários por Cargo',
    description: 'Lista de funcionários agrupados por cargo',
    icon: Briefcase,
    color: 'text-indigo-500',
    filters: ['branch', 'position', 'department', 'status'],
  },
  {
    id: 'employees_active_inactive',
    name: 'Funcionários Ativos/Inativos',
    description: 'Funcionários separados por status ativo ou inativo',
    icon: UserCheck,
    color: 'text-green-500',
    filters: ['branch', 'department', 'status'],
  },
  {
    id: 'trainings_by_period',
    name: 'Treinamentos Realizados por Período',
    description: 'Treinamentos concluídos dentro de um período',
    icon: GraduationCap,
    color: 'text-purple-500',
    filters: ['branch', 'employee', 'trainingTitle', 'period'],
  },
  {
    id: 'trainings_by_title_hours',
    name: 'Treinamentos por Título e Carga Horária',
    description: 'Relatório de treinamentos com título e carga horária',
    icon: Clock,
    color: 'text-orange-500',
    filters: ['branch', 'trainingTitle', 'workloadHours'],
  },
  {
    id: 'admissions_dismissals',
    name: 'Admissões e Demissões por Período',
    description: 'Admissões e demissões dentro de um período específico',
    icon: UserPlus,
    color: 'text-red-500',
    filters: ['branch', 'department', 'period'],
  },
  {
    id: 'individual_employee',
    name: 'Relatório Individual por Funcionário',
    description: 'Dados completos de um funcionário específico',
    icon: User,
    color: 'text-teal-500',
    filters: ['employee'],
  },
];

interface Filters {
  branch: string;
  position: string;
  department: string;
  employee: string;
  trainingTitle: string;
  workloadHours: string;
  status: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const defaultFilters: Filters = {
  branch: 'all',
  position: 'all',
  department: 'all',
  employee: 'all',
  trainingTitle: 'all',
  workloadHours: '',
  status: 'all',
  startDate: undefined,
  endDate: undefined,
};

export function EmployeeReportsModal({ isOpen, onClose, initialReportType }: EmployeeReportsModalProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportTypeId | ''>('');
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const { selectedCompany } = useCompany();

  useEffect(() => {
    if (isOpen && initialReportType) {
      setSelectedReportType(initialReportType as ReportTypeId);
    }
  }, [isOpen, initialReportType]);

  // Reset filters when report type changes
  useEffect(() => {
    setFilters({ ...defaultFilters });
  }, [selectedReportType]);

  // --- Data queries ---
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

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-reports', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedCompany?.id,
  });

  const { data: trainingPrograms = [] } = useQuery({
    queryKey: ['training-programs-for-reports', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      const { data, error } = await supabase
        .from('training_programs')
        .select('id, name, duration_hours, category, status')
        .eq('company_id', selectedCompany.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedCompany?.id,
  });

  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ['employee-trainings-for-reports', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      const { data, error } = await supabase
        .from('employee_trainings')
        .select('*')
        .eq('company_id', selectedCompany.id);
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!selectedCompany?.id,
  });

  // --- Derived filter options ---
  const departments = useMemo(() =>
    [...new Set(employees.map((e: any) => e.department).filter(Boolean))].sort() as string[],
    [employees]
  );

  const positions = useMemo(() =>
    [...new Set(employees.map((e: any) => e.position).filter(Boolean))].sort() as string[],
    [employees]
  );

  const selectedReportDef = REPORT_TYPES.find(r => r.id === selectedReportType);
  const activeFilters = selectedReportDef?.filters || [];

  // --- Helpers ---
  const getBranchLabel = (branchId: string | null) => {
    if (!branchId) return '';
    const b = branches.find((br: any) => br.id === branchId);
    return b ? (b.code ? `${b.code} - ${b.name}` : b.name) : '';
  };

  const formatDate = (d: string | null) => {
    if (!d) return '';
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }); } catch { return d; }
  };

  // --- Report generators ---
  const generateReportData = (): { headers: string[]; rows: any[][]; sheetName: string } | null => {
    if (!selectedReportType) return null;

    const filteredEmployees = employees.filter((emp: any) => {
      if (filters.branch !== 'all' && emp.branch_id !== filters.branch) return false;
      if (filters.department !== 'all' && emp.department !== filters.department) return false;
      if (filters.position !== 'all' && emp.position !== filters.position) return false;
      if (filters.status !== 'all' && emp.status !== filters.status) return false;
      if (filters.employee !== 'all' && emp.id !== filters.employee) return false;
      return true;
    });

    switch (selectedReportType) {
      case 'employees_by_branch': {
        const sorted = [...filteredEmployees].sort((a: any, b: any) => {
          const brA = getBranchLabel(a.branch_id); const brB = getBranchLabel(b.branch_id);
          return brA.localeCompare(brB) || (a.department || '').localeCompare(b.department || '') || (a.position || '').localeCompare(b.position || '') || a.full_name.localeCompare(b.full_name);
        });
        return {
          sheetName: 'Funcionários por Filial',
          headers: ['Filial', 'CPF', 'Nome', 'E-mail', 'Telefone', 'Departamento', 'Cargo', 'Data Admissão', 'Status'],
          rows: sorted.map((e: any) => [
            getBranchLabel(e.branch_id), e.cpf || '', e.full_name, e.email || '', e.phone || '',
            e.department || '', e.position || '', formatDate(e.hire_date), e.status || '',
          ]),
        };
      }

      case 'employees_by_position': {
        const sorted = [...filteredEmployees].sort((a: any, b: any) =>
          (a.position || '').localeCompare(b.position || '') || getBranchLabel(a.branch_id).localeCompare(getBranchLabel(b.branch_id)) || a.full_name.localeCompare(b.full_name)
        );
        return {
          sheetName: 'Funcionários por Cargo',
          headers: ['Cargo', 'Filial', 'CPF', 'Nome', 'E-mail', 'Telefone', 'Departamento', 'Data Admissão', 'Status'],
          rows: sorted.map((e: any) => [
            e.position || '', getBranchLabel(e.branch_id), e.cpf || '', e.full_name,
            e.email || '', e.phone || '', e.department || '', formatDate(e.hire_date), e.status || '',
          ]),
        };
      }

      case 'employees_active_inactive': {
        const sorted = [...filteredEmployees].sort((a: any, b: any) =>
          (a.status || '').localeCompare(b.status || '') || getBranchLabel(a.branch_id).localeCompare(getBranchLabel(b.branch_id)) || a.full_name.localeCompare(b.full_name)
        );
        return {
          sheetName: 'Ativos e Inativos',
          headers: ['Status', 'Filial', 'CPF', 'Nome', 'E-mail', 'Telefone', 'Departamento', 'Cargo', 'Data Admissão', 'Data Demissão'],
          rows: sorted.map((e: any) => [
            e.status || '', getBranchLabel(e.branch_id), e.cpf || '', e.full_name,
            e.email || '', e.phone || '', e.department || '', e.position || '',
            formatDate(e.hire_date), formatDate(e.termination_date),
          ]),
        };
      }

      case 'trainings_by_period': {
        let trainingRows = employeeTrainings.filter((t: any) => t.status === 'Concluído');
        if (filters.startDate) {
          trainingRows = trainingRows.filter((t: any) => t.completion_date && new Date(t.completion_date) >= filters.startDate!);
        }
        if (filters.endDate) {
          trainingRows = trainingRows.filter((t: any) => t.completion_date && new Date(t.completion_date) <= filters.endDate!);
        }
        if (filters.trainingTitle !== 'all') {
          trainingRows = trainingRows.filter((t: any) => t.training_program_id === filters.trainingTitle);
        }
        if (filters.employee !== 'all') {
          trainingRows = trainingRows.filter((t: any) => t.employee_id === filters.employee);
        }
        if (filters.branch !== 'all') {
          const branchEmpIds = new Set(employees.filter((e: any) => e.branch_id === filters.branch).map((e: any) => e.id));
          trainingRows = trainingRows.filter((t: any) => branchEmpIds.has(t.employee_id));
        }

        const rows = trainingRows.map((t: any) => {
          const emp = employees.find((e: any) => e.id === t.employee_id);
          const prog = trainingPrograms.find((p: any) => p.id === t.training_program_id);
          return {
            title: prog?.name || '',
            date: t.completion_date || '',
            empName: emp?.full_name || '',
            empCpf: emp?.cpf || '',
            branch: getBranchLabel(emp?.branch_id),
            hours: prog?.duration_hours || 0,
            category: prog?.category || '',
          };
        }).sort((a, b) => a.title.localeCompare(b.title) || a.date.localeCompare(b.date) || a.empName.localeCompare(b.empName));

        return {
          sheetName: 'Treinamentos por Período',
          headers: ['Treinamento', 'Categoria', 'Carga Horária', 'Data Conclusão', 'Funcionário', 'CPF', 'Filial'],
          rows: rows.map(r => [r.title, r.category, r.hours, formatDate(r.date), r.empName, r.empCpf, r.branch]),
        };
      }

      case 'trainings_by_title_hours': {
        let progs = [...trainingPrograms];
        if (filters.trainingTitle !== 'all') {
          progs = progs.filter((p: any) => p.id === filters.trainingTitle);
        }
        if (filters.workloadHours) {
          const minH = Number(filters.workloadHours);
          if (!isNaN(minH)) progs = progs.filter((p: any) => (p.duration_hours || 0) >= minH);
        }
        if (filters.branch !== 'all') {
          progs = progs.filter((p: any) => p.branch_id === filters.branch || !p.branch_id);
        }

        const rows = progs.map((p: any) => {
          const count = employeeTrainings.filter((t: any) => t.training_program_id === p.id && t.status === 'Concluído').length;
          return [p.name, p.category || '', p.duration_hours || 0, p.status || '', count];
        }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

        return {
          sheetName: 'Treinamentos Título e CH',
          headers: ['Título do Treinamento', 'Categoria', 'Carga Horária (h)', 'Status', 'Participantes Concluídos'],
          rows,
        };
      }

      case 'admissions_dismissals': {
        let emps = [...filteredEmployees];
        const admissions = emps.filter((e: any) => {
          if (!e.hire_date) return false;
          const d = new Date(e.hire_date);
          if (filters.startDate && d < filters.startDate) return false;
          if (filters.endDate && d > filters.endDate) return false;
          return true;
        }).map((e: any) => ({ ...e, _type: 'Admissão', _date: e.hire_date }));

        const dismissals = emps.filter((e: any) => {
          if (!e.termination_date) return false;
          const d = new Date(e.termination_date);
          if (filters.startDate && d < filters.startDate) return false;
          if (filters.endDate && d > filters.endDate) return false;
          return true;
        }).map((e: any) => ({ ...e, _type: 'Demissão', _date: e.termination_date }));

        const combined = [...admissions, ...dismissals].sort((a, b) =>
          getBranchLabel(a.branch_id).localeCompare(getBranchLabel(b.branch_id)) || a._date.localeCompare(b._date)
        );

        return {
          sheetName: 'Admissões e Demissões',
          headers: ['Tipo', 'Data', 'Filial', 'CPF', 'Nome', 'E-mail', 'Departamento', 'Cargo', 'Status'],
          rows: combined.map((e: any) => [
            e._type, formatDate(e._date), getBranchLabel(e.branch_id), e.cpf || '',
            e.full_name, e.email || '', e.department || '', e.position || '', e.status || '',
          ]),
        };
      }

      case 'individual_employee': {
        if (filters.employee === 'all') {
          toast.error('Selecione um funcionário para gerar o relatório individual');
          return null;
        }
        const emp = employees.find((e: any) => e.id === filters.employee);
        if (!emp) return null;

        const empTrainings = employeeTrainings
          .filter((t: any) => t.employee_id === emp.id)
          .map((t: any) => {
            const prog = trainingPrograms.find((p: any) => p.id === t.training_program_id);
            return { ...t, _progName: prog?.name || '', _hours: prog?.duration_hours || 0 };
          });

        const infoRows: any[][] = [
          ['CPF', emp.cpf || ''],
          ['Nome Completo', emp.full_name],
          ['E-mail', emp.email || ''],
          ['Telefone', emp.phone || ''],
          ['Filial', getBranchLabel(emp.branch_id)],
          ['Departamento', emp.department || ''],
          ['Cargo', emp.position || ''],
          ['Data Admissão', formatDate(emp.hire_date)],
          ['Data Demissão', formatDate(emp.termination_date)],
          ['Status', emp.status || ''],
          ['Tipo Contrato', emp.employment_type || ''],
          ['Gênero', emp.gender || ''],
          ['Data Nascimento', formatDate(emp.birth_date)],
          ['Escolaridade', emp.education_level || ''],
          ['', ''],
          ['--- TREINAMENTOS ---', ''],
        ];

        if (empTrainings.length > 0) {
          infoRows.push(['Treinamento', 'Carga Horária', 'Status', 'Data Conclusão']);
          empTrainings.forEach((t: any) => {
            infoRows.push([t._progName, t._hours, t.status || '', formatDate(t.completion_date)]);
          });
        } else {
          infoRows.push(['Nenhum treinamento registrado', '']);
        }

        return {
          sheetName: 'Relatório Individual',
          headers: ['Campo', 'Valor'],
          rows: infoRows,
        };
      }

      default:
        return null;
    }
  };

  // --- Export to Excel ---
  const handleExport = () => {
    const reportData = generateReportData();
    if (!reportData) return;
    if (reportData.rows.length === 0) {
      toast.error('Nenhum dado encontrado com os filtros selecionados');
      return;
    }

    const wsData = [reportData.headers, ...reportData.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width columns
    const colWidths = reportData.headers.map((h, i) => {
      let maxLen = h.length;
      reportData.rows.forEach(row => {
        const cellLen = String(row[i] || '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Bold header row
    reportData.headers.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cellRef]) {
        ws[cellRef].s = { font: { bold: true } };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportData.sheetName.substring(0, 31));

    const fileName = `${reportData.sheetName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Relatório Excel gerado com sucesso!');
  };

  // --- Render filter fields dynamically ---
  const renderFilters = () => {
    if (!selectedReportDef) return null;

    const filterComponents: React.ReactNode[] = [];

    if (activeFilters.includes('branch')) {
      filterComponents.push(
        <div key="branch" className="space-y-2">
          <Label>Filial</Label>
          <Select value={filters.branch} onValueChange={v => setFilters(p => ({ ...p, branch: v }))}>
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.code ? `${b.code} - ${b.name}` : b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('department')) {
      filterComponents.push(
        <div key="department" className="space-y-2">
          <Label>Departamento</Label>
          <Select value={filters.department} onValueChange={v => setFilters(p => ({ ...p, department: v }))}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('position')) {
      filterComponents.push(
        <div key="position" className="space-y-2">
          <Label>Cargo</Label>
          <Select value={filters.position} onValueChange={v => setFilters(p => ({ ...p, position: v }))}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {positions.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('employee')) {
      filterComponents.push(
        <div key="employee" className="space-y-2">
          <Label>Funcionário</Label>
          <Select value={filters.employee} onValueChange={v => setFilters(p => ({ ...p, employee: v }))}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              {selectedReportType !== 'individual_employee' && <SelectItem value="all">Todos os funcionários</SelectItem>}
              {employees.map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.full_name}{e.cpf ? ` (${e.cpf})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('trainingTitle')) {
      filterComponents.push(
        <div key="trainingTitle" className="space-y-2">
          <Label>Título do Treinamento</Label>
          <Select value={filters.trainingTitle} onValueChange={v => setFilters(p => ({ ...p, trainingTitle: v }))}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os treinamentos</SelectItem>
              {trainingPrograms.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('workloadHours')) {
      filterComponents.push(
        <div key="workloadHours" className="space-y-2">
          <Label>Carga Horária Mínima (h)</Label>
          <Input
            type="number"
            placeholder="Ex: 8"
            value={filters.workloadHours}
            onChange={e => setFilters(p => ({ ...p, workloadHours: e.target.value }))}
          />
        </div>
      );
    }

    if (activeFilters.includes('status')) {
      filterComponents.push(
        <div key="status" className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v }))}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
              <SelectItem value="Licença">Licença</SelectItem>
              <SelectItem value="Férias">Férias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (activeFilters.includes('period')) {
      filterComponents.push(
        <div key="startDate" className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.startDate} onSelect={d => setFilters(p => ({ ...p, startDate: d }))} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>,
        <div key="endDate" className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.endDate} onSelect={d => setFilters(p => ({ ...p, endDate: d }))} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    if (filterComponents.length === 0) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros — {selectedReportDef.name}
          </CardTitle>
          <CardDescription>Filtros específicos para este tipo de relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterComponents}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios de RH
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de relatório, configure os filtros e exporte em Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipos de Relatório</CardTitle>
              <CardDescription>Selecione o relatório desejado — os filtros serão carregados automaticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORT_TYPES.map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedReportType === report.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedReportType(report.id)}
                  >
                    <div className="flex items-start gap-3">
                      <report.icon className={`h-5 w-5 mt-0.5 ${report.color}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{report.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
                      </div>
                      {selectedReportType === report.id && (
                        <Badge variant="default" className="ml-1 shrink-0">Selecionado</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Filters */}
          {selectedReportType && renderFilters()}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleExport} disabled={!selectedReportType}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
