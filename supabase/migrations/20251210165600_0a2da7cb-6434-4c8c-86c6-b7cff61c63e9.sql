-- Corrigir função notify_legislation_changes() para usar NEW.title em vez de NEW.name
CREATE OR REPLACE FUNCTION public.notify_legislation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Notificar novo responsável atribuído
  IF NEW.responsible_user_id IS NOT NULL 
     AND (OLD.responsible_user_id IS NULL OR OLD.responsible_user_id != NEW.responsible_user_id) THEN
    INSERT INTO public.notifications (
      user_id, company_id, title, message, type, priority, action_url, category
    )
    VALUES (
      NEW.responsible_user_id,
      NEW.company_id,
      'Nova Legislação Atribuída',
      'Você foi designado como responsável pela legislação: ' || NEW.title,
      'info',
      'info',
      '/licenciamento/legislacoes/' || NEW.id,
      'legislation'
    );
  END IF;

  -- Notificar quando legislação revogada
  IF NEW.revoked_by_legislation_id IS NOT NULL 
     AND OLD.revoked_by_legislation_id IS NULL 
     AND NEW.responsible_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, company_id, title, message, type, priority, action_url, category
    )
    VALUES (
      NEW.responsible_user_id,
      NEW.company_id,
      'Legislação Revogada',
      'A legislação "' || NEW.title || '" foi marcada como revogada.',
      'warning',
      'important',
      '/licenciamento/legislacoes/' || NEW.id,
      'legislation'
    );
  END IF;

  -- Notificar mudança de status que requer atenção
  IF NEW.overall_status IN ('adequacao', 'plano_acao') 
     AND (OLD.overall_status IS NULL OR OLD.overall_status != NEW.overall_status)
     AND NEW.responsible_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, company_id, title, message, type, priority, action_url, category
    )
    VALUES (
      NEW.responsible_user_id,
      NEW.company_id,
      CASE 
        WHEN NEW.overall_status = 'adequacao' THEN 'Legislação Requer Adequação'
        ELSE 'Plano de Ação Necessário'
      END,
      'A legislação "' || NEW.title || '" requer atenção: ' || 
      CASE 
        WHEN NEW.overall_status = 'adequacao' THEN 'adequação pendente'
        ELSE 'plano de ação necessário'
      END,
      CASE WHEN NEW.overall_status = 'adequacao' THEN 'warning' ELSE 'info' END,
      CASE WHEN NEW.overall_status = 'adequacao' THEN 'important' ELSE 'info' END,
      '/licenciamento/legislacoes/' || NEW.id,
      'legislation'
    );
  END IF;

  RETURN NEW;
END;
$$;