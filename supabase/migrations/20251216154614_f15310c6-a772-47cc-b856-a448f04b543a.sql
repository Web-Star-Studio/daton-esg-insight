-- Create supplier_training_materials table
CREATE TABLE public.supplier_training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('arquivo', 'link', 'questionario')),
  
  -- Para arquivos
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  
  -- Para links
  external_url TEXT,
  
  -- Para questionários (reutiliza sistema existente)
  custom_form_id UUID REFERENCES public.custom_forms(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT false,
  due_days INTEGER,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create supplier_training_category_links table
CREATE TABLE public.supplier_training_category_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_material_id UUID NOT NULL REFERENCES public.supplier_training_materials(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.supplier_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(training_material_id, category_id)
);

-- Create supplier_training_progress table
CREATE TABLE public.supplier_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.supplier_management(id) ON DELETE CASCADE,
  training_material_id UUID NOT NULL REFERENCES public.supplier_training_materials(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'visualizado', 'concluido')),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  form_submission_id UUID,
  score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(supplier_id, training_material_id)
);

-- Enable RLS
ALTER TABLE public.supplier_training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_training_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_training_materials
CREATE POLICY "Users can view training materials from their company"
ON public.supplier_training_materials FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create training materials for their company"
ON public.supplier_training_materials FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update training materials from their company"
ON public.supplier_training_materials FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete training materials from their company"
ON public.supplier_training_materials FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for supplier_training_category_links
CREATE POLICY "Users can view training category links"
ON public.supplier_training_category_links FOR SELECT
USING (training_material_id IN (
  SELECT id FROM public.supplier_training_materials 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can create training category links"
ON public.supplier_training_category_links FOR INSERT
WITH CHECK (training_material_id IN (
  SELECT id FROM public.supplier_training_materials 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

CREATE POLICY "Users can delete training category links"
ON public.supplier_training_category_links FOR DELETE
USING (training_material_id IN (
  SELECT id FROM public.supplier_training_materials 
  WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
));

-- RLS Policies for supplier_training_progress
CREATE POLICY "Users can view training progress from their company"
ON public.supplier_training_progress FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create training progress for their company"
ON public.supplier_training_progress FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update training progress from their company"
ON public.supplier_training_progress FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX idx_supplier_training_materials_company ON public.supplier_training_materials(company_id);
CREATE INDEX idx_supplier_training_materials_type ON public.supplier_training_materials(material_type);
CREATE INDEX idx_supplier_training_category_links_material ON public.supplier_training_category_links(training_material_id);
CREATE INDEX idx_supplier_training_category_links_category ON public.supplier_training_category_links(category_id);
CREATE INDEX idx_supplier_training_progress_supplier ON public.supplier_training_progress(supplier_id);
CREATE INDEX idx_supplier_training_progress_material ON public.supplier_training_progress(training_material_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_training_materials_updated_at
BEFORE UPDATE ON public.supplier_training_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_training_progress_updated_at
BEFORE UPDATE ON public.supplier_training_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();