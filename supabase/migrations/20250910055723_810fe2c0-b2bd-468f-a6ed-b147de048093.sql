-- Create data collection tables
CREATE TABLE public.data_collection_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('Mensal', 'Trimestral', 'Anual')),
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Atraso', 'Concluído')),
    assigned_to_user_id UUID,
    related_asset_id UUID,
    task_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.data_import_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    uploader_user_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    import_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Processando' CHECK (status IN ('Processando', 'Concluído', 'Falhou')),
    progress_percentage INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_total INTEGER DEFAULT 0,
    log JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_collection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_collection_tasks
CREATE POLICY "Users can manage their company tasks" 
ON public.data_collection_tasks 
FOR ALL 
USING (company_id = get_user_company_id());

-- RLS Policies for data_import_jobs
CREATE POLICY "Users can manage their company import jobs" 
ON public.data_import_jobs 
FOR ALL 
USING (company_id = get_user_company_id());

-- Triggers for updated_at
CREATE TRIGGER update_data_collection_tasks_updated_at
BEFORE UPDATE ON public.data_collection_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_import_jobs_updated_at
BEFORE UPDATE ON public.data_import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-update task status based on due_date
CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.data_collection_tasks 
    SET status = 'Em Atraso'
    WHERE due_date < CURRENT_DATE 
    AND status = 'Pendente';
END;
$$;