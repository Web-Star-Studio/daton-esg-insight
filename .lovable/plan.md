
## Correcao: Tours Interativos nao funcionam em /demo

### Problema
O `DemoLayout` possui o `UnifiedTourProvider` (contexto), mas **nao inclui o componente `<UnifiedTourSystem />`** que e responsavel por renderizar a interface visual do tour (overlay, tooltip, controles). Por isso, ao clicar em um tour no dropdown, o estado interno e atualizado, mas nada aparece na tela.

O `MainLayout` (usado nas rotas de producao) inclui esse componente corretamente -- basta replicar no `DemoLayout`.

### Correcao

**Arquivo: `src/components/DemoLayout.tsx`**
- Importar `UnifiedTourSystem` de `@/components/tutorial/unified/UnifiedTourSystem`
- Adicionar `<UnifiedTourSystem />` dentro do `UnifiedTourProvider`, apos o conteudo principal (antes do fechamento do `SidebarProvider`)

Isso e uma alteracao de 2 linhas (1 import + 1 componente).
