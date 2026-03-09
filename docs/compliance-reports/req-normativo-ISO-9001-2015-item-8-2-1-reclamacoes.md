# Resumo Executivo — Análise ISO 9001:2015 Item 8.2.1 (Canal de Reclamações)

**Projeto:** Daton ESG Insight
**Data da Análise:** 2026-03-09
**Analista:** Compliance Auditor (IA)
**Tipo de Análise:** Tipo B — Conformidade do Sistema (análise de codebase, sem documento de validação externo)
**Item Normativo:** ISO 9001:2015, Seção 8.2.1 — Comunicação com o Cliente (foco: canal de reclamações e sugestões)

> **Nota de escopo:** Este relatório foca especificamente no requisito de canal para recepcionar reclamações e sugestões de clientes, complementando os demais aspectos de 8.2.1. Analisa em profundidade o módulo de ouvidoria (`OuvidoriaClientes.tsx`) e o serviço `customerComplaints.ts`, levando em conta o achado anterior de `mockComplaints: any[] = []` na interface.

---

## Score de Confiança

**2.1 / 5 — Parcial**

O canal de reclamações existe como conceito arquitetural no sistema (serviço completo, tabela no banco, tipagem, rota dedicada), mas está inacessível ao usuário final em produção porque a interface que o expõe (`OuvidoriaClientes.tsx`) está completamente desconectada do backend — exibindo sempre lista vazia e KPIs zerados. O botão "Nova Reclamação" não executa ação funcional de criação. Na prática, o sistema **não oferece um canal operacional** de reclamações e sugestões de clientes.

---

## Notas por Módulo

| Módulo / Componente | Nota | Observação |
|---|---|---|
| `customerComplaints.ts` — Serviço backend | 4.5 | CRUD completo, numeração automática `RCL-YYYY-NNNN`, log de comunicação, escalamento, SLA, rating pós-resolução |
| Tabela `customer_complaints` (Supabase) | 4.5 | Schema completo com 19 campos, incluindo rastreabilidade, status tipado e satisfação |
| `OuvidoriaClientes.tsx` — Interface do canal | 0.5 | `mockComplaints: any[] = []` (linha 23); todos os KPIs zerados; sem invocação de qualquer serviço real |
| Botão "Nova Reclamação" | 0.5 | Renderizado mas sem handler de ação; não abre modal nem navega para formulário de criação |
| Aba "Analytics" da ouvidoria | 1.0 | Valores hardcoded (ex: "15 (33%)", "2.5 dias") — não refletem dados reais |
| Aba "Relatórios" da ouvidoria | 1.5 | Botões de relatório presentes mas sem ação funcional implementada |
| Rota `/ouvidoria-clientes` | 3.0 | Rota registrada e protegida em `App.tsx`; página carrega mas sem dados |
| `todoRegistry.ts` | 2.0 | `OMBUDSMAN.HOOK` registrado com prioridade "medium" — confirma conhecimento da lacuna |

---

## Top 5 Pontos Fortes

1. **Serviço de reclamações com funcionalidade completa de backend:** `src/services/customerComplaints.ts` implementa todas as operações necessárias para um canal de reclamações: `createCustomerComplaint`, `getCustomerComplaints` (com filtros por status/prioridade/categoria), `resolveComplaint`, `escalateComplaint`, `addCommunicationLog` e `rateComplaintResolution`. O serviço é multi-tenant (usa `company_id` do perfil do usuário autenticado).

2. **Numeração automática e auditabilidade:** `createCustomerComplaint()` gera automaticamente o número no formato `RCL-{ANO}-{NNNN}` e persiste um log de comunicação inicial (`communication_log`) com timestamp de criação. Essa numeração garante rastreabilidade e é evidência de conformidade em auditorias.

3. **Schema de banco robusto:** A tabela `customer_complaints` (confirmada em `src/integrations/supabase/types.ts`) possui campos para: identificação do cliente (`customer_name`, `customer_email`, `customer_phone`, `customer_document`), categorização (`complaint_type`, `category`, `priority`), ciclo de resolução (`resolution_target_date`, `resolution_date`, `sla_met`), escalamento (`escalated`, `escalation_reason`) e satisfação pós-resolução (`customer_satisfaction_rating`, `customer_satisfaction_feedback`).

