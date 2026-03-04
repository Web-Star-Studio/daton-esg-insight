# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-04

## Item 001

**Validação solicitada**: Verificar existência de Planejamento Estratégico considerando análise SWOT, com manutenção periodicamente estabelecida.

**Requisito Normativo**: ISO 9001:2015, item 4.1

**Documento de validação**: `FPLAN 001 - Formulário de Planejamento do Sistema de Gestão.xlsx`

### Evidências encontradas

- Existe estrutura formal de análise SWOT na aba **`A) SWOT SGI`** com 84 fatores cadastrados:
  - 48 Forças
  - 14 Fraquezas
  - 9 Oportunidades
  - 13 Ameaças
- Existe metodologia de avaliação na aba **`A0) METODOLOGIA`**, incluindo critérios de decisão e tratamento:
  - "Irrelevante: facultativo o estabelecimento de ações"
  - "Relevante: requer ações"
  - indicação de tratamento em `FPLAN 020` e `FPLAN 007 - Mudanças`.
- Existe direcionamento estratégico na aba **`B)DIRECIONAMENTO ESTRATÉGICO SV`** com resumo SWOT e conclusão de contexto estratégico.
- Existe planejamento estratégico formal na aba **`C) ESCOPO POLÍTICA OBJETIVOS`** (missão, visão, valores e objetivos Q1/Q2/Q3/S1/S2/A1/A2).
- Existe histórico de manutenção/revisões na aba **`Histórico de Revisões`**, com registros de alterações de SWOT em datas como:
  - 2023-09-30
  - 2024-05-27
  - 2024-06-30
  - 2025-03-15
  - 2025-08-18

### Pontos de atenção

- A periodicidade da revisão SWOT é **evidenciada por histórico**, mas não está claramente descrita no arquivo como regra explícita (ex.: "revisão anual obrigatória").
- Há inconsistências de controle de revisão (ex.: ordem de revisões 04/05 em datas de 2021; registro com data 2025-08-18 sem número de revisão preenchido).
- Na aba SWOT, itens classificados como "Relevante: requer ações" não exibem referência direta de plano de ação na coluna "REF. PLANO DE AÇÃO"; a metodologia aponta para planos externos (`FPLAN 020`/`FPLAN 007`), então a rastreabilidade depende desses documentos complementares.

### Score de implementação (0 a 5)

**4.0 / 5.0**

### Justificativa do score

O requisito está **substancialmente implementado**: há planejamento estratégico estruturado, uso consistente de SWOT, metodologia de tratamento e histórico de revisões. O score não é máximo devido à ausência de periodicidade formal explícita no próprio documento e a lacunas/inconsistências de rastreabilidade/revisão.

### Guia de validação E2E (auditoria prática)

Como esta checagem é majoritariamente documental, o E2E aplicável é de **rastreabilidade ponta a ponta**:

1. Confirmar no `FPLAN 001` a presença das abas de metodologia, SWOT, direcionamento e objetivos estratégicos.
2. Amostrar pelo menos 5 linhas de SWOT marcadas como "Relevante: requer ações" e rastrear cada uma até evidência de tratamento em `FPLAN 020` e/ou `FPLAN 007`.
3. Verificar no histórico se houve revisão em ciclo definido internamente (ex.: anual), comparando datas de revisão com o padrão esperado.
4. Validar aprovação em reunião de análise crítica (ata ou registro no sistema SGI/SOGI) para a última revisão SWOT.
5. Critério de aceite recomendado:
   - PASSA: SWOT vigente + planejamento estratégico alinhado + rastreabilidade de ações + revisão dentro do ciclo definido.
   - FALHA: ausência de revisão no ciclo, ações sem evidência, ou documento sem versão vigente.

---

## Próximos Itens

As próximas validações serão adicionadas neste mesmo arquivo para manter o relatório centralizado.
