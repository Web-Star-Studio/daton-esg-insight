-- Create supplier_categories table
CREATE TABLE public.supplier_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint for name per company
ALTER TABLE public.supplier_categories 
ADD CONSTRAINT supplier_categories_name_company_unique UNIQUE (company_id, name);

-- Enable RLS
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view supplier categories from their company"
ON public.supplier_categories FOR SELECT
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create supplier categories for their company"
ON public.supplier_categories FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update supplier categories from their company"
ON public.supplier_categories FOR UPDATE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete supplier categories from their company"
ON public.supplier_categories FOR DELETE
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Add category_id to supplier_types
ALTER TABLE public.supplier_types 
ADD COLUMN category_id UUID REFERENCES public.supplier_categories(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_supplier_types_category_id ON public.supplier_types(category_id);
CREATE INDEX idx_supplier_categories_company_id ON public.supplier_categories(company_id);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_categories_updated_at
BEFORE UPDATE ON public.supplier_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();