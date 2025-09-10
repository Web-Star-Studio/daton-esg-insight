-- Create enum for goal status
CREATE TYPE public.goal_status_enum AS ENUM (
  'No Caminho Certo',
  'Atenção Necessária', 
  'Atingida',
  'Atrasada'
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  metric_key VARCHAR NOT NULL,
  baseline_value NUMERIC,
  baseline_period VARCHAR,
  target_value NUMERIC NOT NULL,
  deadline_date DATE NOT NULL,
  status goal_status_enum NOT NULL DEFAULT 'No Caminho Certo',
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goal progress updates table  
CREATE TABLE public.goal_progress_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  update_date DATE NOT NULL,
  current_value NUMERIC NOT NULL,
  progress_percentage NUMERIC,
  notes TEXT,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals table
CREATE POLICY "Users can manage their company goals" 
ON public.goals 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for goal_progress_updates table
CREATE POLICY "Users can manage progress updates from their company goals" 
ON public.goal_progress_updates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = goal_progress_updates.goal_id 
    AND goals.company_id = get_user_company_id()
  )
);

-- Create updated_at trigger for goals
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_goals_company_id ON public.goals(company_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_deadline_date ON public.goals(deadline_date);
CREATE INDEX idx_goals_responsible_user_id ON public.goals(responsible_user_id);
CREATE INDEX idx_goal_progress_updates_goal_id ON public.goal_progress_updates(goal_id);
CREATE INDEX idx_goal_progress_updates_update_date ON public.goal_progress_updates(update_date);

-- Add business validation constraints
ALTER TABLE public.goals 
ADD CONSTRAINT chk_target_value_positive 
CHECK (target_value > 0);

ALTER TABLE public.goal_progress_updates 
ADD CONSTRAINT chk_current_value_not_negative 
CHECK (current_value >= 0);

-- Create function to automatically calculate progress percentage
CREATE OR REPLACE FUNCTION public.calculate_goal_progress_percentage()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    calculated_percentage NUMERIC;
BEGIN
    -- Get goal information
    SELECT baseline_value, target_value 
    INTO goal_record 
    FROM public.goals 
    WHERE id = NEW.goal_id;
    
    -- Calculate progress percentage
    IF goal_record.baseline_value IS NOT NULL AND goal_record.target_value IS NOT NULL THEN
        -- Formula: ((current_value - baseline_value) / (target_value - baseline_value)) * 100
        calculated_percentage := 
            CASE 
                WHEN goal_record.target_value = goal_record.baseline_value THEN 100
                ELSE ((NEW.current_value - goal_record.baseline_value) / 
                     (goal_record.target_value - goal_record.baseline_value)) * 100
            END;
        
        NEW.progress_percentage := ROUND(calculated_percentage, 2);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate progress percentage
CREATE TRIGGER trigger_calculate_progress_percentage
    BEFORE INSERT OR UPDATE ON public.goal_progress_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_goal_progress_percentage();