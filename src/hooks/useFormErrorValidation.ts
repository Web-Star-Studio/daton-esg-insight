import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { logFormValidation } from '@/utils/formLogging';

interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
}

export function useFormErrorValidation<T>(schema: z.ZodSchema<T>, formName: string = 'UnnamedForm') {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (data: unknown): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data);
      setErrors({});
      
      logFormValidation(formName, true);
      
      return {
        isValid: true,
        data: validatedData,
        errors: {}
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        
        setErrors(fieldErrors);
        logFormValidation(formName, false, fieldErrors);
        
        toast.error("Erro de validação", {
          description: error.issues[0].message,
        });
        
        return {
          isValid: false,
          errors: fieldErrors
        };
      }
      
      logFormValidation(formName, false, { general: 'Erro inesperado na validação' });
      toast.error("Erro inesperado na validação");
      
      return {
        isValid: false,
        errors: { general: 'Erro inesperado na validação' }
      };
    }
  };

  const clearErrors = () => setErrors({});
  const getFieldError = (fieldName: string) => errors[fieldName];
  const hasErrors = Object.keys(errors).length > 0;
  const hasFieldError = (fieldName: string) => !!errors[fieldName];

  const getFieldProps = (fieldName: string) => ({
    className: hasFieldError(fieldName) ? "border-red-500 focus:border-red-500" : "",
    'aria-invalid': hasFieldError(fieldName),
  });

  const renderLabel = (fieldName: string, isRequired: boolean = false) => ({
    label: (text: string) => text + (isRequired ? ' *' : ''),
    className: hasFieldError(fieldName) ? 'text-red-600' : 'text-sm font-medium',
    isRequired,
    hasError: hasFieldError(fieldName)
  });

  return {
    validate,
    errors,
    clearErrors,
    getFieldError,
    hasErrors,
    hasFieldError,
    getFieldProps,
    renderLabel,
    isLoading,
    setIsLoading
  };
}
