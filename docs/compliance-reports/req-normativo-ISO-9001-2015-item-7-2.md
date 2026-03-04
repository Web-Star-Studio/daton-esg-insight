# Resumo Executivo — Análise ISO 9001:2015 Item 7.2

**Data da análise:** 2026-03-04
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.2 — Competência
**Documento de validação:** PSG-RH Rev.49 (Gabardo — Procedimento de Recursos Humanos)

---

## Nota Global de Confiança: 3.6/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Descrição de Cargos / Funções | **4.0/5** | Maduro |
| 02 | Matriz de Competências | **4.0/5** | Maduro |
| 03 | Gestão de Treinamentos | **4.5/5** | Maduro |
| 04 | Avaliação de Eficácia de Treinamentos | **4.0/5** | Maduro |
| 05 | Gestão de Funcionários (Cadastro) | **3.5/5** | Funcional |
| 06 | Gestão de Desempenho | **3.5/5** | Funcional |
| 07 | Desenvolvimento de Carreira (PDI) | **3.5/5** | Funcional |
| 08 | Recrutamento e Seleção | **3.0/5** | Funcional |
| 09 | Plano de Sucessão / Mentoria | **3.0/5** | Funcional |
| 10 | Registros e Documentação RH | **3.0/5** | Funcional |
| | **Média aritmética** | **3.6/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 4 | Descrição de Cargos, Matriz de Competências, Gestão de Treinamentos, Avaliação de Eficácia |
| Funcional (3-3.9) | 6 | Gestão de Funcionários, Desempenho, PDI, Recrutamento, Sucessão/Mentoria, Registros RH |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Gestão de Treinamentos completa** (4.5/5) — Módulo mais maduro do sistema para competência. Suporta programas de treinamento com categorias, carga horária, obrigatoriedade, validade, agendamento de sessões, controle de presença, certificações, relatórios por departamento/localidade, exportação de horas e matriz de compliance. Tabelas: `training_programs`, `employee_trainings`, `training_schedules`, `training_schedule_participants`, `training_documents`, `training_categories`.

2. **Matriz de Competências com análise de gap** (4.0/5) — Sistema completo de definição de competências por categoria, com níveis hierárquicos (`level`, `name`, `description`, `behaviors[]`), avaliação individual (`current_level` vs `target_level`), e cálculo automático de lacunas via `getCompetencyGapAnalysis()`. Endereça diretamente o requisito 7.2.a de determinar competência necessária.

3. **Descrição de Cargos estruturada** (4.0/5) — Interface `Position` com campos `requirements[]`, `responsibilities[]`, `required_education_level`, `required_experience_years`, `level` (Trainee a Diretor), `department_id`. Mapa direto ao RG.RH.01 (Descrição de Funções) do PSG-RH. Suporta importação em massa via `positionImport.ts`.

4. **Avaliação de Eficácia de Treinamentos** (4.0/5) — Módulo dedicado com `training_efficacy_evaluations` que registra avaliador, data, nota, efetividade (`is_effective`), comentários e status. Recalcula automaticamente o status do programa de treinamento após avaliação concluída. Atende ao PSG-RH requisito de avaliação pós-treinamento.

5. **Desenvolvimento de Carreira integrado** (3.5/5) — PDI (Plano de Desenvolvimento Individual) com posição atual/alvo, metas, habilidades a desenvolver, atividades de desenvolvimento, progresso percentual. Complementado por planos de sucessão e programas de mentoria. Endereça o ciclo completo de desenvolvimento de competências.

---

## Top 5 Lacunas Críticas

### 1. Classificação de Posições Sensíveis (OEA) Ausente (Severidade: ALTA)
**Impacto:** PSG-RH Seção 4 (Posições Sensíveis), ISO 7.2.a
**Situação:** O PSG-RH define classificação de posições como BAIXO/MÉDIO/ALTO risco para cargos com acesso direto à carga, informações aduaneiras ou potencial interferência no compliance OEA. A tabela `positions` no sistema não possui campo para nível de sensibilidade/risco do cargo.
**Recomendação:** Adicionar campo `sensitivity_level` (BAIXO/MÉDIO/ALTO) à tabela `positions` e vincular às regras de monitoramento e confidencialidade do PSG-RH.

### 2. Integração/Onboarding de Novos Funcionários não Sistematizado (Severidade: ALTA)
**Impacto:** PSG-RH Seção 3.3 (Integração), ISO 7.2.c
**Situação:** O PSG-RH exige orientação/integração de novos funcionários com checklist de admissão (RG.RH.16). O sistema possui `training_programs` que podem ser marcados como obrigatórios, mas não há workflow específico de onboarding que vincule automaticamente treinamentos obrigatórios a novos funcionários no ato da admissão.
**Recomendação:** Criar fluxo automático que, ao cadastrar novo funcionário, gere matricula nos treinamentos obrigatórios e checklist de integração.

