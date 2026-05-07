export type QuestionType = "single" | "multi" | "text" | "textarea";

export interface QuestionOption {
  id: string;
  label: string;
  tags?: string[];
}

export interface ConditionalRule {
  questionId: string;
  anyOf: string[];
}

export interface Question {
  id: string;
  number: string;
  label: string;
  type: QuestionType;
  options?: QuestionOption[];
  showIf?: ConditionalRule;
  required?: boolean;
}

export interface Theme {
  id: string;
  number: number;
  title: string;
  questions: Question[];
}
