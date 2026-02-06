
## Diagnóstico (por que “continua como nenhuma”)

O componente `ISOReferencesSelector` está chamando **duas atualizações de estado seguidas** quando você escolhe uma ISO:

- `onStandardChange(...)`
- `onClausesChange([])`

No `NaoConformidades.tsx`, esses callbacks estão implementados assim (padrão atual):

- `setNewNCData({ ...newNCData, iso_standard: s })`
- `setNewNCData({ ...newNCData, iso_clauses: c })`

Como ambos usam **o mesmo `newNCData` “antigo” capturado no render**, a segunda chamada (clauses) acaba “voltando” o `iso_standard` para `null`, porque ela espalha o objeto antigo novamente. Resultado visual: você clica numa ISO, mas o Select volta para “Nenhuma”.

Esse é um bug clássico de “stale state + múltiplos setState com spread”.

## Objetivo da correção

1. Permitir selecionar a ISO (o Select precisa “persistir” o valor escolhido).
2. Ao selecionar uma ISO, a lista de cláusulas deve aparecer e permitir marcar itens.
3. Manter o comportamento de limpar cláusulas ao trocar a ISO.
4. Garantir que o “Aplicar Sugestões” da IA também funcione (ele também chama `onStandardChange` e `onClausesChange` em sequência).

## Estratégia

### A) Corrigir o estado no `NaoConformidades.tsx` (principal)
Trocar os `setNewNCData({...newNCData, ...})` por **atualizações funcionais**:

- `setNewNCData(prev => ({ ...prev, campo: valor }))`

Isso garante que cada atualização sempre parte do estado mais recente, eliminando o “volta para nenhuma”.

### B) Ajustar a “limpeza de cláusulas” para acontecer em um único lugar (recomendado)
Hoje, ao trocar ISO, o selector faz:
- `onStandardChange(...)`
- `onClausesChange([])`

Podemos manter isso, mas o ideal é:
- Centralizar a regra “troquei ISO => zera clauses” no **callback `onStandardChange` do pai**, fazendo uma única atualização de estado.

Assim, mesmo que no futuro o selector mude, a integridade do dado fica garantida no formulário.

### C) Garantir que a seleção de itens (cláusulas) persista
Depois que a ISO ficar selecionável (A), a UI de cláusulas já está preparada:
- `toggleClause` usa `selectedClauses` e chama `onClausesChange([...])`.

Com o `onClausesChange` corrigido para update funcional no pai, os checkboxes passam a funcionar corretamente.

## Mudanças planejadas (passo a passo)

### 1) `src/pages/NaoConformidades.tsx`
Na renderização do `ISOReferencesSelector`, alterar os handlers para updates funcionais:

- `onStandardChange` deve:
  - setar `iso_standard`
  - limpar `iso_clauses` automaticamente (porque mudou o universo de itens)

Exemplo do comportamento desejado:
- Selecionou ISO_9001 → `iso_standard="ISO_9001"` e `iso_clauses=[]`
- Marcou cláusulas → `iso_clauses=["4.1","7.2"]`
- Trocou para ISO_14001 → `iso_standard="ISO_14001"` e `iso_clauses=[]`

E `onClausesChange` deve usar:
- `setNewNCData(prev => ({ ...prev, iso_clauses: c }))`

### 2) `src/components/non-conformity/ISOReferencesSelector.tsx`
Opcional (mas recomendado para robustez):
- Ao trocar o Select, evitar disparar duas atualizações separadas no pai.
  - Alternativa 1 (mais simples): manter como está (porque o pai já estará correto com updates funcionais).
  - Alternativa 2 (mais “limpo”): no `onValueChange`, remover `onClausesChange([])` e deixar o pai fazer isso dentro de `onStandardChange`.

Eu recomendo a Alternativa 2 para reduzir chances de regressão e simplificar fluxo.

### 3) Validação rápida pós-correção (checklist)
No formulário “Registrar NC”:
1. Abrir o Select “Referência ISO”
2. Selecionar “ISO 9001:2015”
   - Deve permanecer selecionada (não volta para “Nenhuma”)
3. A lista de cláusulas deve aparecer (Collapsible expandido)
4. Marcar 2-3 cláusulas
   - Badge “X cláusula(s)” deve atualizar
5. Trocar para “ISO 14001:2015”
   - As cláusulas selecionadas devem zerar
   - Deve carregar as cláusulas da 14001
6. (IA) Clicar “Buscar com IA” e aplicar sugestões
   - Deve setar ISO e cláusulas automaticamente, sem resetar para “Nenhuma”

## Resultado esperado após implementar
- O Select de ISO passa a funcionar (sem “voltar para nenhuma”).
- Ao escolher uma ISO, você consegue selecionar os itens/cláusulas dela normalmente.
- Trocar de ISO limpa cláusulas (comportamento correto).
- “Aplicar Sugestões” da IA funciona sem perder a seleção.

## Risco/impacto
Baixo. A mudança é localizada na forma como o estado do formulário é atualizado e não afeta schema/banco. É uma correção de lógica de estado no React.
