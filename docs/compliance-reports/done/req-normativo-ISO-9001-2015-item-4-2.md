# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-05

## Item 002

**Validação solicitada**: Verificar se empresa possui mapeamento das demandas de suas partes interessadas, e controla o atendimento aos seus requisitos.

**Requisito Normativo**: ISO 9001:2015, item 4.2

**Documento de validação**: `FPLAN 001 - Formulário de Planejamento do Sistema de Gestão.xlsx`

### Evidências encontradas

- Existe aba dedicada **`B) PARTES INTERESSADAS`** com estrutura explícita para:
  - identificação das partes interessadas;
  - requisitos/demandas esperados da empresa;
  - papel da parte interessada;
  - avaliação de relevância para o sistema de gestão;
  - indicação de requisito legal aplicável;
  - forma de monitoramento/atendimento.
- Foram identificados **23 registros** de partes interessadas, com preenchimento completo dos campos principais (sem lacunas nas colunas de mapeamento e monitoramento).
- Classificação de relevância para o SGI:
  - **17** marcadas como `SIM`;
  - **6** marcadas como `NÃO`.
- Classificação de requisito legal aplicável:
  - **9** marcadas como `SIM`;
  - **14** marcadas como `NÃO`.
- Existem mecanismos de controle/atendimento descritos no próprio mapeamento, incluindo evidências como:
  - análise crítica do SGI e auditorias;
  - indicadores e medições de desempenho;
  - pesquisa de satisfação de clientes;
  - avaliação e qualificação de fornecedores;
  - referência a controles legais (`FPLAN 002` e `FPLAN 003`) quando aplicável.
- Há evidência de manutenção do mapeamento no **`Histórico de Revisões`**, com atualizações em:
  - 2023-09-01;
  - 2023-09-19;
  - 2024-06-30;
  - 2025-01-08.

### Pontos de atenção

- O documento fonte atende ao mapeamento base, mas a operação contínua agora depende do cadastro e manutenção dos requisitos no submódulo interno da plataforma.
- O pacote atual não faz backfill automático de planilhas históricas; o cadastro inicial da matriz operacional segue manual no módulo.
- A aderência prática continua condicionada ao uso do fluxo com vínculo documental e revisão anual, não apenas à existência do cadastro.

### Score de implementação (0 a 5)

**5.0 / 5.0**

### Justificativa do score

O requisito passou a estar **integralmente suportado pelo sistema**: além do mapeamento das partes interessadas, o Daton agora possui matriz operacional por requisito, rastreabilidade de responsável e status, exigência de evidência documental para fechamento, revisão anual formal com próximo vencimento calculado e alertas automáticos 30/7/0 para itens não atendidos.

### Guia de validação E2E (auditoria prática)

1. Acessar `/matriz-partes-interessadas` no módulo **QUALIDADE**.
2. Cadastrar um requisito ISO 9001:2015 item 4.2 para uma parte interessada existente, definindo responsável e prazo de revisão.
3. Tentar concluir o atendimento sem evidência documental: o sistema deve bloquear a ação.
4. Anexar evidência com `document_id` vinculado e concluir o requisito.
5. Registrar revisão anual da matriz e confirmar atualização automática do próximo vencimento.
6. Validar alertas 30/7/0 para requisitos não atendidos com revisão próxima, urgente ou vencida.
7. Critério de aceite recomendado:
   - PASSA: requisito mapeado + responsável + status + evidência documental obrigatória + revisão anual formal + alerta operacional.
   - FALHA: fechamento sem documento, ausência de revisão anual, ou inexistência de rastreabilidade por requisito.

---

## Status de Implementação — 2026-03-05

### Ações Entregues

| # | Ação | Status | Evidência |
|---|------|--------|-----------|
| 1 | Matriz operacional por requisito | ✅ Implementado | rota `/matriz-partes-interessadas`, tabela `stakeholder_requirements`, filtros, KPIs e ações operacionais no submódulo **QUALIDADE** |
| 2 | Rastreabilidade completa por requisito | ✅ Implementado | responsável, status, última verificação, vínculo opcional com `compliance_tasks`, histórico de evidências e seleção de stakeholder existente |
| 3 | Revisão anual formal da matriz | ✅ Implementado | tabela `stakeholder_matrix_reviews`, trigger de `next_review_due_date = review_date + 1 ano` e atualização operacional do prazo de revisão |
| 4 | Evidência documental obrigatória para fechamento | ✅ Implementado | trigger `ensure_stakeholder_requirement_evidence_on_closure` + validação de UX antes de **Concluir atendimento** |
| 5 | Alertas automáticos 30/7/0 | ✅ Implementado | action `check_stakeholder_requirement_reviews` em `smart-notifications`, `action_url` para `/matriz-partes-interessadas` e agendamento diário via `pg_cron` |

### Guia E2E de Validação

1. **Cadastrar requisito 4.2**
   - Acesse `/matriz-partes-interessadas`.
   - Clique em **Novo requisito**.
   - Selecione a parte interessada, preencha título, método de monitoramento, responsável e vencimento da revisão.

2. **Validar bloqueio sem documento**
   - No requisito criado, acione **Concluir atendimento** sem anexar evidência documental.
   - O sistema deve bloquear a conclusão e direcionar para anexar evidência.

3. **Anexar evidência válida**
   - Em **Anexar evidência**, selecione um documento do GED.
   - Salve a evidência e confirme que o contador aumenta.
   - Tente novamente **Concluir atendimento**: a conclusão deve ser permitida.

4. **Registrar revisão anual**
   - Clique em **Registrar revisão anual**.
   - Preencha data, resumo e referência da análise crítica.
   - Verifique que a próxima revisão é calculada automaticamente para +1 ano.

5. **Conferir painel de alertas**
   - Mantenha requisitos não atendidos com vencimentos em 30 dias, 7 dias e 0/atrasado.
   - Acione **Processar alertas** ou aguarde a rotina diária.
   - Confirme exibição do painel 30/7/0 e geração de notificação com rota `/matriz-partes-interessadas`.

---

## Próximos Itens

As próximas validações serão mantidas em `docs/compliance-reports/done` para preservar o histórico dos itens já encerrados.
