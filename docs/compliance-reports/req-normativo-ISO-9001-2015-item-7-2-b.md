# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: 2026-03-05

## Item 005

**Validação solicitada**: Verificar se a organização assegura que as pessoas que realizam trabalho sob seu controle sejam competentes, com base em educação, treinamento ou experiência apropriados (7.2.b), através da análise do plano de treinamento, módulo de funções do QualityWeb e procedimento de RH.

**Requisito Normativo**: ISO 9001:2015, item 7.2.b — Competência (assegurar competência com base em educação, treinamento ou experiência)

**Documento(s) de validação**: `RG.RH.03 Form Plano de Treinamento.xlsx`, Módulo Funções QualityWeb, `PSG-RH Recursos Humanos`, `MSG-01 - Manual do SGI`

### Evidências encontradas

#### Estrutura do RG-RH.03 — Plano de Treinamento

O formulário RG-RH.03 (Rev. OUT/2021 — Psicologia) é o registro formal do plano anual de treinamento da Transportes Gabardo. A estrutura do formulário demonstra cobertura abrangente dos elementos necessários para assegurar competência via treinamento:

- **Campos estruturais do formulário** (23 colunas):
  - **Título do Programa** — Identificação do programa de treinamento
  - **Módulos** — Decomposição do programa em módulos de aprendizagem
  - **Objetivo** — Objetivo do treinamento (vinculação à competência requerida)
  - **Área** — Departamento/setor destinatário
  - **Público Alvo** — Pessoas que devem receber o treinamento (vinculação ao cargo/função)
  - **Local** — Local de realização (interno/externo)
  - **Carga Horária** — Duração do treinamento
  - **Cronograma mensal (JAN–DEZ)** — Planejamento e acompanhamento mês a mês, com legenda tricolor: PLANEJADO, REALIZADO, CANCELADO
  - **Método de Avaliação de Eficácia** — Como será avaliada a efetividade do treinamento
  - **Período de Avaliação de Eficácia** — Quando a avaliação será realizada
  - **Situação** — Status: Pendente / Realizado / Em andamento

- **Capacidade**: O formulário suporta até 4 programas de treinamento por aba, com linhas expansíveis (linhas ocultas para crescimento). Cada programa pode ter múltiplos módulos (células mescladas permitem N módulos por programa).

- **Ciclo PDCA do treinamento**: O formulário demonstra ciclo completo:
  - **P (Plan)**: Título, objetivo, público-alvo, cronograma planejado
  - **D (Do)**: Marcação REALIZADO no cronograma mensal
  - **C (Check)**: Método e período de avaliação de eficácia
  - **A (Act)**: Situação final (pendente/realizado/cancelado) alimenta revisões futuras

- **Histórico de revisões**: Seção dedicada (linha 54+) para controle de revisões do próprio formulário.

#### Módulo Funções — QualityWeb

O MSG-01 referencia o QualityWeb como sistema onde estão registradas as descrições de função:

- "As responsabilidades e autoridades para papéis pertinentes estão definidos nas Descrição da Função, Procedimentos e Organogramas (ANEXO 3 MSG)."
- "As descrições detalhadas de responsabilidades detalhadas estão na descrição de função no Quality.Web."
- O Módulo Funções do QualityWeb é o equivalente ao RG.RH.01 (Descrição de Funções) referenciado no PSG-RH.
- Este módulo estabelece, para cada cargo: requisitos de educação, experiência, conhecimentos e habilidades — constituindo a **base de referência** contra a qual a competência é verificada (7.2.a) e assegurada (7.2.b).
- A vinculação entre Módulo Funções e RG-RH.03 ocorre através do campo **Público Alvo** do plano de treinamento, que deve corresponder aos cargos/funções definidos no QualityWeb.

#### MSG-01 — Referências a Competência (Seção 7.2)

O MSG-01 estabelece a política de competência alinhada à norma:

- "São determinadas as competências necessárias às pessoas que realizam trabalhos que possam afetar o desempenho e a eficácia do sistema de gestão, bem como realizam trabalhos sob seu controle, que afetem seu desempenho ambiental e sua capacidade de cumprir com requisitos legais e outros requisitos."
- "É assegurado a competência das pessoas com base em **educação, treinamento ou experiências**." — Alinhamento literal com o texto do item 7.2.b.
- "São retidas informações documentadas como evidência de atendimento às competências determinadas." — Atende 7.2.d.
- **Informação documentada referenciada**: PSG-RH Recursos Humanos (procedimento) e IT-FROTA Investigação (específico para motoristas).

#### PSG-RH — Procedimento de Recursos Humanos

