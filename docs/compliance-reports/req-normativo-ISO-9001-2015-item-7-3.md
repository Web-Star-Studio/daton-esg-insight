# Resumo Executivo — Análise ISO 9001:2015 Item 7.3

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.3 — Conscientização
**Documento de validação:** Conformidade de Sistema (Codebase Módulos Transversais de Comunicação e Treinamento)

---

## Nota Global de Confiança: 4.5/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Central de Comunicação (`StakeholderCommunicationHub.tsx`) | **4.7/5** | Maduro |
| 02 | Gestão de Treinamentos (`GestaoTreinamentos.tsx`) | **4.8/5** | Maduro |
| 03 | Base de Conhecimento (`BaseConhecimento.tsx`) | **4.8/5** | Maduro |
| 04 | Dashboards de Qualidade / SGQ (`QualityDashboard`) | **4.2/5** | Maduro |
| | **Média aritmética** | **4.6/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 4 | Comunicação, Treinamentos, Base, Dashboards |
| Funcional (3-3.9) | 0 | — |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Central de Comunicação Ativa** (4.7) — O módulo `StakeholderCommunicationHub` permite emitir comunicados em massa sobre as Políticas e Objetivos da organização, com registro incontestável de envio e leitura (status "read"), assegurando que a informação chegou, passo fundamental para a "conscientização".
2. **Treinamentos de Integração e Conscientização** (4.8) — O CRUD robusto de `GestaoTreinamentos` com controle de categorias, obrigatórios e eficácia, permite à organização validar anualmente ou na integração a compreensão da "política" e "sua contribuição" para o SGQ.
3. **Repositório Unificado da Política do SGQ** (4.8) — A `BaseConhecimento.tsx` cataloga e garante o acesso imediato e sem barreiras ("disponível na extensão necessária") às normas atualizadas (como a Política da Qualidade) na aba interativa.
4. **Visibilidade dos Objetivos da Qualidade** (4.2) — O uso de Dashboards e indicadores expõe as métricas e painéis interativos. Ao exibir o status online do "Painel SGQ", a equipe adquire ciência dos "objetivos da qualidade pertinentes".
5. **Integração Workflow de NCs e Conscientização** (4.5) — O módulo de Não Conformidades retroalimenta a comunicação: as implicações de não se estar conforme (Item 7.3.d) ficam evidenciadas pelo acompanhamento de NCs na empresa (Dashboards Avançados), tangibilizando o impacto.

---

## Top 5 Lacunas Críticas

### 1. Aceite Digital de Política ("Policy Acknowledgment") (Severidade: ALTA)
**Impacto:** Item 7.3.a, b (Conscientização quanto à política e objetivos).
**Situação:** O sistema permite hospedar o documento na Base de Conhecimento e disparar por e-mail no Hub, mas não tem um componente específico mandatário de "Aceite Digital" (Termo de Ciência da Política) travando o dashboard do funcionário até a leitura/concordância do documento novo.
**Recomendação:** Implementar pop-up de leitura obrigatória ("Acknowledgement Check") quando novas versões de políticas forem adicionadas.

### 2. Painel de Perfil Individual focado em Contribuição SGQ (Severidade: MÉDIA)
**Impacto:** Item 7.3.c (Sua contribuição para eficácia).
**Situação:** O funcionário vê treinamentos e ações, mas o seu Perfil (`EmployeeProfile`) não destaca explicitamente "Como o seu cargo contribui para os Objetivos do SGQ" — link direto entre Descrição do Cargo (QualityWeb) e Objetivos (Painel).
**Recomendação:** No perfil do colaborador, instanciar widget: "Sua contribuição para o SGS/SGI", unindo o cargo atual às metas organizacionais atreladas àquela função.

---

## Cobertura por Sub-requisito 7.3

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.3.a Assegurar conscientização da Política da qualidade | Indireta. Funcional usando Base de Conhecimento + Communication Hub | Maduro |
| 7.3.b Objetivos da qualidade pertinentes | Ampla visibilidade pelo painel de indicadores SGQ generalista do ESG Insight | Maduro |
| 7.3.c Contribuição para eficácia do sistema | Pode ser embutido nos Treinamentos (`GestaoTreinamentos`), faltando amarração visual direta no perfil | Funcional |
| 7.3.d Implicações de não conformidade | Treinamentos contínuos e acesso livre às matrizes do módulo Qualidade servem como evidência gerencial | Maduro |

---

## Cobertura Análise Codebase

| # | Requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | Infraestrutura de disparos de comunicação | ✅ | Operativa via `StakeholderCommunicationHub.tsx` |
| P2 | Tracking de leitura/engajamento de políticas | ⚠️ | O Hub acusa recebimento/leitura mas não há um botão "Estou ciente da versão V3" de forma compulsória na UI global |
| P3 | Módulo de Onboarding / Conscientização | ✅ | Coberto pelas listas do Módulo Treinamentos (`useTraining`) |

**Resumo:** 2/3 implementados (✅), 1/3 parciais (⚠️), 0/3 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar flag e painel `Política SGQ` na tela inicial ("Assinatura Pendente") | Landing Page / BaseConhecimento | Fecha de vez o 7.3.a com evidência logada incontestável de conscientização. |

### Melhorias Estruturais (2-4 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 2 | Enriquecer `EmployeeProfile` com um card: "Seu papel ISO" puxando o target do cargo e referenciando 7.3.c | `GestaoFuncionarios` | Demonstra ao colaborador (e auditor) o elo claro da sua contribuição para os Objetivos da Qualidade. |

---

## Guia de Validação E2E

1. Logado como Admin, submeter a `Política Integrada` vigente na `BaseConhecimento.tsx`.
2. Acessar o `StakeholderCommunicationHub` e criar um disparo de e-mail / notificação para toda a demografia da empresa ("Todos Funcionários") sinalizando atualização na Política e nos Objetivos do SGQ.
3. Navegar para `GestaoTreinamentos` e abrir um "Programa Anual de Integração SGI" com lista de presença provando a eficácia e conscientização presencial das implicações de NCs (7.3.d).
4. Demonstrar a um auditor o status "read / lido" de comunicados pelo Communication Hub.

---

## Conclusão

Nota global de **4.6/5.0 (Sistema Maduro)**. 
A arquitetura do Daton ESG Insight soluciona organicamente as demandas de conscientização (item 7.3) aproveitando os super-módulos já existentes: O **Communication Hub**, a **Base de Conhecimento** e a **Gestão de Treinamentos**. Em conjunto, eles provêm uma retaguarda auditável formidável de que as informações sobre políticas, metas e impactos foram difundidas aos colaboradores. A maturidade será alcançável com nota unânime caso a plataforma evolua para exigir um "Termo de Confirmação/Ciência Digital" no acesso inicial (um pop-up bloqueante de Política Atualizada), sanando a lacuna mais comum nas auditorias de SGQ de garantir que 100% da base ativa declarou estar ciente das implicações ambientais/qualidade.
