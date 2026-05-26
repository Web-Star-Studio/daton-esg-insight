-- Adiciona 'DA' (Dispensa Ambiental) ao license_type_enum.
-- Documentos como Declaração de Atividade Dispensada de Licenciamento (CETESB)
-- ou Declaração de Atividade Não Constante (CONSEMA/SC) eram forçados para 'LO'
-- ou 'Outra', perdendo semântica para alertas e condicionantes.
--
-- ALTER TYPE ... ADD VALUE não pode rodar dentro do mesmo bloco transacional
-- onde o valor será utilizado, então a migration apenas adiciona o valor; uso
-- subsequente acontece em outras migrations/seeds e no runtime.
ALTER TYPE public.license_type_enum ADD VALUE IF NOT EXISTS 'DA';
