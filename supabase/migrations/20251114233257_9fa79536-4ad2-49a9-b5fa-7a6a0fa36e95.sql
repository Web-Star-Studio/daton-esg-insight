-- Corrigir previews de resíduos classificados incorretamente como suppliers
-- Esta migração detecta e corrige extracted_data_preview que foram classificados
-- como suppliers mas contêm dados de resíduos

UPDATE extracted_data_preview
SET target_table = 'waste_logs'
WHERE 
  target_table = 'suppliers'
  AND validation_status = 'Pendente'
  AND (
    extracted_fields::text LIKE '%residuos_por_mes%'
    OR extracted_fields::text LIKE '%tipos_residuos%'
    OR extracted_fields::text LIKE '%mtr_%'
    OR extracted_fields::text LIKE '%waste_%'
  );

-- Log da correção
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Correção aplicada: % previews de resíduos reclassificados de suppliers → waste_logs', affected_count;
END $$;