import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  project_type: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  budget: number;
  spent_budget: number;
  progress_percentage: number;
  scope_description?: string;
  manager_user_id?: string;
  sponsor_user_id?: string;
  phase: string;
  methodology: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id?: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  estimated_hours: number;
  actual_hours: number;
  progress_percentage: number;
  dependencies: string[];
  assigned_to_user_id?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  target_date: string;
  actual_date?: string;
  status: string;
  criteria?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectResource {
  id: string;
  project_id: string;
  employee_id?: string;
  role_name: string;
  allocation_percentage: number;
  hourly_rate: number;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeChange {
  id: string;
  project_id: string;
  change_request: string;
  justification?: string;
  impact_description?: string;
  budget_impact: number;
  schedule_impact_days: number;
  status: string;
  requested_by_user_id: string;
  approved_by_user_id?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BurndownData {
  id: string;
  project_id: string;
  date: string;
  planned_work_remaining: number;
  actual_work_remaining: number;
  work_completed: number;
  created_at: string;
}

// Project CRUD operations
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data || [];
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }

  return data;
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by_user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('User company not found');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      company_id: profile.company_id,
      created_by_user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  return data;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Project Tasks
export async function getProjectTasks(projectId: string) {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project tasks:', error);
    throw error;
  }

  return data || [];
}

export async function createProjectTask(task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      ...task,
      created_by_user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project task:', error);
    throw error;
  }

  return data;
}

export async function updateProjectTask(id: string, updates: Partial<ProjectTask>) {
  const { data, error } = await supabase
    .from('project_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project task:', error);
    throw error;
  }

  return data;
}

export async function deleteProjectTask(id: string) {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project task:', error);
    throw error;
  }
}

// Project Milestones
export async function getProjectMilestones(projectId: string) {
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('target_date', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }

  return data || [];
}

export async function createProjectMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('project_milestones')
    .insert(milestone)
    .select()
    .single();

  if (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }

  return data;
}

export async function updateProjectMilestone(id: string, updates: Partial<ProjectMilestone>) {
  const { data, error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }

  return data;
}

// Project Resources
export async function getProjectResources(projectId: string) {
  const { data, error } = await supabase
    .from('project_resources')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project resources:', error);
    throw error;
  }

  return data || [];
}

export async function createProjectResource(resource: Omit<ProjectResource, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('project_resources')
    .insert(resource)
    .select()
    .single();

  if (error) {
    console.error('Error creating project resource:', error);
    throw error;
  }

  return data;
}

// Burndown Data
export async function getBurndownData(projectId: string) {
  const { data, error } = await supabase
    .from('project_burndown_data')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching burndown data:', error);
    throw error;
  }

  return data || [];
}

export async function updateBurndownData(projectId: string, date: string, burndownData: { planned_work_remaining: number; actual_work_remaining: number; work_completed?: number }) {
  const { error } = await supabase
    .from('project_burndown_data')
    .upsert({
      project_id: projectId,
      date,
      planned_work_remaining: burndownData.planned_work_remaining,
      actual_work_remaining: burndownData.actual_work_remaining,
      work_completed: burndownData.work_completed || 0
    });

  if (error) {
    console.error('Error updating burndown data:', error);
    throw error;
  }
}

// Scope Changes
export async function getScopeChanges(projectId: string) {
  const { data, error } = await supabase
    .from('project_scope_changes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scope changes:', error);
    throw error;
  }

  return data || [];
}

export async function createScopeChange(change: Omit<ScopeChange, 'id' | 'created_at' | 'updated_at' | 'requested_by_user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('project_scope_changes')
    .insert({
      ...change,
      requested_by_user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scope change:', error);
    throw error;
  }

  return data;
}