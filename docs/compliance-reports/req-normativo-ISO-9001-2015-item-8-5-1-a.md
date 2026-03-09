# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.1.a

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.1.a — Disponibilidade de informação documentada que determine as características dos produtos/serviços e os resultados pretendidos
**Documento de validação:** Conformidade de Sistema (Tipo B — codebase)

---

## Nota Global de Confiança: 2.8/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Definição de tipos e interfaces de serviço (`nonConformityService.ts`) | **3.8/5** | Funcional |
| 02 | Templates ISO com evidências requeridas (`isoTemplates.ts`) | **3.5/5** | Funcional |
| 03 | Formulário de indicadores com critérios de desempenho (`IndicatorFormWizard.tsx`) | **3.2/5** | Funcional |
| 04 | Especificações formais externas ao código (docs, procedimentos) | **0.8/5** | Ausente |
| | **Média aritmética** | **2.8/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 0 | — |
| Funcional (3–3.9) | 3 | Tipos de serviço, Templates ISO, Indicadores |
| Parcial (2–2.9) | 0 | — |
| Mínimo/Ausente (0–1.9) | 1 | Documentação formal externa (especificações, procedimentos, ITs) |

---

## Top 5 Pontos Fortes

1. **Interfaces TypeScript como especificação formal de serviço** (3.8) — O arquivo `src/services/nonConformityService.ts` define a interface `NonConformity` com campos tipados: `category`, `severity` (`'critical' | 'major' | 'minor' | 'observation'`), `source`, `status` (`'open' | 'in_progress' | 'closed' | 'cancelled'`), `damage_level`, `impact_analysis` e `corrective_actions`. A interface `NCActionPlan` complementa com os campos 5W2H completos. Esses tipos constituem especificação técnica formal das características do serviço de gestão de não conformidades.

2. **Templates ISO com evidências requeridas documentadas** (3.5) — O arquivo `src/data/isoTemplates.ts` define a estrutura `ISOTemplate` com campos `clause_reference`, `description`, `questions` e `evidence_required` por questão. Cada template lista explicitamente quais evidências são esperadas para cada requisito auditado (ex.: questão 4.1: `['Análise de contexto', 'Atas de reunião estratégica']`; questão 5.2: `['Política da qualidade', 'Comprovantes de divulgação']`), configurando documentação dos resultados pretendidos por processo.

3. **Wizard de indicadores com parâmetros de resultado pretendido** (3.2) — O `src/components/indicators/IndicatorFormWizard.tsx` estrutura 4 etapas de definição de indicadores incluindo: `code`, `name`, `description`, `unit`, `frequency`, `direction` (`higher_better` / `lower_better` / `target_exact`), `target_value`, `analysis_instructions` e `suggested_actions`. Esses campos correspondem diretamente às "características do serviço e resultados pretendidos" exigidos pelo item 8.5.1.a.

4. **Critérios de severidade e categorias padronizados** — O `src/components/non-conformity/NCStage1Details.tsx` define valores aceitos de severidade e status como constantes tipadas com mapeamento de rótulos em português, representando características padronizadas do processo de gestão da qualidade que estabelecem o que se espera de cada saída do processo.

5. **Controle de versão via git como rastreabilidade de especificação** — O repositório git com histórico de commits provê rastreabilidade temporal das alterações nas especificações técnicas (interfaces, tipos, componentes), atendendo parcialmente à exigência de informação documentada identificável e controlada (ISO 9001:2015, item 7.5.2).

---

## Top 5 Lacunas Críticas

### 1. Ausência de documento formal de especificação de serviço (Severidade: ALTA)

**Impacto:** Sub-requisito 8.5.1.a — informação documentada que determine as características dos produtos/serviços a serem produzidos.
**Situação:** Nenhum documento de especificação de serviço (Especificação de Requisitos, Catálogo de Serviços, Descrição de Produto ou equivalente) foi localizado no diretório `docs/` do repositório. A informação existe de forma fragmentada nos tipos TypeScript e comentários de código, mas não como artefato auditável independente por um auditor não-técnico. `/docs/` inexistente no momento da auditoria; `README.md` sem conteúdo de especificação de serviço.
**Recomendação:** Criar `docs/product-specification.md` descrevendo módulos, funcionalidades, características e resultados pretendidos de cada serviço da plataforma, referenciando os tipos TypeScript correspondentes.

