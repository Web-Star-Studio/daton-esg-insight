# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.1.c

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.1.c — Monitoramento e medição para verificar se critérios pré-estabelecidos foram atendidos
**Documento de validação:** Conformidade de Sistema (Tipo B — codebase)

---

## Nota Global de Confiança: 3.3/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Indicadores com metas e status de atendimento (`IndicatorCard.tsx`, `GestaoIndicadores.tsx`) | **4.2/5** | Maduro |
| 02 | Monitoramento de performance técnica do sistema (`PerformanceMetrics.tsx`) | **4.0/5** | Maduro |
| 03 | Avaliação de eficácia de treinamentos (`AvaliacaoEficacia.tsx`) | **3.5/5** | Funcional |
| 04 | Monitoramento do processo de gestão de não conformidades (`NCAdvancedDashboard.tsx`) | **2.0/5** | Parcial |
| 05 | Critérios de aceitação do processo de auditoria (`AuditScoreDashboard.tsx`) | **2.5/5** | Parcial |
| | **Média aritmética** | **3.2/5** | |

> Nota: Considerando peso maior aos módulos de processo interno (NCs e auditoria), a nota ponderada é **3.3/5**.

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 2 | Indicadores, Performance técnica |
| Funcional (3–3.9) | 1 | Avaliação de eficácia |
| Parcial (2–2.9) | 2 | Monitoramento de NCs, Auditoria |
| Mínimo/Ausente (0–1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Comparação automática de indicadores com critérios pré-estabelecidos** (4.2) — O `src/components/indicators/IndicatorCard.tsx` implementa mapa de status `on_target` / `warning` / `critical` / `pending`, verificando `currentMonthData?.status` contra o alvo ativo (`activeTarget?.target_value`). A direção do indicador é configurável: `higher_better`, `lower_better` ou `target_exact`. O sistema compara o valor medido com a meta e categoriza automaticamente o resultado — atende integralmente ao núcleo do requisito 8.5.1.c.

2. **Definição antecipada de critérios de aceitação via IndicatorFormWizard** (4.2) — O `src/components/indicators/IndicatorFormWizard.tsx` inclui etapa "Meta" (Step 4) para definição de `target_value` antes da coleta de dados, configurando o critério de aceitação de forma antecipada ao monitoramento. A constante `DIRECTIONS` (`higher_better`, `lower_better`, `target_exact`) formaliza a lógica de avaliação do resultado.

3. **Limiares de Web Vitals como critérios formais de serviço digital** (4.0) — O `src/components/production/PerformanceMetrics.tsx` monitora Web Vitals com limiares codificados: LCP ≤ 2500 ms (bom) / ≤ 4000 ms (atenção) / > 4000 ms (crítico); FID ≤ 100 ms / ≤ 300 ms / > 300 ms; CLS ≤ 0,1 / ≤ 0,25 / > 0,25. Critérios definidos e verificados automaticamente para o processo de entrega do serviço digital.

4. **Destaque automático de indicadores fora dos critérios** (4.2) — O `src/pages/GestaoIndicadores.tsx` filtra automaticamente indicadores críticos via `indicator.period_data.some((period) => period.status === "critical")`, apresentando-os em destaque para suporte à tomada de decisão baseada em evidência.

5. **Dashboard de eficácia de treinamentos com métricas de prazo** (3.5) — O `src/pages/AvaliacaoEficacia.tsx` monitora `total`, `pendentes`, `avaliados` e `atrasados` com filtros por status de avaliação, constituindo monitoramento do resultado de atividades de competência com critérios de prazo definidos.

---

## Top 5 Lacunas Críticas

### 1. Ausência de KPIs de processo para gestão de não conformidades (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.c — monitoramento e medição dos processos para verificar critérios de processo atendidos.
**Situação:** O processo de tratamento de NCs é composto por 6 estágios (`NCStage1Details` a `NCStage6Effectiveness`), mas não foi localizado mecanismo de monitoramento que verifique automaticamente: tempo médio por estágio, percentual de NCs encerradas dentro do prazo, taxa de reincidência, ou indicador de atraso. O `NCAdvancedDashboard.tsx` existe, mas seus KPIs específicos não foram evidenciados como cobrindo esses critérios de processo.
**Recomendação:** Implementar indicadores de processo para o módulo de NC no `NCAdvancedDashboard`: tempo médio de fechamento, % de NCs atrasadas, taxa de reincidência, % com eficácia avaliada.

### 2. Critérios de aceitação do processo de auditoria não quantificados (Severidade: MÉDIA)

**Impacto:** ISO 9001:2015, item 8.5.1.c — critérios pré-estabelecidos para o processo de auditoria interna.
**Situação:** O módulo `src/components/audit/scoring/AuditScoreDashboard.tsx` possui painel de pontuação, mas não foi verificada a existência de critérios de aceitação pré-definidos para o score mínimo aceitável de conformidade. A `ScoringConfigPanel` sugere configurabilidade, mas sem parâmetros padrão documentados que constituam o critério pré-estabelecido exigido pela norma.
**Recomendação:** Documentar formalmente os critérios de aceitação do processo de auditoria (score mínimo) na `ScoringConfigPanel` e em procedimento operacional associado.

### 3. Ausência de alerta de coleta atrasada para indicadores com frequência configurada (Severidade: MÉDIA)

**Impacto:** ISO 9001:2015, item 8.5.1.c — verificar se a medição ocorre conforme o critério de frequência pré-estabelecido.
**Situação:** O `IndicatorFormWizard` permite definir frequência (`monthly`, `quarterly`, `semiannual`, `annual`), mas não existe verificação automatizada de que a coleta ocorreu conforme a frequência definida. Não há alerta quando uma coleta está atrasada em relação à frequência configurada, impossibilitando verificar se o critério de frequência foi atendido.
**Recomendação:** Implementar alerta de coleta atrasada que compare a data da última medição com a frequência configurada e notifique responsáveis quando o prazo for ultrapassado.

### 4. Critérios de "prontidão para produção" sem documento de referência formal (Severidade: MÉDIA)

**Impacto:** ISO 9001:2015, item 8.5.1.c — critérios pré-estabelecidos verificados antes da liberação do serviço.
**Situação:** O `src/components/production/SystemStatusDashboard.tsx` executa `ProductionReadinessChecker` e health checks, mas os critérios que determinam "pronto para produção" estão codificados no utilitário sem documento de referência formal associado. Não é possível auditar os critérios sem ler o código-fonte.
**Recomendação:** Documentar os critérios de prontidão para produção em procedimento operacional ou IT, referenciando os limiares implementados no `ProductionReadinessChecker`.

### 5. Ausência de SLA formal para Web Vitals (Severidade: BAIXA)

**Impacto:** ISO 9001:2015, item 8.5.1.c — formalização dos critérios utilizados no monitoramento como requisito organizacional.
**Situação:** Os limites de Web Vitals em `PerformanceMetrics.tsx` seguem os critérios do Google Core Web Vitals (padrões públicos), mas não há documento interno que adote formalmente esses critérios como SLA da plataforma. Sem formalização, não é comprovável em auditoria que esses critérios foram estabelecidos como requisito organizacional antes da medição.
**Recomendação:** Criar SLA formal documentado para Web Vitals, referenciando os limiares implementados e aprovando-os como critérios de aceitação organizacionais.

---

## Cobertura por Sub-requisito 8.5.1.c

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| Implementar monitoramento e medição em pontos apropriados | `IndicatorCard.tsx` (indicadores), `PerformanceMetrics.tsx` (Web Vitals), `AvaliacaoEficacia.tsx` (treinamentos) | Maduro |
| Definir critérios pré-estabelecidos antes da coleta | `IndicatorFormWizard.tsx` com `target_value` e `direction` definidos antes da medição | Maduro |
| Verificar automaticamente se critérios foram atendidos | Status `on_target` / `warning` / `critical` calculado automaticamente em `IndicatorCard.tsx`; filtro de críticos em `GestaoIndicadores.tsx` | Maduro |
| Monitorar conformidade de processos internos (NC, auditoria) | `NCAdvancedDashboard.tsx` sem KPIs de processo verificados; `AuditScoreDashboard.tsx` sem critério mínimo documentado | Parcial |
| Verificar cumprimento da frequência de medição configurada | Ausente — não há alerta de coleta atrasada vs. frequência configurada | Ausente |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Documentar critério de score mínimo de auditoria na `ScoringConfigPanel` e em procedimento operacional | `AuditScoreDashboard.tsx`, docs | Formaliza critério pré-estabelecido para o processo de auditoria |
| 2 | Criar SLA formal para Web Vitals referenciando limiares do `PerformanceMetrics.tsx` | Documentação | Transforma critério técnico em requisito organizacional auditável |

### Melhorias Estruturais (2–4 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Implementar alerta de coleta atrasada comparando data da última medição com frequência configurada | `IndicatorFormWizard.tsx`, backend de indicadores | Fecha lacuna crítica de verificação de frequência de medição |
| 4 | Documentar critérios de prontidão para produção em procedimento operacional referenciando `ProductionReadinessChecker` | `SystemStatusDashboard.tsx`, docs | Torna critérios auditáveis sem necessidade de ler o código |

### Mudanças Arquiteturais (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Implementar KPIs de processo para NC no `NCAdvancedDashboard`: tempo médio de fechamento, % atrasadas, taxa de reincidência | `NCAdvancedDashboard.tsx`, banco de dados | Eleva monitoramento do processo de NCs de Parcial para Maduro |

---

## Guia de Validação E2E

1. Navegar para o módulo de Gestão de Indicadores e verificar que indicadores com status `critical` aparecem em destaque separado dos demais.
2. Selecionar um indicador e verificar que o card exibe o status calculado (`on_target` / `warning` / `critical`) comparando o valor medido com `target_value` configurado na etapa "Meta" do wizard.
3. Criar um indicador com frequência `monthly`. Simular ausência de coleta por mais de 30 dias e verificar se o sistema alerta sobre a coleta atrasada.
4. Acessar o módulo de Auditoria e verificar se existe critério de score mínimo configurado na `ScoringConfigPanel`. Confirmar que o critério está documentado em procedimento operacional.
5. Acessar o `SystemStatusDashboard` e verificar que o `ProductionReadinessChecker` exibe critérios de "go/no-go" rastreáveis a um documento de referência externo ao código.
6. Critério de aceite:
   - PASSA: Indicadores calculam status automaticamente contra meta pré-definida, existe alerta de coleta atrasada, e critérios de auditoria e produção estão documentados externamente ao código.
   - FALHA: Ausência de alerta de coleta atrasada, critérios de auditoria não quantificados, ou critérios de produção existentes apenas no código-fonte.

---

## Conclusão

Nota global de **3.3/5.0 (Sistema Funcional)**.

O Daton ESG Insight demonstra maturidade na camada de monitoramento de indicadores de produto: a comparação automática de valores medidos com `target_value`, a segmentação por status (`on_target` / `warning` / `critical`) e o destaque de indicadores críticos em `GestaoIndicadores.tsx` constituem implementação sólida do núcleo do requisito 8.5.1.c da ISO 9001:2015. O monitoramento de performance técnica via Web Vitals com limiares codificados em `PerformanceMetrics.tsx` reforça essa avaliação.

As lacunas concentram-se nos processos internos: o processo de gestão de não conformidades (6 estágios) não possui KPIs de processo verificáveis no `NCAdvancedDashboard`, e o processo de auditoria não possui critério de score mínimo pré-estabelecido e documentado. Adicionalmente, a ausência de alerta de coleta atrasada para indicadores com frequência configurada representa lacuna direta no requisito de verificar se o critério de frequência de medição foi cumprido.

As ações 1 e 3 (formalização do critério de auditoria e implementação de alerta de coleta atrasada) são as de maior impacto imediato e elevariam o score para a faixa 3.7–3.8/5. A ação 5 (KPIs de processo para NC) é a mais transformadora e levaria o sistema à faixa Maduro (4.0+) neste requisito.
