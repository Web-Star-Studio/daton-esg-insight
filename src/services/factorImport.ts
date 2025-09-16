import { createCustomEmissionFactor, CreateEmissionFactorData, getEmissionFactors, type EmissionFactor } from "./emissionFactors";

interface ImportResult {
  success: number;
  errors: number;
  warnings: number;
  duplicates: number;
  details: Array<{
    row: number;
    status: "success" | "error" | "warning" | "duplicate";
    message: string;
    duplicateData?: {
      existingFactor: EmissionFactor;
      newFactor: RawFactorData;
    };
  }>;
}

interface RawFactorData {
  nome?: string;
  categoria?: string;
  unidade?: string;
  co2_factor?: string | number;
  ch4_factor?: string | number;
  n2o_factor?: string | number;
  fonte?: string;
  ano_validade?: string | number;
}

export async function importFactorsFromFile(
  file: File, 
  onDuplicate?: (existingFactor: EmissionFactor, newFactor: RawFactorData) => Promise<'replace' | 'keep_both' | 'skip'>
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    errors: 0,
    warnings: 0,
    duplicates: 0,
    details: []
  };

  try {
    let data: RawFactorData[];

    if (file.type === 'text/csv') {
      data = await parseCSV(file);
    } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      data = await parseExcel(file);
    } else {
      throw new Error('Formato de arquivo não suportado');
    }

    // Load existing factors for duplicate detection
    const existingFactors = await getEmissionFactors();

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const rowNum = i + 2; // Account for header row
      const row = data[i];

      try {
        const validationResult = validateRowData(row, rowNum);
        
        if (validationResult.errors.length > 0) {
          result.errors++;
          result.details.push({
            row: rowNum,
            status: "error",
            message: validationResult.errors.join("; ")
          });
          continue;
        }

        if (validationResult.warnings.length > 0) {
          result.warnings++;
          result.details.push({
            row: rowNum,
            status: "warning",
            message: validationResult.warnings.join("; ")
          });
        }

        // Convert to CreateEmissionFactorData format
        const factorData: CreateEmissionFactorData = {
          name: row.nome!,
          category: row.categoria!,
          activity_unit: row.unidade!,
          co2_factor: parseNumber(row.co2_factor),
          ch4_factor: parseNumber(row.ch4_factor),
          n2o_factor: parseNumber(row.n2o_factor),
          source: row.fonte!,
          year_of_validity: parseYear(row.ano_validade)
        };

        // Check for duplicates
        const duplicateFactor = findDuplicateFactor(existingFactors, factorData);
        if (duplicateFactor && onDuplicate) {
          const action = await onDuplicate(duplicateFactor, row);
          
          if (action === 'skip') {
            result.details.push({
              row: rowNum,
              status: "duplicate",
              message: `Fator "${row.nome}" pulado (duplicata detectada)`
            });
            continue;
          }
          
          if (action === 'replace') {
            // Update existing factor
            const { updateCustomEmissionFactor } = await import('./emissionFactors');
            if (duplicateFactor.type === 'custom') {
              await updateCustomEmissionFactor(duplicateFactor.id, factorData);
              result.success++;
              result.details.push({
                row: rowNum,
                status: "success",
                message: `Fator "${row.nome}" atualizado com sucesso`
              });
            } else {
              // Create as custom if trying to replace system factor
              await createCustomEmissionFactor({
                ...factorData,
                name: `${factorData.name} (Customizado)`
              });
              result.success++;
              result.details.push({
                row: rowNum,
                status: "success",
                message: `Fator "${row.nome}" criado como customizado`
              });
            }
            continue;
          }
          
          if (action === 'keep_both') {
            // Create with modified name
            factorData.name = `${factorData.name} (${new Date().toLocaleDateString()})`;
            result.duplicates++;
          }
        } else if (duplicateFactor && !onDuplicate) {
          // Auto-skip duplicates if no handler provided
          result.duplicates++;
          result.details.push({
            row: rowNum,
            status: "duplicate",
            message: `Fator "${row.nome}" ignorado (já existe fator similar)`
          });
          continue;
        }

        // Create the emission factor
        await createCustomEmissionFactor(factorData);
        
        result.success++;
        result.details.push({
          row: rowNum,
          status: "success",
          message: `Fator "${row.nome}" criado com sucesso`
        });

      } catch (error) {
        result.errors++;
        result.details.push({
          row: rowNum,
          status: "error",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }

  } catch (error) {
    throw new Error(`Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }

  return result;
}

async function parseCSV(file: File): Promise<RawFactorData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const data: RawFactorData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const row: RawFactorData = {};
          
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (value) {
              // Map common header variations
              const normalizedHeader = normalizeHeader(header);
              (row as any)[normalizedHeader] = value;
            }
          });
          
          data.push(row);
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
    reader.readAsText(file, 'utf-8');
  });
}

async function parseExcel(file: File): Promise<RawFactorData[]> {
  // For Excel parsing, we'll use a simple approach
  // In production, you'd want to use a library like xlsx
  throw new Error('Importação Excel ainda não implementada. Use CSV por enquanto.');
}

function normalizeHeader(header: string): string {
  const headerMap: Record<string, string> = {
    'nome': 'nome',
    'name': 'nome',
    'categoria': 'categoria',
    'category': 'categoria',
    'unidade': 'unidade',
    'unit': 'unidade',
    'activity_unit': 'unidade',
    'co2': 'co2_factor',
    'co2_factor': 'co2_factor',
    'fator_co2': 'co2_factor',
    'ch4': 'ch4_factor',
    'ch4_factor': 'ch4_factor',
    'fator_ch4': 'ch4_factor',
    'n2o': 'n2o_factor',
    'n2o_factor': 'n2o_factor',
    'fator_n2o': 'n2o_factor',
    'fonte': 'fonte',
    'source': 'fonte',
    'ano': 'ano_validade',
    'ano_validade': 'ano_validade',
    'year': 'ano_validade',
    'year_of_validity': 'ano_validade'
  };

  return headerMap[header.toLowerCase()] || header;
}

function validateRowData(row: RawFactorData, rowNum: number) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row.nome?.trim()) {
    errors.push("Nome é obrigatório");
  }
  
  if (!row.categoria?.trim()) {
    errors.push("Categoria é obrigatória");
  }
  
  if (!row.unidade?.trim()) {
    errors.push("Unidade é obrigatória");
  }
  
  if (!row.fonte?.trim()) {
    errors.push("Fonte é obrigatória");
  }

  // At least one emission factor must be provided
  const hasCO2 = row.co2_factor && parseNumber(row.co2_factor) !== undefined;
  const hasCH4 = row.ch4_factor && parseNumber(row.ch4_factor) !== undefined;
  const hasN2O = row.n2o_factor && parseNumber(row.n2o_factor) !== undefined;
  
  if (!hasCO2 && !hasCH4 && !hasN2O) {
    errors.push("Pelo menos um fator de emissão (CO2, CH4 ou N2O) deve ser fornecido");
  }

  // Validate numeric values
  if (row.co2_factor && parseNumber(row.co2_factor) === undefined) {
    errors.push("Fator CO2 deve ser um número válido");
  }
  
  if (row.ch4_factor && parseNumber(row.ch4_factor) === undefined) {
    errors.push("Fator CH4 deve ser um número válido");
  }
  
  if (row.n2o_factor && parseNumber(row.n2o_factor) === undefined) {
    errors.push("Fator N2O deve ser um número válido");
  }

  // Validate year
  if (row.ano_validade && parseYear(row.ano_validade) === undefined) {
    warnings.push("Ano de validade inválido, será ignorado");
  }

  // Validate negative values
  if (parseNumber(row.co2_factor) < 0) {
    errors.push("Fator CO2 não pode ser negativo");
  }
  
  if (parseNumber(row.ch4_factor) < 0) {
    errors.push("Fator CH4 não pode ser negativo");
  }
  
  if (parseNumber(row.n2o_factor) < 0) {
    errors.push("Fator N2O não pode ser negativo");
  }

  return { errors, warnings };
}

function parseNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

function parseYear(value: string | number | undefined): number | undefined {
  const num = parseNumber(value);
  if (num === undefined) return undefined;
  
  const year = Math.floor(num);
  if (year < 1990 || year > 2050) {
    return undefined;
  }
  
  return year;
}

function findDuplicateFactor(
  existingFactors: EmissionFactor[], 
  newFactor: CreateEmissionFactorData
): EmissionFactor | null {
  return existingFactors.find(existing => {
    // Exact match on name, category and unit
    const exactMatch = (
      existing.name.toLowerCase().trim() === newFactor.name.toLowerCase().trim() &&
      existing.category.toLowerCase().trim() === newFactor.category.toLowerCase().trim() &&
      existing.activity_unit.toLowerCase().trim() === newFactor.activity_unit.toLowerCase().trim()
    );

    if (exactMatch) return true;

    // Similar name and same category/unit (fuzzy match for typos)
    const nameSimilarity = calculateStringSimilarity(
      existing.name.toLowerCase().trim(),
      newFactor.name.toLowerCase().trim()
    );
    
    const similarMatch = (
      nameSimilarity > 0.85 && // 85% similarity
      existing.category.toLowerCase().trim() === newFactor.category.toLowerCase().trim() &&
      existing.activity_unit.toLowerCase().trim() === newFactor.activity_unit.toLowerCase().trim()
    );

    return similarMatch;
  }) || null;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}