### 2. Ausência de instruções de trabalho para operações de produção controlada (Severidade: ALTA)

**Impacto:** Sub-requisito 8.5.1.a e 8.5.1 geral — atividades a serem executadas com resultados pretendidos definidos.
**Situação:** O módulo `src/pages/ProductionMonitoring.tsx` monitora status, logs, performance e alertas do sistema, mas não existe procedimento operacional (IT ou POP) associado que defina: como interpretar alertas, quando escalar, critérios de aceitação de performance, ou responsabilidades de intervenção. O código define a interface mas não o procedimento de operação controlada.
**Recomendação:** Criar procedimento operacional para o módulo de Monitoramento de Produção, referenciando os limiares implementados em `src/components/production/PerformanceMetrics.tsx` (LCP ≤ 2500 ms, FID ≤ 100 ms, CLS ≤ 0,1) como critérios formais de aceitação.

### 3. Campos críticos de caracterização sem obrigatoriedade documentada (Severidade: MÉDIA)

**Impacto:** Sub-requisito 8.5.1.a — completude das características documentadas das saídas do serviço.
**Situação:** Em `src/components/non-conformity/NCStage1Details.tsx`, os campos `category` (exibe "Não definida" quando ausente) e `source` são opcionais. Para um registro de não conformidade, categoria e fonte são características fundamentais para rastreabilidade. Não existe política documentando quais campos são obrigatórios para cada tipo de NC.
**Recomendação:** Definir política de campos obrigatórios para registros de NC e codificar como validação de formulário com mensagem descritiva.

### 4. Resultados pretendidos dos indicadores sem vinculação a processos documentados (Severidade: MÉDIA)

**Impacto:** Sub-requisito 8.5.1.a — rastreabilidade dos resultados pretendidos aos processos que os produzem.
**Situação:** O `IndicatorFormWizard` permite definir `analysis_instructions` e `suggested_actions` como texto livre, sem vinculação a um mapa de processos ou procedimentos documentados. Não há referência cruzada entre os indicadores criados e os processos da organização aos quais pertencem, impedindo rastreabilidade bidirecional.
**Recomendação:** Adicionar campo `process_reference` no formulário de indicadores com seleção de processo do `ProcessMapEditor`, garantindo que cada indicador rastreie ao processo que mede.

### 5. Ausência de versionamento explícito de especificações (Severidade: BAIXA)

**Impacto:** ISO 9001:2015, item 7.5.2 — controle de informação documentada (identificação e versionamento).
**Situação:** Não foram localizadas convenções de versionamento das especificações de produto além do controle implícito do git. Os tipos TypeScript não carregam metadados de versão, data de vigência ou aprovador. A ISO 9001:2015 exige que a informação documentada seja identificável com versão, data e responsável pela aprovação.
**Recomendação:** Adotar convenção de versionamento semântico para documentos de especificação e incluir cabeçalhos de controle (versão, data de emissão, aprovador) em documentos formais criados.

---

## Cobertura por Sub-requisito 8.5.1.a

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| Informação documentada sobre características dos produtos/serviços | Interfaces TypeScript em `nonConformityService.ts`; campos do `IndicatorFormWizard`; constantes tipadas de severidade/status em `NCStage1Details.tsx` | Funcional |
| Informação documentada sobre resultados pretendidos | `evidence_required` nos `isoTemplates.ts`; `target_value` e `direction` em indicadores; `analysis_instructions` como texto livre | Funcional |
| Artefatos legíveis por auditores não-técnicos (documentos formais) | Nenhum documento de especificação de serviço localizado em `docs/` | Ausente |
| Controle e versionamento de informação documentada (ISO 9001:2015, item 7.5.2) | Apenas controle implícito via git; sem metadados de versão, data e aprovador | Mínimo |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Criar `docs/product-specification.md` com lista de módulos, funcionalidades e resultados esperados por serviço | Documentação | Cria artefato auditável de especificação de serviço — fecha lacuna crítica 1 |
| 2 | Tornar os campos `category` e `source` obrigatórios no formulário de NC com mensagem de validação clara | `NCStage1Details.tsx` | Garante completude das características documentadas de cada NC |

