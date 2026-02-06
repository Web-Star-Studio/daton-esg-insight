
# Plano: Adicionar Filtros de Status na Lista de Não Conformidades

## Visão Geral

Adicionar botões de filtro por status acima da tabela de Não Conformidades, permitindo filtrar rapidamente por: Todas, Aberta, Em Tratamento e Encerrada.

## Design Proposto

Os filtros serão apresentados como um grupo de botões (toggle buttons) horizontais, similar ao padrão já usado em outras partes do sistema:

```
[ Todas (5) ] [ Aberta (3) ] [ Em Tratamento (1) ] [ Encerrada (1) ]
```

- O botão ativo terá estilo destacado (variant="default")
- Os demais terão estilo outline (variant="outline")
- Cada botão mostrará a contagem de NCs naquele status

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/NaoConformidades.tsx` | Adicionar estado de filtro, botões e lógica de filtragem |

## Mudanças Detalhadas

### 1. Adicionar estado de filtro (linha ~59)

```typescript
const [statusFilter, setStatusFilter] = useState<string>("all");
```

### 2. Calcular contagens por status (após linha 332)

```typescript
const statusCounts = {
  all: totalNCs,
  aberta: nonConformities?.filter(nc => isNCOpen(nc.status)).length || 0,
  em_tratamento: nonConformities?.filter(nc => isNCInProgress(nc.status)).length || 0,
  encerrada: nonConformities?.filter(nc => isNCClosed(nc.status)).length || 0,
};
```

### 3. Filtrar lista baseado no status selecionado

```typescript
const filteredNCs = nonConformities?.filter(nc => {
  if (statusFilter === "all") return true;
  if (statusFilter === "aberta") return isNCOpen(nc.status);
  if (statusFilter === "em_tratamento") return isNCInProgress(nc.status);
  if (statusFilter === "encerrada") return isNCClosed(nc.status);
  return true;
});
```

### 4. Adicionar botões de filtro na UI (após linha 559)

Inserir entre CardDescription e a tabela:

```tsx
<div className="flex flex-wrap gap-2 mt-4">
  <Button
    variant={statusFilter === "all" ? "default" : "outline"}
    size="sm"
    onClick={() => setStatusFilter("all")}
  >
    Todas ({statusCounts.all})
  </Button>
  <Button
    variant={statusFilter === "aberta" ? "default" : "outline"}
    size="sm"
    onClick={() => setStatusFilter("aberta")}
    className={statusFilter === "aberta" ? "" : "border-red-200 text-red-700 hover:bg-red-50"}
  >
    <AlertCircle className="h-4 w-4 mr-1" />
    Aberta ({statusCounts.aberta})
  </Button>
  <Button
    variant={statusFilter === "em_tratamento" ? "default" : "outline"}
    size="sm"
    onClick={() => setStatusFilter("em_tratamento")}
    className={statusFilter === "em_tratamento" ? "" : "border-yellow-200 text-yellow-700 hover:bg-yellow-50"}
  >
    <Clock className="h-4 w-4 mr-1" />
    Em Tratamento ({statusCounts.em_tratamento})
  </Button>
  <Button
    variant={statusFilter === "encerrada" ? "default" : "outline"}
    size="sm"
    onClick={() => setStatusFilter("encerrada")}
    className={statusFilter === "encerrada" ? "" : "border-green-200 text-green-700 hover:bg-green-50"}
  >
    <CheckCircle className="h-4 w-4 mr-1" />
    Encerrada ({statusCounts.encerrada})
  </Button>
</div>
```

### 5. Usar lista filtrada na tabela

Substituir `{nonConformities.map((nc) => (` por `{filteredNCs?.map((nc) => (`

### 6. Adicionar import da função isNCInProgress

```typescript
import { getNCStatusLabel, getNCStatusColor, isNCOpen, isNCClosed, isNCInProgress } from "@/utils/ncStatusUtils";
```

## Seção Técnica

### Funções de Filtro Utilizadas

O arquivo `ncStatusUtils.ts` já possui as funções necessárias:
- `isNCOpen(status)` - Retorna true para "Aberta" ou "Pendente"
- `isNCInProgress(status)` - Retorna true para "Em Tratamento"
- `isNCClosed(status)` - Retorna true para "Encerrada" ou "Cancelada"

### Correção Adicional: Data com Timezone

Aproveitando a edição, corrigir a data na linha 602 que usa o padrão problemático:

```typescript
// Antes:
{format(new Date(nc.detected_date), "dd/MM/yyyy", { locale: ptBR })}

// Depois:
{formatDateDisplay(nc.detected_date)}
```

## Resultado Esperado

| Interação | Resultado |
|-----------|-----------|
| Página carrega | Mostra "Todas" selecionado |
| Clicar "Aberta" | Filtra apenas NCs abertas/pendentes |
| Clicar "Em Tratamento" | Filtra NCs em andamento |
| Clicar "Encerrada" | Filtra NCs encerradas/canceladas |
| Clicar "Todas" | Remove filtro |
