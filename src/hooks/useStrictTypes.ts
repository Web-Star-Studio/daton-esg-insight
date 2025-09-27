// Strict TypeScript hooks for better type safety

import { useCallback, useMemo, useRef } from 'react';
import { isObject, isDefined, assertType } from '@/utils/typeGuards';
import { errorHandler } from '@/utils/errorHandler';

// Type-safe state management hook
export function useTypedState<T>(
  initialValue: T,
  validator?: (value: unknown) => value is T
) {
  const [state, setState] = useState<T>(initialValue);

  const setTypedState = useCallback((newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === 'function') {
      setState(newValue);
    } else {
      if (validator && !validator(newValue)) {
        errorHandler.handle(new Error('Invalid state value'), {
          component: 'useTypedState',
          function: 'setTypedState'
        });
        return;
      }
      setState(newValue);
    }
  }, [validator]);

  return [state, setTypedState] as const;
}

// Safe JSON parsing hook
export function useSafeJSON<T>(
  jsonString: string,
  defaultValue: T,
  validator?: (value: unknown) => value is T
): T {
  return useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (validator && !validator(parsed)) {
        return defaultValue;
      }
      
      return parsed as T;
    } catch {
      return defaultValue;
    }
  }, [jsonString, defaultValue, validator]);
}

// Type-safe API call hook
export function useTypedAPI<TRequest, TResponse>(
  apiCall: (request: TRequest) => Promise<TResponse>,
  responseValidator?: (value: unknown) => value is TResponse
) {
  const [state, setState] = useState<{
    data: TResponse | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: false, error: null });

  const execute = useCallback(async (request: TRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall(request);
      
      if (responseValidator && !responseValidator(response)) {
        throw new Error('Invalid API response format');
      }

      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('API call failed');
      setState({ data: null, loading: false, error: err });
      
      errorHandler.handle(err, {
        component: 'useTypedAPI',
        function: 'execute'
      });
      
      throw err;
    }
  }, [apiCall, responseValidator]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Strict form validation hook
export function useStrictForm<T extends Record<string, unknown>>(
  initialValues: T,
  validators: { [K in keyof T]?: (value: T[K]) => string | null }
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((field: keyof T, value: T[keyof T]) => {
    const validator = validators[field];
    if (!validator) return null;
    
    return validator(value);
  }, [validators]);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [validateField]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    (Object.keys(values) as Array<keyof T>).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    return isValid;
  }, [values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const hasErrors = Object.values(errors).some(error => error);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateAll,
    reset,
    hasErrors,
    isDirty
  };
}

// Import React hook
import { useState } from 'react';