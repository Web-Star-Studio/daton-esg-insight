

# Adicionar 3 abas na página /laia: Metodologia, Unidades, Revisões

## Visão geral

A página `/laia` (`LAIAUnidades.tsx`) atualmente exibe diretamente a galeria de unidades. A mudança consiste em envolver todo o conteúdo atual dentro de um componente `Tabs` com 3 abas, movendo o conteúdo existente para a aba "Unidades".

## Alterações

### `src/pages/LAIAUnidades.tsx`

- Importar `Tabs, TabsContent, TabsList, TabsTrigger` de `@/components/ui/tabs`
- Importar ícones adicionais (`BookOpen`, `RotateCcw` ou similares) para as abas
- Manter o header atual (título + descrição) **fora** das tabs, acima delas
- Adicionar um `<Tabs defaultValue="unidades">` logo após o header
- **Aba "Metodologia"** (`value="metodologia"`): texto placeholder simples em um `Card` — "Conteúdo da metodologia em desenvolvimento."
- **Aba "Unidades"** (`value="unidades"`): todo o conteúdo atual (filtros + grid de cards de unidades) movido para dentro deste `TabsContent`
- **Aba "Revisões"** (`value="revisoes"`): texto placeholder simples em um `Card` — "Conteúdo de revisões em desenvolvimento."

### Estrutura resultante

```text
┌──────────────────────────────────────┐
│ 🍃 LAIA - Aspectos e Impactos       │
│ Selecione uma unidade...             │
├──────────────────────────────────────┤
│ [Metodologia] [Unidades] [Revisões]  │
├──────────────────────────────────────┤
│                                      │
│   (conteúdo da aba selecionada)      │
│                                      │
└──────────────────────────────────────┘
```

### Detalhes técnicos

- Estado controlado com `useState` para a aba ativa (default: `"unidades"`)
- Os botões de filtro e ações da aba "Unidades" ficam dentro do `TabsContent` correspondente, não no header global
- Atualizar o `<Helmet>` title para refletir a aba ativa se desejado, ou manter genérico como "LAIA | Plataforma Daton"
- Nenhuma outra página ou rota precisa ser alterada

