
# Plano de Implementacao - Painel Completo de Gerenciamento de Usuarios (Admin)

## Resumo Executivo

Este plano implementa um painel administrativo robusto de gerenciamento de usuarios com validacoes rigorosas, auditoria completa e controles de seguranca avancados conforme solicitado na diretiva CTO.

---

## Analise do Estado Atual

### Componentes Existentes

| Arquivo | Funcionalidade | Status |
|---------|----------------|--------|
| `src/pages/GestaoUsuarios.tsx` | Pagina principal de usuarios | Basica, sem paginacao/busca |
| `src/components/users/UserListTable.tsx` | Lista de usuarios em cards | Sem colunas, filtros, ordenacao |
| `src/components/users/UserFormModal.tsx` | Formulario criar/editar | Falta validacao unique |
| `src/hooks/data/useUserManagement.ts` | CRUD via edge functions | Funcional, falta soft delete |
| `supabase/functions/manage-user/` | Backend de gerenciamento | Sem validacao email unique |
| `supabase/functions/invite-user/` | Convite por email | Funcional |
| `src/services/audit.ts` | Log de atividades | Existe `logActivity()` |

### Tabelas de Banco de Dados

```
profiles:
  - id, full_name, email, username, avatar_url, company_id, created_at
  - role (DEPRECATED - usar user_roles)

user_roles:
  - id, user_id, role, company_id, assigned_by_user_id, assigned_at, created_at, updated_at
  - Roles: platform_admin, super_admin, admin, manager, analyst, operator, auditor, viewer

activity_logs:
  - id, company_id, user_id, action_type, description, details_json, created_at
```

---

## Lacunas Identificadas

| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Tabela com colunas (ID, Nome, Email, Username, Role, Status, Data) | NAO EXISTE | ALTA |
| Paginacao (20/pagina) | NAO EXISTE | ALTA |
| Busca por email/username/nome | NAO EXISTE | ALTA |
| Filtros (Role, Status Ativo/Inativo) | NAO EXISTE | ALTA |
| Ordenacao por coluna | NAO EXISTE | MEDIA |
| Validacao email unique (server-side) | NAO EXISTE | ALTA |
| Validacao username unique + regex | NAO EXISTE | ALTA |
| Campo status (Ativo/Inativo) em profiles | NAO EXISTE | ALTA |
| Soft delete vs Hard delete | NAO EXISTE | ALTA |
| Botao Resetar Senha | NAO EXISTE | ALTA |
| Confirmacao dupla para deletar usuario ativo | NAO EXISTE | MEDIA |
| Prevenir auto-exclusao/auto-edicao de role | NAO EXISTE | ALTA |
| Proteger Admin Master de exclusao | NAO EXISTE | ALTA |
| Historico de mudancas em activity_logs | PARCIAL | MEDIA |

---

## Arquitetura da Solucao

```
+---------------------------+
|  GestaoUsuarios.tsx       |  <-- Pagina refatorada
+---------------------------+
           |
     +-----+-----+
     |           |
     v           v
+-----------+ +------------------+
| UserTable | | UserActionPanel  |
| (novo)    | | (novo)           |
+-----------+ +------------------+
     |                |
     v                v
+------------------------------------------+
|          useUserManagement.ts            |
|  (estendido: paginacao, filtros, soft)   |
+------------------------------------------+
           |
           v
+------------------------------------------+
|         manage-user/index.ts             |
|  (estendido: validacoes, soft delete,    |
|   audit trail, protecoes de seguranca)   |
+------------------------------------------+
```

---

## Plano de Implementacao

### Fase 1: Migracao de Banco de Dados

**Adicionar campo `is_active` na tabela `profiles`:**

```sql
-- Adicionar status ativo/inativo
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Adicionar deleted_at para soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID;

-- Indice para username unique (ja existe, verificar)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
  ON profiles(username) WHERE username IS NOT NULL AND deleted_at IS NULL;

-- Indice para email unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
  ON profiles(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
```

---

### Fase 2: Backend - Edge Function `manage-user`

**Arquivo:** `supabase/functions/manage-user/index.ts`

**Novas funcionalidades:**

1. **Validacao Email Unique:**
   - Antes de criar/atualizar, verificar se email existe
   - Query: `SELECT id FROM profiles WHERE email = ? AND id != ?`

2. **Validacao Username:**
   - Regex: `^[a-zA-Z0-9_-]{3,30}$`
   - Verificar unicidade: `SELECT id FROM profiles WHERE username = ? AND id != ?`

3. **Protecoes de Seguranca:**
   - Impedir usuario deletar a si mesmo
   - Impedir usuario editar proprio role
   - Proteger platform_admin/super_admin de exclusao

4. **Soft Delete:**
   - Nova action: `soft_delete`
   - Atualizar: `is_active = false, deleted_at = now(), deleted_by_user_id = caller_id`
   - Manter `delete` para hard delete (com confirmacao dupla)

