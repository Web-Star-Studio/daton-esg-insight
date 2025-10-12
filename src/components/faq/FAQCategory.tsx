/**
 * FAQ Category Component
 * Groups FAQ items by category with accordion
 */

import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { FAQItem } from "./FAQItem";
import { FAQItem as FAQItemType } from "@/types/faq";

interface FAQCategoryProps {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: FAQItemType[];
}

export const FAQCategory = ({
  id,
  title,
  icon,
  description,
  questions,
}: FAQCategoryProps) => {
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] as LucideIcon;
    return Icon || Icons.HelpCircle;
  };

  const Icon = getIcon(icon);

  return (
    <div id={`category-${id}`} className="scroll-mt-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {questions.map((question) => (
          <FAQItem
            key={question.id}
            id={question.id}
            question={question.question}
            answer={question.answer}
            tags={question.tags}
          />
        ))}
      </Accordion>
    </div>
  );
};
