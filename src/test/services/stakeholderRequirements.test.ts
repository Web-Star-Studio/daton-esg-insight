import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { stakeholderRequirementsService } from "@/services/stakeholderRequirements";

type Recorder = Record<string, any>;

const createAwaitableBuilder = (result: any, recorder: Recorder = {}) => {
  const builder: any = {};
  const chainableMethods = ["select", "eq", "neq", "lt", "lte", "order", "in", "insert", "update"];

  chainableMethods.forEach((method) => {
    builder[method] = vi.fn().mockImplementation((...args: any[]) => {
      recorder[method] = recorder[method] || [];
      recorder[method].push(args);

      if (method === "insert" || method === "update") {
        recorder.payload = args[0];
      }

      return builder;
    });
  });

  builder.single = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  builder.then = (onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) =>
    Promise.resolve(result).then(onFulfilled, onRejected);

  return { builder, recorder };
};

describe("stakeholderRequirementsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lista requisitos aplicando filtros e enriquecendo evidências", async () => {
    const profileQuery = createAwaitableBuilder({
      data: { company_id: "company-1" },
      error: null,
    });
    const requirementQuery = createAwaitableBuilder(
      {
        data: [
          {
            id: "req-1",
            company_id: "company-1",
            stakeholder_id: "stake-1",
            iso_standard: "ISO_9001",
            iso_clause: "4.2",
            requirement_title: "Monitorar demanda contratual",
            requirement_description: "Manter análise trimestral",
            monitoring_method: "Checklist",
            is_legal_requirement: true,
            is_relevant_to_sgq: true,
            status: "em_atendimento",
            responsible_user_id: "user-2",
            linked_compliance_task_id: null,
            last_checked_at: null,
            review_due_date: "2026-03-20",
            source_reference: "Contrato 9",
            created_by_user_id: "user-1",
            created_at: "2026-03-01T10:00:00Z",
            updated_at: "2026-03-02T10:00:00Z",
            stakeholder: {
              id: "stake-1",
              name: "Cliente Âncora",
              category: "customers",
              organization: "Empresa A",
            },
            responsible: {
              id: "user-2",
              full_name: "Maria Silva",
            },
            linked_task: null,
            created_by: {
              id: "user-1",
              full_name: "Autor",
            },
          },
        ],
        error: null,
      },
      {},
    );
    const evidenceQuery = createAwaitableBuilder({
      data: [
        { stakeholder_requirement_id: "req-1" },
        { stakeholder_requirement_id: "req-1" },
      ],
      error: null,
    });

    vi.mocked(supabase.from)
      .mockReturnValueOnce(profileQuery.builder)
      .mockReturnValueOnce(requirementQuery.builder)
      .mockReturnValueOnce(evidenceQuery.builder);

    const result = await stakeholderRequirementsService.getStakeholderRequirements({
      status: "em_atendimento",
      responsible_user_id: "user-2",
      stakeholder_id: "stake-1",
      legal_requirement: "yes",
      due_within_days: 30,
    });

    expect(result).toHaveLength(1);
    expect(result[0].evidence_count).toBe(2);
    expect(result[0].is_overdue).toBe(false);
    expect(result[0].days_until_review).toBeGreaterThan(0);
    expect(requirementQuery.recorder.eq).toEqual(
      expect.arrayContaining([
        ["company_id", "company-1"],
        ["status", "em_atendimento"],
        ["responsible_user_id", "user-2"],
        ["stakeholder_id", "stake-1"],
        ["is_legal_requirement", true],
      ]),
    );
    expect(requirementQuery.recorder.neq).toEqual(expect.arrayContaining([["status", "atendido"]]));
    expect(evidenceQuery.recorder.eq).toEqual(expect.arrayContaining([["company_id", "company-1"]]));
  });

  it("cria requisito aplicando defaults normativos e normalização de opcionais", async () => {
    const profileQuery = createAwaitableBuilder({
      data: { company_id: "company-1" },
      error: null,
    });
    const createQuery = createAwaitableBuilder(
      {
        data: {
          id: "req-2",
          company_id: "company-1",
          stakeholder_id: "stake-9",
          iso_standard: "ISO_9001",
          iso_clause: "4.2",
          requirement_title: "Exigir resposta formal",
          requirement_description: null,
          monitoring_method: null,
          is_legal_requirement: false,
          is_relevant_to_sgq: true,
          status: "nao_iniciado",
          responsible_user_id: null,
          linked_compliance_task_id: null,
          last_checked_at: null,
          review_due_date: "2026-04-10",
          source_reference: null,
          created_by_user_id: "user-1",
          created_at: "2026-03-05T10:00:00Z",
          updated_at: "2026-03-05T10:00:00Z",
        },
        error: null,
      },
      {},
    );

    vi.mocked(supabase.from)
      .mockReturnValueOnce(profileQuery.builder)
      .mockReturnValueOnce(createQuery.builder);

    const result = await stakeholderRequirementsService.createStakeholderRequirement({
      stakeholder_id: "stake-9",
      requirement_title: "Exigir resposta formal",
      requirement_description: "",
      monitoring_method: "",
      responsible_user_id: "",
      linked_compliance_task_id: "",
      source_reference: "",
      review_due_date: "2026-04-10",
    });

    expect(createQuery.recorder.payload).toMatchObject({
      stakeholder_id: "stake-9",
      requirement_title: "Exigir resposta formal",
      iso_standard: "ISO_9001",
      iso_clause: "4.2",
      company_id: "company-1",
      created_by_user_id: "user-1",
      requirement_description: null,
      monitoring_method: null,
      responsible_user_id: null,
      linked_compliance_task_id: null,
      source_reference: null,
      status: "nao_iniciado",
    });
    expect(result.evidence_count).toBe(0);
    expect(result.status).toBe("nao_iniciado");
  });

  it("atualiza requisito normalizando campos opcionais e recalculando total de evidências", async () => {
    const profileQuery = createAwaitableBuilder({
      data: { company_id: "company-1" },
      error: null,
    });
    const updateQuery = createAwaitableBuilder(
      {
        data: {
          id: "req-3",
          company_id: "company-1",
          stakeholder_id: "stake-7",
          iso_standard: "ISO_9001",
          iso_clause: "4.2",
          requirement_title: "Atualizado",
          requirement_description: null,
          monitoring_method: null,
          is_legal_requirement: false,
          is_relevant_to_sgq: true,
          status: "bloqueado",
          responsible_user_id: null,
          linked_compliance_task_id: null,
          last_checked_at: null,
          review_due_date: null,
          source_reference: null,
          created_by_user_id: "user-1",
          created_at: "2026-03-01T10:00:00Z",
          updated_at: "2026-03-05T10:00:00Z",
        },
        error: null,
      },
      {},
    );
    const evidenceQuery = createAwaitableBuilder({
      data: [{ id: "ev-1" }],
      error: null,
    });

    vi.mocked(supabase.from)
      .mockReturnValueOnce(profileQuery.builder)
      .mockReturnValueOnce(updateQuery.builder)
      .mockReturnValueOnce(evidenceQuery.builder);

    const result = await stakeholderRequirementsService.updateStakeholderRequirement("req-3", {
      requirement_description: "",
      monitoring_method: "",
      responsible_user_id: "",
      linked_compliance_task_id: "",
      source_reference: "",
      review_due_date: "",
      status: "bloqueado",
    });

    expect(updateQuery.recorder.payload).toMatchObject({
      requirement_description: null,
      monitoring_method: null,
      responsible_user_id: null,
      linked_compliance_task_id: null,
      source_reference: null,
      review_due_date: null,
      status: "bloqueado",
    });
    expect(result.evidence_count).toBe(1);
    expect(result.status).toBe("bloqueado");
  });

  it("registra revisão anual usando contexto do usuário autenticado", async () => {
    const profileQuery = createAwaitableBuilder({
      data: { company_id: "company-1" },
      error: null,
    });
    const createReviewQuery = createAwaitableBuilder(
      {
        data: {
          id: "review-1",
          company_id: "company-1",
          review_date: "2026-03-05",
          review_summary: "Resumo da revisão anual",
          management_review_reference: "ATA-2026-03",
          reviewed_by_user_id: "user-1",
          next_review_due_date: "2027-03-05",
          created_at: "2026-03-05T12:00:00Z",
          updated_at: "2026-03-05T12:00:00Z",
          reviewed_by: {
            id: "user-1",
            full_name: "Usuário Teste",
          },
        },
        error: null,
      },
      {},
    );

    vi.mocked(supabase.from)
      .mockReturnValueOnce(profileQuery.builder)
      .mockReturnValueOnce(createReviewQuery.builder);

    const result = await stakeholderRequirementsService.registerStakeholderMatrixReview({
      review_date: "2026-03-05",
      review_summary: "Resumo da revisão anual",
      management_review_reference: "ATA-2026-03",
    });

    expect(createReviewQuery.recorder.payload).toMatchObject({
      company_id: "company-1",
      review_date: "2026-03-05",
      review_summary: "Resumo da revisão anual",
      management_review_reference: "ATA-2026-03",
      reviewed_by_user_id: "user-1",
      next_review_due_date: null,
    });
    expect(result.id).toBe("review-1");
  });
});
