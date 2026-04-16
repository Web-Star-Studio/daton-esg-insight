import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { isDemoRuntimeEnabled, resolveDemoData } from "./demoResolver";

export interface TrainingExportFilters {
  branchIds?: string[];
  departments?: string[];
  positions?: string[];
  employeeIds?: string[];
  trainingProgramIds?: string[];
}

export interface TrainingExportConfig {
  type: 'total' | 'by_location' | 'by_department' | 'by_position' | 'by_training' | 'detailed';
  format: 'csv' | 'excel';
  dateFrom?: Date;
  dateTo?: Date;
  filters?: TrainingExportFilters;
}

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  summary?: {
    totalHours: number;
    totalEmployees: number;
    avgHours: number;
  };
  criteria?: string[];
}

const BATCH_SIZE = 1000;

async function fetchAll<T>(builder: () => any): Promise<T[]> {
  let all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await builder().range(from, from + BATCH_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data as T[]);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }
  return all;
}

const normalizeExportData = (data: unknown): ExportData => {
  const typed = (data || {}) as Partial<ExportData>;
  const headers = Array.isArray(typed.headers) ? typed.headers : [];
  const rows = Array.isArray(typed.rows)
    ? typed.rows.map((row) => (Array.isArray(row) ? row : []))
    : [];
  const summary = typed.summary
    ? {
        totalHours: typed.summary.totalHours || 0,
        totalEmployees: typed.summary.totalEmployees || 0,
        avgHours: typed.summary.avgHours || 0,
      }
    : undefined;
  return { headers, rows, summary };
};

export interface FilterOptions {
  branches: { id: string; label: string }[];
  departments: string[];
  positions: string[];
  employees: { id: string; full_name: string }[];
  trainingPrograms: { id: string; name: string }[];
}

