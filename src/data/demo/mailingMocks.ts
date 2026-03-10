/**
 * Mock data for Mailing (Listas de Envio) module
 */

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_CONTACTS_LIST_1 = [
  {
    id: 'contact-101',
    mailing_list_id: 'ml-001',
    email: 'marcos.ferreira@greenlogistica.com.br',
    name: 'Marcos Ferreira',
    company_name: 'Green Logística Ltda',
    phone: '(11) 98765-4321',
    status: 'active',
    created_at: '2025-09-10T08:30:00Z',
  },
  {
    id: 'contact-102',
    mailing_list_id: 'ml-001',
    email: 'carla.mendonca@rh.demo.com',
    name: 'Carla Mendonça',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 97654-3210',
    status: 'active',
    created_at: '2025-09-12T10:00:00Z',
  },
  {
    id: 'contact-103',
    mailing_list_id: 'ml-001',
    email: 'jorge.prado@intranet.demo.com',
    name: 'Jorge Prado',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 96543-2109',
    status: 'active',
    created_at: '2025-09-15T09:00:00Z',
  },
  {
    id: 'contact-104',
    mailing_list_id: 'ml-001',
    email: 'patricia.souza@intranet.demo.com',
    name: 'Patrícia Souza',
    company_name: 'Demo Indústria S.A.',
    phone: '(21) 99887-6655',
    status: 'active',
    created_at: '2025-10-01T11:00:00Z',
  },
  {
    id: 'contact-105',
    mailing_list_id: 'ml-001',
    email: 'rodrigo.assis@antigo.demo.com',
    name: 'Rodrigo Assis',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 95432-1098',
    status: 'bounced',
    created_at: '2025-08-20T14:00:00Z',
  },
];

const DEMO_CONTACTS_LIST_2 = [
  {
    id: 'contact-201',
    mailing_list_id: 'ml-002',
    email: 'compras@embalagens-rapido.com.br',
    name: 'Fernanda Castro',
    company_name: 'Embalagens Rápido Ltda',
    phone: '(19) 99123-4567',
    status: 'active',
    created_at: '2025-07-05T09:00:00Z',
  },
  {
    id: 'contact-202',
    mailing_list_id: 'ml-002',
    email: 'qualidade@acobrasil.ind.br',
    name: 'Sérgio Nunes',
    company_name: 'Aço Brasil Indústria',
    phone: '(11) 94567-8901',
    status: 'active',
    created_at: '2025-07-08T10:30:00Z',
  },
  {
    id: 'contact-203',
    mailing_list_id: 'ml-002',
    email: 'contato@plasticospro.com.br',
    name: 'Viviane Ribeiro',
    company_name: 'Plásticos Pro S.A.',
    phone: '(31) 98765-0001',
    status: 'active',
    created_at: '2025-07-15T08:45:00Z',
  },
  {
    id: 'contact-204',
    mailing_list_id: 'ml-002',
    email: 'sac@transportescesar.com.br',
    name: 'Eduardo César',
    company_name: 'Transportes César Ltda',
    phone: '(21) 99001-2233',
    status: 'unsubscribed',
    created_at: '2025-06-10T12:00:00Z',
  },
  {
    id: 'contact-205',
    mailing_list_id: 'ml-002',
    email: 'meio.ambiente@frigorificovalor.com.br',
    name: 'Helena Batista',
    company_name: 'Frigorífico Valor S.A.',
    phone: '(65) 98877-6655',
    status: 'active',
    created_at: '2025-08-02T11:20:00Z',
  },
  {
    id: 'contact-206',
    mailing_list_id: 'ml-002',
    email: 'qualidade@painisdelta.com.br',
    name: 'Ricardo Teles',
    company_name: 'Painéis Delta Ind.',
    phone: '(41) 97766-5544',
    status: 'active',
    created_at: '2025-08-18T09:00:00Z',
  },
];

