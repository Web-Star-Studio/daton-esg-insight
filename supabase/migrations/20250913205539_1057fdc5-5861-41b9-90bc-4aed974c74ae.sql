-- Adicionar novos campos ambientais à tabela assets
ALTER TABLE public.assets 
ADD COLUMN productive_capacity NUMERIC,
ADD COLUMN capacity_unit TEXT,
ADD COLUMN installation_year INTEGER CHECK (installation_year >= 1900 AND installation_year <= 2100),
ADD COLUMN operational_status TEXT CHECK (operational_status IN ('Ativo', 'Inativo', 'Manutenção')),
ADD COLUMN pollution_potential TEXT CHECK (pollution_potential IN ('Alto', 'Médio', 'Baixo')),
ADD COLUMN cnae_code TEXT,
ADD COLUMN monitoring_frequency TEXT CHECK (monitoring_frequency IN ('Diária', 'Semanal', 'Mensal', 'Trimestral', 'Anual')),
ADD COLUMN critical_parameters TEXT[],
ADD COLUMN monitoring_responsible TEXT;