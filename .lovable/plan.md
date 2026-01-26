

## Plano: Importação de Legislações com Avaliações por Unidade

### Objetivo

Estender o sistema de importação de legislações para suportar o formato FPLAN_003-GERAL.xlsx da Gabardo, que inclui:
- Avaliações individuais por unidade (POA, PIR, GO, PREAL, SBC, SJP, DUC, IRA, SC, ES, CE, CHUÍ)
- Valores numéricos/letras (1, 2, 3, x, z) representando status de conformidade
- Evidências de atendimento que devem ser vinculadas às avaliações

---

### Estrutura da Planilha

**Legenda dos valores por unidade:**

| Valor | Significado | Mapeamento no Sistema |
|-------|-------------|----------------------|
| 1 | N.A (Não Aplicável) | `applicability: "na"` |
| 2 | OK (Conforme) | `applicability: "real"`, `status: "conforme"` |
| 3 | NÃO (Não Conforme) | `applicability: "real"`, `status: "adequacao"` |
| x | S/AV (Sem Avaliação) | `applicability: "pending"` |
| z | n/p (Não Presente) | Ignorar - unidade não avalia esta legislação |

**Colunas de unidades identificadas:** POA, PIR, GO, PREAL, SBC, SJP, DUC, IRA, SC, ES, CE, CHUÍ

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE IMPORTAÇÃO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. UPLOAD           2. MAPEAMENTO         3. PREVIEW           │
│  ┌─────────┐         ┌─────────────┐       ┌──────────────┐     │
│  │ Excel   │ ──────▶ │ Vincular    │ ────▶ │ Legislações  │     │
│  │ FPLAN   │         │ POA → Filial│       │ + Avaliações │     │
│  └─────────┘         │ PIR → Filial│       │ por unidade  │     │
│                      │ ...         │       └──────────────┘     │
│                      └─────────────┘              │              │
│                                                   ▼              │
│  4. IMPORTAÇÃO                         5. RESULTADO             │
│  ┌──────────────────────────┐          ┌──────────────────┐     │
│  │ Para cada legislação:    │          │ 850 legislações  │     │
│  │ • Inserir/atualizar leg. │ ───────▶ │ 10.200 avaliações│     │
│  │ • Criar unit_compliance  │          │ 850 evidências   │     │
│  │   para cada unidade      │          └──────────────────┘     │
│  │ • Adicionar evidências   │                                   │
│  └──────────────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Mudanças Técnicas

#### 1. Atualizar Parser da Planilha

**Arquivo:** `src/services/legislationImport.ts`

Adicionar parsing das colunas de unidades:

```typescript
// Novas interfaces
interface UnitEvaluation {
  unitCode: string;      // POA, PIR, GO, etc.
  value: string;         // 1, 2, 3, x, z
  applicability: 'real' | 'potential' | 'na' | 'pending';
  complianceStatus: 'conforme' | 'adequacao' | 'pending' | 'na';
}

interface ParsedLegislationWithUnits extends ParsedLegislation {
  unitEvaluations: UnitEvaluation[];
}

// Função para detectar colunas de unidades automaticamente
function detectUnitColumns(headers: string[]): string[] {
  const knownUnitCodes = ['POA', 'PIR', 'GO', 'PREAL', 'SBC', 'SJP', 'DUC', 'IRA', 'SC', 'ES', 'CE', 'CHUÍ'];
  return headers.filter(h => 
    knownUnitCodes.includes(h.toUpperCase()) || 
    (h.length <= 6 && /^[A-Z]{2,6}$/.test(h.toUpperCase()))
  );
}

// Mapear valor numérico para status
function mapUnitValue(value: string): UnitEvaluation | null {
  const normalized = String(value).trim().toLowerCase();
  
  switch (normalized) {
    case '1':
      return { applicability: 'na', complianceStatus: 'na' };
    case '2':
      return { applicability: 'real', complianceStatus: 'conforme' };
    case '3':
      return { applicability: 'real', complianceStatus: 'adequacao' };
    case 'x':
      return { applicability: 'pending', complianceStatus: 'pending' };
    case 'z':
      return null; // Ignorar - unidade não presente
    default:
      return null;
  }
}
```

---

#### 2. Criar Wizard de Mapeamento de Unidades

