-- Migração: Normalizar valores de confiança de 0-100 para 0-1
-- Atualizar registros que têm confidence > 1 (escala 0-100) para escala 0-1

UPDATE extracted_data_preview
SET confidence_scores = jsonb_set(
  jsonb_set(
    confidence_scores,
    '{overall}',
    to_jsonb(
      CASE 
        WHEN (confidence_scores->>'overall')::numeric > 1 
        THEN (confidence_scores->>'overall')::numeric / 100
        ELSE (confidence_scores->>'overall')::numeric
      END
    )
  ),
  '{esg_relevance}',
  to_jsonb(
    CASE 
      WHEN (confidence_scores->>'esg_relevance')::numeric > 1 
      THEN (confidence_scores->>'esg_relevance')::numeric / 100
      ELSE (confidence_scores->>'esg_relevance')::numeric
    END
  )
)
WHERE 
  validation_status = 'Pendente'
  AND (
    (confidence_scores->>'overall')::numeric > 1
    OR (confidence_scores->>'esg_relevance')::numeric > 1
  );