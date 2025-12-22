import { cn } from "@/lib/utils";

interface NPSInputProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  hasError?: boolean;
}

const getNPSButtonClass = (score: number, isSelected: boolean) => {
  const baseClass = "w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 border-2";
  
  if (isSelected) {
    if (score <= 6) return cn(baseClass, "bg-red-500 border-red-500 text-white shadow-lg scale-110");
    if (score <= 8) return cn(baseClass, "bg-yellow-500 border-yellow-500 text-white shadow-lg scale-110");
    return cn(baseClass, "bg-green-500 border-green-500 text-white shadow-lg scale-110");
  }
  
  // Not selected - subtle background hint
  if (score <= 6) return cn(baseClass, "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 dark:bg-red-950 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900");
  if (score <= 8) return cn(baseClass, "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300 dark:hover:bg-yellow-900");
  return cn(baseClass, "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 dark:bg-green-950 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900");
};

const getScoreLabel = (score: number | null) => {
  if (score === null) return null;
  if (score <= 6) return { text: "Detrator", color: "text-red-600 dark:text-red-400" };
  if (score <= 8) return { text: "Neutro", color: "text-yellow-600 dark:text-yellow-400" };
  return { text: "Promotor", color: "text-green-600 dark:text-green-400" };
};

export function NPSInput({ value, onChange, disabled = false, hasError = false }: NPSInputProps) {
  const scoreLabel = getScoreLabel(value);

  return (
    <div className={cn("space-y-3", hasError && "ring-2 ring-destructive ring-offset-2 rounded-lg p-2")}>
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      {/* NPS Buttons */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange(i)}
            className={cn(
              getNPSButtonClass(i, value === i),
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Nota ${i}`}
          >
            {i}
          </button>
        ))}
      </div>

      {/* Category Labels */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-muted-foreground">Detratores (0-6)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
          <span className="text-muted-foreground">Neutros (7-8)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-muted-foreground">Promotores (9-10)</span>
        </div>
      </div>

      {/* Selected Score Feedback */}
      {value !== null && scoreLabel && (
        <div className="text-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">Você selecionou: </span>
          <span className={cn("font-semibold", scoreLabel.color)}>
            {value} - {scoreLabel.text}
          </span>
        </div>
      )}
    </div>
  );
}
