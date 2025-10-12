import { supabase } from '@/integrations/supabase/client';

export const generateNextEmployeeCode = async (companyId: string): Promise<string> => {
  try {
    // Get the last employee code for this company
    const { data: employees, error } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Find the highest numeric code
    let maxNumber = 0;
    const prefix = 'EMP';

    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        const match = emp.employee_code.match(/^([A-Za-z-]+)(\d+)$/);
        if (match) {
          const num = parseInt(match[2]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }

    // Generate next code
    const nextNumber = maxNumber + 1;
    const nextCode = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    // Verify it doesn't exist (safety check)
    const { data: existing } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId)
      .eq('employee_code', nextCode)
      .maybeSingle();

    if (existing) {
      // If it exists, try again with next number
      return generateNextEmployeeCode(companyId);
    }

    return nextCode;
  } catch (error) {
    console.error('Error generating employee code:', error);
    // Fallback to timestamp-based code
    return `EMP${Date.now().toString().slice(-6)}`;
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
