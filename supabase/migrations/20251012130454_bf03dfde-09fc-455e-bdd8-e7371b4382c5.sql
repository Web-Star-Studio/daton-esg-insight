-- Enhance license_alerts table with new fields
ALTER TABLE license_alerts
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'média',
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS snooze_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create license_observations table
CREATE TABLE IF NOT EXISTS license_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by_user_id UUID NOT NULL REFERENCES profiles(id),
  
  title TEXT NOT NULL,
  observation_text TEXT NOT NULL,
  observation_type TEXT NOT NULL,
  
  category TEXT,
  priority TEXT DEFAULT 'média',
  visibility TEXT DEFAULT 'interna',
  
  related_alert_id UUID REFERENCES license_alerts(id),
  related_condition_id UUID REFERENCES license_conditions(id),
  related_document_ids JSONB DEFAULT '[]'::jsonb,
  
  requires_followup BOOLEAN DEFAULT false,
  followup_date DATE,
  followup_assigned_to UUID REFERENCES profiles(id),
  is_archived BOOLEAN DEFAULT false,
  
  tags TEXT[],
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- Create license_alert_comments table
CREATE TABLE IF NOT EXISTS license_alert_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES license_alerts(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES license_observations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT comment_target_check CHECK (
    (alert_id IS NOT NULL AND observation_id IS NULL) OR
    (alert_id IS NULL AND observation_id IS NOT NULL)
  )
);

-- Create license_action_history table
CREATE TABLE IF NOT EXISTS license_action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  action_type TEXT NOT NULL,
  action_target_type TEXT NOT NULL,
  action_target_id UUID NOT NULL,
  
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_alerts_assigned ON license_alerts(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_license_alerts_snooze ON license_alerts(snooze_until) WHERE snooze_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_license_alerts_tags ON license_alerts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_license_observations_license ON license_observations(license_id);
CREATE INDEX IF NOT EXISTS idx_license_observations_archived ON license_observations(is_archived);
CREATE INDEX IF NOT EXISTS idx_license_observations_followup ON license_observations(followup_date) WHERE requires_followup = true;
CREATE INDEX IF NOT EXISTS idx_license_comments_alert ON license_alert_comments(alert_id);
CREATE INDEX IF NOT EXISTS idx_license_comments_observation ON license_alert_comments(observation_id);
CREATE INDEX IF NOT EXISTS idx_license_history_license ON license_action_history(license_id);
CREATE INDEX IF NOT EXISTS idx_license_history_target ON license_action_history(action_target_type, action_target_id);

-- RLS Policies for license_observations
ALTER TABLE license_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company observations"
ON license_observations FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create observations"
ON license_observations FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND created_by_user_id = auth.uid());

CREATE POLICY "Users can update company observations"
ON license_observations FOR UPDATE
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete company observations"
ON license_observations FOR DELETE
USING (company_id = get_user_company_id());

-- RLS Policies for license_alert_comments
ALTER TABLE license_alert_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company comments"
ON license_alert_comments FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create comments"
ON license_alert_comments FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY "Users can update own comments"
ON license_alert_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON license_alert_comments FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for license_action_history
ALTER TABLE license_action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company action history"
ON license_action_history FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create action history"
ON license_action_history FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

-- Trigger to update updated_at on license_observations
CREATE OR REPLACE FUNCTION update_license_observations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_observations_updated_at
BEFORE UPDATE ON license_observations
FOR EACH ROW
EXECUTE FUNCTION update_license_observations_updated_at();

-- Trigger to update updated_at on license_alert_comments
CREATE OR REPLACE FUNCTION update_license_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_comments_updated_at
BEFORE UPDATE ON license_alert_comments
FOR EACH ROW
EXECUTE FUNCTION update_license_comments_updated_at();