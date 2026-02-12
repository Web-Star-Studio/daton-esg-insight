

## Correcao: Colaboradores nao aparecem na selecao de responsavel

### Causa raiz

O hook `useCompanyEmployees.ts` (linha 16) filtra os funcionarios com `.eq('status', 'active')`, porem os dados no banco estao armazenados com o valor em portugues: `'Ativo'` (com inicial maiuscula).

Resultado da consulta no banco:
- `Ativo`: 1.891 registros
- `Inativo`: 2 registros
- `active`: 0 registros

### Correcao

**Arquivo: `src/hooks/data/useCompanyEmployees.ts`** (linha 16)

Alterar o filtro de status de `'active'` para `'Ativo'`:

```typescript
// Antes:
.eq('status', 'active')

// Depois:
.eq('status', 'Ativo')
```

### Impacto

Essa unica alteracao corrige a selecao de responsavel em todos os locais que usam o hook `useCompanyEmployees`, incluindo:
- Acoes Imediatas (Etapa 2 da NC) -- o caso reportado
- Planejamento 5W2H (Etapa 4)
- Qualquer outro componente que use esse hook

