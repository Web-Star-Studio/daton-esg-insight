// Data reconciliation utilities for intelligent duplicate detection and conflict resolution

export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

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

export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const distance = calculateLevenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLength);
}

export function findSimilarRecords(
  newData: Record<string, any>,
  existingRecords: Record<string, any>[],
  keyFields: string[],
  threshold: number = 0.8
): Array<{ record: Record<string, any>; similarity: number }> {
  const matches: Array<{ record: Record<string, any>; similarity: number }> = [];

  for (const existing of existingRecords) {
    let totalSimilarity = 0;
    let fieldsCompared = 0;

    for (const field of keyFields) {
      const newValue = String(newData[field] || '');
      const existingValue = String(existing[field] || '');
      
      if (newValue && existingValue) {
        totalSimilarity += calculateSimilarity(newValue, existingValue);
        fieldsCompared++;
      }
    }

    if (fieldsCompared > 0) {
      const avgSimilarity = totalSimilarity / fieldsCompared;
      if (avgSimilarity >= threshold) {
        matches.push({ record: existing, similarity: avgSimilarity });
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

export function detectConflicts(
  newData: Record<string, any>,
  existingRecord: Record<string, any>,
  ignoreFields: string[] = ['id', 'created_at', 'updated_at', 'company_id']
): Array<{
  field: string;
  oldValue: any;
  newValue: any;
  conflict: boolean;
}> {
  const conflicts: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    conflict: boolean;
  }> = [];

  for (const [key, newValue] of Object.entries(newData)) {
    if (ignoreFields.includes(key)) continue;
    
    const oldValue = existingRecord[key];
    
    if (oldValue !== undefined && oldValue !== null && newValue !== undefined && newValue !== null) {
      const conflict = String(oldValue).toLowerCase() !== String(newValue).toLowerCase();
      
      conflicts.push({
        field: key,
        oldValue,
        newValue,
        conflict
      });
    }
  }

  return conflicts.filter(c => c.conflict);
}

export function suggestMergeStrategy(
  conflicts: Array<{ field: string; oldValue: any; newValue: any }>,
  newDataDate?: Date,
  existingDataDate?: Date
): 'keep_existing' | 'use_new' | 'merge_manual' {
  // If very few conflicts, prefer new data (likely an update)
  if (conflicts.length <= 2) {
    return 'use_new';
  }

  // If dates available and new is significantly newer, use new
  if (newDataDate && existingDataDate) {
    const daysDiff = (newDataDate.getTime() - existingDataDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      return 'use_new';
    }
  }

  // Many conflicts = manual review needed
  if (conflicts.length > 5) {
    return 'merge_manual';
  }

  return 'keep_existing';
}

export function mergeData(
  existingRecord: Record<string, any>,
  newData: Record<string, any>,
  strategy: 'keep_existing' | 'use_new' | 'prefer_non_empty' = 'prefer_non_empty'
): Record<string, any> {
  const merged = { ...existingRecord };

  for (const [key, newValue] of Object.entries(newData)) {
    switch (strategy) {
      case 'use_new':
        merged[key] = newValue;
        break;
      
      case 'keep_existing':
        if (existingRecord[key] === undefined || existingRecord[key] === null) {
          merged[key] = newValue;
        }
        break;
      
      case 'prefer_non_empty':
        if (newValue !== undefined && newValue !== null && newValue !== '') {
          merged[key] = newValue;
        }
        break;
    }
  }

  return merged;
}

export function normalizeForComparison(value: any): string {
  if (value === null || value === undefined) return '';
  
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function isSamePerson(
  data1: { name?: string; cpf?: string; email?: string },
  data2: { name?: string; cpf?: string; email?: string }
): boolean {
  // CPF match = definitive
  if (data1.cpf && data2.cpf) {
    return normalizeForComparison(data1.cpf) === normalizeForComparison(data2.cpf);
  }

  // Email match = very strong
  if (data1.email && data2.email) {
    return normalizeForComparison(data1.email) === normalizeForComparison(data2.email);
  }

  // Name similarity
  if (data1.name && data2.name) {
    return calculateSimilarity(data1.name, data2.name) > 0.9;
  }

  return false;
}
