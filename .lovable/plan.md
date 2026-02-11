

## Remover CTAs de "Criar conta" do modo demo

### Contexto

O modo demo e acessado por usuarios que ja criaram conta mas aguardam aprovacao do admin. Portanto, os botoes e links de "Criar conta" nao fazem sentido nesse contexto.

### Mudancas

**1. `src/components/DemoLayout.tsx`**

- Remover o botao "Criar conta gratuita" do header (linhas 28-38)
- Atualizar o banner demo: remover o botao "Criar conta" e ajustar a mensagem para refletir que o usuario esta aguardando aprovacao. Exemplo: "Sua conta esta aguardando aprovacao do administrador. Enquanto isso, explore a plataforma em modo demonstrativo."

**2. `src/utils/demoGuard.ts`**

- Alterar a mensagem do toast de CRUD para remover referencia a "criar conta"
- Nova mensagem: "Funcionalidade disponivel apos aprovacao da conta"
- Descricao: "Sua conta esta aguardando aprovacao do administrador."
- Remover o botao de acao "Criar conta" do toast

### Resultado

| Arquivo | Mudanca |
|---------|---------|
| `src/components/DemoLayout.tsx` | Remover botao header + atualizar banner para "aguardando aprovacao" |
| `src/utils/demoGuard.ts` | Atualizar mensagens do toast removendo CTA de criar conta |

