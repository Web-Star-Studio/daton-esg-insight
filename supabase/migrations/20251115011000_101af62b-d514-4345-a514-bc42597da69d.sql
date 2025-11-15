-- SPRINT 1: Plano de Contas e Lançamentos Contábeis

-- Plano de Contas
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN (
    'Ativo Circulante',
    'Ativo Não Circulante',
    'Passivo Circulante', 
    'Passivo Não Circulante',
    'Patrimônio Líquido',
    'Receitas',
    'Custos',
    'Despesas'
  )),
  account_nature TEXT NOT NULL CHECK (account_nature IN ('Devedora', 'Credora')),
  parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,
  is_analytical BOOLEAN DEFAULT false,
  accepts_cost_center BOOLEAN DEFAULT false,
  accepts_project BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, account_code)
);

-- Lançamentos Contábeis
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  accounting_date DATE NOT NULL,
  description TEXT NOT NULL,
  document_type TEXT,
  document_number TEXT,
  total_debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Provisório' CHECK (status IN ('Provisório', 'Confirmado', 'Cancelado')),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT balanced_entry CHECK (total_debit = total_credit)
);

-- Partidas Contábeis
CREATE TABLE IF NOT EXISTS accounting_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount NUMERIC(15,2) DEFAULT 0,
  credit_amount NUMERIC(15,2) DEFAULT 0,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT debit_or_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chart_accounts_company ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_company ON accounting_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entry_lines_entry ON accounting_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entry_lines_account ON accounting_entry_lines(account_id);

-- RLS Policies
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company chart of accounts"
  ON chart_of_accounts FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company chart of accounts"
  ON chart_of_accounts FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company accounting entries"
  ON accounting_entries FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company accounting entries"
  ON accounting_entries FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company accounting entry lines"
  ON accounting_entry_lines FOR SELECT
  USING (entry_id IN (SELECT id FROM accounting_entries WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can manage their company accounting entry lines"
  ON accounting_entry_lines FOR ALL
  USING (entry_id IN (SELECT id FROM accounting_entries WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));