export const getTrainingFilterOptions = async (): Promise<FilterOptions> => {
  if (isDemoRuntimeEnabled()) {
    return {
      branches: [],
      departments: [],
      positions: [],
      employees: [],
      trainingPrograms: [],
    };
  }

  const [branchesRes, employees, programs] = await Promise.all([
    supabase.from('branches').select('id, name, code, status').order('name'),
    fetchAll<{ id: string; full_name: string; department: string | null; position: string | null }>(
      () => supabase
        .from('employees')
        .select('id, full_name, department, position')
        .eq('status', 'Ativo')
        .order('full_name')
    ),
    fetchAll<{ id: string; name: string }>(
      () => supabase.from('training_programs').select('id, name').order('name')
    ),
  ]);

  if (branchesRes.error) throw branchesRes.error;

  const departments = Array.from(
    new Set(employees.map(e => e.department).filter((d): d is string => !!d && d.trim() !== ''))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const positions = Array.from(
    new Set(employees.map(e => e.position).filter((p): p is string => !!p && p.trim() !== ''))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return {
    branches: (branchesRes.data || [])
      .filter(b => b.status === 'Ativo' || b.status === 'Ativa')
      .map(b => ({ id: b.id, label: b.code ? `${b.code} - ${b.name}` : b.name })),
    departments,
    positions,
    employees: employees.map(e => ({ id: e.id, full_name: e.full_name })),
    trainingPrograms: programs,
  };
};

const buildCriteria = (config: TrainingExportConfig, options?: FilterOptions): string[] => {
  const criteria: string[] = [];
  const f = config.filters || {};

  if (config.dateFrom || config.dateTo) {
    const from = config.dateFrom ? config.dateFrom.toLocaleDateString('pt-BR') : 'início';
    const to = config.dateTo ? config.dateTo.toLocaleDateString('pt-BR') : 'hoje';
    criteria.push(`Período: ${from} a ${to}`);
  } else {
    criteria.push('Período: todos os registros');
  }

  if (f.branchIds?.length) {
    const labels = options
      ? f.branchIds.map(id => options.branches.find(b => b.id === id)?.label || id)
      : f.branchIds;
    criteria.push(`Filiais: ${labels.join(', ')}`);
  }
  if (f.departments?.length) criteria.push(`Setores: ${f.departments.join(', ')}`);
  if (f.positions?.length) criteria.push(`Funções: ${f.positions.join(', ')}`);
  if (f.employeeIds?.length) {
    const labels = options
      ? f.employeeIds.map(id => options.employees.find(e => e.id === id)?.full_name || id)
      : f.employeeIds;
    criteria.push(`Funcionários: ${labels.join(', ')}`);
  }
  if (f.trainingProgramIds?.length) {
    const labels = options
      ? f.trainingProgramIds.map(id => options.trainingPrograms.find(p => p.id === id)?.name || id)
      : f.trainingProgramIds;
    criteria.push(`Treinamentos: ${labels.join(', ')}`);
  }

  return criteria;
};

export const getTrainingExportData = async (
  config: TrainingExportConfig,
  options?: FilterOptions
): Promise<ExportData> => {
  if (isDemoRuntimeEnabled()) {
    return normalizeExportData(
      resolveDemoData<ExportData>([
        'training-export-preview',
        config.type,
        config.dateFrom?.toISOString(),
        config.dateTo?.toISOString(),
      ]),
    );
  }

  const f = config.filters || {};

  // Fetch employees with optional filters (use batched fetch to bypass 1000-row limit)
  let employees = await fetchAll<{
    id: string;
    full_name: string;
    location: string | null;
    department: string | null;
    position: string | null;
    branch_id: string | null;
  }>(() => {
    let q = supabase
      .from('employees')
      .select('id, full_name, location, department, position, branch_id')
      .eq('status', 'Ativo')
      .order('full_name');
    if (f.branchIds?.length) q = q.in('branch_id', f.branchIds);
    if (f.departments?.length) q = q.in('department', f.departments);
    if (f.positions?.length) q = q.in('position', f.positions);
    if (f.employeeIds?.length) q = q.in('id', f.employeeIds);
    return q;
  });

  // Fetch trainings (batched)
  const trainings = await fetchAll<{
    employee_id: string;
    training_program_id: string;
    completion_date: string | null;
  }>(() => {
    let q = supabase
      .from('employee_trainings')
      .select('employee_id, training_program_id, completion_date')
      .eq('status', 'Concluído');
    if (config.dateFrom) q = q.gte('completion_date', config.dateFrom.toISOString().split('T')[0]);
    if (config.dateTo) q = q.lte('completion_date', config.dateTo.toISOString().split('T')[0]);
    if (f.trainingProgramIds?.length) q = q.in('training_program_id', f.trainingProgramIds);
    return q;
  });

  // Fetch programs and branches
  const [programsRes, branchesRes] = await Promise.all([
    supabase.from('training_programs').select('id, name, category, duration_hours'),
    supabase.from('branches').select('id, name, code'),
  ]);
  if (programsRes.error) throw programsRes.error;
  if (branchesRes.error) throw branchesRes.error;
  const programs = programsRes.data || [];
  const branchesMap = new Map((branchesRes.data || []).map(b => [b.id, b.code ? `${b.code} - ${b.name}` : b.name]));

  // Calculate hours per employee
  const employeeHours = employees.map(emp => {
    const empTrainings = trainings.filter(t => t.employee_id === emp.id);
    const totalHours = empTrainings.reduce((sum, t) => {
      const program = programs.find(p => p.id === t.training_program_id);
      return sum + (program?.duration_hours || 0);
    }, 0);

    const branchLabel = emp.branch_id ? branchesMap.get(emp.branch_id) : null;

    return {
      id: emp.id,
      name: emp.full_name,
      location: branchLabel || emp.location || 'Não especificado',
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
  const criteria = buildCriteria(config, options);

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
        criteria,
      };

    case 'by_location': {
      const byLocation = groupByField(employeeHours, 'location');
      return {
        headers: ['Filial', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byLocation.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
        criteria,
      };
    }

    case 'by_department': {
      const byDept = groupByField(employeeHours, 'department');
      return {
        headers: ['Setor', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byDept.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
        criteria,
      };
    }

    case 'by_position': {
      const byPosition = groupByField(employeeHours, 'position');
      return {
        headers: ['Função', 'Horas Totais', 'Funcionários', 'Média por Funcionário'],
        rows: byPosition.map(item => [item.name, item.hours, item.count, item.avg]),
        summary,
        criteria,
      };
    }

    case 'by_training': {
      const programIdSet = new Set(
        f.trainingProgramIds?.length ? f.trainingProgramIds : programs.map(p => p.id)
      );
      const employeeIdSet = new Set(employees.map(e => e.id));

      const trainingStats = programs
        .filter(p => programIdSet.has(p.id))
        .map(program => {
          const programTrainings = trainings.filter(
            t => t.training_program_id === program.id && employeeIdSet.has(t.employee_id)
          );
          const completedCount = programTrainings.length;
          const totalProgramHours = completedCount * (program.duration_hours || 0);
          return {
            name: program.name,
            category: program.category || 'Não categorizado',
            duration: program.duration_hours || 0,
            participants: completedCount,
            totalHours: totalProgramHours,
          };
        })
        .filter(p => p.participants > 0)
        .sort((a, b) => b.totalHours - a.totalHours);

      return {
        headers: ['Treinamento', 'Categoria', 'Duração (h)', 'Participantes', 'Horas Totais'],
        rows: trainingStats.map(item => [item.name, item.category, item.duration, item.participants, item.totalHours]),
        summary,
        criteria,
      };
    }

    case 'detailed':
    default:
      return {
        headers: ['Funcionário', 'Filial', 'Setor', 'Função', 'Horas Totais', 'Treinamentos'],
        rows: employeeHours
          .sort((a, b) => {
            const cmpLoc = a.location.localeCompare(b.location, 'pt-BR');
            if (cmpLoc !== 0) return cmpLoc;
            const cmpDept = a.department.localeCompare(b.department, 'pt-BR');
            if (cmpDept !== 0) return cmpDept;
            const cmpPos = a.position.localeCompare(b.position, 'pt-BR');
            if (cmpPos !== 0) return cmpPos;
            return a.name.localeCompare(b.name, 'pt-BR');
          })
          .map(emp => [emp.name, emp.location, emp.department, emp.position, emp.hours, emp.trainingsCount]),
        summary,
        criteria,
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
  const lines: string[] = [];

  if (data.criteria?.length) {
    lines.push('Critérios aplicados');
    data.criteria.forEach(c => lines.push(c.replace(/;/g, ',')));
    if (data.summary) {
      lines.push(`Resumo: ${data.summary.totalHours}h totais; ${data.summary.totalEmployees} funcionários; ${data.summary.avgHours}h média`);
    }
    lines.push('');
  }

  lines.push(data.headers.join(';'));
  data.rows.forEach(row => lines.push(row.join(';')));

  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportData, filename: string) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Critérios + Resumo
  if (data.criteria?.length || data.summary) {
    const criteriaSheet: (string | number)[][] = [['Critérios Aplicados']];
    (data.criteria || []).forEach(c => criteriaSheet.push([c]));
    criteriaSheet.push([]);
    if (data.summary) {
      criteriaSheet.push(['Resumo']);
      criteriaSheet.push(['Horas Totais', data.summary.totalHours]);
      criteriaSheet.push(['Funcionários', data.summary.totalEmployees]);
      criteriaSheet.push(['Média de Horas', data.summary.avgHours]);
    }
    const wsCriteria = XLSX.utils.aoa_to_sheet(criteriaSheet);
    wsCriteria['!cols'] = [{ wch: 30 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsCriteria, 'Critérios');
  }

  // Sheet 2: Dados
  const wsData = [data.headers, ...data.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Auto column widths
  ws['!cols'] = data.headers.map((h, i) => {
    const maxLen = Math.max(
      String(h).length,
      ...data.rows.map(r => String(r[i] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
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
