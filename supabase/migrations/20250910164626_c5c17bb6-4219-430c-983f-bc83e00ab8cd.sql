-- Correções Emergenciais do Motor GEE - Fase 1 (Corrigido)
-- Baseado na análise forense das falhas críticas identificadas

-- 1. CORRIGIR FATOR CRÍTICO DE ELETRICIDADE SIN
-- Valor oficial MCTI 2025: 0.0289 kg CO₂/kWh (atual: 0.0817)
UPDATE emission_factors 
SET co2_factor = 0.0289,
    source = 'MCTI - Fator de Emissão Médio Mensal SIN (2025)'
WHERE name = 'Energia Elétrica - SIN' 
AND category = 'Eletricidade Adquirida';

-- 2. REMOVER FATOR ABSURDO DE ELETRICIDADE (61.7 kg CO/kWh)
DELETE FROM emission_factors 
WHERE name LIKE 'Eletricidade - Sistema Interligado Nacional%'
AND co2_factor = 61.7;

-- 3. CORRIGIR ERROS DE UNIDADE CRÍTICOS
-- Etanol: de 1457 para 1.5 kg CO₂/L
UPDATE emission_factors 
SET co2_factor = 1.5,
    ch4_factor = 0.000095,
    n2o_factor = 0.000084,
    source = 'PB GHG Protocol / ANP (2025) - Corrigido'
WHERE name = 'Etanol Hidratado' 
AND category = 'Combustão Móvel'
AND co2_factor > 100;

-- Diesel Rodoviário: de 2606.2 para 2.6 kg CO₂/L  
UPDATE emission_factors 
SET co2_factor = 2.6,
    ch4_factor = 0.000100,
    n2o_factor = 0.000005,
    source = 'PB GHG Protocol / ANP (2025) - Corrigido'
WHERE name = 'Óleo Diesel Rodoviário (S10)' 
AND category = 'Combustão Móvel'
AND co2_factor > 100;

-- 4. ADICIONAR FATORES ESSENCIAIS FALTANTES PARA O BRASIL
-- Gasolina Comum (se não existir)
INSERT INTO emission_factors (name, category, activity_unit, co2_factor, ch4_factor, n2o_factor, source, year_of_validity, type)
SELECT 'Gasolina Comum', 'Combustão Móvel', 'Litro', 2.27, 0.000095, 0.000084, 'PB GHG Protocol / ANP (2025)', 2025, 'system'
WHERE NOT EXISTS (
    SELECT 1 FROM emission_factors 
    WHERE name = 'Gasolina Comum' AND category = 'Combustão Móvel'
);

-- Gás Natural (se não existir)
INSERT INTO emission_factors (name, category, activity_unit, co2_factor, ch4_factor, n2o_factor, source, year_of_validity, type)
SELECT 'Gás Natural', 'Combustão Estacionária', 'm³', 1.95, 0.000037, 0.000004, 'MCTI (2025)', 2025, 'system'
WHERE NOT EXISTS (
    SELECT 1 FROM emission_factors 
    WHERE name = 'Gás Natural' AND category = 'Combustão Estacionária'
);

-- 5. CORRIGIR INCONSISTÊNCIAS DE CATEGORIAS
-- Padronizar "Fontes Móveis" para "Combustão Móvel"
UPDATE emission_factors 
SET category = 'Combustão Móvel'
WHERE category = 'Fontes Móveis';

-- 6. ADICIONAR METADADOS DE AUDITORIA
-- Adicionar coluna para rastreabilidade (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'emission_factors' 
                   AND column_name = 'validation_status') THEN
        ALTER TABLE emission_factors 
        ADD COLUMN validation_status TEXT DEFAULT 'validated';
    END IF;
END $$;

-- Marcar fatores corrigidos como validados
UPDATE emission_factors 
SET validation_status = 'emergency_corrected'
WHERE name IN ('Energia Elétrica - SIN', 'Etanol Hidratado', 'Óleo Diesel Rodoviário (S10)', 'Gasolina Comum');