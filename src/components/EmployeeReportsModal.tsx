import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  FileText, 
  Download, 
  Users, 
  TrendingUp, 
  Building, 
  CalendarIcon,
  DollarSign,
  Gift,
  Filter,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees, getEmployeesStats } from '@/services/employees';
import { getBenefitStats } from '@/services/benefits';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  // Set initial report type when modal opens
  useEffect(() => {
    if (isOpen && initialReportType) {
      setSelectedReportType(initialReportType);
    }
  }, [isOpen, initialReportType]);

  // Fetch employees data
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: isOpen,
  });

  // Fetch employee stats
  const { data: employeeStats } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: getEmployeesStats,
    enabled: isOpen,
  });

  // Fetch benefit stats
  const { data: benefitStats } = useQuery({
    queryKey: ['benefit-stats'],
    queryFn: getBenefitStats,
    enabled: isOpen,
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const generateReport = async () => {
    if (!selectedReportType) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    try {
      let reportData: any = {};
      let fileName = '';

      switch (selectedReportType) {
        case 'employees':
          reportData = getEmployeeReport();
          fileName = 'relatorio-funcionarios';
          break;
        case 'diversity':
          reportData = getDiversityReport();
          fileName = 'relatorio-diversidade';
          break;
        case 'departments':
          reportData = getDepartmentReport();
          fileName = 'relatorio-departamentos';
          break;
        case 'benefits':
          reportData = getBenefitReport();
          fileName = 'relatorio-beneficios';
          break;
        case 'salaries':
          reportData = getSalaryReport();
          fileName = 'relatorio-salarial';
          break;
        case 'turnover':
          reportData = getTurnoverReport();
          fileName = 'relatorio-turnover';
          break;
        default:
          toast.error('Tipo de relatório não implementado');
          return;
      }

      // Create CSV content
      const csvContent = generateCSV(reportData);
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
    }
  };

  const getEmployeeReport = () => {
    const filteredEmployees = employees.filter(emp => {
      if (filters.department !== 'all' && emp.department !== filters.department) return false;
      if (filters.status !== 'all' && emp.status !== filters.status) return false;
      return true;
    });

    return {
      headers: [
        'Código', 'Nome Completo', 'E-mail', 'Telefone', 'Departamento', 
        'Cargo', 'Data Contratação', 'Status', 'Tipo Contrato', 'Localização'
      ],
      data: filteredEmployees.map(emp => [
        emp.employee_code,
        emp.full_name,
        emp.email || '',
        emp.phone || '',
        emp.department || '',
        emp.position || '',
        emp.hire_date,
        emp.status,
        emp.employment_type,
        emp.location || ''
      ])
    };
  };

  const getDiversityReport = () => {
    const genderData = Object.entries(employeeStats?.genderDistribution || {}).map(([gender, count]) => [
      gender,
      count,
      ((count as number) / employees.length * 100).toFixed(1) + '%'
    ]);

    return {
      headers: ['Gênero', 'Quantidade', 'Percentual'],
      data: genderData
    };
  };

  const getDepartmentReport = () => {
    const departmentData = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      return [
        dept,
        deptEmployees.length,
        deptEmployees.filter(emp => emp.status === 'Ativo').length,
        ((deptEmployees.length / employees.length) * 100).toFixed(1) + '%'
      ];
    });

    return {
      headers: ['Departamento', 'Total Funcionários', 'Funcionários Ativos', 'Percentual'],
      data: departmentData
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
    const salaryData = employees
      .filter(emp => emp.salary)
      .map(emp => [
        emp.employee_code,
        emp.full_name,
        emp.department || '',
        emp.position || '',
        `R$ ${emp.salary?.toLocaleString('pt-BR') || '0'}`
      ]);

    return {
      headers: ['Código', 'Nome', 'Departamento', 'Cargo', 'Salário'],
      data: salaryData
    };
  };

  const getTurnoverReport = () => {
    const currentYear = new Date().getFullYear();
    const hiredThisYear = employees.filter(emp => 
      new Date(emp.hire_date).getFullYear() === currentYear
    ).length;
    
    const inactiveEmployees = employees.filter(emp => emp.status === 'Inativo').length;
    const activeEmployees = employees.filter(emp => emp.status === 'Ativo').length;
    
    const turnoverRate = employees.length > 0 ? (inactiveEmployees / employees.length * 100).toFixed(1) : '0';
    const retentionRate = employees.length > 0 ? (activeEmployees / employees.length * 100).toFixed(1) : '0';

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

  const generateCSV = (reportData: any) => {
    const { headers, data } = reportData;
    let csvContent = headers.join(',') + '\n';
    
    data.forEach((row: any[]) => {
      const escapedRow = row.map(cell => {
        const cellStr = String(cell || '');
        return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
      });
      csvContent += escapedRow.join(',') + '\n';
    });
    
    return csvContent;
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
            Configure filtros e gere relatórios detalhados sobre funcionários, benefícios e estatísticas de RH
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
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os departamentos</SelectItem>
                      {departments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
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
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
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
              Gerar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}