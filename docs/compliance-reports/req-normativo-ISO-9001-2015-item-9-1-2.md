# Resumo Executivo — Análise ISO 9001:2015 Item 9.1.2

**Projeto:** Daton ESG Insight
**Data da Análise:** 2026-03-09
**Analista:** Compliance Auditor (IA)
**Tipo de Análise:** Tipo B — Conformidade do Sistema (análise de codebase, sem documento de validação externo)
**Item Normativo:** ISO 9001:2015, Seção 9.1.2 — Satisfação de Clientes

---

## Score de Confiança

**2.4 / 5 — Parcial**

A organização possui infraestrutura técnica de coleta de dados de satisfação, mas a cadeia crítica — coleta sistematizada de satisfação do cliente, análise dos resultados e uso como insumo para melhoria de processos/produtos/serviços — apresenta lacunas estruturais graves. O módulo de ouvidoria está completamente desconectado do backend (mock hardcoded), não existe página dedicada de pesquisa de satisfação de clientes externos e o ciclo "medição → análise → melhoria" não está formalmente implementado no sistema.

---

## Notas por Módulo

| Módulo / Componente | Nota | Observação |
|---|---|---|
| `satisfactionSurveys.ts` — Backend de pesquisas | 3.5 | Serviço funcional com CRUD completo; tabela `satisfaction_surveys` real no banco |
| `customerComplaints.ts` — Gestão de reclamações | 3.8 | Serviço conectado ao banco, com campo `customer_satisfaction_rating` e SLA |
| `OuvidoriaClientes.tsx` — Interface de ouvidoria | 0.5 | `mockComplaints: any[] = []` — completamente desconectada do backend real |
| `FormulariosCustomizados.tsx` + `customForms.ts` | 3.2 | Permite criar pesquisas genéricas com NPS, rating e texto livre; sem template cliente |
| `FormDashboard.tsx` + `NPSScoreCard.tsx` | 3.5 | Analytics de respostas com NPS calculado; dados reais quando formulário preenchido |
| `QualityTrendsAnalyzer.tsx` | 2.0 | Analisa tendências de NCs mas não integra dados de satisfação de clientes externos |
| Dashboard (KPI `hr-satisfaction`) | 1.5 | KPI de satisfação é hardcoded `'4.7/5'` e aponta para RH, não para clientes externos |
| Integração satisfação → ações de melhoria | 0.5 | Não há mecanismo documentado para transformar resultados de satisfação em ações corretivas |

---

## Top 5 Pontos Fortes

1. **Serviço de pesquisas de satisfação funcional:** `src/services/satisfactionSurveys.ts` implementa CRUD completo contra a tabela real `satisfaction_surveys` no Supabase, com suporte a múltiplos tipos de questão (`rating`, `scale`, `multiple_choice`, `text`, `yes_no`), datas de início/fim, público-alvo e modo anônimo.

2. **Campo de avaliação pós-resolução de reclamação:** `src/services/customerComplaints.ts` — função `rateComplaintResolution()` (linha 231) — persiste `customer_satisfaction_rating` (numérico) e `customer_satisfaction_feedback` (texto livre) na tabela `customer_complaints`, viabilizando mensuração de satisfação no ciclo de reclamações.

3. **Componente NPS completo:** `src/components/forms/NPSInput.tsx` e `src/components/forms/charts/NPSScoreCard.tsx` implementam a escala NPS (0–10), classificação em Detratores/Neutros/Promotores e cálculo de score (`calculateNPS`). O campo `nps` está disponível como tipo de campo em `customForms.ts` (linha 58).

4. **Analytics de respostas implementado:** `src/components/forms/FormDashboard.tsx` consolida respostas reais de formulários com gráficos de pizza, barras e seção de respostas abertas, consumindo dados reais do Supabase via `customFormsService`.

5. **Estatísticas de reclamações calculadas:** `getComplaintsStats()` em `customerComplaints.ts` calcula em tempo real `avg_satisfaction`, `sla_compliance` e `escalated` sobre dados reais do banco — base técnica para relatório de satisfação.

---

## Top 5 Lacunas Críticas

1. **[CRÍTICA — Major] Interface de ouvidoria completamente desconectada do backend:** `src/pages/OuvidoriaClientes.tsx`, linha 23 — `const mockComplaints: any[] = []`. Todos os KPIs exibidos ao usuário mostram zero. O serviço `customerComplaints.ts` existe e é funcional, mas a página nunca o invoca. O TODO registrado em `src/utils/todoRegistry.ts` (linha 55) confirma que a implementação do `useOmbudsman` está pendente com prioridade "medium".

2. **[CRÍTICA — Major] Ausência de pesquisa de satisfação de clientes externos acessível pela interface:** Não existe rota ou página dedicada para pesquisas de satisfação do cliente final. A tabela `satisfaction_surveys` e o serviço `satisfactionSurveys.ts` existem, mas nenhuma rota no `App.tsx` expõe uma interface de gestão desses dados para o usuário interno. O módulo de formulários customizados poderia suprir isso, mas não há template pré-configurado de "pesquisa de satisfação do cliente".

3. **[CRÍTICA — Major] Ausência de ciclo formal de análise e uso dos resultados de satisfação:** A norma exige não apenas coletar dados de satisfação, mas monitorar a percepção, analisar os resultados e usá-los como insumo para melhoria. Não há no codebase nenhum fluxo que conecte: resultado de pesquisa de satisfação → geração automática de ação corretiva ou item de pauta de análise crítica. O `QualityTrendsAnalyzer.tsx` monitora NCs, mas não integra dados de satisfação de clientes externos.

