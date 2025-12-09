-- Add category and action_label columns to notifications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'category') THEN
    ALTER TABLE notifications ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_label') THEN
    ALTER TABLE notifications ADD COLUMN action_label TEXT;
  END IF;
END $$;

-- Create index for category column
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- Create trigger function for legislation notifications
CREATE OR REPLACE FUNCTION notify_legislation_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify new responsible assigned
  IF NEW.responsible_user_id IS NOT NULL 
     AND (OLD.responsible_user_id IS NULL OR OLD.responsible_user_id IS DISTINCT FROM NEW.responsible_user_id) THEN
    INSERT INTO notifications (user_id, company_id, title, message, type, category, priority, is_read, action_url, action_label, metadata)
    VALUES (
      NEW.responsible_user_id,
      NEW.company_id,
      'Nova legislação atribuída',
      'Você foi designado como responsável pela legislação: ' || COALESCE(NEW.title, 'Sem título'),
      'info',
      'legislation',
      'medium',
      false,
      '/licenciamento/legislacoes/' || NEW.id,
      'Ver Legislação',
      jsonb_build_object('legislation_id', NEW.id)
    );
  END IF;

  -- Notify when legislation is revoked
  IF NEW.revoked_by_legislation_id IS NOT NULL 
     AND (OLD.revoked_by_legislation_id IS NULL OR TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, company_id, title, message, type, category, priority, is_read, action_url, action_label, metadata)
    SELECT 
      COALESCE(NEW.responsible_user_id, NEW.created_by),
      NEW.company_id,
      'Legislação revogada',
      'A legislação "' || COALESCE(NEW.title, 'Sem título') || '" foi marcada como revogada',
      'warning',
      'legislation',
      'high',
      false,
      '/licenciamento/legislacoes/' || NEW.id,
      'Ver Legislação',
      jsonb_build_object('legislation_id', NEW.id, 'revoked_by', NEW.revoked_by_legislation_id)
    WHERE COALESCE(NEW.responsible_user_id, NEW.created_by) IS NOT NULL;
  END IF;

  -- Notify when status changes to adequacao or plano_acao
  IF NEW.overall_status IN ('adequacao', 'plano_acao') 
     AND (TG_OP = 'INSERT' OR OLD.overall_status IS NULL OR OLD.overall_status IS DISTINCT FROM NEW.overall_status) THEN
    INSERT INTO notifications (user_id, company_id, title, message, type, category, priority, is_read, action_url, action_label, metadata)
    SELECT 
      COALESCE(NEW.responsible_user_id, NEW.created_by),
      NEW.company_id,
      CASE 
        WHEN NEW.overall_status = 'adequacao' THEN 'Legislação requer adequação'
        ELSE 'Legislação com plano de ação pendente'
      END,
      'A legislação "' || COALESCE(NEW.title, 'Sem título') || '" precisa de atenção',
      CASE WHEN NEW.overall_status = 'adequacao' THEN 'warning' ELSE 'info' END,
      'legislation',
      CASE WHEN NEW.overall_status = 'adequacao' THEN 'high' ELSE 'medium' END,
      false,
      '/licenciamento/legislacoes/' || NEW.id,
      'Ver Legislação',
      jsonb_build_object('legislation_id', NEW.id, 'status', NEW.overall_status)
    WHERE COALESCE(NEW.responsible_user_id, NEW.created_by) IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_legislation_notifications ON legislations;
CREATE TRIGGER trigger_legislation_notifications
AFTER INSERT OR UPDATE ON legislations
FOR EACH ROW EXECUTE FUNCTION notify_legislation_changes();

-- Create trigger function for unit compliance notifications
CREATE OR REPLACE FUNCTION notify_unit_compliance_issues()
RETURNS TRIGGER AS $$
DECLARE
  v_legislation RECORD;
  v_user_id UUID;
BEGIN
  -- Notify when pending_requirements is filled
  IF NEW.pending_requirements IS NOT NULL 
     AND NEW.pending_requirements != '' 
     AND (OLD IS NULL OR OLD.pending_requirements IS NULL OR OLD.pending_requirements = '') THEN
    
    -- Get legislation data
    SELECT id, title, company_id, responsible_user_id, created_by 
    INTO v_legislation
    FROM legislations 
    WHERE id = NEW.legislation_id;

    -- Determine who to notify
    v_user_id := COALESCE(NEW.unit_responsible_id, v_legislation.responsible_user_id, v_legislation.created_by);

    IF v_user_id IS NOT NULL AND v_legislation.id IS NOT NULL THEN
      INSERT INTO notifications (user_id, company_id, title, message, type, category, priority, is_read, action_url, action_label, metadata)
      VALUES (
        v_user_id,
        v_legislation.company_id,
        'Pendência registrada em legislação',
        'Nova pendência identificada para "' || COALESCE(v_legislation.title, 'Legislação') || '"',
        'warning',
        'legislation',
        'high',
        false,
        '/licenciamento/legislacoes/' || v_legislation.id,
        'Ver Legislação',
        jsonb_build_object('legislation_id', v_legislation.id, 'unit_id', NEW.unit_id, 'pending', NEW.pending_requirements)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_unit_compliance_notifications ON legislation_unit_compliance;
CREATE TRIGGER trigger_unit_compliance_notifications
AFTER INSERT OR UPDATE ON legislation_unit_compliance
FOR EACH ROW EXECUTE FUNCTION notify_unit_compliance_issues();