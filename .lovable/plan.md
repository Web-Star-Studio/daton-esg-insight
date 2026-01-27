
# Plano: Corrigir Exclusão de Filial com Dados de Outra Empresa

## Diagnóstico do Problema

A filial "MATRIZ" (id: `8e365880-51b8-4006-a04f-3b904e6269f3`) está aparecendo na sua listagem, mas pertence a **outra empresa** (`company_id: 0f944a53-...`), diferente da sua conta (`company_id: 021647af-...`).

Existem 4 programas de treinamento vinculados a essa filial, e eles também pertencem a **outra empresa**. Por isso:
1. A tentativa de deletar esses programas falha silenciosamente (RLS bloqueia)
2. Os programas permanecem no banco
3. A tentativa de deletar a branch falha com FK violation

**Essa filial não deveria estar visível para você** - é um registro órfão ou há uma inconsistência nas políticas RLS.

---

## Opções de Solução

### Opção A: Limpeza Direta no Banco (Recomendada - Rápido)

Como os dados são de outra empresa, a forma mais segura é um administrador de banco executar a limpeza manualmente:

```sql
-- 1. Remover os programas de treinamento da filial órfã
DELETE FROM training_programs WHERE branch_id = '8e365880-51b8-4006-a04f-3b904e6269f3';

-- 2. Remover a filial órfã
DELETE FROM branches WHERE id = '8e365880-51b8-4006-a04f-3b904e6269f3';
```

Isso deve ser executado no **SQL Editor do Supabase** (requer acesso direto ao banco).

---

### Opção B: Corrigir RLS para Ocultar Dados de Outras Empresas

Se isso está acontecendo, pode haver um problema nas políticas RLS da tabela `branches`. Podemos auditar e corrigir para garantir que cada usuário só veja dados da sua própria empresa.

**Verificação necessária:**
- Auditar a RLS da tabela `branches`
- Garantir que `get_user_company_id()` está sendo aplicado corretamente

---

### Opção C: Adicionar Verificação Extra no Frontend (Paliativo)

Modificar `deleteBranchWithDependencies` para:
1. Verificar se a branch pertence ao `company_id` do usuário atual
2. Se não pertencer, bloquear a exclusão com mensagem clara

Isso **não resolve o dado órfão**, mas previne erros confusos.

---

## Implementação Recomendada

**Passo 1:** Executar a limpeza SQL (Opção A) para remover esse registro específico.

**Passo 2 (opcional):** Adicionar validação no frontend para prevenir tentativas de exclusão de dados de outras empresas.

### Alterações no Frontend (Passo 2)

**Arquivo:** `src/services/branches.ts`

Na função `deleteBranchWithDependencies`, adicionar verificação:

```typescript
export const deleteBranchWithDependencies = async (id: string) => {
  const companyId = await getUserCompanyId();
  if (!companyId) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se a branch pertence ao company_id do usuário
  const { data: branch, error: checkError } = await supabase
    .from('branches')
    .select('id, company_id, name')
    .eq('id', id)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Erro ao verificar filial: ${checkError.message}`);
  }

  if (!branch) {
    throw new Error('Filial não encontrada');
  }

  if (branch.company_id !== companyId) {
    throw new Error(
      `Você não tem permissão para excluir a filial "${branch.name}". ` +
      `Ela pertence a outra organização.`
    );
  }

  // ... resto do código de exclusão
};
```

---

## Resumo

| Etapa | Ação | Quem executa |
|-------|------|--------------|
| 1 | Executar SQL de limpeza | Você (no SQL Editor do Supabase) |
| 2 | Adicionar validação de company_id | Eu (código frontend) |

**Total de alterações no código:** 1 arquivo, ~20 linhas

---

## Resultado Esperado

1. A filial "MATRIZ" órfã deixará de existir
2. Futuras tentativas de excluir dados de outras empresas resultarão em mensagem clara
3. Não haverá mais erros de FK por dados que o usuário não pode deletar
