// Helper de paginação para queries Supabase.
//
// Postgrest aplica um limite default de 1000 rows por response em `.select()`
// quando não há `.range()` ou `.limit()` explícito. Em companies grandes isso
// truncava silenciosamente listagens, KPIs e maps de reconciliação — sintomas
// como "card de total mostra 1000" ou "import cria duplicatas em vez de casar".
//
// Este helper recebe um builder do tipo `(from, to) => query` e itera páginas
// até o servidor devolver menos rows que o tamanho de página, retornando o
// agregado completo. Use sempre que esperar potencialmente >1000 linhas.
//
// Exemplo:
//   const all = await fetchAllPaginated<MyRow>((from, to) =>
//     supabase
//       .from('legislations')
//       .select('id, title')
//       .eq('company_id', companyId)
//       .range(from, to)
//   );

import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type PageBuilder<T> = (from: number, to: number) => PromiseLike<PostgrestSingleResponse<T[]>>;

const DEFAULT_PAGE_SIZE = 1000;

export async function fetchAllPaginated<T>(
  builder: PageBuilder<T>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await builder(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
