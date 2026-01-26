
## Plano: Corrigir Exibição de Filiais no LAIA

### Diagnóstico

A investigação revelou uma **inconsistência nos dados do banco de dados**:

| Status no Banco | Filiais |
|-----------------|---------|
| `Ativa` | Filiais oficiais (com código e CNPJ) - Ex: MATRIZ, CHUÍ, PE, SC, etc. |
| `Ativo` | Filiais criadas incorretamente (sem código, sem CNPJ) - Ex: Filial ANAPOLIS, Filial CC |
| `Inativa` | Filiais desativadas |

O código atual em `LAIAUnidades.tsx` (linha 45) filtra apenas por `status === 'Ativo'`, excluindo as filiais oficiais que têm `status = 'Ativa'`.

### Solução Proposta

Atualizar o filtro para aceitar **ambas as variações** do status ativo, garantindo que todas as filiais ativas sejam exibidas corretamente.

---

### Mudanças Técnicas

**Arquivo:** `src/pages/LAIAUnidades.tsx`

| Linha | De | Para |
|-------|-----|------|
| 45 | `b.status === 'Ativo'` | `['Ativo', 'Ativa'].includes(b.status)` |

**Código atualizado:**
```tsx
// Antes
const activeBranches = branches?.filter(b => b.status === 'Ativo') || [];

// Depois
const activeBranches = branches?.filter(b => ['Ativo', 'Ativa'].includes(b.status)) || [];
```

---

### Consideração Adicional

Idealmente, o banco de dados deveria ser normalizado para usar um único valor de status (por exemplo, sempre "Ativo" ou sempre "Ativa"). Isso exigiria:

1. Uma migration SQL para atualizar todos os registros existentes
2. Validação no formulário de criação/edição de filiais

No entanto, a solução imediata de aceitar ambos os valores garante que o sistema funcione corretamente com os dados existentes, sem risco de quebrar funcionalidades que dependem do valor atual.

---

### Resultado Esperado

Após a correção, a página `/laia` exibirá as filiais oficiais cadastradas na gestão de filiais:

- **MATRIZ** - CNPJ: 92.644.483/0001-85 (Porto Alegre)
- **CHUÍ** - CNPJ: 92.644.483/0019-04
- **PE** - CNPJ: 92.644.483/0023-90 (Cabo de Santo Agostinho)
- **SC** - CNPJ: 92.644.483/0005-09 (Palhoça)
- E demais filiais com código e CNPJ cadastrados

---

### Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/LAIAUnidades.tsx` | Atualizar filtro de status na linha 45 |
