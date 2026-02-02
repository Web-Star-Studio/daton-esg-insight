import * as React from "react";
import { cn } from "@/lib/utils";

interface FormHintProps extends React.HTMLAttributes<HTMLElement> {
  /** ID único para conexão com aria-describedby */
  id: string;
  /** Conteúdo do hint */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de help text acessível para formulários.
 * 
 * @example
 * ```tsx
 * <Input id="cnpj" aria-describedby="cnpj-hint" />
 * <FormHint id="cnpj-hint">Apenas números, 14 dígitos</FormHint>
 * ```
 */
const FormHint = React.forwardRef<HTMLElement, FormHintProps>(
  ({ id, children, className, ...props }, ref) => {
    return (
      <small
        ref={ref as React.Ref<HTMLElement>}
        id={id}
        className={cn(
          "block text-xs text-muted-foreground mt-1.5",
          className
        )}
        {...props}
      >
        {children}
      </small>
    );
  }
);
FormHint.displayName = "FormHint";

export { FormHint };
