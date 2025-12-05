import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from "@/utils/formErrorHandler";

export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  parent_department_id?: string;
  manager_employee_id?: string;
  budget?: number;
  cost_center?: string;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    full_name: string;
  };
  parent_department?: {
    id: string;
    name: string;
  };
  sub_departments?: Department[];
  employee_count?: number;
}

export interface Position {
  id: string;
  company_id: string;
  department_id?: string;
  title: string;
  description?: string;
  level?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  requirements?: string[];
  responsibilities?: string[];
  reports_to_position_id?: string;
  required_education_level?: string;
  required_experience_years?: number;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  };
  reports_to_position?: {
    id: string;
    title: string;
  };
}

export interface OrganizationalChartNode {
  id: string;
  company_id: string;
  employee_id: string;
  position_id?: string;
  department_id?: string;
  reports_to_employee_id?: string;
  hierarchy_level: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  employee: {
    id: string;
    full_name: string;
    email?: string;
    position?: string;
  };
  position?: {
    id: string;
    title: string;
  };
  department?: {
    id: string;
    name: string;
  };
  subordinates?: OrganizationalChartNode[];
}

// Department operations
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data as any) || [];
  } catch (error) {
    console.warn('Error fetching departments with relations, falling back to simple query:', error);
    // Fallback to simple query without relations
    const { data, error: simpleError } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (simpleError) throw simpleError;
    return (data as any) || [];
  }
};

export const createDepartment = async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> => {
  return formErrorHandler.createRecord<Department>(
    async () => {
      // Get authentication and company info
      const { user, profile } = await formErrorHandler.checkAuth();
      
      // Add company_id to department data
      const departmentData = {
        ...department,
        company_id: profile.company_id
      };

      const { data, error } = await supabase
        .from('departments')
        .insert([departmentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating department:', error);
        throw error;
      }
      
      return data;
    },
    {
      formType: 'Departamento',
      successMessage: 'Departamento criado com sucesso!'
    }
  );
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<Department> => {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Position operations
export const getPositions = async (): Promise<Position[]> => {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('title');

    if (error) throw error;
    return (data as any) || [];
  } catch (error) {
    console.warn('Error fetching positions with relations, falling back to simple query:', error);
    // Fallback to simple query without relations
    const { data, error: simpleError } = await supabase
      .from('positions')
      .select('*')
      .order('title');

    if (simpleError) throw simpleError;
    return (data as any) || [];
  }
};

export const createPosition = async (position: Omit<Position, 'id' | 'created_at' | 'updated_at'>): Promise<Position> => {
  return formErrorHandler.createRecord<Position>(
    async () => {
      // Get authentication and company info
      const { user, profile } = await formErrorHandler.checkAuth();
      
      // Add company_id to position data
      const positionData = {
        ...position,
        company_id: profile.company_id
      };

      const { data, error } = await supabase
        .from('positions')
        .insert([positionData])
        .select()
        .single();

      if (error) {
        console.error('Error creating position:', error);
        throw error;
      }
      
      return data;
    },
    {
      formType: 'Cargo',
      successMessage: 'Cargo criado com sucesso!'
    }
  );
};

export const updatePosition = async (id: string, updates: Partial<Position>): Promise<Position> => {
  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePosition = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Organizational chart operations
export const getOrganizationalChart = async (): Promise<OrganizationalChartNode[]> => {
  const { data, error } = await supabase
    .from('organizational_chart')
    .select(`
      *,
      employee:employees(id, full_name, email, position),
      position:positions(id, title),
      department:departments(id, name)
    `)
    .eq('is_active', true)
    .order('hierarchy_level');

  if (error) throw error;
  return (data as any) || [];
};

export const createOrganizationalChartNode = async (node: Omit<OrganizationalChartNode, 'id' | 'created_at' | 'updated_at' | 'employee' | 'position' | 'department'>): Promise<OrganizationalChartNode> => {
  try {
    // Ensure user is authenticated and get company_id
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    // Get user's company_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      throw new Error('Perfil de usuário não encontrado. Entre em contato com o suporte.');
    }

    // Add company_id to node data
    const nodeData = {
      ...node,
      company_id: profile.company_id
    };

    const { data, error } = await supabase
      .from('organizational_chart')
      .insert([nodeData])
      .select(`
        *,
        employee:employees(id, full_name, email, position),
        position:positions(id, title),
        department:departments(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating organizational chart node:', error);
      if (error.code === 'PGRST116') {
        throw new Error('Você não tem permissão para criar nós no organograma.');
      }
      throw error;
    }
    
    return data as any;
  } catch (error: any) {
    console.error('Create organizational chart node error:', error);
    throw error;
  }
};

export const updateOrganizationalChartNode = async (id: string, updates: Partial<OrganizationalChartNode>): Promise<OrganizationalChartNode> => {
  const { data, error } = await supabase
    .from('organizational_chart')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      employee:employees(id, full_name, email, position),
      position:positions(id, title),
      department:departments(id, name)
    `)
    .single();

  if (error) throw error;
  return data as any;
};

export const deleteOrganizationalChartNode = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('organizational_chart')
    .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
    .eq('id', id);

  if (error) throw error;
};

// Build hierarchical structure
export const buildOrganizationalHierarchy = (nodes: OrganizationalChartNode[]): OrganizationalChartNode[] => {
  const nodeMap = new Map<string, OrganizationalChartNode>();
  const rootNodes: OrganizationalChartNode[] = [];

  // Create a map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.employee_id, { ...node, subordinates: [] });
  });

  // Build the hierarchy
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.employee_id);
    if (!currentNode) return;

    if (node.reports_to_employee_id) {
      const parentNode = nodeMap.get(node.reports_to_employee_id);
      if (parentNode) {
        parentNode.subordinates = parentNode.subordinates || [];
        parentNode.subordinates.push(currentNode);
      } else {
        rootNodes.push(currentNode);
      }
    } else {
      rootNodes.push(currentNode);
    }
  });

  return rootNodes;
};

