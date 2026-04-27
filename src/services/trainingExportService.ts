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
  branches: { id: string; label: string; isActive: boolean }[];
  departments: string[];
  positions: string[];
  employees: { id: string; full_name: string; isActive: boolean }[];
  trainingPrograms: { id: string; name: string }[];
}

const isActiveStatus = (status: string | null | undefined): boolean => {
  if (!status) return true;
  const normalized = status.trim().toLowerCase();
  return normalized === 'ativo' || normalized === 'ativa';
};

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

  const [branches, employees, programs] = await Promise.all([
    fetchAll<{ id: string; name: string; code: string | null; status: string | null }>(
      () => supabase.from('branches').select('id, name, code, status').order('name')
    ),
    fetchAll<{ id: string; full_name: string; department: string | null; position: string | null; status: string | null }>(
      () => supabase
        .from('employees')
        .select('id, full_name, department, position, status')
        .order('full_name')
    ),
    fetchAll<{ id: string; name: string }>(
      () => supabase.from('training_programs').select('id, name').order('name')
    ),
  ]);

  const departments = Array.from(
    new Set(employees.map(e => e.department).filter((d): d is string => !!d && d.trim() !== ''))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const positions = Array.from(
    new Set(employees.map(e => e.position).filter((p): p is string => !!p && p.trim() !== ''))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const branchOptions = branches.map(b => {
    const active = isActiveStatus(b.status);
    const base = b.code ? `${b.code} - ${b.name}` : b.name;
    return { id: b.id, label: active ? base : `${base} (Inativa)`, isActive: active };
  }).sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.label.localeCompare(b.label, 'pt-BR');
  });

  const employeeOptions = employees.map(e => {
    const active = isActiveStatus(e.status);
    return {
      id: e.id,
      full_name: active ? e.full_name : `${e.full_name} (Inativo)`,
      isActive: active,
    };
  }).sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.full_name.localeCompare(b.full_name, 'pt-BR');
  });

  return {
    branches: branchOptions,
    departments,
    positions,
    employees: employeeOptions,
    trainingPrograms: programs,
  };
};

