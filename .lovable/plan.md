
## Adicionar Tabela de Usuarios ao Platform Admin Dashboard

### Visao Geral

Adicionar uma segunda tabela ao painel `/platform-admin` para listar todos os usuarios da plataforma, com filtro por empresa. O dashboard usara abas (Tabs) para alternar entre "Empresas" e "Usuarios".

### Mudancas

**1. Criar componente `PlatformUsersTable`** (`src/components/platform/PlatformUsersTable.tsx`)

- Tabela com colunas: Nome, Email, Empresa, Cargo, Role, Status, Data de cadastro
- Busca por nome ou email
- Filtro por empresa (select/combobox com todas as empresas)
- Filtro por status (ativo/inativo)
- Consulta direta ao Supabase: `profiles` com join em `companies(name)` e `user_roles(role)`
- Paginacao simples (50 por pagina)

**2. Atualizar `PlatformAdminDashboard`** (`src/pages/PlatformAdminDashboard.tsx`)

- Adicionar componente `Tabs` (do shadcn) com duas abas:
  - **Empresas** - contem o `CompanyTable` existente
  - **Usuarios** - contem o novo `PlatformUsersTable`
- Manter os KPIs e "Empresas Mais Ativas" acima das abas

### Detalhes Tecnicos

**Query de usuarios:**
```sql
SELECT p.id, p.full_name, p.email, p.is_active, p.created_at, p.job_title,
       c.name as company_name, c.id as company_id,
       ur.role
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_roles ur ON ur.user_id = p.id
ORDER BY p.created_at DESC
```

**Filtro por empresa:** Um `Select` dropdown populado com todas as empresas, permitindo filtrar a tabela. Quando selecionada uma empresa, a query adiciona `.eq('company_id', selectedCompanyId)`.

**Estrutura do componente PlatformUsersTable:**
- Estado: `search`, `selectedCompanyId`, `statusFilter`, `page`
- useQuery para buscar usuarios com filtros server-side
- useQuery separado para lista de empresas (para o dropdown)
- Badges para role e status
- Paginacao com `.range()`

### Arquivos Modificados/Criados

| Arquivo | Acao |
|---------|------|
| `src/components/platform/PlatformUsersTable.tsx` | Criar |
| `src/pages/PlatformAdminDashboard.tsx` | Modificar (adicionar Tabs) |

### Nenhuma migracao necessaria

Os dados ja existem nas tabelas `profiles`, `companies` e `user_roles`. Nao e necessario alterar o banco.