O PSG-RH (Rev.49) é o procedimento operacional que detalha como a competência é assegurada na prática. Conforme análise anterior (ver `req-normativo-ISO-9001-2015-item-7-2.md`):

- **Descrição de funções (RG.RH.01)**: Define competências necessárias por cargo — educação mínima, experiência requerida, conhecimentos e habilidades. Registrado no QualityWeb Módulo Funções.
- **Plano anual de treinamento (RG.RH.03)**: Formulário analisado neste relatório. O PSG-RH exige planejamento anual de treinamentos para assegurar competência.
- **Registro de treinamentos (RG.RH.04 / QualityWeb)**: Registros individuais de participação em treinamentos, com controle de presença.
- **Avaliação de eficácia**: Avaliação pós-treinamento para verificar se a competência foi efetivamente adquirida.
- **Classificação de posições sensíveis (OEA)**: Posições BAIXO/MÉDIO/ALTO risco com requisitos adicionais de competência e confidencialidade.
- **Integração de novos funcionários**: Orientação e treinamentos obrigatórios na admissão.

#### Fluxo integrado: Como 7.2.b é assegurado

O conjunto de documentos demonstra o seguinte fluxo para assegurar competência:

```
QualityWeb Módulo Funções (RG.RH.01)
  │  Define: educação, experiência, competências por cargo
  │
  ├──► Recrutamento/Seleção (PSG-RH §2)
  │      Verifica: educação e experiência do candidato
  │
  ├──► Plano de Treinamento (RG-RH.03)
  │      Planeja: treinamentos para fechar gaps de competência
  │      Campos: programa, módulos, objetivo, público-alvo,
  │              cronograma, carga horária
  │
  ├──► Execução de Treinamentos (RG.RH.04 / QualityWeb)
  │      Registra: participação, carga horária, certificações
  │
  ├──► Avaliação de Eficácia (PSG-RH)
  │      Verifica: método e período de avaliação (campos do RG-RH.03)
  │      Resultado: treinamento eficaz ou necessidade de reforço
  │
  └──► Informação Documentada Retida (7.2.d)
         RG-RH.03 (plano), RG-RH.04 (registros), QualityWeb (funções)
```

### Pontos de atenção

- **RG-RH.03 é um template em branco**: O arquivo fornecido é o formulário modelo sem dados preenchidos. Não é possível validar se programas de treinamento foram efetivamente planejados e executados para o período corrente. A validação da conformidade depende de verificar uma instância preenchida com dados reais.
- **Vinculação formal Funções → Treinamento**: O campo "Público Alvo" do RG-RH.03 permite vincular treinamentos a cargos, mas não há campo explícito para referenciar o código da função no QualityWeb (ex: "Motorista — RG.RH.01.15"). A rastreabilidade entre a competência definida na descrição de função e o treinamento planejado é implícita.
- **Campo "Objetivo" sem padronização**: O objetivo do treinamento deve demonstrar vinculação à competência requerida pelo cargo. Não há orientação formal sobre como redigir o objetivo de forma rastreável à descrição de função.
- **Capacidade limitada do formulário**: O template suporta apenas 4 programas por planilha. Para uma organização com 11+ unidades e múltiplos cargos, seria necessário múltiplas instâncias do formulário ou expansão significativa. Isso sugere que o QualityWeb pode complementar o formulário como sistema de registro.
- **Periodicidade de reciclagem**: O RG-RH.03 é um plano anual (cronograma JAN-DEZ), mas não há campo para indicar periodicidade de reciclagem de treinamentos obrigatórios (ex: reciclagem de NR a cada 2 anos).
- **Três pilares de competência**: O item 7.2.b menciona educação, treinamento **ou** experiência. O RG-RH.03 cobre o pilar "treinamento". Os pilares "educação" e "experiência" são assegurados na admissão (PSG-RH §2) e registrados no cadastro do funcionário — não no plano de treinamento. A cobertura é complementar entre os documentos.

### Score de Confiança (0 a 5)

**3.9 / 5.0**

### Justificativa do score

A organização demonstra um sistema estruturado para assegurar competência conforme 7.2.b: o MSG-01 declara a política com texto alinhado à norma, o QualityWeb Módulo Funções define as competências requeridas por cargo (educação, experiência, habilidades), o PSG-RH estabelece o procedimento de asseguramento (recrutamento, treinamento, avaliação de eficácia), e o RG-RH.03 materializa o planejamento de treinamentos com estrutura completa (programa, objetivo, público-alvo, cronograma, avaliação de eficácia, situação). O fluxo integrado Funções → Plano de Treinamento → Registro → Avaliação de Eficácia cobre o ciclo PDCA de competência. O score não atinge 4.0+ (Maduro) porque: (a) o RG-RH.03 analisado é um template sem dados preenchidos — a conformidade prática depende de verificar instâncias reais; (b) a vinculação entre descrição de função e treinamento é implícita (sem referência cruzada formal); (c) o formulário tem capacidade limitada (4 programas) para a escala da organização; (d) não há campo de periodicidade de reciclagem. A resolução destas lacunas com instâncias preenchidas e vinculação formal elevaria o score para 4.3+.