### Melhorias Estruturais (2–4 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Criar procedimento operacional para o módulo de Monitoramento de Produção, referenciando limiares de LCP/FID/CLS como critérios formais | `ProductionMonitoring.tsx`, docs | Documenta atividades a executar com resultados pretendidos definidos |
| 4 | Adicionar campo `process_reference` no formulário de indicadores com seleção de processo do `ProcessMapEditor` | `IndicatorFormWizard.tsx` | Vincula resultados pretendidos dos indicadores ao mapa de processos |

### Mudanças Arquiteturais (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Avaliar geração automática de documentação técnica derivada dos tipos TypeScript (TypeDoc ou similar) | Toda a base de código | Reduz lacuna entre especificação técnica e documentação auditável por não-técnicos |
| 6 | Implementar cabeçalhos de controle (versão, data, aprovador) nos documentos de especificação criados | Documentação | Atende ISO 9001:2015 item 7.5.2 — controle de informação documentada |

---

## Guia de Validação E2E

1. Acessar o módulo de Indicadores e criar um novo indicador preenchendo todos os campos do wizard (etapas 1 a 4), incluindo `target_value` e `direction`. Verificar que o sistema exibe o indicador com status calculado automaticamente na tela de Gestão de Indicadores.
2. Acessar o módulo de Não Conformidades e tentar criar uma NC deixando os campos `category` e `source` em branco. Verificar se o sistema bloqueia o avanço de estágio ou exibe mensagem de validação.
3. Verificar se existe o arquivo `docs/product-specification.md` descrevendo todos os módulos da plataforma com características e resultados pretendidos auditáveis por um não-técnico.
4. Verificar no repositório se existe documento de procedimento operacional para o módulo de Monitoramento de Produção, referenciando os limiares de Web Vitals implementados em `PerformanceMetrics.tsx`.
5. Consultar o histórico git de `src/services/nonConformityService.ts` e verificar se as mudanças de interface possuem mensagens de commit que identifiquem a versão e o contexto da alteração.
6. Critério de aceite:
   - PASSA: Existe documento de especificação de serviço auditável, campos obrigatórios de NC são validados, e indicadores possuem referência de processo documentada.
   - FALHA: Especificação de serviço inexistente em `docs/`, campos críticos de NC permanecem opcionais, ou nenhum vínculo entre indicadores e mapa de processos.

---

## Conclusão

Nota global de **2.8/5.0 (Sistema Parcial)**.

O Daton ESG Insight demonstra conformidade parcial com o item 8.5.1.a da ISO 9001:2015. A base técnica do sistema é sólida: interfaces TypeScript tipadas em `nonConformityService.ts`, templates ISO com evidências requeridas em `isoTemplates.ts` e o wizard de indicadores com parâmetros de resultado pretendido são evidências reais de que o sistema implementa parte da exigência. No entanto, essas especificações estão embutidas no código-fonte e não constituem documentação auditável por um auditor não-técnico.

A lacuna mais crítica é a ausência de qualquer documento formal de especificação de serviço no diretório `docs/` — sem esse artefato, um auditor externo não encontrará evidência objetiva de que a organização mantém informação documentada sobre as características dos seus serviços e os resultados pretendidos. As demais lacunas (campos opcionais críticos em registros de NC, desvinculação de indicadores dos processos, ausência de versionamento de especificações) são secundárias, mas contribuem coletivamente para a classificação Parcial.

A resolução das ações 1 e 2 dos Quick Wins — criação do `docs/product-specification.md` e validação obrigatória dos campos `category` e `source` em NCs — elevaria o score para a faixa Funcional (3.2+), tornando o sistema auditável para este requisito específico. A complementação com as ações estruturais 3 e 4 (procedimento operacional e vínculo de indicadores a processos) consolidaria o enquadramento como sistema Funcional sólido.
