CREATE TABLE IF NOT EXISTS public._export_csv_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_key text NOT NULL,
  chunk_index int NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public._export_csv_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_export" ON public._export_csv_chunks FOR SELECT USING (true);

INSERT INTO public._export_csv_chunks (export_key, chunk_index, content)
SELECT 'gabardo_pos_reimport', g.idx, public.gabardo_federal_csv_chunk(((g.idx-1)*30000)+1, 30000)
FROM generate_series(1,9) AS g(idx);