
# Plano: Funcionalidade de Exclusao de Conta do Usuario

## Resumo

Implementar a opcao de excluir completamente a conta do usuario na pagina de Configuracoes. Se o usuario for o dono da organizacao (primeiro usuario cadastrado ou super_admin), a exclusao tambem removera a organizacao e todos os seus dados.

---

## Fluxo de Exclusao

```text
Usuario solicita exclusao
         |
         v
    [Verificar role]
         |
    +----+----+
    |         |
  Normal    Dono/SuperAdmin
    |         |
    v         v
Excluir     Aviso: "Voce
proprios    e o dono da org.
dados       Excluir tambem
    |       a empresa?"
    |         |
    v         v
Fim      Excluir todos
         usuarios e dados
         da empresa
              |
              v
            Fim
```

---

## Tabelas Afetadas (Company Delete)

Com base nas tabelas com `company_id`, a exclusao de uma empresa afetara mais de **120 tabelas**, incluindo:

- `profiles` - Perfis de usuarios
- `user_roles` - Roles dos usuarios
- `employees` - Colaboradores
- `branches` - Filiais
- `training_programs` - Treinamentos
- `documents` - Documentos
- `emission_sources` - Fontes de emissao
- `goals` - Metas
- `non_conformities` - Nao conformidades
- `esg_risks` - Riscos ESG
- `licenses` - Licencas
- ... (e muitas outras)

---

## Identificacao do Dono da Empresa

Criterio para determinar se usuario e dono:
1. **Role `super_admin`** na empresa - pode deletar a empresa
2. **Role `admin` + primeiro usuario** - pode deletar a empresa
3. **Outros roles** - podem deletar apenas sua propria conta

---

## Alteracoes Tecnicas

### 1. Nova Edge Function: `delete-account`

**Caminho:** `supabase/functions/delete-account/index.ts`

**Responsabilidades:**
- Verificar autenticacao
- Determinar se usuario e dono da empresa
- Se for dono: deletar todos dados da empresa + todos usuarios
- Se nao for dono: deletar apenas dados do usuario
- Usar `service_role` para bypass de RLS

**Logica principal:**

```typescript
// 1. Get user role and company
// 2. Check if user is company owner (super_admin or first user + admin)
// 3. If owner: delete company with all data
// 4. If not owner: delete only user data
// 5. Delete auth user(s)
// 6. Sign out
```

**Ordem de exclusao para empresa:**
1. Deletar todos os dados de tabelas dependentes (por company_id)
2. Deletar profiles de todos usuarios da empresa
3. Deletar user_roles de todos usuarios
4. Deletar usuarios do auth.users
5. Deletar a empresa

**Ordem de exclusao para usuario individual:**
1. Desassociar dados criados pelo usuario (set created_by = null onde aplicavel)
2. Deletar profile do usuario
3. Deletar user_role do usuario
4. Deletar usuario do auth.users

---

### 2. Atualizar Pagina de Configuracao

**Arquivo:** `src/pages/Configuracao.tsx`

**Adicionar na secao "Meu Perfil":**
- Novo Card "Zona de Perigo"
- Botao "Excluir Minha Conta"
- Dialogo de confirmacao com 2 niveis:
  - Usuario comum: Confirmar digitando email
  - Dono da empresa: Aviso em vermelho + confirmar digitando "EXCLUIR TUDO"

**Novo componente:** `<DeleteAccountSection />`

---

### 3. Hook para Exclusao de Conta

**Arquivo:** `src/hooks/useDeleteAccount.ts`

```typescript
export const useDeleteAccount = () => {
  const { logout } = useAuth();
  
  return useMutation({
    mutationFn: async ({ confirmText }: { confirmText: string }) => {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmText }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await logout();
      window.location.href = '/auth';
    }
  });
};
```

---

### 4. Componente DeleteAccountSection

**Arquivo:** `src/components/settings/DeleteAccountSection.tsx`

**Funcionalidades:**
- Mostrar se usuario e dono da empresa
- Listar consequencias da exclusao
- Dialogo de confirmacao com input
- Loading state durante exclusao