const DEMO_CONTACTS_LIST_3 = [
  {
    id: 'contact-301',
    mailing_list_id: 'ml-003',
    email: 'ongs@institutoverde.org.br',
    name: 'Ana Beatriz Lima',
    company_name: 'Instituto Verde Vivo',
    phone: '(11) 97001-8090',
    status: 'active',
    created_at: '2025-05-20T10:00:00Z',
  },
  {
    id: 'contact-302',
    mailing_list_id: 'ml-003',
    email: 'relacionamento@prefeitura-sp.gov.br',
    name: 'Carlos Eduardo Rocha',
    company_name: 'Prefeitura Municipal de São Paulo',
    phone: '(11) 3113-1113',
    status: 'active',
    created_at: '2025-05-22T14:00:00Z',
  },
  {
    id: 'contact-303',
    mailing_list_id: 'ml-003',
    email: 'ri@fundoacaoesg.com.br',
    name: 'Mariana Gomes',
    company_name: 'Fundo de Ação ESG',
    phone: '(11) 98888-7777',
    status: 'active',
    created_at: '2025-06-01T09:30:00Z',
  },
  {
    id: 'contact-304',
    mailing_list_id: 'ml-003',
    email: 'imprensa@grupomidiaresponsavel.com.br',
    name: 'Thiago Barbosa',
    company_name: 'Grupo Mídia Responsável',
    phone: '(11) 93322-1100',
    status: 'active',
    created_at: '2025-06-10T08:00:00Z',
  },
  {
    id: 'contact-305',
    mailing_list_id: 'ml-003',
    email: 'sustentabilidade@bancoverde.com.br',
    name: 'Isabela Monteiro',
    company_name: 'Banco Verde S.A.',
    phone: '(11) 99001-4455',
    status: 'active',
    created_at: '2025-06-15T13:00:00Z',
  },
];

const DEMO_CONTACTS_LIST_4 = [
  {
    id: 'contact-401',
    mailing_list_id: 'ml-004',
    email: 'roberto.oliveira@intranet.demo.com',
    name: 'Roberto Oliveira',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 99444-0004',
    status: 'active',
    created_at: '2025-11-01T09:00:00Z',
  },
  {
    id: 'contact-402',
    mailing_list_id: 'ml-004',
    email: 'ana.silva@intranet.demo.com',
    name: 'Ana Silva',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 99111-0001',
    status: 'active',
    created_at: '2025-11-01T09:00:00Z',
  },
  {
    id: 'contact-403',
    mailing_list_id: 'ml-004',
    email: 'pedro.almeida@intranet.demo.com',
    name: 'Pedro Almeida',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 99666-0006',
    status: 'active',
    created_at: '2025-11-05T10:00:00Z',
  },
  {
    id: 'contact-404',
    mailing_list_id: 'ml-004',
    email: 'lucas.mendes@intranet.demo.com',
    name: 'Lucas Mendes',
    company_name: 'Demo Indústria S.A.',
    phone: '(11) 99888-0008',
    status: 'active',
    created_at: '2025-11-05T10:00:00Z',
  },
];

const DEMO_MAILING_LISTS = [
  {
    id: 'ml-001',
    name: 'Comunicados Internos',
    description: 'Lista para comunicados gerais e institucionais direcionados a colaboradores internos.',
    company_id: DEMO_COMPANY_ID,
    created_by_user_id: 'demo-user-1',
    created_at: '2025-09-10T08:00:00Z',
    updated_at: '2026-02-15T10:00:00Z',
    contact_count: DEMO_CONTACTS_LIST_1.length,
    form_count: 2,
    contacts: DEMO_CONTACTS_LIST_1,
    forms: [
      { id: 'form-001', title: 'Pesquisa de Satisfação' },
      { id: 'form-002', title: 'Checklist NR-12' },
    ],
  },
  {
    id: 'ml-002',
    name: 'Fornecedores Ativos',
    description: 'Fornecedores homologados para envio de formulários de avaliação e conformidade ESG.',
    company_id: DEMO_COMPANY_ID,
    created_by_user_id: 'demo-user-1',
    created_at: '2025-07-01T10:00:00Z',
    updated_at: '2026-01-20T14:00:00Z',
    contact_count: DEMO_CONTACTS_LIST_2.length,
    form_count: 1,
    contacts: DEMO_CONTACTS_LIST_2,
    forms: [
      { id: 'form-003', title: 'Avaliação de Fornecedor' },
    ],
  },
  {
    id: 'ml-003',
    name: 'Partes Interessadas ESG',
    description: 'Stakeholders externos: ONGs, órgãos públicos, investidores e mídia especializada.',
    company_id: DEMO_COMPANY_ID,
    created_by_user_id: 'demo-user-1',
    created_at: '2025-05-15T09:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
    contact_count: DEMO_CONTACTS_LIST_3.length,
    form_count: 1,
    contacts: DEMO_CONTACTS_LIST_3,
    forms: [
      { id: 'form-004', title: 'Formulário de Inspeção Ambiental' },
    ],
  },
  {
    id: 'ml-004',
    name: 'Equipe de Segurança',
    description: 'Colaboradores do setor SST para envio de checklists, treinamentos e notificações de emergência.',
    company_id: DEMO_COMPANY_ID,
    created_by_user_id: 'demo-user-1',
    created_at: '2025-11-01T08:00:00Z',
    updated_at: '2026-02-20T11:00:00Z',
    contact_count: DEMO_CONTACTS_LIST_4.length,
    form_count: 1,
    contacts: DEMO_CONTACTS_LIST_4,
    forms: [
      { id: 'form-002', title: 'Checklist NR-12' },
    ],
  },
];

