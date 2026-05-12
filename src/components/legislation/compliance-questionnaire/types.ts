export type QuestionType = "single" | "multi" | "text" | "textarea";

export interface QuestionOption {
  id: string;
  label: string;
  tags?: string[];
  // Em multi-select, marca uma opção como mutuamente exclusiva: selecioná-la
  // desmarca todas as outras, e selecionar qualquer outra desmarca esta.
  // Usado para opções "Nenhum" / "Não Se Aplica" que contradizem as demais.
  exclusive?: boolean;
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