**Novo arquivo:** `src/components/legislation/UnitMappingStep.tsx`

Componente para vincular códigos da planilha às branches do sistema:

```typescript
interface UnitMapping {
  excelCode: string;     // POA
  branchId: string | null;  // UUID da branch
  branchName?: string;   // Nome para exibição
}

// UI: Lista de códigos detectados com dropdown para selecionar branch
// Sugestão automática baseada em nome/código similar
```

---

#### 3. Atualizar Dialog de Importação

**Arquivo:** `src/components/legislation/LegislationImportDialog.tsx`

Adicionar novo estágio "mapping" entre upload e preview:

| Estágio Atual | Novo Fluxo |
|---------------|------------|
| upload → preview → importing → result | upload → **mapping** → preview → importing → result |

**Mudanças:**
- Novo estado `unitMappings: UnitMapping[]`
- Novo estado `detectedUnitColumns: string[]`
- Renderização condicional do `UnitMappingStep`
- Atualização da lógica de importação para criar `unit_compliance`

---

#### 4. Atualizar Lógica de Importação

**Arquivo:** `src/services/legislationImport.ts`

Na função `importLegislations`, após inserir a legislação:

```typescript
// Após inserir legislação com sucesso
if (newLegislationId && leg.unitEvaluations && unitMappings) {
  for (const evaluation of leg.unitEvaluations) {
    const mapping = unitMappings.find(m => m.excelCode === evaluation.unitCode);
    if (mapping?.branchId && evaluation.applicability !== 'pending') {
      await supabase.from('legislation_unit_compliance').upsert({
        legislation_id: newLegislationId,
        branch_id: mapping.branchId,
        company_id: companyId,
        applicability: evaluation.applicability,
        compliance_status: evaluation.complianceStatus,
        evidence_notes: leg.evidence_text, // Evidência geral
        evaluated_at: new Date().toISOString(),
      }, { onConflict: 'legislation_id,branch_id' });
    }
  }
}
```

---

#### 5. Atualizar Interface de Resultado

Exibir estatísticas de avaliações importadas:

```typescript
interface LegislationImportResult {
  // Campos existentes...
  unitCompliancesCreated: number;  // NOVO
  unitsByBranch: Record<string, number>;  // NOVO
}
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/services/legislationImport.ts` | Estender parser para detectar e extrair colunas de unidades |
| `src/components/legislation/UnitMappingStep.tsx` | **NOVO** - Wizard para mapear códigos às branches |
| `src/components/legislation/LegislationImportDialog.tsx` | Adicionar estágio de mapeamento e lógica de unit_compliance |
| `src/hooks/data/useBranches.ts` | Verificar se já existe hook para buscar branches |

---

### Fluxo do Usuário

1. **Upload:** Usuário faz upload da planilha FPLAN_003-GERAL.xlsx
2. **Detecção Automática:** Sistema identifica colunas POA, PIR, GO, etc.
3. **Mapeamento:** Usuário vincula cada código a uma filial cadastrada
   - Sistema sugere automaticamente baseado em nome/código similar
   - Opção de "ignorar" colunas não desejadas
4. **Preview:** Exibe legislações + contagem de avaliações por unidade
5. **Importação:** 
   - Cria/atualiza legislações
   - Cria registros em `legislation_unit_compliance` para cada combinação legislação/unidade
   - Adiciona evidências
6. **Resultado:** Resumo com estatísticas por unidade

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Planilha com 850 legislações e 12 unidades | Até 10.200 registros de `unit_compliance` |
| Valor "2" em coluna POA | `unit_compliance` com `applicability: real`, `status: conforme` |
| Valor "z" em coluna SC | Nenhum registro criado para esta combinação |
| Coluna não mapeada | Valores ignorados (com aviso) |
| Branch já tem avaliação | Atualiza via upsert (onConflict) |

---

### Considerações de Performance

- **Batch insert:** Acumular avaliações e inserir em lotes de 50
- **Progress callback:** Atualizar a cada 5 legislações processadas
- **Transação implícita:** Cada legislação + suas avaliações como unidade atômica

---

### Compatibilidade

A solução mantém compatibilidade total com:
- Template atual de importação (sem colunas de unidades)
- Planilhas com subconjunto de colunas de unidades
- Importação sem etapa de mapeamento (se nenhuma coluna de unidade detectada)

