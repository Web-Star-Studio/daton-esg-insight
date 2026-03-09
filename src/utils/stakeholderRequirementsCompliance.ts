export type StakeholderRequirementStatus =
  | "nao_iniciado"
  | "em_atendimento"
  | "atendido"
  | "bloqueado";

export interface StakeholderRequirementLike {
  status: StakeholderRequirementStatus;
  review_due_date: string | null;
}

export interface StakeholderRequirementKpis {
  total: number;
  atendidos: number;
  pendentes: number;
  vencidos: number;
  taxaAtendimento: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toUTCDate = (value: Date | string): Date => {
  const parsed = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

export const getDaysUntilDate = (
  dateValue: Date | string,
  referenceDate: Date = new Date(),
): number => {
  const dueDate = toUTCDate(dateValue);
  const reference = toUTCDate(referenceDate);
  return Math.floor((dueDate.getTime() - reference.getTime()) / DAY_IN_MS);
};

export type StakeholderAlertWindow = "30_days" | "7_days" | "due_or_overdue";

export const getStakeholderAlertWindow = (
  reviewDueDate: string | null | undefined,
  status: StakeholderRequirementStatus,
  referenceDate: Date = new Date(),
): StakeholderAlertWindow | null => {
  if (!reviewDueDate || status === "atendido") return null;

  const daysUntilDue = getDaysUntilDate(reviewDueDate, referenceDate);

  if (daysUntilDue <= 0) return "due_or_overdue";
  if (daysUntilDue <= 7) return "7_days";
  if (daysUntilDue <= 30) return "30_days";

  return null;
};

export const isRequirementOverdue = (
  requirement: StakeholderRequirementLike,
  referenceDate: Date = new Date(),
): boolean => {
  if (requirement.status === "atendido" || !requirement.review_due_date) return false;
  return getDaysUntilDate(requirement.review_due_date, referenceDate) < 0;
};

export const calculateStakeholderRequirementKpis = (
  requirements: StakeholderRequirementLike[],
  referenceDate: Date = new Date(),
): StakeholderRequirementKpis => {
  const total = requirements.length;

  const atendidos = requirements.filter((item) => item.status === "atendido").length;

  const pendentes = requirements.filter((item) => item.status !== "atendido").length;

  const vencidos = requirements.filter((item) => isRequirementOverdue(item, referenceDate)).length;

  return {
    total,
    atendidos,
    pendentes,
    vencidos,
    taxaAtendimento: total > 0 ? Math.round((atendidos / total) * 100) : 0,
  };
};
