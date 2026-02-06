import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, Clock, TrendingUp, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateDisplay } from "@/utils/dateUtils";
import { DateRange } from "react-day-picker";
import { useAttendanceRecords, useEmployees } from "@/services/attendanceService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AttendanceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function AttendanceReportsModal({ isOpen, onClose }: AttendanceReportsModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const { user } = useAuth();
  const companyId = user?.company?.id;

  const { data: attendanceRecords } = useAttendanceRecords(companyId || "", {
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
  });

  const { data: employees } = useEmployees(companyId || "");

  // Calcular estatísticas
  const calculateStats = () => {
    if (!attendanceRecords) return null;

    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(r => r.status === 'present').length;
    const lateRecords = attendanceRecords.filter(r => r.status === 'late').length;
    const absentRecords = attendanceRecords.filter(r => r.status === 'absent').length;
    
    const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    const totalOvertime = attendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    
    return {
      totalRecords,
      presentRecords,
      lateRecords,
      absentRecords,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
      attendanceRate: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0,
      punctualityRate: totalRecords > 0 ? Math.round(((presentRecords + absentRecords) / totalRecords) * 100) : 0
    };
  };

  const stats = calculateStats();

  // Dados para gráficos
  const getChartData = () => {
    if (!attendanceRecords) return [];

    const dailyData = attendanceRecords.reduce((acc: any, record) => {
      const date = format(new Date(record.date), 'dd/MM');
      if (!acc[date]) {
        acc[date] = { date, present: 0, late: 0, absent: 0 };
      }
      acc[date][record.status]++;
      return acc;
    }, {});

    return Object.values(dailyData);
  };

  const chartData = getChartData();

  // Dados por departamento
  const getDepartmentData = () => {
    if (!attendanceRecords) return [];

    const deptData = attendanceRecords.reduce((acc: any, record) => {
      const dept = record.employee?.department || 'Não informado';
      if (!acc[dept]) {
        acc[dept] = { department: dept, present: 0, late: 0, absent: 0, total: 0 };
      }
      acc[dept][record.status]++;
      acc[dept].total++;
      return acc;
    }, {});

    return Object.values(deptData);
  };

  const departmentData = getDepartmentData();

  const exportReport = () => {
    toast.success("Relatório exportado com sucesso!");
    // TODO: Implementar exportação real
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios Avançados - Ponto e Frequência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros de Relatório</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <DatePickerWithRange
                  className="w-full"
                  date={dateRange}
                  onDateChange={setDateRange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Departamento</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Departamentos</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="Vendas">Vendas</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Funcionário</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os funcionários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Funcionários</SelectItem>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="departments">Departamentos</TabsTrigger>
              <TabsTrigger value="details">Detalhado</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {stats && (
                <>
                  {/* Cards de estatísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Registros Totais</p>
                            <p className="text-2xl font-bold">{stats.totalRecords}</p>
                          </div>
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Taxa de Presença</p>
                            <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                            <p className="text-2xl font-bold">{stats.totalHours}h</p>
                          </div>
                          <Clock className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Horas Extras</p>
                            <p className="text-2xl font-bold">{stats.totalOvertime}h</p>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de barras - Frequência diária */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequência Diária</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="present" fill="#22c55e" name="Presente" />
                          <Bar dataKey="late" fill="#f59e0b" name="Atraso" />
                          <Bar dataKey="absent" fill="#ef4444" name="Ausente" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Presença</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="present" stroke="#22c55e" name="Presentes" strokeWidth={2} />
                      <Line type="monotone" dataKey="late" stroke="#f59e0b" name="Atrasos" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise por Departamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentData.map((dept: any, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{dept.department}</h4>
                          <Badge variant="outline">{dept.total} registros</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Presentes: {dept.present}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Atrasos: {dept.late}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Ausentes: {dept.absent}</span>
                          </div>
                        </div>
                        <Progress 
                          value={dept.total > 0 ? (dept.present / dept.total) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Relatório Detalhado</CardTitle>
                    <Button onClick={exportReport} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Extras</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords?.slice(0, 50).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.employee?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{record.employee?.employee_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>{record.employee?.department}</TableCell>
                          <TableCell>{formatDateDisplay(record.date)}</TableCell>
                          <TableCell>
                            {record.check_in ? format(new Date(record.check_in), "HH:mm") : "-"}
                          </TableCell>
                          <TableCell>
                            {record.check_out ? format(new Date(record.check_out), "HH:mm") : "-"}
                          </TableCell>
                          <TableCell>{record.total_hours?.toFixed(1)}h</TableCell>
                          <TableCell>{record.overtime_hours?.toFixed(1)}h</TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'present' ? 'default' :
                              record.status === 'late' ? 'secondary' :
                              record.status === 'absent' ? 'destructive' : 'outline'
                            }>
                              {record.status === 'present' ? 'Presente' :
                               record.status === 'late' ? 'Atraso' :
                               record.status === 'absent' ? 'Ausente' : record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {attendanceRecords && attendanceRecords.length > 50 && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Mostrando 50 de {attendanceRecords.length} registros. Use os filtros para refinar a busca.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}