5. **Reset de Senha:**
   - Nova action: `reset_password`
   - Gerar magic link via `supabase.auth.admin.generateLink`
   - Enviar email com link de 24h

6. **Audit Trail:**
   - Logar TODAS as acoes em `activity_logs`
   - Action types: `user_created`, `user_updated`, `user_role_changed`, `user_deactivated`, `user_deleted`, `user_password_reset`

7. **Listagem Avancada:**
   - Nova action: `list_paginated`
   - Parametros: `page`, `limit`, `search`, `role_filter`, `status_filter`, `order_by`, `order_dir`

---

### Fase 3: Hook `useUserManagement.ts`

**Extensoes:**

```typescript
interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
  orderBy?: 'full_name' | 'email' | 'created_at' | 'role';
  orderDir?: 'asc' | 'desc';
}

interface UserProfile {
  // ... campos existentes
  is_active: boolean;
  username?: string;
  deleted_at?: string;
}

interface PaginatedResponse {
  users: UserProfile[];
  total: number;
  page: number;
  totalPages: number;
}

// Novas funcoes
softDeleteUser(userId: string): void;
resetPassword(userId: string, email: string): void;
fetchUsersPaginated(filters: UserFilters): PaginatedResponse;
```

---

### Fase 4: Componentes de UI

#### 4.1 `AdminUserTable.tsx` (NOVO)

**Funcionalidades:**
- Tabela com colunas: ID (truncado), Nome, Email, Username, Role, Status, Criado em
- Badges de status (Ativo = verde, Inativo = vermelho)
- Badges de role (cores por nivel)
- Cabecalhos clicaveis para ordenacao
- Dropdown de acoes: Visualizar, Editar, Resetar Senha, Desativar, Deletar

#### 4.2 `UserSearchFilters.tsx` (NOVO)

**Funcionalidades:**
- Input de busca com debounce (300ms)
- Dropdown filtro de Role (Admin, Manager, Analyst, etc)
- Dropdown filtro de Status (Ativo, Inativo, Todos)
- Botao "Limpar Filtros"

#### 4.3 `UserPagination.tsx` (NOVO)

**Funcionalidades:**
- Navegacao Anterior/Proximo
- Indicador de pagina atual / total
- Seletor de itens por pagina (10, 20, 50)

#### 4.4 `UserFormModal.tsx` (ATUALIZAR)

**Adicoes:**
- Campo Username com validacao regex client-side
- Validacao async de email/username unique (onBlur)
- Switch Status Ativo/Inativo (apenas em edicao)
- Preview de mudancas antes de salvar
- Confirmacao para mudanca de role

#### 4.5 `ResetPasswordDialog.tsx` (NOVO)

**Funcionalidades:**
- Confirmacao: "Enviar link de reset de senha?"
- Feedback de sucesso com informacao de expiracao (24h)

#### 4.6 `DeleteUserDialog.tsx` (NOVO)

**Funcionalidades:**
- Opcao: Soft delete (Desativar) vs Hard delete (Remover)
- Se usuario ativo: "Este usuario esta ATIVO. Tem certeza?"
- Campo opcional: Motivo da exclusao
- Prevencao de auto-exclusao

---

### Fase 5: Validacoes Criticas de Seguranca

#### No Frontend (client-side):

```typescript
// Validacao de email
const emailSchema = z.string().email().max(255);

// Validacao de username
const usernameSchema = z.string()
  .min(3, "Minimo 3 caracteres")
  .max(30, "Maximo 30 caracteres")
  .regex(/^[a-zA-Z0-9_-]+$/, "Apenas letras, numeros, _ e -");

// Validacao async (onBlur)
async function checkEmailUnique(email: string, excludeId?: string): Promise<boolean>;
async function checkUsernameUnique(username: string, excludeId?: string): Promise<boolean>;
```

#### No Backend (edge function):

```typescript
// Validacoes de seguranca
function validateSecurityRules(callerUser, targetUser, action) {
  // 1. Impedir auto-exclusao
  if (action === 'delete' && callerUser.id === targetUser.id) {
    throw new Error('Voce nao pode excluir sua propria conta');
  }
  
  // 2. Impedir edicao do proprio role
  if (action === 'update_role' && callerUser.id === targetUser.id) {
    throw new Error('Voce nao pode alterar seu proprio papel');
  }
  
  // 3. Proteger super_admin/platform_admin
  if (['super_admin', 'platform_admin'].includes(targetUser.role) && action === 'delete') {
    throw new Error('Administradores principais nao podem ser excluidos');
  }
  
  // 4. Apenas super_admin pode criar outro super_admin
  if (action === 'create' && targetUser.role === 'super_admin' && callerUser.role !== 'super_admin') {
    throw new Error('Apenas Super Admins podem criar outros Super Admins');
  }
}
```

---

### Fase 6: Auditoria Completa

**Action types a registrar:**

