import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FormValidationCheckerProps {
  errors: Record<string, string>;
  onErrorsChange?: (hasErrors: boolean) => void;
}

export function FormValidationChecker({ errors, onErrorsChange }: FormValidationCheckerProps) {
  const [previousErrorCount, setPreviousErrorCount] = useState(0);
  
  useEffect(() => {
    const errorCount = Object.keys(errors).length;
    const hasErrors = errorCount > 0;
    
    // Notify parent component about error state
    onErrorsChange?.(hasErrors);
    
    // Show toast for new errors
    if (errorCount > previousErrorCount && hasErrors) {
      const firstError = Object.values(errors)[0];
      toast.error('Erro de validação', {
        description: firstError,
        duration: 4000,
      });
    }
    
    setPreviousErrorCount(errorCount);
  }, [errors, previousErrorCount, onErrorsChange]);
  
  return null; // This is a utility component with no visual output
}