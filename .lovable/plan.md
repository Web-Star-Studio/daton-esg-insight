

# Visualizar Arquivos Anexados no Registro de Resíduo

## Alterações

### 1. `src/components/WasteLogDocumentsModal.tsx`

- Adicionar botão de **"Visualizar"** (ícone `Eye`) ao lado de cada documento na lista
- Ao clicar, gerar uma signed URL via `supabase.storage.from('documents').createSignedUrl(filePath, 3600)` e abrir um estado de preview inline
- Usar o componente `DocumentViewer` já existente para renderizar PDFs e imagens dentro do modal
- Adicionar estado `previewDoc: { url: string; name: string } | null` para controlar qual documento está sendo visualizado
- Quando um documento está em preview, mostrar o viewer com botão "Voltar à lista" no topo
- O modal aumenta para `max-w-4xl` quando em modo de preview

### 2. Fluxo de UX

- Lista normal → clica em 👁 → carrega signed URL → exibe `DocumentViewer` no lugar da lista
- Botão "← Voltar" retorna à lista de documentos
- Para formatos não suportados pelo viewer (DOC/DOCX), abrir em nova aba ou manter apenas o download

| Arquivo | Ação |
|---------|------|
| `src/components/WasteLogDocumentsModal.tsx` | Adicionar preview inline com `DocumentViewer` |

