

## Gerar imagens realistas dos modulos e substituir em /tecnologia

### Objetivo

Substituir as 5 imagens genericas da secao "Nossas Solucoes" em `/tecnologia` por screenshots gerados via IA que reproduzam fielmente a interface real de cada modulo do sistema.

### Modulos e suas interfaces reais

| # | Modulo | Pagina real | Elementos visuais principais |
|---|--------|------------|------------------------------|
| 001 | ESG Ambiental | GestaoESG.tsx | Score ESG circular grande, 3 pillar cards (Ambiental/Social/Governanca) com badges de pontuacao, KPIs, cards de alertas inteligentes e painel preditivo |
| 002 | ESG Social | SocialESG.tsx | Tabs (overview, treinamentos, projetos), 4 ModuleSummaryCards (Colaboradores, Seguranca, Treinamentos, Impacto Social), tabela de projetos sociais, graficos de treinamento por localizacao/setor |
| 003 | Qualidade (SGQ) | UnifiedQualityDashboard.tsx | Tabs (overview, indicadores, tendencias, etc), cards com nao conformidades, acoes corretivas, documentos controlados, matriz de qualidade, insights de IA |
| 004 | Gestao Fornecedores | SupplierDashboard.tsx | Cards de metricas (total fornecedores, avaliacoes, documentos), tabela de fornecedores com status/badges, botoes de acoes rapidas |
| 005 | Inteligencia Artificial | IntelligenceCenter.tsx | 6 tabs (Analisar, Extraidos, Nao Classificados, Automacao, Analytics, Performance IA), area de upload, dashboards de performance IA |

### Implementacao

**Passo 1 - Gerar 5 imagens via AI Image Generation**

Para cada modulo, gerar uma imagem com prompt detalhado descrevendo a interface real do sistema:
- Layout com sidebar escura a esquerda e conteudo principal a direita
- Cards brancos com bordas suaves, badges coloridas
- Graficos, tabelas e metricas consistentes com o design system (cores verdes, azuis, roxas)
- Tipografia limpa, estilo SaaS profissional
- Resolucao 1920x1080 (aspecto dashboard)

**Passo 2 - Substituir imagens em src/assets/**

Sobrescrever os 5 arquivos existentes:
- `src/assets/solution-ambiental.jpg`
- `src/assets/solution-social.jpg`
- `src/assets/solution-qualidade.jpg`
- `src/assets/solution-fornecedores.jpg`
- `src/assets/solution-ia.jpg`

**Passo 3 - Nenhuma alteracao de codigo necessaria**

Os imports em `Technology.tsx` ja referenciam estes arquivos, entao basta substituir as imagens.

### Detalhes dos prompts de geracao

Cada prompt incluira:
- Descricao precisa do layout da pagina real (baseada no codigo-fonte analisado)
- Elementos UI especificos: circular progress, pillar cards, tabs, tabelas, badges
- Paleta de cores do sistema: verde (#00bf63), fundo claro, cards brancos
- Estilo visual: SaaS dashboard, clean, profissional, dados realistas
- Sidebar com icones e menu de navegacao

