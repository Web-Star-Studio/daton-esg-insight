import type { ComplianceResponses } from "@/services/complianceProfiles";
import type { Question, Theme } from "./types";

const isAnswered = (value: string | string[] | undefined): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
};

const matchesAny = (value: string | string[] | undefined, candidates: string[]): boolean => {
  if (Array.isArray(value)) return value.some((v) => candidates.includes(v));
  return typeof value === "string" && candidates.includes(value);
};

export const isQuestionVisible = (
  question: Question,
  responses: ComplianceResponses,
): boolean => {
  if (!question.showIf) return true;
  return matchesAny(responses[question.showIf.questionId], question.showIf.anyOf);
};

export const visibleRequiredQuestions = (
  theme: Theme,
  responses: ComplianceResponses,
): Question[] =>
  theme.questions.filter(
    (q) => (q.required ?? true) && isQuestionVisible(q, responses),
  );

export const themeCompletionPercent = (
  theme: Theme,
  responses: ComplianceResponses,
): number => {
  const required = visibleRequiredQuestions(theme, responses);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => isAnswered(responses[q.id])).length;
  return Math.round((answered / required.length) * 100);
};

export const overallCompletionPercent = (
  themes: Theme[],
  responses: ComplianceResponses,
): number => {
  const totals = themes.reduce(
    (acc, theme) => {
      const required = visibleRequiredQuestions(theme, responses);
      const answered = required.filter((q) => isAnswered(responses[q.id])).length;
      acc.required += required.length;
      acc.answered += answered;
      return acc;
    },
    { required: 0, answered: 0 },
  );
  if (totals.required === 0) return 100;
  return Math.round((totals.answered / totals.required) * 100);
};

export const isThemeComplete = (theme: Theme, responses: ComplianceResponses): boolean =>
  themeCompletionPercent(theme, responses) === 100;

export const generateTagsFromResponses = (
  themes: Theme[],
  responses: ComplianceResponses,
): string[] => {
  const tags = new Set<string>();

  for (const theme of themes) {
    for (const question of theme.questions) {
      if (!isQuestionVisible(question, responses)) continue;
      const value = responses[question.id];
      if (!isAnswered(value)) continue;
      if (!question.options) continue;

      const selected = Array.isArray(value) ? value : [value as string];
      for (const optionId of selected) {
        const option = question.options.find((o) => o.id === optionId);
        option?.tags?.forEach((tag) => tags.add(tag));
      }
    }
  }

  return Array.from(tags).sort();
};
