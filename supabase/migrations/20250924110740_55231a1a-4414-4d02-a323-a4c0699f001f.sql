-- Create departments table
CREATE TABLE public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES public.departments(id),
    manager_employee_id UUID,
    budget NUMERIC,
    cost_center TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create positions table
CREATE TABLE public.positions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT, -- Junior, Pleno, Senior, etc
    salary_range_min NUMERIC,
    salary_range_max NUMERIC,
    requirements TEXT[],
    responsibilities TEXT[],
    reports_to_position_id UUID REFERENCES public.positions(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organizational_chart table
CREATE TABLE public.organizational_chart (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_id UUID REFERENCES public.employees(id),
    position_id UUID REFERENCES public.positions(id),
    department_id UUID REFERENCES public.departments(id),
    reports_to_employee_id UUID REFERENCES public.employees(id),
    hierarchy_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_chart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
CREATE POLICY "Users can manage their company departments" 
ON public.departments 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for positions
CREATE POLICY "Users can manage their company positions" 
ON public.positions 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for organizational_chart
CREATE POLICY "Users can manage their company org chart" 
ON public.organizational_chart 
FOR ALL 
USING (company_id = get_user_company_id());

-- Add foreign key reference for department manager
ALTER TABLE public.departments 
ADD CONSTRAINT departments_manager_employee_id_fkey 
FOREIGN KEY (manager_employee_id) REFERENCES public.employees(id);

-- Update employees table to reference position
ALTER TABLE public.employees 
ADD COLUMN position_id UUID REFERENCES public.positions(id);

-- Create updated_at triggers
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizational_chart_updated_at
    BEFORE UPDATE ON public.organizational_chart
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate hierarchy levels
CREATE OR REPLACE FUNCTION public.calculate_hierarchy_levels(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    chart_record RECORD;
    current_level INTEGER;
BEGIN
    -- Reset all hierarchy levels
    UPDATE public.organizational_chart 
    SET hierarchy_level = 0 
    WHERE company_id = p_company_id;
    
    -- Calculate levels starting from top (no reports_to)
    FOR chart_record IN 
        SELECT id, reports_to_employee_id 
        FROM public.organizational_chart 
        WHERE company_id = p_company_id 
        AND is_active = true
    LOOP
        current_level := 0;
        
        -- Calculate level by counting up the chain
        WITH RECURSIVE hierarchy_chain AS (
            SELECT id, reports_to_employee_id, 0 as level
            FROM public.organizational_chart 
            WHERE id = chart_record.id
            
            UNION ALL
            
            SELECT oc.id, oc.reports_to_employee_id, hc.level + 1
            FROM public.organizational_chart oc
            JOIN hierarchy_chain hc ON oc.employee_id = hc.reports_to_employee_id
            WHERE oc.company_id = p_company_id AND oc.is_active = true
        )
        SELECT MAX(level) INTO current_level FROM hierarchy_chain;
        
        UPDATE public.organizational_chart 
        SET hierarchy_level = COALESCE(current_level, 0)
        WHERE id = chart_record.id;
    END LOOP;
END;
$$;