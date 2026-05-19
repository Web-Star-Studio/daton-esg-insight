-- Backfill conservador de organizational_unit_id em 2 NCs da Transportes Gabardo
-- onde a description menciona claramente o nome da filial.
--
-- Inferências aplicadas:
--   NC-20260211-4479 → DUQUE
--     description: "Não evidenciado a Licença de operação da Unidade de Duque
--     de Caxias…"
--   NC-20260212-6847 → CARIACICA
--     description: "…para os colaboradores da Unidade de Cariacica."
--
-- As outras 4 NCs sem unidade (NC-20260212-5299, NC-20260206-0902,
-- NC-20260210-9995 [ambígua: cita 2 filiais], NC-20260212-9975) NÃO recebem
-- backfill — cliente deve preencher manualmente via modal de Edição
-- (PR #94).
--
-- Tabela _audit_nc_unit_backfill_20260519 guarda o estado pré-update para
-- rollback fácil:
--   UPDATE non_conformities SET organizational_unit_id = a.organizational_unit_id_before
--   FROM _audit_nc_unit_backfill_20260519 a WHERE non_conformities.id = a.id;
--
-- Idempotência:
--   - CREATE TABLE IF NOT EXISTS (audit table não duplica)
--   - INSERT ... ON CONFLICT (id) DO NOTHING (audit rows únicas por NC)
--   - UPDATE ... WHERE organizational_unit_id IS NULL (no-op se já preenchido)

SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '9a67e806-6f97-4de8-a0dd-da5a5e8928d9')::text,
  true
);

CREATE TABLE IF NOT EXISTS public._audit_nc_unit_backfill_20260519 (
  id uuid PRIMARY KEY,
  nc_number text,
  title text,
  organizational_unit_id_before uuid,
  organizational_unit_id_after uuid,
  rationale text,
  audit_at timestamptz DEFAULT now()
);

INSERT INTO public._audit_nc_unit_backfill_20260519
  (id, nc_number, title, organizational_unit_id_before, organizational_unit_id_after, rationale)
SELECT
  nc.id,
  nc.nc_number,
  nc.title,
  nc.organizational_unit_id AS organizational_unit_id_before,
  CASE nc.id
    WHEN 'fd3035b5-81e2-45ac-b7fe-d78d486808ec' THEN '01212b39-1ad4-4c00-819b-97e371b72934'::uuid
    WHEN '022566b0-9b84-4507-a670-a72e2a90a73a' THEN 'a142cacb-25ea-4be1-b126-28d483303703'::uuid
  END AS organizational_unit_id_after,
  CASE nc.id
    WHEN 'fd3035b5-81e2-45ac-b7fe-d78d486808ec'
      THEN 'description menciona "Licença de operação da Unidade de Duque de Caxias" → branch code DUQUE'
    WHEN '022566b0-9b84-4507-a670-a72e2a90a73a'
      THEN 'description menciona "Unidade de Cariacica" → branch code CARIACICA'
  END AS rationale
FROM public.non_conformities nc
WHERE nc.id IN (
  'fd3035b5-81e2-45ac-b7fe-d78d486808ec',
  '022566b0-9b84-4507-a670-a72e2a90a73a'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.non_conformities
SET organizational_unit_id = '01212b39-1ad4-4c00-819b-97e371b72934'::uuid,
    updated_at = now()
WHERE id = 'fd3035b5-81e2-45ac-b7fe-d78d486808ec'
  AND organizational_unit_id IS NULL;

UPDATE public.non_conformities
SET organizational_unit_id = 'a142cacb-25ea-4be1-b126-28d483303703'::uuid,
    updated_at = now()
WHERE id = '022566b0-9b84-4507-a670-a72e2a90a73a'
  AND organizational_unit_id IS NULL;

COMMENT ON TABLE public._audit_nc_unit_backfill_20260519 IS
  'Backfill conservador (2026-05-19) de organizational_unit_id em NCs da Transportes Gabardo (021647af-...) cuja description mencionava a filial. Rollback: UPDATE non_conformities SET organizational_unit_id = a.organizational_unit_id_before FROM _audit_nc_unit_backfill_20260519 a WHERE non_conformities.id = a.id;';