**UI:**
```tsx
<Card className="border-destructive">
  <CardHeader>
    <CardTitle className="text-destructive flex items-center gap-2">
      <AlertTriangle /> Zona de Perigo
    </CardTitle>
  </CardHeader>
  <CardContent>
    {isOwner && (
      <Alert variant="destructive">
        Voce e o dono desta organizacao. Excluir sua conta
        ira excluir TODA a organizacao e dados de todos os usuarios.
      </Alert>
    )}
    
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 /> Excluir Minha Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Dialogo de confirmacao */}
      </AlertDialogContent>
    </AlertDialog>
  </CardContent>
</Card>
```

---

## Implementacao da Edge Function

```typescript
// delete-account/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TABLES_TO_DELETE = [
  'accounting_entries',
  'accounts_payable',
  'accounts_receivable',
  // ... todas as ~120 tabelas com company_id
  'employees',
  'branches',
  'documents',
  // profiles e user_roles sao deletados por ultimo
];

serve(async (req) => {
  // CORS handling
  // Auth verification
  
  // 1. Check if user is company owner
  const isOwner = await checkIfOwner(userId, companyId);
  
  if (isOwner) {
    // 2a. Delete all company data
    for (const table of TABLES_TO_DELETE) {
      await supabaseAdmin.from(table).delete().eq('company_id', companyId);
    }
    
    // 2b. Get all users of this company
    const { data: companyUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('company_id', companyId);
    
    // 2c. Delete all profiles
    await supabaseAdmin.from('profiles').delete().eq('company_id', companyId);
    
    // 2d. Delete all user_roles
    await supabaseAdmin.from('user_roles').delete().eq('company_id', companyId);
    
    // 2e. Delete all auth users
    for (const u of companyUsers) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
    }
    
    // 2f. Delete company
    await supabaseAdmin.from('companies').delete().eq('id', companyId);
    
  } else {
    // 3. Delete only user data
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
  
  return { success: true };
});
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/delete-account/index.ts` | Criar | Edge function para exclusao |
| `supabase/config.toml` | Modificar | Registrar nova funcao |
| `src/hooks/useDeleteAccount.ts` | Criar | Hook para chamar a funcao |
| `src/components/settings/DeleteAccountSection.tsx` | Criar | Componente de UI |
| `src/pages/Configuracao.tsx` | Modificar | Adicionar secao de exclusao |

---

## Seguranca

1. **Confirmacao obrigatoria**: Usuario deve digitar email ou "EXCLUIR TUDO"
2. **Validacao server-side**: Edge function verifica token e permissoes
3. **Service Role**: Usa service_role_key para bypass de RLS
4. **Logging**: Registrar acoes de exclusao para auditoria
5. **Rate limiting**: Prevenir abuso

---

## Mensagens de Confirmacao

**Usuario comum:**
> Voce esta prestes a excluir sua conta permanentemente. 
> Todos os seus dados pessoais serao removidos.
> Digite seu email para confirmar: [input]

**Dono da empresa:**
> ATENCAO: Voce e o dono da organizacao "{nomeEmpresa}".
> Esta acao ira excluir PERMANENTEMENTE:
> - Sua conta e todos os seus dados
> - A organizacao e TODOS os dados da empresa
> - Todas as contas de outros usuarios ({X} usuarios)
> - Documentos, relatorios, metas, etc.
> 
> Esta acao NAO pode ser desfeita.
> Digite "EXCLUIR TUDO" para confirmar: [input]

---

## Resultado Esperado

1. **Novo card** na secao "Meu Perfil" para exclusao de conta
2. **Dialogo de confirmacao** com avisos claros
3. **Exclusao completa** de dados do usuario ou empresa
4. **Redirecionamento** para pagina de login apos exclusao
5. **Logs de auditoria** para compliance

---

## Estimativa

- **Edge function**: ~200 linhas
- **Componente UI**: ~150 linhas
- **Hook**: ~30 linhas
- **Total**: 4 arquivos novos + 2 modificacoes