4. **[Major] KPI de satisfação no Dashboard é hardcoded e descontextualizado:** `src/pages/Dashboard.tsx`, linha 131 — o KPI `hr-satisfaction` exibe `'4.7/5'` como valor literal (não calculado) e redireciona para `/gestao-funcionarios` (gestão de RH), não para o módulo de satisfação de clientes. Não há KPI de satisfação de clientes externos no dashboard principal.

5. **[Minor] Ausência de evidência de metodologia documentada para monitoramento de satisfação:** A norma menciona "métodos para obter, monitorar e analisar" a percepção do cliente. Não há em `docs/` nenhum documento que defina periodicidade, canais, critérios de amostragem ou responsável pelo processo de pesquisa de satisfação. O sistema oferece a infraestrutura técnica, mas sem processo formal associado.

---

## Cobertura por Sub-requisito ISO 9001:2015 Item 9.1.2

| Sub-requisito | Texto Normativo | Evidência no Sistema | Nível de Atendimento |
|---|---|---|---|
| 9.1.2 (coleta) | "monitorar a percepção dos clientes do grau em que suas necessidades e expectativas foram atendidas" | `satisfaction_surveys` + `customerComplaints.customer_satisfaction_rating` existem; interface de ouvidoria desconectada | Parcial |
| 9.1.2 (métodos) | "determinar os métodos para obter, monitorar e analisar essas informações" | Nenhum processo/documento formal de método encontrado em `docs/`; formulários customizados existem mas sem template de cliente | Ausente |
| 9.1.2 (análise e uso) | "informações de satisfação de clientes ... incluídas como entradas para análise e avaliação" | Nenhum fluxo conecta resultado de pesquisa → ação de melhoria; analytics de formulários existe mas desconectado | Ausente |
| 9.1.2 (exemplos de monitoramento) | "pesquisas com cliente, análise de dados de cliente entregue, reclamações" | Serviço de reclamações funcional; pesquisas têm backend mas sem UI; reclamações sem interface | Parcial |

---

## Plano de Ação Priorizado

### Faixa 1 — Ações Imediatas (0–30 dias)

| Prioridade | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| P1 | Conectar `OuvidoriaClientes.tsx` ao `customerComplaints.ts` implementando `useOmbudsman` com `useQuery` (TanStack Query) | `src/pages/OuvidoriaClientes.tsx` | Médio |
| P2 | Corrigir KPI de satisfação no Dashboard: substituir valor hardcoded por chamada a `getComplaintsStats()` e redirecionar para `/ouvidoria-clientes` | `src/pages/Dashboard.tsx` | Baixo |
| P3 | Adicionar rota e entrada no sidebar para a página de gestão de pesquisas de satisfação usando `satisfactionSurveys.ts` | `src/App.tsx`, `src/components/AppSidebar.tsx` | Baixo |

### Faixa 2 — Ações de Médio Prazo (30–90 dias)

| Prioridade | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| P4 | Criar template pré-configurado de "Pesquisa de Satisfação do Cliente" (NPS + avaliação de produto + campo aberto) no módulo de formulários customizados | `src/services/customForms.ts`, `src/components/FormBuilderModal.tsx` | Médio |
| P5 | Integrar dados de satisfação (`avg_satisfaction`, NPS médio) ao `QualityTrendsAnalyzer.tsx` como série adicional no gráfico de tendências | `src/components/QualityTrendsAnalyzer.tsx` | Médio |
| P6 | Implementar gatilho automático: quando `customer_satisfaction_rating < 3`, sugerir abertura de NC no ciclo de 6 estágios | `src/services/customerComplaints.ts` | Alto |

### Faixa 3 — Consolidação e Evidência (90–180 dias)

| Prioridade | Ação | Descrição | Esforço |
|---|---|---|---|
| P7 | Documentar processo de satisfação de clientes | Criar `docs/processos/satisfacao-clientes.md` definindo metodologia, periodicidade (trimestral mínimo), canais e responsável | Baixo |
| P8 | Criar relatório executivo de satisfação | Página ou componente que consolide: NPS histórico, média de rating de reclamações resolvidas, tendência por categoria, ações geradas | Alto |
| P9 | Conectar resultados de pesquisa ao processo de análise crítica | Garantir que relatório de satisfação seja entrada obrigatória na análise crítica da direção (item 9.3) | Médio |

---

## Guia de Validação E2E

Para verificar conformidade com 9.1.2 após implementação das ações:

1. Criar uma pesquisa de satisfação via interface, publicar e simular resposta de cliente com NPS 4 (Detrator).
2. Verificar que o score NPS calculado aparece no `FormDashboard` e no dashboard principal.
3. Verificar que uma NC é sugerida (ou gerada) automaticamente para o cliente com NPS baixo.
4. Registrar uma reclamação em `OuvidoriaClientes`, resolvê-la e aplicar `rateComplaintResolution` com nota 2/5.
5. Confirmar que o `avg_satisfaction` calculado por `getComplaintsStats()` reflete a nova nota.
6. Verificar que o relatório de análise crítica (9.3) inclui esses dados como entrada.

---

## Conclusão

O item 9.1.2 apresenta **Score 2.4/5 — Parcial**. A infraestrutura técnica existe (tabelas reais, serviços funcionais, componentes de NPS e analytics) mas há uma dissociação fundamental entre a camada de serviço e a interface do usuário: a página de ouvidoria é um casca vazia com dados mock e não existe página de gestão de pesquisas de satisfação de clientes externos. O gap mais crítico é a ausência completa do ciclo "coleta → análise → melhoria", que é a exigência central do item 9.1.2 da norma. Para fechar a conformidade, as ações P1 a P3 da Faixa 1 são pré-condição mínima, e as ações P4 a P6 são necessárias para evidenciar o fechamento do ciclo de melhoria.
