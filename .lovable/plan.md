

# Plano: Adicionar Seleção de Principais Causas na Análise de Causa

## Visão Geral

Adicionar um seletor de múltiplos itens para "Principais Causas" na Etapa 3 (Análise de Causa) do fluxo de Não Conformidades. O usuário poderá selecionar uma ou mais causas de uma lista pré-definida baseada na metodologia 8M (expansão do 6M tradicional).

## Design Proposto

O componente será exibido entre a seleção da metodologia e o campo de descrição. Será um seletor compacto usando checkboxes agrupados por categoria:

```
Principais Causas (selecione uma ou mais)

[ ] Mão de Obra (treinamento, erro humano, falta de capacitação, sobrecarga)
[ ] Máquina / Equipamento (falha, manutenção, indisponibilidade, tecnologia inadequada)
[ ] Material / Insumo (qualidade, especificação, fornecedor, lote)
[ ] Método / Processo (procedimento inexistente, não seguido, fluxo incorreto)
[ ] Meio Ambiente (layout, clima, ruído, ergonomia, condições externas)
[ ] Medição / Controle (indicador errado, falta de controle, instrumento não calibrado)
[ ] Sistema / Tecnologia (ERP, integração, parametrização, bug, regra de sistema)
[ ] Gestão / Planejamento (priorização, comunicação, decisão, recursos, cronograma)

Causas selecionadas: 2
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/non-conformity/NCStage3CauseAnalysis.tsx` | Adicionar estado, constantes e UI do multi-select |
| `src/services/nonConformityService.ts` | Adicionar campo `main_causes` no tipo `NCCauseAnalysis` |

## Mudanças Detalhadas

### 1. NCStage3CauseAnalysis.tsx

#### 1.1 Adicionar constante com as categorias de causas (após imports)

```typescript
const MAIN_CAUSE_CATEGORIES = [
  { 
    id: "mao_obra", 
    label: "Mão de Obra", 
    description: "treinamento, erro humano, falta de capacitação, sobrecarga",
    icon: Users
  },
  { 
    id: "maquina", 
    label: "Máquina / Equipamento", 
    description: "falha, manutenção, indisponibilidade, tecnologia inadequada",
    icon: Cog
  },
  { 
    id: "material", 
    label: "Material / Insumo", 
    description: "qualidade, especificação, fornecedor, lote",
    icon: Package
  },
  { 
    id: "metodo", 
    label: "Método / Processo", 
    description: "procedimento inexistente, não seguido, fluxo incorreto",
    icon: Wrench
  },
  { 
    id: "meio_ambiente", 
    label: "Meio Ambiente", 
    description: "layout, clima, ruído, ergonomia, condições externas",
    icon: Leaf
  },
  { 
    id: "medicao", 
    label: "Medição / Controle", 
    description: "indicador errado, falta de controle, instrumento não calibrado",
    icon: Ruler
  },
  { 
    id: "sistema", 
    label: "Sistema / Tecnologia", 
    description: "ERP, integração, parametrização, bug, regra de sistema",
    icon: Monitor
  },
  { 
    id: "gestao", 
    label: "Gestão / Planejamento", 
    description: "priorização, comunicação, decisão, recursos, cronograma",
    icon: Target
  },
];
```

#### 1.2 Adicionar estado para causas selecionadas

```typescript
const [mainCauses, setMainCauses] = useState<string[]>(causeAnalysis?.main_causes || []);
```

#### 1.3 Adicionar função toggle para seleção

```typescript
const toggleMainCause = (causeId: string) => {
  setMainCauses(prev => 
    prev.includes(causeId) 
      ? prev.filter(id => id !== causeId)
      : [...prev, causeId]
  );
};
```

#### 1.4 Adicionar seção UI após "Metodologia de Análise"

```tsx
{/* Main Causes Selection */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label>Principais Causas</Label>
    {mainCauses.length > 0 && (
      <Badge variant="secondary">{mainCauses.length} selecionada(s)</Badge>
    )}
  </div>
  <p className="text-sm text-muted-foreground">
    Selecione uma ou mais categorias de causas identificadas
  </p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {MAIN_CAUSE_CATEGORIES.map((cause) => {
      const Icon = cause.icon;
      const isSelected = mainCauses.includes(cause.id);
      return (
        <div
          key={cause.id}
          onClick={() => toggleMainCause(cause.id)}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
            isSelected 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:bg-muted/50"
          )}
        >
          <Checkbox checked={isSelected} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{cause.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {cause.description}
            </p>
          </div>
        </div>
      );
    })}
  </div>
</div>
```

#### 1.5 Incluir main_causes no handleSave

```typescript
const data = {
  non_conformity_id: ncId,
  analysis_method: analysisMethod as any,
  root_cause: rootCause,
  main_causes: mainCauses,  // ← Adicionar
  ishikawa_data: ishikawaData,
  five_whys_data: fiveWhysData,
  similar_nc_ids: [],
  attachments: [],
};
```

### 2. nonConformityService.ts

#### 2.1 Adicionar campo ao tipo NCCauseAnalysis

```typescript
export interface NCCauseAnalysis {
  id: string;
  non_conformity_id: string;
  company_id: string;
  analysis_method: 'root_cause' | 'ishikawa' | '5_whys' | 'other';
  root_cause?: string;
  main_causes?: string[];  // ← Adicionar
  similar_nc_ids: any;
  attachments: any;
  ishikawa_data: any;
  five_whys_data: any;
  // ...demais campos
}
```

## Armazenamento

O campo `main_causes` será armazenado no campo JSON `ishikawa_data` existente no banco, que já é usado para dados estruturados de causa:

```typescript
ishikawa_data: {
  ...ishikawaData,
  main_causes: mainCauses  // Array de IDs das causas selecionadas
}
```

Alternativa: Se preferir um campo separado no banco, será necessário criar uma migration para adicionar a coluna `main_causes JSONB` na tabela `nc_cause_analysis`.

## Imports Adicionais

```typescript
import { Users, Cog, Package, Wrench, Leaf, Ruler, Monitor, Target } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
```

## Resultado Esperado

| Interação | Resultado |
|-----------|-----------|
| Carregar análise existente | Causas previamente selecionadas aparecem marcadas |
| Clicar em causa | Alterna seleção (adiciona/remove da lista) |
| Salvar rascunho | Causas são persistidas junto com análise |
| Concluir etapa | Causas ficam registradas para relatórios |

## Seção Técnica

### Por que usar ishikawa_data?

O campo `ishikawa_data` é um JSON flexível já existente no banco de dados. Ao invés de criar uma nova coluna, podemos estruturar os dados assim:

```json
{
  "metodo": ["causa 1", "causa 2"],
  "material": [],
  "main_causes": ["mao_obra", "metodo", "gestao"]
}
```

Isso evita a necessidade de uma migration no banco e mantém compatibilidade com dados existentes.

### Sincronização com Ishikawa

As categorias do multi-select são as mesmas do diagrama de Ishikawa (6M/8M). Se o usuário marcar "Mão de Obra" como causa principal e depois usar o diagrama de Ishikawa, poderá detalhar as causas específicas nessa categoria.

