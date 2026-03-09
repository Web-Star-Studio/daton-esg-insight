# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-04

## Item 003

**Validação solicitada**: Verificar se a organização possui um levantamento, avaliação e respostas a riscos e oportunidades.

**Requisito Normativo**: ISO 9001:2015, item 6.1

**Documentos de validação**:
- `FPLAN 001 - Formulário de Planejamento do Sistema de Gestão.xlsx`
- `FPLAN 020 - GERENCIAMENTO DAS AÇÕES .xlsm`

### Evidências encontradas

- O `FPLAN 001` possui levantamento estruturado de riscos e oportunidades na aba **`A) SWOT SGI`** com **84 fatores** avaliados (Força, Fraqueza, Oportunidade, Ameaça), com campos de performance, relevância, resultado e decisão de tratamento.
- O `FPLAN 001` define critérios de avaliação na aba **`A0) METODOLOGIA`**, incluindo regra de criticidade:
  - pontuação `8 a 12` = risco alto;
  - pontuação `13 a 16` = risco extremo;
  - ambos requerem ações.
- A metodologia do `FPLAN 001` referencia explicitamente o tratamento em `FPLAN 020` e `FPLAN 007`.
- O `FPLAN 020` formaliza respostas e acompanhamento na aba **`METODOLOGIA`**, com definição de responsabilidades e periodicidade:
  - ações de origens diversas (incluindo SWOT);
  - gestão das ações **uma vez por mês**.
- No `FPLAN 020`, foram identificadas **33 ações SWOT únicas** distribuídas por status:
  - `23` concluídas;
  - `6` contínuas;
  - `4` em andamento;
  - `1` não iniciada.
- Em cruzamento entre os fatores SWOT classificados como **“requer ações”** no `FPLAN 001` (18 fatores) e ações de resposta no `FPLAN 020`, há rastreabilidade explícita para **13 de 18** fatores.
- A aba **`CONCLUÍDA`** do `FPLAN 020` inclui conclusão/eficácia das ações e registro declarando eficácia das ações concluídas.

### Pontos de atenção

- **5 de 18** fatores SWOT classificados como “requer ações” não apresentaram vínculo textual claro com ação correspondente no `FPLAN 020`.
- Entre as ações SWOT em aberto, existem itens em `EM ANDAMENTO` e `NÃO INICIADO`, o que indica execução parcial da resposta ao risco/oportunidade no momento da evidência.
- A rastreabilidade entre fator de risco e ação ainda é majoritariamente textual; faltam identificadores cruzados obrigatórios para rastreio automático 1:1.

### Score de implementação (0 a 5)

**4.1 / 5.0**

### Justificativa do score

O requisito 6.1 está bem implementado em seus três pilares: levantamento (SWOT estruturada), avaliação (metodologia com critérios de criticidade) e resposta (plano de ações com status, prazo, responsáveis e eficácia). O score não é máximo devido a lacunas de rastreabilidade completa entre todos os fatores “requer ações” e suas respostas formais no plano.

### Guia de validação E2E (auditoria prática)

1. No `FPLAN 001`, filtrar fatores com decisão “Relevante: requer ações”.
2. Para cada fator, rastrear ação correspondente no `FPLAN 020` por descrição e/ou código interno.
3. Confirmar para cada ação: responsável, prazo, status atual, histórico de atualização e conclusão/eficácia (quando encerrada).
4. Verificar aderência à periodicidade mensal de gestão definida na metodologia do `FPLAN 020`.
5. Critério de aceite recomendado:
   - PASSA: 100% dos fatores “requer ações” com ação rastreável, status controlado e evidência de eficácia quando concluída.
   - FALHA: fatores críticos sem ação correspondente, ou sem atualização periódica, ou sem evidência de eficácia no encerramento.

---

## Próximos Itens

As próximas validações devem manter esta convenção de arquivo em `docs/compliance-reports`.
