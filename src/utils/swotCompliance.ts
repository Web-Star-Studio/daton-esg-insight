import { SWOTAnalysis, SWOTItem, SWOTReviewFrequency } from "@/services/strategic";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toUTCDate = (value: string | Date): Date => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addMonthsClamped = (date: Date, months: number): Date => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const targetMonthDate = new Date(Date.UTC(year, month + months, 1));
  const endOfTargetMonth = new Date(
    Date.UTC(targetMonthDate.getUTCFullYear(), targetMonthDate.getUTCMonth() + 1, 0),
  );
  const targetDay = Math.min(day, endOfTargetMonth.getUTCDate());

  return new Date(
    Date.UTC(targetMonthDate.getUTCFullYear(), targetMonthDate.getUTCMonth(), targetDay),
  );
};

const addYearsClamped = (date: Date, years: number): Date => {
  return addMonthsClamped(date, years * 12);
};

export interface SWOTReviewStatus {
  status: "on_time" | "overdue" | "no_review";
  label: "Em dia" | "Vencida" | "Sem revisão registrada";
  daysUntilDue: number | null;
  dueDate: string | null;
}

export interface SWOTTraceabilityMetrics {
  totalRelevant: number;
  tracedRelevant: number;
  pendingRelevant: number;
  traceabilityRate: number;
}

export const calculateNextReviewDate = (
  referenceDate: string | Date | null | undefined,
  frequency: SWOTReviewFrequency = "anual",
): string | null => {
  if (!referenceDate) return null;

  const base = toUTCDate(referenceDate);
  let next: Date;

  switch (frequency) {
    case "mensal":
      next = addMonthsClamped(base, 1);
      break;
    case "trimestral":
      next = addMonthsClamped(base, 3);
      break;
    case "semestral":
      next = addMonthsClamped(base, 6);
      break;
    case "bienal":
      next = addYearsClamped(base, 2);
      break;
    case "anual":
    default:
      next = addYearsClamped(base, 1);
      break;
  }

  return next.toISOString().split("T")[0];
};

export const getSWOTReviewStatus = (
  analysis: Pick<SWOTAnalysis, "last_review_date" | "next_review_date" | "review_frequency">,
  referenceDate: Date = new Date(),
): SWOTReviewStatus => {
  const dueDate =
    analysis.next_review_date ||
    calculateNextReviewDate(analysis.last_review_date, analysis.review_frequency);

  if (!dueDate) {
    return {
      status: "no_review",
      label: "Sem revisão registrada",
      daysUntilDue: null,
      dueDate: null,
    };
  }

  const due = toUTCDate(dueDate);
  const ref = toUTCDate(referenceDate);
  const daysUntilDue = Math.floor((due.getTime() - ref.getTime()) / DAY_IN_MS);

  if (daysUntilDue < 0) {
    return {
      status: "overdue",
      label: "Vencida",
      daysUntilDue,
      dueDate,
    };
  }

  return {
    status: "on_time",
    label: "Em dia",
    daysUntilDue,
    dueDate,
  };
};

export const hasTraceabilityEvidence = (
  item: Pick<SWOTItem, "linked_action_plan_item_id" | "external_action_reference">,
): boolean => {
  return Boolean(
    item.linked_action_plan_item_id ||
      (item.external_action_reference && item.external_action_reference.trim().length > 0),
  );
};

export const calculateSWOTTraceabilityMetrics = (
  items: Pick<SWOTItem, "treatment_decision" | "linked_action_plan_item_id" | "external_action_reference">[],
): SWOTTraceabilityMetrics => {
  const relevantItems = items.filter(
    (item) => item.treatment_decision === "relevante_requer_acoes",
  );

  const tracedRelevant = relevantItems.filter((item) => hasTraceabilityEvidence(item)).length;
  const totalRelevant = relevantItems.length;
  const pendingRelevant = totalRelevant - tracedRelevant;

  return {
    totalRelevant,
    tracedRelevant,
    pendingRelevant,
    traceabilityRate: totalRelevant > 0 ? Math.round((tracedRelevant / totalRelevant) * 100) : 100,
  };
};
