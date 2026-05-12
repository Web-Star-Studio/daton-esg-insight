import type { ComplianceResponses } from "@/services/complianceProfiles";
import type { Suppression } from "./suppressionRules";
import type { Question, Theme } from "./types";

const isAnswered = (value: string | string[] | undefined): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
};

const matchesAny = (value: string | string[] | undefined, candidates: string[]): boolean => {
  if (Array.isArray(value)) return value.some((v) => candidates.includes(v));
  return typeof value === "string" && candidates.includes(value);
};

export const isThemeSuppressed = (theme: Theme, suppression?: Suppression): boolean =>
  !!suppression?.themeIds.has(theme.id);

export const isQuestionVisible = (
  question: Question,
  responses: ComplianceResponses,
  suppression?: Suppression,
): boolean => {
  if (suppression?.questionIds.has(question.id)) return false;
  if (!question.showIf) return true;
  return matchesAny(responses[question.showIf.questionId], question.showIf.anyOf);
};

export const visibleRequiredQuestions = (
  theme: Theme,
  responses: ComplianceResponses,
  suppression?: Suppression,
): Question[] => {
  if (isThemeSuppressed(theme, suppression)) return [];
  return theme.questions.filter(
    (q) => (q.required ?? true) && isQuestionVisible(q, responses, suppression),
  );
};

export const themeCompletionPercent = (
  theme: Theme,
  responses: ComplianceResponses,
  suppression?: Suppression,
): number => {
  const required = visibleRequiredQuestions(theme, responses, suppression);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => isAnswered(responses[q.id])).length;
  return Math.round((answered / required.length) * 100);
};

export const overallCompletionPercent = (
  themes: Theme[],
  responses: ComplianceResponses,
  suppression?: Suppression,
): number => {
  const totals = themes.reduce(
    (acc, theme) => {
      if (isThemeSuppressed(theme, suppression)) return acc;
      const required = visibleRequiredQuestions(theme, responses, suppression);
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

export const isThemeComplete = (
  theme: Theme,
  responses: ComplianceResponses,
  suppression?: Suppression,
): boolean => themeCompletionPercent(theme, responses, suppression) === 100;

export const generateTagsFromResponses = (
  themes: Theme[],
  responses: ComplianceResponses,
  suppression?: Suppression,
): string[] => {
  const tags = new Set<string>();

  for (const theme of themes) {
    if (isThemeSuppressed(theme, suppression)) continue;
    for (const question of theme.questions) {
      if (!isQuestionVisible(question, responses, suppression)) continue;
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

// Conta respostas existentes que caíram fora do escopo após mudança de
// pre_responses. Usado pelo UI pra mostrar advisory "X respostas fora do
// escopo — você pode mantê-las ou limpar".
export const countStaleAnswers = (
  themes: Theme[],
  responses: ComplianceResponses,
  suppression: Suppression,
): number => {
  let count = 0;
  for (const theme of themes) {
    const themeSuppressed = suppression.themeIds.has(theme.id);
    for (const question of theme.questions) {
      const value = responses[question.id];
      if (!isAnswered(value)) continue;
      if (themeSuppressed || suppression.questionIds.has(question.id)) {
        count += 1;
      }
    }
  }
  return count;
};

// Conta respostas preenchidas dentro de um tema. Usado pelo preview do
// Pré-Compliance pra mostrar quantas respostas estão em risco quando o
// usuário considera ocultar/revelar um tema.
export const countAnsweredInTheme = (
  theme: Theme,
  responses: ComplianceResponses,
): number => {
  let count = 0;
  for (const question of theme.questions) {
    const value = responses[question.id];
    if (Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim().length > 0) {
      count += 1;
    }
  }
  return count;
};

// Retorna um novo objeto de responses com as chaves suprimidas removidas.
// Não muta o input. Usado pela ação "Limpar respostas fora do escopo".
export const stripSuppressedAnswers = (
  themes: Theme[],
  responses: ComplianceResponses,
  suppression: Suppression,
): ComplianceResponses => {
  const result: ComplianceResponses = {};
  for (const theme of themes) {
    const themeSuppressed = suppression.themeIds.has(theme.id);
    for (const question of theme.questions) {
      const value = responses[question.id];
      if (value === undefined) continue;
      if (themeSuppressed) continue;
      if (suppression.questionIds.has(question.id)) continue;
      result[question.id] = value;
    }
  }
  return result;
};
