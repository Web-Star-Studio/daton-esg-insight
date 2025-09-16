-- Criar tabela para fatores de conversão de unidades
CREATE TABLE public.conversion_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  conversion_factor NUMERIC NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'GHG Protocol Brasil 2025.0.1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_unit, to_unit, category)
);

-- Criar tabela para gases refrigerantes fugitivos
CREATE TABLE public.refrigerant_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refrigerant_code TEXT NOT NULL UNIQUE,
  chemical_name TEXT NOT NULL,
  chemical_formula TEXT,
  gwp_ar6 NUMERIC NOT NULL,
  gwp_ar5 NUMERIC,
  gwp_ar4 NUMERIC,
  category TEXT NOT NULL DEFAULT 'Emissões Fugitivas',
  source TEXT NOT NULL DEFAULT 'GHG Protocol Brasil 2025.0.1',
  is_kyoto_gas BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para fatores de aeroportos
CREATE TABLE public.airport_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airport_code TEXT NOT NULL,
  airport_name TEXT NOT NULL,
  factor_type TEXT NOT NULL, -- 'LTO', 'cruise', etc.
  aircraft_category TEXT NOT NULL,
  fuel_consumption_factor NUMERIC,
  co2_factor NUMERIC,
  ch4_factor NUMERIC,
  n2o_factor NUMERIC,
  unit TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'GHG Protocol Brasil 2025.0.1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expandir tabela variable_factors para incluir mais dados históricos
-- Adicionar índices para melhor performance
CREATE INDEX idx_variable_factors_year_month ON public.variable_factors (year, month);
CREATE INDEX idx_conversion_factors_category ON public.conversion_factors (category);
CREATE INDEX idx_refrigerant_factors_category ON public.refrigerant_factors (category);
CREATE INDEX idx_airport_factors_type ON public.airport_factors (factor_type);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.conversion_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refrigerant_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airport_factors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversion_factors (leitura pública, escrita restrita)
CREATE POLICY "All authenticated users can view conversion factors" 
ON public.conversion_factors 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert conversion factors" 
ON public.conversion_factors 
FOR INSERT 
WITH CHECK (true);

-- Políticas RLS para refrigerant_factors (leitura pública, escrita restrita)
CREATE POLICY "All authenticated users can view refrigerant factors" 
ON public.refrigerant_factors 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert refrigerant factors" 
ON public.refrigerant_factors 
FOR INSERT 
WITH CHECK (true);

-- Políticas RLS para airport_factors (leitura pública, escrita restrita)
CREATE POLICY "All authenticated users can view airport factors" 
ON public.airport_factors 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert airport factors" 
ON public.airport_factors 
FOR INSERT 
WITH CHECK (true);

-- Função para buscar fator de conversão
CREATE OR REPLACE FUNCTION public.get_conversion_factor(
  p_from_unit TEXT,
  p_to_unit TEXT,
  p_category TEXT DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  factor NUMERIC;
BEGIN
  SELECT conversion_factor INTO factor
  FROM public.conversion_factors
  WHERE from_unit = p_from_unit 
    AND to_unit = p_to_unit
    AND (p_category IS NULL OR category = p_category)
  LIMIT 1;
  
  RETURN COALESCE(factor, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;