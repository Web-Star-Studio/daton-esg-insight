
# Mover seções "Infraestrutura" e "Performance" para /ambiental

## Objetivo
Mover as seções **"Infraestrutura de classe mundial."** (grid de 4 cards: IA, Arquitetura, Seguranca, Integracoes) e **"Performance"** (metricas LCP, IA Response, Uptime, Dados) da pagina `/tecnologia` para a pagina `/ambiental`, posicionando-as logo abaixo dos cards animados (scroll-stack cards).

## O que muda

### 1. `/ambiental` (ESGAmbiental.tsx)
- Adicionar os dados dos 4 modulos de infraestrutura (IA, Arquitetura, Seguranca, Integracoes) e do modulo Performance com suas metricas
- Adicionar os componentes `FeatureCard` e `PerformanceSection` (adaptados do Technology.tsx)
- Inserir as duas novas secoes entre o `</main>` dos cards animados e o `<PublicFooter />`

### 2. `/tecnologia` (Technology.tsx)
- Remover a secao "Infraestrutura de classe mundial." (header + grid de FeatureCards)
- Remover a secao "Performance" (PerformanceSection)
- Remover os dados MODULES, o componente FeatureCard e PerformanceSection que ficam orfaos
- Manter apenas o Hero, a secao "Nossas Solucoes" (SolutionDetailSection) e o Footer

## Detalhes tecnicos

**Dados a copiar para ESGAmbiental.tsx:**
- Array `MODULES` com os 5 itens (4 feature + 1 performance) e a interface `ModuleHighlight` (versao do Technology.tsx que inclui `metrics`)
- Renomear para evitar conflito com o `MODULES` ja existente (ex: `INFRA_MODULES`)

**Componentes a copiar para ESGAmbiental.tsx:**
- `FeatureCard` -- card de grid com index, titulo, descricao e lista de features
- `PerformanceSection` -- layout 2 colunas com metricas

**Estrutura final de ESGAmbiental.tsx:**
```
Hero
Cards animados (scroll-stack) -- ja existente
Secao "Infraestrutura de classe mundial." (header + grid 2x2)
Secao "Performance" (metricas)
Footer
```

**Estrutura final de Technology.tsx:**
```
Hero
Secao "Nossas Solucoes" (SolutionDetailSection)
Footer
```

**Imports adicionais em ESGAmbiental.tsx:**
- `Server`, `ShieldCheck`, `Network`, `Zap` do lucide-react (icones dos cards de infraestrutura)
