
# Plano: Corrigir Duplicacao de Layout na Pagina NC Tarefas

## Diagnostico

### Problema 1: Duplicacao de Layout em NC Tarefas

A pagina `/nc-tarefas` esta duplicando o layout completo da aplicacao (sidebar, header, breadcrumbs) porque:

1. O **ProtectedRoute** (usado via `ProtectedLazyPageWrapper`) ja envolve o conteudo com `<MainLayout>`
2. A propria pagina **NCTarefas.tsx** tambem usa `<MainLayout>` diretamente

**Resultado**: Dois layouts aninhados aparecem na tela (como mostrado na screenshot).

### Problema 2: Criacao de Registro NC

A criacao de NC parece estar funcional baseado no codigo analisado. Se houver erro especifico, precisaremos de mais detalhes do usuario.

---

## Solucao

### Alteracao no arquivo: `src/pages/NCTarefas.tsx`

Remover o wrapper `<MainLayout>` que esta duplicado, mantendo apenas o conteudo interno.

**Antes (linhas 201-367):**
```typescript
return (
  <MainLayout>
    <div className="space-y-6">
      ...
    </div>
  </MainLayout>
);
```

**Depois:**
```typescript
return (
  <div className="space-y-6">
    ...
  </div>
);
```

Tambem sera necessario remover o import do MainLayout:

**Remover da linha 3:**
```typescript
import { MainLayout } from "@/components/MainLayout";
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Layout duplicado (2x sidebar, 2x header) | Layout unico, interface limpa |
| Scrollbars duplicadas | Scroll normal |
| Espaco desperdicado | Conteudo ocupa area correta |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/NCTarefas.tsx` | Remover import e uso do `<MainLayout>` |

---

## Observacao sobre Criacao de NC

O codigo de criacao de NC em `NaoConformidades.tsx` esta implementado corretamente. Se houver um problema especifico com a criacao, por favor descreva:
- Qual mensagem de erro aparece?
- O formulario abre corretamente?
- Os campos estao sendo preenchidos?

