
## Corrigir listagem de funcionarios no modal de programa de treinamento

### Problema identificado

A query de funcionarios no `TrainingProgramModal.tsx` **nao filtra por empresa** (`company_id`), carregando todos os 1900+ funcionarios de todas as empresas. Alem disso, renderiza todos os itens sem virtualizacao, causando lentidao e a impressao de que alguns funcionarios nao aparecem.

### Solucao

Duas correcoes no arquivo `src/components/TrainingProgramModal.tsx`:

**1. Filtrar por `company_id`**

Adicionar o filtro `.eq('company_id', companyId)` na query de funcionarios, usando o `companyId` que ja esta disponivel no componente (vindo das props ou do contexto da empresa). Isso garante que apenas funcionarios da empresa atual sejam exibidos.

**2. Virtualizar a lista com `react-window`**

Substituir o `.map()` direto por um componente `FixedSizeList` do `react-window` (ja instalado no projeto). Isso renderiza apenas os itens visiveis na tela, eliminando o gargalo de performance com listas grandes.

### Detalhes tecnicos

**Query corrigida:**
```
supabase
  .from("employees")
  .select("id, full_name, employee_code, department, status")
  .eq("company_id", companyId)   // <-- NOVO FILTRO
  .order("full_name")
  .range(0, 4999)
```

**Lista virtualizada:**
- Usar `FixedSizeList` do `react-window` com `itemSize={56}` (altura de cada item)
- Altura do container: 200px (mesmo que o atual)
- Cada item renderizado via `Row` component recebendo `index` e `style`

### Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/components/TrainingProgramModal.tsx` | Adicionar filtro `company_id` + virtualizar lista com `react-window` |
