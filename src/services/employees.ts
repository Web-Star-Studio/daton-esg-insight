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
  position_id?: string;
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
  termination_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to sanitize employee data - convert empty strings to null for DATE and UUID fields
const sanitizeEmployeeData = (data: Record<string, any>): Record<string, any> => {
  const sanitized = { ...data };
  
  // Campos DATE - converter "" para null
  const dateFields = ['hire_date', 'birth_date', 'termination_date'];
  dateFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });
  
  // Campos UUID - converter "" para null
  const uuidFields = ['branch_id', 'position_id', 'manager_id'];
  uuidFields.forEach(field => {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });
  
  // Campos de texto opcionais - converter "" para null
  const optionalTextFields = ['employee_code', 'email', 'phone', 'department', 'position', 'location', 'notes', 'gender', 'ethnicity', 'education_level'];
  optionalTextFields.forEach(field => {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      const trimmed = String(sanitized[field]).trim();
      sanitized[field] = trimmed === '' ? null : trimmed;
    }
  });
  
  return sanitized;
};

// Pagination interface
export interface PaginatedEmployeesParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  department?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('full_name');

  if (error) throw error;
  return data;
};

// Paginated employees with server-side filtering
export const getEmployeesPaginated = async (params: PaginatedEmployeesParams): Promise<PaginatedResult<Employee>> => {
  const { page, pageSize, search, status, department } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' });

  // Apply filters
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${searchTerm},employee_code.ilike.${searchTerm},position.ilike.${searchTerm}`);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (department && department !== 'all') {
    query = query.eq('department', department);
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('full_name')
    .range(from, to);

  if (error) throw error;

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data || [],
    totalCount,
    totalPages,
    currentPage: page,
  };
};

// Get all departments for filter dropdown
export const getDepartments = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('department')
    .not('department', 'is', null)
    .order('department');

  if (error) throw error;
  
  const uniqueDepartments = [...new Set(data?.map(e => e.department).filter(Boolean) as string[])];
  return uniqueDepartments;
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
    
    // Sanitizar dados antes de enviar ao banco
    const sanitizedEmployee = sanitizeEmployeeData(employee);
    
    // Prepare employee data with company_id and fallback hire_date
    const employeeData = {
      ...sanitizedEmployee,
      company_id: profile.company_id,
      // hire_date é obrigatório - usar data atual se não informada
      hire_date: sanitizedEmployee.hire_date || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData as any)
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
    // Sanitizar dados antes de enviar ao banco
    const sanitizedUpdates = sanitizeEmployeeData(updates);
    
    const { data, error } = await supabase
      .from('employees')
      .update(sanitizedUpdates as any)
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
  // 1. Contar total de funcionários (server-side, sem limite de 1000)
  const { count: totalEmployees, error: totalError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  if (totalError) throw totalError;

  // 2. Contar funcionários ativos (server-side)
  const { count: activeEmployees, error: activeError } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Ativo');

  if (activeError) throw activeError;

  // 3. Buscar departamentos únicos
  const { data: deptData, error: deptError } = await supabase
    .from('employees')
    .select('department')
    .not('department', 'is', null);

  if (deptError) throw deptError;
  const departments = [...new Set(deptData?.map(e => e.department).filter(Boolean))];

  // 4. Buscar distribuição de gênero com contagens server-side (evita limite de 1000)
  const genderValues = ['Masculino', 'Feminino', 'Não binário', 'Outro'];
  const genderDistribution: Record<string, number> = {};

  // Contar cada gênero específico em paralelo
  const genderPromises = genderValues.map(async (genderValue) => {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('gender', genderValue);
    
    if (!error && count && count > 0) {
      return { gender: genderValue, count };
    }
    return null;
  });

  // Contar "Não informado" (gender IS NULL)
  const nullCountPromise = supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .is('gender', null);

  const [genderResults, nullResult] = await Promise.all([
    Promise.all(genderPromises),
    nullCountPromise
  ]);

  // Processar resultados de gêneros específicos
  genderResults.forEach(result => {
    if (result) {
      genderDistribution[result.gender] = result.count;
    }
  });

  // Processar "Não informado"
  if (!nullResult.error && nullResult.count && nullResult.count > 0) {
    genderDistribution['Não informado'] = nullResult.count;
  }

  // 5. Calcular salário médio
  const { data: salaryData, error: salaryError } = await supabase
    .from('employees')
    .select('salary')
    .not('salary', 'is', null);

  if (salaryError) throw salaryError;
  const salaries = salaryData?.map(e => e.salary).filter((s): s is number => s !== null) || [];
  const avgSalary = salaries.length > 0 
    ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length 
    : 0;

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    departments: departments.length,
    genderDistribution,
    avgSalary
  };
};

// React Query hooks
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
};

export const useEmployeesPaginated = (params: PaginatedEmployeesParams) => {
  return useQuery({
    queryKey: ['employees-paginated', params.page, params.pageSize, params.search, params.status, params.department],
    queryFn: () => getEmployeesPaginated(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
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