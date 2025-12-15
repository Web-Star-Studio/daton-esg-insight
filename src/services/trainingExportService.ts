import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

export interface TrainingExportConfig {
  type: 'total' | 'by_location' | 'by_department' | 'by_position' | 'by_training' | 'detailed';
  format: 'csv' | 'excel';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  summary?: {
    totalHours: number;
    totalEmployees: number;
    avgHours: number;
  };
}

export const getTrainingExportData = async (config: TrainingExportConfig): Promise<ExportData> => {
  // Fetch employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, location, department, position')
    .eq('status', 'Ativo');

  if (empError) throw empError;

  // Fetch trainings
  let trainingsQuery = supabase
    .from('employee_trainings')
    .select('*')
    .eq('status', 'Concluído');

  if (config.dateFrom) {
    trainingsQuery = trainingsQuery.gte('completion_date', config.dateFrom.toISOString().split('T')[0]);
  }
  if (config.dateTo) {
    trainingsQuery = trainingsQuery.lte('completion_date', config.dateTo.toISOString().split('T')[0]);
  }

  const { data: trainings, error: trainingError } = await trainingsQuery;
  if (trainingError) throw trainingError;

  // Fetch training programs
  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('*');

  if (programsError) throw programsError;

  // Calculate hours per employee
  const employeeHours = employees.map(emp => {
    const empTrainings = trainings.filter(t => t.employee_id === emp.id);
    const totalHours = empTrainings.reduce((sum, t) => {
      const program = programs.find(p => p.id === t.training_program_id);
      return sum + (program?.duration_hours || 0);
    }, 0);

    return {
      id: emp.id,
      name: emp.full_name,
      location: emp.location || 'Não especificado',
      department: emp.department || 'Não especificado',
      position: emp.position || 'Não especificado',
      hours: totalHours,
      trainingsCount: empTrainings.length,
    };
  }).filter(e => e.hours > 0);

  const totalHours = employeeHours.reduce((sum, e) => sum + e.hours, 0);
  const totalEmployees = employeeHours.length;
  const avgHours = totalEmployees > 0 ? Number((totalHours / totalEmployees).toFixed(1)) : 0;

  const summary = { totalHours, totalEmployees, avgHours };

  switch (config.type) {
    case 'total':
      return {
        headers: ['Descrição', 'Valor'],
        rows: [
          ['Total de Horas de Treinamento', totalHours],
          ['Total de Funcionários Treinados', totalEmployees],
          ['Média de Horas por Funcionário', avgHours],
        ],
        summary,
      };

    case 'by_location':
      const byLocation = groupByField(employeeHours, 'location');
      return {
        headers: ['Filial', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byLocation.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
      };

    case 'by_department':
      const byDept = groupByField(employeeHours, 'department');
      return {
        headers: ['Setor', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byDept.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
      };

    case 'by_position':
      const byPosition = groupByField(employeeHours, 'position');
      return {
        headers: ['Função', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byPosition.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
      };

    case 'by_training':
      const trainingStats = programs.map(program => {
        const programTrainings = trainings.filter(t => t.training_program_id === program.id);
        const completedCount = programTrainings.length;
        const totalProgramHours = completedCount * (program.duration_hours || 0);

        return {
          name: program.name,
          category: program.category || 'Não categorizado',
          duration: program.duration_hours || 0,
          participants: completedCount,
          totalHours: totalProgramHours,
        };
      }).filter(p => p.participants > 0).sort((a, b) => b.totalHours - a.totalHours);

      return {
        headers: ['Treinamento', 'Categoria', 'Duração (h)', 'Participantes', 'Horas Totais'],
        rows: trainingStats.map(item => [item.name, item.category, item.duration, item.participants, item.totalHours]),
        summary,
      };

    case 'detailed':
    default:
      return {
        headers: ['Funcionário', 'Filial', 'Setor', 'Função', 'Horas Totais', 'Treinamentos'],
        rows: employeeHours
          .sort((a, b) => b.hours - a.hours)
          .map(emp => [emp.name, emp.location, emp.department, emp.position, emp.hours, emp.trainingsCount]),
        summary,
      };
  }
};

function groupByField(data: any[], field: string) {
  const grouped = data.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += item.hours;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return Object.entries(grouped)
    .map(([name, groupData]) => ({
      name,
      hours: (groupData as { total: number; count: number }).total,
      count: (groupData as { total: number; count: number }).count,
      avg: Number(((groupData as { total: number; count: number }).total / (groupData as { total: number; count: number }).count).toFixed(1)),
    }))
    .sort((a, b) => b.hours - a.hours);
}

export const exportToCSV = (data: ExportData, filename: string) => {
  const BOM = '\uFEFF';
  const csvContent = [
    data.headers.join(';'),
    ...data.rows.map(row => row.join(';')),
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportData, filename: string) => {
  const wsData = [data.headers, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
