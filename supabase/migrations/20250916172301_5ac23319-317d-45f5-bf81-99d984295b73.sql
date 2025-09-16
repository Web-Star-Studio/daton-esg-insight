-- Import comprehensive airport data from GHG Protocol Brasil 2025
INSERT INTO airport_factors (airport_code, airport_name, aircraft_category, factor_type, unit, co2_factor, ch4_factor, n2o_factor, fuel_consumption_factor, source, created_at, updated_at) VALUES

-- Domestic flights emission factors (per passenger-km)
('DOMESTIC', 'Voos Domésticos', 'Todos', 'Emissão por passageiro-km', 'kg CO2e/passageiro-km', 0.102, 0.0001, 0.0001, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- International flights emission factors (per passenger-km) 
('INTERNATIONAL', 'Voos Internacionais', 'Todos', 'Emissão por passageiro-km', 'kg CO2e/passageiro-km', 0.117, 0.0001, 0.0001, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Cargo flights emission factors (per tonne-km)
('CARGO_DOMESTIC', 'Carga Doméstica', 'Cargueiro', 'Emissão por tonelada-km', 'kg CO2e/t-km', 1.47, 0.002, 0.002, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('CARGO_INTERNATIONAL', 'Carga Internacional', 'Cargueiro', 'Emissão por tonelada-km', 'kg CO2e/t-km', 1.47, 0.002, 0.002, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Business aviation emission factors
('BUSINESS_JET', 'Aviação Executiva - Jato', 'Executivo', 'Emissão por hora de voo', 'kg CO2e/hora', 1850, 0.5, 0.1, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('BUSINESS_TURBOPROP', 'Aviação Executiva - Turboélice', 'Executivo', 'Emissão por hora de voo', 'kg CO2e/hora', 850, 0.3, 0.05, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Helicopter emission factors
('HELICOPTER_LIGHT', 'Helicóptero Leve', 'Helicóptero', 'Emissão por hora de voo', 'kg CO2e/hora', 420, 0.15, 0.02, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('HELICOPTER_MEDIUM', 'Helicóptero Médio', 'Helicóptero', 'Emissão por hora de voo', 'kg CO2e/hora', 850, 0.3, 0.05, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('HELICOPTER_HEAVY', 'Helicóptero Pesado', 'Helicóptero', 'Emissão por hora de voo', 'kg CO2e/hora', 1420, 0.5, 0.08, NULL, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW());

-- Update conversion factors with comprehensive data from GHG Protocol
INSERT INTO conversion_factors (from_unit, to_unit, category, conversion_factor, source, created_at, updated_at) VALUES

-- Mass conversions
('libra', 'grama', 'Massa', 453.6, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('libra', 'quilograma', 'Massa', 0.4536, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('libra', 'tonelada métrica', 'Massa', 0.0004536, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('quilograma', 'libra', 'Massa', 2.205, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('tonelada curta', 'libra', 'Massa', 2000, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('tonelada curta', 'quilograma', 'Massa', 907.2, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('tonelada métrica', 'libra', 'Massa', 2205, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('tonelada métrica', 'quilograma', 'Massa', 1000, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('tonelada métrica', 'tonelada curta', 'Massa', 1.102, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Volume conversions
('pé cúbico', 'galão americano', 'Volume', 7.4805, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('pé cúbico', 'barril', 'Volume', 0.1730, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('pé cúbico', 'litro', 'Volume', 28.32, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('pé cúbico', 'metro cúbico', 'Volume', 0.02832, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('galão americano', 'barril', 'Volume', 0.0238, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('galão americano', 'litro', 'Volume', 3.785, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('galão americano', 'metro cúbico', 'Volume', 0.003785, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('barril', 'galão americano', 'Volume', 42, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('barril', 'litro', 'Volume', 158.9873, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('barril', 'metro cúbico', 'Volume', 0.1589873, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('litro', 'metro cúbico', 'Volume', 0.001, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('litro', 'galão americano', 'Volume', 0.2642, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('metro cúbico', 'barril', 'Volume', 6.2897, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('metro cúbico', 'galão americano', 'Volume', 264.2, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('metro cúbico', 'litro', 'Volume', 1000, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Energy conversions
('quilowatt-hora', 'Btu', 'Energia', 3412, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('quilowatt-hora', 'quilojoule', 'Energia', 3600, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('megajoule', 'gigajoule', 'Energia', 0.001, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('gigajoule', 'MMBtu', 'Energia', 0.9478, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('gigajoule', 'quilowatt-hora', 'Energia', 277.7, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('gigajoule', 'megawatt-hora', 'Energia', 0.277777, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('Btu', 'joule', 'Energia', 1055, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('MMBtu', 'gigajoule', 'Energia', 1.055, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('MMBtu', 'quilowatt-hora', 'Energia', 293, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('therm', 'Btu', 'Energia', 100000, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('therm', 'gigajoule', 'Energia', 0.1055, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('therm', 'quilowatt-hora', 'Energia', 29.3, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),

-- Distance conversions
('milha terrestre', 'quilômetro', 'Distância', 1.609, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('milha náutica', 'milha terrestre', 'Distância', 1.15, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW()),
('milha náutica', 'quilômetro', 'Distância', 1.852, 'GHG Protocol Brasil 2025.0.1', NOW(), NOW())

ON CONFLICT (from_unit, to_unit, category) DO UPDATE SET 
  conversion_factor = EXCLUDED.conversion_factor,
  source = EXCLUDED.source,
  updated_at = NOW();