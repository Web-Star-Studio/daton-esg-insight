/**
 * Mock data for Data & Reports modules and Document Center
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_DOCUMENT_CENTER_RECORDS = [
  {
    id: 'dc-rec-001',
    company_id: DEMO_COMPANY_ID,
    title: 'Manual da Qualidade v6.0',
    file_name: 'manual-qualidade-v6.0.pdf',
    file_path: 'documents/manual-qualidade-v6.0.pdf',
    file_type: 'application/pdf',
    file_size: 3840000,
    upload_date: '2025-12-01T16:00:00Z',
    tags: ['qualidade', 'manual', 'SGQ', 'ISO 9001'],
    related_model: 'quality_document',
    related_id: 'qd-001',
    uploader_user_id: 'demo-user-1',
    ai_processing_status: null,
    ai_confidence_score: null,
    ai_extracted_category: null,
    summary:
      'Manual principal do Sistema de Gestão da Qualidade, estruturado conforme os requisitos da ISO 9001:2015. Abrange escopo, política, objetivos e processos-chave da organização.',
    document_kind: 'controlled',
    document_domain: 'quality',
    status: 'active',
    branch_ids: ['branch-001', 'branch-002'],
    branches: [
      { branch_id: 'branch-001', code: 'SP01', name: 'Unidade São Paulo' },
      { branch_id: 'branch-002', code: 'RJ01', name: 'Unidade Rio de Janeiro' },
    ],
    current_version_number: 6,
    control_profile: {
      document_id: 'dc-rec-001',
      code: 'MQ-001',
      document_type_label: 'Manual',
      norm_reference: 'ISO 9001:2015',
      issuer_name: 'Departamento de Qualidade',
      confidentiality_level: 'internal',
      validity_start_date: '2025-12-01',
      validity_end_date: '2027-11-30',
      review_due_date: '2026-11-30',
      responsible_department: 'Qualidade',
      controlled_copy: true,
    },
    pending_read_count: 3,
    open_request_count: 0,
    created_at: '2025-12-01T16:00:00Z',
    updated_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 'dc-rec-002',
    company_id: DEMO_COMPANY_ID,
    title: 'PO-003 Controle de Registros',
    file_name: 'po-003-controle-registros.pdf',
    file_path: 'documents/po-003-controle-registros.pdf',
    file_type: 'application/pdf',
    file_size: 680000,
    upload_date: '2025-11-15T10:00:00Z',
    tags: ['procedimento', 'registros', 'controle', 'qualidade'],
    related_model: 'quality_document',
    related_id: 'qd-002',
    uploader_user_id: 'demo-user-1',
    ai_processing_status: null,
    ai_confidence_score: null,
    ai_extracted_category: null,
    summary:
      'Define as diretrizes para identificação, armazenamento, proteção, recuperação, tempo de retenção e disposição dos registros da qualidade.',
    document_kind: 'controlled',
    document_domain: 'quality',
    status: 'active',
    branch_ids: ['branch-001'],
    branches: [
      { branch_id: 'branch-001', code: 'SP01', name: 'Unidade São Paulo' },
    ],
    current_version_number: 3,
    control_profile: {
      document_id: 'dc-rec-002',
      code: 'PO-003',
      document_type_label: 'Procedimento',
      norm_reference: 'ISO 9001:2015 — Cláusula 7.5',
      issuer_name: 'Departamento de Qualidade',
      confidentiality_level: 'internal',
      validity_start_date: '2025-11-15',
      validity_end_date: '2027-11-14',
      review_due_date: '2026-11-14',
      responsible_department: 'Qualidade',
      controlled_copy: false,
    },
    pending_read_count: 0,
    open_request_count: 1,
    created_at: '2025-11-15T10:00:00Z',
    updated_at: '2025-11-20T14:00:00Z',
  },
  {
    id: 'dc-rec-003',
    company_id: DEMO_COMPANY_ID,
    title: 'IT-015 Inspeção de Recebimento',
    file_name: 'it-015-inspecao-recebimento.pdf',
    file_path: 'documents/it-015-inspecao-recebimento.pdf',
    file_type: 'application/pdf',
    file_size: 420000,
    upload_date: '2025-10-08T09:00:00Z',
    tags: ['instrução de trabalho', 'inspeção', 'recebimento', 'qualidade'],
    related_model: 'quality_document',
    related_id: 'qd-003',
    uploader_user_id: 'demo-user-1',
    ai_processing_status: null,
    ai_confidence_score: null,
    ai_extracted_category: null,
    summary:
      'Instrução detalhada para execução da inspeção de recebimento de materiais e insumos, incluindo critérios de aceitação e rejeição por lote.',
    document_kind: 'controlled',
    document_domain: 'quality',
    status: 'in_review',
    branch_ids: ['branch-001', 'branch-003'],
    branches: [
      { branch_id: 'branch-001', code: 'SP01', name: 'Unidade São Paulo' },
      { branch_id: 'branch-003', code: 'MG01', name: 'Unidade Belo Horizonte' },
    ],
    current_version_number: 2,
    control_profile: {
      document_id: 'dc-rec-003',
      code: 'IT-015',
      document_type_label: 'Instrucao de Trabalho',
      norm_reference: 'ISO 9001:2015 — Cláusula 8.4',
      issuer_name: 'Departamento de Qualidade',
      confidentiality_level: 'internal',
      validity_start_date: '2025-10-08',
      validity_end_date: '2026-10-07',
      review_due_date: '2026-04-07',
      responsible_department: 'Qualidade / Logística',
      controlled_copy: true,
    },
    pending_read_count: 5,
    open_request_count: 0,
    created_at: '2025-10-08T09:00:00Z',
    updated_at: '2026-01-25T11:00:00Z',
  },
  {
    id: 'dc-rec-004',
    company_id: DEMO_COMPANY_ID,
    title: 'Política Ambiental 2026',
    file_name: 'politica-ambiental-2026.pdf',
    file_path: 'documents/politica-ambiental-2026.pdf',
    file_type: 'application/pdf',
    file_size: 295000,
    upload_date: '2026-01-05T08:00:00Z',
    tags: ['política', 'ambiental', 'ISO 14001', 'sustentabilidade'],
    related_model: 'document',
    related_id: 'gen-004',
    uploader_user_id: 'demo-user-1',
    ai_processing_status: null,
    ai_confidence_score: null,
    ai_extracted_category: null,
    summary:
      'Declaração formal dos compromissos ambientais da empresa para 2026, incluindo metas de redução de emissões, gestão de resíduos e uso racional de recursos naturais.',
    document_kind: 'general',
    document_domain: 'regulatory',
    status: 'active',
    branch_ids: ['branch-001', 'branch-002', 'branch-003'],
    branches: [
      { branch_id: 'branch-001', code: 'SP01', name: 'Unidade São Paulo' },
      { branch_id: 'branch-002', code: 'RJ01', name: 'Unidade Rio de Janeiro' },
      { branch_id: 'branch-003', code: 'MG01', name: 'Unidade Belo Horizonte' },
    ],
    current_version_number: 1,
    control_profile: null,
    pending_read_count: 0,
    open_request_count: 0,
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-01-07T10:00:00Z',
  },
  {
    id: 'dc-rec-005',
    company_id: DEMO_COMPANY_ID,
    title: 'Procedimento de Emergência Ambiental',
    file_name: 'proc-emergencia-ambiental.pdf',
    file_path: 'documents/proc-emergencia-ambiental.pdf',
    file_type: 'application/pdf',
    file_size: 910000,
    upload_date: '2025-09-20T13:00:00Z',
    tags: ['emergência', 'ambiental', 'plano de ação', 'resposta', 'ISO 14001'],
    related_model: 'quality_document',
    related_id: 'qd-005',
    uploader_user_id: 'demo-user-1',
    ai_processing_status: null,
    ai_confidence_score: null,
    ai_extracted_category: null,
    summary:
      'Procedimento operacional para resposta a situações de emergência ambiental, incluindo derramamentos, vazamentos e emissões não controladas. Define responsabilidades, fluxo de comunicação e ações de contenção.',
    document_kind: 'controlled',
    document_domain: 'regulatory',
    status: 'active',
    branch_ids: ['branch-001', 'branch-002'],
    branches: [
      { branch_id: 'branch-001', code: 'SP01', name: 'Unidade São Paulo' },
      { branch_id: 'branch-002', code: 'RJ01', name: 'Unidade Rio de Janeiro' },
    ],
    current_version_number: 4,
    control_profile: {
      document_id: 'dc-rec-005',
      code: 'PSG-010',
      document_type_label: 'Procedimento',
      norm_reference: 'ISO 14001:2015 — Cláusula 8.2',
      issuer_name: 'Departamento de Meio Ambiente',
      confidentiality_level: 'internal',
      validity_start_date: '2025-09-20',
      validity_end_date: '2027-09-19',
      review_due_date: '2026-09-19',
      responsible_department: 'Meio Ambiente',
      controlled_copy: true,
    },
    pending_read_count: 2,
    open_request_count: 1,
    created_at: '2025-09-20T13:00:00Z',
    updated_at: '2026-02-05T16:00:00Z',
  },
];

export const dataReportsMockEntries = [
  // Data collection tasks
  {
    queryKey: ['data-collection-tasks', DEMO_COMPANY_ID],
    data: [
      { id: 'dc-1', name: 'Coleta Mensal de Consumo de Água', description: 'Registrar consumo de água de todas as unidades', status: 'Pendente', task_type: 'Mensal', due_date: '2026-02-28', assigned_to: 'Carlos Santos', company_id: DEMO_COMPANY_ID },
      { id: 'dc-2', name: 'Inventário de Resíduos Q1', description: 'Consolidar dados de resíduos do trimestre', status: 'Em Andamento', task_type: 'Trimestral', due_date: '2026-03-31', assigned_to: 'Carlos Santos', company_id: DEMO_COMPANY_ID },
      { id: 'dc-3', name: 'Dados de Emissão Fev/26', description: 'Registrar dados de combustíveis e energia', status: 'Pendente', task_type: 'Mensal', due_date: '2026-03-10', assigned_to: 'Ana Silva', company_id: DEMO_COMPANY_ID },
      { id: 'dc-4', name: 'Indicadores Sociais 2025', description: 'Consolidar dados de RH para relatório anual', status: 'Concluída', task_type: 'Anual', due_date: '2026-01-31', assigned_to: 'Mariana Costa', company_id: DEMO_COMPANY_ID },
      { id: 'dc-5', name: 'Dados Financeiros ESG', description: 'Classificar despesas por categoria ESG', status: 'Em Atraso', task_type: 'Mensal', due_date: '2026-02-05', assigned_to: 'Juliana Lima', company_id: DEMO_COMPANY_ID },
    ],
  },
  // Data collection tasks (base - global)
  {
    queryKey: ['data-collection-tasks'],
    data: [
      { id: 'dc-1', name: 'Coleta Mensal de Consumo de Água', status: 'Pendente', task_type: 'Mensal', due_date: '2026-02-28', assigned_to: 'Carlos Santos' },
      { id: 'dc-2', name: 'Inventário de Resíduos Q1', status: 'Em Andamento', task_type: 'Trimestral', due_date: '2026-03-31', assigned_to: 'Carlos Santos' },
      { id: 'dc-3', name: 'Dados de Emissão Fev/26', status: 'Pendente', task_type: 'Mensal', due_date: '2026-03-10', assigned_to: 'Ana Silva' },
    ],
  },
  // Import jobs
  {
    queryKey: ['import-jobs'],
    data: [
      { id: 'ij-1', file_name: 'emissoes_2025.xlsx', status: 'Concluído', records_imported: 145, errors: 0, created_at: '2026-01-20T10:00:00Z', type: 'Emissões' },
      { id: 'ij-2', file_name: 'funcionarios_jan26.csv', status: 'Concluído', records_imported: 342, errors: 2, created_at: '2026-02-01T14:30:00Z', type: 'Funcionários' },
      { id: 'ij-3', file_name: 'residuos_q4.xlsx', status: 'Erro', records_imported: 0, errors: 5, created_at: '2026-02-05T09:00:00Z', type: 'Resíduos' },
    ],
  },
  // Documents
  {
    queryKey: ['documents', DEMO_COMPANY_ID],
    data: [
      { id: 'doc-1', file_name: 'Relatório de Sustentabilidade 2025.pdf', file_type: 'application/pdf', file_size: 2500000, upload_date: '2026-01-15T10:00:00Z', tags: ['relatório', 'sustentabilidade', '2025'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-2', file_name: 'Inventário GEE 2025.xlsx', file_type: 'application/xlsx', file_size: 450000, upload_date: '2026-01-20T14:30:00Z', tags: ['emissões', 'GEE', 'inventário'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-3', file_name: 'Licença de Operação - LO-2024-001.pdf', file_type: 'application/pdf', file_size: 800000, upload_date: '2024-01-15T09:00:00Z', tags: ['licença', 'operação', 'ambiental'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-4', file_name: 'Manual SGQ v6.0.pdf', file_type: 'application/pdf', file_size: 3200000, upload_date: '2025-12-01T16:00:00Z', tags: ['qualidade', 'manual', 'SGQ'], company_id: DEMO_COMPANY_ID },
      { id: 'doc-5', file_name: 'Política Ambiental 2026.pdf', file_type: 'application/pdf', file_size: 320000, upload_date: '2026-01-05T08:00:00Z', tags: ['política', 'ambiental'], company_id: DEMO_COMPANY_ID },
    ],
  },
  // Documents (base)
  {
    queryKey: ['documents'],
    data: [
      { id: 'doc-1', file_name: 'Relatório de Sustentabilidade 2025.pdf', file_type: 'application/pdf' },
      { id: 'doc-2', file_name: 'Inventário GEE 2025.xlsx', file_type: 'application/xlsx' },
    ],
  },
  // Document extractions
  {
    queryKey: ['documents', 'extractions', DEMO_COMPANY_ID],
    data: [
      {
        id: 'ext-1',
        document_id: 'doc-1',
        document_name: 'Relatório de Sustentabilidade 2025.pdf',
        status: 'approved',
        confidence: 0.96,
        extracted_at: '2026-02-01T10:10:00Z',
        fields_extracted: 28,
      },
      {
        id: 'ext-2',
        document_id: 'doc-2',
        document_name: 'Inventário GEE 2025.xlsx',
        status: 'processing',
        confidence: 0.89,
        extracted_at: '2026-02-06T14:30:00Z',
        fields_extracted: 17,
      },
    ],
  },
  // Document extractions (base)
  {
    queryKey: ['documents', 'extractions'],
    data: [
      {
        id: 'ext-1',
        document_id: 'doc-1',
        document_name: 'Relatório de Sustentabilidade 2025.pdf',
        status: 'approved',
        confidence: 0.96,
        extracted_at: '2026-02-01T10:10:00Z',
        fields_extracted: 28,
      },
      {
        id: 'ext-2',
        document_id: 'doc-2',
        document_name: 'Inventário GEE 2025.xlsx',
        status: 'processing',
        confidence: 0.89,
        extracted_at: '2026-02-06T14:30:00Z',
        fields_extracted: 17,
      },
    ],
  },
  // Integrated reports
  {
    queryKey: ['integrated-reports', DEMO_COMPANY_ID],
    data: [
      { id: 'ir-1', title: 'Relatório de Sustentabilidade 2025', framework: 'GRI Standards', status: 'Publicado', completion_percentage: 100, year: 2025, company_id: DEMO_COMPANY_ID },
      { id: 'ir-2', title: 'Relatório ESG Q3 2025', framework: 'SASB', status: 'Em Elaboração', completion_percentage: 45, year: 2025, company_id: DEMO_COMPANY_ID },
      { id: 'ir-3', title: 'Inventário GEE 2025', framework: 'GHG Protocol', status: 'Em Revisão', completion_percentage: 85, year: 2025, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Integrated reports (base)
  {
    queryKey: ['integrated-reports'],
    data: [
      { id: 'ir-1', title: 'Relatório de Sustentabilidade 2025', framework: 'GRI Standards', status: 'Publicado', completion_percentage: 100 },
    ],
  },
  // SDG Dashboard
  {
    queryKey: ['sdg-contributions', DEMO_COMPANY_ID],
    data: [
      { sdg: 6, name: 'Água Potável e Saneamento', contribution: 72, actions: 5 },
      { sdg: 7, name: 'Energia Limpa e Acessível', contribution: 45, actions: 3 },
      { sdg: 8, name: 'Trabalho Decente', contribution: 85, actions: 8 },
      { sdg: 12, name: 'Consumo e Produção Responsáveis', contribution: 68, actions: 6 },
      { sdg: 13, name: 'Ação Contra a Mudança Global do Clima', contribution: 58, actions: 7 },
      { sdg: 15, name: 'Vida Terrestre', contribution: 42, actions: 3 },
    ],
  },
  // SDG (base)
  {
    queryKey: ['sdg-contributions'],
    data: [
      { sdg: 6, name: 'Água Potável e Saneamento', contribution: 72, actions: 5 },
      { sdg: 8, name: 'Trabalho Decente', contribution: 85, actions: 8 },
      { sdg: 13, name: 'Ação Contra a Mudança Global do Clima', contribution: 58, actions: 7 },
    ],
  },
  // Recommended indicators
  {
    queryKey: ['recommended-indicators', DEMO_COMPANY_ID],
    data: [
      { id: 'ri-1', code: 'GRI 305-1', name: 'Emissões Diretas (Escopo 1)', value: 485.3, unit: 'tCO2e', benchmark: 520, status: 'Abaixo da Média' },
      { id: 'ri-2', code: 'GRI 302-1', name: 'Consumo de Energia', value: 4520, unit: 'MWh', benchmark: 4800, status: 'Abaixo da Média' },
      { id: 'ri-3', code: 'GRI 303-3', name: 'Captação de Água', value: 12450, unit: 'm³', benchmark: 15000, status: 'Abaixo da Média' },
      { id: 'ri-4', code: 'GRI 403-9', name: 'Acidentes de Trabalho', value: 3, unit: 'incidentes', benchmark: 5, status: 'Abaixo da Média' },
      { id: 'ri-5', code: 'GRI 404-1', name: 'Horas de Treinamento', value: 42, unit: 'h/func', benchmark: 40, status: 'Acima da Média' },
    ],
  },
  // Recommended indicators (base)
  {
    queryKey: ['recommended-indicators'],
    data: [
      { id: 'ri-1', code: 'GRI 305-1', name: 'Emissões Diretas (Escopo 1)', value: 485.3, unit: 'tCO2e' },
    ],
  },
  // Assets
  {
    queryKey: ['assets', DEMO_COMPANY_ID],
    data: [
      { id: 'a-1', name: 'Linha de Produção A', asset_type: 'Equipamento', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2018, company_id: DEMO_COMPANY_ID },
      { id: 'a-2', name: 'Caldeira Industrial', asset_type: 'Equipamento', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2020, company_id: DEMO_COMPANY_ID },
      { id: 'a-3', name: 'Sistema de Tratamento de Efluentes', asset_type: 'Infraestrutura', location: 'Unidade SP', operational_status: 'Operacional', installation_year: 2019, company_id: DEMO_COMPANY_ID },
      { id: 'a-4', name: 'Frota de Caminhões (5 veículos)', asset_type: 'Veículo', location: 'CD Rio', operational_status: 'Operacional', installation_year: 2022, company_id: DEMO_COMPANY_ID },
    ],
  },
  // Assets (base)
  {
    queryKey: ['assets'],
    data: [
      { id: 'a-1', name: 'Linha de Produção A', asset_type: 'Equipamento', operational_status: 'Operacional' },
    ],
  },
  // Document Center — prefix match covers ['document-center', filtersObject]
  {
    queryKey: ['document-center'],
    data: DEMO_DOCUMENT_CENTER_RECORDS,
  },
];
