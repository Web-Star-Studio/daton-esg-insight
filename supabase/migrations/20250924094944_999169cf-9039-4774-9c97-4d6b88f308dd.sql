-- Expand process_maps table with version control
ALTER TABLE public.process_maps 
ADD COLUMN IF NOT EXISTS version VARCHAR DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Draft',
ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES public.process_maps(id),
ADD COLUMN IF NOT EXISTS approved_by_user_id UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true;

-- Create process steps table
CREATE TABLE IF NOT EXISTS public.process_steps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL REFERENCES public.process_maps(id) ON DELETE CASCADE,
    step_type VARCHAR NOT NULL DEFAULT 'activity', -- start, end, activity, decision, connector
    name TEXT NOT NULL,
    description TEXT,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    width NUMERIC DEFAULT 120,
    height NUMERIC DEFAULT 60,
    properties JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create process connections table (for flow arrows)
CREATE TABLE IF NOT EXISTS public.process_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL REFERENCES public.process_maps(id) ON DELETE CASCADE,
    from_step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
    to_step_id UUID NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
    label TEXT,
    condition_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SIPOC elements table
CREATE TABLE IF NOT EXISTS public.sipoc_elements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL REFERENCES public.process_maps(id) ON DELETE CASCADE,
    element_type VARCHAR NOT NULL, -- supplier, input, output, customer
    name TEXT NOT NULL,
    description TEXT,
    stakeholder_id UUID,
    requirements TEXT,
    specifications TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create turtle diagrams table
CREATE TABLE IF NOT EXISTS public.turtle_diagrams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL REFERENCES public.process_maps(id) ON DELETE CASCADE,
    process_step_id UUID REFERENCES public.process_steps(id),
    inputs JSONB DEFAULT '[]',
    outputs JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]', -- human resources, equipment, etc
    methods JSONB DEFAULT '[]', -- procedures, methods
    measurements JSONB DEFAULT '[]', -- KPIs, indicators
    risks JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create process stakeholders table
CREATE TABLE IF NOT EXISTS public.process_stakeholders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    process_map_id UUID NOT NULL REFERENCES public.process_maps(id) ON DELETE CASCADE,
    stakeholder_id UUID,
    role VARCHAR NOT NULL, -- owner, participant, approver, reviewer
    responsibilities TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sipoc_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turtle_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS policies for process_steps
CREATE POLICY "Users can manage steps from their company processes"
ON public.process_steps FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.process_maps pm
    WHERE pm.id = process_steps.process_map_id 
    AND pm.company_id = get_user_company_id()
));

-- RLS policies for process_connections
CREATE POLICY "Users can manage connections from their company processes"
ON public.process_connections FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.process_maps pm
    WHERE pm.id = process_connections.process_map_id 
    AND pm.company_id = get_user_company_id()
));

-- RLS policies for sipoc_elements
CREATE POLICY "Users can manage SIPOC from their company processes"
ON public.sipoc_elements FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.process_maps pm
    WHERE pm.id = sipoc_elements.process_map_id 
    AND pm.company_id = get_user_company_id()
));

-- RLS policies for turtle_diagrams
CREATE POLICY "Users can manage turtle diagrams from their company processes"
ON public.turtle_diagrams FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.process_maps pm
    WHERE pm.id = turtle_diagrams.process_map_id 
    AND pm.company_id = get_user_company_id()
));

-- RLS policies for process_stakeholders
CREATE POLICY "Users can manage process stakeholders from their company processes"
ON public.process_stakeholders FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.process_maps pm
    WHERE pm.id = process_stakeholders.process_map_id 
    AND pm.company_id = get_user_company_id()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_process_steps_map_id ON public.process_steps(process_map_id);
CREATE INDEX IF NOT EXISTS idx_process_connections_map_id ON public.process_connections(process_map_id);
CREATE INDEX IF NOT EXISTS idx_sipoc_elements_map_id ON public.sipoc_elements(process_map_id);
CREATE INDEX IF NOT EXISTS idx_turtle_diagrams_map_id ON public.turtle_diagrams(process_map_id);
CREATE INDEX IF NOT EXISTS idx_process_stakeholders_map_id ON public.process_stakeholders(process_map_id);

-- Add triggers for updated_at
CREATE TRIGGER update_process_steps_updated_at
    BEFORE UPDATE ON public.process_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sipoc_elements_updated_at
    BEFORE UPDATE ON public.sipoc_elements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_turtle_diagrams_updated_at
    BEFORE UPDATE ON public.turtle_diagrams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();