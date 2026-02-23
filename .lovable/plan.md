
# Fix: Dropdown de Unidades vazio no modulo Nao Conformidades

## Problema

O select de "Unidade" no formulario de criacao de Nao Conformidades nao mostra nenhuma filial. A causa raiz e uma inconsistencia no campo `status` da tabela `branches`:

- O codigo filtra por `.eq("status", "Ativo")` (masculino)
- Mas 16 de 18 filiais no banco usam `status = 'Ativa'` (feminino)
- Apenas 1 filial tem `status = 'Ativo'`, entao a maioria dos usuarios ve a lista vazia

## Solucao

### Arquivo: `src/pages/NaoConformidades.tsx` (linha ~91)

Trocar o filtro `.eq("status", "Ativo")` por `.in("status", ["Ativo", "Ativa"])` para aceitar ambas as variantes, seguindo o padrao ja usado em `LAIAUnidades.tsx` e `UnitMappingStep.tsx`.

```typescript
// ANTES
.eq("status", "Ativo")

// DEPOIS
.in("status", ["Ativo", "Ativa"])
```

### Impacto

- Correcao pontual de 1 linha
- Sem mudanca de comportamento para filiais ja com status "Ativo"
- Filiais com status "Ativa" passarao a aparecer corretamente no dropdown
