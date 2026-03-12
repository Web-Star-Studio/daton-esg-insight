CREATE OR REPLACE FUNCTION public.notify_unit_compliance_issues()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_responsible_id UUID;
  v_company_id UUID;
  v_branch_name TEXT;
  v_legislation_title TEXT;
BEGIN
  -- Use branch_id (correct column) instead of unit_id
  v_company_id := NEW.company_id;
  v_responsible_id := NEW.unit_responsible_user_id;
  
  -- Get branch name
  SELECT name INTO v_branch_name
  FROM public.branches 
  WHERE id = NEW.branch_id;

  -- Fallback: get responsible from legislation if not set on compliance record
  IF v_responsible_id IS NULL THEN
    SELECT responsible_user_id INTO v_responsible_id
    FROM public.legislations 
    WHERE id = NEW.legislation_id;
  END IF;

  -- Get legislation title for notification context
  SELECT title INTO v_legislation_title
  FROM public.legislations
  WHERE id = NEW.legislation_id;

  -- Notify when there are pending requirements
  IF NEW.has_pending_requirements = true 
     AND v_responsible_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.notifications (
        user_id, company_id, title, message, type, priority, action_url, category
      )
      VALUES (
        v_responsible_id,
        v_company_id,
        'Requisitos de Conformidade Pendentes',
        'A unidade "' || COALESCE(v_branch_name, 'Sem nome') || '" possui requisitos pendentes para "' ||
        COALESCE(LEFT(v_legislation_title, 80), 'legislação') || '".' ||
        CASE WHEN NEW.pending_description IS NOT NULL THEN ' Detalhe: ' || LEFT(NEW.pending_description, 200) ELSE '' END,
        'warning',
        'important',
        '/licenciamento/legislacoes/' || NEW.legislation_id,
        'compliance'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't block the compliance upsert if notification fails
      RAISE WARNING 'Failed to create notification for unit compliance %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$