const buildCriteria = (config: TrainingExportConfig, options?: FilterOptions): string[] => {
  const criteria: string[] = [];
  const f = config.filters || {};

  criteria.push('Base de cálculo: participações em programas com status "Concluído"');
  criteria.push('Horas por treinamento: duração cadastrada no programa');

  if (config.dateFrom || config.dateTo) {
    const from = config.dateFrom ? config.dateFrom.toLocaleDateString('pt-BR') : 'início';
    const to = config.dateTo ? config.dateTo.toLocaleDateString('pt-BR') : 'hoje';
    criteria.push(`Período (término do programa): ${from} a ${to}`);
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

  // Fetch employees with optional filters (includes inactive so historical trainings count).
  // Batched fetch bypasses the 1000-row limit.
  const employees = await fetchAll<{
    id: string;
    full_name: string;
    location: string | null;
    department: string | null;
    position: string | null;
    branch_id: string | null;
    status: string | null;
  }>(() => {
    let q = supabase
      .from('employees')
      .select('id, full_name, location, department, position, branch_id, status')
      .order('full_name');
    if (f.branchIds?.length) q = q.in('branch_id', f.branchIds);
    if (f.departments?.length) q = q.in('department', f.departments);
    if (f.positions?.length) q = q.in('position', f.positions);
    if (f.employeeIds?.length) q = q.in('id', f.employeeIds);
    return q;
  });

  // Fetch programs and branches (batched to bypass the 1000-row default limit).
  // We need program.status and dates to filter by "programa concluído" on the client.
  const [allPrograms, branchesList] = await Promise.all([
    fetchAll<{
      id: string;
      name: string;
      category: string | null;
      duration_hours: number | string | null;
      status: string | null;
      end_date: string | null;
      start_date: string | null;
    }>(
      () => supabase
        .from('training_programs')
        .select('id, name, category, duration_hours, status, end_date, start_date')
        .order('id')
    ),
    fetchAll<{ id: string; name: string; code: string | null }>(
      () => supabase.from('branches').select('id, name, code').order('id')
    ),
  ]);
  const branchesMap = new Map(branchesList.map(b => [b.id, b.code ? `${b.code} - ${b.name}` : b.name]));

  // Programs that count toward hours: status === 'Concluído' and within the optional date range
  // (program.end_date, with fallback to start_date when end_date is null).
  const dateFromStr = config.dateFrom ? config.dateFrom.toISOString().split('T')[0] : null;
  const dateToStr = config.dateTo ? config.dateTo.toISOString().split('T')[0] : null;
  const concludedPrograms = allPrograms.filter(p => {
    if (p.status !== 'Concluído') return false;
    const pDate = p.end_date || p.start_date;
    if (dateFromStr && (!pDate || pDate < dateFromStr)) return false;
    if (dateToStr && (!pDate || pDate > dateToStr)) return false;
    return true;
  });
  const concludedProgramIds = new Set(concludedPrograms.map(p => p.id));
  // User-selected program filter further narrows the set
  const effectiveProgramIds = f.trainingProgramIds?.length
    ? new Set(f.trainingProgramIds.filter(id => concludedProgramIds.has(id)))
    : concludedProgramIds;

  // Fetch employee_trainings for those concluded programs (batched).
  // No .eq('status','Concluído') on the row — the signal of completion lives on the PROGRAM,
  // and client marking of individual status is inconsistent in prod (see investigation).
  // Use embed + !inner to filter by program side without shipping a huge .in() array.
  const trainings = effectiveProgramIds.size === 0 ? [] : await fetchAll<{
    employee_id: string;
    training_program_id: string;
    completion_date: string | null;
  }>(() => {
    let q = supabase
      .from('employee_trainings')
      .select('employee_id, training_program_id, completion_date, training_programs!inner(status, end_date, start_date)')
      .eq('training_programs.status', 'Concluído')
      .order('id');
    if (dateFromStr) q = q.gte('training_programs.end_date', dateFromStr);
    if (dateToStr) q = q.lte('training_programs.end_date', dateToStr);
    if (f.trainingProgramIds?.length) q = q.in('training_program_id', f.trainingProgramIds);
    return q;
  });

  // Narrow to only effectiveProgramIds (defensive — also covers programs with null end_date
  // that were filtered client-side).
  const trainingsScoped = trainings.filter(t => effectiveProgramIds.has(t.training_program_id));
  // Program map keeps only concluded programs — used by downstream aggregations.
  const programs = allPrograms.filter(p => concludedProgramIds.has(p.id));

  // Calculate hours per employee
  const employeeHours = employees.map(emp => {
    const empTrainings = trainingsScoped.filter(t => t.employee_id === emp.id);
    const totalHours = empTrainings.reduce((sum, t) => {
      const program = programs.find(p => p.id === t.training_program_id);
      return sum + (program?.duration_hours || 0);
    }, 0);

    const branchLabel = emp.branch_id ? branchesMap.get(emp.branch_id) : null;
    const active = isActiveStatus(emp.status);

    return {
      id: emp.id,
      name: active ? emp.full_name : `${emp.full_name} (Inativo)`,
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
    case 'total': {
      // Lista cada treinamento concluído (dentro do escopo dos filtros) com
      // suas horas totais, e fecha com 3 linhas de resumo. A duração total por
      // programa = duration_hours × participantes que estão no recorte de
      // employees filtrado, igual ao 'by_training' — mantém consistência.
      const employeeIdSet = new Set(employees.map(e => e.id));
      const programIdSet = new Set(
        f.trainingProgramIds?.length ? f.trainingProgramIds : programs.map(p => p.id)
      );
      const trainingStats = programs
        .filter(p => programIdSet.has(p.id))
        .map(program => {
          const programTrainings = trainingsScoped.filter(
            t => t.training_program_id === program.id && employeeIdSet.has(t.employee_id)
          );
          const participants = programTrainings.length;
          const duration = Number(program.duration_hours) || 0;
          return {
            name: program.name,
            endDate: program.end_date || program.start_date || '',
            duration,
            participants,
            totalHours: participants * duration,
          };
        })
        .filter(p => p.participants > 0)
        .sort((a, b) => {
          // Mais recente primeiro; em empate, maior carga horária primeiro.
          const dateCmp = (b.endDate || '').localeCompare(a.endDate || '');
          if (dateCmp !== 0) return dateCmp;
          return b.totalHours - a.totalHours;
        });

      const headers = ['Treinamento', 'Data Término', 'Duração (h)', 'Participantes', 'Horas Totais'];
      const rows: (string | number)[][] = trainingStats.map(item => [
        item.name,
        item.endDate ? new Date(item.endDate).toLocaleDateString('pt-BR') : '—',
        item.duration,
        item.participants,
        item.totalHours,
      ]);
      // Separador visual + bloco de resumo. As 3 colunas do meio ficam vazias
      // pra alinhar o valor na coluna "Horas Totais".
      if (rows.length > 0) {
        rows.push(['', '', '', '', '']);
      }
      rows.push(['Total de Horas de Treinamento', '', '', '', totalHours]);
      rows.push(['Total de Funcionários Treinados', '', '', '', totalEmployees]);
      rows.push(['Média de Horas por Funcionário', '', '', '', avgHours]);

      return { headers, rows, summary, criteria };
    }

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
          const programTrainings = trainingsScoped.filter(
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
    lines.push('');
  }

  lines.push(data.headers.join(';'));
  data.rows.forEach(row => lines.push(row.join(';')));

  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data: ExportData, filename: string) => {
  const wb = XLSX.utils.book_new();

  // Aba única "Relatório": critérios no topo, headers + rows abaixo. O resumo
  // (total horas, funcionários, média) já vem nas últimas linhas das rows quando
  // o tipo é 'total' — pra outros tipos, cada linha do relatório carrega seus
  // próprios totais por agrupador.
  const numCols = data.headers.length;
  const padRow = (cells: (string | number)[]): (string | number)[] => {
    if (cells.length >= numCols) return cells;
    return [...cells, ...Array(numCols - cells.length).fill('')];
  };

  const sheet: (string | number)[][] = [];
  // Linhas que devem ocupar a largura inteira (critérios). São mescladas
  // depois pra que textos longos não fiquem truncados pela largura da coluna A.
  const fullWidthRows: number[] = [];
  if (data.criteria?.length) {
    fullWidthRows.push(sheet.length);
    sheet.push(padRow(['Critérios Aplicados']));
    data.criteria.forEach(c => {
      fullWidthRows.push(sheet.length);
      sheet.push(padRow([c]));
    });
    sheet.push(padRow([]));
  }
  sheet.push(data.headers);
  data.rows.forEach(row => sheet.push(row));

  const ws = XLSX.utils.aoa_to_sheet(sheet);
  // Auto column widths baseados no conteúdo real do dado (ignora as linhas de
  // critérios — elas são mescladas A:N abaixo).
  ws['!cols'] = data.headers.map((h, i) => {
    const maxLen = Math.max(
      String(h).length,
      ...data.rows.map(r => String(r[i] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
  // Merge das linhas de critérios cobrindo toda a largura — texto longo fica
  // visível inteiro porque ocupa visualmente N colunas, sem inflar a coluna A.
  if (fullWidthRows.length > 0 && numCols > 1) {
    ws['!merges'] = fullWidthRows.map(r => ({
      s: { r, c: 0 },
      e: { r, c: numCols - 1 },
    }));
    // Habilita wrap text nas células mescladas como fallback caso o conteúdo
    // ultrapasse a largura combinada — texto quebra em várias linhas em vez de
    // ser cortado.
    fullWidthRows.forEach(r => {
      const addr = XLSX.utils.encode_cell({ r, c: 0 });
      const cell = ws[addr];
      if (cell) {
        cell.s = { ...(cell.s || {}), alignment: { wrapText: true, vertical: 'top' } };
      }
    });
  }
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
