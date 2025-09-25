-- Enhance non_conformities table structure
ALTER TABLE public.non_conformities 
ADD COLUMN IF NOT EXISTS damage_level text DEFAULT 'Baixo',
ADD COLUMN IF NOT EXISTS impact_analysis text,
ADD COLUMN IF NOT EXISTS root_cause_analysis text,
ADD COLUMN IF NOT EXISTS corrective_actions text,
ADD COLUMN IF NOT EXISTS preventive_actions text,
ADD COLUMN IF NOT EXISTS effectiveness_evaluation text,
ADD COLUMN IF NOT EXISTS effectiveness_date date,
ADD COLUMN IF NOT EXISTS responsible_user_id uuid,
ADD COLUMN IF NOT EXISTS approved_by_user_id uuid,
ADD COLUMN IF NOT EXISTS approval_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS approval_notes text,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS completion_date date,
ADD COLUMN IF NOT EXISTS recurrence_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS similar_nc_ids jsonb DEFAULT '[]'::jsonb;

-- Create non_conformity_timeline table for tracking changes
CREATE TABLE IF NOT EXISTS public.non_conformity_timeline (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    non_conformity_id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    action_description text NOT NULL,
    old_values jsonb DEFAULT '{}'::jsonb,
    new_values jsonb DEFAULT '{}'::jsonb,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    workflow_name text NOT NULL,
    workflow_type text NOT NULL DEFAULT 'non_conformity',
    steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    current_step integer DEFAULT 0,
    status text DEFAULT 'pending',
    requested_by_user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create approval_steps table
CREATE TABLE IF NOT EXISTS public.approval_steps (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    approval_request_id uuid NOT NULL,
    step_number integer NOT NULL,
    approver_user_id uuid NOT NULL,
    status text DEFAULT 'pending',
    approved_at timestamp with time zone,
    comments text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.non_conformity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for non_conformity_timeline
CREATE POLICY "Users can manage timeline from their company NCs" 
ON public.non_conformity_timeline 
FOR ALL 
USING (company_id = get_user_company_id());

-- RLS policies for approval_workflows
CREATE POLICY "Users can manage their company workflows" 
ON public.approval_workflows 
FOR ALL 
USING (company_id = get_user_company_id());

-- RLS policies for approval_requests
CREATE POLICY "Users can manage their company approval requests" 
ON public.approval_requests 
FOR ALL 
USING (company_id = get_user_company_id());

-- RLS policies for approval_steps
CREATE POLICY "Users can manage approval steps from their company" 
ON public.approval_steps 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM approval_requests ar 
    WHERE ar.id = approval_steps.approval_request_id 
    AND ar.company_id = get_user_company_id()
));

-- Create trigger to automatically create timeline entries
CREATE OR REPLACE FUNCTION public.create_nc_timeline_entry()
RETURNS trigger AS $$
DECLARE
    company_record uuid;
BEGIN
    -- Get company_id
    SELECT company_id INTO company_record FROM public.non_conformities WHERE id = COALESCE(NEW.id, OLD.id);
    
    -- Create timeline entry for INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.non_conformity_timeline (
            non_conformity_id,
            company_id,
            user_id,
            action_type,
            action_description,
            new_values
        ) VALUES (
            NEW.id,
            company_record,
            COALESCE(auth.uid(), NEW.responsible_user_id, (SELECT id FROM auth.users LIMIT 1)),
            'created',
            'Não conformidade criada',
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    -- Create timeline entry for UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.non_conformity_timeline (
            non_conformity_id,
            company_id,
            user_id,
            action_type,
            action_description,
            old_values,
            new_values
        ) VALUES (
            NEW.id,
            company_record,
            COALESCE(auth.uid(), NEW.responsible_user_id, OLD.responsible_user_id),
            CASE 
                WHEN OLD.status != NEW.status THEN 'status_changed'
                WHEN OLD.approved_by_user_id IS NULL AND NEW.approved_by_user_id IS NOT NULL THEN 'approved'
                ELSE 'updated'
            END,
            CASE 
                WHEN OLD.status != NEW.status THEN 'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"'
                WHEN OLD.approved_by_user_id IS NULL AND NEW.approved_by_user_id IS NOT NULL THEN 'Não conformidade aprovada'
                ELSE 'Não conformidade atualizada'
            END,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS nc_timeline_trigger ON public.non_conformities;
CREATE TRIGGER nc_timeline_trigger
    AFTER INSERT OR UPDATE ON public.non_conformities
    FOR EACH ROW EXECUTE FUNCTION public.create_nc_timeline_entry();