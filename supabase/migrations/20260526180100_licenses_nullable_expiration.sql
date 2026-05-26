-- Permite expiration_date NULL em licenses para suportar Dispensa Ambiental e
-- documentos análogos (Declaração de Atividade Não Constante, Certidão de
-- Atividade Não Sujeita a Licenciamento) que não têm prazo de validade — só
-- precisam de reavaliação quando a atividade ou enquadramento muda.
--
-- O fallback antigo (set expiration_date = today + 365d quando a IA não
-- conseguia extrair) gerava alertas de vencimento falsos para esses
-- documentos. Tornar a coluna anulável e tratar NULL como "sem vencimento"
-- resolve esse cenário sem quebrar licenças tradicionais (LP/LI/LO), que
-- continuam preenchendo o campo normalmente.

ALTER TABLE public.licenses ALTER COLUMN expiration_date DROP NOT NULL;

-- Constraint antiga já tolerava issue_date nulo; estendemos para tolerar
-- expiration_date nulo.
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS check_expiration_after_issue;
ALTER TABLE public.licenses
  ADD CONSTRAINT check_expiration_after_issue
  CHECK (
    issue_date IS NULL
    OR expiration_date IS NULL
    OR expiration_date >= issue_date
  );

-- A função de status precisa interpretar NULL como "permanente / sem prazo".
CREATE OR REPLACE FUNCTION public.calculate_license_status(
  issue_date_param DATE,
  expiration_date_param DATE,
  current_status license_status_enum
)
RETURNS license_status_enum
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF current_status IN ('Em Renovação', 'Suspensa') THEN
    RETURN current_status;
  END IF;

  IF expiration_date_param IS NULL THEN
    RETURN 'Ativa';
  END IF;

  IF expiration_date_param < CURRENT_DATE THEN
    RETURN 'Vencida';
  END IF;

  RETURN 'Ativa';
END;
$$;
