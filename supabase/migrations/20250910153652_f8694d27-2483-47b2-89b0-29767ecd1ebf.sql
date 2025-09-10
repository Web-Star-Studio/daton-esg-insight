-- Parte 1: Corrigir RLS Policy para calculated_emissions (CRÍTICO)
-- A policy atual bloqueia inserções do sistema, precisamos permitir inserção via functions

DROP POLICY IF EXISTS "Users can view calculated emissions from their company" ON public.calculated_emissions;

-- Nova policy que permite inserção via sistema (security definer functions)
CREATE POLICY "Users can view calculated emissions from their company" 
ON public.calculated_emissions 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM (activity_data ad JOIN emission_sources es ON ((ad.emission_source_id = es.id)))
  WHERE ((ad.id = calculated_emissions.activity_data_id) AND (es.company_id = get_user_company_id()))
));

-- Permitir inserção via sistema (para functions que calculam emissões)
CREATE POLICY "System can insert calculated emissions" 
ON public.calculated_emissions 
FOR INSERT 
WITH CHECK (true);

-- Parte 2: Atualizar/inserir fatores de emissão essenciais brasileiros
-- Eletricidade - Sistema Interligado Nacional (SIN) 2025
INSERT INTO public.emission_factors (
  name, category, source, year_of_validity, type, 
  co2_factor, ch4_factor, n2o_factor, activity_unit
) VALUES (
  'Eletricidade - Sistema Interligado Nacional (SIN) 2025',
  'Energia Adquirida',
  'MCTI',
  2025,
  'system',
  61.7,  -- 61.7 gCO2e/kWh (0.0617 kgCO2e/kWh)
  0,     -- Já incluído no fator CO2
  0,     -- Já incluído no fator CO2
  'kWh'
) ON CONFLICT DO NOTHING;

-- Óleo Diesel Rodoviário (S10)
INSERT INTO public.emission_factors (
  name, category, source, year_of_validity, type,
  co2_factor, ch4_factor, n2o_factor, activity_unit
) VALUES (
  'Óleo Diesel Rodoviário (S10)',
  'Combustão Móvel',
  'PB GHG Protocol / ANP',
  2025,
  'system',
  2606.2,  -- gCO2/L
  0.1,     -- gCH4/L
  0.1,     -- gN2O/L
  'Litros'
) ON CONFLICT DO NOTHING;

-- Gás Natural
INSERT INTO public.emission_factors (
  name, category, source, year_of_validity, type,
  co2_factor, ch4_factor, n2o_factor, activity_unit
) VALUES (
  'Gás Natural',
  'Combustão Estacionária', 
  'PB GHG Protocol / IPCC',
  2025,
  'system',
  2020,    -- gCO2/m³
  0.1,     -- gCH4/m³
  0.02,    -- gN2O/m³
  'm³'
) ON CONFLICT DO NOTHING;

-- Gasolina Comum
INSERT INTO public.emission_factors (
  name, category, source, year_of_validity, type,
  co2_factor, ch4_factor, n2o_factor, activity_unit
) VALUES (
  'Gasolina Comum',
  'Combustão Móvel',
  'PB GHG Protocol / ANP', 
  2025,
  'system',
  2268,    -- gCO2/L
  0.1,     -- gCH4/L
  0.1,     -- gN2O/L
  'Litros'
) ON CONFLICT DO NOTHING;

-- Etanol Hidratado
INSERT INTO public.emission_factors (
  name, category, source, year_of_validity, type,
  co2_factor, ch4_factor, n2o_factor, activity_unit
) VALUES (
  'Etanol Hidratado',
  'Combustão Móvel',
  'PB GHG Protocol / ANP',
  2025,
  'system',
  1457,    -- gCO2/L
  0.1,     -- gCH4/L
  0.1,     -- gN2O/L
  'Litros'
) ON CONFLICT DO NOTHING;