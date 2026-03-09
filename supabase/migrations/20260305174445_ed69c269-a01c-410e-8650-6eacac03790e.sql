ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS external_source_provider TEXT,
ADD COLUMN IF NOT EXISTS external_source_reference TEXT,
ADD COLUMN IF NOT EXISTS external_source_url TEXT,
ADD COLUMN IF NOT EXISTS external_last_sync_at TIMESTAMPTZ;