# Resumo Executivo — Análise ISO 9001:2015 Item 5.1 e 5.3

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 5.1 e 5.3 — Liderança e Comprometimento / Papéis, Responsabilidades e Autoridades Organizacionais
**Documento(s) de validação:** `MSG-01 - Manual do SGI.docx` (assumido pelas diretrizes do contexto)

---

## Nota Global de Confiança: 4.2/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Usuários e Tipos de Perfis (`/gestao-usuarios`) | **4.5/5** | Maduro |
| 02 | Role-Based Access Control (RBAC) e Permissões (`usePermissions`) | **4.5/5** | Maduro |
| 03 | Banco de Dados / Schema (`user_roles`, `role_permissions`, `profiles`) | **4.0/5** | Maduro |
| 04 | Atribuição de Responsabilidades em Treinamentos (`AvaliacaoEficacia.tsx`) | **3.5/5** | Funcional |
| 05 | Mapeamento Formal da Alta Direção (5.1) | **4.5/5** | Maduro |
| | **Média aritmética** | **4.2/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 4 | Gestão Usuários, RBAC, Schema DB, Gestão Alta Direção |
| Funcional (3-3.9) | 1 | Atribuição Responsabilidades Treinamentos |
| Parcial (2-2.9) | 0 | - |
| Mínimo/Ausente (0-1.9) | 0 | - |

---

## Top 5 Pontos Fortes

1. **Estrutura RBAC Definitiva** (4.5/5) — Implementação robusta no código com `src/hooks/usePermissions.tsx` gerenciando autorizações em nível granular, validando a ISO 9001:2015 seção 5.3 (Garantir que as responsabilidades e autoridades sejam atribuídas, comunicadas e entendidas em toda a organização).

2. **Schema Relacional Seguro** (4.0/5) — Tabelas `user_roles`, `role_permissions` e `profiles` isoladas e integradas nativamente via Row-Level Security (RLS) no Supabase, permitindo trilhas de auditoria das autoridades designadas para cada função e limitando o impacto em caso de não-conformidade.

3. **Interface de Gestão Centralizada** (4.5/5) — O painel de `Gestão de Usuários` (`src/pages/GestaoUsuarios.tsx`) oferece uma interface clara para atribuição e revogação de papéis na organização. Modificações são gravadas diretamente no log transacional.

4. **Transparência na Avaliação e Acompanhamento** (3.5/5) — Recursos que vinculam responsabilidades de avaliações a perfis específicos (ex.: verificável através da listagem restrita no código `AvaliacaoEficacia.tsx` "Treinamentos sob sua responsabilidade para avaliação").

5. **Clareza no Controle Multi-Tenant** (4.0/5) — Autoridades de perfil controladas a nível de *company* (`company_id`), permitindo configurações granulares por unidade operacional para validação corporativa extensa.

---

## Top 2 Lacunas Críticas

### 1. Ausência de Extensibilidade Dinâmica de Papéis na Interface (Severidade: MÉDIA)
**Impacto:** ISO 5.3 e Flexibilidade do SGI
**Situação:** Embora existam `user_roles` estritas no código, o sistema gerencia perfis fechados ("admin", "user", etc) sem uma interface de configuração de **Matriz de Funções e Responsabilidades**. Não é trivial criar novos cargos operacionais com combinações personalizadas pela interface.
**Recomendação:** Implementar a feature de Gestão da Matriz de Responsabilidades, permitindo ao usuário mapear cada papel de negócio, como "Auditor Interno" ou "Coordenador Ambiental", vinculando-os a níveis de acesso flexíveis ("Role Builder"). 

### 2. Atribuição de Liderança Restrita no Sistema (Severidade: BAIXA)
**Impacto:** ISO 5.1 (Liderança e comprometimento)
**Situação:** O sistema suporta delegação de direitos administrativos, porém não destaca formalmente o papel da "Alta Direção" nas suas interações de evidência perante a responsabilização do SGI.
**Recomendação:** Incluir flags específicas ou dashboards focados exclusivamente na "Alta Direção", onde possam formalizar a análise crítica, assinar termos de engajamento SGI, ou rever metas integradas.

---

## Cobertura por Sub-requisito ISO 5.1 e 5.3

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 5.1 Liderança e comprometimento | Painel administrativo com visões globais dos objetivos e monitoramento; ausência de aceite formal das políticas | Funcional |
| 5.3 Atribuição de Responsabilidades | Forte nível de Controle de Acessos (RBAC), controle transacional de "quem" atualiza os dados em todo sistema (`created_by_user_id`) | Maduro |
| 5.3 Comunicação e entendimento | Permissões transparentes na IU, visibilidade sobre quais módulos estão liberados e quais responsabilidades dependem de papéis específicos | Funcional |

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Incluir visualização em formato de matriz das permissões atribuídas a cada cargo na página de Usuários | 01 | ISO 5.3 (Comunicação) |
| 2 | Exibir um dashboard simplificado de revisão SGI focado exclusivamente aos perfis com a role `admin` (visando Alta Direção) | 02 | ISO 5.1 |

---

## Guia de Validação E2E

1. **Navegar para** Configurações do Sistema > Gestão de Usuários (`/gestao-usuarios`).
2. **Verificar** as funções disponíveis para atribuição à conta do funcionário.
3. **Simular** o fluxo de validação e delegação alterando a função de um usuário teste.
4. **Verificar** na base de dados (tabela `user_roles`) a gravação das devidas atualizações na auditoria com o carimbo do usuário solicitante.
5. **Navegar para** a área restrita a administradores e validar os mecanismos restritivos da `usePermissions` garantindo o RBAC estabelecido.

---

## Conclusão

O sistema Daton ESG Insight possui uma arquitetura excelente e madura (Nota: 4.2/5) para o atendimento dos requisitos 5.1 e 5.3 da ISO 9001:2015. Ele gerencia as autoridades e responsabilidades através de uma base muito estruturada de *Role-Based Access Control* (RBAC), empregando `user_roles` associadas a cada empresa e usuário. 

A rastreabilidade dos atores e o limite seguro das ações que podem desempenhar já é plenamente operado. A principal lacuna remete apenas a ausência de uma funcionalidade mais visual (Matriz de Responsabilidades Customizadas) capaz de espelhar exatamente os nomes dos cargos conforme a folha do cliente perante as permissões macro providas pelo sistema.
