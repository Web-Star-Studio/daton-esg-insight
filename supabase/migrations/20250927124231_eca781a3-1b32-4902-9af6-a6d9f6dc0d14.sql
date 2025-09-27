-- Populando dados essenciais do sistema ESG - Versão corrigida

-- Dados básicos funcionais com estrutura de tabelas correta

-- Verificar se já há dados antes de inserir
DO $$
BEGIN
    -- Funcionários
    IF NOT EXISTS (SELECT 1 FROM employees WHERE company_id = '021647af-61a5-4075-9db3-bb5024ef7a67') THEN
        INSERT INTO public.employees (
            company_id, employee_code, full_name, email, department, position, 
            hire_date, status, salary, gender, birth_date, employment_type
        ) VALUES
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'EMP001', 'Ana Silva Santos', 'ana.silva@empresa.com', 'Recursos Humanos', 'Gerente de RH', '2022-01-15', 'Ativo', 8500.00, 'Feminino', '1985-03-20', 'CLT'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'EMP002', 'Carlos Eduardo Lima', 'carlos.lima@empresa.com', 'Qualidade', 'Analista de Qualidade', '2022-06-10', 'Ativo', 6200.00, 'Masculino', '1990-07-12', 'CLT'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'EMP003', 'Marisa Oliveira Costa', 'marisa.costa@empresa.com', 'Meio Ambiente', 'Coordenadora Ambiental', '2021-09-05', 'Ativo', 7800.00, 'Feminino', '1988-11-30', 'CLT');
    END IF;

    -- Riscos ESG
    IF NOT EXISTS (SELECT 1 FROM esg_risks WHERE company_id = '021647af-61a5-4075-9db3-bb5024ef7a67') THEN
        INSERT INTO public.esg_risks (company_id, risk_title, risk_description, esg_category, probability, impact, status) VALUES
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'Mudanças Climáticas', 'Impacto das mudanças climáticas na cadeia de suprimentos', 'Ambiental', 'Alta', 'Alto', 'Ativo'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'Acidentes de Trabalho', 'Risco de acidentes ocupacionais nas instalações', 'Social', 'Média', 'Alto', 'Ativo'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'Compliance Regulatório', 'Não conformidade com regulamentações ambientais', 'Governança', 'Baixa', 'Médio', 'Ativo');
    END IF;

    -- Não conformidades
    IF NOT EXISTS (SELECT 1 FROM non_conformities WHERE company_id = '021647af-61a5-4075-9db3-bb5024ef7a67') THEN
        INSERT INTO public.non_conformities (company_id, nc_number, title, description, severity, source, status, detected_date, responsible_user_id) VALUES
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'NC-2024-001', 'Descarte Inadequado de Resíduos', 'Resíduos químicos sendo descartados incorretamente', 'Alta', 'Auditoria Interna', 'Aberta', '2024-01-15', 'd08c70f5-e19c-4e9b-bb2d-f8afa03cccaf'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'NC-2024-002', 'Falta de EPI', 'Funcionários trabalhando sem equipamentos de proteção individual', 'Média', 'Inspeção', 'Em Tratamento', '2024-02-10', 'd08c70f5-e19c-4e9b-bb2d-f8afa03cccaf'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'NC-2024-003', 'Emissões Acima do Limite', 'Emissões atmosféricas excederam limites regulamentares', 'Crítica', 'Monitoramento', 'Aberta', '2024-03-01', 'd08c70f5-e19c-4e9b-bb2d-f8afa03cccaf');
    END IF;

    -- Planos de ação
    IF NOT EXISTS (SELECT 1 FROM action_plans WHERE company_id = '021647af-61a5-4075-9db3-bb5024ef7a67') THEN
        INSERT INTO public.action_plans (company_id, title, description, objective, plan_type, status, created_by_user_id) VALUES
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'Plano de Gestão de Resíduos 2024', 'Implementação de sistema de gestão de resíduos perigosos', 'Reduzir não conformidades relacionadas ao descarte de resíduos', 'Correção', 'Em Execução', 'd08c70f5-e19c-4e9b-bb2d-f8afa03cccaf'),
        ('021647af-61a5-4075-9db3-bb5024ef7a67', 'Programa de Treinamento em Segurança', 'Capacitação de todos os funcionários em normas de segurança', 'Reduzir acidentes de trabalho em 50%', 'Prevenção', 'Planejado', 'd08c70f5-e19c-4e9b-bb2d-f8afa03cccaf');
    END IF;

END $$;