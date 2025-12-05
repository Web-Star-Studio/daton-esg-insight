-- Create safety_inspections table
CREATE TABLE public.safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Identification
  title VARCHAR(255) NOT NULL,
  inspection_type VARCHAR(100) NOT NULL,
  
  -- Location and Responsibles
  area_location VARCHAR(255),
  inspector_name VARCHAR(255) NOT NULL,
  inspector_user_id UUID REFERENCES auth.users(id),
  accompanied_by VARCHAR(255),
  
  -- Dates
  scheduled_date DATE,
  inspection_date DATE,
  due_date DATE,
  
  -- Result
  status VARCHAR(50) DEFAULT 'Pendente',
  result VARCHAR(50),
  score DECIMAL(5,2),
  
  -- Details
  checklist_items JSONB DEFAULT '[]',
  observations TEXT,
  non_conformities TEXT,
  corrective_actions TEXT,
  photos_urls TEXT[],
  
  -- Audit
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_safety_inspections_company ON public.safety_inspections(company_id);
CREATE INDEX idx_safety_inspections_status ON public.safety_inspections(status);
CREATE INDEX idx_safety_inspections_type ON public.safety_inspections(inspection_type);
CREATE INDEX idx_safety_inspections_date ON public.safety_inspections(inspection_date);

-- Enable RLS
ALTER TABLE public.safety_inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company inspections" ON public.safety_inspections
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert company inspections" ON public.safety_inspections
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update company inspections" ON public.safety_inspections
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete company inspections" ON public.safety_inspections
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_safety_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safety_inspections_updated_at
  BEFORE UPDATE ON public.safety_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_safety_inspections_updated_at();