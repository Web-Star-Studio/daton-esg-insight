-- ISO 9001:2015 item 4.1 hardening for SWOT governance and traceability

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'swot_treatment_decision_enum'
  ) THEN
    CREATE TYPE public.swot_treatment_decision_enum AS ENUM (
      'nao_classificado',
      'irrelevante',
      'relevante_requer_acoes'
    );
  END IF;
END;
$$;

ALTER TABLE public.swot_analysis
  ADD COLUMN IF NOT EXISTS review_frequency public.review_frequency_enum,
  ADD COLUMN IF NOT EXISTS last_review_date DATE,
  ADD COLUMN IF NOT EXISTS next_review_date DATE;

UPDATE public.swot_analysis
SET review_frequency = 'anual'
WHERE review_frequency IS NULL;

ALTER TABLE public.swot_analysis
  ALTER COLUMN review_frequency SET DEFAULT 'anual',
  ALTER COLUMN review_frequency SET NOT NULL;

ALTER TABLE public.swot_items
  ADD COLUMN IF NOT EXISTS treatment_decision public.swot_treatment_decision_enum,
  ADD COLUMN IF NOT EXISTS linked_action_plan_item_id UUID REFERENCES public.action_plan_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_action_reference TEXT;

UPDATE public.swot_items
SET treatment_decision = 'nao_classificado'
WHERE treatment_decision IS NULL;

ALTER TABLE public.swot_items
  ALTER COLUMN treatment_decision SET DEFAULT 'nao_classificado',
  ALTER COLUMN treatment_decision SET NOT NULL;

ALTER TABLE public.swot_items
  DROP CONSTRAINT IF EXISTS swot_items_relevant_requires_traceability;

ALTER TABLE public.swot_items
  ADD CONSTRAINT swot_items_relevant_requires_traceability
  CHECK (
    treatment_decision <> 'relevante_requer_acoes'
    OR linked_action_plan_item_id IS NOT NULL
    OR NULLIF(BTRIM(external_action_reference), '') IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS public.swot_analysis_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  swot_analysis_id UUID NOT NULL REFERENCES public.swot_analysis(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  review_date DATE NOT NULL,
  review_summary TEXT NOT NULL,
  management_review_reference TEXT NOT NULL,
  reviewed_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT swot_analysis_reviews_unique_revision UNIQUE (swot_analysis_id, revision_number)
);

ALTER TABLE public.swot_analysis_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view SWOT reviews from their company" ON public.swot_analysis_reviews;
CREATE POLICY "Users can view SWOT reviews from their company"
  ON public.swot_analysis_reviews
  FOR SELECT
  USING (company_id = public.get_user_company_id());

DROP POLICY IF EXISTS "Users can insert SWOT reviews for their company" ON public.swot_analysis_reviews;
CREATE POLICY "Users can insert SWOT reviews for their company"
  ON public.swot_analysis_reviews
  FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id());

CREATE OR REPLACE FUNCTION public.calculate_next_review_date_for_frequency(
  p_reference_date DATE,
  p_frequency public.review_frequency_enum
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_reference_date IS NULL THEN
    RETURN NULL;
  END IF;

  CASE p_frequency
    WHEN 'mensal' THEN
      RETURN (p_reference_date + INTERVAL '1 month')::date;
    WHEN 'trimestral' THEN
      RETURN (p_reference_date + INTERVAL '3 months')::date;
    WHEN 'semestral' THEN
      RETURN (p_reference_date + INTERVAL '6 months')::date;
    WHEN 'anual' THEN
      RETURN (p_reference_date + INTERVAL '1 year')::date;
    WHEN 'bienal' THEN
      RETURN (p_reference_date + INTERVAL '2 years')::date;
    ELSE
      RETURN (p_reference_date + INTERVAL '1 year')::date;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_swot_review_revision_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT sa.company_id
  INTO v_company_id
  FROM public.swot_analysis sa
  WHERE sa.id = NEW.swot_analysis_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'SWOT analysis % not found', NEW.swot_analysis_id;
  END IF;

  NEW.company_id := v_company_id;

  IF NEW.revision_number IS NULL OR NEW.revision_number <= 0 THEN
    SELECT COALESCE(MAX(sr.revision_number), 0) + 1
    INTO NEW.revision_number
    FROM public.swot_analysis_reviews sr
    WHERE sr.swot_analysis_id = NEW.swot_analysis_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_swot_review_revision_number_trigger ON public.swot_analysis_reviews;
CREATE TRIGGER set_swot_review_revision_number_trigger
  BEFORE INSERT ON public.swot_analysis_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_swot_review_revision_number();

CREATE OR REPLACE FUNCTION public.update_swot_analysis_dates_from_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_frequency public.review_frequency_enum;
BEGIN
  SELECT review_frequency
  INTO v_frequency
  FROM public.swot_analysis
  WHERE id = NEW.swot_analysis_id;

  UPDATE public.swot_analysis
  SET
    last_review_date = NEW.review_date,
    next_review_date = public.calculate_next_review_date_for_frequency(NEW.review_date, v_frequency)
  WHERE id = NEW.swot_analysis_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_swot_analysis_dates_from_review_trigger ON public.swot_analysis_reviews;
CREATE TRIGGER update_swot_analysis_dates_from_review_trigger
  AFTER INSERT ON public.swot_analysis_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_swot_analysis_dates_from_review();

CREATE OR REPLACE FUNCTION public.sync_swot_next_review_date_on_frequency_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.review_frequency IS DISTINCT FROM OLD.review_frequency
     AND NEW.last_review_date IS NOT NULL THEN
    NEW.next_review_date := public.calculate_next_review_date_for_frequency(
      NEW.last_review_date,
      NEW.review_frequency
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_swot_next_review_date_on_frequency_change_trigger ON public.swot_analysis;
CREATE TRIGGER sync_swot_next_review_date_on_frequency_change_trigger
  BEFORE UPDATE OF review_frequency ON public.swot_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_swot_next_review_date_on_frequency_change();

CREATE INDEX IF NOT EXISTS idx_swot_analysis_review_schedule
  ON public.swot_analysis(company_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_swot_items_treatment_decision
  ON public.swot_items(treatment_decision);

CREATE INDEX IF NOT EXISTS idx_swot_items_linked_action_plan_item_id
  ON public.swot_items(linked_action_plan_item_id);

CREATE INDEX IF NOT EXISTS idx_swot_analysis_reviews_analysis_review_date
  ON public.swot_analysis_reviews(swot_analysis_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_swot_analysis_reviews_company_created
  ON public.swot_analysis_reviews(company_id, created_at DESC);

COMMIT;
