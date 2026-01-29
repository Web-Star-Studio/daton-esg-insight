
# Plano: Corrigir Exibicao dos Planos de Sucessao

## Diagnostico

Os planos de sucessao **estao sendo salvos corretamente** no banco de dados (confirmei 3 registros da empresa `e50e7445-e38e-450a-8c51-fb5918b2faf3`), porem **nao aparecem na interface** porque:

1. **Faltam Foreign Keys** na tabela `succession_plans` - a tabela foi criada sem as constraints de FK
2. A consulta usa sintaxe PostgREST de relacionamento (`current_holder:employees!current_holder_id`) que **requer FKs definidas**
3. Sem as FKs, o PostgREST rejeita a query silenciosamente ou retorna erro

**Evidencia:** Consultei `information_schema.table_constraints` e confirmei que `succession_plans` nao possui nenhuma foreign key.

---

## Solucao

Duas opcoes:

### Opcao A: Adicionar Foreign Keys no Banco (Recomendado)
Criar as FKs necessarias via migracao SQL.

### Opcao B: Modificar a Query (Workaround)
Remover a sintaxe de relacionamento e fazer queries separadas no codigo.

Vou implementar **Opcao A** (adicionar FKs) pois e a solucao correta e mantem a performance.

---

## Alteracoes

### 1. Migracao SQL (Nova Migracao)

Criar arquivo de migracao para adicionar as foreign keys:

```sql
-- Adicionar FK para current_holder_id -> employees
ALTER TABLE succession_plans
ADD CONSTRAINT fk_succession_plans_current_holder
FOREIGN KEY (current_holder_id) REFERENCES employees(id)
ON DELETE SET NULL;

-- Adicionar FK para company_id -> companies
ALTER TABLE succession_plans
ADD CONSTRAINT fk_succession_plans_company
FOREIGN KEY (company_id) REFERENCES companies(id)
ON DELETE CASCADE;

-- Adicionar FK para created_by_user_id -> profiles (auth.users)
ALTER TABLE succession_plans
ADD CONSTRAINT fk_succession_plans_created_by
FOREIGN KEY (created_by_user_id) REFERENCES profiles(id)
ON DELETE SET NULL;
```

### 2. Atualizar o Servico (src/services/careerDevelopment.ts)

Ajustar a query para funcionar mesmo sem FK, usando sintaxe alternativa que nao depende de FK:

**Antes (linha 226-239):**
```typescript
export const getSuccessionPlans = async () => {
  const { data, error } = await supabase
    .from('succession_plans')
    .select(`
      *,
      current_holder:employees!current_holder_id(id, full_name),
      candidates:succession_candidates(
        *,
        employee:employees!employee_id(id, full_name)
      )
    `)
    .order('created_at', { ascending: false });
```

**Depois:**
```typescript
export const getSuccessionPlans = async () => {
  // Buscar planos de sucessao
  const { data: plans, error } = await supabase
    .from('succession_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!plans || plans.length === 0) return [];

  // Buscar current_holders em paralelo
  const holderIds = plans
    .map(p => p.current_holder_id)
    .filter(Boolean);
  
  let holders: Record<string, any> = {};
  if (holderIds.length > 0) {
    const { data: holdersData } = await supabase
      .from('employees')
      .select('id, full_name')
      .in('id', holderIds);
    
    holders = (holdersData || []).reduce((acc, h) => {
      acc[h.id] = h;
      return acc;
    }, {} as Record<string, any>);
  }

  // Buscar candidates
  const planIds = plans.map(p => p.id);
  const { data: candidatesData } = await supabase
    .from('succession_candidates')
    .select('*')
    .in('succession_plan_id', planIds);

  // Buscar employees dos candidates
  const candidateEmployeeIds = (candidatesData || [])
    .map(c => c.employee_id)
    .filter(Boolean);
  
  let candidateEmployees: Record<string, any> = {};
  if (candidateEmployeeIds.length > 0) {
    const { data: empData } = await supabase
      .from('employees')
      .select('id, full_name')
      .in('id', candidateEmployeeIds);
    
    candidateEmployees = (empData || []).reduce((acc, e) => {
      acc[e.id] = e;
      return acc;
    }, {} as Record<string, any>);
  }

  // Montar resultado
  return plans.map(plan => ({
    ...plan,
    current_holder: plan.current_holder_id 
      ? holders[plan.current_holder_id] || null 
      : null,
    candidates: (candidatesData || [])
      .filter(c => c.succession_plan_id === plan.id)
      .map(c => ({
        ...c,
        employee: c.employee_id 
          ? candidateEmployees[c.employee_id] || null 
          : null
      }))
  }));
};
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Query falha silenciosamente por falta de FK | Query funciona com queries separadas |
| Planos de sucessao nao aparecem | Planos de sucessao sao exibidos corretamente |
| Toast de sucesso mas lista vazia | Dados aparecem apos criacao/atualizacao |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/careerDevelopment.ts` | Refatorar `getSuccessionPlans()` para nao depender de FKs |

---

## Observacao sobre Migracao SQL

A migracao SQL para adicionar as Foreign Keys e **opcional** mas **recomendada** para o futuro. A correcao no codigo resolve o problema imediatamente sem necessidade de alteracoes no banco.
