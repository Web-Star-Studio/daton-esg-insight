
## Plano: Corrigir Importação de Avaliações por Unidade para Legislações Existentes

### Problema Identificado

A importação de legislações via Excel **não está atualizando as avaliações por unidade** porque:

1. **O código atual pula legislações existentes**: Quando uma legislação já existe no sistema (identificada por `Tipo + Número` ou `Título`), a importação apenas adiciona evidências e executa `continue;` na linha 888, ignorando completamente a lógica de criar/atualizar `unit_compliance`.

2. **Mapeamento de valores incorreto**: O mapeamento atual trata **1/2/3 como status de conformidade**, mas o usuário confirmou que esses valores representam **Aplicabilidade**:
   - `1` = Real (Aplicável)
   - `2` = Potencial (Provável)
   - `3` = Pendente/Não avaliada

---

### Alterações Necessárias

#### 1. Atualizar Mapeamento de Valores `mapUnitValue()`

**Arquivo:** `src/services/legislationImport.ts` (linhas 432-478)

Corrigir o mapeamento para refletir que 1/2/3 representam **Aplicabilidade**:

| Valor | Significado Atual (errado) | Novo Significado (correto) |
|-------|---------------------------|---------------------------|
| 1 | N.A (applicability: 'na') | Real (applicability: 'real') |
| 2 | OK/Conforme | Potencial (applicability: 'potential') |
| 3 | Não Conforme/Adequação | Pendente (applicability: 'pending') |

Novo mapeamento:
```typescript
case '1':
  // Real (Aplicável)
  return { 
    applicability: 'real', 
    complianceStatus: 'pending'  // Status será avaliado separadamente
  };
case '2':
  // Potencial (Provável)
  return { 
    applicability: 'potential', 
    complianceStatus: 'pending' 
  };
case '3':
  // Pendente/Não avaliada
  return { 
    applicability: 'pending', 
    complianceStatus: 'pending' 
  };
```

---

#### 2. Adicionar Lógica de Unit Compliance para Legislações Existentes

**Arquivo:** `src/services/legislationImport.ts` (linhas 845-888)

**Problema atual:**
```typescript
if (existingLegislation) {
  // Só adiciona evidência
  // continue; <-- PULA unit_compliance!
}
```

**Solução:** Após adicionar a evidência, também criar/atualizar os registros de `unit_compliance`:

```typescript
if (existingLegislation) {
  let unitComplianceMessage = '';
  
  // Adicionar evidência (código existente)
  if (leg.evidence_text && leg.evidence_text.trim()) {
    // ... lógica existente de evidência ...
  }
  
  // NOVO: Criar/atualizar unit compliance para legislação existente
  if (options.unitMappings && leg.unitEvaluations && leg.unitEvaluations.length > 0) {
    const complianceRecords = [];
    
    for (const evaluation of leg.unitEvaluations) {
      const mapping = options.unitMappings.find(m => 
        m.excelCode.toUpperCase() === evaluation.unitCode.toUpperCase()
      );
      
      if (mapping?.branchId) {
        complianceRecords.push({
          legislation_id: existingLegislation.id,
          branch_id: mapping.branchId,
          company_id: companyId,
          applicability: evaluation.applicability,
          compliance_status: evaluation.complianceStatus,
          evidence_notes: leg.evidence_text?.trim() || null,
          evaluated_at: new Date().toISOString(),
          evaluated_by: profile.id,
        });
        
        const branchName = mapping.branchName || mapping.excelCode;
        result.unitsByBranch[branchName] = (result.unitsByBranch[branchName] || 0) + 1;
      }
    }
    
    if (complianceRecords.length > 0) {
      const { error: complianceError } = await supabase
        .from('legislation_unit_compliance')
        .upsert(complianceRecords, { onConflict: 'legislation_id,branch_id' });
      
      if (!complianceError) {
        result.unitCompliancesCreated += complianceRecords.length;
        unitComplianceMessage = ` + ${complianceRecords.length} avaliação(ões) por unidade`;
      }
    }
  }
  
  result.details.push({
    rowNumber: leg.rowNumber,
    title: leg.title,
    status: 'updated',
    message: 'Atualizado' + evidenceMessage + unitComplianceMessage,
  });
  
  continue;
}
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/services/legislationImport.ts` | 1. Corrigir `mapUnitValue()` (linhas 438-477) |
| `src/services/legislationImport.ts` | 2. Adicionar lógica de unit_compliance para legislações existentes (linhas 846-888) |

---

### Fluxo Corrigido

```text
Importação de Planilha
        │
        ▼
┌─────────────────────────────────┐
│  Legislação já existe?          │
├─────────────────────────────────┤
│     SIM               NÃO       │
│      │                 │        │
│      ▼                 ▼        │
│  Adicionar         Criar nova   │
│  evidência         legislação   │
│      │                 │        │
│      ▼                 ▼        │
│  NOVO: Criar/      Criar        │
│  atualizar         unit_        │
│  unit_compliance   compliance   │
│      │                 │        │
│      ▼                 ▼        │
│    continue         Adicionar   │
│                     evidência   │
└─────────────────────────────────┘
```

---

### Resultado Esperado

Após a correção:
1. Importar a planilha FPLAN_003-GERAL.xlsx
2. O sistema identificará legislações existentes (por Tipo+Número ou Título)
3. Para cada unidade mapeada (POA, PIR, GO, etc.), criará registros em `legislation_unit_compliance`
4. A tela "Avaliação por Unidade" mostrará os status importados
5. Substituirá avaliações existentes (upsert) conforme solicitado

---

### Comportamento do Mapeamento

| Valor na Planilha | Aplicabilidade | Status de Conformidade |
|-------------------|----------------|------------------------|
| 1 | Real | Pendente (a avaliar) |
| 2 | Potencial | Pendente |
| 3 | Pendente | Pendente |
| x | Pendente | Pendente |
| z | (ignorar) | (ignorar) |
