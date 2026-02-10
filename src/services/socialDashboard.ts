import { supabase } from "@/integrations/supabase/client";
import type { SocialFilters } from "@ws/shared";

export const getFilterOptions = async () => {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('location, department, position')
    .eq('status', 'Ativo');

  if (error) throw error;

  const locations = [...new Set(employees.map(e => e.location).filter(Boolean))].sort();
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const positions = [...new Set(employees.map(e => e.position).filter(Boolean))].sort();

  return { locations, departments, positions };
};

export const getFilteredTrainingMetrics = async (filters: SocialFilters) => {
  // Build employee filter query
  let employeeQuery = supabase
    .from('employees')
    .select('id, full_name, location, department, position')
    .eq('status', 'Ativo');

  if (filters.location) {
    employeeQuery = employeeQuery.eq('location', filters.location);
  }
  if (filters.department) {
    employeeQuery = employeeQuery.eq('department', filters.department);
  }
  if (filters.position) {
    employeeQuery = employeeQuery.eq('position', filters.position);
  }

  const { data: filteredEmployees, error: empError } = await employeeQuery;
  if (empError) throw empError;

  const employeeIds = filteredEmployees.map(e => e.id);

  // Get trainings for filtered employees
  const { data: trainings, error: trainingError } = await supabase
    .from('employee_trainings')
    .select('*')
    .in('employee_id', employeeIds);

  if (trainingError) throw trainingError;

  // Get training programs
  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('*');

  if (programsError) throw programsError;

  // Calculate hours per employee
  const employeeHours = filteredEmployees.map(emp => {
    const empTrainings = trainings.filter(t => 
      t.employee_id === emp.id && t.status === 'Concluído'
    );
    
    const totalHours = empTrainings.reduce((sum, t) => {
      const program = programs.find(p => p.id === t.training_program_id);
      return sum + (program?.duration_hours || 0);
    }, 0);

    return {
      employee_id: emp.id,
      employee_name: emp.full_name,
      location: emp.location,
      department: emp.department,
      position: emp.position,
      hours: totalHours,
    };
  });

  // Apply hours filter
  const filteredByHours = employeeHours.filter(e => 
    e.hours >= (filters.minHours || 0) && e.hours <= (filters.maxHours || 100)
  );

  // Calculate metrics
  const totalHours = filteredByHours.reduce((sum, e) => sum + e.hours, 0);
  const avgHours = filteredByHours.length > 0 ? totalHours / filteredByHours.length : 0;

  // Group by location
  const hoursByLocation = filteredByHours.reduce((acc, emp) => {
    const loc = emp.location || 'Não especificado';
    if (!acc[loc]) acc[loc] = { total: 0, count: 0 };
    acc[loc].total += emp.hours;
    acc[loc].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Group by department
  const hoursByDepartment = filteredByHours.reduce((acc, emp) => {
    const dept = emp.department || 'Não especificado';
    if (!acc[dept]) acc[dept] = { total: 0, count: 0 };
    acc[dept].total += emp.hours;
    acc[dept].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Group by position
  const hoursByPosition = filteredByHours.reduce((acc, emp) => {
    const pos = emp.position || 'Não especificado';
    if (!acc[pos]) acc[pos] = { total: 0, count: 0 };
    acc[pos].total += emp.hours;
    acc[pos].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return {
    totalEmployees: filteredByHours.length,
    totalHours,
    avgHours: Number(avgHours.toFixed(1)),
    employeeDetails: filteredByHours.sort((a, b) => b.hours - a.hours),
    hoursByLocation: Object.entries(hoursByLocation).map(([name, data]) => ({
      name,
      hours: data.total,
      avgHours: Number((data.total / data.count).toFixed(1)),
      employees: data.count,
    })).sort((a, b) => b.hours - a.hours),
    hoursByDepartment: Object.entries(hoursByDepartment).map(([name, data]) => ({
      name,
      hours: data.total,
      avgHours: Number((data.total / data.count).toFixed(1)),
      employees: data.count,
    })).sort((a, b) => b.hours - a.hours),
    hoursByPosition: Object.entries(hoursByPosition).map(([name, data]) => ({
      name,
      hours: data.total,
      avgHours: Number((data.total / data.count).toFixed(1)),
      employees: data.count,
    })).sort((a, b) => b.hours - a.hours),
  };
};
