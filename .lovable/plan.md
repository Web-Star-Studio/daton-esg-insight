

# Adicionar botão "Excluir documento" na página de detalhes

## O que falta

A página `SGQDocumentDetail.tsx` não possui botão para excluir o documento. Já existe a função `deleteDocument` em `src/services/documents.ts` que remove o arquivo do storage e o registro do banco. Basta conectar.

## Plano

### 1. Adicionar botão de exclusão no header da página (`SGQDocumentDetail.tsx`)
- Importar `deleteDocument` de `src/services/documents`
- Importar `AlertDialog` components de `@/components/ui/alert-dialog`
- Criar mutation `deleteMutation` que chama `deleteDocument(id)`, exibe toast de sucesso e navega para `/documentos`
- Adicionar estado `showDeleteDialog` para confirmação
- Colocar botão vermelho com ícone `Trash2` ao lado dos botões existentes no header (Voltar, Download, etc.)
- Ao clicar, abre `AlertDialog` pedindo confirmação ("Esta ação não pode ser desfeita")
- Ao confirmar, executa a mutation

### 2. Limpar dados relacionados antes de excluir (`documentCenter.ts`)
- Criar função `deleteDocumentRecord(documentId)` que:
  - Remove registros de `document_control_profiles`, `document_read_campaigns`, `document_read_recipients`, `document_relations`, `document_requests`, `document_change_log` vinculados ao documento
  - Trata erros de tabela ausente (PGRST205) graciosamente
  - Chama `deleteDocument` do `documents.ts` no final (storage + registro principal)

### Arquivos editados
- `src/pages/SGQDocumentDetail.tsx` — botão + dialog + mutation
- `src/services/documentCenter.ts` — função `deleteDocumentRecord`

