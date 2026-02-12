
-- Create platform_module_settings table
CREATE TABLE public.platform_module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  enabled_live boolean NOT NULL DEFAULT false,
  enabled_demo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_user_id uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.platform_module_settings ENABLE ROW LEVEL SECURITY;

-- RLS: all authenticated users can read (needed for sidebar filtering)
CREATE POLICY "Authenticated users can read module settings"
ON public.platform_module_settings
FOR SELECT
TO authenticated
USING (true);

-- RLS: only platform_admins can modify
CREATE POLICY "Platform admins can update module settings"
ON public.platform_module_settings
FOR UPDATE
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can insert module settings"
ON public.platform_module_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete module settings"
ON public.platform_module_settings
FOR DELETE
TO authenticated
USING (public.is_platform_admin());

-- Seed with current module values
INSERT INTO public.platform_module_settings (module_key, module_name, enabled_live, enabled_demo) VALUES
  ('financial', 'Financeiro', false, true),
  ('dataReports', 'Dados e Relatórios', false, true),
  ('esgEnvironmental', 'ESG Ambiental', true, true),
  ('esgGovernance', 'ESG Governança', false, true),
  ('esgSocial', 'ESG Social', true, true),
  ('quality', 'Qualidade (SGQ)', true, true),
  ('suppliers', 'Fornecedores', true, true),
  ('settings', 'Configurações', true, true),
  ('help', 'Ajuda e Suporte', true, true),
  ('esgManagement', 'Gestão ESG', true, true);
