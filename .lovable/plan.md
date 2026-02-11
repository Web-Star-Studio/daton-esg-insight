

## Atualizar sidebar e conteúdo do Demo Dashboard para refletir os módulos ativos

### Problema

A versão demo (`/demo`) possui uma sidebar simplificada e estática com itens genéricos (Ambiental, Social, Governança, Relatórios, Documentos, Configurações, Ajuda) que não correspondem aos módulos realmente ativos na plataforma para clientes normais.

Os módulos ativos atualmente (conforme `enabledModules.ts`) são:
- **ESG** (com subcategorias Ambiental e Social ativas; Governança desabilitada)
- **Qualidade (SGQ)**
- **Fornecedores**
- **Configurações**
- **Ajuda**

### Solução

Atualizar o `SIDEBAR_ITEMS` do `DemoDashboard.tsx` para refletir exatamente os mesmos módulos/seções visíveis na sidebar real (`AppSidebar.tsx`), respeitando o `enabledModules.ts`.

### Mudanças no arquivo

**`src/pages/DemoDashboard.tsx`**

1. Atualizar `SIDEBAR_ITEMS` para corresponder às seções ativas da sidebar real:

```typescript
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Leaf, label: 'ESG' },
  { icon: Award, label: 'Qualidade' },
  { icon: Truck, label: 'Fornecedores' },
  { icon: Settings, label: 'Configurações' },
  { icon: HelpCircle, label: 'Ajuda' },
];
```

2. Adicionar os imports necessários (`Truck`, `Award` ja existem; `Settings` e `HelpCircle` ja estao importados via lucide-react).

3. Atualizar os `MOCK_KPI_CARDS` para incluir KPIs relevantes aos módulos ativos (ex: adicionar indicador de Fornecedores, manter Qualidade).

4. Atualizar as `QUICK_ACTIONS` para refletir ações dos módulos ativos:
   - Manter: Registrar Emissão (ESG Ambiental), Gerar Relatório
   - Adicionar: Avaliar Fornecedor (Fornecedores), Registrar Não Conformidade (Qualidade)
   - Remover: Nova Auditoria (Governança desabilitada)

5. Atualizar `RECENT_ACTIVITIES` para incluir atividades dos módulos ativos (SGQ, Fornecedores, Social).

### Resumo de impacto

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DemoDashboard.tsx` | Atualizar SIDEBAR_ITEMS, QUICK_ACTIONS, MOCK_KPI_CARDS e RECENT_ACTIVITIES para espelhar módulos ativos |

