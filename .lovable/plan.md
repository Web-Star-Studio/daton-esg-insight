
## Plano: Adicionar Filtro "Apenas com Código"

### Objetivo

Adicionar um botão de filtro rápido para exibir apenas filiais que possuem código cadastrado, ajudando a ocultar filiais incompletas ou criadas incorretamente.

---

### Mudanças Técnicas

#### 1. Atualizar Componente de Filtros

**Arquivo:** `src/components/laia/LAIAUnidadesFilters.tsx`

| Localização | Ação |
|-------------|------|
| Interface `LAIAUnidadesFiltersProps` | Expandir tipo de `activeQuickFilter` para incluir `"com_codigo"` |
| Linha ~102-112 | Adicionar novo botão de filtro "Com código" após os existentes |

**Novo botão:**
```tsx
<Button
  variant={activeQuickFilter === "com_codigo" ? "default" : "outline"}
  size="sm"
  onClick={() => onQuickFilter(activeQuickFilter === "com_codigo" ? null : "com_codigo")}
  className={activeQuickFilter === "com_codigo" ? "bg-blue-600 hover:bg-blue-700" : ""}
>
  <Hash className="h-4 w-4 mr-1" />
  Com código
</Button>
```

**Import adicional:** `Hash` de `lucide-react`

---

#### 2. Atualizar Página LAIAUnidades

**Arquivo:** `src/pages/LAIAUnidades.tsx`

| Localização | Ação |
|-------------|------|
| Linha 32 | Expandir tipo do estado `quickFilter` para `"criticos" \| "sem_aspectos" \| "com_codigo" \| null` |
| Linhas 80-85 | Adicionar lógica de filtro para `"com_codigo"` |

**Lógica de filtro adicional:**
```tsx
// Quick filters
if (quickFilter === "criticos") {
  result = result.filter(b => getStatsForBranch(b.id).criticos > 0);
} else if (quickFilter === "sem_aspectos") {
  result = result.filter(b => getStatsForBranch(b.id).total === 0);
} else if (quickFilter === "com_codigo") {
  result = result.filter(b => !!b.code);  // Novo filtro
}
```

---

### Resultado Visual

Os botões de filtro rápido ficarão assim:

```text
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ ⚠ Com críticos│  │ ✕ Sem aspectos│  │ # Com código  │  ← NOVO
└───────────────┘  └───────────────┘  └───────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/laia/LAIAUnidadesFilters.tsx` | Adicionar botão "Com código", atualizar tipos |
| `src/pages/LAIAUnidades.tsx` | Atualizar tipo do estado e lógica de filtro |

---

### Comportamento Esperado

1. Ao clicar em "Com código", apenas filiais com `code` preenchido serão exibidas
2. Filiais sem código (Ex: "Filial ANAPOLIS", "Filial CC") serão ocultadas
3. O contador de resultados será atualizado (ex: "10 de 15 unidades")
4. Clicar novamente desativa o filtro
