-- Adicionar colunas para avaliação de eficácia na tabela training_programs
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS efficacy_evaluation_deadline DATE;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS notify_responsible_email BOOLEAN DEFAULT false;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS responsible_email TEXT;

-- Criar tabela para avaliações de eficácia de treinamentos
CREATE TABLE IF NOT EXISTS training_efficacy_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_training_id UUID NOT NULL REFERENCES employee_trainings(id) ON DELETE CASCADE,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES profiles(id),
  evaluator_name TEXT,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 10),
  is_effective BOOLEAN,
  comments TEXT,
  status VARCHAR(50) DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_efficacy_eval_company ON training_efficacy_evaluations(company_id);
CREATE INDEX IF NOT EXISTS idx_efficacy_eval_training ON training_efficacy_evaluations(training_program_id);
CREATE INDEX IF NOT EXISTS idx_efficacy_eval_employee ON training_efficacy_evaluations(employee_training_id);
CREATE INDEX IF NOT EXISTS idx_efficacy_eval_status ON training_efficacy_evaluations(status);

-- RLS Policies
ALTER TABLE training_efficacy_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view efficacy evaluations from their company" 
  ON training_efficacy_evaluations FOR SELECT 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert efficacy evaluations in their company" 
  ON training_efficacy_evaluations FOR INSERT 
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update efficacy evaluations in their company" 
  ON training_efficacy_evaluations FOR UPDATE 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete efficacy evaluations in their company" 
  ON training_efficacy_evaluations FOR DELETE 
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_training_efficacy_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_efficacy_evaluations_updated_at ON training_efficacy_evaluations;
CREATE TRIGGER update_training_efficacy_evaluations_updated_at
  BEFORE UPDATE ON training_efficacy_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_training_efficacy_evaluations_updated_at();