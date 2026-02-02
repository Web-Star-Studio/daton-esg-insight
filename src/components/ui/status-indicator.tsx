import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, Clock, Loader2 } from "lucide-react";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 text-sm font-medium",
  {
    variants: {
      status: {
        success: "text-success",
        error: "text-destructive",
        warning: "text-warning",
        info: "text-info",
        pending: "text-muted-foreground",
        loading: "text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "info",
    },
  }
);

const StatusIcon = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  pending: Clock,
  loading: Loader2,
};

interface StatusIndicatorProps extends VariantProps<typeof statusVariants> {
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status = "info", 
  children, 
  showIcon = true,
  className 
}: StatusIndicatorProps) {
  const Icon = StatusIcon[status || "info"];
  
  return (
    <span className={cn(statusVariants({ status }), className)}>
      {showIcon && (
        <Icon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            status === "loading" && "animate-spin"
          )} 
          aria-hidden="true" 
        />
      )}
      {children && <span>{children}</span>}
    </span>
  );
}
