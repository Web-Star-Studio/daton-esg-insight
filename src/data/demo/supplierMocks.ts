/**
 * Mock data for Supplier Management modules
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const suppliersList = [
  { id: 's-1', company_name: 'EcoTransp Ltda', cnpj: '12.345.678/0001-90', category: 'Transporte', type: 'Serviço', status: 'Ativo', score: 85, city: 'São Paulo', state: 'SP', contact_email: 'contato@ecotransp.com', company_id: DEMO_COMPANY_ID },
  { id: 's-2', company_name: 'Aço Verde S.A.', cnpj: '23.456.789/0001-01', category: 'Matéria-Prima', type: 'Produto', status: 'Ativo', score: 92, city: 'Belo Horizonte', state: 'MG', contact_email: 'vendas@acoverde.com', company_id: DEMO_COMPANY_ID },
  { id: 's-3', company_name: 'TechParts Ind.', cnpj: '34.567.890/0001-12', category: 'Componentes', type: 'Produto', status: 'Ativo', score: 78, city: 'Campinas', state: 'SP', contact_email: 'vendas@techparts.com', company_id: DEMO_COMPANY_ID },
  { id: 's-4', company_name: 'CleanPro Serviços', cnpj: '45.678.901/0001-23', category: 'Limpeza', type: 'Serviço', status: 'Ativo', score: 71, city: 'Rio de Janeiro', state: 'RJ', contact_email: 'orcamento@cleanpro.com', company_id: DEMO_COMPANY_ID },
  { id: 's-5', company_name: 'Embalagens Sustentáveis', cnpj: '56.789.012/0001-34', category: 'Embalagem', type: 'Produto', status: 'Em Avaliação', score: 65, city: 'Curitiba', state: 'PR', contact_email: 'comercial@embsust.com', company_id: DEMO_COMPANY_ID },
  { id: 's-6', company_name: 'Manutenção Industrial BR', cnpj: '67.890.123/0001-45', category: 'Manutenção', type: 'Serviço', status: 'Bloqueado', score: 45, city: 'São Paulo', state: 'SP', contact_email: 'contato@manutbr.com', company_id: DEMO_COMPANY_ID },
];

export const supplierMockEntries = [
  // Supplier dashboard stats
  {
    queryKey: ['supplier-dashboard-stats', DEMO_COMPANY_ID],
    data: {
      totalSuppliers: 47,
      activeSuppliers: 42,
      pendingApproval: 3,
      blockedSuppliers: 2,
      averageScore: 78.5,
      documentsCompliance: 85.2,
      deliveryRate: 92.1,
      failureRate: 4.3,
    },
  },
  // Supplier dashboard stats (base)
  {
    queryKey: ['supplier-dashboard-stats'],
    data: {
      totalSuppliers: 47,
      activeSuppliers: 42,
      pendingApproval: 3,
      blockedSuppliers: 2,
      averageScore: 78.5,
      documentsCompliance: 85.2,
      deliveryRate: 92.1,
      failureRate: 4.3,
    },
  },
  // Suppliers list
  {
    queryKey: ['suppliers', DEMO_COMPANY_ID],
    data: suppliersList,
  },
  // Suppliers (base)
  {
    queryKey: ['suppliers'],
    data: suppliersList,
  },
  // Managed suppliers (flat list for dropdowns)
  {
    queryKey: ['managed-suppliers'],
    data: suppliersList.map(s => ({ id: s.id, company_name: s.company_name, status: s.status })),
  },
  // Supplier types
  {
    queryKey: ['supplier-types', DEMO_COMPANY_ID],
    data: [
      { id: 't-1', name: 'Matéria-Prima', description: 'Fornecedores de insumos primários', supplier_count: 12, company_id: DEMO_COMPANY_ID },
      { id: 't-2', name: 'Serviços', description: 'Prestadores de serviço', supplier_count: 15, company_id: DEMO_COMPANY_ID },
      { id: 't-3', name: 'Componentes', description: 'Componentes e peças', supplier_count: 8, company_id: DEMO_COMPANY_ID },
      { id: 't-4', name: 'Embalagens', description: 'Materiais de embalagem', supplier_count: 5, company_id: DEMO_COMPANY_ID },
      { id: 't-5', name: 'Equipamentos', description: 'Máquinas e equipamentos', supplier_count: 4, company_id: DEMO_COMPANY_ID },
      { id: 't-6', name: 'Transporte', description: 'Logística e frete', supplier_count: 3, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Supplier types (base)
  {
    queryKey: ['supplier-types'],
    data: [
      { id: 't-1', name: 'Matéria-Prima', supplier_count: 12 },
      { id: 't-2', name: 'Serviços', supplier_count: 15 },
      { id: 't-3', name: 'Componentes', supplier_count: 8 },
    ],
  },
  // Delivery stats
  {
    queryKey: ['delivery-stats'],
    data: {
      totalDeliveries: 156,
      onTime: 144,
      late: 12,
      onTimeRate: 92.3,
      avgDelay: 1.8,
      qualityApprovalRate: 96.5,
    },
  },
  // Supplier categories
  {
    queryKey: ['supplier-categories', DEMO_COMPANY_ID],
    data: [
      { id: 'c-1', name: 'Crítico', description: 'Impacto direto na produção', color: '#ef4444', company_id: DEMO_COMPANY_ID },
      { id: 'c-2', name: 'Estratégico', description: 'Parceiros de longo prazo', color: '#f59e0b', company_id: DEMO_COMPANY_ID },
      { id: 'c-3', name: 'Tático', description: 'Substituíveis com esforço moderado', color: '#3b82f6', company_id: DEMO_COMPANY_ID },
      { id: 'c-4', name: 'Commodity', description: 'Facilmente substituíveis', color: '#6b7280', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Supplier categories (base)
  {
    queryKey: ['supplier-categories'],
    data: [
      { id: 'c-1', name: 'Crítico', color: '#ef4444' },
      { id: 'c-2', name: 'Estratégico', color: '#f59e0b' },
      { id: 'c-3', name: 'Tático', color: '#3b82f6' },
    ],
  },
  // Evaluations
  {
    queryKey: ['supplier-evaluations', DEMO_COMPANY_ID],
    data: [
      { id: 'ev-1', supplier_id: 's-1', supplier_name: 'EcoTransp Ltda', evaluation_date: '2026-01-15', overall_score: 85, quality_score: 82, delivery_score: 90, compliance_score: 83, status: 'Concluída' },
      { id: 'ev-2', supplier_id: 's-2', supplier_name: 'Aço Verde S.A.', evaluation_date: '2026-01-20', overall_score: 92, quality_score: 95, delivery_score: 88, compliance_score: 93, status: 'Concluída' },
      { id: 'ev-3', supplier_id: 's-3', supplier_name: 'TechParts Ind.', evaluation_date: '2026-02-01', overall_score: 78, quality_score: 80, delivery_score: 75, compliance_score: 79, status: 'Em Andamento' },
    ],
  },
  // Evaluations (base)
  {
    queryKey: ['supplier-evaluations'],
    data: [
      { id: 'ev-1', supplier_name: 'EcoTransp Ltda', overall_score: 85, status: 'Concluída' },
      { id: 'ev-2', supplier_name: 'Aço Verde S.A.', overall_score: 92, status: 'Concluída' },
    ],
  },
  // Connections
  {
    queryKey: ['supplier-connections', DEMO_COMPANY_ID],
    data: [
      { id: 'con-1', supplier_id: 's-1', status: 'Ativo', connected_since: '2023-06-01', last_delivery: '2026-01-28' },
      { id: 'con-2', supplier_id: 's-2', status: 'Ativo', connected_since: '2022-01-15', last_delivery: '2026-02-05' },
      { id: 'con-3', supplier_id: 's-3', status: 'Ativo', connected_since: '2024-03-10', last_delivery: '2026-01-20' },
    ],
  },
  // Deliveries
  {
    queryKey: ['supplier-deliveries', DEMO_COMPANY_ID],
    data: [
      { id: 'd-1', supplier_id: 's-2', supplier_name: 'Aço Verde S.A.', product: 'Aço Carbono SAE 1020', quantity: 5000, unit: 'kg', delivery_date: '2026-02-05', status: 'Entregue', quality_approved: true },
      { id: 'd-2', supplier_id: 's-1', supplier_name: 'EcoTransp Ltda', product: 'Frete São Paulo-Rio', quantity: 1, unit: 'viagem', delivery_date: '2026-01-28', status: 'Entregue', quality_approved: true },
      { id: 'd-3', supplier_id: 's-3', supplier_name: 'TechParts Ind.', product: 'Rolamentos Industriais', quantity: 200, unit: 'pcs', delivery_date: '2026-02-10', status: 'Em Trânsito', quality_approved: null },
    ],
  },
  // Deliveries (base)
  {
    queryKey: ['supplier-deliveries'],
    data: [
      { id: 'd-1', supplier_name: 'Aço Verde S.A.', product: 'Aço Carbono SAE 1020', status: 'Entregue' },
    ],
  },
  // Failures
  {
    queryKey: ['supplier-failures', DEMO_COMPANY_ID],
    data: [
      { id: 'f-1', supplier_id: 's-6', supplier_name: 'Manutenção Industrial BR', failure_type: 'Qualidade', description: 'Serviço de manutenção com retrabalho', severity: 'Grave', occurrence_date: '2025-12-15', status: 'Investigada', company_id: DEMO_COMPANY_ID },
      { id: 'f-2', supplier_id: 's-4', supplier_name: 'CleanPro Serviços', failure_type: 'Prazo', description: 'Atraso de 3 dias na limpeza programada', severity: 'Menor', occurrence_date: '2026-01-08', status: 'Resolvida', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Failures (base)
  {
    queryKey: ['supplier-failures'],
    data: [
      { id: 'f-1', supplier_name: 'Manutenção Industrial BR', failure_type: 'Qualidade', severity: 'Grave', status: 'Investigada' },
    ],
  },
  // Required documents
  {
    queryKey: ['required-documents', DEMO_COMPANY_ID],
    data: [
      { id: 'rd-1', name: 'CNPJ Atualizado', description: 'Cartão CNPJ emitido nos últimos 90 dias', is_mandatory: true, company_id: DEMO_COMPANY_ID },
      { id: 'rd-2', name: 'Certidão Negativa Federal', description: 'CND da Receita Federal', is_mandatory: true, company_id: DEMO_COMPANY_ID },
      { id: 'rd-3', name: 'Licença Ambiental', description: 'Quando aplicável ao tipo', is_mandatory: false, company_id: DEMO_COMPANY_ID },
      { id: 'rd-4', name: 'ISO 9001', description: 'Certificação de qualidade', is_mandatory: false, company_id: DEMO_COMPANY_ID },
      { id: 'rd-5', name: 'FGTS em Dia', description: 'Certificado de regularidade FGTS', is_mandatory: true, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Required documents (base)
  {
    queryKey: ['required-documents'],
    data: [
      { id: 'rd-1', name: 'CNPJ Atualizado', is_mandatory: true },
      { id: 'rd-2', name: 'Certidão Negativa Federal', is_mandatory: true },
    ],
  },
  // Supplier indicators
  {
    queryKey: ['supplier-indicators', DEMO_COMPANY_ID],
    data: {
      ava1: { label: 'AVA1 - Conformidade Documental', value: 85.2, target: 90, trend: 2.3 },
      ava2: { label: 'AVA2 - Avaliação de Desempenho', value: 78.5, target: 80, trend: 5.1 },
      ext1: { label: 'EXT1 - Participação em Programas', value: 62.3, target: 70, trend: 8.7 },
    },
  },
  // Supplier indicators (base)
  {
    queryKey: ['supplier-indicators'],
    data: {
      ava1: { label: 'AVA1 - Conformidade Documental', value: 85.2, target: 90, trend: 2.3 },
      ava2: { label: 'AVA2 - Avaliação de Desempenho', value: 78.5, target: 80, trend: 5.1 },
    },
  },
  // Evaluation criteria
  {
    queryKey: ['supplier-evaluation-criteria', DEMO_COMPANY_ID],
    data: [
      { id: 'crit-1', name: 'Qualidade do Produto/Serviço', weight: 30, description: 'Avalia a qualidade entregue' },
      { id: 'crit-2', name: 'Pontualidade de Entrega', weight: 25, description: 'Cumprimento de prazos' },
      { id: 'crit-3', name: 'Conformidade Documental', weight: 20, description: 'Documentação em dia' },
      { id: 'crit-4', name: 'Preço e Condições', weight: 15, description: 'Competitividade' },
      { id: 'crit-5', name: 'Sustentabilidade', weight: 10, description: 'Práticas ESG' },
    ],
  },
  // Training materials
  {
    queryKey: ['supplier-training-materials', DEMO_COMPANY_ID],
    data: [
      { id: 'stm-1', title: 'Política de Qualidade', type: 'Documento', status: 'Publicado', created_at: '2025-06-01' },
      { id: 'stm-2', title: 'Código de Conduta do Fornecedor', type: 'Documento', status: 'Publicado', created_at: '2025-01-15' },
      { id: 'stm-3', title: 'Requisitos Ambientais', type: 'Treinamento', status: 'Publicado', created_at: '2025-09-01' },
    ],
  },
];
