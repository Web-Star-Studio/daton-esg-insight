
# Plano: Unificar Sistema de Fornecedores e Corrigir Selects Vazios

## Diagnostico

O projeto possui **dois sistemas de fornecedores paralelos** que causam confusao e erros:

### Sistema 1: Tabela `suppliers` (antigo)
- Usado por: `GestaoFornecedores.tsx`, `SupplierEvaluationModal.tsx`
- Service: `src/services/supplierService.ts`
- Avaliacao: `supplier_evaluations` (referencia `suppliers.id`)

### Sistema 2: Tabela `supplier_management` (novo e mais completo)
- Usado por: `SupplierRegistration.tsx`, `SupplierDeliveriesPage.tsx`, `SupplierFailuresPage.tsx`, `SupplierEvaluations.tsx`
- Service: `src/services/supplierManagementService.ts`
- Estrutura mais completa com PF/PJ, status, tipos, etc.

### Problema Identificado

1. **Fornecimentos (`/fornecedores/fornecimento`)**: O Select de fornecedores usa `getManagedSuppliers()` (sistema novo). Se nao houver fornecedores cadastrados no sistema novo, aparece vazio.

2. **Avaliacoes (`/fornecedores/avaliacao`)**: A pagina `SupplierEvaluations.tsx` lista fornecedores do sistema novo, mas o modal `SupplierEvaluationModal.tsx` usa o sistema antigo (`suppliers`).

3. **Falhas (`/fornecedores/falhas`)**: Usa `getActiveSuppliers()` que consulta `supplier_management` corretamente.

4. **A imagem enviada mostra "Programa de Mentoria"** - este e outro modulo, nao relacionado a fornecedores.

### Causa Raiz

O usuario pode ter fornecedores cadastrados apenas no sistema antigo (`suppliers`), nao no novo (`supplier_management`). Ou vice-versa. Quando ele tenta usar as telas novas, nao encontra os fornecedores.

---

## Solucao

Migrar os modulos que ainda usam o sistema antigo (`supplierService.ts`) para usar o sistema novo (`supplierManagementService.ts`), unificando tudo em `supplier_management`.

### Alteracoes Necessarias

#### 1. Atualizar `SupplierEvaluationModal.tsx`

Mudar de usar `suppliers` para usar `supplier_management`:

**Antes:**
```typescript
import { Supplier, createSupplierEvaluation } from "@/services/supplierService";
```

**Depois:**
```typescript
import { ManagedSupplierWithTypeCount } from "@/services/supplierManagementService";
import { createSupplierEvaluation } from "@/services/supplierService";
```

E ajustar o mapeamento de nomes:
```typescript
// Antes: supplier.name
// Depois: supplier.person_type === 'PJ' ? supplier.company_name : supplier.full_name
```

#### 2. Atualizar `GestaoFornecedores.tsx`

Mudar para usar `getManagedSuppliers` ao inves de `getSuppliers`:

**Antes:**
```typescript
import { getSuppliers, createSupplier } from "@/services/supplierService";
const { data: suppliers = [] } = useQuery({
  queryKey: ["suppliers"],
  queryFn: getSuppliers,
});
```

**Depois:**
```typescript
import { getManagedSuppliers, createManagedSupplier } from "@/services/supplierManagementService";
const { data: suppliers = [] } = useQuery({
  queryKey: ["managed-suppliers"],
  queryFn: getManagedSuppliers,
});
```

E redirecionar o botao "Novo Fornecedor" para `/fornecedores/cadastro`.

#### 3. Adicionar Verificacao de Lista Vazia nos Selects

Em `SupplierDeliveriesPage.tsx`, `SupplierFailuresPage.tsx`, adicionar mensagem quando a lista de fornecedores estiver vazia:

```typescript
{suppliers.length === 0 ? (
  <SelectItem value="_empty" disabled>
    Nenhum fornecedor cadastrado
  </SelectItem>
) : (
  suppliers.map(s => (...))
)}
```

#### 4. Adicionar Link para Cadastro

Nos modais, adicionar link "Cadastrar fornecedor" quando a lista estiver vazia:

```typescript
{suppliers.length === 0 && (
  <p className="text-sm text-muted-foreground">
    <Link to="/fornecedores/cadastro">Cadastre um fornecedor</Link> para continuar
  </p>
)}
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/GestaoFornecedores.tsx` | Migrar de `suppliers` para `supplier_management` |
| `src/components/SupplierEvaluationModal.tsx` | Aceitar `ManagedSupplierWithTypeCount` ao inves de `Supplier` |
| `src/pages/SupplierDeliveriesPage.tsx` | Adicionar estado vazio com link para cadastro |
| `src/pages/SupplierFailuresPage.tsx` | Adicionar estado vazio com link para cadastro |

---

## Consideracoes Tecnicas

### Tabela de Avaliacoes

A tabela `supplier_evaluations` tem FK para `suppliers.id`. Para suportar o sistema novo, seria necessario criar uma tabela equivalente referenciando `supplier_management.id` ou migrar avaliacoes existentes. Como isso e uma mudanca maior de banco de dados, sugiro:

1. **Fase 1 (este plano)**: Unificar os Selects e cadastros
2. **Fase 2 (futura)**: Migrar sistema de avaliacoes para `supplier_management`

### Resultado Esperado

- Usuario cadastra fornecedor em `/fornecedores/cadastro`
- Fornecedor aparece em todos os Selects das telas de fornecimento, falhas e avaliacoes
- Nao ha mais confusao entre os dois sistemas
