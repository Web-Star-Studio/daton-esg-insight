import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

/**
 * IconButton - Accessible button for icon-only actions
 * 
 * WCAG 2.1 compliance:
 * - Always includes aria-label for screen readers
 * - Icon is marked aria-hidden
 * - sr-only text provides accessible name
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={showLabel ? "default" : "icon"}
        aria-label={label}
        className={cn("gap-2", className)}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        {showLabel ? (
          <span>{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
