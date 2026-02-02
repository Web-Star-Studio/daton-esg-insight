-- 1. Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by_user_id UUID REFERENCES auth.users(id)
);

-- 2. Tabela de histórico de configurações (imutável)
CREATE TABLE IF NOT EXISTS system_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Trigger para logar mudanças
CREATE OR REPLACE FUNCTION log_setting_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_settings_history (setting_key, old_value, new_value, changed_by_user_id)
  VALUES (NEW.setting_key, OLD.setting_value, NEW.setting_value, NEW.updated_by_user_id);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_log_setting_change ON system_settings;
CREATE TRIGGER tr_log_setting_change
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION log_setting_change();

-- 4. Valores iniciais das configurações
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('session_timeout_minutes', '30', 'Tempo de timeout de sessão em minutos'),
  ('max_upload_size_mb', '10', 'Tamanho máximo de upload em MB'),
  ('max_login_attempts', '5', 'Tentativas máximas de login antes do lock'),
  ('login_lock_duration_minutes', '15', 'Duração do lock em minutos')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. RLS para system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings" ON system_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin', 'admin')
  )
);

CREATE POLICY "Super admins can update settings" ON system_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin')
  )
);

-- 6. RLS para system_settings_history (somente leitura)
ALTER TABLE system_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings history" ON system_settings_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('platform_admin', 'super_admin', 'admin')
  )
);

-- 7. Índices para consultas de logs por data (performance)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type 
ON activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
ON activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_created_at 
ON login_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_success 
ON login_history(login_success);

-- 8. Função para limpar logs antigos (retençāo 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;