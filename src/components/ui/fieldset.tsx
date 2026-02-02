import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: string;
  legendClassName?: string;
  hideLegend?: boolean;
}

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ legend, legendClassName, hideLegend, className, children, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        className={cn("space-y-4 border-0 p-0 m-0", className)}
        {...props}
      >
        <legend 
          className={cn(
            hideLegend ? "sr-only" : "text-sm font-medium text-foreground mb-2",
            legendClassName
          )}
        >
          {legend}
        </legend>
        {children}
      </fieldset>
    );
  }
);
Fieldset.displayName = "Fieldset";

export { Fieldset };
