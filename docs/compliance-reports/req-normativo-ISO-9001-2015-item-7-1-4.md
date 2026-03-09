# Resumo Executivo — Análise ISO 9001:2015 Item 7.1.4

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.1.4 — Ambiente para a operação dos processos
**Documento de validação:** Conformidade de Sistema (Codebase Módulos de Segurança e Clima SST)

---

## Nota Global de Confiança: 4.8/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Segurança / Acidentes (`useSafetyIncidents.ts`, `LostTimeAccidentsDashboard.tsx`) | **5.0/5** | Maduro |
| 02 | Inspeções e Controles (`safetyInspections.ts`) | **4.8/5** | Maduro |
| 03 | Portal de Segurança Geral (`Seguranca.tsx`) | **4.7/5** | Maduro |
| | **Média aritmética** | **4.8/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 3 | Segurança/Acidentes, Inspeções, Portal SST |
| Funcional (3-3.9) | 0 | — |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Monitoramento e Tratamento de Ocorrências** (5.0) — Componentes como `LostTimeAccidentsDashboard` e hooks vinculados traduzem de modo excepcional o controle de incidentes físicos, abordando a "manutenção" das condições limitativas de fábrica.
2. **Inspeções Programadas de Saúde de Ambiente** (4.8) — O CRUD subjacente (e enumeradores como `safetyInspectionTypes`) valida parâmetros preventivos na operação do processo e assegura fatores físicos (ex: EPI, temperatura, circulação).
3. **Dashboards Gerenciais Analíticos** (4.7) — A representação da página `Seguranca.tsx` compila todos os requisitos da área de SST para fácil controle gerencial.

---

## Top 5 Lacunas Críticas

### 1. Indicadores de Ambiente Social/Psicológico (Severidade: MÉDIA)
**Impacto:** Item 7.1.4.a (Social) e 7.1.4.b (Psicológico).
**Situação:** O painel "Segurança" está concentrado quase totalmente na proteção primária (item C - Ambiente físico / Segurança do Trabalho). Há ausência de módulos dedicados a medição de estresse ou resolução de conflitos ocupacionais.
**Recomendação:** Incluir interface/pesquisa dedicada para "Fatores Psicossociais" ou correlacionar isso com denúncias na área de compliance.

---

## Cobertura por Sub-requisito 7.1.4

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.1.4.a Fatores sociais | Controle coberto indiretamente por outros módulos não centrais no SST | Parcial |
| 7.1.4.b Fatores psicológicos | Idem, sem um widget visual direto dedicado a fadiga emocional global | Parcial |
| 7.1.4.c Fatores físicos | Cobertura excelente e profunda via Gestão de Segurança, Inspeções e Controle de Acidentes, protegendo as margens ambientais operacionais | Maduro |

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Incluir um painel ou aba em `Seguranca.tsx` para "Avaliação de Risco Psicossocial" via tags / inspeção comportamental. | `Seguranca.tsx` | Equilibra a matriz analítica do Daton para abranger o escopo não tangível da ISO 7.1.4. |

---

## Conclusão

Nota global de **4.8/5.0 (Sistema Maduro)**. 
O sistema aborda a determinação e manutenção do ambiente de operação primariamente na vertente da **Segurança Ocupacional Básica (Físico)**. Toda essa infraestrutura de SST (Lost Time, Inspections) tem excelência tecnológica notável. Apenas o âmbito "intangível" da norma (ambiente psicológico e de conforto relacional das equipas) ainda carece de componentes nativos frontais claros.
