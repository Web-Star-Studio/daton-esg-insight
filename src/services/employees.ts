import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formErrorHandler } from "@/utils/formErrorHandler";

export interface Employee {
  id: string;
  company_id: string;
  employee_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  position_id?: string; // Add position_id to link with organizational structure
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
  branch_id?: string;
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
    .maybeSingle();

  if (error || !data) {
    throw new Error('Funcionário não encontrado');
  }
  return data;
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'company_id'>) => {
  return formErrorHandler.createRecord(async () => {
    // Get authenticated user and company_id
    const { profile } = await formErrorHandler.checkAuth();
    
    // Prepare employee data with company_id and fallback hire_date
    const employeeData = {
      ...employee,
      company_id: profile.company_id,
      hire_date: employee.hire_date || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Erro ao criar funcionário');
    return data;
  }, { 
    formType: 'Funcionário',
    successMessage: 'Funcionário criado com sucesso!'
  });
};

export const updateEmployee = async (id: string, updates: Partial<Employee>) => {
  return formErrorHandler.updateRecord(async () => {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Funcionário não encontrado');
    return data;
  }, { 
    formType: 'Funcionário',
    successMessage: 'Funcionário atualizado com sucesso!'
  });
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

// React Query hooks
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Employee> }) =>
      updateEmployee(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Helper function to get employees as options (filtered by user's company)
export const getEmployeesAsOptions = async (): Promise<Array<{value: string; label: string}>> => {
  try {
    // Get authenticated user's company
    const { profile } = await formErrorHandler.checkAuth();
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .order('full_name');
    
    if (error) throw error;
    
    return employees?.map(employee => ({
      value: employee.id,
      label: employee.full_name
    })) || [];
  } catch (error) {
    console.error('Error loading employees as options:', error);
    return [];
  }
};

// React Query hook for employee options
export const useEmployeesAsOptions = () => {
  return useQuery({
    queryKey: ['employees-options'],
    queryFn: getEmployeesAsOptions,
  });
};

// Check if employee code already exists
export const checkEmployeeCodeExists = async (code: string, companyId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('employees')
    .select('employee_code')
    .eq('company_id', companyId)
    .eq('employee_code', code)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};