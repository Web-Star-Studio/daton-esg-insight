/**
 * FAQ Search Hook
 * Manages FAQ search state and filtering logic
 */

import { useState, useMemo } from "react";
import { FAQCategory } from "@/types/faq";
import { faqCategories } from "@/data/faqData";

export const useFAQSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const lowerQuery = searchQuery.toLowerCase();

    return faqCategories
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(lowerQuery) ||
            q.answer.toLowerCase().includes(lowerQuery) ||
            q.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [searchQuery]);

  // Get active category or filter further if category is selected
  const displayedCategories = useMemo(() => {
    if (!activeCategory) return filteredCategories;
    return filteredCategories.filter((cat) => cat.id === activeCategory);
  }, [filteredCategories, activeCategory]);

  const totalQuestions = useMemo(
    () =>
      displayedCategories.reduce(
        (sum, cat) => sum + cat.questions.length,
        0
      ),
    [displayedCategories]
  );

  return {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredCategories,
    displayedCategories,
    totalQuestions,
  };
};
