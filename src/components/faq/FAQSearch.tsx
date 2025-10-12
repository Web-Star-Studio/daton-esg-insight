/**
 * FAQ Search Component
 * Search input with real-time filtering
 */

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FAQSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount: number;
}

export const FAQSearch = ({ value, onChange, resultsCount }: FAQSearchProps) => {
  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar perguntas, respostas ou tags..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <p className="text-sm text-muted-foreground mt-2">
          {resultsCount} {resultsCount === 1 ? "resultado encontrado" : "resultados encontrados"}
        </p>
      )}
    </div>
  );
};
