-- Insert test data for non-conformities
INSERT INTO public.non_conformities (
  nc_number,
  title,
  description,
  category,
  severity,
  source,
  detected_date,
  status,
  damage_level,
  company_id
) VALUES 
(
  'NC-20250125-001',
  'Equipamento de segurança com defeito',
  'Detectado mau funcionamento no sistema de alarme do setor de produção, comprometendo a segurança dos colaboradores durante operações críticas.',
  'Segurança',
  'Crítica',
  'Auditoria Interna',
  '2025-01-20',
  'Aberta',
  'Alto',
  (SELECT id FROM public.companies LIMIT 1)
),
(
  'NC-20250125-002', 
  'Documentação desatualizada',
  'Procedimentos operacionais padrão (POPs) encontrados desatualizados na área de qualidade, não refletindo as mudanças recentes no processo.',
  'Qualidade',
  'Média',
  'Cliente',
  '2025-01-18',
  'Em Análise',
  'Médio',
  (SELECT id FROM public.companies LIMIT 1)
),
(
  'NC-20250125-003',
  'Vazamento de fluido refrigerante',
  'Identificado pequeno vazamento no sistema de refrigeração da linha 2, causando perda de eficiência energética.',
  'Ambiental',
  'Alta',
  'Processo',
  '2025-01-15',
  'Em Correção',
  'Médio',
  (SELECT id FROM public.companies LIMIT 1)
),
(
  'NC-20250125-004',
  'Calibração de equipamentos pendente',
  'Equipamentos de medição do laboratório com calibração vencida há 3 meses, podendo afetar a precisão dos resultados.',
  'Qualidade',
  'Alta',
  'Auditoria Interna',
  '2025-01-10',
  'Fechada',
  'Baixo',
  (SELECT id FROM public.companies LIMIT 1)
),
(
  'NC-20250125-005',
  'Treinamento de segurança incompleto',
  'Novos funcionários iniciaram atividades sem completar o treinamento obrigatório de segurança, violando normas internas.',
  'Segurança',
  'Crítica',
  'Fornecedor',
  '2025-01-22',
  'Aberta',
  'Alto',
  (SELECT id FROM public.companies LIMIT 1)
);