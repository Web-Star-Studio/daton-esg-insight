import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** How assertive the announcement should be */
  politeness?: "polite" | "assertive";
  /** Whether to read the entire region or just changes */
  atomic?: boolean;
  /** What types of changes to announce */
  relevant?: "additions" | "removals" | "text" | "all";
  /** Whether to visually show the content */
  visuallyHidden?: boolean;
}

/**
 * LiveRegion - Accessible status announcements for screen readers
 * 
 * WCAG 4.1.3 compliance:
 * - aria-live announces dynamic content changes
 * - Use "polite" for non-urgent updates
 * - Use "assertive" for important alerts
 * 
 * Usage:
 * ```tsx
 * <LiveRegion>
 *   {isLoading ? "Carregando..." : `${count} resultados encontrados`}
 * </LiveRegion>
 * ```
 */
const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ 
    politeness = "polite", 
    atomic = true, 
    relevant = "additions", 
    visuallyHidden = true,
    className, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={cn(visuallyHidden && "sr-only", className)}
        {...props}
      />
    );
  }
);
LiveRegion.displayName = "LiveRegion";

export { LiveRegion };