### Matriz de conformidade

#### 7.2.b — Assegurar competência com base em educação, treinamento ou experiência

| Sub-req | Requisito | Evidência no Documento | Status |
|---------|-----------|----------------------|--------|
| 7.2.b (educação) | Assegurar competência baseada em educação apropriada | QualityWeb Módulo Funções: campo `educação mínima` por cargo; PSG-RH §2: verificação na admissão | COBERTO |
| 7.2.b (treinamento) | Assegurar competência baseada em treinamento apropriado | RG-RH.03: plano de treinamento com programa, objetivo, público-alvo, cronograma, avaliação de eficácia; PSG-RH: procedimento de treinamento | COBERTO |
| 7.2.b (experiência) | Assegurar competência baseada em experiência apropriada | QualityWeb Módulo Funções: campo `experiência requerida` por cargo; PSG-RH §2: verificação na admissão | COBERTO |
| 7.2.b (integração) | Vínculo entre competência definida e ação de asseguramento | Fluxo Funções → RG-RH.03 → QualityWeb Registros; vinculação via campo "Público Alvo" (implícita, sem código de função) | PARCIAL |

#### Campos do RG-RH.03 vs. Requisitos de Planejamento de Treinamento

| Campo do Formulário | Requisito que atende | Adequação |
|---------------------|---------------------|-----------|
| Título do Programa | Identificação do treinamento | ADEQUADO |
| Módulos | Estruturação do conteúdo | ADEQUADO |
| Objetivo | Vinculação à competência requerida | ADEQUADO (sem padronização formal) |
| Área | Departamento destinatário | ADEQUADO |
| Público Alvo | Vinculação ao cargo/função (7.2.b) | ADEQUADO (sem referência cruzada ao QualityWeb) |
| Local | Controle logístico | ADEQUADO |
| Carga Horária | Dimensionamento do treinamento | ADEQUADO |
| Cronograma JAN–DEZ | Planejamento e acompanhamento (PDCA) | ADEQUADO |
| Método Avaliação Eficácia | Verificação de aquisição de competência (7.2.c) | ADEQUADO |
| Período Avaliação Eficácia | Temporalidade da verificação | ADEQUADO |
| Situação | Controle de status (Pendente/Realizado/Andamento) | ADEQUADO |
| Legenda (Planejado/Realizado/Cancelado) | Rastreabilidade de execução | ADEQUADO |
| Histórico de Revisões | Controle de alterações do formulário | ADEQUADO |
| Periodicidade de reciclagem | Renovação de competência periódica | AUSENTE |
| Referência à função/cargo (código QualityWeb) | Rastreabilidade formal ao 7.2.a | AUSENTE |

#### Cobertura integrada dos documentos

| Documento | Pilar de Competência | Função no Fluxo 7.2.b | Status |
|-----------|---------------------|----------------------|--------|
| QualityWeb Módulo Funções (RG.RH.01) | Educação + Experiência + Habilidades | Define competência requerida (7.2.a) | COBERTO |
| PSG-RH Recursos Humanos | Educação + Experiência + Treinamento | Procedimento de asseguramento (7.2.b) | COBERTO |
| RG-RH.03 Plano de Treinamento | Treinamento | Planejamento de ações (7.2.c — treinamento) | COBERTO |
| RG.RH.04 / QualityWeb Registros | Treinamento | Registro de execução (7.2.d) | COBERTO |
| Avaliação de Eficácia (PSG-RH) | Treinamento | Verificação de eficácia (7.2.c — avaliar) | COBERTO |
| MSG-01 Manual do SGI | Todos | Declaração de política e referências | COBERTO |

### Guia de validação E2E (auditoria prática)

1. **Verificar instância preenchida do RG-RH.03**: Solicitar o plano de treinamento do ano corrente (2025 ou 2026), preenchido, para confirmar que programas foram planejados e executados.
2. **Amostragem de 3 cargos no QualityWeb Módulo Funções**: Selecionar 3 cargos representativos (ex: Motorista, Coordenador de Operações, Analista SGI) e verificar:
   - Descrição de função com educação mínima, experiência requerida e habilidades definidas
   - Pelo menos 1 treinamento no RG-RH.03 cujo "Público Alvo" inclua o cargo
