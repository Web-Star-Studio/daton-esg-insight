-- Políticas de Storage para o bucket 'reports'
-- Permitir upload (INSERT) por usuários autenticados
CREATE POLICY "auth_can_upload_reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

-- Permitir leitura/assinatura (SELECT) por usuários autenticados
CREATE POLICY "auth_can_read_reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- Políticas para tabela license_report_history
-- Verificar se RLS está habilitado, se não, habilitar
ALTER TABLE public.license_report_history ENABLE ROW LEVEL SECURITY;

-- Permitir inserir histórico da própria empresa
CREATE POLICY "ins_own_company_reports"
ON public.license_report_history
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Permitir visualizar histórico da própria empresa
CREATE POLICY "sel_own_company_reports"
ON public.license_report_history
FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);