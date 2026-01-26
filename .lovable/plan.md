

## Plano: Suporte a Múltiplos Filtros Simultâneos

### Objetivo

Permitir que o usuário ative múltiplos filtros rápidos ao mesmo tempo (ex: "Com código" **E** "Com críticos"), aplicando-os de forma cumulativa (AND lógico).

---

### Mudanças Técnicas

#### 1. Atualizar Estado e Tipos

**Arquivo:** `src/pages/LAIAUnidades.tsx`

| Localização | De | Para |
|-------------|-----|------|
| Linha 32 | `useState<"criticos" \| "sem_aspectos" \| "com_codigo" \| null>(null)` | `useState<Set<string>>(new Set())` |

**Novo estado:**
```tsx
const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set());
```

---

#### 2. Atualizar Lógica de Filtro

**Arquivo:** `src/pages/LAIAUnidades.tsx` (linhas 80-87)

**De (filtro exclusivo):**
```tsx
if (quickFilter === "criticos") {
  result = result.filter(b => getStatsForBranch(b.id).criticos > 0);
} else if (quickFilter === "sem_aspectos") {
  result = result.filter(b => getStatsForBranch(b.id).total === 0);
} else if (quickFilter === "com_codigo") {
  result = result.filter(b => !!b.code);
}
```

**Para (filtros cumulativos):**
```tsx
if (quickFilters.has("criticos")) {
  result = result.filter(b => getStatsForBranch(b.id).criticos > 0);
}
if (quickFilters.has("sem_aspectos")) {
  result = result.filter(b => getStatsForBranch(b.id).total === 0);
}
if (quickFilters.has("com_codigo")) {
  result = result.filter(b => !!b.code);
}
```

---

#### 3. Atualizar Função de Toggle

**Arquivo:** `src/pages/LAIAUnidades.tsx`

Nova função para adicionar/remover filtros:
```tsx
const toggleQuickFilter = (filter: string) => {
  setQuickFilters(prev => {
    const newSet = new Set(prev);
    if (newSet.has(filter)) {
      newSet.delete(filter);
    } else {
      newSet.add(filter);
    }
    return newSet;
  });
};
```

---

#### 4. Atualizar Verificação de Filtros Ativos

**Arquivo:** `src/pages/LAIAUnidades.tsx` (linhas 109-112)

**De:**
```tsx
const hasActiveFilters = searchTerm !== "" || 
  cityFilter !== "all" || 
  typeFilter !== "all" || 
  quickFilter !== null;
```

**Para:**
```tsx
const hasActiveFilters = searchTerm !== "" || 
  cityFilter !== "all" || 
  typeFilter !== "all" || 
  quickFilters.size > 0;
```

---

#### 5. Atualizar Função de Limpar Filtros

**Arquivo:** `src/pages/LAIAUnidades.tsx` (linha 118)

**De:** `setQuickFilter(null);`
**Para:** `setQuickFilters(new Set());`

---

#### 6. Atualizar Interface do Componente de Filtros

**Arquivo:** `src/components/laia/LAIAUnidadesFilters.tsx`

**Tipos atualizados (linhas 26-27):**
```tsx
onQuickFilter: (filter: string) => void;
activeQuickFilters: Set<string>;
```

---

#### 7. Atualizar Botões de Filtro

**Arquivo:** `src/components/laia/LAIAUnidadesFilters.tsx`

Alterar verificação de estado ativo e onClick:

```tsx
<Button
  variant={activeQuickFilters.has("criticos") ? "default" : "outline"}
  size="sm"
  onClick={() => onQuickFilter("criticos")}
  className={activeQuickFilters.has("criticos") ? "bg-red-600 hover:bg-red-700" : ""}
>
  <AlertCircle className="h-4 w-4 mr-1" />
  Com críticos
</Button>

<Button
  variant={activeQuickFilters.has("sem_aspectos") ? "default" : "outline"}
  size="sm"
  onClick={() => onQuickFilter("sem_aspectos")}
>
  <FileX className="h-4 w-4 mr-1" />
  Sem aspectos
</Button>

<Button
  variant={activeQuickFilters.has("com_codigo") ? "default" : "outline"}
  size="sm"
  onClick={() => onQuickFilter("com_codigo")}
  className={activeQuickFilters.has("com_codigo") ? "bg-blue-600 hover:bg-blue-700" : ""}
>
  <Hash className="h-4 w-4 mr-1" />
  Com código
</Button>
```

---

### Comportamento Esperado

| Cenário | Resultado |
|---------|-----------|
| Usuário clica em "Com código" | Exibe apenas unidades com código |
| Usuário clica em "Com críticos" (mantendo "Com código") | Exibe apenas unidades com código **E** com aspectos críticos |
| Usuário clica em "Sem aspectos" | Adiciona filtro (se compatível, exibiria unidades sem aspectos) |
| Usuário clica em filtro ativo | Remove o filtro da seleção |

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/LAIAUnidades.tsx` | Alterar estado para Set, atualizar lógica de filtros cumulativos |
| `src/components/laia/LAIAUnidadesFilters.tsx` | Atualizar tipos e verificações de estado ativo |

---

### Resultado Visual

Os botões funcionarão como toggles independentes:

```text
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ ⚠ Com críticos│  │ ✕ Sem aspectos│  │ # Com código  │
│   [ATIVO]     │  │               │  │   [ATIVO]     │  ← Múltiplos ativos
└───────────────┘  └───────────────┘  └───────────────┘
```

O contador de resultados refletirá a interseção de todos os filtros ativos.

