

## Corrigir carregamento de todos os funcionários no modal de treinamento

### Problema raiz

O Supabase/PostgREST tem um limite máximo de registros por requisição (tipicamente 1000). O `.range(0, 4999)` **não** garante trazer 5000 registros — ele apenas indica o intervalo desejado, mas o servidor pode truncar no seu limite configurado. Com 1891 funcionários ativos na empresa, a query retorna apenas os primeiros ~1000, cortando o restante.

### Solução

Implementar paginação na query, fazendo múltiplas chamadas de 1000 registros até esgotar os dados, e concatenando os resultados.

### Mudanças no arquivo

**`src/components/TrainingProgramModal.tsx`**

Substituir a query única com `.range(0, 4999)` por um loop que busca em lotes de 1000:

```typescript
queryFn: async () => {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, employee_code, department, status")
      .eq("company_id", selectedCompany!.id)
      .order("full_name")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    allData = allData.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const activeStatuses = ['ativo', 'férias', 'ferias', 'licença', 'licenca'];
  return allData.filter(emp =>
    emp.status && activeStatuses.includes(emp.status.toLowerCase())
  );
},
```

Isso garante que **todos** os registros sejam buscados independentemente do limite do PostgREST.

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| `src/components/TrainingProgramModal.tsx` | Substituir query única por loop paginado de 1000 em 1000 |
