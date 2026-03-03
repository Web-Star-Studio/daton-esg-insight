

# Corrigir envio de email no Reset de Senha Administrativo

## Problema
O `reset_password` no `manage-user/index.ts` usa `generateLink({ type: 'recovery' })` que **gera o link mas não envia email**. O link é retornado no JSON de resposta e logado no console, mas o usuário nunca recebe o email.

## Causa raiz
O comentário no próprio código confirma: _"In production, you'd send this via email service"_. A integração com Resend nunca foi adicionada neste fluxo.

## Solução
Adicionar envio de email via Resend no caso `reset_password` do `manage-user/index.ts`, seguindo o mesmo padrão já usado no `invite-user/index.ts`.

### Alteração: `supabase/functions/manage-user/index.ts`

1. Importar Resend no topo do arquivo:
   ```typescript
   import { Resend } from "npm:resend@2.0.0";
   ```

2. No caso `reset_password` (após gerar o link com `generateLink`), enviar o email:
   - Instanciar `new Resend(RESEND_API_KEY)`
   - Buscar o `full_name` do perfil do usuário alvo
   - Construir HTML do email com o link de recuperação (estilo consistente com os emails de convite)
   - Enviar via `resend.emails.send()` com `from: "Daton <plataforma@daton.com.br>"`

3. Remover o retorno do `link` na resposta (não expor links de segurança no response JSON)

### Build errors (pré-existentes)
Os erros de build listados são todos em **outros arquivos** (`daton-ai-chat`, `generate-intelligent-report`, `get-company-quick-stats`, `intelligent-suggestions`, `tool-executors`) e não estão relacionados a esta feature. Serão tratados separadamente se necessário.

