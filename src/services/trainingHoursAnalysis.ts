import { supabase } from "@/integrations/supabase/client";
import { TRAINING_HOURS_BENCHMARKS } from "@/data/trainingBenchmarks";

export interface TrainingHoursResult {
  // Totais gerais
  total_training_hours: number;
  total_employees: number;
  average_hours_per_employee: number;
  
  // Qualidade de dados
  data_quality: 'high' | 'medium' | 'low';
  trainings_with_duration: number;
  trainings_without_duration: number;
  data_completeness_percent: number;
  
  // Breakdown por gênero
  by_gender: {
    men: { total_hours: number; avg_hours: number; employee_count: number };
    women: { total_hours: number; avg_hours: number; employee_count: number };
    other: { total_hours: number; avg_hours: number; employee_count: number };
  };
  
  // Breakdown por departamento
  by_department: Array<{
    department: string;
    total_hours: number;
    avg_hours: number;
    employee_count: number;
    percentage_of_total: number;
  }>;
  
  // Breakdown por categoria de treinamento
  by_category: Array<{
    category: string;
    total_hours: number;
    training_count: number;
    avg_hours_per_training: number;
    percentage_of_total: number;
  }>;
  
  // Breakdown por cargo
  by_role: Array<{
    role: string;
    total_hours: number;
    avg_hours: number;
    employee_count: number;
  }>;
  
  // Treinamentos obrigatórios vs opcionais
  mandatory_vs_optional: {
    mandatory: { total_hours: number; training_count: number; percentage: number };
    optional: { total_hours: number; training_count: number; percentage: number };
  };
  
  // Análise temporal (últimos 12 meses)
  monthly_trend: Array<{
    month: string;
    total_hours: number;
    avg_hours_per_employee: number;
    trainings_completed: number;
  }>;
  
  // Comparação com período anterior
  comparison: {
    previous_period_avg: number;
    change_percentage: number;
    is_improving: boolean;
  };
  
  // Identificação de gaps
  employees_without_training: {
    count: number;
    percentage: number;
    employee_list: Array<{
      id: string;
      name: string;
      department: string;
      hire_date: string;
    }>;
  };
  
  // Top performers
  top_10_employees: Array<{
    id: string;
    name: string;
    total_hours: number;
    trainings_completed: number;
  }>;
  
  // Bottom 10 (need attention)
  bottom_10_employees: Array<{
    id: string;
    name: string;
    total_hours: number;
    trainings_completed: number;
  }>;
  
  // Classificação de desempenho
  performance_classification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  
  // Comparação com benchmarks
  sector_benchmark: number;
  performance_vs_benchmark: number;
  
  // GRI compliance
  gri_404_1_compliance: {
    is_compliant: boolean;
    missing_data: string[];
    recommendations: string[];
  };
  
  calculation_date: string;
}

