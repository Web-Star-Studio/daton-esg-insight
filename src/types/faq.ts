/**
 * FAQ Types
 * Type definitions for the FAQ system
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  relatedQuestions?: string[]; // IDs of related questions
  popularity?: number;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: FAQItem[];
}

export interface FAQSearchResult {
  item: FAQItem;
  category: FAQCategory;
  score: number;
}
