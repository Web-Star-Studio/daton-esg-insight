

# Corrigir scroll do modal e adicionar controle de acesso a módulos por usuário

## Problema 1: Modal não scrolla corretamente

O `DialogContent` em `src/components/ui/dialog.tsx` já tem `max-h-[90vh] overflow-y-auto`, mas o scroll está vazando para a tela de fundo. Isso acontece porque o Radix Dialog não bloqueia a propagação de scroll por padrão em todos os cenários. A solução é adicionar `onOpenAutoFocus` e garantir `overscroll-behavior: contain` no conteúdo do modal para evitar scroll-chaining.

### Alteração: `src/components/ui/dialog.tsx`
- Adicionar `overscroll-behavior: contain` via classe Tailwind (`overscroll-contain`) ao `DialogPrimitive.Content`.
- Isso impede que o scroll do modal se propague para o body.

## Problema 2: Controle granular de acesso a módulos por usuário

Atualmente os módulos são controlados globalmente via `platform_module_settings`. O pedido é que admins possam restringir **por usuário** quais módulos estão acessíveis.

### 2a) Criar tabela `user_module_access` no banco
Nova migration:

```sql
CREATE TABLE public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, module_key)
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Admins da empresa podem gerenciar acesso dos membros
CREATE POLICY "Admins can manage module access"
  ON public.user_module_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      JOIN public.profiles target_p ON target_p.id = user_module_access.user_id
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin', 'platform_admin')
        AND p.company_id = target_p.company_id
    )
  );

-- Usuários podem ler seus próprios acessos
CREATE POLICY "Users can read own module access"
  ON public.user_module_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

Os módulos disponíveis (baseados na tabela existente):
- `esgEnvironmental` (ESG Ambiental)
- `esgSocial` (ESG Social)
- `esgGovernance` (ESG Governança)
- `esgManagement` (Gestão ESG)
- `quality` (Qualidade SGQ)
- `suppliers` (Fornecedores)
- `financial` (Financeiro)
- `dataReports` (Dados e Relatórios)
- `settings` (Configurações)
- `help` (Ajuda e Suporte)

### 2b) Criar hook `useUserModuleAccess`
Novo arquivo: `src/hooks/useUserModuleAccess.ts`

- Buscar registros de `user_module_access` para um dado `user_id`.
- Mutation para upsert (ativar/desativar módulo para um usuário).
- Por padrão (sem registros), o usuário tem acesso total. Só restringe quando existe um registro com `has_access = false`.

### 2c) Adicionar seção de módulos no `UserFormModal`
Arquivo: `src/components/users/UserFormModal.tsx`

- Apenas visível no modo de edição (não no convite).
- Buscar lista de módulos de `platform_module_settings` (já existente).
- Para cada módulo, mostrar um `Switch` com o nome do módulo.
- Carregar estado atual via `useUserModuleAccess(user.id)`.
- Ao alternar, fazer upsert em `user_module_access`.
- Layout: seção com título "Acesso a Módulos" e grid de switches.
- O modal ficará mais alto, mas o scroll já estará corrigido.

### 2d) Integrar `useModuleSettings` com acesso por usuário
Arquivo: `src/hooks/useModuleSettings.ts`

- No hook existente, além de checar `platform_module_settings`, também checar `user_module_access` do usuário logado.
- Se um módulo está habilitado globalmente MAS o usuário tem `has_access = false`, ele não vê o módulo.
- Ordem de prioridade: global desabilitado > user desabilitado > visível.

## Sequência de execução

1. Corrigir scroll do dialog (CSS `overscroll-contain`).
2. Criar migration para `user_module_access`.
3. Criar hook `useUserModuleAccess`.
4. Adicionar seção de módulos no `UserFormModal`.
5. Integrar filtragem por usuário no `useModuleSettings`.

## Critérios de aceite

- Modal de edição de usuário scrolla internamente sem mover a tela de fundo.
- Admin vê seção "Acesso a Módulos" ao editar qualquer usuário.
- Cada módulo tem switch on/off.
- Ao desativar um módulo para um usuário, esse usuário não vê mais o módulo na sidebar.
- Sem restrições configuradas = acesso total (comportamento padrão preservado).

