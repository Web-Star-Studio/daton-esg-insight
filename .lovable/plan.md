
# Controle Granular de Acesso a Modulos por Usuario

## Objetivo
Permitir que admins da organizacao definam exatamente quais modulos cada usuario pode acessar, diretamente no formulario de gestao de usuarios do `/admin-dashboard`.

## Arquitetura

### Camada de dados

Nova tabela `user_module_access` que registra quais modulos cada usuario pode acessar:

```text
user_module_access
+----------------+------+-------------------+
| user_id (uuid) | FK   | references auth.users(id) ON DELETE CASCADE |
| module_key     | text | ex: "financial", "quality"                  |
| granted        | bool | default true                                |
| granted_by     | uuid | quem concedeu                               |
| created_at     | ts   | default now()                               |
+----------------+------+-------------------+
PK: (user_id, module_key)
```

RLS:
- SELECT: usuarios podem ler seus proprios registros; admins podem ler todos da empresa (via `get_user_company_id()`)
- INSERT/UPDATE/DELETE: apenas admins da mesma empresa

Quando nenhum registro existe para um usuario, o comportamento padrao sera "acesso a todos os modulos" (permissivo por padrao), evitando quebrar usuarios existentes.

### Camada de servico

**Novo hook `useUserModuleAccess`**:
- `getUserModules(userId)`: retorna lista de module_keys permitidos
- `updateUserModules(userId, moduleKeys[])`: substitui os modulos permitidos (delete all + insert)
- `hasModuleAccess(moduleKey)`: verifica se o usuario logado tem acesso ao modulo

**Modificar `useModuleSettings`**:
- Adicionar uma camada de verificacao: alem de checar se o modulo esta habilitado globalmente (`platform_module_settings`), tambem verificar se o usuario tem acesso individual (`user_module_access`)
- A logica sera: modulo visivel = habilitado globalmente AND (sem restricoes por usuario OR usuario tem acesso)

### Camada de UI

**Modificar `UserFormModal.tsx`**:
- Adicionar uma secao "Acesso a Modulos" abaixo do campo de role
- Lista de checkboxes com todos os modulos disponiveis (vindos de `platform_module_settings`)
- Checkbox "Acesso Total" que marca/desmarca todos
- Ao salvar, persiste as selecoes em `user_module_access`

**Modificar `UserInviteModule.tsx`**:
- Ao criar/editar usuario, passar os modulos selecionados para o fluxo de save
- No dialog de detalhes do usuario, mostrar os modulos permitidos

## Secao Tecnica

### Migration SQL

```sql
CREATE TABLE public.user_module_access (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_key text NOT NULL,
  granted boolean DEFAULT true NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, module_key)
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access
CREATE POLICY "Users can read own module access"
ON public.user_module_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can read all in their company
CREATE POLICY "Admins can read company module access"
ON public.user_module_access FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'platform_admin')
  )
);

-- Admins can manage module access
CREATE POLICY "Admins can manage module access"
ON public.user_module_access FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'platform_admin')
  )
);
```

### Hook `useUserModuleAccess`

```typescript
// Buscar modulos de um usuario especifico
const { data } = useQuery({
  queryKey: ['user-module-access', userId],
  queryFn: () => supabase
    .from('user_module_access')
    .select('module_key')
    .eq('user_id', userId)
    .eq('granted', true)
});

// Salvar modulos (upsert pattern)
const saveModules = useMutation({
  mutationFn: async ({ userId, modules }) => {
    // Delete existing
    await supabase.from('user_module_access')
      .delete().eq('user_id', userId);
    // Insert selected
    if (modules.length > 0) {
      await supabase.from('user_module_access')
        .insert(modules.map(m => ({
          user_id: userId,
          module_key: m,
          granted: true,
          granted_by: currentUserId
        })));
    }
  }
});
```

### Modificacao no `useModuleSettings`

Na funcao `isModuleVisible`, adicionar verificacao do acesso do usuario:

```typescript
const isModuleVisible = (moduleKey: string): boolean => {
  // 1. Checar se modulo esta habilitado globalmente
  const globallyEnabled = /* logica existente */;
  if (!globallyEnabled) return false;

  // 2. Checar acesso individual do usuario
  if (userModuleAccess && userModuleAccess.length > 0) {
    return userModuleAccess.some(m => m.module_key === moduleKey);
  }

  // 3. Sem restricoes = acesso total (backward compatible)
  return true;
};
```

### Modificacao no `UserFormModal`

Adicionar secao com checkboxes dos modulos:

```text
+-------------------------------------------+
| Acesso a Modulos                          |
| [x] Acesso Total                          |
| ----------------------------------------- |
| [x] ESG Ambiental    [x] ESG Social      |
| [x] ESG Governanca   [x] Gestao ESG      |
| [x] Qualidade (SGQ)  [x] Fornecedores    |
| [ ] Financeiro        [ ] Dados e Relat.  |
| [x] Configuracoes    [x] Ajuda           |
+-------------------------------------------+
```

### Fluxo completo

```text
Admin abre formulario de usuario
  -> Carrega modulos disponiveis (platform_module_settings)
  -> Carrega modulos do usuario (user_module_access)
  -> Renderiza checkboxes
  -> Admin seleciona modulos
  -> Salva usuario + modulos
  -> Sidebar do usuario alvo filtra modulos automaticamente
```

### Arquivos modificados/criados
1. **Migration SQL** - Criar tabela `user_module_access`
2. **`src/hooks/useUserModuleAccess.ts`** (novo) - Hook para CRUD de acesso a modulos
3. **`src/hooks/useModuleSettings.ts`** - Integrar verificacao de acesso do usuario
4. **`src/components/users/UserFormModal.tsx`** - Adicionar secao de modulos
5. **`src/components/admin/UserInviteModule.tsx`** - Passar modulos no fluxo de save e exibir nos detalhes
