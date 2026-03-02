-- Regulatory document control enhancements (reusing licensing domain)

-- 1) New renewal status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'license_renewal_status_enum'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.license_renewal_status_enum AS ENUM (
      'nao_iniciado',
      'em_andamento',
      'protocolado',
      'renovado',
      'indeferido'
    );
  END IF;
END $$;

-- 2) Extend licenses with regulatory fields
ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS branch_id UUID,
  ADD COLUMN IF NOT EXISTS document_identifier_type TEXT,
  ADD COLUMN IF NOT EXISTS document_identifier_other TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS renewal_required BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_alert_days INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'licenses_branch_id_fkey'
  ) THEN
    ALTER TABLE public.licenses
      ADD CONSTRAINT licenses_branch_id_fkey
      FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_licenses_branch_id ON public.licenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_licenses_document_identifier_type ON public.licenses(document_identifier_type);

-- 3) Extend renewal schedules
ALTER TABLE public.license_renewal_schedules
  ADD COLUMN IF NOT EXISTS protocol_number TEXT,
  ADD COLUMN IF NOT EXISTS renewed_expiration_date DATE;

-- Convert legacy text statuses to new enum statuses.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'license_renewal_schedules'
      AND column_name = 'status'
      AND udt_name <> 'license_renewal_status_enum'
  ) THEN
    ALTER TABLE public.license_renewal_schedules
      ADD COLUMN status_new public.license_renewal_status_enum;

    UPDATE public.license_renewal_schedules
    SET status_new = CASE status
      WHEN 'scheduled' THEN 'nao_iniciado'::public.license_renewal_status_enum
      WHEN 'in_progress' THEN 'em_andamento'::public.license_renewal_status_enum
      WHEN 'completed' THEN 'renovado'::public.license_renewal_status_enum
      WHEN 'cancelled' THEN 'indeferido'::public.license_renewal_status_enum
      WHEN 'nao_iniciado' THEN 'nao_iniciado'::public.license_renewal_status_enum
      WHEN 'em_andamento' THEN 'em_andamento'::public.license_renewal_status_enum
      WHEN 'protocolado' THEN 'protocolado'::public.license_renewal_status_enum
      WHEN 'renovado' THEN 'renovado'::public.license_renewal_status_enum
      WHEN 'indeferido' THEN 'indeferido'::public.license_renewal_status_enum
      ELSE 'nao_iniciado'::public.license_renewal_status_enum
    END;

    ALTER TABLE public.license_renewal_schedules
      ALTER COLUMN status_new SET DEFAULT 'nao_iniciado'::public.license_renewal_status_enum;

    ALTER TABLE public.license_renewal_schedules
      ALTER COLUMN status_new SET NOT NULL;

    ALTER TABLE public.license_renewal_schedules DROP COLUMN status;
    ALTER TABLE public.license_renewal_schedules RENAME COLUMN status_new TO status;
  END IF;
END $$;

-- Ensure default when column already migrated.
ALTER TABLE public.license_renewal_schedules
  ALTER COLUMN status SET DEFAULT 'nao_iniciado'::public.license_renewal_status_enum;

-- 4) Settings table for global expiring threshold per company
CREATE TABLE IF NOT EXISTS public.regulatory_document_settings (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  default_expiring_days INTEGER NOT NULL DEFAULT 30 CHECK (default_expiring_days >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_document_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'regulatory_document_settings'
      AND policyname = 'Users can manage their company regulatory settings'
  ) THEN
    CREATE POLICY "Users can manage their company regulatory settings"
    ON public.regulatory_document_settings
    FOR ALL
    USING (company_id = get_user_company_id())
    WITH CHECK (company_id = get_user_company_id());
  END IF;
END $$;

INSERT INTO public.regulatory_document_settings (company_id)
SELECT id
FROM public.companies
ON CONFLICT (company_id) DO NOTHING;
