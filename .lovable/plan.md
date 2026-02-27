
# Ajustar posição do botão flutuante da IA para ficar abaixo da tabela de resíduos

## Implementação

1. **`src/components/tools/ChatAssistant.tsx`**
   - Ajustar a classe do botão flutuante para descer no viewport (remover `bottom-20` e usar `bottom-4 md:bottom-6`).
   - Manter `right-6`, tamanho e comportamento atuais (apenas reposicionamento vertical).

2. **`src/pages/Residuos.tsx`**
   - Adicionar área de respiro no fim da página para o botão não cobrir a última linha da tabela:
     - trocar o wrapper principal de `className="space-y-6"` para `className="space-y-6 pb-24 md:pb-28"`.
   - Não alterar ações da tabela (Editar/Ver/Documentos) nem lógica dos modais.

3. **Validação visual (desktop e mobile)**
   - Ir para `/residuos`, rolar até o último item e confirmar que o botão de IA não sobrepõe o ícone de editar.
   - Confirmar que o botão da IA continua clicável e abre o chat normalmente.
   - Confirmar que não houve regressão no layout da página (somente espaço inferior adicional).

## Detalhes técnicos

- Arquivos afetados:
  - `src/components/tools/ChatAssistant.tsx`
  - `src/pages/Residuos.tsx`
- Estratégia final:
  - **Descer o FAB** + **reservar safe-area inferior na página de resíduos**.
- Resultado esperado:
  - O botão “Assistente ESG IA” permanece flutuante, porém visualmente **abaixo do container da tabela**, sem cobrir o último item.
