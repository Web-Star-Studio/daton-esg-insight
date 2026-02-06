
# Plano: Corrigir Seleção de ISO e Exibição de Cláusulas

## Problema Identificado

Ao selecionar uma ISO no formulário de registro de NC, as cláusulas não são exibidas. A análise do código revelou dois problemas:

1. **Problema no Hook `useISORequirements`**: O hook usa duas queries mutuamente exclusivas (uma para todas as ISOs e outra para uma ISO específica), mas a query específica pode não estar sendo executada corretamente quando o usuário seleciona uma ISO.

2. **Tipo null vs undefined**: O `selectedStandard` no componente é `string | null`, mas o hook espera `ISOStandardType | undefined`. O cast `null as ISOStandardType | undefined` pode não funcionar como esperado.

## Solução Proposta

### 1. Corrigir o Hook `useISORequirements`

Simplificar o hook para usar uma única query que carrega os requisitos da ISO específica quando selecionada:

```typescript
export function useISORequirements(standard?: ISOStandardType | null) {
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['iso-requirements', standard || 'all'],
    queryFn: async () => {
      if (standard) {
        return isoRequirementsService.getRequirementsByStandard(standard);
      }
      return isoRequirementsService.getAllRequirements();
    },
  });

  return {
    requirements: requirements || [],
    isLoading,
    searchRequirements: (term: string) => isoRequirementsService.searchRequirements(term),
  };
}
```

### 2. Ajustar o Componente ISOReferencesSelector

Remover o type cast problemático e passar o valor diretamente:

```typescript
// Antes:
const { requirements, isLoading } = useISORequirements(selectedStandard as ISOStandardType | undefined);

// Depois:
const { requirements, isLoading } = useISORequirements(selectedStandard as ISOStandardType | null);
```

### 3. Garantir que a UI é atualizada corretamente

Adicionar logs de debug temporários para verificar o fluxo de dados (a serem removidos após teste).

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/hooks/useISORequirements.ts` | Simplificar para query única com chave dinâmica |
| `src/components/non-conformity/ISOReferencesSelector.tsx` | Corrigir type cast e adicionar fallback para array vazio |

## Mudanças Detalhadas

### 1. useISORequirements.ts

```typescript
import { useQuery } from "@tanstack/react-query";
import { isoRequirementsService, ISOStandardType } from "@/services/isoRequirements";

export function useISORequirements(standard?: ISOStandardType | null) {
  const { data: requirements, isLoading } = useQuery({
    queryKey: ['iso-requirements', standard ?? 'all'],
    queryFn: async () => {
      if (standard) {
        return isoRequirementsService.getRequirementsByStandard(standard);
      }
      return isoRequirementsService.getAllRequirements();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - os requisitos ISO não mudam frequentemente
  });

  return {
    requirements: requirements || [],
    isLoading,
    searchRequirements: (term: string) => isoRequirementsService.searchRequirements(term),
  };
}
```

### 2. ISOReferencesSelector.tsx - Linha 49

```typescript
// Antes:
const { requirements, isLoading } = useISORequirements(selectedStandard as ISOStandardType | undefined);

// Depois:
const { requirements, isLoading } = useISORequirements(selectedStandard as ISOStandardType | null);
```

### 3. ISOReferencesSelector.tsx - Garantir array

Na linha 51, garantir que `requirements` nunca seja undefined:

```typescript
const filteredRequirements = (requirements || []).filter(req =>
  req.clause_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
  req.clause_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  req.description.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## Por que isso resolve o problema

1. **Query unificada**: Com uma única query que usa a chave `['iso-requirements', standard ?? 'all']`, o React Query entende que são queries diferentes para cada ISO e gerencia o cache corretamente.

2. **Tipo consistente**: Aceitar `null` explicitamente no hook evita problemas de type casting.

3. **Fallback para array vazio**: Garantir que sempre há um array evita erros de "cannot filter undefined".

## Fluxo esperado após correção

1. Usuário abre o formulário de NC
2. Campo "Referência ISO" mostra "Nenhuma" selecionado
3. Usuário clica no dropdown e seleciona "ISO 9001:2015"
4. Hook dispara nova query com key `['iso-requirements', 'ISO_9001']`
5. Requisitos da ISO 9001 são carregados
6. Collapsible expande automaticamente mostrando as cláusulas
7. Usuário pode pesquisar e selecionar as cláusulas desejadas

## Teste recomendado

Após a implementação:
1. Abrir formulário de nova NC
2. Selecionar "ISO 9001:2015"
3. Verificar se a lista de cláusulas aparece
4. Testar filtro de busca por cláusula
5. Marcar algumas cláusulas
6. Trocar para outra ISO (ex: ISO 14001)
7. Verificar se as cláusulas da nova ISO aparecem
8. Testar o botão "Buscar com IA"
