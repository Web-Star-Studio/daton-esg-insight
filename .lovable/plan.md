

# Mover ChatAssistant do canto inferior para o Header

## Alterações

### 1. `src/components/MainLayout.tsx`
- Remover o `<ChatAssistant />` de dentro do `SidebarProvider` (linha 95)

### 2. `src/components/AppHeader.tsx`
- Importar `ChatAssistant` e os ícones necessários (`Sparkles`)
- Adicionar um botão minimalista (ghost/icon) no header, ao lado dos outros ícones (antes do dropdown de perfil)
- O botão abre/fecha o chat panel como um popover ou painel lateral
- Usar estado local `isOpen` para controlar visibilidade do chat

### 3. `src/components/tools/ChatAssistant.tsx`
- Remover o botão flutuante fixo (`fixed bottom-4 right-6`) — linhas 193-212
- Quando não embedded, renderizar apenas o chat window (sem botão flutuante próprio)
- Aceitar nova prop `onClose` para o header controlar o fechamento
- Aceitar prop `isOpen` externamente (ao invés de gerenciar internamente quando não embedded)

### Resultado
- Botão minimalista com ícone `Sparkles` no header, estilo ghost/icon igual aos demais
- Ao clicar, abre o painel de chat (posicionado como dropdown/popover à direita)
- Remove completamente o botão flutuante do canto inferior direito
- Pode-se remover o `pb-24` de padding de segurança das páginas

