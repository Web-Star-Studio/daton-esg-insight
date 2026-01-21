-- Adicionar coluna para o responsável pela avaliação de eficácia do treinamento
-- Este campo armazena o ID do colaborador que será o único responsável pela avaliação
ALTER TABLE public.training_programs 
ADD COLUMN IF NOT EXISTS efficacy_evaluator_employee_id UUID REFERENCES public.employees(id);

-- Criar índice para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_training_programs_efficacy_evaluator 
ON public.training_programs(efficacy_evaluator_employee_id);

-- Comentário explicativo no campo
COMMENT ON COLUMN public.training_programs.efficacy_evaluator_employee_id IS 
'ID do colaborador responsável pela avaliação de eficácia. Apenas este colaborador verá a pendência e receberá notificações.';