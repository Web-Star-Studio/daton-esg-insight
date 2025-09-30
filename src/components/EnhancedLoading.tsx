import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedLoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "spinner" | "pulse";
}

export const EnhancedLoading = ({ 
  message = "Carregando...", 
  className,
  size = "default",
  variant = "default"
}: EnhancedLoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const containerClasses = {
    sm: "gap-2 text-sm",
    default: "gap-3",
    lg: "gap-4 text-lg"
  };

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center p-4", containerClasses[size], className)}>
        <div className={cn("animate-pulse bg-primary/20 rounded-full", sizeClasses[size])} />
        <span className="text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-4", containerClasses[size], className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
};