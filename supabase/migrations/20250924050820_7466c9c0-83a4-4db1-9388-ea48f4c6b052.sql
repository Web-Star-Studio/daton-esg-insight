-- Criar tabelas para associações estratégicas
CREATE TABLE public.strategic_initiatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  strategic_map_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  responsible_user_id UUID,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para associar objetivos BSC com indicadores, iniciativas e riscos
CREATE TABLE public.strategic_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  bsc_objective_id UUID,
  associated_type TEXT NOT NULL CHECK (associated_type IN ('indicator', 'initiative', 'risk', 'okr')),
  associated_id UUID NOT NULL,
  relationship_type TEXT DEFAULT 'supports' CHECK (relationship_type IN ('supports', 'depends_on', 'conflicts_with', 'measures')),
  weight NUMERIC DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Melhorar tabela de objetivos BSC
ALTER TABLE public.bsc_objectives ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1);
ALTER TABLE public.bsc_objectives ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE public.bsc_objectives ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'));
ALTER TABLE public.bsc_objectives ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- RLS Policies
ALTER TABLE public.strategic_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company strategic initiatives" 
ON public.strategic_initiatives 
FOR ALL 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can manage their company strategic associations" 
ON public.strategic_associations 
FOR ALL 
USING (company_id = get_user_company_id());

-- Triggers para updated_at
CREATE TRIGGER update_strategic_initiatives_updated_at
  BEFORE UPDATE ON public.strategic_initiatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategic_associations_updated_at
  BEFORE UPDATE ON public.strategic_associations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_strategic_initiatives_company_id ON public.strategic_initiatives(company_id);
CREATE INDEX idx_strategic_initiatives_strategic_map_id ON public.strategic_initiatives(strategic_map_id);
CREATE INDEX idx_strategic_associations_company_id ON public.strategic_associations(company_id);
CREATE INDEX idx_strategic_associations_bsc_objective_id ON public.strategic_associations(bsc_objective_id);
CREATE INDEX idx_strategic_associations_associated_id ON public.strategic_associations(associated_id);

-- Função para calcular progresso do BSC baseado em associações
CREATE OR REPLACE FUNCTION public.calculate_bsc_objective_progress(p_objective_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_weight NUMERIC := 0;
    weighted_progress NUMERIC := 0;
    association_record RECORD;
    okr_progress NUMERIC;
    initiative_progress NUMERIC;
BEGIN
    -- Iterar sobre todas as associações do objetivo
    FOR association_record IN 
        SELECT associated_type, associated_id, weight
        FROM strategic_associations 
        WHERE bsc_objective_id = p_objective_id
    LOOP
        total_weight := total_weight + association_record.weight;
        
        -- Calcular progresso baseado no tipo de associação
        CASE association_record.associated_type
            WHEN 'okr' THEN
                SELECT progress_percentage INTO okr_progress
                FROM okrs 
                WHERE id = association_record.associated_id;
                
                weighted_progress := weighted_progress + (COALESCE(okr_progress, 0) * association_record.weight);
                
            WHEN 'initiative' THEN
                SELECT progress_percentage INTO initiative_progress
                FROM strategic_initiatives 
                WHERE id = association_record.associated_id;
                
                weighted_progress := weighted_progress + (COALESCE(initiative_progress, 0) * association_record.weight);
        END CASE;
    END LOOP;
    
    -- Retornar progresso médio ponderado
    IF total_weight > 0 THEN
        RETURN ROUND(weighted_progress / total_weight, 2);
    ELSE
        RETURN 0;
    END IF;
END;
$function$;