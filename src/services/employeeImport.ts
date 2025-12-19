import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { validateCPF, formatCPF } from '@/utils/formValidation';
import { getDepartments, createDepartment, getPositions, createPosition } from './organizationalStructure';
import { getBranches, createBranch } from './branches';
import { formErrorHandler } from '@/utils/formErrorHandler';

export interface ParsedEmployee {
  rowNumber: number;
  cpf: string;
  cpfFormatted: string;
  nome: string;
  nascimento: string;
  email: string;
  lotacao: string;
  cargo: string;
  grupo?: string;
  // Extracted from Lotação
  extractedDepartment: string;
  extractedBranch: string;
  extractedCity: string;
}

export interface EmployeeValidation {
  rowNumber: number;
  cpf: string;
  nome: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  warnings: number;
  details: Array<{
    rowNumber: number;
    cpf: string;
    nome: string;
    status: 'success' | 'error' | 'warning';
    message: string;
  }>;
  createdEntities: {
    departments: string[];
    positions: string[];
    branches: string[];
  };
}

// Find the actual header row by looking for CPF and Nome columns
function findHeaderRow(worksheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Search in the first 15 rows for a row containing "CPF" and "Nome"
  for (let row = range.s.r; row <= Math.min(range.e.r, 15); row++) {
    const cellValues: string[] = [];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      if (cell && cell.v) {
        cellValues.push(String(cell.v).toUpperCase().trim());
      }
    }
    
    // If we find CPF and NOME in the same row, this is the header
    const hasCPF = cellValues.some(v => v === 'CPF');
    const hasNome = cellValues.some(v => v === 'NOME' || v.includes('NOME'));
    
    if (hasCPF && hasNome) {
      return row;
    }
  }
  
  return 0; // Fallback to first row
}

// Parse Excel file
export async function parseEmployeeExcel(file: File): Promise<ParsedEmployee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Detect header row automatically
        const headerRow = findHeaderRow(worksheet);
        
        // Parse starting from the detected header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          range: headerRow
        });
        
        const employees: ParsedEmployee[] = jsonData.map((row: any, index) => {
          const lotacao = row['Lotação'] || row['Lotacao'] || row['LOTAÇÃO'] || row['LOTACAO'] || '';
          const { department, branch, city } = extractLotacao(lotacao);
          
          const cpfRaw = row['CPF'] || row['cpf'] || '';
          const cpfClean = cpfRaw.replace(/\D/g, '');
          
          // Parse date from various formats
          let nascimento = '';
          const nascimentoRaw = row['Nascimento'] || row['NASCIMENTO'] || row['Data de Nascimento'] || row['Data Nascimento'] || '';
          if (nascimentoRaw) {
            nascimento = parseDate(nascimentoRaw);
          }
          
          return {
            rowNumber: headerRow + index + 2, // +2: header row + 1-indexed + data starts after header
            cpf: cpfClean,
            cpfFormatted: formatCPF(cpfClean),
            nome: row['Nome'] || row['NOME'] || row['nome'] || '',
            nascimento,
            email: row['E-mail'] || row['Email'] || row['EMAIL'] || row['e-mail'] || '',
            lotacao,
            cargo: row['Cargo'] || row['CARGO'] || row['cargo'] || '',
            grupo: row['Grupo'] || row['GRUPO'] || row['grupo'] || '',
            extractedDepartment: department,
            extractedBranch: branch,
            extractedCity: city,
          };
        });
        
        resolve(employees);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
}

// Extract department and branch from Lotação field
// Expected formats: "Departamento - Cidade" or "Departamento / Cidade" or "Departamento"
function extractLotacao(lotacao: string): { department: string; branch: string; city: string } {
  if (!lotacao) {
    return { department: '', branch: '', city: '' };
  }
  
  // Try different separators
  let parts: string[] = [];
  
  if (lotacao.includes(' - ')) {
    parts = lotacao.split(' - ').map(p => p.trim());
  } else if (lotacao.includes('/')) {
    parts = lotacao.split('/').map(p => p.trim());
  } else if (lotacao.includes(',')) {
    parts = lotacao.split(',').map(p => p.trim());
  }
  
  if (parts.length >= 2) {
    // Last part is usually city/branch, first part(s) is department
    const city = parts[parts.length - 1];
    const department = parts.slice(0, -1).join(' - ');
    return {
      department,
      branch: city, // Use city as branch name
      city,
    };
  }
  
  // If no separator, entire string is department
  return {
    department: lotacao,
    branch: '',
    city: '',
  };
}

