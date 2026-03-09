-- ISO 9001:2015 item 4.2 - Matriz de Partes Interessadas (Qualidade)

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'stakeholder_requirement_status_enum'
  ) THEN
    CREATE TYPE public.stakeholder_requirement_status_enum AS ENUM (
      'nao_iniciado',
      'em_atendimento',
      'atendido',
      'bloqueado'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.stakeholder_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  iso_standard TEXT NOT NULL DEFAULT 'ISO_9001',
  iso_clause TEXT NOT NULL DEFAULT '4.2',
  requirement_title TEXT NOT NULL,
  requirement_description TEXT,
  monitoring_method TEXT,
  is_legal_requirement BOOLEAN NOT NULL DEFAULT false,
  is_relevant_to_sgq BOOLEAN NOT NULL DEFAULT true,
  status public.stakeholder_requirement_status_enum NOT NULL DEFAULT 'nao_iniciado',
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  linked_compliance_task_id UUID REFERENCES public.compliance_tasks(id) ON DELETE SET NULL,
  last_checked_at TIMESTAMPTZ,
  review_due_date DATE,
  source_reference TEXT,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stakeholder_requirements_iso_9001_42_only
    CHECK (iso_standard = 'ISO_9001' AND iso_clause = '4.2')
);

CREATE TABLE IF NOT EXISTS public.stakeholder_requirement_evidences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stakeholder_requirement_id UUID NOT NULL REFERENCES public.stakeholder_requirements(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  evidence_url TEXT,
  evidence_note TEXT,
  evidence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  added_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stakeholder_requirement_evidence_payload_required
    CHECK (
      document_id IS NOT NULL OR
      NULLIF(BTRIM(COALESCE(evidence_url, '')), '') IS NOT NULL OR
      NULLIF(BTRIM(COALESCE(evidence_note, '')), '') IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS public.stakeholder_matrix_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  review_date DATE NOT NULL,
  review_summary TEXT NOT NULL,
  management_review_reference TEXT NOT NULL,
  reviewed_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  next_review_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stakeholder_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_requirement_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_matrix_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage stakeholder requirements from their company" ON public.stakeholder_requirements;
CREATE POLICY "Users can manage stakeholder requirements from their company"
  ON public.stakeholder_requirements
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can manage stakeholder requirement evidences from their company" ON public.stakeholder_requirement_evidences;
CREATE POLICY "Users can manage stakeholder requirement evidences from their company"
  ON public.stakeholder_requirement_evidences
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can manage stakeholder matrix reviews from their company" ON public.stakeholder_matrix_reviews;
CREATE POLICY "Users can manage stakeholder matrix reviews from their company"
  ON public.stakeholder_matrix_reviews
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE OR REPLACE FUNCTION public.sync_stakeholder_requirement_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT s.company_id INTO v_company_id
  FROM public.stakeholders s
  WHERE s.id = NEW.stakeholder_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Stakeholder % não encontrado', NEW.stakeholder_id;
  END IF;

  IF NEW.company_id IS NULL THEN
    NEW.company_id := v_company_id;
  ELSIF NEW.company_id <> v_company_id THEN
    RAISE EXCEPTION 'company_id (%) divergente da parte interessada (%)', NEW.company_id, v_company_id;
  END IF;

  IF NEW.review_due_date IS NULL THEN
    NEW.review_due_date := (CURRENT_DATE + INTERVAL '1 year')::DATE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_stakeholder_requirement_company_id_trigger ON public.stakeholder_requirements;
CREATE TRIGGER sync_stakeholder_requirement_company_id_trigger
  BEFORE INSERT OR UPDATE OF stakeholder_id, company_id, review_due_date
  ON public.stakeholder_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stakeholder_requirement_company_id();

CREATE OR REPLACE FUNCTION public.sync_stakeholder_evidence_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT sr.company_id INTO v_company_id
  FROM public.stakeholder_requirements sr
  WHERE sr.id = NEW.stakeholder_requirement_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Requisito de parte interessada % não encontrado', NEW.stakeholder_requirement_id;
  END IF;

  IF NEW.company_id IS NULL THEN
    NEW.company_id := v_company_id;
  ELSIF NEW.company_id <> v_company_id THEN
    RAISE EXCEPTION 'company_id (%) divergente do requisito (%)', NEW.company_id, v_company_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_stakeholder_evidence_company_id_trigger ON public.stakeholder_requirement_evidences;
CREATE TRIGGER sync_stakeholder_evidence_company_id_trigger
  BEFORE INSERT OR UPDATE OF stakeholder_requirement_id, company_id
  ON public.stakeholder_requirement_evidences
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stakeholder_evidence_company_id();

CREATE OR REPLACE FUNCTION public.ensure_stakeholder_requirement_evidence_on_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_document_evidence BOOLEAN;
BEGIN
  IF NEW.status = 'atendido' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, 'nao_iniciado') <> 'atendido') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.stakeholder_requirement_evidences sre
      WHERE sre.stakeholder_requirement_id = NEW.id
        AND sre.document_id IS NOT NULL
    ) INTO v_has_document_evidence;

    IF NOT v_has_document_evidence THEN
      RAISE EXCEPTION 'Não é permitido concluir requisito sem evidência documental vinculada (document_id).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_stakeholder_requirement_evidence_on_closure_trigger ON public.stakeholder_requirements;
