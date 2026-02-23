import type {
  MandatoryReading,
  ReadingConfirmation,
  SupplierSurvey,
  SurveyResponse,
} from "@/services/supplierPortalService";

const DEMO_COMPANY_ID = "demo-company-001";

export const supplierPortalDemoCategories = [
  { id: "c-1", name: "Crítico", is_active: true },
  { id: "c-2", name: "Estratégico", is_active: true },
  { id: "c-3", name: "Operacional", is_active: true },
];

export const supplierPortalDemoForms = [
  { id: "form-1", title: "Checklist ESG para Fornecedores", is_active: true },
  { id: "form-2", title: "Pesquisa de Satisfação de Atendimento", is_active: true },
  { id: "form-3", title: "Autoavaliação de Compliance", is_active: true },
];

export const supplierPortalDemoReadings: MandatoryReading[] = [
  {
    id: "mr-1",
    company_id: DEMO_COMPANY_ID,
    title: "Código de Conduta para Fornecedores",
    description: "Diretrizes obrigatórias de ética, compliance e integridade.",
    content: "<h2>Código de Conduta</h2><p>Todos os fornecedores devem aderir às políticas de ética e anticorrupção.</p>",
    file_path: "https://example.com/demo/codigo-conduta.pdf",
    category_id: "c-1",
    is_active: true,
    requires_confirmation: true,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-10T10:00:00Z",
    category: { id: "c-1", name: "Crítico" },
  },
  {
    id: "mr-2",
    company_id: DEMO_COMPANY_ID,
    title: "Política de Segurança e Saúde",
    description: "Regras mínimas de SST para atuação nas unidades da empresa.",
    content: "<h2>SST</h2><p>Uso obrigatório de EPIs e comunicação imediata de incidentes.</p>",
    file_path: null,
    category_id: "c-2",
    is_active: true,
    requires_confirmation: true,
    created_at: "2026-01-12T09:30:00Z",
    updated_at: "2026-01-15T14:20:00Z",
    category: { id: "c-2", name: "Estratégico" },
  },
  {
    id: "mr-3",
    company_id: DEMO_COMPANY_ID,
    title: "Manual de Boas Práticas Ambientais",
    description: "Recomendações de redução de resíduos e consumo de recursos.",
    content: "<h2>Ambiental</h2><p>Priorizar reciclagem e controle de emissões no transporte.</p>",
    file_path: null,
    category_id: "c-3",
    is_active: true,
    requires_confirmation: false,
    created_at: "2026-01-20T11:45:00Z",
    updated_at: "2026-01-20T11:45:00Z",
    category: { id: "c-3", name: "Operacional" },
  },
];

export const supplierPortalDemoReadingConfirmations: Record<string, ReadingConfirmation[]> = {
  "mr-1": [
    {
      id: "rc-1",
      supplier_id: "s-1",
      reading_id: "mr-1",
      confirmed_at: "2026-02-01T09:10:00Z",
      ip_address: "10.20.30.1",
    },
    {
      id: "rc-2",
      supplier_id: "s-2",
      reading_id: "mr-1",
      confirmed_at: "2026-02-03T14:42:00Z",
      ip_address: "10.20.30.2",
    },
  ],
  "mr-2": [
    {
      id: "rc-3",
      supplier_id: "s-3",
      reading_id: "mr-2",
      confirmed_at: "2026-02-05T08:25:00Z",
      ip_address: "10.20.30.3",
    },
  ],
  "mr-3": [
    {
      id: "rc-4",
      supplier_id: "s-5",
      reading_id: "mr-3",
      confirmed_at: "2026-02-06T16:05:00Z",
      ip_address: "10.20.30.4",
    },
  ],
};

export const supplierPortalDemoSurveys: SupplierSurvey[] = [
  {
    id: "sv-1",
    company_id: DEMO_COMPANY_ID,
    title: "Pesquisa de Desempenho Logístico",
    description: "Avaliação trimestral de SLA e comunicação operacional.",
    custom_form_id: "form-1",
    category_id: "c-1",
    is_mandatory: true,
    due_days: 15,
    is_active: true,
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    created_at: "2026-01-28T12:00:00Z",
    updated_at: "2026-01-28T12:00:00Z",
    category: { id: "c-1", name: "Crítico" },
    custom_form: { id: "form-1", title: "Checklist ESG para Fornecedores" },
  },
  {
    id: "sv-2",
    company_id: DEMO_COMPANY_ID,
    title: "Pesquisa de Satisfação no Atendimento",
    description: "Feedback sobre suporte técnico e qualidade de resposta.",
    custom_form_id: "form-2",
    category_id: "c-2",
    is_mandatory: false,
    due_days: 20,
    is_active: true,
    start_date: "2026-02-05",
    end_date: "2026-03-10",
    created_at: "2026-01-29T09:10:00Z",
    updated_at: "2026-01-29T09:10:00Z",
    category: { id: "c-2", name: "Estratégico" },
    custom_form: { id: "form-2", title: "Pesquisa de Satisfação de Atendimento" },
  },
  {
    id: "sv-3",
    company_id: DEMO_COMPANY_ID,
    title: "Autoavaliação de Compliance",
    description: "Levantamento anual de práticas de compliance e LGPD.",
    custom_form_id: "form-3",
    category_id: null,
    is_mandatory: true,
    due_days: 30,
    is_active: true,
    start_date: "2026-02-10",
    end_date: "2026-03-15",
    created_at: "2026-02-01T08:00:00Z",
    updated_at: "2026-02-01T08:00:00Z",
    category: null,
    custom_form: { id: "form-3", title: "Autoavaliação de Compliance" },
  },
];

export const supplierPortalDemoSurveyResponses: Record<string, SurveyResponse[]> = {
  "sv-1": [
    {
      id: "sr-1",
      supplier_id: "s-1",
      survey_id: "sv-1",
      form_submission_id: "fs-1001",
      status: "Concluído",
      started_at: "2026-02-02T10:00:00Z",
      completed_at: "2026-02-02T10:28:00Z",
    },
    {
      id: "sr-2",
      supplier_id: "s-2",
      survey_id: "sv-1",
      form_submission_id: "fs-1002",
      status: "Em Andamento",
      started_at: "2026-02-07T15:10:00Z",
      completed_at: null,
    },
  ],
  "sv-2": [
    {
      id: "sr-3",
      supplier_id: "s-3",
      survey_id: "sv-2",
      form_submission_id: "fs-1003",
      status: "Concluído",
      started_at: "2026-02-08T09:40:00Z",
      completed_at: "2026-02-08T10:05:00Z",
    },
  ],
  "sv-3": [
    {
      id: "sr-4",
      supplier_id: "s-5",
      survey_id: "sv-3",
      form_submission_id: null,
      status: "Pendente",
      started_at: null,
      completed_at: null,
    },
  ],
};
