-- Limpar fatores duplicados e manter apenas os mais recentes e corretos

-- 1. Remover fatores duplicados de Gás Natural (manter apenas o GHG Protocol Brasil 2025.0.1)
DELETE FROM public.emission_factors 
WHERE name = 'Gás Natural' 
AND source != 'GHG Protocol Brasil 2025.0.1' 
AND type = 'system';

-- 2. Remover duplicatas exatas baseadas em nome, categoria e fonte
WITH duplicated_factors AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY name, category, source, activity_unit 
           ORDER BY year_of_validity DESC NULLS LAST, created_at DESC
         ) as rn
  FROM public.emission_factors
  WHERE type = 'system'
)
DELETE FROM public.emission_factors 
WHERE id IN (
  SELECT id FROM duplicated_factors WHERE rn > 1
);

-- 3. Atualizar fatores antigos para usar a fonte padrão mais recente
UPDATE public.emission_factors 
SET 
  source = 'GHG Protocol Brasil 2025.0.1',
  year_of_validity = 2025
WHERE type = 'system' 
AND year_of_validity < 2025 
AND source ILIKE '%MCTI%';

-- 4. Padronizar unidades inconsistentes
UPDATE public.emission_factors 
SET activity_unit = 'litros'
WHERE activity_unit IN ('Litro', 'L', 'l') 
AND type = 'system';

-- 5. Remover fatores muito antigos e obsoletos (anteriores a 2020)
DELETE FROM public.emission_factors 
WHERE type = 'system' 
AND year_of_validity < 2020;

-- 6. Atualizar fatores para ter valores corretos de CH4 e N2O (não zero para todos)
UPDATE public.emission_factors 
SET 
  ch4_factor = CASE 
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Gasoso' THEN 0.0010
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Líquido' THEN 0.0030  
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Sólido' THEN 0.3000
    WHEN category = 'Combustão Móvel' THEN 0.0050
    ELSE ch4_factor
  END,
  n2o_factor = CASE 
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Gasoso' THEN 0.0001
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Líquido' THEN 0.0006
    WHEN category = 'Combustão Estacionária' AND fuel_type = 'Sólido' THEN 0.0040  
    WHEN category = 'Combustão Móvel' THEN 0.0080
    ELSE n2o_factor
  END
WHERE type = 'system' 
AND source = 'GHG Protocol Brasil 2025.0.1';