4. **Tipagem de entidades completa:** `src/types/entities/complaint.ts` define `CommunicationLogEntry` com tipos discriminados (`'creation' | 'communication' | 'resolution' | 'escalation'`), garantindo integridade do log de comunicação.

5. **Interface com UX adequada para o canal:** `OuvidoriaClientes.tsx` possui estrutura de UI correta — filtros por status/prioridade, abas de Reclamações/Analytics/Relatórios, cards de KPI (total, abertas, resolvidas, satisfação, SLA) — toda a navegação e experiência de usuário esperada para o canal está projetada. O problema é exclusivamente a falta de conexão com o backend.

---

## Top 5 Lacunas Críticas

1. **[CRÍTICA — Critical] Canal de reclamações inoperante em produção:** `src/pages/OuvidoriaClientes.tsx` linha 22–32 — o estado `mockComplaints` é um array vazio (`any[] = []`) e `mockStats` tem todos os campos zerados. Nenhuma chamada ao serviço `customerComplaints.ts` é feita em nenhum ponto do componente. O canal existe na arquitetura mas é invisível ao usuário. Do ponto de vista de auditoria ISO 9001, um canal de reclamações que sempre exibe zero registros **não pode ser considerado operacional**.

2. **[CRÍTICA — Critical] Botão "Nova Reclamação" sem funcionalidade:** O botão no header da página (`<Button><Plus /> Nova Reclamação</Button>`) não possui `onClick` handler. Clicar no botão não abre modal, não navega para formulário e não executa nenhuma ação. O cliente/usuário não consegue registrar uma reclamação pela interface principal.

3. **[Major] Analytics com dados hardcoded enganosos:** A aba "Analytics" exibe valores literais codificados no JSX (ex: `"15 (33%)"` para Qualidade, `"2.5 dias"` para Alta Prioridade). Esses valores não representam dados reais e podem levar gestores a tomar decisões baseadas em informações fictícias — o que é especialmente grave em contexto de SGQ.

4. **[Major] Ausência de formulário público ou auto-atendimento para registro de reclamação:** A ISO 9001:2015 menciona "fornecimento de informações relativas aos produtos e serviços" e canais de comunicação com o cliente. Não existe rota pública (sem autenticação) nem formulário de auto-atendimento que permita ao cliente final registrar uma reclamação diretamente. O módulo de `PublicForm.tsx` poderia ser usado para esse fim, mas não há configuração ou template nesse sentido.

5. **[Minor] Ausência de canal de sugestões distinto do canal de reclamações:** O módulo é chamado "Ouvidoria" mas trata apenas de `customer_complaints`. A tabela não possui campo `type_of_contact` que diferencie reclamação de sugestão de elogio. A norma menciona especificamente "reclamações e sugestões". O campo `complaint_type` existe mas aparece como texto livre, sem enum que inclua `sugestão`.

---

## Cobertura por Sub-requisito ISO 9001:2015 Item 8.2.1

| Sub-requisito | Texto Normativo | Evidência no Sistema | Nível de Atendimento |
|---|---|---|---|
| 8.2.1.a | "fornecer informações relativas a produtos e serviços" | Módulo de ouvidoria existe como rota protegida; sem canal público | Parcial |
| 8.2.1.b | "tratar consultas, contratos ou pedidos, incluindo alterações" | `createCustomerComplaint` funcional; interface sem handler | Ausente (interface) |
| 8.2.1.c | "obter retorno de informações relativas a produtos e serviços, incluindo reclamações" | Serviço backend completo; `rateComplaintResolution` implementado; interface desconectada | Parcial |
| 8.2.1.d | "manuseio ou controle de propriedade do cliente" | Não avaliado neste escopo | Não avaliado |
| 8.2.1.e | "estabelecer requisitos específicos para ações de contingência" | Não avaliado neste escopo | Não avaliado |
| Canal de reclamações (8.2.1.c foco) | Canal claramente estabelecido e operacional para recepcionar reclamações | Tabela + serviço OK; interface zerada e botão inoperante | Não atendido |
| Canal de sugestões | Recepcionar sugestões dos clientes | Não há campo ou fluxo específico para sugestões | Ausente |

