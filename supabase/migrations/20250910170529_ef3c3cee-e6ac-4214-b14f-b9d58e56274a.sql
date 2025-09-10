-- CORRIGIR ESTRUTURA E EXPANDIR BIBLIOTECA DE FATORES - FASE 2 (Corrigido)
-- Primeiro adicionar colunas necessárias, depois inserir dados

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA emission_factors
ALTER TABLE emission_factors 
ADD COLUMN IF NOT EXISTS details_json jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'validated';

-- 2. GASES REFRIGERANTES (GWP altíssimo - crítico para inventários)
INSERT INTO emission_factors (
    name, category, activity_unit, co2_factor, ch4_factor, n2o_factor, 
    source, type, year_of_validity, validation_status
) VALUES 
-- R-134a - Refrigerante mais comum em veículos e refrigeração comercial
('R-134a (Tetrafluoroetano)', 'Emissões Fugitivas', 'kg', 0, 0, 0, 'IPCC AR6 / UNEP (2024)', 'system', 2024, 'validated'),

-- R-410A - Refrigerante padrão em ar condicionado residencial
('R-410A (Difluorometano/Pentafluoroetano)', 'Emissões Fugitivas', 'kg', 0, 0, 0, 'IPCC AR6 / UNEP (2024)', 'system', 2024, 'validated'),

-- R-22 - Refrigerante antigo ainda em uso (sendo eliminado)  
('R-22 (Clorodifluorometano)', 'Emissões Fugitivas', 'kg', 0, 0, 0, 'IPCC AR6 / UNEP (2024)', 'system', 2024, 'validated'),

-- 3. COMBUSTÍVEIS FALTANTES ESSENCIAIS
-- GNV - Gás Natural Veicular (muito comum no Brasil)
('Gás Natural Veicular (GNV)', 'Combustão Móvel', 'm³', 1.95, 0.000036, 0.0000036, 'MCTI 2025 / ANP', 'system', 2025, 'validated'),

-- Querosene de Aviação
('Querosene de Aviação (QAV)', 'Combustão Móvel', 'Litro', 2.52, 0.000007, 0.0000002, 'MCTI 2025 / ANP', 'system', 2025, 'validated'),

-- Óleo Combustível (navegação e indústria)
('Óleo Combustível 1A', 'Combustão Estacionária', 'Litro', 2.72, 0.000003, 0.0000006, 'MCTI 2025', 'system', 2025, 'validated'),

-- Biodiesel B100
('Biodiesel B100', 'Combustão Móvel', 'Litro', 2.51, 0.0000095, 0.0000084, 'MCTI 2025 / ANP', 'system', 2025, 'validated'),

-- GLP Automotivo  
('GLP Automotivo', 'Combustão Móvel', 'kg', 2.99, 0.000002, 0.0000001, 'MCTI 2025 / ANP', 'system', 2025, 'validated'),

-- 4. PROCESSOS INDUSTRIAIS BÁSICOS  
-- Cimento (CO₂ de processo - não combustão)
('Produção de Cimento - Processo', 'Processos Industriais', 'tonelada', 525.0, 0, 0, 'MCTI 2025 / ABCP', 'system', 2025, 'validated'),

-- Cal
('Produção de Cal', 'Processos Industriais', 'tonelada', 785.0, 0, 0, 'MCTI 2025', 'system', 2025, 'validated'),

-- 5. RESÍDUOS (Escopo 3 comum)
-- Aterro sanitário
('Resíduos Sólidos - Aterro Sanitário', 'Tratamento de Resíduos', 'tonelada', 0, 75.0, 0, 'MCTI 2025 / CETESB', 'system', 2025, 'validated'),

-- Compostagem
('Resíduos Orgânicos - Compostagem', 'Tratamento de Resíduos', 'tonelada', 0, 4.0, 0.3, 'MCTI 2025 / CETESB', 'system', 2025, 'validated'),

-- 6. EFLUENTES
-- Tratamento aeróbio
('Efluentes - Tratamento Aeróbio', 'Tratamento de Efluentes', 'm³', 0, 0, 0.005, 'MCTI 2025', 'system', 2025, 'validated'),

-- Tratamento anaeróbio  
('Efluentes - Tratamento Anaeróbio', 'Tratamento de Efluentes', 'm³', 0, 0.25, 0, 'MCTI 2025', 'system', 2025, 'validated');

-- 7. ATUALIZAR METADADOS DOS GASES REFRIGERANTES COM GWP CORRETO
-- (Os gases refrigerantes têm GWP específico que não segue a fórmula padrão)

-- R-134a: GWP = 1,430 (direto, não usa os fatores CH4/N2O)
UPDATE emission_factors 
SET details_json = jsonb_build_object(
    'gwp_direct', 1430,
    'gwp_source', 'IPCC AR6',
    'note', 'GWP direto aplicado - não usar conversão padrão CH4/N2O'
)
WHERE name = 'R-134a (Tetrafluoroetano)';

-- R-410A: GWP = 2,088 (média ponderada dos componentes)
UPDATE emission_factors 
SET details_json = jsonb_build_object(
    'gwp_direct', 2088,
    'gwp_source', 'IPCC AR6', 
    'note', 'GWP direto aplicado - não usar conversão padrão CH4/N2O'
)
WHERE name = 'R-410A (Difluorometano/Pentafluoroetano)';

-- R-22: GWP = 1,810
UPDATE emission_factors 
SET details_json = jsonb_build_object(
    'gwp_direct', 1810,
    'gwp_source', 'IPCC AR6',
    'note', 'GWP direto aplicado - não usar conversão padrão CH4/N2O'
)
WHERE name = 'R-22 (Clorodifluorometano)';

-- 8. ADICIONAR CAMPOS DE RASTREABILIDADE (FASE 3 PARCIAL)
-- Atualizar fatores existentes com URLs de fonte quando disponível
UPDATE emission_factors 
SET details_json = COALESCE(details_json, '{}'::jsonb) || jsonb_build_object(
    'source_url', 'https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/sirene',
    'table_reference', 'Tabela 7 - Fatores de Emissão para Combustão Móvel'
)
WHERE source LIKE '%MCTI%' AND category = 'Combustão Móvel';

UPDATE emission_factors 
SET details_json = COALESCE(details_json, '{}'::jsonb) || jsonb_build_object(
    'source_url', 'https://www.ghgprotocol.org/brazilian-ghg-protocol-program',
    'methodology', 'Programa Brasileiro GHG Protocol'
)
WHERE source LIKE '%GHG Protocol%';