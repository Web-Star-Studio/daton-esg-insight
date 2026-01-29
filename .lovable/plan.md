

# Plano: Resolver Dependencia de Tipos para Criar Fornecedores

## Diagnostico

O sistema de fornecedores possui uma **hierarquia obrigatoria**:

```
Categoria -> Tipo -> Fornecedor
```

Atualmente, para cadastrar um fornecedor em `/fornecedores/cadastro`, e obrigatorio selecionar pelo menos um **Tipo de Fornecedor**. Se a empresa nao tem tipos cadastrados, o dropdown fica vazio e o fornecedor nao pode ser criado.

**Consequencia cascata**: Sem fornecedores, as telas de Conexoes, Fornecimentos, Avaliacoes e Falhas ficam inutilizaveis (dropdowns vazios).

---

## Solucao

Duas abordagens serao implementadas:

### Abordagem 1: Tornar a selecao de tipo **opcional** na criacao

Modificar a validacao para permitir criar fornecedores sem tipos associados. O fornecedor ficara com status "Pendente" (coluna Vinculacao) e podera ser vinculado posteriormente.

### Abordagem 2: Adicionar **orientacao ao usuario**

Quando nao houver tipos cadastrados, mostrar um aviso com link direto para cadastrar tipos/categorias.

---

## Alteracoes

### Arquivo: `src/pages/SupplierRegistration.tsx`

**Mudanca 1**: Remover validacao obrigatoria de tipos (linha ~322-326)

Antes:
```typescript
if (selectedTypes.length === 0 && !editingSupplier) {
  toast.error("Selecione pelo menos um tipo de fornecedor");
  return;
}
```

Depois:
```typescript
// Tipo de fornecedor agora e opcional
// O fornecedor ficara como "Pendente" na coluna Vinculacao
```

**Mudanca 2**: Adicionar aviso quando nao ha tipos disponveis (nova secao no formulario)

Adicionar um alerta informativo na secao de selecao de tipos:

```typescript
{typesGrouped.length === 0 && (
  <Alert className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Nenhum tipo cadastrado</AlertTitle>
    <AlertDescription>
      Para vincular fornecedores a tipos, primeiro cadastre 
      <Link to="/fornecedores/categorias" className="underline ml-1">categorias</Link> e 
      <Link to="/fornecedores/tipos" className="underline ml-1">tipos de fornecedor</Link>.
      Voce pode criar o fornecedor agora e vincular depois.
    </AlertDescription>
  </Alert>
)}
```

**Mudanca 3**: Ajustar texto do botao de confirmacao

Quando nao houver tipos selecionados, mudar o texto do botao:
- "Cadastrar" -> "Cadastrar sem Vinculacao"

---

## Fluxo Apos Correcao

1. Usuario abre `/fornecedores/cadastro`
2. Se nao ha tipos, ve aviso explicativo com links
3. Pode criar fornecedor mesmo sem vincular tipos
4. Fornecedor aparece com "Pendente" na coluna Vinculacao
5. Pode editar depois para vincular tipos

---

## Resultado Esperado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Sem tipos cadastrados | Nao consegue criar fornecedor | Cria e vincula depois |
| Com tipos cadastrados | Obrigatorio selecionar | Opcional, mas recomendado |
| Conexoes/Fornecimentos | Dropdowns vazios | Dropdowns mostram fornecedores |

---

## Resumo das Alteracoes

| Arquivo | Linha | Alteracao |
|---------|-------|-----------|
| `src/pages/SupplierRegistration.tsx` | ~322-326 | Remover validacao obrigatoria de tipos |
| `src/pages/SupplierRegistration.tsx` | Secao tipos | Adicionar Alert informativo com links |
| `src/pages/SupplierRegistration.tsx` | Botao submit | Texto dinamico baseado em tipos selecionados |

