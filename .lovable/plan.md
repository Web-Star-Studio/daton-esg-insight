

# Corrigir scroll de modais e aprimorar fluxo de convite de usuários

## Problema 1: Modais nao scrollam internamente

**Causa raiz identificada:** O Lenis (smooth scroll library) em `src/components/layout/SmoothScroll.tsx` intercepta TODOS os eventos de scroll globalmente, inclusive dentro de modais. As correções anteriores (`overscroll-contain`, checagem de dialog no MainLayout) não resolvem porque o Lenis captura o evento de wheel antes que ele chegue ao modal.

### Solução: `src/components/layout/SmoothScroll.tsx`
- Parar/pausar o Lenis quando um dialog Radix estiver aberto (`[data-state="open"][role="dialog"]`).
- Usar um `MutationObserver` para detectar quando dialogs abrem/fecham e chamar `lenis.stop()` / `lenis.start()`.

## Problema 2: Convite deve incluir seleção de módulos

### Alteração: `src/components/users/UserFormModal.tsx`
- Mover a seção "Acesso a Módulos" para ser visível tanto na edição quanto no convite (novo usuário).
- No modo convite, usar estado local (array de módulos desativados) já que o usuário ainda não existe no banco.
- Passar os módulos selecionados junto com os dados do convite ao submeter.

### Alteração: `src/hooks/data/useUserManagement.ts`
- Incluir `module_access` no body enviado à edge function `invite-user`.

## Problema 3: Usuário convidado deve receber senha aleatória e não passar por onboarding/demo

### Alteração: `supabase/functions/invite-user/index.ts`
- Gerar senha aleatória segura (16 chars, alfanumérica + especiais).
- Criar usuário com `email_confirm: true` (já confirmado) e a senha gerada.
- Marcar `is_approved: true` e `has_completed_onboarding: true` no profile.
- Inserir registros em `user_module_access` para os módulos desativados pelo admin.
- Incluir a senha temporária no email de convite com orientação para alterá-la.

### Alteração no email HTML
- Adicionar seção mostrando a senha temporária gerada.
- Manter o link de acesso direto à plataforma (sem magic link, já que o usuário tem senha).
- Orientar o usuário a trocar a senha após o primeiro acesso.

## Problema 4: Usuário convidado vinculado à organização do admin

Isso já funciona: a edge function usa `callingProfile.company_id` para o profile e user_roles. Nenhuma alteração necessária.

## Sequência de execução

1. Corrigir Lenis para pausar quando dialog está aberto.
2. Atualizar `UserFormModal` para mostrar módulos no convite.
3. Atualizar `useUserManagement` para enviar `module_access`.
4. Atualizar edge function `invite-user` para gerar senha, marcar aprovado, e salvar módulos.
5. Atualizar template de email com senha temporária.

## Detalhes técnicos

### Geração de senha (edge function)
```text
Formato: 16 caracteres com letras maiúsculas, minúsculas, números e símbolos
Exemplo: Xk9#mP2$vL7@nQ4!
```

### Fluxo do usuário convidado
```text
Admin envia convite → Edge function cria conta com senha → Email chega com senha
→ Usuário faz login com email + senha temporária → Acessa o dashboard diretamente
→ Pode trocar senha em Configurações
```

### Estado dos módulos no convite (client-side)
- Estado local `moduleAccess: Record<string, boolean>` inicializado com todos `true`.
- Admin alterna switches antes de enviar.
- Ao submeter, envia lista de módulos com `has_access: false` para a edge function.
- Edge function insere em `user_module_access` apenas os módulos desativados.

