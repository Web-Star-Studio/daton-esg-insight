-- Create Assets table with hierarchical structure
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- "Equipamento Estacionário", "Edificação", "Veículo", "Frota"
    location TEXT,
    description TEXT,
    parent_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their company assets
CREATE POLICY "Users can manage their company assets" 
ON public.assets 
FOR ALL 
USING (company_id = get_user_company_id());

-- Add trigger for updated_at
CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add asset_id to existing tables
ALTER TABLE public.emission_sources ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.licenses ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.waste_logs ADD COLUMN asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_assets_company_id ON public.assets(company_id);
CREATE INDEX idx_assets_parent_asset_id ON public.assets(parent_asset_id);
CREATE INDEX idx_emission_sources_asset_id ON public.emission_sources(asset_id);
CREATE INDEX idx_licenses_asset_id ON public.licenses(asset_id);
CREATE INDEX idx_waste_logs_asset_id ON public.waste_logs(asset_id);

-- Insert sample hierarchical data
INSERT INTO public.assets (company_id, name, asset_type, location, description, parent_asset_id)
SELECT 
    c.id,
    'Unidade Industrial de São Paulo',
    'Edificação',
    'São Paulo, SP - Zona Industrial',
    'Principal unidade de produção da empresa',
    NULL
FROM public.companies c
LIMIT 1;

INSERT INTO public.assets (company_id, name, asset_type, location, description, parent_asset_id)
SELECT 
    c.id,
    'Caldeira B-01',
    'Equipamento Estacionário',
    'Prédio de Utilidades - Setor B',
    'Caldeira principal para geração de vapor industrial',
    a.id
FROM public.companies c
CROSS JOIN public.assets a
WHERE a.name = 'Unidade Industrial de São Paulo'
AND c.id = a.company_id
LIMIT 1;

INSERT INTO public.assets (company_id, name, asset_type, location, description, parent_asset_id)
SELECT 
    c.id,
    'Frota de Entrega Leve',
    'Frota',
    'Garagem Central - Unidade SP',
    'Frota de veículos leves para entregas locais',
    a.id
FROM public.companies c
CROSS JOIN public.assets a
WHERE a.name = 'Unidade Industrial de São Paulo'
AND c.id = a.company_id
LIMIT 1;

INSERT INTO public.assets (company_id, name, asset_type, location, description, parent_asset_id)
SELECT 
    c.id,
    'Escritório Corporativo RJ',
    'Edificação',
    'Rio de Janeiro, RJ - Centro',
    'Sede administrativa da empresa',
    NULL
FROM public.companies c
LIMIT 1;