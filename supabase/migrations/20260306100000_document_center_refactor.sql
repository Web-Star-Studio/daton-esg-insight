-- Unified document center refactor

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS document_kind TEXT,
  ADD COLUMN IF NOT EXISTS document_domain TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT;

UPDATE public.documents
SET title = COALESCE(NULLIF(BTRIM(title), ''), file_name)
WHERE title IS NULL OR BTRIM(title) = '';

UPDATE public.documents
SET document_kind = CASE
  WHEN related_model = 'quality_document'
    OR controlled_copy = true
    OR master_list_included = true
  THEN 'controlled'
  ELSE 'general'
END
WHERE document_kind IS NULL;

UPDATE public.documents
SET document_domain = CASE
  WHEN related_model IN ('quality_document', 'document', 'documents') THEN 'quality'
  WHEN related_model IN ('license', 'licenses') THEN 'regulatory'
  WHEN related_model IN ('waste_log', 'mtr_document') THEN 'waste'
  WHEN related_model IN ('training_document', 'training_documents') THEN 'training'
  WHEN related_model IN ('employee_document', 'employee_documents') THEN 'people'
  ELSE COALESCE(NULLIF(related_model, ''), 'general')
END
WHERE document_domain IS NULL;

UPDATE public.documents
SET status = CASE
  WHEN approval_status = 'obsoleto' THEN 'archived'
  WHEN approval_status = 'aprovado' THEN 'active'
  WHEN approval_status = 'rejeitado' THEN 'rejected'
  WHEN approval_status = 'em_aprovacao' THEN 'in_review'
  ELSE 'draft'
END
WHERE status IS NULL;

