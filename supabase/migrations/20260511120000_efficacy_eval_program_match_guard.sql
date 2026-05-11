-- Garantir que training_efficacy_evaluations.training_program_id sempre case
-- com employee_trainings.training_program_id quando employee_training_id está
-- preenchido. Sem essa guard, é possível persistir evaluations com FK
-- cruzada — observado uma vez em prod (eval 57fafe4c na empresa Gabardo
-- apontando pro programa de Anápolis enquanto o ET era de Porto Alegre).
-- Quando isso acontece, o programa "errado" passa a contar 1 evaluation /
-- 0 participantes na UI (efficacyEvaluationDashboard.ts) e a planilha de
-- pendências e a UI ficam dessincronizadas.

CREATE OR REPLACE FUNCTION public.assert_training_efficacy_evaluation_program_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_et_program_id uuid;
BEGIN
  IF NEW.employee_training_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT training_program_id
    INTO v_et_program_id
  FROM employee_trainings
  WHERE id = NEW.employee_training_id;

  IF v_et_program_id IS NULL THEN
    RAISE EXCEPTION 'employee_training % não encontrado', NEW.employee_training_id
      USING ERRCODE = '23503';
  END IF;

  IF v_et_program_id <> NEW.training_program_id THEN
    RAISE EXCEPTION
      'training_program_id (%) diverge de employee_trainings.training_program_id (%) para employee_training %',
      NEW.training_program_id, v_et_program_id, NEW.employee_training_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_training_efficacy_evaluations_program_match
  ON public.training_efficacy_evaluations;

CREATE TRIGGER trg_training_efficacy_evaluations_program_match
BEFORE INSERT OR UPDATE OF training_program_id, employee_training_id
ON public.training_efficacy_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.assert_training_efficacy_evaluation_program_match();

COMMENT ON FUNCTION public.assert_training_efficacy_evaluation_program_match() IS
  'Impede que training_efficacy_evaluations seja inserida/atualizada com training_program_id divergente do training_program_id do employee_training referenciado.';
