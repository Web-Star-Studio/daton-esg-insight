/**
 * Organization entity types
 */

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

export interface ToleranceRange {
  min?: number;
  max?: number;
  unit?: string;
  type?: 'absolute' | 'percentage';
}

export interface MaintenancePart {
  name: string;
  quantity: number;
  cost?: number;
  supplier?: string;
  partNumber?: string;
}

export interface WorkflowStep {
  id: string;
  step_number: number;
  type: 'approval' | 'review' | 'notification';
  name: string;
  description?: string;
  approver_user_ids: string[];
  required_approvals: number;
  parallel_approval: boolean;
}
