-- Avaliação de eficácia agora é por programa: 1 row em
-- training_efficacy_evaluations cobre o treinamento todo (não exige avaliar
-- cada participante individualmente). Por isso employee_training_id passa
-- a ser opcional. Avaliações antigas (por participant) seguem suportadas.
ALTER TABLE public.training_efficacy_evaluations
  ALTER COLUMN employee_training_id DROP NOT NULL;
