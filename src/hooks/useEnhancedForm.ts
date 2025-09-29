import { useState, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { sanitizeFormData, showFormError, showFormSuccess } from '@/utils/formUtils';

interface UseEnhancedFormOptions<T> {
  schema?: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: (data: T) => void;
  successMessage?: string;
  resetOnSuccess?: boolean;
}

export function useEnhancedForm<T extends Record<string, any>>({
  schema,
  onSubmit,
  onSuccess,
  successMessage = 'Operação realizada com sucesso!',
  resetOnSuccess = true
}: UseEnhancedFormOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<Partial<T>>({});

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setData({});
    setErrors({});
  }, []);

  const validateField = useCallback((field: keyof T, value: any): boolean => {
    if (!schema) return true;

    try {
      // For individual field validation, we validate the full object
      // but only report errors for the specific field
      const testData = { ...data, [field]: value };
      schema.parse(testData);
      
      // Clear any existing error for this field
      if (errors[field as string]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues.find(issue => 
          issue.path.includes(field as string)
        );
        if (issue) {
          setFieldError(field, issue.message);
        }
        return false;
      }
    }
    return true;
  }, [schema, data, errors, setFieldError]);

  const validate = useCallback((): boolean => {
    if (!schema) return true;

    try {
      const sanitizedData = sanitizeFormData(data as T);
      schema.parse(sanitizedData);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        toast.error('Verifique os campos obrigatórios');
        return false;
      }
    }
    return false;
  }, [data, schema, clearErrors]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const sanitizedData = sanitizeFormData(data as T);
      await onSubmit(sanitizedData);
      
      showFormSuccess(successMessage);
      onSuccess?.(sanitizedData);
      
      if (resetOnSuccess) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showFormError(error);
    } finally {
      setIsLoading(false);
    }
  }, [data, validate, onSubmit, successMessage, onSuccess, resetOnSuccess, reset]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: data[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFieldValue(field, e.target.value);
    },
    onBlur: () => {
      if (data[field] !== undefined) {
        validateField(field, data[field]);
      }
    },
    error: errors[field as string],
    className: errors[field as string] ? 'border-red-500 focus:border-red-500' : ''
  }), [data, errors, setFieldValue, validateField]);

  const getSelectProps = useCallback((field: keyof T) => ({
    value: data[field] || '',
    onValueChange: (value: string) => {
      setFieldValue(field, value);
    },
    error: errors[field as string]
  }), [data, errors, setFieldValue]);

  return {
    data,
    isLoading,
    errors,
    setFieldValue,
    setFieldError,
    clearErrors,
    reset,
    validate,
    validateField,
    handleSubmit,
    getFieldProps,
    getSelectProps,
    hasErrors: Object.keys(errors).length > 0
  };
}