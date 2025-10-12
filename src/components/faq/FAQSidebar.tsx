/**
 * FAQ Sidebar Component
 * Navigation for FAQ categories
 */

import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  questionCount: number;
}

interface FAQSidebarProps {
  categories: Category[];
  activeCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export const FAQSidebar = ({
  categories,
  activeCategory,
  onCategorySelect,
}: FAQSidebarProps) => {
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] as LucideIcon;
    return Icon || Icons.HelpCircle;
  };

  return (
    <div className="w-64 border-r bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Categorias
        </h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left font-normal",
              !activeCategory && "bg-muted font-medium"
            )}
            onClick={() => onCategorySelect(null)}
          >
            <Icons.List className="mr-2 h-4 w-4" />
            Todas as Categorias
          </Button>

          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const isActive = activeCategory === category.id;

            return (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  isActive && "bg-muted font-medium"
                )}
                onClick={() => onCategorySelect(category.id)}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{category.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.questionCount}{" "}
                    {category.questionCount === 1 ? "pergunta" : "perguntas"}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
