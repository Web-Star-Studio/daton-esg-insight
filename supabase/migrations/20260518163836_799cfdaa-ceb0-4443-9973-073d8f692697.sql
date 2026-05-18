
ALTER TABLE public.stakeholders DISABLE TRIGGER stakeholder_set_company_id;

DO $$
DECLARE
  v_company_id uuid := gen_random_uuid();
  v_user_id uuid := gen_random_uuid();
  v_emp_ids uuid[] := ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  v_tp_ids uuid[] := ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  v_existing_user uuid;
BEGIN
  SELECT id INTO v_existing_user FROM auth.users WHERE email='datondemo@gmail.com';
  IF v_existing_user IS NOT NULL THEN
    RAISE NOTICE 'datondemo@gmail.com já existe, abortando.';
    RETURN;
  END IF;

  INSERT INTO public.companies (id, name, cnpj) VALUES (v_company_id, 'Demo', '11.222.333/0001-44');

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    'datondemo@gmail.com', crypt('admin123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name','Daton Demo','skip_trigger', true,'company_id', v_company_id::text,'role','admin'),
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', 'datondemo@gmail.com', 'email_verified', true),
    'email', now(), now(), now());

  INSERT INTO public.profiles (id, full_name, company_id, email, is_approved, role)
  VALUES (v_user_id, 'Daton Demo', v_company_id, 'datondemo@gmail.com', true, 'admin')
  ON CONFLICT (id) DO UPDATE SET
    full_name=EXCLUDED.full_name, company_id=EXCLUDED.company_id,
    email=EXCLUDED.email, is_approved=true, role='admin';

  INSERT INTO public.user_roles (user_id, role, company_id, assigned_by_user_id)
  VALUES (v_user_id, 'admin', v_company_id, v_user_id)
  ON CONFLICT (user_id, company_id) DO UPDATE SET role='admin';

  INSERT INTO public.branches (company_id, name) VALUES
    (v_company_id, 'Matriz São Paulo'),(v_company_id, 'Filial Rio de Janeiro'),(v_company_id, 'Filial Belo Horizonte');

  INSERT INTO public.departments (company_id, name) VALUES
    (v_company_id, 'Diretoria'),(v_company_id, 'Operações'),(v_company_id, 'Qualidade'),
    (v_company_id, 'Recursos Humanos'),(v_company_id, 'Sustentabilidade');

  INSERT INTO public.positions (company_id, title) VALUES
    (v_company_id, 'CEO'),(v_company_id, 'Gerente de Operações'),(v_company_id, 'Coordenador da Qualidade'),
    (v_company_id, 'Analista de RH'),(v_company_id, 'Analista de Sustentabilidade');

  INSERT INTO public.employees (id, company_id, full_name, hire_date) VALUES
    (v_emp_ids[1], v_company_id, 'Ana Silva', '2022-03-15'),
    (v_emp_ids[2], v_company_id, 'Bruno Costa', '2021-08-01'),
    (v_emp_ids[3], v_company_id, 'Carla Mendes', '2023-01-20'),
    (v_emp_ids[4], v_company_id, 'Diego Pereira', '2020-11-05'),
    (v_emp_ids[5], v_company_id, 'Eduarda Lima', '2022-06-12'),
    (v_emp_ids[6], v_company_id, 'Felipe Almeida', '2023-09-18'),
    (v_emp_ids[7], v_company_id, 'Gabriela Souza', '2021-02-28'),
    (v_emp_ids[8], v_company_id, 'Henrique Oliveira', '2024-04-10');

  INSERT INTO public.assets (company_id, name, asset_type, location, installation_year, operational_status) VALUES
    (v_company_id, 'Caldeira Principal', 'Equipamento', 'Matriz SP - Galpão A', 2018, 'Ativo'),
    (v_company_id, 'Linha de Envase 01',  'Equipamento', 'Matriz SP - Galpão B', 2020, 'Ativo'),
    (v_company_id, 'Compressor Industrial', 'Equipamento', 'Filial RJ', 2019, 'Ativo'),
    (v_company_id, 'Estação de Tratamento de Efluentes', 'Infraestrutura', 'Filial BH', 2017, 'Ativo');

  INSERT INTO public.suppliers (company_id, name) VALUES
    (v_company_id, 'Fornecedor Alpha LTDA'),(v_company_id, 'Beta Insumos S/A'),
    (v_company_id, 'Gama Logística ME'),(v_company_id, 'Delta Serviços Ambientais');

  INSERT INTO public.stakeholders (company_id, name, category) VALUES
    (v_company_id, 'Colaboradores','Interno'),(v_company_id, 'Clientes Premium','Externo'),
    (v_company_id, 'Comunidade Local','Externo'),(v_company_id, 'Investidores','Externo');

  INSERT INTO public.board_members (company_id, full_name, position, appointment_date) VALUES
    (v_company_id, 'Roberto Tavares','Presidente do Conselho','2020-01-15'),
    (v_company_id, 'Mariana Reis','Conselheira Independente','2021-03-10'),
    (v_company_id, 'Paulo Henrique','Conselheiro','2019-06-22'),
    (v_company_id, 'Sandra Bittencourt','Conselheira','2022-04-05'),
    (v_company_id, 'Lucas Ferreira','Conselheiro','2023-02-18'),
    (v_company_id, 'Patricia Gomes','Conselheira Independente','2024-01-09');

  INSERT INTO public.corporate_policies (company_id, title, category, effective_date, created_by_user_id) VALUES
    (v_company_id, 'Política de Qualidade','Qualidade','2024-01-01', v_user_id),
    (v_company_id, 'Política Ambiental','Ambiental','2024-01-01', v_user_id),
    (v_company_id, 'Política de SST','Segurança','2024-01-01', v_user_id),
    (v_company_id, 'Código de Ética e Conduta','Governança','2023-06-15', v_user_id),
    (v_company_id, 'Política de Diversidade e Inclusão','Social','2024-03-20', v_user_id);

  INSERT INTO public.cost_centers (company_id, name) VALUES
    (v_company_id, 'CC-100 Administrativo'),(v_company_id, 'CC-200 Produção'),(v_company_id, 'CC-300 Comercial');

  INSERT INTO public.bank_accounts (company_id, bank_code, bank_name, branch, account_number, account_type) VALUES
    (v_company_id, '341','Itaú Unibanco','0001','12345-6','Conta Corrente'),
    (v_company_id, '237','Bradesco','0123','98765-4','Conta Corrente'),
    (v_company_id, '001','Banco do Brasil','4567','11122-3','Conta Poupança');

  INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_type, account_nature) VALUES
    (v_company_id, '1.1.01','Caixa e Equivalentes','Ativo Circulante','Devedora'),
    (v_company_id, '1.2.01','Imobilizado','Ativo Não Circulante','Devedora'),
    (v_company_id, '2.1.01','Fornecedores','Passivo Circulante','Credora'),
    (v_company_id, '2.3.01','Capital Social','Patrimônio Líquido','Credora'),
    (v_company_id, '3.1.01','Receita de Vendas','Receitas','Credora'),
    (v_company_id, '4.1.01','Despesas Administrativas','Despesas','Devedora');

  INSERT INTO public.non_conformities (company_id, nc_number, title, description, severity, detected_date) VALUES
    (v_company_id, 'NC-2025-001','Desvio no processo de envase','Variação fora do limite especificado em lote 2025-A.','Alta','2025-09-12'),
    (v_company_id, 'NC-2025-002','Reclamação de cliente premium','Cliente reportou problema de embalagem.','Média','2025-10-03'),
    (v_company_id, 'NC-2025-003','Atraso em entrega de fornecedor','Atraso superior a 7 dias do prazo contratual.','Baixa','2025-11-21'),
    (v_company_id, 'NC-2026-001','Falha em calibração de equipamento','Equipamento operou 30 dias sem calibração.','Alta','2026-01-08'),
    (v_company_id, 'NC-2026-002','Não cumprimento de procedimento de SST','EPI não utilizado em área restrita.','Crítica','2026-02-14');

  INSERT INTO public.action_plans (company_id, title, description, plan_type, status, created_by_user_id) VALUES
    (v_company_id, 'Programa de Melhoria Contínua 2026','Iniciativas de melhoria nos processos produtivos.','Melhoria','Em Andamento', v_user_id),
    (v_company_id, 'Plano de Resposta a NCs Críticas','Ações corretivas para NCs de alta severidade.','Corretivo','Planejado', v_user_id),
    (v_company_id, 'Capacitação SST 2026','Treinamento anual obrigatório.','Preventivo','Em Andamento', v_user_id);

  INSERT INTO public.audits (company_id, title, audit_type, auditor, start_date, end_date, scope, status) VALUES
    (v_company_id, 'Auditoria Interna ISO 9001 - Q1 2026','Interna','Bruno Costa','2026-03-10','2026-03-14','Processos de produção e qualidade','Em Andamento'),
    (v_company_id, 'Auditoria ISO 14001 - Anual 2026','Externa','Certificadora XYZ','2026-05-20','2026-05-24','SGA - Todos os processos','Planejada');

  INSERT INTO public.licenses (company_id, name, type, issuing_body, expiration_date, status) VALUES
    (v_company_id, 'Licença de Operação Matriz SP','LO','CETESB','2027-06-30','Ativa'),
    (v_company_id, 'Licença Prévia Expansão BH','LP','FEAM','2026-12-15','Ativa'),
    (v_company_id, 'Licença de Instalação RJ','LI','INEA','2026-09-01','Em Renovação'),
    (v_company_id, 'Alvará Sanitário Matriz','Outra','Vigilância Sanitária SP','2026-08-20','Ativa'),
    (v_company_id, 'Outorga de Captação Hídrica','Outra','ANA','2028-03-10','Ativa');

  INSERT INTO public.document_folders (company_id, name) VALUES
    (v_company_id, 'Políticas'),(v_company_id, 'Procedimentos'),(v_company_id, 'Registros'),(v_company_id, 'Licenças Ambientais');

  INSERT INTO public.documents (company_id, file_name, file_path, file_type, related_model, related_id, uploader_user_id) VALUES
    (v_company_id, 'Politica-Qualidade-v3.pdf','demo/politica-qualidade.pdf','application/pdf','manual', v_company_id, v_user_id),
    (v_company_id, 'Manual-do-Sistema-SGI.pdf','demo/manual-sgi.pdf','application/pdf','manual', v_company_id, v_user_id),
    (v_company_id, 'Procedimento-Calibracao.pdf','demo/proc-calibracao.pdf','application/pdf','manual', v_company_id, v_user_id),
    (v_company_id, 'Relatorio-Anual-ESG-2025.pdf','demo/relatorio-esg-2025.pdf','application/pdf','manual', v_company_id, v_user_id),
    (v_company_id, 'LO-Matriz-SP.pdf','demo/lo-matriz-sp.pdf','application/pdf','manual', v_company_id, v_user_id),
    (v_company_id, 'Codigo-de-Etica.pdf','demo/codigo-etica.pdf','application/pdf','manual', v_company_id, v_user_id);

  INSERT INTO public.compliance_tasks (company_id, title, frequency, due_date, status) VALUES
    (v_company_id, 'Renovação Licença de Operação CETESB','Anual','2026-06-30','Pendente'),
    (v_company_id, 'Análise de Efluentes Trimestral','Trimestral','2026-06-15','Pendente'),
    (v_company_id, 'Relatório Anual de Resíduos','Anual','2026-12-31','Pendente'),
    (v_company_id, 'Treinamento NR-35 Trabalho em Altura','Anual','2026-09-10','Em Andamento');

  INSERT INTO public.training_programs (id, company_id, name, created_by_user_id) VALUES
    (v_tp_ids[1], v_company_id, 'NR-35 Trabalho em Altura', v_user_id),
    (v_tp_ids[2], v_company_id, 'Integração SGI - ISO 9001/14001/45001', v_user_id),
    (v_tp_ids[3], v_company_id, 'LGPD e Privacidade de Dados', v_user_id);

  INSERT INTO public.employee_trainings (company_id, employee_id, training_program_id) VALUES
    (v_company_id, v_emp_ids[1], v_tp_ids[1]),
    (v_company_id, v_emp_ids[2], v_tp_ids[2]),
    (v_company_id, v_emp_ids[3], v_tp_ids[2]),
    (v_company_id, v_emp_ids[4], v_tp_ids[3]),
    (v_company_id, v_emp_ids[5], v_tp_ids[1]);

  INSERT INTO public.customer_complaints (company_id, complaint_number, customer_name, complaint_type, category, subject, description) VALUES
    (v_company_id, 'REC-2025-001','Cliente Premium A','Produto','Embalagem','Embalagem violada na entrega','Lote 2025-A-12 chegou com lacre violado.'),
    (v_company_id, 'REC-2025-002','Cliente B','Serviço','Atendimento','Demora no atendimento técnico','Aguardando retorno há mais de 5 dias úteis.'),
    (v_company_id, 'REC-2026-001','Cliente C','Produto','Qualidade','Variação de cor no produto','Produto fora do padrão visual aprovado.'),
    (v_company_id, 'REC-2026-002','Cliente Premium D','Entrega','Logística','Atraso na entrega programada','Atraso de 3 dias úteis no pedido 2026-FEV-098.');

  INSERT INTO public.esg_risks (company_id, risk_title, risk_description, esg_category, probability, impact) VALUES
    (v_company_id, 'Mudanças regulatórias climáticas','Novas leis de precificação de carbono podem aumentar custos.','Environmental','Alta','Alto'),
    (v_company_id, 'Escassez hídrica regional','Risco de redução de captação na região da Matriz.','Environmental','Média','Alto'),
    (v_company_id, 'Rotatividade de talentos','Pressão salarial e mercado aquecido no setor.','Social','Média','Médio'),
    (v_company_id, 'Não conformidade LGPD','Possíveis falhas no tratamento de dados pessoais.','Governance','Baixa','Alto');

  INSERT INTO public.goals (company_id, name, metric_key, target_value, deadline_date, status) VALUES
    (v_company_id, 'Reduzir emissões Escopo 1 em 20%','emissions_scope1_reduction_pct',20,'2027-12-31','No Caminho Certo'),
    (v_company_id, 'Atingir 30% de mulheres em liderança','women_leadership_pct',30,'2026-12-31','Atenção Necessária'),
    (v_company_id, 'Reduzir consumo de água em 15%','water_consumption_reduction_pct',15,'2027-06-30','No Caminho Certo'),
    (v_company_id, '100% energia renovável','renewable_energy_pct',100,'2030-12-31','No Caminho Certo');

  INSERT INTO public.emission_sources (company_id, name, scope, category) VALUES
    (v_company_id, 'Caldeira a gás natural',1,'Combustão Estacionária'),
    (v_company_id, 'Frota própria de veículos',1,'Combustão Móvel'),
    (v_company_id, 'Eletricidade comprada (rede)',2,'Energia Adquirida'),
    (v_company_id, 'Viagens de negócios',3,'Categoria 6 - Business Travel'),
    (v_company_id, 'Resíduos enviados a aterro',3,'Categoria 5 - Waste');

  INSERT INTO public.energy_consumption_data (company_id, year, period_start_date, period_end_date, energy_source_type, consumption_value, consumption_unit)
  SELECT v_company_id, 2025, make_date(2025,m,1), (make_date(2025,m,1) + interval '1 month - 1 day')::date,
         'Eletricidade (rede)', 12000 + (random()*3000)::numeric(10,2), 'kWh'
  FROM generate_series(1,12) m;

  INSERT INTO public.water_consumption_data (company_id, period_start_date, period_end_date, year, source_type, withdrawal_volume_m3, created_by)
  SELECT v_company_id, make_date(2025,m,1), (make_date(2025,m,1) + interval '1 month - 1 day')::date, 2025,
         'Terceiros - Rede Pública', 350 + (random()*120)::numeric(10,2), v_user_id
  FROM generate_series(1,12) m;

  INSERT INTO public.waste_logs (company_id, mtr_number, waste_description, waste_class, collection_date, quantity, unit) VALUES
    (v_company_id, 'MTR-2026-0001','Lâmpadas fluorescentes','Classe I - Perigoso','2026-01-15',25,'unid'),
    (v_company_id, 'MTR-2026-0002','Sucata metálica','Classe II B - Inerte','2026-02-20',1200,'kg'),
    (v_company_id, 'MTR-2026-0003','Papelão e plástico','Classe II A - Não Inerte','2026-03-05',800,'kg'),
    (v_company_id, 'MTR-2026-0004','Óleo lubrificante usado','Classe I - Perigoso','2026-03-22',200,'L'),
    (v_company_id, 'MTR-2026-0005','Resíduo orgânico','Classe II A - Não Inerte','2026-04-10',450,'kg'),
    (v_company_id, 'MTR-2026-0006','EPIs contaminados','Classe I - Perigoso','2026-04-28',35,'kg');

  INSERT INTO public.esg_metrics (company_id, metric_key, value, period) VALUES
    (v_company_id, 'emissions_scope1_tco2e',185.4,'2025-12-31'),
    (v_company_id, 'emissions_scope2_tco2e',92.7,'2025-12-31'),
    (v_company_id, 'water_consumption_m3',4820.0,'2025-12-31'),
    (v_company_id, 'energy_consumption_kwh',158300.0,'2025-12-31');

  RAISE NOTICE 'Org Demo criada: company=% user=%', v_company_id, v_user_id;
END $$;

ALTER TABLE public.stakeholders ENABLE TRIGGER stakeholder_set_company_id;
