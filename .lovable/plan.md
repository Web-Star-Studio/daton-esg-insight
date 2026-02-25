

# Corrigir importação de funcionários para incluir Data de Admissão

## Problema

O serviço de importação de funcionários (`src/services/employeeImport.ts`) ignora qualquer coluna de data de admissão presente no arquivo importado. Em vez disso, define `hire_date` como a data do dia da importação (`new Date()`), causando todos os funcionários terem a mesma data.

**1.847 registros** foram afetados com `hire_date = 2025-12-19`.

## Causa raiz

- A interface `ParsedEmployee` não possui campo para data de admissão
- A função `parseEmployeeExcel()` não busca colunas como "Admissão", "Data Admissão", "Data de Contratação"
- A inserção no banco usa `new Date().toISOString().split('T')[0]` como fallback fixo

## Alterações necessárias

### 1. `src/services/employeeImport.ts`

**a) Adicionar campo `admissao` à interface `ParsedEmployee`:**
```typescript
export interface ParsedEmployee {
  // ... campos existentes
  admissao: string; // YYYY-MM-DD ou ''
}
```

**b) No `parseEmployeeExcel()`, mapear colunas de data de admissão:**
Buscar variações: "Admissão", "ADMISSÃO", "Data de Admissão", "Data Admissão", "Contratação", "Hire Date", "Data Contratacao"

Usar a mesma função `parseDate()` já existente para nascimento.

**c) Na inserção, usar a data parseada com fallback:**
```typescript
hire_date: emp.admissao || new Date().toISOString().split('T')[0],
```

### 2. Template de importação (se existir)

Adicionar coluna "Admissão" ao modelo XLSX de funcionários para que o usuário saiba que pode informar essa data.

### Sobre os dados existentes

Os 1.847 registros com `hire_date = 2025-12-19` precisariam ser corrigidos manualmente ou via reimportação. Isso é uma decisão do usuário — o sistema não tem como adivinhar as datas corretas retroativamente.

### Arquivos a modificar
- **`src/services/employeeImport.ts`** — adicionar parsing e mapeamento do campo de admissão