const DEMO_MAILING_FORMS = [
  { id: 'form-001', title: 'Pesquisa de Satisfação' },
  { id: 'form-002', title: 'Checklist NR-12' },
  { id: 'form-003', title: 'Avaliação de Fornecedor' },
  { id: 'form-004', title: 'Formulário de Inspeção Ambiental' },
];

const DEMO_EMAIL_TEMPLATES = [
  {
    id: 'tmpl-001',
    name: 'Comunicado Corporativo Padrão',
    subject: 'Comunicado Importante - {{empresa}}',
    body_html:
      '<h2>Comunicado</h2><p>Prezado(a) {{nome}},</p><p>Gostaríamos de compartilhar informações importantes sobre {{assunto}}.</p><p>Por favor, acesse o formulário abaixo para registrar sua participação.</p>',
    category: 'Interno',
    created_at: '2025-08-01T10:00:00Z',
  },
  {
    id: 'tmpl-002',
    name: 'Avaliação de Fornecedor ESG',
    subject: 'Avaliação de Conformidade ESG {{ano}} - Ação Necessária',
    body_html:
      '<h2>Avaliação de Fornecedor ESG {{ano}}</h2><p>Prezado(a) {{nome}},</p><p>Como parte de nosso programa de sustentabilidade, solicitamos o preenchimento do formulário de avaliação ESG referente ao exercício {{ano}}.</p><p>O prazo para resposta é <strong>{{prazo}}</strong>.</p>',
    category: 'Fornecedores',
    created_at: '2025-09-05T09:00:00Z',
  },
  {
    id: 'tmpl-003',
    name: 'Checklist de Segurança Periódico',
    subject: 'Checklist de Segurança - Preenchimento Obrigatório',
    body_html:
      '<h2>Checklist de Segurança</h2><p>Olá, {{nome}},</p><p>Conforme determinado pelo setor SST, é necessário o preenchimento do checklist de segurança até {{prazo}}.</p><p>Sua participação é obrigatória para conformidade com as normas NR vigentes.</p>',
    category: 'SST',
    created_at: '2025-10-12T08:00:00Z',
  },
  {
    id: 'tmpl-004',
    name: 'Relatório ESG para Partes Interessadas',
    subject: 'Relatório de Sustentabilidade {{ano}} - Demo Indústria S.A.',
    body_html:
      '<h2>Relatório de Sustentabilidade {{ano}}</h2><p>Prezado(a) {{nome}},</p><p>É com satisfação que compartilhamos nosso Relatório de Sustentabilidade referente ao exercício {{ano}}, elaborado conforme os padrões GRI Standards.</p><p>Agradecemos sua participação como parte interessada em nossa jornada ESG.</p>',
    category: 'ESG',
    created_at: '2025-11-20T11:00:00Z',
  },
];

export const mailingMockEntries = [
  // Mailing lists
  {
    queryKey: ['mailing-lists'],
    data: DEMO_MAILING_LISTS.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      company_id: list.company_id,
      created_by_user_id: list.created_by_user_id,
      created_at: list.created_at,
      updated_at: list.updated_at,
      contact_count: list.contact_count,
      form_count: list.form_count,
    })),
  },
  // Mailing list details — prefix match covers ['mailing-list-details', anyId]
  {
    queryKey: ['mailing-list-details'],
    data: DEMO_MAILING_LISTS[0],
  },
  {
    queryKey: ['mailing-list-details', 'ml-001'],
    data: DEMO_MAILING_LISTS[0],
  },
  {
    queryKey: ['mailing-list-details', 'ml-002'],
    data: DEMO_MAILING_LISTS[1],
  },
  {
    queryKey: ['mailing-list-details', 'ml-003'],
    data: DEMO_MAILING_LISTS[2],
  },
  {
    queryKey: ['mailing-list-details', 'ml-004'],
    data: DEMO_MAILING_LISTS[3],
  },
  // Mailing forms
  {
    queryKey: ['mailing-forms'],
    data: DEMO_MAILING_FORMS,
  },
  // CSV import template
  {
    queryKey: ['csv-template'],
    data: 'NOME,CONTATO,EMAIL\n',
  },
  // Email templates
  {
    queryKey: ['mailing-templates'],
    data: DEMO_EMAIL_TEMPLATES,
  },
  // Company logo (no logo in demo)
  {
    queryKey: ['company-logo'],
    data: { logo_url: null },
  },
];