### 3. Termos de Confidencialidade sem Rastreamento Digital (Severidade: MÉDIA)
**Impacto:** PSG-RH Seção 4.1 (RG.RH.18/19 — Confidencialidade), ISO 7.2.a
**Situação:** O PSG-RH exige termos de confidencialidade para funcionários novos (RG.RH.18) e existentes (RG.RH.19). O sistema possui `employee_documents` para armazenar documentos, mas não há tipo de documento específico nem workflow para garantir que todo funcionário em posição sensível tenha termo assinado.
**Recomendação:** Adicionar tipo de documento "Termo de Confidencialidade" com controle de obrigatoriedade vinculado ao `sensitivity_level` do cargo.

### 4. Pesquisa de Clima Organizacional não Implementada (Severidade: MÉDIA)
**Impacto:** PSG-RH Seção 6 (RG.RH.20 — Pesquisa de Clima), ISO 7.2 (suporte)
**Situação:** O PSG-RH exige pesquisa de clima bienal (a cada 2 anos), anônima e voluntária. O sistema não possui módulo de pesquisa de clima organizacional.
**Recomendação:** Implementar módulo de pesquisa de clima com templates, anonimato, dashboard de resultados e histórico bienal.

### 5. Checklist de Desligamento sem Automação (Severidade: MÉDIA)
**Impacto:** PSG-RH Seção 5 (Desligamento de posições sensíveis), ISO 7.2.a
**Situação:** O PSG-RH exige, para posições sensíveis, revogação de acessos físicos/lógicos em 24 horas, cancelamento de delegações, e devolução de ativos. O sistema permite marcar funcionários como "Inativo" (`termination_date`, `status`), mas não possui workflow automatizado de revogação de acessos nem checklist de desligamento.
**Recomendação:** Implementar workflow de desligamento com checklist automatizado que dispara revogação de acessos ao mudar status para "Inativo".

---

## Cobertura por Sub-requisito ISO 7.2

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.2.a Determinar competência necessária | Tabela `positions` com `requirements`, `required_education_level`, `required_experience_years`; `competency_matrix` com níveis e categorias | Maduro |
| 7.2.b Assegurar competência (educação, treinamento, experiência) | `employee_education`, `employee_experiences`, `employee_trainings` vinculados ao cadastro; `competency_assessments` com `current_level` vs `target_level` | Funcional |
| 7.2.c Tomar ações para adquirir competência | `training_programs` com agendamento, matricula e acompanhamento; `career_development_plans` com PDI; `mentoring_relationships` | Maduro |
| 7.2.c Avaliar eficácia das ações | `training_efficacy_evaluations` com nota, efetividade e status; recálculo automático do status do programa | Maduro |
| 7.2.d Reter informação documentada | `employee_trainings`, `employee_competency_assessments`, `performance_evaluations`, `employee_documents` — sem política de retenção de 20 anos configurável | Funcional |

---

## Cobertura PSG-RH Rev.49

| # | Requisito PSG-RH | Status | Nota |
|---|-------------------|--------|------|
| 1 | Descrição de funções (RG.RH.01) com competências | ✅ | `positions` com requirements, education, experience |
| 2 | Recrutamento e seleção estruturado | ⚠️ | Módulo existe mas sem formulários PSG (RG.RH.05/06) |
| 3 | Verificação educação/experiência/conhecimentos/habilidades | ✅ | `employee_education`, `employee_experiences`, `competency_assessments` |
| 4 | Plano anual de treinamento (RG.RH.03) | ✅ | `training_programs` com categorias, obrigatoriedade, agendamento |
| 5 | Registro de treinamentos (RG.RH.04 / QualityWeb) | ✅ | `employee_trainings` com score, status, certificação |
| 6 | Avaliação de eficácia de treinamentos | ✅ | `training_efficacy_evaluations` completo |
| 7 | Integração/orientação novos funcionários | ⚠️ | Treinamentos obrigatórios existem, sem workflow de onboarding |
| 8 | Classificação de posições sensíveis (OEA) | ❌ | Sem campo de nível de sensibilidade |
| 9 | Processo de mudança de função/promoção (RG.RH.12) | ⚠️ | PDI e sucessão existem, sem formulário formal |
| 10 | Pesquisa de clima organizacional (RG.RH.20) | ❌ | Módulo ausente |
| 11 | Termos de confidencialidade (RG.RH.18/19) | ⚠️ | Documents hub existe, sem tipo específico |
| 12 | Retenção de registros RH (20 anos) | ⚠️ | Dados persistem no Supabase, sem política configurável |
| 13 | Controle de condutas indesejadas | ⚠️ | Sem módulo de compliance comportamental |
| 14 | Checklist admissão/desligamento (RG.RH.16/17) | ⚠️ | Status de funcionário existe, sem checklist automatizado |
| 15 | Conhecimento organizacional (PSGs, ITs) | ✅ | GED + controle de documentos (módulo 7.5) |

