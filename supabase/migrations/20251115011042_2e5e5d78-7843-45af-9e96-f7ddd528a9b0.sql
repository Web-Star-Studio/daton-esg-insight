-- SPRINT 1: Contas Bancárias, Contas a Pagar e Contas a Receber

-- Contas Bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Conta Corrente', 'Conta Poupança', 'Conta Investimento')),
  opening_balance NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa', 'Bloqueada')),
  is_main_account BOOLEAN DEFAULT false,
  account_manager TEXT,
  pix_keys JSONB,
  overdraft_limit NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  original_amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  interest_amount NUMERIC(15,2) DEFAULT 0,
  fine_amount NUMERIC(15,2) DEFAULT 0,
  final_amount NUMERIC(15,2),
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Parcial', 'Pago', 'Cancelado', 'Vencido')),
  payment_method TEXT,
  category TEXT NOT NULL,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  barcode TEXT,
  pix_key TEXT,
  approval_status TEXT DEFAULT 'Pendente' CHECK (approval_status IN ('Pendente', 'Aprovado', 'Rejeitado')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contas a Receber
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  receipt_date DATE,
  original_amount NUMERIC(15,2) NOT NULL,
  received_amount NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  interest_amount NUMERIC(15,2) DEFAULT 0,
  fine_amount NUMERIC(15,2) DEFAULT 0,
  final_amount NUMERIC(15,2),
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Parcial', 'Recebido', 'Cancelado', 'Vencido', 'Inadimplente')),
  payment_method TEXT,
  category TEXT NOT NULL,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  installment_number INTEGER,
  total_installments INTEGER,
  notes TEXT,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Pagamentos/Recebimentos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payable_id UUID REFERENCES accounts_payable(id) ON DELETE CASCADE,
  receivable_id UUID REFERENCES accounts_receivable(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT payment_or_receipt CHECK (
    (payable_id IS NOT NULL AND receivable_id IS NULL) OR
    (payable_id IS NULL AND receivable_id IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company ON bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_company ON accounts_payable(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_company ON accounts_receivable(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_payable ON payment_history(payable_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_receivable ON payment_history(receivable_id);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company bank accounts"
  ON bank_accounts FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company bank accounts"
  ON bank_accounts FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company accounts payable"
  ON accounts_payable FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company accounts payable"
  ON accounts_payable FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company accounts receivable"
  ON accounts_receivable FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company accounts receivable"
  ON accounts_receivable FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company payment history"
  ON payment_history FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their company payment history"
  ON payment_history FOR ALL
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));