-- Create missing recruitment tables and update existing ones

-- Check if interviews table exists, if not create it
CREATE TABLE IF NOT EXISTS public.interviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    job_application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    interviewer_user_id uuid,
    interview_type text NOT NULL DEFAULT 'RH',
    scheduled_date date NOT NULL,
    scheduled_time time NOT NULL,
    duration_minutes integer DEFAULT 60,
    location_type text NOT NULL DEFAULT 'Presencial',
    meeting_link text,
    notes text,
    feedback text,
    score integer,
    status text NOT NULL DEFAULT 'Agendada',
    created_by_user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on interviews if not already enabled
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Add missing columns to job_applications if they don't exist
DO $$
BEGIN
    -- Add candidate_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='candidate_name') THEN
        ALTER TABLE public.job_applications ADD COLUMN candidate_name text;
    END IF;
    
    -- Add candidate_email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='candidate_email') THEN
        ALTER TABLE public.job_applications ADD COLUMN candidate_email text;
    END IF;
    
    -- Add candidate_phone if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='candidate_phone') THEN
        ALTER TABLE public.job_applications ADD COLUMN candidate_phone text;
    END IF;
    
    -- Add candidate_location if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='candidate_location') THEN
        ALTER TABLE public.job_applications ADD COLUMN candidate_location text;
    END IF;
    
    -- Add experience_years if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='experience_years') THEN
        ALTER TABLE public.job_applications ADD COLUMN experience_years integer DEFAULT 0;
    END IF;
    
    -- Add current_stage if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='current_stage') THEN
        ALTER TABLE public.job_applications ADD COLUMN current_stage text DEFAULT 'Análise Curricular';
    END IF;
    
    -- Add score if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='score') THEN
        ALTER TABLE public.job_applications ADD COLUMN score integer DEFAULT 0;
    END IF;
    
    -- Add notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='job_applications' AND column_name='notes') THEN
        ALTER TABLE public.job_applications ADD COLUMN notes text;
    END IF;
END $$;

-- Add missing columns to internal_job_postings
DO $$
BEGIN
    -- Add priority if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_job_postings' AND column_name='priority') THEN
        ALTER TABLE public.internal_job_postings ADD COLUMN priority text DEFAULT 'Média';
    END IF;
    
    -- Add employment_type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_job_postings' AND column_name='employment_type') THEN
        ALTER TABLE public.internal_job_postings ADD COLUMN employment_type text DEFAULT 'CLT';
    END IF;
    
    -- Add level if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_job_postings' AND column_name='level') THEN
        ALTER TABLE public.internal_job_postings ADD COLUMN level text DEFAULT 'Júnior';
    END IF;
    
    -- Add location if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='internal_job_postings' AND column_name='location') THEN
        ALTER TABLE public.internal_job_postings ADD COLUMN location text;
    END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Policy for job_applications
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'job_applications' 
        AND policyname = 'Users can manage their company job applications'
    ) THEN
        CREATE POLICY "Users can manage their company job applications"
        ON public.job_applications
        FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.internal_job_postings 
            WHERE id = job_applications.job_posting_id 
            AND company_id = get_user_company_id()
        ));
    END IF;

    -- Policy for internal_job_postings  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'internal_job_postings' 
        AND policyname = 'Users can manage their company job postings'
    ) THEN
        CREATE POLICY "Users can manage their company job postings"
        ON public.internal_job_postings
        FOR ALL
        USING (company_id = get_user_company_id());
    END IF;

    -- Policy for interviews
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'interviews' 
        AND policyname = 'Users can manage their company interviews'
    ) THEN
        CREATE POLICY "Users can manage their company interviews"
        ON public.interviews
        FOR ALL
        USING (company_id = get_user_company_id());
    END IF;
END $$;