CREATE TRIGGER ensure_stakeholder_requirement_evidence_on_closure_trigger
  BEFORE INSERT OR UPDATE OF status
  ON public.stakeholder_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_stakeholder_requirement_evidence_on_closure();

CREATE OR REPLACE FUNCTION public.set_stakeholder_matrix_review_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.get_user_company_id();
  END IF;

  IF NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'company_id é obrigatório para revisão da matriz de partes interessadas';
  END IF;

  IF NEW.next_review_due_date IS NULL THEN
    NEW.next_review_due_date := (NEW.review_date + INTERVAL '1 year')::DATE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_stakeholder_matrix_review_defaults_trigger ON public.stakeholder_matrix_reviews;
CREATE TRIGGER set_stakeholder_matrix_review_defaults_trigger
  BEFORE INSERT OR UPDATE OF company_id, review_date, next_review_due_date
  ON public.stakeholder_matrix_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stakeholder_matrix_review_defaults();

CREATE OR REPLACE FUNCTION public.sync_stakeholder_requirement_due_date_from_matrix_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.stakeholder_requirements
  SET
    review_due_date = NEW.next_review_due_date,
    updated_at = now()
  WHERE company_id = NEW.company_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_stakeholder_requirement_due_date_from_matrix_review_trigger ON public.stakeholder_matrix_reviews;
CREATE TRIGGER sync_stakeholder_requirement_due_date_from_matrix_review_trigger
  AFTER INSERT
  ON public.stakeholder_matrix_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stakeholder_requirement_due_date_from_matrix_review();

DROP TRIGGER IF EXISTS update_stakeholder_requirements_updated_at ON public.stakeholder_requirements;
CREATE TRIGGER update_stakeholder_requirements_updated_at
  BEFORE UPDATE ON public.stakeholder_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stakeholder_matrix_reviews_updated_at ON public.stakeholder_matrix_reviews;
CREATE TRIGGER update_stakeholder_matrix_reviews_updated_at
  BEFORE UPDATE ON public.stakeholder_matrix_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirements_company_id
  ON public.stakeholder_requirements(company_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirements_stakeholder_id
  ON public.stakeholder_requirements(stakeholder_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirements_status
  ON public.stakeholder_requirements(status);

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirements_review_due_date
  ON public.stakeholder_requirements(review_due_date);

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirements_responsible_user_id
  ON public.stakeholder_requirements(responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_requirement_evidences_requirement_id
  ON public.stakeholder_requirement_evidences(stakeholder_requirement_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_matrix_reviews_company_date
  ON public.stakeholder_matrix_reviews(company_id, review_date DESC);

COMMIT;
