
## Plano: Corrigir Parser para Formato FPLAN Gabardo

### Problema Identificado

O parser de importação de legislações não está reconhecendo a planilha FPLAN_003-GERAL.xlsx porque:

1. **Sheet errado**: O parser lê apenas a primeira aba (estatísticas), enquanto as legislações estão na segunda aba
2. **Colunas não reconhecidas**: O formato Gabardo usa nomes diferentes:
   - `TIPO` ao invés de `TIPO DE NORMA`
   - `Nº` ao invés de `Número`
   - `RESUMO E TÍTULO` ao invés de `Título/Ementa`
   - `DATA DA PUBLICAÇÃO` ao invés de `Data Publicação`
   - `TEMÁTICA` ao invés de `Tema`
   - `FONTE` ao invés de `URL`

---

### Estrutura Real da Planilha

```text
Sheet 1: Estatísticas e legenda (não contém legislações)
Sheet 2: Legislações com colunas:
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ TEMÁTICA | SUBTEMA | TIPO | Nº | DATA DA PUBLICAÇÃO | RESUMO E TÍTULO | POA | PIR │
│   ...    |   ...   |  ... | .. |        ...         |       ...       |  2  |  1  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças Técnicas

#### 1. Atualizar Função de Detecção de Sheet

**Arquivo:** `src/services/legislationImport.ts`

Adicionar lógica para encontrar o sheet correto:

```typescript
// Nova função para encontrar sheet com legislações
function findLegislationsSheet(workbook: XLSX.WorkBook): string {
  // Tentar encontrar sheet que contém headers de legislação
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let row = 0; row <= Math.min(range.e.r, 15); row++) {
      const values: string[] = [];
      for (let col = range.s.c; col <= Math.min(range.e.c, 30); col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell?.v) values.push(String(cell.v).toUpperCase().trim());
      }
      
      // Verificar padrões do formato Gabardo
      const hasTipo = values.some(v => v === 'TIPO' || v.includes('TIPO'));
      const hasNumero = values.some(v => v === 'Nº' || v === 'N°' || v.includes('NÚMERO'));
      const hasTematica = values.some(v => v.includes('TEMÁTICA') || v.includes('TEMATICA'));
      const hasResumo = values.some(v => v.includes('RESUMO') || v.includes('TÍTULO'));
      
      // Se encontrar colunas-chave, este é o sheet correto
      if ((hasTipo && hasNumero) || (hasTematica && hasResumo)) {
        return sheetName;
      }
    }
  }
  
  // Fallback: primeiro sheet
  return workbook.SheetNames[0];
}
```

---

#### 2. Atualizar Função de Detecção de Header

**Arquivo:** `src/services/legislationImport.ts` (função `findHeaderRow`)

Expandir os padrões reconhecidos:

| Antes | Depois |
|-------|--------|
| `TIPO NORMA` | `TIPO NORMA` \| `TIPO` sozinho |
| `TÍTULO` | `TÍTULO` \| `RESUMO E TÍTULO` \| `RESUMO` |
| - | `TEMÁTICA` como alternativa |
| - | `Nº` ou `N°` como alternativa |

Nova lógica:
```typescript
function findHeaderRow(worksheet: XLSX.WorkSheet): number {
  // ...
  for (let row = range.s.r; row <= Math.min(range.e.r, 15); row++) {
    // ...
    
    // Padrões originais
    const hasTipoNorma = cellValues.some(v => v.includes('TIPO') && v.includes('NORMA'));
    const hasTitulo = cellValues.some(v => v.includes('TÍTULO') || v.includes('TITULO') || v.includes('EMENTA'));
    
    // Novos padrões para formato Gabardo FPLAN
    const hasTipoSimples = cellValues.some(v => v === 'TIPO');
    const hasNumero = cellValues.some(v => v === 'Nº' || v === 'N°' || v === 'NUMERO' || v === 'NÚMERO');
    const hasTematica = cellValues.some(v => v.includes('TEMÁTICA') || v.includes('TEMATICA'));
    const hasResumoTitulo = cellValues.some(v => v.includes('RESUMO E TÍTULO') || v.includes('RESUMO'));
    
    // Condição expandida
    const hasValidPattern = 
      (hasTipoNorma && hasTitulo) ||                    // Formato original
      (hasTipoSimples && hasNumero && hasTematica) ||   // Formato Gabardo FPLAN
      (hasTematica && hasResumoTitulo);                 // Formato Gabardo alternativo
      
    if (hasValidPattern) {
      return row;
    }
  }
  
  return 0;
}
```

---

#### 3. Atualizar Mapeamento de Colunas

**Arquivo:** `src/services/legislationImport.ts` (função `parseLegislationExcelWithUnits`)

Adicionar nomes alternativos das colunas:

| Campo | Nomes Atuais | Adicionar |
|-------|--------------|-----------|
| norm_type | `Tipo de Norma`, `Tipo` | ✓ já existe |
| norm_number | `Número`, `Numero` | `Nº`, `N°` |
| title | `Título/Ementa`, `Título` | `RESUMO E TÍTULO`, `Resumo e Título` |
| theme_name | `Macrotema`, `Tema` | `TEMÁTICA`, `Tematica` |
| publication_date | `Data Publicação` | `DATA DA PUBLICAÇÃO` |
| full_text_url | `URL Texto Integral`, `URL` | `FONTE`, `Fonte` |
| evidence_text | `Evidências` | `EVIDÊNCIA DE ATENDIMENTO` |
| overall_applicability | `Aplicabilidade` | ✓ já existe |
| overall_status | `Status`, `Situação` | `ATENDIMENTO` |

---

#### 4. Atualizar Parser Principal

**Arquivo:** `src/services/legislationImport.ts`

Atualizar `parseLegislationExcelWithUnits` para:

```typescript
export async function parseLegislationExcelWithUnits(file: File): Promise<ParseLegislationResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // NOVO: Encontrar sheet com legislações
        const sheetName = findLegislationsSheet(workbook);
        const worksheet = workbook.Sheets[sheetName];
        
        // ... resto do código
      }
    };
  });
}
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/services/legislationImport.ts` | Adicionar `findLegislationsSheet`, atualizar `findHeaderRow`, expandir mapeamento de colunas |

---

### Fluxo Corrigido

```text
1. Upload FPLAN_003-GERAL.xlsx
2. Parser escaneia todas as abas
3. Encontra Sheet 2 com colunas TEMÁTICA/TIPO/Nº
4. Identifica header na linha correta
5. Mapeia colunas:
   - TEMÁTICA → theme_name
   - SUBTEMA → subtheme_name  
   - TIPO → norm_type
   - Nº → norm_number
   - DATA DA PUBLICAÇÃO → publication_date
   - RESUMO E TÍTULO → title
   - POA/PIR/GO... → unitEvaluations
   - APLICABILIDADE → overall_applicability
   - ATENDIMENTO → overall_status
   - EVIDÊNCIA DE ATENDIMENTO → evidence_text
   - FONTE → full_text_url
6. Retorna ~850 legislações com avaliações por unidade
```

---

### Testes Esperados

| Cenário | Resultado Esperado |
|---------|-------------------|
| Upload FPLAN_003-GERAL.xlsx | ~850 legislações detectadas |
| Colunas POA, PIR, GO detectadas | Sim, 12 colunas de unidades |
| Título preenchido corretamente | "Art. 227. É dever da família..." |
| Tema/Subtema mapeados | "RH" / "Programa na Mão Certa" |
