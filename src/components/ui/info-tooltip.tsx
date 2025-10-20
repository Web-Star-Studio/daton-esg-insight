import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function InfoTooltip({ content, title, side = "top", className = "" }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={`inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors ${className}`}
          >
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
