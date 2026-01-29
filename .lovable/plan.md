
# Plano: Corrigir Erro ao Salvar Pesquisa de Fornecedores

## Diagnóstico

O usuário reportou que ao criar uma pesquisa em `/fornecedores/pesquisas`, aparece "erro ao salvar". Analisando o código, identifiquei o problema:

### Problema Principal: SelectItem com value=""

O componente `Select` do Radix UI **não suporta valores vazios** (`value=""`). Quando se usa `value=""`, o componente apresenta comportamento inconsistente e pode falhar silenciosamente.

No arquivo `SupplierSurveysManagementPage.tsx`:

```typescript
// Linha 295 - PROBLEMA
<SelectItem value="">Nenhum</SelectItem>

// Linha 310 - PROBLEMA
<SelectItem value="">Todas</SelectItem>
```

Quando o usuário seleciona "Nenhum" ou "Todas", o valor `""` é armazenado no estado. Depois, na função `handleSave`, o código faz:

```typescript
custom_form_id: formData.custom_form_id || null,
category_id: formData.category_id || null,
```

A conversão de `""` para `null` funciona em JavaScript, mas o problema ocorre **antes** disso - o Select pode não estar funcionando corretamente com `value=""`, causando estados inconsistentes ou erros de renderização que impedem o submit.

### Verificação

- A tabela `supplier_surveys` existe e tem registros anteriores funcionando
- A RLS policy está configurada corretamente
- O schema mostra que `category_id` e `custom_form_id` são nullable (opcionais)
- O problema está no componente Select, não no banco

---

## Solução

Substituir os valores vazios (`""`) por valores sentinela claros (como `"none"` e `"all"`) que o Radix UI Select consegue manipular corretamente.

---

## Alterações

### Arquivo: `src/pages/SupplierSurveysManagementPage.tsx`

**Mudança 1**: Atualizar o SelectItem de "Nenhum" (linha 295)

Antes:
```typescript
<SelectItem value="">Nenhum</SelectItem>
```

Depois:
```typescript
<SelectItem value="none">Nenhum</SelectItem>
```

**Mudança 2**: Atualizar o SelectItem de "Todas" (linha 310)

Antes:
```typescript
<SelectItem value="">Todas</SelectItem>
```

Depois:
```typescript
<SelectItem value="all">Todas</SelectItem>
```

**Mudança 3**: Atualizar a função handleSave para converter os valores sentinela

Antes (linhas 117-118):
```typescript
custom_form_id: formData.custom_form_id || null,
category_id: formData.category_id || null,
```

Depois:
```typescript
custom_form_id: formData.custom_form_id === 'none' ? null : (formData.custom_form_id || null),
category_id: formData.category_id === 'all' ? null : (formData.category_id || null),
```

**Mudança 4**: Melhorar log de erro para facilitar debug futuro

Antes (linha 138-139):
```typescript
console.error('Error saving:', error);
toast({ title: 'Erro', description: 'Erro ao salvar', variant: 'destructive' });
```

Depois:
```typescript
console.error('Error saving survey:', error);
const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
toast({ 
  title: 'Erro ao salvar', 
  description: errorMessage, 
  variant: 'destructive' 
});
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Criar pesquisa com "Nenhum" formulário | Erro silencioso | Salva corretamente |
| Criar pesquisa com "Todas" categorias | Erro silencioso | Salva corretamente |
| Erro de banco de dados | Mensagem genérica | Mensagem detalhada |

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/SupplierSurveysManagementPage.tsx` | Substituir `value=""` por valores sentinela (`none`, `all`) |
| `src/pages/SupplierSurveysManagementPage.tsx` | Converter valores sentinela para null no handleSave |
| `src/pages/SupplierSurveysManagementPage.tsx` | Melhorar mensagem de erro com detalhes |
