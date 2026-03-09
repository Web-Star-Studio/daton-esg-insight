-- ISO 9001:2015 item 7.5 compliance hardening

-- 1) Enforce meaningful version change summaries for new rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_versions_changes_summary_required'
  ) THEN
    ALTER TABLE public.document_versions
      ADD CONSTRAINT document_versions_changes_summary_required
      CHECK (length(trim(coalesce(changes_summary, ''))) > 0)
      NOT VALID;
  END IF;
END $$;

-- 2) Enforce PSG-DOC code format at DB level for new rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_master_list_code_format_chk'
  ) THEN
    ALTER TABLE public.document_master_list
      ADD CONSTRAINT document_master_list_code_format_chk
      CHECK (
        code ~* '^(PSG-\\d{2,3}|IT-\\d{2}\\.\\d{2}|RG-\\d{2}\\.\\d{2}|MSG-\\d{2}\\.\\d{2}|FPLAN-\\d{3})$'
      )
      NOT VALID;
  END IF;
END $$;

-- 3) Keep exactly one current version for each document and auto-sequence versions
CREATE OR REPLACE FUNCTION public.normalize_document_version_insert()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Serialize version assignment per document to avoid race conditions.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.document_id::text));

  IF NEW.changes_summary IS NULL OR length(trim(NEW.changes_summary)) = 0 THEN
    RAISE EXCEPTION 'changes_summary é obrigatório para criação de versão';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.document_versions
  WHERE document_id = NEW.document_id;

  IF NEW.version_number IS NULL OR NEW.version_number <> next_version THEN
    NEW.version_number := next_version;
  END IF;

  UPDATE public.document_versions
  SET is_current = false
  WHERE document_id = NEW.document_id
    AND is_current = true;

  NEW.is_current := true;
  NEW.changes_summary := trim(NEW.changes_summary);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_normalize_document_version_insert ON public.document_versions;
CREATE TRIGGER trg_normalize_document_version_insert
  BEFORE INSERT ON public.document_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_document_version_insert();

WITH ranked AS (
  SELECT
    id,
    CASE
      WHEN row_number() OVER (
        PARTITION BY document_id
        ORDER BY version_number DESC, created_at DESC, id DESC
      ) = 1 THEN true
      ELSE false
    END AS should_be_current
  FROM public.document_versions
)
UPDATE public.document_versions dv
SET is_current = ranked.should_be_current
FROM ranked
WHERE dv.id = ranked.id;

DO $$
DECLARE
  document_id_attnum SMALLINT;
  version_number_attnum SMALLINT;
BEGIN
  SELECT attnum INTO document_id_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.document_versions'::regclass
    AND attname = 'document_id'
    AND NOT attisdropped;

  SELECT attnum INTO version_number_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.document_versions'::regclass
    AND attname = 'version_number'
    AND NOT attisdropped;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'idx_document_versions_unique_version'
      AND c.relkind = 'i'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.document_versions'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[document_id_attnum, version_number_attnum]::SMALLINT[]
  ) THEN
    CREATE UNIQUE INDEX idx_document_versions_unique_version ON public.document_versions(document_id, version_number);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_versions_single_current
  ON public.document_versions(document_id)
  WHERE is_current = true;

-- 4) Retention helper: never allow cleanup retention below 3 years
CREATE OR REPLACE FUNCTION public.cleanup_document_audit_trail(retention_years INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF retention_years < 3 THEN
    RAISE EXCEPTION 'Retenção mínima para trilha documental é 3 anos';
  END IF;

  DELETE FROM public.document_audit_trail
  WHERE timestamp < now() - make_interval(years => retention_years);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.1) Atomic disposition workflow with audit trail
CREATE OR REPLACE FUNCTION public.apply_document_disposition(
  p_document_id UUID,
  p_action TEXT,
  p_reason TEXT,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_tags TEXT[];
  v_disposition_tag TEXT;
BEGIN
  IF p_action NOT IN ('arquivar', 'destruir') THEN
    RAISE EXCEPTION 'Ação de disposição inválida: %', p_action;
  END IF;

  v_disposition_tag := CASE
    WHEN p_action = 'arquivar' THEN 'disposition:archive'
    ELSE 'disposition:destroy'
  END;

  SELECT COALESCE(tags, ARRAY[]::TEXT[])
  INTO v_tags
  FROM public.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento não encontrado para disposição: %', p_document_id;
  END IF;

  IF NOT (v_disposition_tag = ANY(v_tags)) THEN
    v_tags := array_append(v_tags, v_disposition_tag);
  END IF;

  UPDATE public.documents
  SET
    approval_status = 'obsoleto'::public.approval_status_enum,
    requires_approval = false,
    tags = v_tags
  WHERE id = p_document_id;

  INSERT INTO public.document_audit_trail (
    document_id,
    action,
    user_id,
    details,
    new_values
  ) VALUES (
    p_document_id,
    CASE WHEN p_action = 'arquivar' THEN 'DISPOSITION_ARCHIVE' ELSE 'DISPOSITION_DESTROY' END,
    p_user_id,
    p_reason,
    jsonb_build_object(
      'disposition_action', p_action,
      'reason', p_reason,
      'executed_at', now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5) Lock documents while they are under approval workflow
CREATE OR REPLACE FUNCTION public.prevent_document_changes_while_in_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.approval_status = 'em_aprovacao'::public.approval_status_enum
     AND NEW.approval_status = 'em_aprovacao'::public.approval_status_enum
     AND (
       NEW.file_name IS DISTINCT FROM OLD.file_name
       OR NEW.file_path IS DISTINCT FROM OLD.file_path
       OR NEW.file_size IS DISTINCT FROM OLD.file_size
       OR NEW.file_type IS DISTINCT FROM OLD.file_type
       OR NEW.folder_id IS DISTINCT FROM OLD.folder_id
       OR NEW.tags IS DISTINCT FROM OLD.tags
       OR NEW.related_model IS DISTINCT FROM OLD.related_model
       OR NEW.related_id IS DISTINCT FROM OLD.related_id
       OR NEW.document_type IS DISTINCT FROM OLD.document_type
       OR NEW.controlled_copy IS DISTINCT FROM OLD.controlled_copy
       OR NEW.master_list_included IS DISTINCT FROM OLD.master_list_included
       OR NEW.code IS DISTINCT FROM OLD.code
       OR NEW.responsible_department IS DISTINCT FROM OLD.responsible_department
       OR NEW.distribution_list IS DISTINCT FROM OLD.distribution_list
       OR NEW.effective_date IS DISTINCT FROM OLD.effective_date
       OR NEW.review_frequency IS DISTINCT FROM OLD.review_frequency
       OR NEW.next_review_date IS DISTINCT FROM OLD.next_review_date
       OR NEW.retention_period IS DISTINCT FROM OLD.retention_period
     ) THEN
    RAISE EXCEPTION 'Documento bloqueado para edição durante aprovação';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_document_changes_while_in_approval ON public.documents;
CREATE TRIGGER trg_prevent_document_changes_while_in_approval
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_document_changes_while_in_approval();

-- 6) Equivalent functional integration points for external legal providers (ex: SOGI)
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS external_source_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_source_reference TEXT,
  ADD COLUMN IF NOT EXISTS external_source_url TEXT,
  ADD COLUMN IF NOT EXISTS external_last_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_licenses_external_source_provider
  ON public.licenses(external_source_provider);
