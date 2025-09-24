-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    project_type TEXT NOT NULL DEFAULT 'Estratégico',
    status TEXT NOT NULL DEFAULT 'Planejamento',
    priority TEXT DEFAULT 'Média',
    start_date DATE,
    end_date DATE,
    planned_start_date DATE,
    planned_end_date DATE,
    budget NUMERIC DEFAULT 0,
    spent_budget NUMERIC DEFAULT 0,
    progress_percentage NUMERIC DEFAULT 0,
    scope_description TEXT,
    manager_user_id UUID,
    sponsor_user_id UUID,
    phase TEXT NOT NULL DEFAULT 'Planejamento',
    methodology TEXT DEFAULT 'Tradicional',
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Create project_tasks table (extends existing action plans)
CREATE TABLE public.project_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    parent_task_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Não Iniciada',
    priority TEXT DEFAULT 'Média',
    start_date DATE,
    end_date DATE,
    planned_start_date DATE,
    planned_end_date DATE,
    estimated_hours NUMERIC DEFAULT 0,
    actual_hours NUMERIC DEFAULT 0,
    progress_percentage NUMERIC DEFAULT 0,
    dependencies JSONB DEFAULT '[]',
    assigned_to_user_id UUID,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create project_milestones table
CREATE TABLE public.project_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    actual_date DATE,
    status TEXT NOT NULL DEFAULT 'Pendente',
    criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create project_resources table
CREATE TABLE public.project_resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    employee_id UUID,
    role_name TEXT NOT NULL,
    allocation_percentage NUMERIC DEFAULT 100,
    hourly_rate NUMERIC DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'Ativo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT project_resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create project_scope_changes table
CREATE TABLE public.project_scope_changes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    change_request TEXT NOT NULL,
    justification TEXT,
    impact_description TEXT,
    budget_impact NUMERIC DEFAULT 0,
    schedule_impact_days INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pendente',
    requested_by_user_id UUID NOT NULL,
    approved_by_user_id UUID,
    approval_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT project_scope_changes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create project_burndown_data table
CREATE TABLE public.project_burndown_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    date DATE NOT NULL,
    planned_work_remaining NUMERIC NOT NULL,
    actual_work_remaining NUMERIC NOT NULL,
    work_completed NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT project_burndown_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scope_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_burndown_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their company projects" ON public.projects
FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage tasks from their company projects" ON public.project_tasks
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_tasks.project_id 
    AND projects.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage milestones from their company projects" ON public.project_milestones
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage resources from their company projects" ON public.project_resources
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_resources.project_id 
    AND projects.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage scope changes from their company projects" ON public.project_scope_changes
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_scope_changes.project_id 
    AND projects.company_id = get_user_company_id()
));

CREATE POLICY "Users can manage burndown data from their company projects" ON public.project_burndown_data
FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_burndown_data.project_id 
    AND projects.company_id = get_user_company_id()
));

-- Create function to update project progress
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    project_progress NUMERIC;
BEGIN
    -- Calculate project progress based on tasks
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('Concluída', 'Finalizada')) as completed
    INTO total_tasks, completed_tasks
    FROM public.project_tasks 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    IF total_tasks > 0 THEN
        project_progress := (completed_tasks::NUMERIC / total_tasks::NUMERIC) * 100;
    ELSE
        project_progress := 0;
    END IF;
    
    -- Update project progress
    UPDATE public.projects 
    SET 
        progress_percentage = project_progress,
        updated_at = now()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic progress calculation
CREATE TRIGGER update_project_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- Create trigger for updating timestamps
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at
    BEFORE UPDATE ON public.project_milestones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_resources_updated_at
    BEFORE UPDATE ON public.project_resources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_scope_changes_updated_at
    BEFORE UPDATE ON public.project_scope_changes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();