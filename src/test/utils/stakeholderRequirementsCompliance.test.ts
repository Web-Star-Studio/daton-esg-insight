import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  calculateStakeholderRequirementKpis,
  getDaysUntilDate,
  getStakeholderAlertWindow,
  isRequirementOverdue,
} from "@/utils/stakeholderRequirementsCompliance";

describe("stakeholderRequirementsCompliance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula KPIs corretamente", () => {
    const result = calculateStakeholderRequirementKpis([
      { status: "atendido", review_due_date: "2026-03-01" },
      { status: "em_atendimento", review_due_date: "2026-03-10" },
      { status: "nao_iniciado", review_due_date: "2026-03-03" },
      { status: "bloqueado", review_due_date: null },
    ]);

    expect(result).toEqual({
      total: 4,
      atendidos: 1,
      pendentes: 3,
      vencidos: 1,
      taxaAtendimento: 25,
    });
  });

  it("classifica as janelas 30/7/0 corretamente", () => {
    expect(getStakeholderAlertWindow("2026-04-04", "em_atendimento")).toBe("30_days");
    expect(getStakeholderAlertWindow("2026-03-12", "em_atendimento")).toBe("7_days");
    expect(getStakeholderAlertWindow("2026-03-05", "em_atendimento")).toBe("due_or_overdue");
    expect(getStakeholderAlertWindow("2026-03-01", "em_atendimento")).toBe("due_or_overdue");
    expect(getStakeholderAlertWindow("2026-03-12", "atendido")).toBeNull();
    expect(getStakeholderAlertWindow(null, "em_atendimento")).toBeNull();
  });

  it("calcula atraso e dias restantes com base na data de referência", () => {
    expect(getDaysUntilDate("2026-03-08")).toBe(3);
    expect(getDaysUntilDate("2026-03-04")).toBe(-1);

    expect(
      isRequirementOverdue({
        status: "em_atendimento",
        review_due_date: "2026-03-04",
      }),
    ).toBe(true);

    expect(
      isRequirementOverdue({
        status: "atendido",
        review_due_date: "2026-03-04",
      }),
    ).toBe(false);
  });
});
