-- Criar tabela para atividades de conservação/compensação de carbono
CREATE TABLE public.conservation_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'reflorestamento', 'conservacao_mata', 'restauracao', 'agroflorestas', 'energia_renovavel', etc.
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_size NUMERIC, -- em hectares
  coordinates JSONB, -- lat/lng para mapeamento
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'Planejada', -- 'Planejada', 'Em Andamento', 'Concluída', 'Suspensa'
  investment_amount NUMERIC DEFAULT 0,
  carbon_impact_estimate NUMERIC DEFAULT 0, -- tCO2e estimado
  methodology TEXT,
  monitoring_plan TEXT,
  responsible_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para monitoramento das atividades
CREATE TABLE public.activity_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.conservation_activities(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  monitoring_date DATE NOT NULL,
  progress_percentage NUMERIC DEFAULT 0,
  carbon_sequestered NUMERIC DEFAULT 0, -- tCO2e sequestrado até o momento
  area_completed NUMERIC DEFAULT 0, -- hectares completados
  notes TEXT,
  evidence_files JSONB DEFAULT '[]'::jsonb, -- array de URLs de arquivos/fotos
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tipos de atividades predefinidos
CREATE TABLE public.conservation_activity_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  carbon_factor NUMERIC DEFAULT 0, -- fator de sequestro por hectare/ano
  unit TEXT DEFAULT 'hectares',
  methodology_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir tipos de atividades padrão
INSERT INTO public.conservation_activity_types (name, description, carbon_factor, unit, methodology_reference) VALUES
('Reflorestamento', 'Plantio de mudas nativas em áreas degradadas', 4.5, 'hectares', 'AR-AMS0007'),
('Conservação de Mata Nativa', 'Preservação de florestas existentes contra desmatamento', 6.2, 'hectares', 'REDD+'),
('Restauração de Áreas Degradadas', 'Recuperação de áreas degradadas com espécies nativas', 3.8, 'hectares', 'CDM-AR'),
('Sistemas Agroflorestais', 'Integração de árvores com agricultura sustentável', 2.1, 'hectares', 'VM0017'),
('Conservação de Solo', 'Práticas de conservação e melhoria do solo', 1.5, 'hectares', 'VM0021'),
('Proteção de Nascentes', 'Conservação e restauração de matas ciliares', 3.2, 'hectares', 'VM0010'),
('Manejo Sustentável', 'Práticas de manejo florestal sustentável', 2.8, 'hectares', 'VM0015'),
('Energia Renovável Própria', 'Instalação de sistemas de energia limpa', 850, 'MWh/ano', 'CDM-AM0019');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.conservation_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conservation_activity_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conservation_activities
CREATE POLICY "Users can manage their company conservation activities" 
ON public.conservation_activities 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para activity_monitoring
CREATE POLICY "Users can manage their company activity monitoring" 
ON public.activity_monitoring 
FOR ALL 
USING (company_id = get_user_company_id());

-- Políticas RLS para conservation_activity_types (somente leitura)
CREATE POLICY "All authenticated users can view activity types" 
ON public.conservation_activity_types 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Criar triggers para updated_at
CREATE TRIGGER update_conservation_activities_updated_at
BEFORE UPDATE ON public.conservation_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_monitoring_updated_at
BEFORE UPDATE ON public.activity_monitoring
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular estatísticas do dashboard de compensação
CREATE OR REPLACE FUNCTION public.calculate_conservation_stats(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    total_area NUMERIC := 0;
    total_investment NUMERIC := 0;
    total_carbon_estimate NUMERIC := 0;
    total_carbon_sequestered NUMERIC := 0;
    activities_count INTEGER := 0;
    active_activities_count INTEGER := 0;
BEGIN
    -- Calcular estatísticas das atividades
    SELECT 
        COALESCE(SUM(area_size), 0),
        COALESCE(SUM(investment_amount), 0),
        COALESCE(SUM(carbon_impact_estimate), 0),
        COUNT(*),
        COUNT(CASE WHEN status IN ('Em Andamento', 'Concluída') THEN 1 END)
    INTO total_area, total_investment, total_carbon_estimate, activities_count, active_activities_count
    FROM public.conservation_activities 
    WHERE company_id = p_company_id;
    
    -- Calcular carbono já sequestrado
    SELECT COALESCE(SUM(carbon_sequestered), 0)
    INTO total_carbon_sequestered
    FROM public.activity_monitoring am
    JOIN public.conservation_activities ca ON am.activity_id = ca.id
    WHERE ca.company_id = p_company_id;
    
    result := jsonb_build_object(
        'total_area', total_area,
        'total_investment', total_investment,
        'total_carbon_estimate', total_carbon_estimate,
        'total_carbon_sequestered', total_carbon_sequestered,
        'activities_count', activities_count,
        'active_activities_count', active_activities_count
    );
    
    RETURN result;
END;
$$;