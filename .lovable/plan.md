

# Plano: Referenciar ISO e Itens no Registro de Não Conformidade

## Visão Geral

Adicionar ao formulário de registro de NC a capacidade de:
1. Selecionar uma ou mais normas ISO (ISO 9001, ISO 14001, ISO 45001, ISO 39001)
2. Ver e selecionar os itens/cláusulas específicas da norma selecionada
3. Usar IA para buscar a norma e seus itens baseado em texto descritivo

## Design Proposto

O formulário terá uma nova seção "Referência ISO" entre "Setor" e "Severidade":

```
┌─────────────────────────────────────────────────────────────────┐
│ Referência ISO (opcional)                                       │
│                                                                 │
│ ┌─────────────────────────────────────┐  ┌──────────────────┐  │
│ │ Selecione a norma ISO...        ▼   │  │ 🤖 Buscar com IA │  │
│ └─────────────────────────────────────┘  └──────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Pesquisar cláusulas...                                🔍  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Cláusulas disponíveis:                                          │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [ ] 4.1 - Entendendo a organização e seu contexto        │  │
│ │ [✓] 4.2 - Necessidades e expectativas de partes...       │  │
│ │ [ ] 4.3 - Escopo do sistema de gestão da qualidade       │  │
│ │ [✓] 5.1 - Liderança e comprometimento                    │  │
│ │ ...                                                       │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Selecionadas: 2 cláusula(s)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Busca com IA

O botão "Buscar com IA" abrirá um modal:
```
┌────────────────────────────────────────────────────────────────┐
│ 🤖 Buscar Referência ISO com IA                            X  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Descreva o problema ou contexto da não conformidade:          │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Exemplo: "Falta de treinamento documentado para         │  │
│ │ operadores de empilhadeira"                             │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│                               [ Cancelar ]  [ Buscar ]         │
├────────────────────────────────────────────────────────────────┤
│ Resultado:                                                     │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ 📋 ISO 9001:2015                                        │  │
│ │   ├ 7.2 - Competência (confiança: 95%)                  │  │
│ │   └ 7.3 - Conscientização (confiança: 82%)              │  │
│ │                                                          │  │
│ │ 📋 ISO 45001:2018                                       │  │
│ │   └ 7.2 - Competência (confiança: 88%)                  │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│                                     [ Aplicar Sugestões ]      │
└────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/non-conformity/ISOReferencesSelector.tsx` | Criar | Componente de seleção de ISO e cláusulas |
| `src/components/non-conformity/ISOAISearchModal.tsx` | Criar | Modal de busca com IA |
| `src/pages/NaoConformidades.tsx` | Modificar | Adicionar seção de referência ISO no formulário |
| `supabase/functions/nc-iso-suggestions/index.ts` | Criar | Edge function para busca com IA |

## Mudanças Detalhadas

### 1. ISOReferencesSelector.tsx (Novo)

Componente que encapsula a seleção de norma e cláusulas:

```tsx
interface ISOReferencesSelectorProps {
  selectedStandard: string | null;
  selectedClauses: string[];
  onStandardChange: (standard: string | null) => void;
  onClausesChange: (clauses: string[]) => void;
  disabled?: boolean;
}
```

Funcionalidades:
- Select para escolher a norma (ISO 9001, 14001, 45001, 39001)
- Campo de busca para filtrar cláusulas
- Lista de checkboxes com as cláusulas da norma selecionada
- Contador de cláusulas selecionadas
- Botão "Buscar com IA" que abre o modal

### 2. ISOAISearchModal.tsx (Novo)

Modal para busca inteligente:
- Input para descrever o problema
- Botão para executar busca via Edge Function
- Lista de resultados agrupados por norma
- Cada item mostra cláusula + título + confiança
- Botão "Aplicar" que seleciona automaticamente as cláusulas sugeridas

### 3. Edge Function: nc-iso-suggestions

Prompt para o Gemini:
```typescript
const systemPrompt = `Você é um especialista em normas ISO de sistemas de gestão.
Analise a descrição da não conformidade e identifique as cláusulas ISO mais relevantes.

Normas disponíveis:
- ISO 9001:2015 - Gestão da Qualidade
- ISO 14001:2015 - Gestão Ambiental  
- ISO 45001:2018 - Saúde e Segurança Ocupacional
- ISO 39001:2012 - Segurança Viária

Retorne um JSON com as cláusulas mais relevantes e um score de confiança (0-100).`;
```

Request body:
```json
{
  "description": "Falta de treinamento documentado...",
  "context": "Título da NC, categoria, setor"
}
```

Response:
```json
{
  "suggestions": [
    { "standard": "ISO_9001", "clause_number": "7.2", "confidence": 95 },
    { "standard": "ISO_9001", "clause_number": "7.3", "confidence": 82 },
    { "standard": "ISO_45001", "clause_number": "7.2", "confidence": 88 }
  ]
}
```

### 4. Modificações em NaoConformidades.tsx

**4.1 Atualizar estado do formulário:**
```typescript
const [newNCData, setNewNCData] = useState({
  // ... campos existentes ...
  iso_standard: null as string | null,
  iso_clauses: [] as string[]
});
```

**4.2 Adicionar seção no formulário (após Setor, antes de Severidade):**
```tsx
<ISOReferencesSelector
  selectedStandard={newNCData.iso_standard}
  selectedClauses={newNCData.iso_clauses}
  onStandardChange={(s) => setNewNCData({...newNCData, iso_standard: s})}
  onClausesChange={(c) => setNewNCData({...newNCData, iso_clauses: c})}
  disabled={createNCMutation.isPending}
