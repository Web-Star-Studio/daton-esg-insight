-- Trigger para calcular automaticamente has_alert
-- has_alert = TRUE quando aplicabilidade = 'real' E status IN ('adequacao', 'plano_acao')

CREATE OR REPLACE FUNCTION public.calculate_legislation_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular has_alert automaticamente
  NEW.has_alert := (
    NEW.overall_applicability = 'real' AND 
    NEW.overall_status IN ('adequacao', 'plano_acao')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger se existir
DROP TRIGGER IF EXISTS trigger_calculate_legislation_alert ON public.legislations;

-- Criar trigger para INSERT e UPDATE
CREATE TRIGGER trigger_calculate_legislation_alert
  BEFORE INSERT OR UPDATE OF overall_applicability, overall_status
  ON public.legislations
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_legislation_alert();

-- Atualizar has_alert para legislações existentes
UPDATE public.legislations
SET has_alert = (
  overall_applicability = 'real' AND 
  overall_status IN ('adequacao', 'plano_acao')
)
WHERE is_active = true;