// Parse date from various formats
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // If it's already in ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  // Handle DD/MM/YYYY format
  const brMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle MM/DD/YYYY format (less common in Brazil)
  const usMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (usMatch) {
    const [, month, day, yearShort] = usMatch;
    const year = parseInt(yearShort) > 50 ? `19${yearShort}` : `20${yearShort}`;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try JavaScript Date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  
  return '';
}

// Validate parsed employees
export async function validateEmployees(
  employees: ParsedEmployee[],
  companyId: string
): Promise<EmployeeValidation[]> {
  // Check existing CPFs in the database
  const cpfs = employees.map(e => e.cpf).filter(Boolean);
  
  const { data: existingEmployees } = await supabase
    .from('employees')
    .select('employee_code')
    .eq('company_id', companyId)
    .in('employee_code', cpfs);
  
  const existingCpfs = new Set(existingEmployees?.map(e => e.employee_code) || []);
  
  return employees.map(emp => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate CPF
    if (!emp.cpf) {
      errors.push('CPF não informado');
    } else if (!validateCPF(emp.cpf)) {
      errors.push('CPF inválido');
    } else if (existingCpfs.has(emp.cpf)) {
      warnings.push('CPF já cadastrado no sistema');
    }
    
    // Validate Nome
    if (!emp.nome || emp.nome.trim().length < 3) {
      errors.push('Nome inválido ou muito curto');
    }
    
    // Validate email format if provided
    if (emp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
      warnings.push('E-mail com formato inválido');
    }
    
    // Validate birth date if provided
    if (emp.nascimento) {
      const birthDate = new Date(emp.nascimento);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 14 || age > 100) {
        warnings.push('Data de nascimento parece inválida');
      }
    }
    
    // Check if department was extracted
    if (!emp.extractedDepartment && emp.lotacao) {
      warnings.push('Não foi possível extrair o departamento da lotação');
    }
    
    return {
      rowNumber: emp.rowNumber,
      cpf: emp.cpfFormatted,
      nome: emp.nome,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  });
}

