-- Update variable factors with 2024 data and ensure comprehensive coverage
INSERT INTO variable_factors (year, month, biodiesel_percentage, ethanol_percentage, electricity_sin_factor, created_at, updated_at) VALUES

-- 2024 data from GHG Protocol Brasil 2025.0.1
(2024, 1, 12.0, 27.0, 0.0421, NOW(), NOW()),
(2024, 2, 12.0, 27.0, 0.0376, NOW(), NOW()),
(2024, 3, 14.0, 27.0, 0.0278, NOW(), NOW()),
(2024, 4, 14.0, 27.0, 0.0195, NOW(), NOW()),
(2024, 5, 14.0, 27.0, 0.0283, NOW(), NOW()),
(2024, 6, 14.0, 27.0, 0.0365, NOW(), NOW()),
(2024, 7, 14.0, 27.0, 0.0571, NOW(), NOW()),
(2024, 8, 14.0, 27.0, 0.0739, NOW(), NOW()),
(2024, 9, 14.0, 27.0, 0.0917, NOW(), NOW()),
(2024, 10, 14.0, 27.0, 0.1127, NOW(), NOW()),
(2024, 11, 14.0, 27.0, 0.0701, NOW(), NOW()),
(2024, 12, 14.0, 27.0, 0.0564, NOW(), NOW())

ON CONFLICT (year, month) DO UPDATE SET 
  biodiesel_percentage = EXCLUDED.biodiesel_percentage,
  ethanol_percentage = EXCLUDED.ethanol_percentage,
  electricity_sin_factor = EXCLUDED.electricity_sin_factor,
  updated_at = NOW();

-- Add additional refrigerant factors from the non-Kyoto GHG document
INSERT INTO refrigerant_factors (refrigerant_code, chemical_name, chemical_formula, gwp_ar6, gwp_ar5, gwp_ar4, category, source, is_kyoto_gas, created_at, updated_at) VALUES

-- Common non-Kyoto refrigerants with their GWP values
('HCFC-22', 'Hydrochlorofluorocarbon-22', 'CHClF₂', 1810, 1810, 1810, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HCFC-141b', 'Hydrochlorofluorocarbon-141b', 'CH₃CCl₂F', 725, 725, 725, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HCFC-142b', 'Hydrochlorofluorocarbon-142b', 'CH₃CClF₂', 2310, 2310, 2310, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HFC-134a', 'Hydrofluorocarbon-134a', 'CH₂FCF₃', 1430, 1430, 1430, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HFC-410A', 'Hydrofluorocarbon-410A', 'CH₂F₂/CHF₂CF₃', 2088, 2088, 2088, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HFC-404A', 'Hydrofluorocarbon-404A', 'Mistura', 3922, 3922, 3922, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('HFC-407C', 'Hydrofluorocarbon-407C', 'Mistura', 1774, 1774, 1774, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('R-507A', 'Refrigerant-507A', 'Mistura HFC', 3985, 3985, 3985, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW()),
('R-508B', 'Refrigerant-508B', 'Mistura', 13396, 13396, 13396, 'Emissões Fugitivas', 'GHG Protocol Brasil 2025.0.1', false, NOW(), NOW())

ON CONFLICT (refrigerant_code) DO UPDATE SET 
  chemical_name = EXCLUDED.chemical_name,
  chemical_formula = EXCLUDED.chemical_formula,
  gwp_ar6 = EXCLUDED.gwp_ar6,
  gwp_ar5 = EXCLUDED.gwp_ar5,
  gwp_ar4 = EXCLUDED.gwp_ar4,
  source = EXCLUDED.source,
  updated_at = NOW();

-- Improve emission factors organization by adding missing categories and ensuring completeness
INSERT INTO emission_factors (name, category, activity_unit, co2_factor, ch4_factor, n2o_factor, source, year_of_validity, type, created_at, updated_at) VALUES

-- Stationary Combustion - Additional factors
('Óleo Combustível 1A', 'Combustão Estacionária', 't', 77.4, 3.0, 0.6, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Óleo Combustível 2A', 'Combustão Estacionária', 't', 77.4, 3.0, 0.6, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Óleo Combustível 3A', 'Combustão Estacionária', 't', 77.4, 3.0, 0.6, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Querosene Iluminante', 'Combustão Estacionária', 'L', 2.52, 3.0, 0.6, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),

-- Mobile Combustion - Additional factors
('Gasolina Automotiva', 'Combustão Móvel', 'L', 2.2718, 0.25, 0.02, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Óleo Diesel S10', 'Combustão Móvel', 'L', 2.6071, 0.04, 0.19, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Óleo Diesel S500', 'Combustão Móvel', 'L', 2.6071, 0.04, 0.19, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),

-- Fugitive Emissions - Additional sources
('Vazamento de Gás Natural', 'Emissões Fugitivas', 'm³', 1.99, 21.0, 0.01, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Ventilação de Gás Natural', 'Emissões Fugitivas', 'm³', 1.99, 21.0, 0.01, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),

-- Waste Treatment
('Tratamento de Efluentes - Aeróbio', 'Tratamento de Efluentes', 'kg DBO', 0.0, 0.0, 0.0057, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Tratamento de Efluentes - Anaeróbio', 'Tratamento de Efluentes', 'kg DBO', 0.0, 0.25, 0.0, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),

-- Industrial Processes
('Produção de Cimento - Calcário', 'Processos Industriais', 't calcário', 440.0, 0.0, 0.0, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Produção de Cal', 'Processos Industriais', 't cal', 785.0, 0.0, 0.0, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW()),
('Produção de Aço - Alto Forno', 'Processos Industriais', 't aço', 1670.0, 0.0, 0.0, 'GHG Protocol Brasil 2025.0.1', 2024, 'system', NOW(), NOW())

ON CONFLICT (name, category, activity_unit, COALESCE(co2_factor, 0), COALESCE(ch4_factor, 0), COALESCE(n2o_factor, 0), source) DO NOTHING;