import { CreateEmissionFactorData } from "./emissionFactors";

interface BrazilianFactorRow {
  ref: string;
  nome: string;
  ipcc_equivalent: string;
  unidade: string;
  pci: string;
  densidade: string;
  referencia: string;
  co2_factor: string;
  ch4_factor: string;
  n2o_factor: string;
  definicao: string;
}

export async function transformBrazilianFactorsCSV(csvContent: string): Promise<CreateEmissionFactorData[]> {
  const lines = csvContent.split('\n');
  const transformedFactors: CreateEmissionFactorData[] = [];
  
  let currentSection = '';
  let isDataSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and detect section headers
    if (!line) continue;
    
    // Detect section headers
    if (line.includes('Seção') && line.includes('Fatores de emissão')) {
      if (line.includes('combustão estacionária')) {
        currentSection = 'Combustão Estacionária';
      } else if (line.includes('biomassa')) {
        currentSection = 'Biomassa';
      } else if (line.includes('transporte')) {
        currentSection = 'Transporte';
      }
      isDataSection = false;
      continue;
    }
    
    // Detect table headers
    if (line.includes('Tabela') && line.includes('Fatores de emissão')) {
      isDataSection = true;
      continue;
    }
    
    // Skip header rows and metadata
    if (line.includes('Nº ref.') || line.includes('Combustível') || 
        line.includes(';;;;;;;;') || line.startsWith(';')) {
      continue;
    }
    
    // Process data rows
    if (isDataSection && currentSection) {
      const row = parseFactorRow(line, currentSection);
      if (row) {
        transformedFactors.push(row);
      }
    }
  }
  
  return transformedFactors;
}

function parseFactorRow(line: string, section: string): CreateEmissionFactorData | null {
  const columns = line.split(';');
  
  // Skip if not enough columns or invalid data
  if (columns.length < 10 || !columns[0] || !columns[1]) {
    return null;
  }
  
  const ref = columns[0].trim();
  const nome = columns[1].trim();
  const unidade = columns[3]?.trim() || '';
  
  // Skip if essential data is missing
  if (!nome || !unidade || isNaN(parseInt(ref))) {
    return null;
  }
  
  // Extract emission factors based on section and column structure
  let co2_factor: number | undefined;
  let ch4_factor: number | undefined;
  let n2o_factor: number | undefined;
  
  if (section === 'Transporte') {
    // For transport section (simpler structure)
    co2_factor = parseEmissionValue(columns[5]);
    ch4_factor = parseEmissionValue(columns[6]);
    n2o_factor = parseEmissionValue(columns[7]);
  } else {
    // For stationary combustion and biomass (complex structure)
    // CO2 factor is around column 18-19
    co2_factor = parseEmissionValue(columns[18] || columns[19]);
    // CH4 and N2O factors are in subsequent columns
    ch4_factor = parseEmissionValue(columns[20] || columns[21]);
    n2o_factor = parseEmissionValue(columns[24] || columns[25]);
  }
  
  // Get source reference
  const fonte = extractSource(columns);
  
  return {
    name: nome,
    category: section,
    activity_unit: normalizeUnit(unidade),
    co2_factor: co2_factor || 0,
    ch4_factor: ch4_factor || 0,
    n2o_factor: n2o_factor || 0,
    source: fonte || 'Programa Brasileiro GHG Protocol',
    year_of_validity: 2023
  };
}

function parseEmissionValue(value: string): number | undefined {
  if (!value) return undefined;
  
  // Clean the value - remove spaces and convert comma to dot
  const cleanValue = value.trim().replace(/\s+/g, '').replace(',', '.');
  
  // Remove any non-numeric characters except decimal point
  const numericValue = cleanValue.replace(/[^\d.-]/g, '');
  
  const parsed = parseFloat(numericValue);
  return isNaN(parsed) ? undefined : parsed;
}

function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'Toneladas': 't',
    'Litros': 'L',
    'kg': 'kg',
    'm³': 'm³',
    'TJ': 'TJ'
  };
  
  return unitMap[unit] || unit;
}

function extractSource(columns: string[]): string {
  // Look for source references in the later columns
  for (let i = 30; i < columns.length; i++) {
    const col = columns[i]?.trim();
    if (col && (col.includes('BEN') || col.includes('IPCC') || col.includes('MCTIC') || col.includes('ANP'))) {
      return col;
    }
  }
  
  // Look for references in earlier columns
  for (let i = 6; i < 15; i++) {
    const col = columns[i]?.trim();
    if (col && col.length > 3 && col.includes('2')) {
      return col;
    }
  }
  
  return 'Programa Brasileiro GHG Protocol';
}

export async function importBrazilianFactors(): Promise<{ success: number; errors: number; message: string }> {
  try {
    // Read the CSV file
    const response = await fetch('/fatores_emissao_brasil.csv');
    const csvContent = await response.text();
    
    // Transform the data
    const factors = await transformBrazilianFactorsCSV(csvContent);
    
    if (factors.length === 0) {
      return {
        success: 0,
        errors: 1,
        message: 'Nenhum fator de emissão válido encontrado no arquivo'
      };
    }
    
    // Import each factor using the existing service
    const { createCustomEmissionFactor } = await import('./emissionFactors');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const factor of factors) {
      try {
        await createCustomEmissionFactor(factor);
        successCount++;
      } catch (error) {
        console.error('Erro ao importar fator:', factor.name, error);
        errorCount++;
      }
    }
    
    return {
      success: successCount,
      errors: errorCount,
      message: `${successCount} fatores importados com sucesso, ${errorCount} erros`
    };
    
  } catch (error) {
    console.error('Erro no processo de importação:', error);
    return {
      success: 0,
      errors: 1,
      message: 'Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    };
  }
}