// Get department hierarchy with employee counts
export const getDepartmentHierarchy = async (): Promise<Department[]> => {
  const departments = await getDepartments();
  
  // Get employee count for each department - using a simpler approach
  const { data: employees } = await supabase
    .from('employees')
    .select('department')
    .eq('status', 'Ativo');

  // Count employees by department
  const employeeCountMap = new Map<string, number>();
  employees?.forEach(emp => {
    if (emp.department) {
      employeeCountMap.set(emp.department, (employeeCountMap.get(emp.department) || 0) + 1);
    }
  });

  const departmentMap = new Map<string, Department>();
  const rootDepartments: Department[] = [];

  // Create department map with employee counts
  departments.forEach(dept => {
    const employeeCount = employeeCountMap.get(dept.name) || 0;
    departmentMap.set(dept.id, { ...dept, employee_count: employeeCount, sub_departments: [] });
  });

  // Build hierarchy
  departments.forEach(dept => {
    const currentDept = departmentMap.get(dept.id);
    if (!currentDept) return;

    if (dept.parent_department_id) {
      const parentDept = departmentMap.get(dept.parent_department_id);
      if (parentDept) {
        parentDept.sub_departments = parentDept.sub_departments || [];
        parentDept.sub_departments.push(currentDept);
      } else {
        rootDepartments.push(currentDept);
      }
    } else {
      rootDepartments.push(currentDept);
    }
  });

  return rootDepartments;
};

// Calculate and update hierarchy levels
export const updateHierarchyLevels = async (): Promise<void> => {
  const { error } = await supabase.rpc('calculate_hierarchy_levels', {
    p_company_id: (await supabase.auth.getUser()).data.user?.id
  });

  if (error) throw error;
};