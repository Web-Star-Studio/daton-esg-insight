import { useId, useEffect, useRef } from 'react';
import { useFormValidation } from './useFormValidation';
import { z } from 'zod';

interface AccessibilityOptions {
  autoFocus?: boolean;
  announceErrors?: boolean;
  describedBy?: string[];
}

interface AccessibleFormField {
  id: string;
  labelId: string;
  errorId: string;
  descriptionId?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
}

export function useAccessibleForm<T>(
  schema: z.ZodSchema<T>,
  options: AccessibilityOptions = {}
) {
  const { validate, errors, clearErrors, getFieldError } = useFormValidation(schema);
  const formId = useId();
  const errorAnnouncerRef = useRef<HTMLDivElement>(null);

  // Announce errors to screen readers
  useEffect(() => {
    if (options.announceErrors && Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors)[0];
      if (errorAnnouncerRef.current && errorMessage) {
        errorAnnouncerRef.current.textContent = `Erro de validação: ${errorMessage}`;
      }
    }
  }, [errors, options.announceErrors]);

  const getFieldProps = (
    fieldName: string, 
    fieldOptions: {
      required?: boolean;
      description?: string;
    } = {}
  ): AccessibleFormField => {
    const fieldId = `${formId}-${fieldName}`;
    const labelId = `${fieldId}-label`;
    const errorId = `${fieldId}-error`;
    const descriptionId = fieldOptions.description ? `${fieldId}-description` : undefined;
    
    const hasError = !!getFieldError(fieldName);
    const describedBy = [
      ...(options.describedBy || []),
      ...(descriptionId ? [descriptionId] : []),
      ...(hasError ? [errorId] : [])
    ].join(' ') || undefined;

    return {
      id: fieldId,
      labelId,
      errorId,
      descriptionId,
      'aria-invalid': hasError,
      'aria-describedby': describedBy,
      'aria-required': fieldOptions.required
    };
  };

  const createErrorAnnouncer = () => {
    return {
      ref: errorAnnouncerRef,
      role: "status" as const,
      "aria-live": "polite" as const,
      "aria-atomic": "true" as const,
      className: "sr-only"
    };
  };

  return {
    validate,
    errors,
    clearErrors,
    getFieldError,
    getFieldProps,
    createErrorAnnouncer,
    formId
  };
}