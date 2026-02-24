
# Renomear "Nome" para "Atividade" na tabela de setores LAIA

## Mudanca

Alterar o componente `src/components/laia/LAIASectorManager.tsx` para que a coluna que exibe `sector.name` tenha o cabecalho "Atividade" em vez de "Nome", e atualizar os labels correspondentes no formulario de criacao/edicao.

## Alteracoes no arquivo `src/components/laia/LAIASectorManager.tsx`

1. **Cabecalho da tabela (linha 135)**: Trocar `<TableHead>Nome</TableHead>` por `<TableHead>Atividade</TableHead>`
2. **Label do formulario (linha 233)**: Trocar `<Label>Nome *</Label>` por `<Label>Atividade *</Label>`
3. **Placeholder do input (linha 237)**: Atualizar o placeholder para refletir exemplos de atividades em vez de nomes de setor
4. **Mensagem de exclusao (linha 274)**: Manter referencia ao nome do setor (sem mudanca, ja que o campo continua sendo `sector.name`)

Nenhuma mudanca no banco de dados -- o campo `name` da tabela `laia_sectors` continua existindo, apenas o rotulo visual muda para "Atividade".
