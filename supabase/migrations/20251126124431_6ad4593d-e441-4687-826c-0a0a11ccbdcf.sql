-- Create training_categories table
CREATE TABLE public.training_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for name per company
CREATE UNIQUE INDEX training_categories_company_name_idx ON public.training_categories(company_id, LOWER(name));

-- Enable RLS
ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view training categories of their company"
  ON public.training_categories FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create training categories"
  ON public.training_categories FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete training categories of their company"
  ON public.training_categories FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_training_categories_updated_at
  BEFORE UPDATE ON public.training_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.training_categories (name, description, company_id, created_by_user_id)
SELECT 
  category,
  'Categoria padrão',
  c.id,
  NULL
FROM (
  VALUES 
    ('Técnico'),
    ('Gestão'),
    ('Segurança'),
    ('Compliance'),
    ('Soft Skills')
) AS defaults(category)
CROSS JOIN companies c
ON CONFLICT DO NOTHING;