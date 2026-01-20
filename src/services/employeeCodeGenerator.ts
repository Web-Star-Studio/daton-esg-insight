import { supabase } from '@/integrations/supabase/client';

export const generateNextEmployeeCode = async (companyId: string): Promise<string> => {
  const prefix = 'EMP';
  
  try {
    // Get all employee codes for this company
    const { data: employees, error } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId);

    if (error) throw error;

    // Collect all existing codes in a Set for fast lookup
    const existingCodes = new Set(
      employees?.map(emp => emp.employee_code) || []
    );

    // Find the highest number from codes that match EMP pattern
    let maxNumber = 0;
    existingCodes.forEach(code => {
      const match = code?.match(/^EMP(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Try to find next available code (with limit to prevent infinite loop)
    const maxAttempts = 1000;
    for (let i = 1; i <= maxAttempts; i++) {
      const candidateNumber = maxNumber + i;
      const candidateCode = `${prefix}${String(candidateNumber).padStart(3, '0')}`;
      
      if (!existingCodes.has(candidateCode)) {
        return candidateCode;
      }
    }

    // Fallback to timestamp if somehow all attempts failed
    return `${prefix}${Date.now().toString().slice(-6)}`;
    
  } catch (error) {
    console.error('Error generating employee code:', error);
    // Fallback to timestamp-based code
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }
};

export const getAvailableCode = async (prefix: string, companyId: string): Promise<string> => {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId)
      .ilike('employee_code', `${prefix}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let maxNumber = 0;

    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        const match = emp.employee_code.match(/^([A-Za-z-]+)(\d+)$/);
        if (match && match[1] === prefix) {
          const num = parseInt(match[2]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error getting available code:', error);
    return `${prefix}001`;
  }
};

export const checkEmployeeCodeExists = async (code: string, companyId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId)
      .eq('employee_code', code)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking employee code:', error);
    return false;
  }
};
