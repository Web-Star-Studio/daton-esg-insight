-- Favoritos individuais de legislações (por usuário).
-- Cada usuário marca/desmarca legislações que quer ver pinadas no topo
-- da listagem em /licenciamento/legislacoes.

CREATE TABLE IF NOT EXISTS public.legislation_favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legislation_id uuid NOT NULL REFERENCES public.legislations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, legislation_id)
);

CREATE INDEX IF NOT EXISTS idx_legislation_favorites_user_company
  ON public.legislation_favorites (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_legislation_favorites_legislation
  ON public.legislation_favorites (legislation_id);

ALTER TABLE public.legislation_favorites ENABLE ROW LEVEL SECURITY;

-- Usuário só vê, insere ou remove seus próprios favoritos.
CREATE POLICY "legislation_favorites_select_own"
  ON public.legislation_favorites
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "legislation_favorites_insert_own"
  ON public.legislation_favorites
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "legislation_favorites_delete_own"
  ON public.legislation_favorites
  FOR DELETE
  USING (user_id = auth.uid());
