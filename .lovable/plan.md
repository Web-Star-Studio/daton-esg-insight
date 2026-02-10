

## Fluxo de Aprovacao de Usuarios pelo Admin

### Resumo

Adicionar um campo `is_approved` na tabela `profiles` que controla se o usuario pode acessar o dashboard real. Novos usuarios seguem o fluxo: **Registro → Onboarding → Dashboard Demo** (ate ser aprovado). O platform admin podera aprovar/rejeitar usuarios diretamente na aba de Usuarios do painel `/platform-admin`.

### 1. Migracao de Banco de Dados

Adicionar coluna `is_approved` na tabela `profiles`:

```sql
ALTER TABLE public.profiles 
ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
```

Usuarios existentes precisam ser aprovados automaticamente para nao quebrar o acesso:

```sql
UPDATE public.profiles SET is_approved = true WHERE has_completed_onboarding = true;
```

### 2. Atualizar AuthContext e AuthService

**`src/services/auth.ts`**
- Incluir `is_approved` no select do `getCurrentUser()`
- Adicionar campo `is_approved` na interface `AuthUser`

**`src/contexts/AuthContext.tsx`**
- Expor `isApproved` (derivado de `user.is_approved`) no contexto
- Usar esse campo para decidir o redirecionamento pos-onboarding

### 3. Atualizar ProtectedRoute

**`src/components/ProtectedRoute.tsx`**
- Apos verificar autenticacao, checar `user.is_approved`
- Se `is_approved === false`, redirecionar para `/demo` em vez do dashboard
- Platform admins (`role === 'platform_admin'`) sao sempre considerados aprovados

### 4. Atualizar OnboardingRoute

**`src/routes/onboarding.tsx`**
- Apos onboarding completo, redirecionar para `/demo` (em vez de `/dashboard`) se `is_approved === false`

### 5. Atualizar DemoDashboard

**`src/pages/DemoDashboard.tsx`**
- Detectar se o usuario esta logado mas nao aprovado
- Mostrar banner diferenciado: "Sua conta esta em analise. Um administrador aprovara seu acesso em breve."
- Manter o CTA de "Criar conta" apenas para visitantes nao logados

### 6. Atualizar PlatformUsersTable com controle de aprovacao

**`src/components/platform/PlatformUsersTable.tsx`**
- Adicionar coluna "Aprovado" na tabela
- Incluir `is_approved` no select da query
- Adicionar filtro por status de aprovacao (Todos / Aprovados / Pendentes)
- Adicionar botao de acao em cada linha para aprovar/rejeitar usuario
- Ao aprovar: `UPDATE profiles SET is_approved = true WHERE id = :userId`
- Ao rejeitar: `UPDATE profiles SET is_approved = false WHERE id = :userId`
- Mostrar Badge verde "Aprovado" ou amarelo "Pendente" na coluna

### Detalhes tecnicos

**Arquivos modificados:**

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Adicionar coluna `is_approved` default `false` |
| `src/services/auth.ts` | Incluir `is_approved` na interface e query |
| `src/contexts/AuthContext.tsx` | Expor `isApproved` no contexto |
| `src/components/ProtectedRoute.tsx` | Redirecionar para `/demo` se nao aprovado |
| `src/routes/onboarding.tsx` | Redirecionar pos-onboarding para `/demo` se nao aprovado |
| `src/pages/DemoDashboard.tsx` | Banner contextual para usuarios pendentes |
| `src/components/platform/PlatformUsersTable.tsx` | Coluna + filtro + botoes de aprovacao |

**Fluxo do usuario:**

```text
Registro → Confirmacao Email → Login → Onboarding → /demo (pendente)
                                                        |
                            Admin aprova na /platform-admin
                                                        |
                                                   /dashboard (acesso completo)
```

**Seguranca:**
- A coluna `is_approved` fica no banco, nao pode ser manipulada pelo cliente
- RLS existente ja protege a tabela `profiles` (usuario so edita o proprio perfil)
- Apenas platform_admin pode alterar `is_approved` de outros usuarios (via query direta com permissao RLS)
- Platform admins sao automaticamente considerados aprovados no codigo

