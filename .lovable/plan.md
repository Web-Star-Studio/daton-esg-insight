
## Dashboard Demo Interativo para Usuarios Nao Pagantes

### Objetivo

Criar uma pagina `/demo` com uma copia visual completa do dashboard principal, usando dados fictícios (mock) e sem nenhuma chamada ao banco de dados. O usuario podera interagir com a interface (clicar botoes, trocar filtros, navegar no carousel), mas nenhuma acao real sera executada.

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/DemoDashboard.tsx` | Criar - Pagina principal do demo |
| `src/App.tsx` | Modificar - Adicionar rota `/demo` publica |

### Estrutura do DemoDashboard

O componente sera uma copia do `Dashboard.tsx` atual, mas com as seguintes diferencas:

1. **Sem autenticacao**: Rota publica (usando `LazyPageWrapper`, nao `ProtectedLazyPageWrapper`)
2. **Dados mockados**: Todos os valores serao hardcoded (KPIs, atividades recentes, scores ESG, alertas)
3. **Navegacao bloqueada**: Clicks em botoes de acao mostram um toast/modal incentivando o cadastro, em vez de navegar para outras paginas
4. **Banner de demonstracao**: Um banner fixo no topo informando que e uma versao demo, com CTA para criar conta
5. **Layout proprio**: Incluira sidebar e header proprios simplificados (sem depender do MainLayout/AuthContext)

### Dados Mock

```text
KPIs:
- Emissoes CO2: 1.247 tCO2e (-8.3%)
- Conformidade: 94.2% (+2.1%)
- Colaboradores: 342 (+5%)
- Qualidade: 91.7% (+1.8%)
- Economia Energia: 12.5 MWh
- Reducao CO2: -15.3%
- Satisfacao RH: 4.7/5

ESG Score: 78% (E: 82%, S: 74%, G: 79%)

Atividades Recentes: Mesmas 4 atividades estaticas ja existentes no Dashboard

Alertas: 2-3 alertas mockados (licenca vencendo, meta em risco)
```

### Interacoes Permitidas (sem funcionalidade real)

- Trocar periodo no date picker (atualiza visualmente mas mantem dados iguais)
- Navegar no carousel de KPIs (funciona normalmente)
- Clicar em botoes de acao rapida → mostra toast "Crie sua conta para acessar"
- Clicar em "Ver todas" atividades → mesmo toast
- Hover effects e animacoes funcionam normalmente

### Rota

```
/demo → DemoDashboard (publica, sem autenticacao)
```

### Banner Demo

Um banner fixo no topo da pagina com:
- Texto: "Voce esta visualizando uma versao demonstrativa da plataforma Daton"
- Botao CTA: "Criar conta gratuita" → navega para `/auth`
- Estilo: gradiente sutil com borda, nao intrusivo

### Detalhes Tecnicos

- Reutiliza os componentes visuais existentes: `KPICarousel`, `EnhancedCard`, `ESGScoreGauge`, `Progress`, `Badge`
- Nao importa `useAuth`, `useQuery`, nem faz chamadas ao Supabase
- Sidebar simplificada com itens visuais (sem links reais) ou sem sidebar (apenas o conteudo centralizado com header proprio)
- Usa `sonner` (toast) para feedback quando o usuario tenta interagir com funcionalidades bloqueadas
