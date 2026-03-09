# Resumo Executivo — Análise ISO 9001:2015 Item 8.2.1

**Norma:** ISO 9001:2015
**Item:** 8.2.1 — Comunicação com o cliente
**Data da análise:** 2026-03-09
**Tipo de análise:** Tipo B — Conformidade do Sistema (codebase)
**Score de Confiança:** 3.1 / 5 — Funcional com lacunas significativas

---

## Contexto do Requisito

O item 8.2.1 exige que a organização determine e implemente arranjos eficazes para comunicação com os clientes, cobrindo cinco dimensões obrigatórias:

- **a)** Informações relativas a produtos e serviços;
- **b)** Tratamento de consultas, contratos ou pedidos, incluindo alterações;
- **c)** Obtenção de realimentação (feedback) dos clientes, incluindo suas reclamações;
- **d)** Manuseio ou controle de propriedade do cliente;
- **e)** Estabelecimento de requisitos específicos para ações de contingência, quando pertinente.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|---|---|---|---|
| Gestão de Reclamações (serviço) | `src/services/customerComplaints.ts` | 4.0 | Modelo de dados robusto, ciclo de vida completo |
| Interface Ouvidoria | `src/pages/OuvidoriaClientes.tsx` | 1.5 | Completamente desconectada — `mockComplaints: any[] = []` |
| Central de Comunicação com Stakeholders | `src/components/StakeholderCommunicationHub.tsx` | 3.5 | Multi-canal funcional, conectado ao banco via `stakeholder_communications` |
| Matriz de Partes Interessadas | `src/pages/MatrizPartesInteressadas.tsx` | 3.8 | Rota ativa, stakeholders com `preferred_communication` tipado |
| Serviço de Stakeholders | `src/services/stakeholders.ts` | 3.5 | `preferred_communication: 'email' | 'phone' | 'meeting' | 'survey'` tipado no modelo |
| Requisitos de Partes Interessadas | `src/services/stakeholderRequirements.ts` | 4.0 | Rastreamento formal de requisitos com evidências |
| Informações sobre produtos/serviços | `src/pages/Funcionalidades.tsx`, `src/data/faqData.ts` | 2.5 | FAQ e descritivo de funcionalidades presentes, mas sem canal formal de solicitação de informação |
| Propriedade do cliente | Não localizado módulo dedicado | 0 | Não verificável no escopo desta análise |
| Contingência | Não localizado | 0 | Sem módulo de comunicação de contingência para clientes |

---

## Top 5 Pontos Fortes

1. **Modelo de dados completo para reclamações** — `src/services/customerComplaints.ts` implementa `communication_log`, `resolution_target_date`, `sla_met`, `escalated`, `customer_satisfaction_rating`, cobrindo o ciclo completo de 8.2.1.c com múltiplos sub-campos.

2. **Canal preferencial de comunicação por stakeholder** — `src/services/stakeholders.ts` tipifica `preferred_communication: 'email' | 'phone' | 'meeting' | 'survey'` a nível de modelo, permitindo personalização por parte interessada.

3. **Central de Comunicação multi-canal** — `src/components/StakeholderCommunicationHub.tsx` oferece envio/recebimento de comunicações com tipagem de canal (e-mail, reunião, telefone, pesquisa, documento), prioridade e agendamento — conectada a `stakeholder_communications` no banco.

4. **Realimentação de satisfação estruturada** — `rateComplaintResolution()` em `customerComplaints.ts` persiste `customer_satisfaction_rating` (numérico) e `customer_satisfaction_feedback` (texto livre), suportando 8.2.1.c.

5. **Escalonamento com registro** — `escalateComplaint()` registra `escalation_reason`, altera `priority` para 'Alta' e adiciona entrada no `communication_log`, garantindo rastreabilidade de situações críticas.

---

## Top 5 Lacunas Críticas

1. **[Crítica] Interface de Ouvidoria completamente desconectada do backend** — `src/pages/OuvidoriaClientes.tsx` linha 23: `const mockComplaints: any[] = []`. O serviço `customerComplaints.ts` existe e é funcional, mas a UI principal do módulo não invoca nenhuma função real. Usuários que acessam `/ouvidoria-clientes` veem dados zerados permanentemente. Impacta diretamente 8.2.1.c.

2. **[Major] Ausência de canal formal para informações sobre produtos/serviços (8.2.1.a)** — Não há módulo dedicado para clientes solicitarem informações sobre produtos/serviços. O `faqData.ts` é estático e unidirecional. Não há formulário de contato, chat ou sistema de tickets para consultas pré-contratuais.

3. **[Major] Ausência de módulo de comunicação de contingência (8.2.1.e)** — Não foi localizado nenhum módulo ou processo para comunicar clientes sobre ações de contingência (interrupções, atrasos, falhas de serviço). O sistema não registra eventos de contingência vinculados a comunicações com clientes.

