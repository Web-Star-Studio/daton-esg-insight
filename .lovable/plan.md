
# Plano: Corrigir Problemas de Funcionarios e Treinamentos

## Problema 1: Lista de Funcionarios Nao Atualiza Automaticamente

### Diagnostico
A lista de funcionarios usa o hook `useEmployeesPaginated` que tem a query key:
```
['employees-paginated', params.page, params.pageSize, params.search, params.status, params.department]
```

Mas as invalidacoes em varios lugares usam apenas:
```
queryClient.invalidateQueries({ queryKey: ['employees'] })
```

Isso nao invalida a query paginada, causando a necessidade de F5.

### Solucao
Atualizar todos os hooks de mutacao em `src/services/employees.ts` para invalidar ambas as query keys:

```typescript
// useCreateEmployee, useUpdateEmployee, useDeleteEmployee
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['employees'] });
  queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
}
```

Tambem atualizar `GestaoFuncionarios.tsx` na funcao `handleModalSuccess`:
```typescript
const handleModalSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['employees'] });
  queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
};
```

---

## Problema 2: Nao Consegue Excluir Funcionario Douglas

### Diagnostico
O funcionario douglas (betsafeoficial@gmail.com) existe no banco:
- ID: `19c6ca59-5ad7-4e9c-b177-f0c696ad3e92`
- Company: `e50e7445-e38e-450a-8c51-fb5918b2faf3`
- Nao tem registros relacionados em `employee_trainings`

Os logs do console mostram um erro "Refresh Token Not Found" que indica uma sessao expirada, o que pode causar falhas silenciosas na delecao.

### Solucao
1. Verificar se o usuario esta logado corretamente antes de tentar excluir
2. Adicionar melhor tratamento de erro na delecao
3. Garantir que a RLS policy permite DELETE para usuarios da mesma empresa

Verificacao/correcao de RLS para employees:
```sql
-- Verificar policy existente
SELECT * FROM pg_policies WHERE tablename = 'employees';

-- Se necessario, criar policy de DELETE
CREATE POLICY "Users can delete employees from same company" 
ON employees FOR DELETE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));
```

---

## Problema 3: Categorias de Treinamento Nao Aparecem

### Diagnostico
A tabela `training_categories` nao tem registros para a empresa do usuario (`e50e7445-e38e-450a-8c51-fb5918b2faf3`). As categorias existentes pertencem a outras empresas.

O modal de treinamento ja permite criar categorias digitando no campo e clicando "Criar categoria", mas isso nao esta claro para o usuario.

### Solucao
1. Criar categorias padrao para novas empresas via trigger
2. Melhorar a UX do campo de categoria para deixar mais claro que pode criar

**Migracao SQL para criar categorias padrao:**
```sql
-- Criar categorias padrao para a empresa do usuario
INSERT INTO training_categories (name, description, company_id)
SELECT 
  cat.name, 
  'Categoria padrao' as description,
  'e50e7445-e38e-450a-8c51-fb5918b2faf3' as company_id
FROM (VALUES 
  ('Tecnico'),
  ('Gestao'),
  ('Seguranca'),
  ('Compliance'),
  ('Soft Skills')
) AS cat(name)
ON CONFLICT DO NOTHING;
```

**Tambem melhorar o placeholder do campo categoria:**
```tsx
// TrainingProgramModal.tsx - linha 559
{categoriesLoading ? "Carregando..." : field.value || "Digite para criar ou selecione..."}
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/employees.ts` | Invalidar `employees-paginated` e `employee-stats` alem de `employees` |
| `src/pages/GestaoFuncionarios.tsx` | Atualizar `handleModalSuccess` para invalidar queries corretas |
| Migracao SQL | Criar categorias padrao para empresa do usuario |
| `src/components/TrainingProgramModal.tsx` | Melhorar texto do placeholder de categoria |

---

## Resultado Esperado

1. Lista de funcionarios atualiza automaticamente apos criar/editar/excluir
2. Delecao de funcionarios funciona corretamente (apos verificar sessao)
3. Campo de categoria mostra opcoes disponiveis e permite criar novas
