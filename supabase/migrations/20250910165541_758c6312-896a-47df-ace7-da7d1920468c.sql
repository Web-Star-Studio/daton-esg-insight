-- CORREÇÕES FINAIS EMERGENCIAIS - Completar Motor GEE
-- Limpeza de duplicatas e adição de fator Gasolina Comum faltante

-- 1. LIMPAR DUPLICATAS DE GASOLINA COMUM
-- Remover versões incorretas antes de adicionar a correta
DELETE FROM emission_factors 
WHERE name = 'Gasolina Comum' 
AND (co2_factor > 2000 OR category != 'Combustão Móvel');

-- 2. ADICIONAR FATOR GASOLINA COMUM CORRETO  
-- Verificar se já existe antes de inserir
INSERT INTO emission_factors (
    name, 
    category, 
    activity_unit,
    co2_factor,
    ch4_factor, 
    n2o_factor,
    source,
    type,
    year_of_validity
) 
SELECT 
    'Gasolina Comum',
    'Combustão Móvel', 
    'Litro',
    2.27,  -- kg CO₂/L
    0.000095,  -- kg CH₄/L  
    0.000084,  -- kg N₂O/L
    'PB GHG Protocol / ANP (2025)',
    'system',
    2025
WHERE NOT EXISTS (
    SELECT 1 FROM emission_factors 
    WHERE name = 'Gasolina Comum' 
    AND category = 'Combustão Móvel' 
    AND activity_unit = 'Litro'
);

-- 3. LIMPAR DUPLICATAS DE ETANOL HIDRATADO
-- Manter apenas a versão com unidade "Litro" na categoria correta
DELETE FROM emission_factors 
WHERE name = 'Etanol Hidratado' 
AND (activity_unit = 'Litros' OR category != 'Combustão Móvel');

-- 4. FORÇAR RECÁLCULO COMPLETO DE TODAS AS EMISSÕES
-- Marcar para recálculo com novos fatores corretos
UPDATE calculated_emissions 
SET details_json = COALESCE(details_json, '{}'::jsonb) || '{"needs_recalculation": true, "reason": "emergency_final_corrections_applied", "timestamp": "' || NOW() || '"}'::jsonb;