
## Correcao: Lista de colaboradores truncada na letra J

### Causa raiz

O Supabase/PostgREST tem um limite padrao de 1.000 linhas por requisicao. Embora o hook use `.range(0, 4999)`, o servidor pode truncar o resultado em 1.000 registros. Com ~1.891 colaboradores ativos ordenados por nome, a lista para na letra J (aproximadamente o registro 1.000).

### Correcao

**Arquivo: `src/hooks/data/useCompanyEmployees.ts`**

Substituir a busca unica por um padrao de busca recursiva em lotes (recursive batching) de 1.000 registros:

```typescript
const BATCH_SIZE = 1000;

const fetchCompanyEmployees = async (companyId: string): Promise<CompanyEmployee[]> => {
  let allData: CompanyEmployee[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, position')
      .eq('company_id', companyId)
      .eq('status', 'Ativo')
      .order('full_name')
      .range(from, from + BATCH_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allData = allData.concat(data as CompanyEmployee[]);

    if (data.length < BATCH_SIZE) break; // ultimo lote
    from += BATCH_SIZE;
  }

  return allData;
};
```

Isso busca todos os ~1.891 registros em 2 requisicoes (0-999 e 1000-1890), garantindo que a lista completa de A a Z apareca no seletor de responsavel.