export async function calculateTrainingHoursMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<TrainingHoursResult> {
  // Buscar todos os funcionários ativos
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, full_name, gender, department, role, hire_date')
    .eq('company_id', companyId)
    .eq('status', 'Ativo');

  if (empError) throw empError;
  if (!employees || employees.length === 0) {
    throw new Error('Nenhum funcionário ativo encontrado');
  }

  const totalEmployees = employees.length;

  // Buscar treinamentos concluídos no período
  const { data: trainings, error: trainError } = await supabase
    .from('employee_trainings')
    .select(`
      id,
      employee_id,
      training_program_id,
      completion_date,
      training_programs (
        id,
        name,
        category,
        duration_hours,
        is_mandatory
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'Concluído')
    .gte('completion_date', startDate)
    .lte('completion_date', endDate);

  if (trainError) throw trainError;

  // Calcular métricas básicas
  let totalHours = 0;
  let trainingsWithDuration = 0;
  let trainingsWithoutDuration = 0;

  trainings?.forEach((t: any) => {
    const duration = t.training_programs?.duration_hours || 0;
    if (duration > 0) {
      totalHours += duration;
      trainingsWithDuration++;
    } else {
      trainingsWithoutDuration++;
    }
  });

  const avgHoursPerEmployee = totalEmployees > 0 ? totalHours / totalEmployees : 0;
  const dataCompleteness = (trainings?.length || 0) > 0 
    ? (trainingsWithDuration / (trainings?.length || 1)) * 100 
    : 0;

  // Qualidade de dados
  let dataQuality: 'high' | 'medium' | 'low';
  if (dataCompleteness >= 90) {
    dataQuality = 'high';
  } else if (dataCompleteness >= 70) {
    dataQuality = 'medium';
  } else {
    dataQuality = 'low';
  }

  // Benchmark setorial (usar 'Default' por enquanto)
  const sectorBenchmark = TRAINING_HOURS_BENCHMARKS['Default'].good;
  const performanceVsBenchmark = ((avgHoursPerEmployee / sectorBenchmark) - 1) * 100;

  // Classificação de desempenho
  let performanceClassification: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  if (avgHoursPerEmployee >= sectorBenchmark * 1.2) {
    performanceClassification = 'Excelente';
  } else if (avgHoursPerEmployee >= sectorBenchmark) {
    performanceClassification = 'Bom';
  } else if (avgHoursPerEmployee >= sectorBenchmark * 0.6) {
    performanceClassification = 'Atenção';
  } else {
    performanceClassification = 'Crítico';
  }

  // Breakdown por gênero
  const genderStats = {
    men: { total_hours: 0, employee_count: 0, avg_hours: 0 },
    women: { total_hours: 0, employee_count: 0, avg_hours: 0 },
    other: { total_hours: 0, employee_count: 0, avg_hours: 0 }
  };

  employees.forEach((emp: any) => {
    const empTrainings = trainings?.filter((t: any) => t.employee_id === emp.id) || [];
    const empHours = empTrainings.reduce((sum, t: any) => 
      sum + (t.training_programs?.duration_hours || 0), 0
    );

    const gender = emp.gender?.toLowerCase();
    if (gender === 'masculino' || gender === 'male' || gender === 'm') {
      genderStats.men.total_hours += empHours;
      genderStats.men.employee_count++;
    } else if (gender === 'feminino' || gender === 'female' || gender === 'f') {
      genderStats.women.total_hours += empHours;
      genderStats.women.employee_count++;
    } else {
      genderStats.other.total_hours += empHours;
      genderStats.other.employee_count++;
    }
  });

  genderStats.men.avg_hours = genderStats.men.employee_count > 0 
    ? genderStats.men.total_hours / genderStats.men.employee_count : 0;
  genderStats.women.avg_hours = genderStats.women.employee_count > 0 
    ? genderStats.women.total_hours / genderStats.women.employee_count : 0;
  genderStats.other.avg_hours = genderStats.other.employee_count > 0 
    ? genderStats.other.total_hours / genderStats.other.employee_count : 0;

  // Breakdown por departamento
  const deptMap = new Map<string, { hours: number; empCount: number }>();
  employees.forEach((emp: any) => {
    const dept = emp.department || 'Não especificado';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { hours: 0, empCount: 0 });
    }
    const deptData = deptMap.get(dept)!;
    deptData.empCount++;

    const empTrainings = trainings?.filter((t: any) => t.employee_id === emp.id) || [];
    const empHours = empTrainings.reduce((sum, t: any) => 
      sum + (t.training_programs?.duration_hours || 0), 0
    );
    deptData.hours += empHours;
  });

  const byDepartment = Array.from(deptMap.entries()).map(([dept, data]) => ({
    department: dept,
    total_hours: data.hours,
    avg_hours: data.empCount > 0 ? data.hours / data.empCount : 0,
    employee_count: data.empCount,
    percentage_of_total: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
  })).sort((a, b) => b.avg_hours - a.avg_hours);

  // Breakdown por categoria
  const categoryMap = new Map<string, { hours: number; count: number }>();
  trainings?.forEach((t: any) => {
    const category = t.training_programs?.category || 'Não categorizado';
    const hours = t.training_programs?.duration_hours || 0;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { hours: 0, count: 0 });
    }
    const catData = categoryMap.get(category)!;
    catData.hours += hours;
    catData.count++;
  });

  const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total_hours: data.hours,
    training_count: data.count,
    avg_hours_per_training: data.count > 0 ? data.hours / data.count : 0,
    percentage_of_total: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
  })).sort((a, b) => b.total_hours - a.total_hours);

  // Breakdown por cargo
  const roleMap = new Map<string, { hours: number; empCount: number }>();
  employees.forEach((emp: any) => {
    const role = emp.role || 'Não especificado';
    if (!roleMap.has(role)) {
      roleMap.set(role, { hours: 0, empCount: 0 });
    }
    const roleData = roleMap.get(role)!;
    roleData.empCount++;

    const empTrainings = trainings?.filter((t: any) => t.employee_id === emp.id) || [];
    const empHours = empTrainings.reduce((sum, t: any) => 
      sum + (t.training_programs?.duration_hours || 0), 0
    );
    roleData.hours += empHours;
  });

  const byRole = Array.from(roleMap.entries()).map(([role, data]) => ({
    role,
    total_hours: data.hours,
    avg_hours: data.empCount > 0 ? data.hours / data.empCount : 0,
    employee_count: data.empCount
  })).sort((a, b) => b.avg_hours - a.avg_hours);

  // Obrigatórios vs Opcionais
  let mandatoryHours = 0;
  let mandatoryCount = 0;
  let optionalHours = 0;
  let optionalCount = 0;

  trainings?.forEach((t: any) => {
    const hours = t.training_programs?.duration_hours || 0;
    if (t.training_programs?.is_mandatory) {
      mandatoryHours += hours;
      mandatoryCount++;
    } else {
      optionalHours += hours;
      optionalCount++;
    }
  });

  const mandatoryVsOptional = {
    mandatory: {
      total_hours: mandatoryHours,
      training_count: mandatoryCount,
      percentage: totalHours > 0 ? (mandatoryHours / totalHours) * 100 : 0
    },
    optional: {
      total_hours: optionalHours,
      training_count: optionalCount,
      percentage: totalHours > 0 ? (optionalHours / totalHours) * 100 : 0
    }
  };

  // Tendência mensal (últimos 12 meses)
  const monthlyMap = new Map<string, { hours: number; count: number }>();
  trainings?.forEach((t: any) => {
    const date = new Date(t.completion_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const hours = t.training_programs?.duration_hours || 0;
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { hours: 0, count: 0 });
    }
    const monthData = monthlyMap.get(monthKey)!;
    monthData.hours += hours;
    monthData.count++;
  });

  const monthlyTrend = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      total_hours: data.hours,
      avg_hours_per_employee: totalEmployees > 0 ? data.hours / totalEmployees : 0,
      trainings_completed: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Comparação com período anterior
  const periodDays = Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);
  const prevEndDate = new Date(startDate);

  const { data: prevTrainings } = await supabase
    .from('employee_trainings')
    .select(`
      training_programs (duration_hours)
    `)
    .eq('company_id', companyId)
    .eq('status', 'Concluído')
    .gte('completion_date', prevStartDate.toISOString().split('T')[0])
    .lt('completion_date', prevEndDate.toISOString().split('T')[0]);

  const prevTotalHours = prevTrainings?.reduce((sum: number, t: any) => 
    sum + (t.training_programs?.duration_hours || 0), 0
  ) || 0;
  const prevAvgHours = totalEmployees > 0 ? prevTotalHours / totalEmployees : 0;
  const changePercentage = prevAvgHours > 0 
    ? ((avgHoursPerEmployee - prevAvgHours) / prevAvgHours) * 100 
    : 0;

  // Funcionários sem treinamento
  const employeesWithTraining = new Set(
    trainings?.map((t: any) => t.employee_id) || []
  );
  const employeesWithoutTraining = employees.filter(
    (emp: any) => !employeesWithTraining.has(emp.id)
  );

  const employeesWithoutTrainingList = employeesWithoutTraining.slice(0, 10).map((emp: any) => ({
    id: emp.id,
    name: emp.full_name,
    department: emp.department || 'Não especificado',
    hire_date: emp.hire_date
  }));

  // Top 10 e Bottom 10 funcionários
  const employeeHoursMap = new Map<string, { hours: number; count: number; name: string }>();
  employees.forEach((emp: any) => {
    const empTrainings = trainings?.filter((t: any) => t.employee_id === emp.id) || [];
    const empHours = empTrainings.reduce((sum, t: any) => 
      sum + (t.training_programs?.duration_hours || 0), 0
    );
    employeeHoursMap.set(emp.id, {
      hours: empHours,
      count: empTrainings.length,
      name: emp.full_name
    });
  });

  const sortedEmployees = Array.from(employeeHoursMap.entries())
    .sort((a, b) => b[1].hours - a[1].hours);

  const top10Employees = sortedEmployees.slice(0, 10).map(([id, data]) => ({
    id,
    name: data.name,
    total_hours: data.hours,
    trainings_completed: data.count
  }));

  const bottom10Employees = sortedEmployees
    .filter(([_, data]) => data.hours > 0)
    .slice(-10)
    .reverse()
    .map(([id, data]) => ({
      id,
      name: data.name,
      total_hours: data.hours,
      trainings_completed: data.count
    }));

  // GRI 404-1 Compliance
  const missingData: string[] = [];
  const recommendations: string[] = [];

  if (dataQuality === 'low') {
    missingData.push('Duração de treinamentos incompleta (<70%)');
    recommendations.push('Atualizar campo duration_hours em todos os treinamentos');
  }

  if (genderStats.men.employee_count === 0 && genderStats.women.employee_count === 0) {
    missingData.push('Dados de gênero ausentes');
    recommendations.push('Preencher campo gender na tabela employees');
  }

  if (byDepartment.length === 1 && byDepartment[0].department === 'Não especificado') {
    missingData.push('Departamentos não categorizados');
    recommendations.push('Atualizar campo department para todos os funcionários');
  }

  const isCompliant = missingData.length === 0 && dataQuality !== 'low';

  return {
    total_training_hours: totalHours,
    total_employees: totalEmployees,
    average_hours_per_employee: Number(avgHoursPerEmployee.toFixed(1)),
    data_quality: dataQuality,
    trainings_with_duration: trainingsWithDuration,
    trainings_without_duration: trainingsWithoutDuration,
    data_completeness_percent: Number(dataCompleteness.toFixed(1)),
    by_gender: genderStats,
    by_department: byDepartment,
    by_category: byCategory,
    by_role: byRole,
    mandatory_vs_optional: mandatoryVsOptional,
    monthly_trend: monthlyTrend,
    comparison: {
      previous_period_avg: Number(prevAvgHours.toFixed(1)),
      change_percentage: Number(changePercentage.toFixed(1)),
      is_improving: changePercentage > 0
    },
    employees_without_training: {
      count: employeesWithoutTraining.length,
      percentage: Number(((employeesWithoutTraining.length / totalEmployees) * 100).toFixed(1)),
      employee_list: employeesWithoutTrainingList
    },
    top_10_employees: top10Employees,
    bottom_10_employees: bottom10Employees,
    performance_classification: performanceClassification,
    sector_benchmark: sectorBenchmark,
    performance_vs_benchmark: Number(performanceVsBenchmark.toFixed(1)),
    gri_404_1_compliance: {
      is_compliant: isCompliant,
      missing_data: missingData,
      recommendations: recommendations
    },
    calculation_date: new Date().toISOString()
  };
}
