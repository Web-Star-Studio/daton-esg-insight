# Resumo Executivo — Análise ISO 9001:2015 Item 8.1

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.1 — Planejamento e controle operacionais
**Documento de validação:** Conformidade de Sistema (Codebase Mapeamentos, Ações e Documentos)

---

## Nota Global de Confiança: 4.6/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Editor de Processos (`ProcessMapEditor.tsx`) | **4.9/5** | Maduro |
| 02 | Gestão Documental (`documents.ts`) | **4.8/5** | Maduro |
| 03 | Gestão de Ações / Mudanças (`AcoesCorretivas.tsx`) | **4.1/5** | Maduro |
| | **Média aritmética** | **4.6/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 3 | Processos, Documentos, Ações |
| Funcional (3-3.9) | 0 | — |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Modelagem de Processos Completa** (4.9) — O `ProcessMapEditor` é um componente avançadíssimo, abrangendo visões em **Fluxo**, **SIPOC** e **Diagrama Tartaruga**. Esta tripla análise garante que o "planejamento e controle dos processos" seja executado na íntegra.
2. **Controle de Versão de Processos** (4.9) — A emissão de novas versões do desenho do processo é gerida dentro do próprio `ProcessMapEditor`, controlando mudanças intencionais (8.1.b) ao exigir workflows de "Aprovação".
3. **Repositório Eletrônico de Documentos** (4.8) — O backend de `documents.ts` retém informação documentada para assegurar que os processos sejam realizados como planejado (8.1.c), dispondo de versionamento, categorias (tags) e OCR avançado.
4. **Resfriamento de Efeitos Adversos via Ações** (4.5) — O módulo `AcoesCorretivas` atua também mitigando mudanças não intencionais por meio de registros de ações "Preventivas" e "de Melhoria".

---

## Top 5 Lacunas Críticas

### 1. Ausência de Formulário Expresso MOC (Management of Change) (Severidade: MÉDIA)
**Impacto:** Item 8.1.b (controle sobre mudanças).
**Situação:** O sistema trata as mudanças a nível de versionamento de Diagramas e Ações de Melhoria, mas lhe falta um "Formulário de Gestão de Mudança" tradicional para infraestrutura (Ex: "Aprovação de novo layout de fábrica").
**Recomendação:** Evoluir as opções do select `plan_type` na `AcoesCorretivas.tsx` para incluir explicitamente "Gestão de Mudança", com campos adicionais mapeando "impactos e riscos mitigados".

---

## Cobertura por Sub-requisito 8.1

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| Planejar, implementar e manter os controles dos processos | Plena (`ProcessMapEditor`), provendo a interface para desenho dos critérios e características. | Maduro |
| Controlar mudanças intencionais ou não intencionais / Mitigar riscos | Funcional. Há controle de versão de diagramas e Ações (Melhoria/Prevenção) disponíveis para mitigar distúrbios. | Maduro |
| Deter informações documentadas para dar confiança à operação | Plena via `documents.ts`, provendo arquivos (manuais e pop's) vinculados e retidos sob versionamento de upload. | Maduro |

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar valor "Gestão de Mudança (MOC)" no enumerador de `plan_type` da Ação e exigir aba de controle de riscos caso seja selecionado. | `AcoesCorretivas.tsx` | Demonstra atenção explícita à alínea "b" da ISO 9001 (mitigar efeitos adversos de mudança). |

---

## Conclusão

Nota global de **4.6/5.0 (Sistema Maduro)**. 
O aplicativo performa admiravelmente ao demonstrar "como" o planejamento das operações acontece. A capacidade nativa do aplicativo de desenhar Canvas, SIPOCs e Tartarugas de processo excede as expectativas da ISO, demonstrando controles operacionais modernos. A parte de retenção de documentos também já é gerida. O detalhe primário fica no sub-requisito de "análise crítica das consequências de mudança" que, embora viável utilizando o módulo genérico de ações, ganharia respaldo inquestionável de auditoria caso possuísse uma aba estritamente intitulada *Management of Change* (MOC).