4. **[Major] Templates de comunicação hardcoded e limitados** — `StakeholderCommunicationHub.tsx` usa templates mockados em código (linha 158–177), não persistidos em banco. Apenas dois templates estáticos ("Relatório Trimestral", "Convite para Reunião") — sem templates específicos para comunicação de produto, reclamação ou contingência.

5. **[Observação] Rastreabilidade de realimentação não integrada ao SGQ** — A avaliação de satisfação (`customer_satisfaction_rating`) em `customer_complaints` é isolada; não há integração com indicadores ESG, metas de qualidade ou análise crítica da direção, limitando o uso desta informação no ciclo de melhoria conforme 9.1.2.

---

## Cobertura por Sub-requisito

| Sub-requisito | Status | Evidência / Lacuna |
|---|---|---|
| 8.2.1.a — Informações sobre produtos e serviços | Parcial | `faqData.ts` + `Funcionalidades.tsx` presentes; sem canal de consulta interativo |
| 8.2.1.b — Consultas, contratos e pedidos (incl. alterações) | Parcial | `supplier_contracts` cobre lado fornecedor; sem módulo para pedidos de clientes finais |
| 8.2.1.c — Feedback e reclamações | Funcional (backend) / Inoperante (UI) | `customerComplaints.ts` completo; `OuvidoriaClientes.tsx` usa mock vazio |
| 8.2.1.d — Propriedade do cliente | Não verificável | Nenhum módulo identificado para manuseio de propriedade do cliente |
| 8.2.1.e — Comunicação de contingência | Ausente | Nenhum módulo ou registro identificado |

---

## Plano de Ação Priorizado

### Faixa 1 — Crítico (resolver em até 30 dias)

| # | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| 1 | Conectar `OuvidoriaClientes.tsx` ao `customerComplaints.ts`: substituir `mockComplaints: any[] = []` por hook `useQuery(getCustomerComplaints)` e implementar `createCustomerComplaint` no botão "Nova Reclamação" | `src/pages/OuvidoriaClientes.tsx` | Médio |
| 2 | Adicionar formulário funcional de abertura de reclamação com campos obrigatórios: `customer_name`, `complaint_type`, `category`, `subject`, `description` | `src/pages/OuvidoriaClientes.tsx` | Médio |

### Faixa 2 — Major (resolver em até 90 dias)

| # | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| 3 | Criar canal de solicitação de informações (tickets de consulta) com tipo 'inquiry' e integração a `stakeholder_communications` | Novo componente + `src/services/customerComplaints.ts` | Alto |
| 4 | Migrar templates de comunicação para tabela `communication_templates` no banco, adicionando pelo menos templates para reclamação, informação de produto e contingência | `src/components/StakeholderCommunicationHub.tsx` + migration | Médio |
| 5 | Criar registro de eventos de contingência com campo `notify_customers_at` e integração ao log de comunicação | Nova tabela `contingency_events` + serviço | Alto |

### Faixa 3 — Melhoria (até 180 dias)

| # | Ação | Esforço |
|---|---|---|
| 6 | Integrar `customer_satisfaction_rating` ao painel de indicadores de qualidade e à análise crítica da direção (9.3) | Médio |
| 7 | Adicionar campo `customer_property_id` com vínculo a módulo de propriedade do cliente para cobrir 8.2.1.d | Médio |

---

## Guia de Validação E2E

Para considerar 8.2.1 atendido, um auditor deve conseguir demonstrar:

1. **Abrir uma reclamação** via UI `/ouvidoria-clientes` e verificar persistência no banco com `complaint_number` gerado automaticamente.
2. **Visualizar o `communication_log`** de uma reclamação com entradas de criação, comunicação e resolução.
3. **Enviar comunicação** via `StakeholderCommunicationHub` para um cliente (categoria `customers`) e verificar registro em `stakeholder_communications`.
4. **Avaliar satisfação** de uma reclamação resolvida e consultar `customer_satisfaction_rating` no banco.
5. **Demonstrar template** de comunicação de produto/serviço aplicado a uma mensagem enviada.

---

## Conclusão

O codebase demonstra capacidade técnica para comunicação com clientes — especialmente no serviço de reclamações (`customerComplaints.ts`) e na Central de Comunicação (`StakeholderCommunicationHub.tsx`). No entanto, a desconexão crítica entre a UI principal de Ouvidoria e o backend subjacente torna a cobertura de 8.2.1.c inoperante para o usuário final. Adicionalmente, as dimensões 8.2.1.a (informações sobre produtos), 8.2.1.d (propriedade do cliente) e 8.2.1.e (contingência) possuem cobertura insuficiente ou ausente. O score 3.1/5 reflete uma fundação técnica sólida mas com lacunas de integração e escopo que impedem a conformidade plena.
