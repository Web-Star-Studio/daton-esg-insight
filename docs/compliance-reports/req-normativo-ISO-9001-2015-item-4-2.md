# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-04

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

- O documento mostra **como monitorar/atender**, mas não consolida status operacional por requisito (ex.: última verificação, responsável, situação em aberto/fechado) na própria aba.
- A periodicidade da revisão é observável pelo histórico, porém não está explicitada como regra formal única (ex.: revisão anual mandatória).
- Parte das evidências de atendimento depende de documentos e registros correlatos (`FPLAN 002`, `FPLAN 003`, auditorias, indicadores), exigindo auditoria cruzada para fechamento completo.

### Score de implementação (0 a 5)

**4.2 / 5.0**

### Justificativa do score

O requisito está bem implementado: existe mapeamento estruturado das partes interessadas, definição de demandas e mecanismos de monitoramento/atendimento, além de histórico de atualização. O score não é máximo porque a comprovação de controle ainda depende de rastreabilidade externa e não há, na própria matriz, um painel consolidado de execução/periodicidade por requisito.

### Guia de validação E2E (auditoria prática)

1. Selecionar amostra mínima de 5 partes interessadas com `G=SIM` (relevante para SGI).
2. Para cada parte, capturar os requisitos descritos na coluna `D` e os mecanismos de atendimento na coluna `I`.
3. Rastrear evidências objetivas de execução para cada mecanismo:
   - relatório/ata de análise crítica;
   - resultados de indicadores;
   - registros de auditoria;
   - avaliações de fornecedor;
   - evidências legais (`FPLAN 002`/`FPLAN 003`) quando `H=SIM`.
4. Conferir se a última atualização do mapeamento está compatível com o ciclo interno definido pela organização.
5. Critério de aceite recomendado:
   - PASSA: requisitos mapeados + evidência de atendimento + revisão atualizada.
   - FALHA: requisito mapeado sem evidência de controle, ou mapeamento desatualizado frente ao ciclo interno.

---

## Próximos Itens

As próximas validações devem manter esta convenção de arquivo em `docs/compliance-reports`.
