import { useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';

interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: Record<string, string>;
}

export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validate = (data: unknown): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data);
      setErrors({});
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
        
        // Show first validation error to user
        const firstError = error.issues[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
        
        return {
          isValid: false,
          errors: fieldErrors
        };
      }
      
      // Handle unexpected validation errors
      errorHandler.showUserError(error, {
        component: 'useFormValidation',
        function: 'validate'
      });
      
      return {
        isValid: false,
        errors: { general: 'Erro inesperado na validação' }
      };
    }
  };

  const clearErrors = () => setErrors({});
  
  const getFieldError = (fieldName: string) => errors[fieldName];
  
  const hasErrors = Object.keys(errors).length > 0;

  return {
    validate,
    errors,
    clearErrors,
    getFieldError,
    hasErrors
  };
}