

# Trocar filtro de "Setores" por "Atividades" na tabela LAIA

## O que muda

O dropdown "Todos os Setores" na tabela de avaliacoes LAIA sera substituido por um filtro de **Atividade/Operacao**, mostrando os valores unicos de `activity_operation` extraidos das avaliacoes carregadas.

## Alteracoes tecnicas

### Arquivo: `src/components/laia/LAIAAssessmentTable.tsx`

1. **Extrair atividades unicas** das avaliacoes carregadas:
   - Criar um `useMemo` que percorre `assessments` e coleta valores unicos de `activity_operation`, ordenados alfabeticamente.

2. **Substituir o filtro de setor pelo filtro de atividade**:
   - Trocar o estado `sector_id` no objeto `filters` por um filtro local de atividade (client-side).
   - Alterar o dropdown de "Todos os Setores" para "Todas as Atividades".
   - Cada item do dropdown sera uma atividade unica em vez de um setor.

3. **Aplicar filtro na lista**:
   - No `filteredAssessments`, adicionar condicao para filtrar por `activity_operation` quando selecionada.
   - O filtro por setor via `filters.sector_id` (que ia para o backend) sera removido deste dropdown, ja que a filtragem agora e por atividade no client-side.

### Resultado esperado

- O dropdown mostra "Todas as Atividades" por padrao.
- Ao abrir, lista todas as atividades/operacoes unicas das avaliacoes da unidade.
- Selecionar uma atividade filtra a tabela para mostrar apenas avaliacoes com aquela `activity_operation`.

