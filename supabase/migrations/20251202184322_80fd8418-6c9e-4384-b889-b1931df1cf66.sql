-- Criar tabela training_statuses
CREATE TABLE public.training_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) DEFAULT 'bg-gray-500',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, company_id)
);

-- Habilitar RLS
ALTER TABLE public.training_statuses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view training statuses"
  ON public.training_statuses FOR SELECT USING (true);

CREATE POLICY "Users can insert training statuses"
  ON public.training_statuses FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update training statuses"
  ON public.training_statuses FOR UPDATE USING (true);

CREATE POLICY "Users can delete training statuses"
  ON public.training_statuses FOR DELETE USING (true);