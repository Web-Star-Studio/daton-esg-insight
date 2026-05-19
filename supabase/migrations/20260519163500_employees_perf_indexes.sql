-- Performance indexes for public.employees.
--
-- Diagnóstico: pg_stat_statements em 2026-05-19 mostrou que esta tabela
-- (apenas 4.119 rows) acumulou ~39.000 segundos de CPU em 31 queries
-- distintas, contribuindo para a saturação do Postgres que travou o auth
-- (GoTrue) no mesmo dia. Top queries (antes destes índices):
--   - WHERE status=$1 LIMIT             →  6773 calls, mean 733ms (Seq Scan)
--   - ORDER BY full_name ASC LIMIT      →  6059 calls, mean 570ms
--   - WHERE full_name ILIKE OR cpf ILIKE→  4641 calls, mean 677ms (Seq Scan)
--   - WHERE company_id=$1 ORDER BY created_at → 65041 calls, mean 98ms
--   - WHERE status=$1 AND created_at<=$2→  4850 calls, mean 236ms
--
-- Validação pós-índice (EXPLAIN ANALYZE com company_id real, 2075 rows):
--   - status + ORDER BY full_name LIMIT  → 0.27 ms  (Index Scan)
--   - ORDER BY full_name LIMIT           → 0.24 ms  (Index Scan)
--   - ILIKE composto                     → 0.77 ms  (Index Scan + filter)
--   - ORDER BY created_at DESC LIMIT 1   → 0.15 ms  (Index Scan)
--
-- Como employees tem RLS por company_id (policy filtra sempre), índices
-- compostos prefixados por company_id servem tanto pro filtro de tenant
-- quanto pro filtro adicional, deixando o planner usar Index Scan.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Cobre: WHERE status='X' (e qualquer filtro adicional por company)
CREATE INDEX IF NOT EXISTS idx_employees_company_status
  ON public.employees (company_id, status);

-- Cobre: WHERE company_id=X ORDER BY created_at DESC (auto employee_code etc.)
CREATE INDEX IF NOT EXISTS idx_employees_company_created_at
  ON public.employees (company_id, created_at DESC);

-- Cobre: ORDER BY full_name ASC (paginação default da tabela)
CREATE INDEX IF NOT EXISTS idx_employees_company_full_name
  ON public.employees (company_id, full_name);

-- Cobre: WHERE full_name ILIKE '%x%'  (busca por nome)
CREATE INDEX IF NOT EXISTS idx_employees_full_name_trgm
  ON public.employees USING gin (full_name gin_trgm_ops);

-- Cobre: WHERE cpf ILIKE '%x%' (busca por CPF parcial)
CREATE INDEX IF NOT EXISTS idx_employees_cpf_trgm
  ON public.employees USING gin (cpf gin_trgm_ops);
