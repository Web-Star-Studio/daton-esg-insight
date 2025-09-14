-- Create uploads bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false) 
ON CONFLICT (id) DO NOTHING;

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  original_name text not null,
  storage_path text not null,
  mime text not null,
  size_bytes int8 not null,
  status text not null check (status in ('uploaded','parsed','extracted','failed')),
  error text,
  created_at timestamptz default now()
);

-- Create extractions table
CREATE TABLE IF NOT EXISTS extractions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade,
  model text not null,
  quality_score numeric,
  raw_json jsonb not null,
  created_at timestamptz default now()
);

-- Create extraction_items_staging table
CREATE TABLE IF NOT EXISTS extraction_items_staging (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid references extractions(id) on delete cascade,
  row_index int,
  field_name text not null,
  extracted_value text,
  source_text text,
  confidence numeric,
  status text not null default 'pending'
);

-- Create extraction_items_curated table
CREATE TABLE IF NOT EXISTS extraction_items_curated (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references files(id) on delete cascade,
  field_name text not null,
  value text not null,
  approved_by uuid not null,
  approved_at timestamptz default now(),
  lineage jsonb
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_items_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_items_curated ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "files_owner_rw" ON files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extractions policies
CREATE POLICY "extractions_owner_r" ON extractions
  FOR SELECT USING (EXISTS (SELECT 1 FROM files f WHERE f.id=file_id AND f.user_id=auth.uid()));

CREATE POLICY "extractions_owner_w" ON extractions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM files f WHERE f.id=file_id AND f.user_id=auth.uid()));

-- Staging policies
CREATE POLICY "staging_owner_rw" ON extraction_items_staging
  FOR ALL USING (
    EXISTS (SELECT 1 FROM extractions e JOIN files f ON f.id=e.file_id
      WHERE e.id=extraction_id AND f.user_id=auth.uid())
  ) WITH CHECK (true);

-- Curated policies
CREATE POLICY "curated_owner_rw" ON extraction_items_curated
  FOR ALL USING (EXISTS (SELECT 1 FROM files f WHERE f.id=file_id AND f.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM files f WHERE f.id=file_id AND f.user_id=auth.uid()));

-- Audit logs policies
CREATE POLICY "audit_owner_r" ON audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "audit_owner_w" ON audit_logs FOR INSERT WITH CHECK (user_id = auth.uid());

-- Storage policies for uploads bucket
CREATE POLICY "uploads_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='uploads' AND owner=auth.uid());

CREATE POLICY "uploads_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id='uploads' AND owner=auth.uid());

CREATE POLICY "uploads_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='uploads' AND owner=auth.uid());