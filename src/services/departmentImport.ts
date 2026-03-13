import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { getDepartments, type Department } from './organizationalStructure';

export interface DepartmentImportRow {
  name: string;
  description?: string;
  parent_department?: string;
  budget?: number;
  cost_center?: string;
  _error?: string;
  _status?: 'valid' | 'error' | 'skipped';
}

export interface DepartmentImportResult {
  created: number;
  skipped: number;
  errors: number;
  details: { row: number; name: string; status: 'created' | 'skipped' | 'error'; message: string }[];
}

const TEMPLATE_HEADERS = ['name', 'description', 'parent_department', 'budget', 'cost_center'];
const TEMPLATE_ROWS = [
  ['Financeiro', 'Gestão financeira e orçamentária', '', '50000', 'CC-FIN'],
  ['Contabilidade', 'Área contábil e fiscal', 'Financeiro', '20000', 'CC-CONT'],
  ['Recursos Humanos', 'Gestão de pessoas', '', '35000', 'CC-RH'],
  ['Recrutamento', 'Seleção e admissão', 'Recursos Humanos', '15000', 'CC-RECR'],
];

export function downloadTemplateCSV() {
  const csv = Papa.unparse({ fields: TEMPLATE_HEADERS, data: TEMPLATE_ROWS });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_departamentos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplateXLSX() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Departamentos');
  XLSX.writeFile(wb, 'template_departamentos.xlsx');
}

export async function parseDepartmentFile(file: File): Promise<DepartmentImportRow[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(mapRows(results.data as Record<string, any>[]));
        },
        error: (err) => reject(new Error(err.message)),
      });
    });
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    if (json.length < 2) return [];
    const headers = (json[0] as any[]).map((h) => String(h || '').trim().toLowerCase());
    return mapRows(
      json.slice(1).map((row) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => (obj[h] = row[i]));
        return obj;
      })
    );
  }

  throw new Error('Formato não suportado. Use CSV ou XLSX.');
}

function mapRows(raw: Record<string, any>[]): DepartmentImportRow[] {
  return raw
    .filter((r) => r.name || r.nome)
    .map((r) => ({
      name: String(r.name || r.nome || '').trim(),
      description: String(r.description || r.descricao || r.descrição || '').trim() || undefined,
      parent_department: String(r.parent_department || r.departamento_pai || '').trim() || undefined,
      budget: r.budget || r.orcamento || r.orçamento ? Number(r.budget || r.orcamento || r.orçamento) : undefined,
      cost_center: String(r.cost_center || r.centro_custo || r.centro_de_custo || '').trim() || undefined,
    }));
}

export function validateRows(rows: DepartmentImportRow[], existingDepartments: Department[]): DepartmentImportRow[] {
  const existingNames = new Set(existingDepartments.map((d) => d.name.toLowerCase()));
  const importNames = new Set<string>();

  return rows.map((row) => {
    if (!row.name) {
      return { ...row, _status: 'error' as const, _error: 'Nome obrigatório' };
    }
    if (existingNames.has(row.name.toLowerCase())) {
      return { ...row, _status: 'skipped' as const, _error: 'Departamento já existe' };
    }
    if (row.parent_department) {
      const parentExists =
        existingNames.has(row.parent_department.toLowerCase()) ||
        importNames.has(row.parent_department.toLowerCase());
      if (!parentExists) {
        return { ...row, _status: 'error' as const, _error: `Dept. pai "${row.parent_department}" não encontrado` };
      }
    }
    importNames.add(row.name.toLowerCase());
    return { ...row, _status: 'valid' as const };
  });
}

export async function importDepartments(rows: DepartmentImportRow[]): Promise<DepartmentImportResult> {
  const existingDepartments = await getDepartments();
  const nameToId = new Map<string, string>();
  existingDepartments.forEach((d) => nameToId.set(d.name.toLowerCase(), d.id));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  const result: DepartmentImportResult = { created: 0, skipped: 0, errors: 0, details: [] };

  // Sort: parents before children
  const sorted = topologicalSort(rows);

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    const rowIdx = rows.indexOf(row) + 2; // +2 for 1-indexed + header

    if (!row.name) {
      result.errors++;
      result.details.push({ row: rowIdx, name: row.name || '(vazio)', status: 'error', message: 'Nome obrigatório' });
      continue;
    }

    if (nameToId.has(row.name.toLowerCase())) {
      result.skipped++;
      result.details.push({ row: rowIdx, name: row.name, status: 'skipped', message: 'Já existe' });
      continue;
    }

    let parentId: string | null = null;
    if (row.parent_department) {
      parentId = nameToId.get(row.parent_department.toLowerCase()) || null;
      if (!parentId) {
        result.errors++;
        result.details.push({ row: rowIdx, name: row.name, status: 'error', message: `Dept. pai "${row.parent_department}" não encontrado` });
        continue;
      }
    }

    const { data, error } = await supabase.from('departments').insert({
      company_id: profile.company_id,
      name: row.name,
      description: row.description || null,
      parent_department_id: parentId,
      budget: row.budget && !isNaN(row.budget) ? row.budget : null,
      cost_center: row.cost_center || null,
    }).select('id').single();

    if (error) {
      result.errors++;
      result.details.push({ row: rowIdx, name: row.name, status: 'error', message: error.message });
    } else {
      nameToId.set(row.name.toLowerCase(), data.id);
      result.created++;
      result.details.push({ row: rowIdx, name: row.name, status: 'created', message: 'Criado com sucesso' });
    }
  }

  return result;
}

function topologicalSort(rows: DepartmentImportRow[]): DepartmentImportRow[] {
  const nameMap = new Map(rows.map((r) => [r.name.toLowerCase(), r]));
  const sorted: DepartmentImportRow[] = [];
  const visited = new Set<string>();

  function visit(row: DepartmentImportRow) {
    const key = row.name.toLowerCase();
    if (visited.has(key)) return;
    visited.add(key);
    if (row.parent_department) {
      const parent = nameMap.get(row.parent_department.toLowerCase());
      if (parent) visit(parent);
    }
    sorted.push(row);
  }

  rows.forEach(visit);
  return sorted;
}
