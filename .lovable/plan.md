
# Plano: Corrigir Erro de Carregamento do Organograma

## Diagnóstico

O erro **PGRST201** ocorre porque a tabela `organizational_chart` tem duas foreign keys para a tabela `employees`:

1. `employee_id` → funcionário que ocupa a posição
2. `reports_to_employee_id` → supervisor/superior direto

Quando a query usa `employee:employees(...)`, o PostgREST não consegue determinar qual relacionamento usar e retorna o erro.

## Solução

Especificar explicitamente qual foreign key usar em todas as queries que fazem join com `employees`.

---

## Alterações

**Arquivo:** `src/services/organizationalStructure.ts`

### 1. Função `getOrganizationalChart` (linhas 234-248)

```typescript
// DE:
employee:employees(id, full_name, email, position)

// PARA:
employee:employees!organizational_chart_employee_id_fkey(id, full_name, email, position)
```

### 2. Função `createOrganizationalChartNode` (linhas 278-283)

```typescript
// DE:
employee:employees(id, full_name, email, position)

// PARA:
employee:employees!organizational_chart_employee_id_fkey(id, full_name, email, position)
```

### 3. Função `updateOrganizationalChartNode` (linhas 306-311)

```typescript
// DE:
employee:employees(id, full_name, email, position)

// PARA:
employee:employees!organizational_chart_employee_id_fkey(id, full_name, email, position)
```

---

## Resultado Esperado

O organograma carregará corretamente, exibindo os funcionários, cargos e departamentos na estrutura hierárquica.