ALTER TABLE public.documents
  ALTER COLUMN title SET DEFAULT '',
  ALTER COLUMN document_kind SET DEFAULT 'general',
  ALTER COLUMN document_domain SET DEFAULT 'general',
  ALTER COLUMN status SET DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_document_kind_chk'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_document_kind_chk
      CHECK (document_kind IN ('general', 'controlled'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_status_chk'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_status_chk
      CHECK (status IN ('draft', 'active', 'in_review', 'rejected', 'archived'))
      NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.document_control_profiles (
  document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  code TEXT,
  document_type_label TEXT NOT NULL DEFAULT 'Documento controlado',
  norm_reference TEXT,
  issuer_name TEXT,
  confidentiality_level TEXT NOT NULL DEFAULT 'public',
  validity_start_date DATE,
  validity_end_date DATE,
  review_due_date DATE,
  responsible_department TEXT,
  controlled_copy BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_read_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_read_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.document_read_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  confirmation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,
  requester_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  requested_from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  fulfilled_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  fulfilled_version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  notes TEXT,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, relation_type),
  CONSTRAINT document_relations_no_self_link_chk CHECK (source_document_id <> target_document_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_change_log_change_type_chk'
  ) THEN
    ALTER TABLE public.document_change_log
      ADD CONSTRAINT document_change_log_change_type_chk
      CHECK (change_type IN ('metadata_update', 'status_change', 'relation_change', 'read_campaign_change', 'request_fulfilled'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_read_campaigns_status_chk'
  ) THEN
    ALTER TABLE public.document_read_campaigns
      ADD CONSTRAINT document_read_campaigns_status_chk
      CHECK (status IN ('active', 'completed', 'cancelled'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_read_recipients_status_chk'
  ) THEN
    ALTER TABLE public.document_read_recipients
      ADD CONSTRAINT document_read_recipients_status_chk
      CHECK (status IN ('pending', 'viewed', 'confirmed', 'overdue', 'cancelled'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_requests_request_type_chk'
  ) THEN
    ALTER TABLE public.document_requests
      ADD CONSTRAINT document_requests_request_type_chk
      CHECK (request_type IN ('new_document', 'new_version', 'complement'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_requests_priority_chk'
  ) THEN
    ALTER TABLE public.document_requests
      ADD CONSTRAINT document_requests_priority_chk
      CHECK (priority IN ('low', 'medium', 'high'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_requests_status_chk'
  ) THEN
    ALTER TABLE public.document_requests
      ADD CONSTRAINT document_requests_status_chk
      CHECK (status IN ('open', 'in_progress', 'fulfilled', 'cancelled', 'overdue'))
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_relations_relation_type_chk'
  ) THEN
    ALTER TABLE public.document_relations
      ADD CONSTRAINT document_relations_relation_type_chk
      CHECK (relation_type IN ('references', 'complements', 'replaces', 'depends_on'))
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.document_control_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_read_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_read_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage control profiles from their company" ON public.document_control_profiles;
CREATE POLICY "Users can manage control profiles from their company"
ON public.document_control_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = document_control_profiles.document_id
      AND d.company_id = public.get_user_company_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = document_control_profiles.document_id
      AND d.company_id = public.get_user_company_id()
  )
);

DROP POLICY IF EXISTS "Users can manage document change log from their company" ON public.document_change_log;
CREATE POLICY "Users can manage document change log from their company"
ON public.document_change_log
FOR ALL
USING (company_id = public.get_user_company_id())
WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can manage document read campaigns from their company" ON public.document_read_campaigns;
CREATE POLICY "Users can manage document read campaigns from their company"
ON public.document_read_campaigns
FOR ALL
USING (company_id = public.get_user_company_id())
WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can manage document read recipients from their company" ON public.document_read_recipients;
CREATE POLICY "Users can manage document read recipients from their company"
ON public.document_read_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.document_read_campaigns rc
    WHERE rc.id = document_read_recipients.campaign_id
      AND rc.company_id = public.get_user_company_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.document_read_campaigns rc
    WHERE rc.id = document_read_recipients.campaign_id
      AND rc.company_id = public.get_user_company_id()
  )
);

DROP POLICY IF EXISTS "Users can manage document requests from their company" ON public.document_requests;
CREATE POLICY "Users can manage document requests from their company"
ON public.document_requests
FOR ALL
USING (company_id = public.get_user_company_id())
WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can manage document relations from their company" ON public.document_relations;
CREATE POLICY "Users can manage document relations from their company"
ON public.document_relations
FOR ALL
USING (company_id = public.get_user_company_id())
WITH CHECK (company_id = public.get_user_company_id());

CREATE INDEX IF NOT EXISTS idx_documents_document_kind ON public.documents(document_kind);
CREATE INDEX IF NOT EXISTS idx_documents_document_domain ON public.documents(document_domain);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_document_change_log_document_id ON public.document_change_log(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_read_campaigns_document_id ON public.document_read_campaigns(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_read_recipients_campaign_status ON public.document_read_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_document_requests_company_status ON public.document_requests(company_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_document_relations_source ON public.document_relations(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relations_target ON public.document_relations(target_document_id);

CREATE TRIGGER update_document_control_profiles_updated_at
  BEFORE UPDATE ON public.document_control_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_read_campaigns_updated_at
  BEFORE UPDATE ON public.document_read_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_read_recipients_updated_at
  BEFORE UPDATE ON public.document_read_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_requests_updated_at
  BEFORE UPDATE ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.document_control_profiles (
  document_id,
  code,
  document_type_label,
  validity_start_date,
  validity_end_date,
  review_due_date,
  responsible_department,
  controlled_copy
)
SELECT
  d.id,
  COALESCE(NULLIF(BTRIM(d.code), ''), ml.code),
  COALESCE(NULLIF(BTRIM(d.ai_extracted_category), ''), NULLIF(BTRIM(d.document_type::text), ''), ml.title, 'Documento controlado'),
  COALESCE(d.effective_date, ml.effective_date),
  NULL,
  COALESCE(d.next_review_date, ml.review_date),
  COALESCE(NULLIF(BTRIM(d.responsible_department), ''), NULLIF(BTRIM(ml.responsible_department), '')),
  COALESCE(d.controlled_copy, false)
FROM public.documents d
LEFT JOIN public.document_master_list ml
  ON ml.document_id = d.id
WHERE d.document_kind = 'controlled'
  AND NOT EXISTS (
    SELECT 1
    FROM public.document_control_profiles cp
    WHERE cp.document_id = d.id
  );

CREATE OR REPLACE FUNCTION public.sync_document_master_list_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.document_master_list
  SET
    version = NEW.version_number::text,
    updated_at = now()
  WHERE document_id = NEW.document_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_document_master_list_version ON public.document_versions;
CREATE TRIGGER trg_sync_document_master_list_version
  AFTER INSERT ON public.document_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_document_master_list_version();

UPDATE public.document_master_list ml
SET version = dv.version_number::text
FROM public.document_versions dv
WHERE dv.document_id = ml.document_id
  AND dv.is_current = true;

CREATE OR REPLACE FUNCTION public.create_document_version()
RETURNS TRIGGER AS $$
DECLARE
  version_actor UUID;
BEGIN
  version_actor := COALESCE(auth.uid(), NEW.uploader_user_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.document_versions (
      document_id,
      version_number,
      title,
      file_path,
      file_size,
      changes_summary,
      created_by_user_id,
      is_current
    ) VALUES (
      NEW.id,
      1,
      COALESCE(NULLIF(BTRIM(NEW.title), ''), NEW.file_name),
      NEW.file_path,
      NEW.file_size,
      'Emissão inicial',
      version_actor,
      true
    );

    INSERT INTO public.document_audit_trail (
      document_id,
      action,
      user_id,
      new_values
    ) VALUES (
      NEW.id,
      'CREATE',
      version_actor,
      to_jsonb(NEW)
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (
    OLD.file_path IS DISTINCT FROM NEW.file_path
    OR OLD.file_size IS DISTINCT FROM NEW.file_size
    OR OLD.file_name IS DISTINCT FROM NEW.file_name
  ) THEN
    INSERT INTO public.document_versions (
      document_id,
      title,
      file_path,
      file_size,
      changes_summary,
      created_by_user_id
    ) VALUES (
      NEW.id,
      COALESCE(NULLIF(BTRIM(NEW.title), ''), NEW.file_name),
      NEW.file_path,
      NEW.file_size,
      'Atualização de arquivo',
      version_actor
    );

    INSERT INTO public.document_audit_trail (
      document_id,
      action,
      user_id,
      old_values,
      new_values
    ) VALUES (
      NEW.id,
      'UPDATE',
      version_actor,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_document_center_document_update()
RETURNS TRIGGER AS $$
DECLARE
  change_type_value TEXT;
  diff_payload JSONB;
BEGIN
  IF (
    OLD.title IS DISTINCT FROM NEW.title
    OR OLD.document_kind IS DISTINCT FROM NEW.document_kind
    OR OLD.document_domain IS DISTINCT FROM NEW.document_domain
    OR OLD.status IS DISTINCT FROM NEW.status
    OR OLD.summary IS DISTINCT FROM NEW.summary
  ) THEN
    change_type_value := CASE
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_change'
      ELSE 'metadata_update'
    END;

    diff_payload := jsonb_build_object(
      'old', jsonb_build_object(
        'title', OLD.title,
        'document_kind', OLD.document_kind,
        'document_domain', OLD.document_domain,
        'status', OLD.status,
        'summary', OLD.summary
      ),
      'new', jsonb_build_object(
        'title', NEW.title,
        'document_kind', NEW.document_kind,
        'document_domain', NEW.document_domain,
        'status', NEW.status,
        'summary', NEW.summary
      )
    );

    INSERT INTO public.document_change_log (
      company_id,
      document_id,
      change_type,
      summary,
      diff,
      created_by_user_id
    ) VALUES (
      NEW.company_id,
      NEW.id,
      change_type_value,
      CASE
        WHEN change_type_value = 'status_change' THEN 'Status documental atualizado'
        ELSE 'Metadados do documento atualizados'
      END,
      diff_payload,
      COALESCE(auth.uid(), NEW.uploader_user_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_document_center_document_update ON public.documents;
CREATE TRIGGER trg_log_document_center_document_update
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  WHEN (
    OLD.file_path IS NOT DISTINCT FROM NEW.file_path
    AND OLD.file_size IS NOT DISTINCT FROM NEW.file_size
    AND OLD.file_name IS NOT DISTINCT FROM NEW.file_name
  )
  EXECUTE FUNCTION public.log_document_center_document_update();

CREATE OR REPLACE FUNCTION public.log_document_control_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  document_company_id UUID;
BEGIN
  SELECT company_id
  INTO document_company_id
  FROM public.documents
  WHERE id = NEW.document_id;

  INSERT INTO public.document_change_log (
    company_id,
    document_id,
    change_type,
    summary,
    diff,
    created_by_user_id
  ) VALUES (
    document_company_id,
    NEW.document_id,
    'metadata_update',
    'Cabeçalho SGQ atualizado',
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
    COALESCE(auth.uid(), (
      SELECT uploader_user_id
      FROM public.documents
      WHERE id = NEW.document_id
    ))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_document_control_profile_update ON public.document_control_profiles;
CREATE TRIGGER trg_log_document_control_profile_update
  AFTER UPDATE ON public.document_control_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_control_profile_update();
