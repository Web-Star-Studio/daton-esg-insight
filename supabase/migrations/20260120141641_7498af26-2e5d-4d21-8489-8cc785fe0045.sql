-- =====================================================
-- TRAINING SCHEDULES - Complete Implementation
-- =====================================================

-- 1. Create training_schedules table
CREATE TABLE IF NOT EXISTS training_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  training_program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  location VARCHAR(255),
  instructor VARCHAR(255),
  max_participants INTEGER DEFAULT 20,
  status VARCHAR(50) DEFAULT 'Planejado',
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create training_schedule_participants table
CREATE TABLE IF NOT EXISTS training_schedule_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES training_schedules(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT false,
  attended BOOLEAN,
  attendance_marked_at TIMESTAMPTZ,
  attendance_marked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, employee_id)
);

-- 3. Enable RLS
ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_schedule_participants ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for training_schedules
CREATE POLICY "Users can view company training schedules"
ON training_schedules FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert company training schedules"
ON training_schedules FOR INSERT
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company training schedules"
ON training_schedules FOR UPDATE
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can delete company training schedules"
ON training_schedules FOR DELETE
USING (company_id = get_user_company_id());

-- 5. RLS Policies for training_schedule_participants
CREATE POLICY "Users can view participants of their schedules"
ON training_schedule_participants FOR SELECT
USING (
  schedule_id IN (
    SELECT id FROM training_schedules 
    WHERE company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can insert participants to their schedules"
ON training_schedule_participants FOR INSERT
WITH CHECK (
  schedule_id IN (
    SELECT id FROM training_schedules 
    WHERE company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can update participants of their schedules"
ON training_schedule_participants FOR UPDATE
USING (
  schedule_id IN (
    SELECT id FROM training_schedules 
    WHERE company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can delete participants from their schedules"
ON training_schedule_participants FOR DELETE
USING (
  schedule_id IN (
    SELECT id FROM training_schedules 
    WHERE company_id = get_user_company_id()
  )
);

-- 6. Performance indexes
CREATE INDEX IF NOT EXISTS idx_training_schedules_company_id 
ON training_schedules(company_id);

CREATE INDEX IF NOT EXISTS idx_training_schedules_program_id 
ON training_schedules(training_program_id);

CREATE INDEX IF NOT EXISTS idx_training_schedules_dates 
ON training_schedules(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_training_schedules_status 
ON training_schedules(status);

CREATE INDEX IF NOT EXISTS idx_training_schedule_participants_schedule 
ON training_schedule_participants(schedule_id);

CREATE INDEX IF NOT EXISTS idx_training_schedule_participants_employee 
ON training_schedule_participants(employee_id);

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_training_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER trigger_training_schedules_updated_at
BEFORE UPDATE ON training_schedules
FOR EACH ROW
EXECUTE FUNCTION update_training_schedules_updated_at();