/>
```

**4.3 Incluir referências ISO no insert:**
Os dados serão salvos no campo `attachments` (JSONB) existente até criar uma tabela específica:
```typescript
attachments: {
  iso_references: {
    standard: newNCData.iso_standard,
    clauses: newNCData.iso_clauses
  }
}
```

## Fluxo de Uso

### Cenário 1: Seleção Manual
1. Usuário seleciona "ISO 9001:2015" no dropdown
2. Lista de cláusulas carrega automaticamente
3. Usuário digita "liderança" no campo de busca
4. Lista filtra para mostrar apenas cláusulas relacionadas
5. Usuário marca as cláusulas relevantes
6. Contador atualiza: "2 cláusula(s) selecionada(s)"

### Cenário 2: Busca com IA
1. Usuário clica em "🤖 Buscar com IA"
2. Modal abre
3. Usuário descreve: "Fornecedor entregou material fora da especificação técnica"
4. Clica em "Buscar"
5. IA retorna sugestões:
   - ISO 9001 → 8.4 (Controle de produtos adquiridos) - 92%
   - ISO 9001 → 8.6 (Liberação de produtos) - 78%
6. Usuário clica em "Aplicar Sugestões"
7. Modal fecha
8. Norma e cláusulas são preenchidas automaticamente

## Dados Disponíveis

O banco já possui a tabela `iso_requirements` com:
- 10 cláusulas ISO 9001
- 10 cláusulas ISO 14001
- 10 cláusulas ISO 45001
- 8 cláusulas ISO 39001

Cada cláusula contém: `clause_number`, `clause_title`, `description`, `guidance_notes`, `evidence_examples`.

## Considerações Técnicas

### Hook Existente
Reutilizar `useISORequirements` que já carrega os requisitos por norma.

### Constante de Normas
Já existe em `ISORequirementsLibrary.tsx`:
```typescript
const STANDARDS = [
  { id: 'ISO_9001', label: 'ISO 9001:2015', description: 'Sistema de Gestão da Qualidade', color: 'bg-blue-500' },
  { id: 'ISO_14001', label: 'ISO 14001:2015', description: 'Sistema de Gestão Ambiental', color: 'bg-green-500' },
  { id: 'ISO_45001', label: 'ISO 45001:2018', description: 'Saúde e Segurança Ocupacional', color: 'bg-orange-500' },
  { id: 'ISO_39001', label: 'ISO 39001:2012', description: 'Segurança Viária', color: 'bg-purple-500' },
];
```

### Edge Function
- Usar modelo `google/gemini-3-flash-preview` via Lovable AI Gateway
- Usar `LOVABLE_API_KEY` (já disponível como secret)
- Retornar JSON estruturado com sugestões

### Armazenamento
Usar campo `attachments` (JSONB) para armazenar referências ISO inicialmente:
```json
{
  "iso_references": {
    "standard": "ISO_9001",
    "clauses": ["4.2", "7.2", "8.4"]
  }
}
```

Futuramente, pode-se criar uma tabela `nc_iso_references` para melhor consulta.

