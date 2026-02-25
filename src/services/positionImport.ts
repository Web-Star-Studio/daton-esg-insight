import * as XLSX from 'xlsx';
import { getDepartments, createDepartment, createPosition, getPositions } from './organizationalStructure';
import type { Position, Department } from '@/types/entities/organization';

const VALID_LEVELS = ['Trainee', 'Junior', 'Pleno', 'Senior', 'Gerente', 'Diretor'];
const VALID_EDUCATION = [
  'Ensino Fundamental', 'Ensino Médio', 'Ensino Técnico',
  'Ensino Superior Incompleto', 'Ensino Superior Completo',
  'Pós-Graduação', 'Mestrado', 'Doutorado'
];

const HEADER_MAP: Record<string, string> = {
  'título': 'title', 'titulo': 'title', 'title': 'title',
  'descrição': 'description', 'descricao': 'description', 'description': 'description',
  'departamento': 'department', 'department': 'department',
  'nível': 'level', 'nivel': 'level', 'level': 'level',
  'salário mínimo': 'salary_min', 'salario minimo': 'salary_min', 'salary min': 'salary_min',
  'salário máximo': 'salary_max', 'salario maximo': 'salary_max', 'salary max': 'salary_max',
  'escolaridade exigida': 'education', 'escolaridade': 'education', 'education': 'education',
  'experiência (anos)': 'experience', 'experiencia (anos)': 'experience', 'experiência': 'experience', 'experiencia': 'experience', 'experience': 'experience',
  'requisitos': 'requirements', 'requirements': 'requirements',
  'responsabilidades': 'responsibilities', 'responsibilities': 'responsibilities',
};

export interface ParsedPosition {
  rowIndex: number;
  title: string;
  description?: string;
  department?: string;
  level?: string;
  salary_min?: number;
  salary_max?: number;
  education?: string;
  experience?: number;
  requirements?: string[];
  responsibilities?: string[];
  errors: string[];
  isValid: boolean;
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: { row: number; message: string }[];
  createdDepartments: string[];
}

export function generatePositionTemplate(): void {
  const headers = [
    'Título', 'Descrição', 'Departamento', 'Nível', 'Salário Mínimo',
    'Salário Máximo', 'Escolaridade Exigida', 'Experiência (anos)',
    'Requisitos', 'Responsabilidades'
  ];

  const exampleRows = [
    ['Analista de RH', 'Responsável por processos seletivos', 'Recursos Humanos', 'Pleno', 4000, 6000, 'Ensino Superior Completo', 3, 'Conhecimento em R&S; Excel avançado', 'Conduzir entrevistas; Elaborar relatórios'],
    ['Engenheiro Ambiental', 'Gestão de licenças ambientais', 'Meio Ambiente', 'Senior', 8000, 12000, 'Pós-Graduação', 5, 'CREA ativo; Gestão de resíduos', 'Elaborar PGRS; Acompanhar licenciamentos'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
    { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 40 }, { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo de Cargos');
  XLSX.writeFile(wb, 'modelo_importacao_cargos.xlsx');
}

export async function parsePositionFile(file: File): Promise<ParsedPosition[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rawRows.length < 2) return [];

  // Find header row
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i];
    if (row && row.some((cell: any) => {
      const val = String(cell || '').toLowerCase().trim();
      return val === 'título' || val === 'titulo' || val === 'title';
    })) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = rawRows[headerRowIdx].map((h: any) => String(h || '').toLowerCase().trim());
  const columnMap: Record<string, number> = {};
  
  headerRow.forEach((header: string, idx: number) => {
    const mapped = HEADER_MAP[header];
    if (mapped) columnMap[mapped] = idx;
  });

  const dataRows = rawRows.slice(headerRowIdx + 1).filter((row: any[]) => 
    row && row.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '')
  );

  return dataRows.map((row, i) => {
    const get = (key: string) => {
      const idx = columnMap[key];
      return idx !== undefined ? String(row[idx] ?? '').trim() : '';
    };
    const getNum = (key: string) => {
      const val = get(key);
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    };
    const getList = (key: string) => {
      const val = get(key);
      return val ? val.split(';').map(s => s.trim()).filter(Boolean) : undefined;
    };

    const title = get('title');
    const level = get('level');
    const education = get('education');
    const salaryMin = getNum('salary_min');
    const salaryMax = getNum('salary_max');
    const experience = getNum('experience');
    const errors: string[] = [];

    if (!title) errors.push('Título é obrigatório');
    if (level && !VALID_LEVELS.some(v => v.toLowerCase() === level.toLowerCase()))
      errors.push(`Nível inválido: "${level}". Use: ${VALID_LEVELS.join(', ')}`);
    if (education && !VALID_EDUCATION.some(v => v.toLowerCase() === education.toLowerCase()))
      errors.push(`Escolaridade inválida: "${education}"`);
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax)
      errors.push('Salário mínimo maior que máximo');

    return {
      rowIndex: headerRowIdx + 2 + i,
      title,
      description: get('description') || undefined,
      department: get('department') || undefined,
      level: level ? VALID_LEVELS.find(v => v.toLowerCase() === level.toLowerCase()) : undefined,
      salary_min: salaryMin,
      salary_max: salaryMax,
      education: education ? VALID_EDUCATION.find(v => v.toLowerCase() === education.toLowerCase()) : undefined,
      experience,
      requirements: getList('requirements'),
      responsibilities: getList('responsibilities'),
      errors,
      isValid: errors.length === 0,
    };
  });
}

