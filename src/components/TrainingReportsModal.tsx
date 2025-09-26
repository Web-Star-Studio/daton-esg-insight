import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users,
  Clock,
  Award,
  AlertCircle
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeTrainings, getTrainingMetrics } from "@/services/trainingPrograms";
import { DateRange } from "react-day-picker";

interface TrainingReportsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingReportsModal({ open, onOpenChange }: TrainingReportsModalProps) {
  const [reportType, setReportType] = useState("general");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date())
  });

  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ['employee-trainings-reports'],
    queryFn: getEmployeeTrainings,
  });

  const { data: trainingMetrics } = useQuery({
    queryKey: ['training-metrics-reports'],
    queryFn: getTrainingMetrics,
  });

  // Filter trainings by date range
  const filteredTrainings = employeeTrainings.filter(training => {
    if (!dateRange?.from || !training.completion_date) return true;
    const completionDate = new Date(training.completion_date);
    const fromDate = dateRange.from;
    const toDate = dateRange.to || new Date();
    
    return completionDate >= fromDate && completionDate <= toDate;
  });

  const generateReport = () => {
    // Generate CSV data based on report type
    const csvData = generateCSVData(reportType, filteredTrainings);
    downloadCSV(csvData, `relatorio-treinamentos-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const generateCSVData = (type: string, trainings: any[]) => {
    const headers = getReportHeaders(type);
    const rows = trainings.map(training => getReportRow(type, training));
    
    return [headers, ...rows];
  };

  const getReportHeaders = (type: string): string[] => {
    switch (type) {
      case 'completion':
        return ['Funcionário', 'Código', 'Programa', 'Categoria', 'Data Conclusão', 'Nota', 'Status'];
      case 'certificates':
        return ['Funcionário', 'Programa', 'Data Conclusão', 'Nota', 'Instrutor', 'Duração (h)'];
      case 'performance':
        return ['Programa', 'Categoria', 'Total Participantes', 'Concluídos', 'Taxa Conclusão (%)', 'Nota Média'];
      default:
        return ['Funcionário', 'Programa', 'Categoria', 'Status', 'Data Conclusão', 'Nota'];
    }
  };

  const getReportRow = (type: string, training: any): string[] => {
    const baseInfo = {
      employee: training.employee?.full_name || 'N/A',
      employeeCode: training.employee?.employee_code || 'N/A',
      program: training.training_program?.name || 'N/A',
      category: training.training_program?.category || 'N/A',
      completionDate: training.completion_date ? format(new Date(training.completion_date), 'dd/MM/yyyy') : 'N/A',
      score: training.score || 'N/A',
      status: training.status,
      instructor: training.trainer || 'N/A',
      duration: training.training_program?.duration_hours || 0
    };

    switch (type) {
      case 'completion':
        return [baseInfo.employee, baseInfo.employeeCode, baseInfo.program, baseInfo.category, baseInfo.completionDate, baseInfo.score.toString(), baseInfo.status];
      case 'certificates':
        return [baseInfo.employee, baseInfo.program, baseInfo.completionDate, baseInfo.score.toString(), baseInfo.instructor, baseInfo.duration.toString()];
      case 'performance':
        // This would need aggregated data per program
        return [baseInfo.program, baseInfo.category, '1', baseInfo.status === 'Concluído' ? '1' : '0', '100', baseInfo.score.toString()];
      default:
        return [baseInfo.employee, baseInfo.program, baseInfo.category, baseInfo.status, baseInfo.completionDate, baseInfo.score.toString()];
    }
  };

  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Report cards data
  const reportCards = [
    {
      title: 'Total de Participantes',
      value: filteredTrainings.length,
      icon: Users,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Treinamentos Concluídos',
      value: filteredTrainings.filter(t => t.status === 'Concluído').length,
      icon: Award,
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Taxa de Conclusão',
      value: filteredTrainings.length > 0 
        ? Math.round((filteredTrainings.filter(t => t.status === 'Concluído').length / filteredTrainings.length) * 100) + '%'
        : '0%',
      icon: TrendingUp,
      color: 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'Horas Totais',
      value: filteredTrainings
        .filter(t => t.status === 'Concluído')
        .reduce((total, t) => total + (t.training_program?.duration_hours || 0), 0),
      icon: Clock,
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatórios de Treinamento
          </DialogTitle>
          <DialogDescription>
            Gere relatórios detalhados sobre programas de treinamento e desenvolvimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Relatório Geral</SelectItem>
                  <SelectItem value="completion">Relatório de Conclusões</SelectItem>
                  <SelectItem value="certificates">Relatório de Certificações</SelectItem>
                  <SelectItem value="performance">Relatório de Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[300px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DatePickerWithRange 
                date={dateRange} 
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={`p-1 rounded ${card.color}`}>
                      <card.icon className="w-3 h-3" />
                    </div>
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pré-visualização do Relatório</span>
                <Button onClick={generateReport} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Baixar CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTrainings.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTrainings.slice(0, 5).map((training, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="space-y-1">
                          <div className="font-medium">{training.employee?.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {training.training_program?.name || 'N/A'} - {training.training_program?.category || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {training.completion_date 
                              ? `Concluído em ${format(new Date(training.completion_date), 'dd/MM/yyyy', { locale: ptBR })}` 
                              : 'Em andamento'
                            }
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge 
                            variant={training.status === 'Concluído' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {training.status}
                          </Badge>
                          {training.score && (
                            <div className="text-sm font-medium">
                              Nota: {training.score}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {filteredTrainings.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground p-4">
                        E mais {filteredTrainings.length - 5} registros...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum dado encontrado para o período selecionado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}