| Action Type | Descricao | Details JSON |
|-------------|-----------|--------------|
| `admin_user_created` | Usuario criado via admin | `{target_user_id, email, role}` |
| `admin_user_updated` | Dados de usuario atualizados | `{target_user_id, changes: {...}}` |
| `admin_user_role_changed` | Role alterado | `{target_user_id, old_role, new_role}` |
| `admin_user_deactivated` | Usuario desativado (soft delete) | `{target_user_id, reason}` |
| `admin_user_reactivated` | Usuario reativado | `{target_user_id}` |
| `admin_user_deleted` | Usuario removido (hard delete) | `{target_user_id, reason}` |
| `admin_password_reset_sent` | Link de reset enviado | `{target_user_id, email}` |

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/users/AdminUserTable.tsx` | CRIAR | Tabela completa com colunas |
| `src/components/users/UserSearchFilters.tsx` | CRIAR | Barra de busca e filtros |
| `src/components/users/UserPagination.tsx` | CRIAR | Controles de paginacao |
| `src/components/users/ResetPasswordDialog.tsx` | CRIAR | Dialog de reset de senha |
| `src/components/users/DeleteUserDialog.tsx` | CRIAR | Dialog de exclusao com opcoes |
| `src/components/users/UserFormModal.tsx` | MODIFICAR | Adicionar username, validacoes async |
| `src/hooks/data/useUserManagement.ts` | MODIFICAR | Paginacao, filtros, novas acoes |
| `src/pages/GestaoUsuarios.tsx` | MODIFICAR | Integrar novos componentes |
| `supabase/functions/manage-user/index.ts` | MODIFICAR | Validacoes, soft delete, audit |

---

## Migracao SQL Completa

```sql
-- 1. Adicionar campos de status e soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID REFERENCES auth.users(id);

-- 2. Indices para unicidade (excluindo soft-deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_active 
  ON profiles(email) WHERE deleted_at IS NULL;
  
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_active 
  ON profiles(username) WHERE username IS NOT NULL AND deleted_at IS NULL;

-- 3. Indice para busca
CREATE INDEX IF NOT EXISTS idx_profiles_search 
  ON profiles USING gin(to_tsvector('portuguese', full_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(username, '')));
```

---

## Fluxo de Testes

### Testes Funcionais

1. **Criar usuario:** Validar email/username unique, toast de sucesso
2. **Editar usuario:** Validar mudanca de role exige confirmacao
3. **Resetar senha:** Verificar email recebido com link valido
4. **Soft delete:** Usuario desativado, ainda visivel com filtro
5. **Hard delete:** Usuario removido completamente
6. **Busca:** Testar por nome parcial, email, username
7. **Filtros:** Testar por role e status
8. **Ordenacao:** Testar por cada coluna
9. **Paginacao:** Navegar entre paginas

### Testes de Seguranca

1. Tentar deletar a si mesmo (deve falhar)
2. Tentar mudar proprio role (deve falhar)
3. Tentar deletar platform_admin (deve falhar)
4. Criar super_admin sendo admin (deve falhar)
5. Acessar usuarios de outra empresa (deve falhar)
6. Enviar email duplicado (deve falhar)
7. Enviar username invalido (deve falhar)

---

## Ordem de Execucao

1. **Fase 1:** Migracao SQL (is_active, deleted_at, indices)
2. **Fase 2:** Backend manage-user (validacoes, soft delete, audit)
3. **Fase 3:** Hook useUserManagement (paginacao, filtros)
4. **Fase 4:** Componentes UI (tabela, filtros, dialogs)
5. **Fase 5:** Integracao na pagina GestaoUsuarios
6. **Fase 6:** Testes end-to-end

---

## Documentacao de Fluxos

### Fluxo: Criar Usuario

```
1. Admin clica "Novo Usuario"
2. Preenche: Email, Username (opcional), Nome, Role
3. Validacao client-side (formato, regex)
4. Validacao server-side (unicidade)
5. Usuario criado + email de boas-vindas enviado
6. Log: admin_user_created
7. Redirect para lista com toast de sucesso
```

### Fluxo: Deletar Usuario

```
1. Admin clica "Deletar" no usuario
2. Sistema verifica se usuario esta ativo
3. Se ativo: confirmacao dupla
4. Admin escolhe: Soft delete ou Hard delete
5. Opcional: informar motivo
6. Backend valida permissoes
7. Executa operacao
8. Log: admin_user_deactivated ou admin_user_deleted
9. Lista atualizada
```

### Fluxo: Reset de Senha

```
1. Admin clica "Resetar Senha"
2. Dialog de confirmacao
3. Backend gera magic link (24h expiracao)
4. Email enviado ao usuario
5. Log: admin_password_reset_sent
6. Toast: "Link enviado para {email}"
```

---

## Entregaveis

- Painel admin completo com tabela, filtros, paginacao
- Validacoes de email/username unique (client + server)
- Soft delete e hard delete com confirmacoes
- Reset de senha via email
- Protecoes de seguranca (auto-exclusao, roles protegidos)
- Auditoria completa de todas as acoes
- Documentacao de fluxos

