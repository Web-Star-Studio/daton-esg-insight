/**
 * FAQ Item Component
 * Individual FAQ question and answer in accordion format
 */

import { useState } from "react";
import { Link2, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { unifiedToast } from "@/utils/unifiedToast";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export const FAQItem = ({ id, question, answer, tags }: FAQItemProps) => {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/faq#${id}`;
    navigator.clipboard.writeText(url);
    unifiedToast.success("Link copiado", {
      description: "Link da pergunta copiado para a área de transferência",
    });
  };

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type);
    unifiedToast.success(
      type === "positive" ? "Obrigado pelo feedback!" : "Feedback registrado",
      {
        description:
          type === "positive"
            ? "Ficamos felizes que essa resposta foi útil!"
            : "Vamos trabalhar para melhorar essa resposta.",
      }
    );
  };

  return (
    <AccordionItem value={id} id={id} className="border rounded-lg px-4 mb-3">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="text-left">
          <h3 className="font-medium text-base">{question}</h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="text-muted-foreground pb-4">
        <p className="whitespace-pre-line leading-relaxed">{answer}</p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs"
          >
            <Link2 className="mr-1 h-3 w-3" />
            Compartilhar
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Esta resposta foi útil?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback("positive")}
              className={cn(
                "h-7 w-7 p-0",
                feedback === "positive" && "text-green-600 bg-green-50"
              )}
              disabled={feedback !== null}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback("negative")}
              className={cn(
                "h-7 w-7 p-0",
                feedback === "negative" && "text-red-600 bg-red-50"
              )}
              disabled={feedback !== null}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
