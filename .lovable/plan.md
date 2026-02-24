
# Corrigir edição de setores (stopPropagation nos botões de ação)

## Problema

A tabela de setores tem um `onClick` na `TableRow` que navega para a página de detalhes. Os botões de ação (editar, excluir, switch de status) estão dentro dessa mesma linha, mas não impedem a propagação do evento de clique. Resultado: ao clicar em "Editar", o usuário é redirecionado para a página de detalhes em vez de abrir o dialog de edição.

## Solução

Adicionar `e.stopPropagation()` nos handlers dos botões de ação dentro da tabela para evitar que o clique nos botões dispare a navegação da linha.

### Arquivo: `src/components/laia/LAIASectorManager.tsx`

Três pontos precisam de correção:

1. **Switch de status (linha 154-157)**: Envolver o `Switch` em um wrapper com `onClick={e => e.stopPropagation()}`

2. **Botão de editar (linha 161-165)**: Alterar o `onClick` para incluir `stopPropagation`:
   ```typescript
   onClick={(e) => {
     e.stopPropagation();
     handleOpenEdit(sector);
   }}
   ```

3. **Botão de excluir (linha 167-175)**: Alterar o `onClick` para incluir `stopPropagation`:
   ```typescript
   onClick={(e) => {
     e.stopPropagation();
     setDeletingSector(sector);
     setIsDeleteDialogOpen(true);
   }}
   ```

## Resultado esperado

- Clicar no **nome ou linha** do setor navega para a página de detalhes
- Clicar no **lápis** abre o dialog de edição (nome, código, descrição)
- Clicar na **lixeira** abre o dialog de confirmação de exclusão
- Clicar no **switch** alterna o status ativo/inativo