---

## Plano de Ação Priorizado

### Faixa 1 — Ações Imediatas (0–15 dias)

| Prioridade | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| P1 | Implementar `useOmbudsman` hook com `useQuery(['complaints'], getCustomerComplaints)` e conectar ao estado do componente | `src/pages/OuvidoriaClientes.tsx` | Médio |
| P2 | Adicionar `useState` para modal de criação e conectar botão "Nova Reclamação" a `createCustomerComplaint` via formulário | `src/pages/OuvidoriaClientes.tsx` | Médio |
| P3 | Substituir `mockStats` por chamada real a `getComplaintsStats()` com `useQuery` | `src/pages/OuvidoriaClientes.tsx` | Baixo |

### Faixa 2 — Ações de Médio Prazo (15–60 dias)

| Prioridade | Ação | Arquivo Alvo | Esforço |
|---|---|---|---|
| P4 | Conectar aba "Analytics" a dados reais calculados a partir das reclamações retornadas pelo serviço | `src/pages/OuvidoriaClientes.tsx` | Médio |
| P5 | Implementar ações dos botões na aba "Relatórios" (geração de PDF ou exportação CSV das reclamações) | `src/pages/OuvidoriaClientes.tsx` | Alto |
| P6 | Adicionar campo `contact_type` com enum (`reclamacao | sugestao | elogio | consulta`) à tabela `customer_complaints` e ao serviço | `src/services/customerComplaints.ts` + migration Supabase | Médio |

### Faixa 3 — Canal Público e Consolidação (60–120 dias)

| Prioridade | Ação | Descrição | Esforço |
|---|---|---|---|
| P7 | Criar formulário público de reclamações | Usar `PublicForm.tsx` + `customForms.ts` para criar rota `/reclamacao` acessível sem autenticação, com link visível no produto | Alto |
| P8 | Documentar o canal formalmente | Criar `docs/processos/canal-reclamacoes.md` com: URL do canal, responsável, SLA por prioridade, fluxo de escalamento | Baixo |
| P9 | Adicionar atalho ao canal no dashboard principal | KPI rápido no Dashboard com total de reclamações abertas e link direto para `/ouvidoria-clientes` | Baixo |

---

## Guia de Validação E2E

Para verificar conformidade após implementação das ações P1–P3:

1. Acessar `/ouvidoria-clientes` e confirmar que a lista de reclamações é carregada do banco (pode estar vazia, mas não deve usar mock).
2. Clicar em "Nova Reclamação" e confirmar que um formulário/modal é exibido com campos para: nome do cliente, tipo, categoria, prioridade, assunto e descrição.
3. Preencher o formulário e submeter; confirmar que o número `RCL-2026-XXXX` é gerado e exibido.
4. Confirmar que os KPIs (total, abertas, SLA) refletem os dados reais após criação.
5. Resolver a reclamação e aplicar nota de satisfação; confirmar atualização do KPI de satisfação.
6. Verificar que o `communication_log` registra os eventos de criação e resolução.

---

## Conclusão

O item 8.2.1 (canal de reclamações) apresenta **Score 2.1/5 — Parcial**. O diagnóstico é preciso: existe um backend completo e bem estruturado para gestão de reclamações, mas o canal está **inoperante do ponto de vista do usuário final** por falta de conexão entre a interface `OuvidoriaClientes.tsx` e o serviço `customerComplaints.ts`. Esta é uma lacuna de implementação de frontend, não de arquitetura. O esforço para fechar essa não-conformidade é **médio e bem delimitado**: as ações P1, P2 e P3 da Faixa 1 são suficientes para tornar o canal operacional e atender ao requisito mínimo da norma. A severidade é **Critical** porque um SGQ sem canal de reclamações funcional representa falha direta no requisito normativo mais visível da cláusula 8.2.1.
