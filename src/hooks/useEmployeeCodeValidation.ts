import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface ValidationResult {
  isChecking: boolean;
  isAvailable: boolean;
  exists: boolean;
  suggestedCode: string | null;
}

export const useEmployeeCodeValidation = (code: string, companyId: string | null) => {
  const [result, setResult] = useState<ValidationResult>({
    isChecking: false,
    isAvailable: true,
    exists: false,
    suggestedCode: null,
  });

  const debouncedCode = useDebounce(code, 500);

  useEffect(() => {
    const checkCode = async () => {
      if (!debouncedCode || !companyId) {
        setResult({
          isChecking: false,
          isAvailable: true,
          exists: false,
          suggestedCode: null,
        });
        return;
      }

      setResult(prev => ({ ...prev, isChecking: true }));

      try {
        // Check if code exists
        const { data: existingEmployee, error } = await supabase
          .from('employees')
          .select('employee_code')
          .eq('company_id', companyId)
          .eq('employee_code', debouncedCode)
          .maybeSingle();

        if (error) throw error;

        const exists = !!existingEmployee;

        // If exists, get next available code
        let suggestedCode = null;
        if (exists) {
          // Extract prefix and number from code
          const match = debouncedCode.match(/^([A-Za-z-]+)(\d+)$/);
          if (match) {
            const prefix = match[1];
            const number = parseInt(match[2]);
            
            // Find next available code
            for (let i = number + 1; i <= number + 100; i++) {
              const testCode = `${prefix}${String(i).padStart(match[2].length, '0')}`;
              const { data } = await supabase
                .from('employees')
                .select('employee_code')
                .eq('company_id', companyId)
                .eq('employee_code', testCode)
                .maybeSingle();
              
              if (!data) {
                suggestedCode = testCode;
                break;
              }
            }
          }
        }

        setResult({
          isChecking: false,
          isAvailable: !exists,
          exists,
          suggestedCode,
        });
      } catch (error) {
        console.error('Error validating employee code:', error);
        setResult({
          isChecking: false,
          isAvailable: true,
          exists: false,
          suggestedCode: null,
        });
      }
    };

    checkCode();
  }, [debouncedCode, companyId]);

  return result;
};
