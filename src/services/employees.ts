import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date: string;
  birth_date?: string;
  gender?: string;
  ethnicity?: string;
  education_level?: string;
  salary?: number;
  employment_type: string;
  status: string;
  manager_id?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name');

  if (error) throw error;
  return data;
};

export const getEmployee = async (id: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEmployee = async (id: string, updates: Partial<Employee>) => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getEmployeesStats = async () => {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*');

  if (error) throw error;

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Ativo').length;
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const genderDistribution = employees.reduce((acc, emp) => {
    const gender = emp.gender || 'Não informado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalEmployees,
    activeEmployees,
    departments: departments.length,
    genderDistribution,
    avgSalary: employees.filter(e => e.salary).reduce((sum, e) => sum + (e.salary || 0), 0) / employees.filter(e => e.salary).length || 0
  };
};