# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-04

## Item 004

**Validação solicitada**:
- Verificar se a organização possui objetivos e metas claramente estabelecidas.
- Verificar se a organização possui planejamento para atingimento das metas, com definição de ações, prazos, recursos e responsáveis.

**Requisito Normativo**: ISO 9001:2015, item 6.2

**Documento de validação**:
- `FPLAN 006 - GESTÃO DE INDICADORES 2025.xlsx`

### Evidências encontradas

- A aba **`KPIs 2025`** possui estrutura formal de gestão com campos de:
  - `OBJETIVO`;
  - `INDICADOR`;
  - `MEDIÇÃO`;
  - `RESPONSÁVEL`;
  - `PERIODICIDADE DE MEDIÇÃO`;
  - `META`;
  - acompanhamento mensal (JAN-DEZ), média, acumulado e progresso.
- Foram identificadas **127 linhas de indicadores** em 2025.
- Cobertura dos campos principais na base 2025:
  - `INDICADOR`: 127/127;
  - `RESPONSÁVEL`: 127/127;
  - `PERIODICIDADE`: 127/127;
  - `META`: 101/127;
  - `RAC`: 127/127.
- Os objetivos estratégicos estão vinculados aos indicadores (ex.: `Q1`, `Q2`, `Q3`, `A1`, `S1`), com continuidade para as linhas subsequentes.
- Existem sinais de controle de performance e necessidade de reação por status e RAC:
  - status em `Vencido` e `Alimentado`;
  - RAC com marcações `Precisa de plano de ação`, `Não precisa de plano de ação` e `Sem dados`.

### Pontos de atenção

- O arquivo evidencia claramente objetivos, metas e responsáveis dos indicadores, porém o **planejamento de atingimento** aparece de forma parcial no próprio documento.
- O campo RAC, em grande parte, sinaliza necessidade de plano, mas não descreve de forma completa, dentro do `FPLAN 006`, os quatro elementos exigidos para cada meta crítica:
  - ação detalhada;
  - prazo da ação;
  - recurso necessário;
  - responsável da ação.
- Há volume relevante de indicadores com RAC em `Sem dados`, o que reduz evidência de plano formal de resposta no próprio registro.
- Parte dos indicadores também não apresenta meta preenchida no momento da evidência (26/127 sem meta).

### Score de implementação (0 a 5)

**3.7 / 5.0**

### Justificativa do score

O requisito 6.2 está **bem atendido** na definição de objetivos e metas e no monitoramento por indicadores. O score reduz porque, para a segunda parte do requisito (planejamento para atingir metas com ações, prazos, recursos e responsáveis), o `FPLAN 006` sozinho mostra apenas sinalização parcial (principalmente via RAC/status), sem detalhamento completo e padronizado desses quatro elementos para todos os casos críticos.

### Guia de validação E2E (auditoria prática)

1. Selecionar amostra mínima de 10 indicadores em `Vencido` e/ou com RAC `Precisa de plano de ação`.
2. Para cada indicador, confirmar no `FPLAN 006`: objetivo, meta, responsável e periodicidade.
3. Exigir evidência do plano de atingimento para cada amostra:
   - ação definida;
   - prazo;
   - recurso necessário;
   - responsável pela execução.
4. Validar execução do plano comparando evolução mensal do indicador (JAN-DEZ) e atualização do RAC.
5. Critério de aceite recomendado:
   - PASSA: metas claras + plano de atingimento completo e rastreável para indicadores críticos.
   - FALHA: indicador crítico sem plano completo (ação, prazo, recurso, responsável) ou sem atualização de execução.

---

## Próximos Itens

As próximas validações devem manter esta convenção de arquivo em `docs/compliance-reports`.
