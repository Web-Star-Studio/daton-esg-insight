

# Adicionar botão de IA nas ações do registro de resíduo

## Alteração

### `src/pages/Residuos.tsx`

Adicionar um botão com ícone `MessageCircle` entre o botão `Eye` (Ver Detalhes) e o botão `Pencil` (Editar) na coluna de Ações da tabela de resíduos.

Ao clicar, o botão abrirá o chat da IA (ChatAssistant) enviando contexto do registro selecionado — abrindo o chat flutuante global com uma mensagem pré-preenchida sobre aquele resíduo específico.

**Ordem final dos botões:**
```text
[ FileText ] [ Eye ] [ MessageCircle ] [ Pencil ]
```

**Comportamento do clique:** Abrir o chat flutuante global (`localStorage.setItem('ai_chat_open', 'true')` + disparar evento customizado) com contexto do resíduo (MTR, descrição, quantidade).

| Arquivo | Ação |
|---------|------|
| `src/pages/Residuos.tsx` | Adicionar botão `MessageCircle` antes do `Pencil`, com handler para abrir o chat com contexto |