3. **Rastrear 3 funcionários** do cadastro até o plano de treinamento:
   - Verificar que o funcionário ocupa cargo definido no QualityWeb
   - Verificar que o funcionário participou de treinamentos do RG-RH.03 (registros no RG.RH.04 / QualityWeb)
   - Verificar que a avaliação de eficácia foi realizada para ao menos 1 treinamento
4. **Validar cronograma**: Confirmar que o cronograma mensal (JAN-DEZ) possui marcações de PLANEJADO e REALIZADO, e que cancelamentos possuem justificativa.
5. **Verificar método de avaliação de eficácia**: Para cada programa listado no RG-RH.03, confirmar que o campo "Método Avaliação Eficácia" está preenchido e que o "Período Avaliação de Eficácia" foi cumprido.
6. **Verificar novos funcionários**: Para admissões nos últimos 6 meses, confirmar que:
   - Educação e experiência foram verificadas na admissão (PSG-RH §2)
   - Treinamentos de integração foram realizados (PSG-RH §3.3)
   - Registros estão no QualityWeb
7. **Critérios de aceite**:
   - PASSA: Plano de treinamento preenchido para o ano corrente; ao menos 80% dos treinamentos planejados realizados ou em andamento; descrições de função atualizadas no QualityWeb com competências definidas; registros de treinamento individuais disponíveis; avaliações de eficácia realizadas.
   - FALHA: Plano de treinamento em branco ou desatualizado; treinamentos planejados sem execução; descrições de função sem requisitos de competência; ausência de registros individuais; sem avaliação de eficácia.

### Plano de ação — Recomendações

| # | Recomendação | Prioridade | Impacto |
|---|-------------|------------|---------|
| 1 | Obter e validar instância preenchida do RG-RH.03 para o período corrente, confirmando que programas de treinamento estão planejados e sendo executados | ALTA | Evidência essencial para auditoria — template vazio não demonstra conformidade |
| 2 | Adicionar campo de referência à função/cargo (código QualityWeb) no RG-RH.03, formalizando a rastreabilidade entre competência requerida e treinamento planejado | MEDIA | Fortalece vinculação 7.2.a → 7.2.b → 7.2.c; facilita auditorias |
| 3 | Adicionar campo de periodicidade de reciclagem no RG-RH.03 para treinamentos obrigatórios (ex: NR, direção defensiva) | MEDIA | Assegura manutenção contínua da competência; previne vencimentos |
| 4 | Padronizar a redação do campo "Objetivo" vinculando-o à competência da descrição de função (ex: "Desenvolver competência X requerida para cargo Y conforme RG.RH.01") | BAIXA | Melhora rastreabilidade documental; não afeta prática |
| 5 | Migrar o RG-RH.03 para o QualityWeb ou Daton ESG, permitindo vinculação automática entre funções, treinamentos planejados, registros e avaliações de eficácia | BAIXA | Elimina limitação de 4 programas por planilha; automatiza rastreabilidade |

### Conclusão

O conjunto documental analisado — RG-RH.03 (Plano de Treinamento), QualityWeb Módulo Funções, PSG-RH e MSG-01 — demonstra **Score de Confiança 3.9/5.0 (Funcional, próximo de Maduro)** para o requisito ISO 9001:2015 item 7.2.b. A cobertura dos três pilares de competência (educação, treinamento, experiência) é satisfatória: 6 de 6 documentos no fluxo integrado estão COBERTOS, com 1 ponto PARCIAL na vinculação formal entre documentos.

O **RG-RH.03** é um formulário bem estruturado com 13 campos que cobrem o ciclo PDCA do treinamento — desde o planejamento (programa, objetivo, público-alvo, cronograma) até a verificação (método e período de avaliação de eficácia) e o controle de status. O **QualityWeb Módulo Funções** fornece a base de referência com competências requeridas por cargo, e o **PSG-RH** estabelece o procedimento completo de asseguramento.

A principal limitação é que o RG-RH.03 analisado é um template em branco — a conformidade prática depende de instâncias preenchidas com dados reais. Adicionalmente, a rastreabilidade entre a descrição de função (QualityWeb) e o plano de treinamento (RG-RH.03) é implícita. A resolução da recomendação 1 (obter instância preenchida) e 2 (adicionar referência à função) elevaria o score para 4.3+.

Referência cruzada: ver relatório `req-normativo-ISO-9001-2015-item-7-2.md` para análise completa do item 7.2 sob a perspectiva do sistema Daton ESG Insight (nota 3.6/5), incluindo módulos de Gestão de Treinamentos (4.5/5), Matriz de Competências (4.0/5) e Descrição de Cargos (4.0/5).

---

## Próximos Itens

As próximas validações devem manter esta convenção de arquivo em `docs/compliance-reports`.