// Import employees to database
export async function importEmployees(
  employees: ParsedEmployee[],
  options: {
    skipExisting: boolean;
    createMissingEntities: boolean;
  } = { skipExisting: true, createMissingEntities: true }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    errors: 0,
    warnings: 0,
    details: [],
    createdEntities: {
      departments: [],
      positions: [],
      branches: [],
    },
  };
  
  try {
    // Get company info
    const { profile } = await formErrorHandler.checkAuth();
    const companyId = profile.company_id;
    
    // Get existing entities
    let departments = await getDepartments();
    let positions = await getPositions();
    let branches = await getBranches();
    
    // Maps for quick lookup
    const departmentMap = new Map(departments.map(d => [d.name.toLowerCase(), d]));
    const positionMap = new Map(positions.map(p => [p.title.toLowerCase(), p]));
    const branchMap = new Map(branches.map(b => [(b.city || b.name).toLowerCase(), b]));
    
    // Check existing employees
    const cpfs = employees.map(e => e.cpf).filter(Boolean);
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('employee_code')
      .eq('company_id', companyId)
      .in('employee_code', cpfs);
    
    const existingCpfs = new Set(existingEmployees?.map(e => e.employee_code) || []);
    
    for (const emp of employees) {
      try {
        // Validate CPF
        if (!emp.cpf || !validateCPF(emp.cpf)) {
          result.errors++;
          result.details.push({
            rowNumber: emp.rowNumber,
            cpf: emp.cpfFormatted,
            nome: emp.nome,
            status: 'error',
            message: 'CPF inválido ou não informado',
          });
          continue;
        }
        
        // Check if already exists
        if (existingCpfs.has(emp.cpf)) {
          if (options.skipExisting) {
            result.warnings++;
            result.details.push({
              rowNumber: emp.rowNumber,
              cpf: emp.cpfFormatted,
              nome: emp.nome,
              status: 'warning',
              message: 'CPF já cadastrado - ignorado',
            });
            continue;
          }
        }
        
        // Create or get department
        let departmentName = emp.extractedDepartment;
        if (departmentName && options.createMissingEntities) {
          if (!departmentMap.has(departmentName.toLowerCase())) {
            const newDept = await createDepartment({
              name: departmentName,
              company_id: companyId,
            } as any);
            departmentMap.set(departmentName.toLowerCase(), newDept);
            result.createdEntities.departments.push(departmentName);
          }
        }
        
        // Create or get position
        let positionId: string | undefined;
        if (emp.cargo && options.createMissingEntities) {
          if (!positionMap.has(emp.cargo.toLowerCase())) {
            const newPosition = await createPosition({
              title: emp.cargo,
              company_id: companyId,
            } as any);
            positionMap.set(emp.cargo.toLowerCase(), newPosition);
            positionId = newPosition.id;
            result.createdEntities.positions.push(emp.cargo);
          } else {
            positionId = positionMap.get(emp.cargo.toLowerCase())?.id;
          }
        }
        
        // Create or get branch
        let branchId: string | undefined;
        if (emp.extractedCity && options.createMissingEntities) {
          if (!branchMap.has(emp.extractedCity.toLowerCase())) {
            const newBranch = await createBranch({
              name: `Filial ${emp.extractedCity}`,
              city: emp.extractedCity,
              is_headquarters: false,
              status: 'Ativo',
            });
            branchMap.set(emp.extractedCity.toLowerCase(), newBranch);
            branchId = newBranch.id;
            result.createdEntities.branches.push(emp.extractedCity);
          } else {
            branchId = branchMap.get(emp.extractedCity.toLowerCase())?.id;
          }
        }
        
        // Create employee
        const employeeData = {
          company_id: companyId,
          employee_code: emp.cpf, // Using CPF as employee code
          full_name: emp.nome.trim(),
          email: emp.email || null,
          birth_date: emp.nascimento || null,
          department: departmentName || null,
          position: emp.cargo || null,
          position_id: positionId || null,
          branch_id: branchId || null,
          hire_date: new Date().toISOString().split('T')[0], // Default to today
          employment_type: 'CLT', // Default
          status: 'Ativo', // Default
        };
        
        const { error } = await supabase
          .from('employees')
          .insert(employeeData);
        
        if (error) {
          throw error;
        }
        
        existingCpfs.add(emp.cpf); // Prevent duplicates in same import
        result.imported++;
        result.details.push({
          rowNumber: emp.rowNumber,
          cpf: emp.cpfFormatted,
          nome: emp.nome,
          status: 'success',
          message: 'Importado com sucesso',
        });
        
      } catch (error) {
        result.errors++;
        result.details.push({
          rowNumber: emp.rowNumber,
          cpf: emp.cpfFormatted,
          nome: emp.nome,
          status: 'error',
          message: `Erro: ${(error as Error).message}`,
        });
      }
    }
    
    result.success = result.errors === 0;
    
  } catch (error) {
    result.success = false;
    result.errors = employees.length;
    result.details.push({
      rowNumber: 0,
      cpf: '',
      nome: '',
      status: 'error',
      message: `Erro geral: ${(error as Error).message}`,
    });
  }
  
  return result;
}

// Download template Excel
export function downloadEmployeeTemplate() {
  const templateData = [
    {
      'CPF': '123.456.789-00',
      'Nome': 'João da Silva',
      'Nascimento': '15/06/1985',
      'E-mail': 'joao.silva@empresa.com',
      'Lotação': 'TI - São Paulo',
      'Cargo': 'Analista de Sistemas',
      'Grupo': 'Tecnologia',
    },
    {
      'CPF': '987.654.321-00',
      'Nome': 'Maria Santos',
      'Nascimento': '22/03/1990',
      'E-mail': 'maria.santos@empresa.com',
      'Lotação': 'RH - Rio de Janeiro',
      'Cargo': 'Coordenadora de RH',
      'Grupo': 'Administrativo',
    },
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 16 }, // CPF
    { wch: 30 }, // Nome
    { wch: 12 }, // Nascimento
    { wch: 30 }, // E-mail
    { wch: 25 }, // Lotação
    { wch: 25 }, // Cargo
    { wch: 15 }, // Grupo
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
  
  XLSX.writeFile(wb, 'template_importacao_funcionarios.xlsx');
}
