import { describe, it, expect } from "vitest";
import {
  calculateNextReviewDate,
  calculateSWOTTraceabilityMetrics,
  getSWOTReviewStatus,
  hasTraceabilityEvidence,
} from "@/utils/swotCompliance";

describe("swotCompliance", () => {
  describe("calculateNextReviewDate", () => {
    it("computes annual next review date", () => {
      expect(calculateNextReviewDate("2025-03-05", "anual")).toBe("2026-03-05");
    });

    it("handles month boundary for mensal", () => {
      expect(calculateNextReviewDate("2025-01-31", "mensal")).toBe("2025-02-28");
    });
  });

  describe("getSWOTReviewStatus", () => {
    it("returns no_review when no review dates are registered", () => {
      const status = getSWOTReviewStatus(
        {
          review_frequency: "anual",
          last_review_date: null,
          next_review_date: null,
        },
        new Date("2026-03-05T00:00:00.000Z"),
      );

      expect(status.status).toBe("no_review");
      expect(status.label).toBe("Sem revisão registrada");
    });

    it("returns on_time when review is in schedule", () => {
      const status = getSWOTReviewStatus(
        {
          review_frequency: "anual",
          last_review_date: "2025-03-05",
          next_review_date: "2026-03-10",
        },
        new Date("2026-03-05T00:00:00.000Z"),
      );

      expect(status.status).toBe("on_time");
      expect(status.daysUntilDue).toBe(5);
    });

    it("returns overdue when due date is in the past", () => {
      const status = getSWOTReviewStatus(
        {
          review_frequency: "anual",
          last_review_date: "2025-03-05",
          next_review_date: "2026-03-01",
        },
        new Date("2026-03-05T00:00:00.000Z"),
      );

      expect(status.status).toBe("overdue");
      expect(status.daysUntilDue).toBe(-4);
    });
  });

  describe("traceability", () => {
    it("validates evidence for relevant action linkage", () => {
      expect(
        hasTraceabilityEvidence({
          linked_action_plan_item_id: null,
          external_action_reference: "",
        }),
      ).toBe(false);

      expect(
        hasTraceabilityEvidence({
          linked_action_plan_item_id: "item-1",
          external_action_reference: null,
        }),
      ).toBe(true);

      expect(
        hasTraceabilityEvidence({
          linked_action_plan_item_id: null,
          external_action_reference: "FPLAN 020: AC-12",
        }),
      ).toBe(true);
    });

    it("calculates relevant traceability metrics", () => {
      const metrics = calculateSWOTTraceabilityMetrics([
        {
          treatment_decision: "nao_classificado",
          linked_action_plan_item_id: null,
          external_action_reference: null,
        },
        {
          treatment_decision: "relevante_requer_acoes",
          linked_action_plan_item_id: "item-1",
          external_action_reference: null,
        },
        {
          treatment_decision: "relevante_requer_acoes",
          linked_action_plan_item_id: null,
          external_action_reference: "FPLAN 007 - Mudança 44",
        },
        {
          treatment_decision: "relevante_requer_acoes",
          linked_action_plan_item_id: null,
          external_action_reference: "",
        },
      ] as any);

      expect(metrics.totalRelevant).toBe(3);
      expect(metrics.tracedRelevant).toBe(2);
      expect(metrics.pendingRelevant).toBe(1);
      expect(metrics.traceabilityRate).toBe(67);
    });
  });
});
