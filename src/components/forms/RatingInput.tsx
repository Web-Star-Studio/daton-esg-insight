import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  maxStars?: number;
  hasError?: boolean;
  disabled?: boolean;
}

export function RatingInput({ 
  value, 
  onChange, 
  maxStars = 5, 
  hasError,
  disabled = false 
}: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverValue ?? value ?? 0) >= starValue;
        
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "focus:outline-none focus:ring-2 focus:ring-primary rounded p-0.5 transition-transform",
              !disabled && "hover:scale-110",
              disabled && "cursor-default"
            )}
          >
            <Star 
              className={cn(
                "h-8 w-8 transition-colors",
                isFilled 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-muted-foreground/30",
                hasError && "text-destructive/50"
              )} 
            />
          </button>
        );
      })}
      {value !== null && value !== undefined && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value}/{maxStars}
        </span>
      )}
    </div>
  );
}
