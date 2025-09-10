-- Limpeza de Fatores Duplicados e Preparação para Recálculo
-- Remove fatores duplicados e inconsistentes identificados

-- 1. LIMPAR DUPLICATAS DE GASOLINA COMUM
-- Manter apenas a versão corrigida para Combustão Móvel
DELETE FROM emission_factors 
WHERE name = 'Gasolina Comum' 
AND (co2_factor > 2000 OR category = 'Combustão Estacionária');

-- 2. LIMPAR DUPLICATAS DE ETANOL HIDRATADO  
-- Manter apenas a versão corrigida para Combustão Móvel
DELETE FROM emission_factors 
WHERE name = 'Etanol Hidratado' 
AND activity_unit = 'Litro' 
AND category != 'Combustão Móvel';

-- 3. FORÇAR RECÁLCULO COMPLETO
-- Marcar todas as emissões calculadas para recálculo
UPDATE calculated_emissions 
SET details_json = COALESCE(details_json, '{}'::jsonb) || '{"needs_recalculation": true, "reason": "emergency_correction_applied"}'::jsonb;