**Resumo:** 6/15 implementados (✅), 7/15 parciais (⚠️), 2/15 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar campo `sensitivity_level` (BAIXO/MÉDIO/ALTO) à tabela `positions` | 01 | PSG-RH §4 |
| 2 | Criar tipo de documento "Termo de Confidencialidade" com obrigatoriedade por cargo | 10 | PSG-RH §4.1 |
| 3 | Vincular `position_id` como campo obrigatório no cadastro de funcionários | 05 | 7.2.a |
| 4 | Adicionar campo `valid_for_months` à `competency_matrix` para reciclagem de competências | 02 | 7.2.c |
| 5 | Criar relatório de gap de competências por departamento (já existe `getCompetencyGapAnalysis`, expor na UI) | 02, 06 | 7.2.a |

### Melhorias Estruturais (2-4 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 6 | Implementar workflow automático de onboarding (treinamentos obrigatórios + checklist RG.RH.16) | 03, 05 | PSG-RH §3.3 |
| 7 | Criar fluxo de promoção/mudança de função com verificação de competências | 01, 02, 07 | PSG-RH §4.3 |
| 8 | Implementar checklist de desligamento com revogação automática de acessos | 05, 10 | PSG-RH §5 |
| 9 | Adicionar política de retenção configurável para registros RH (mín. 20 anos) | 10 | PSG-RH §7 |
| 10 | Vincular `competency_matrix` à `positions` (competências requeridas por cargo) | 01, 02 | 7.2.a |

### Mudanças Arquiteturais (1-2 meses)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 11 | Implementar módulo de pesquisa de clima organizacional | Novo | PSG-RH §6 |
| 12 | Criar módulo de compliance comportamental (condutas indesejadas, canal de denúncias) | Novo | PSG-RH §4.2 |
| 13 | Implementar formulários digitais PSG (RG.RH.05/06/08/09/12) integrados ao recrutamento | 08 | PSG-RH §2/§4.3 |
| 14 | Integrar onboarding com LMS (`lmsService.ts`) para trilhas de aprendizado por cargo | 03, 07 | 7.2.c |
| 15 | Dashboard consolidado de competência organizacional com indicadores ISO 7.2 | Novo | 7.2 global |

---

## Conclusão

O sistema Daton ESG Insight apresenta uma **cobertura sólida** dos requisitos de competência da ISO 9001:2015 item 7.2, com nota global de **3.6/5 (Funcional)**. Os módulos de maior maturidade são a **Gestão de Treinamentos** (4.5/5), a **Matriz de Competências** (4.0/5), a **Descrição de Cargos** (4.0/5) e a **Avaliação de Eficácia** (4.0/5) — que juntos endereçam o núcleo do requisito 7.2.a (determinação da competência necessária) e 7.2.c (ações para adquirir competência).

As **principais forças** estão na arquitetura de dados abrangente — o sistema possui tabelas dedicadas para programas de treinamento, matriculas, avaliações de eficácia, matriz de competências com análise de gap, descrição de cargos com requisitos estruturados, e desenvolvimento de carreira com PDI. A cobertura funcional é ampla, com 4 módulos classificados como "Maduro" e nenhum módulo "Parcial" ou "Ausente".

As **lacunas mais críticas** são: ausência de classificação de posições sensíveis OEA (PSG-RH §4), falta de workflow de onboarding automatizado (PSG-RH §3.3), e inexistência de módulo de pesquisa de clima (PSG-RH §6). Estas lacunas representam pontos específicos do PSG-RH que não possuem equivalente funcional no sistema.

Dos 15 requisitos PSG-RH mapeados, **6 estão plenamente implementados**, **7 parcialmente**, e **2 ausentes**. O sub-requisito ISO 7.2.a (determinar competência necessária) é o melhor coberto, com nota **Maduro**, graças à integração entre `positions`, `competency_matrix` e `employee_competency_assessments`. O plano de ação priorizado com 15 itens pode elevar a nota para **4.2+** em 1-2 meses.
