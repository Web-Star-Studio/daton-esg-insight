-- Tabelas para controle de ponto e frequência

-- Tabela de registros de ponto
CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC(4,2),
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present', -- present, absent, late, partial
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_employee_date UNIQUE(employee_id, date)
);

-- Tabela de escalas de trabalho
CREATE TABLE work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 60, -- minutos
  work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=segunda, 7=domingo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atribuição de escalas para funcionários
CREATE TABLE employee_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_active_employee_schedule UNIQUE(employee_id, start_date) 
);

-- Tabela de solicitações de ausência
CREATE TABLE leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- vacation, sick_leave, personal, maternity, etc
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  requested_by_user_id UUID NOT NULL,
  approved_by_user_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tipos de ausência
CREATE TABLE leave_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  max_days_per_year INTEGER,
  requires_approval BOOLEAN DEFAULT true,
  advance_notice_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de ausência padrão
INSERT INTO leave_types (company_id, name, description, max_days_per_year, advance_notice_days) VALUES 
('00000000-0000-0000-0000-000000000000', 'Férias', 'Férias anuais', 30, 30),
('00000000-0000-0000-0000-000000000000', 'Licença Médica', 'Atestado médico', NULL, 0),
('00000000-0000-0000-0000-000000000000', 'Falta Justificada', 'Ausência com justificativa', 6, 1),
('00000000-0000-0000-0000-000000000000', 'Licença Maternidade', 'Licença maternidade', 120, 30);

-- RLS Policies
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

-- Políticas para attendance_records
CREATE POLICY "Users can manage their company attendance records" ON attendance_records
  FOR ALL USING (company_id = get_user_company_id());

-- Políticas para work_schedules
CREATE POLICY "Users can manage their company work schedules" ON work_schedules
  FOR ALL USING (company_id = get_user_company_id());

-- Políticas para employee_schedules
CREATE POLICY "Users can manage their company employee schedules" ON employee_schedules
  FOR ALL USING (company_id = get_user_company_id());

-- Políticas para leave_requests
CREATE POLICY "Users can manage their company leave requests" ON leave_requests
  FOR ALL USING (company_id = get_user_company_id());

-- Políticas para leave_types
CREATE POLICY "Users can view all leave types" ON leave_types
  FOR SELECT USING (true);
  
CREATE POLICY "Users can manage their company leave types" ON leave_types
  FOR ALL USING (company_id = get_user_company_id());