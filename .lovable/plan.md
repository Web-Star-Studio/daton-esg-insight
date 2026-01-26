

## Plano: Ajustar Exibição de Filiais no LAIA

### Contexto

A página LAIA (`/laia`) já utiliza o hook `useBranches()` para listar as filiais, garantindo que exibe as mesmas unidades cadastradas na Gestão de Filiais. No entanto, a exibição atual prioriza o **nome** da filial como identificador principal, quando deveria priorizar o **código** e o **CNPJ**.

---

### Mudanças Propostas

#### 1. Reorganizar Card de Filial

**Arquivo:** `src/pages/LAIAUnidades.tsx`

**De (atual - linhas 206-221):**
```tsx
<div className="flex items-center gap-2">
  <Building2 className="h-5 w-5" />
  <CardTitle className="text-lg">{branch.name}</CardTitle>
</div>
{branch.is_headquarters && <Badge>Matriz</Badge>}
{(branch.city || branch.state) && (
  <div className="flex items-center gap-1 text-sm text-muted-foreground">
    <MapPin className="h-3 w-3" />
    {[branch.city, branch.state].filter(Boolean).join(", ")}
  </div>
)}
```

**Para (nova estrutura):**
```tsx
<div className="flex items-start justify-between">
  <div className="space-y-1">
    {/* Identificador Principal: Código */}
    <div className="flex items-center gap-2">
      <Building2 className="h-5 w-5 text-primary" />
      <CardTitle className="text-lg">
        {branch.code || "Sem código"}
      </CardTitle>
      {branch.is_headquarters && <Badge variant="secondary">Matriz</Badge>}
    </div>
    
    {/* CNPJ (formatado) */}
    {branch.cnpj && (
      <p className="text-sm font-medium text-muted-foreground">
        CNPJ: {formatCNPJ(branch.cnpj)}
      </p>
    )}
    
    {/* Nome (secundário) */}
    <p className="text-sm text-muted-foreground">
      {branch.name}
    </p>
    
    {/* Localização */}
    {(branch.city || branch.state) && (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {[branch.city, branch.state].filter(Boolean).join(", ")}
      </div>
    )}
  </div>
</div>
```

#### 2. Atualizar Busca para Incluir Código e CNPJ

**Arquivo:** `src/pages/LAIAUnidades.tsx` (linhas 56-62)

Atualizar o filtro de busca para também pesquisar por código e CNPJ:

```tsx
if (searchTerm) {
  const term = searchTerm.toLowerCase();
  result = result.filter(b => 
    b.name.toLowerCase().includes(term) ||
    b.code?.toLowerCase().includes(term) ||
    b.cnpj?.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
    b.city?.toLowerCase().includes(term)
  );
}
```

#### 3. Importar Função de Formatação

Adicionar import da função `formatCNPJ`:

```tsx
import { formatCNPJ } from "@/utils/formValidation";
```

---

### Resultado Visual Esperado

**Antes:**
```text
┌────────────────────────────────┐
│ 🏢 TRANSPORTES GABARDO LTDA   │  ← Nome principal
│ 📍 Porto Alegre, RS           │
│ ─────────────────────────────── │
│ Total: 15  │  Críticos: 2     │
└────────────────────────────────┘
```

**Depois:**
```text
┌────────────────────────────────┐
│ 🏢 MATRIZ          [Matriz]   │  ← Código principal
│ CNPJ: 92.644.483/0001-85      │  ← CNPJ em destaque
│ TRANSPORTES GABARDO LTDA      │  ← Nome secundário
│ 📍 Porto Alegre, RS           │
│ ─────────────────────────────── │
│ Total: 15  │  Críticos: 2     │
└────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/LAIAUnidades.tsx` | Reorganizar exibição do card, adicionar import de `formatCNPJ`, atualizar busca |

---

### Tratamento de Dados Incompletos

Para filiais que não possuem código ou CNPJ cadastrado:
- **Sem código:** Exibir "Sem código" em texto esmaecido
- **Sem CNPJ:** Ocultar linha do CNPJ
- O nome sempre será exibido como fallback