export function validateParsedPositions(rows: ParsedPosition[], existingPositions: Position[]): ParsedPosition[] {
  const existingTitles = new Set(existingPositions.map(p => p.title.toLowerCase()));
  const seenTitles = new Set<string>();

  return rows.map(row => {
    const newErrors = [...row.errors];
    
    if (row.title) {
      const lower = row.title.toLowerCase();
      if (existingTitles.has(lower)) {
        newErrors.push(`Cargo "${row.title}" já existe`);
      }
      if (seenTitles.has(lower)) {
        newErrors.push(`Cargo "${row.title}" duplicado no arquivo`);
      }
      seenTitles.add(lower);
    }

    return { ...row, errors: newErrors, isValid: newErrors.length === 0 };
  });
}

export async function importPositions(rows: ParsedPosition[]): Promise<ImportResult> {
  const validRows = rows.filter(r => r.isValid);
  const result: ImportResult = { successCount: 0, errorCount: 0, errors: [], createdDepartments: [] };

  // Load existing departments
  const departments = await getDepartments();
  const deptMap = new Map<string, string>();
  departments.forEach(d => deptMap.set(d.name.toLowerCase(), d.id));

  for (const row of validRows) {
    try {
      let departmentId: string | undefined;

      if (row.department) {
        const deptKey = row.department.toLowerCase();
        if (deptMap.has(deptKey)) {
          departmentId = deptMap.get(deptKey);
        } else {
          const newDept = await createDepartment({ name: row.department, company_id: '' } as any);
          deptMap.set(deptKey, newDept.id);
          departmentId = newDept.id;
          result.createdDepartments.push(row.department);
        }
      }

      await createPosition({
        title: row.title,
        description: row.description,
        department_id: departmentId,
        level: row.level,
        salary_range_min: row.salary_min,
        salary_range_max: row.salary_max,
        required_education_level: row.education,
        required_experience_years: row.experience,
        requirements: row.requirements,
        responsibilities: row.responsibilities,
        company_id: '',
      } as any);

      result.successCount++;
    } catch (error: any) {
      result.errorCount++;
      result.errors.push({ row: row.rowIndex, message: error?.message || 'Erro desconhecido' });
    }
  }

  result.errorCount += rows.filter(r => !r.isValid).length;
  return result;
}
