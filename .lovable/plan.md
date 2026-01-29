
# Plano: Unificar Sistema de Fornecedores e Corrigir Selects Vazios

## ✅ STATUS: IMPLEMENTADO

Este plano foi implementado com sucesso.

---

## Diagnostico

O projeto possuía **dois sistemas de fornecedores paralelos** que causavam confusão e erros:

### Sistema 1: Tabela `suppliers` (antigo)
- Usado por: `GestaoFornecedores.tsx`, `SupplierEvaluationModal.tsx`
- Service: `src/services/supplierService.ts`
- Avaliação: `supplier_evaluations` (referencia `suppliers.id`)

### Sistema 2: Tabela `supplier_management` (novo e mais completo)
- Usado por: `SupplierRegistration.tsx`, `SupplierDeliveriesPage.tsx`, `SupplierFailuresPage.tsx`, `SupplierEvaluations.tsx`
- Service: `src/services/supplierManagementService.ts`
- Estrutura mais completa com PF/PJ, status, tipos, etc.

---

## Solução Implementada

Migramos os módulos que ainda usavam o sistema antigo (`supplierService.ts`) para usar o sistema novo (`supplierManagementService.ts`), unificando tudo em `supplier_management`.

### Alterações Realizadas

#### 1. ✅ `GestaoFornecedores.tsx` - Migrado completamente
- Removido uso de `getSuppliers` e `createSupplier` do sistema antigo
- Agora usa `getManagedSuppliers` do `supplierManagementService`
- Botão "Novo Fornecedor" redireciona para `/fornecedores/cadastro`
- Tabela exibe dados do sistema novo (PF/PJ, tipo, etc.)
- Removido modal de cadastro inline (agora usa página dedicada)

#### 2. ✅ `SupplierEvaluationModal.tsx` - Atualizado
- Aceita `ManagedSupplierWithTypeCount[]` ao invés de `Supplier[]`
- Exibe nome correto baseado em `person_type` (PJ = company_name, PF = full_name)
- Adiciona estado vazio com link para cadastro quando não há fornecedores
- Filtra apenas fornecedores ativos para avaliação

#### 3. ✅ `SupplierDeliveriesPage.tsx` - Estado vazio adicionado
- Select de fornecedor mostra mensagem quando lista está vazia
- Link direto para `/fornecedores/cadastro` quando não há fornecedores

#### 4. ✅ `SupplierFailuresPage.tsx` - Estado vazio adicionado
- Select de fornecedor mostra mensagem quando lista está vazia
- Link direto para `/fornecedores/cadastro` quando não há fornecedores

---

## Resultado Final

- ✅ Usuário cadastra fornecedor em `/fornecedores/cadastro`
- ✅ Fornecedor aparece em todos os Selects das telas de fornecimento, falhas e avaliações
- ✅ Não há mais confusão entre os dois sistemas
- ✅ Estados vazios com link para cadastro em todas as telas

---

## Fase 2 (Futura)

A tabela `supplier_evaluations` ainda tem FK para `suppliers.id`. Para suportar completamente o sistema novo, será necessário:

1. Criar tabela `supplier_management_evaluations` referenciando `supplier_management.id`
2. Ou migrar avaliações existentes para novo formato

Esta é uma mudança maior de banco de dados que pode ser feita posteriormente.
