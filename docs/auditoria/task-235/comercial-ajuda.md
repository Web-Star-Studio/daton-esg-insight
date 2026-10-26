# Auditoria comercial da Central de Ajuda — task 235

## Critério desta revisão

A Central de Ajuda da landing page foi revisada como apresentação comercial do produto completo descrito no MasterProduct, e não como inventário do código disponível em uma determinada data. A revisão cobriu as 244 entradas de `src/data/faqData.ts`, as 151 entradas de `src/data/faqs.ts` e a copy institucional de `src/pages/Documentacao.tsx`.

Foram preservados IDs, perguntas, ordem, identidade das categorias, tags, relações, JSX, classes, design e comportamento. As 146 perguntas presentes nas duas bases continuam com respostas idênticas. Conceitos estáveis e fronteiras explícitas do produto foram mantidos; respostas centradas em rollout, flags, sprints ou ausência temporária foram reescritas como oferta final. Títulos e descrições de categorias receberam linguagem positiva de produto nos mesmos slots.

## Mapeamento literal da mudança

| Grupo | Linguagem anterior | Linguagem comercial adotada | Evidência no MasterProduct |
| --- | --- | --- | --- |
| Assistente IA | “consultas somente leitura”, “seis ferramentas” e recursos “planejados e indisponíveis”. | Assistente contextual com fontes e limites, explicações, sugestões e ações de baixo risco com prévia, confirmação, idempotência e registro do resultado. | F36 (`P3542–P3604`); DAT-V3-R12-002 a R12-005 (`P8620–P8855`). |
| Extração documental | “não extrai”, “não recebe arquivos” e revisão futura. | Extração assistida que propõe campos e mapeamentos com trecho de origem, confiança, comparação lado a lado e confirmação humana antes de persistir. Não promete tecnologia OCR, nota fiscal ou precisão universal. | F10, F33, F34 e F36; DAT-V3-R12-003 (`P8679–P8737`). |
| Integrações | “sem API, OAuth, webhooks ou conectores” e importação condicionada a flags. | Importações e conectores governados por contrato de sistema, campos, fonte, frequência, autoridade, idempotência, retentativas e reconciliação. Não promete API pública, OAuth universal ou marcas específicas. | F34/F35 (`P3394–P3466`); DAT-V2-R11-001 (`P8502–P8560`); regra de compromisso por conector em `P0406`. |
| Painéis, BI e relatórios | Exportações locais, principalmente CSV, e catálogo futuro. | Catálogo governado de painéis, relatórios e distribuições com filtros, definição, linhagem, qualidade, versão e acesso controlado. Formatos são declarados por relatório, sem lista universal. | F31/F32 (`P3169–P3317`); DAT-V2-R09-002 (`P8384–P8442`). |
| ESG e publicação | Relato em rascunho com edição e publicação externas. | Referenciais configuráveis, indicadores, respostas e evidências conectados à consolidação, revisão e publicação governadas. Não oferece pacotes oficiais universais de GRI, CDP, SASB ou TCFD. | F30 (`P3098–P3167`); DAT-V2-R08-001 (`P9792–P9850`). |
| Financeiro–ESG | Dados operacionais e financeiros eram tratados como universos separados, com associação e relato sempre externos. | Transações e contabilidade permanecem nos sistemas financeiros autoritativos; integrações governadas podem trazer resultados autorizados, com fonte, período e autoridade, para relacioná-los a indicadores e iniciativas e compor relatos sob revisão humana. | Diretrizes em `P0307`, `P0345`, `P0399`, `P0406`; F30 (`P3124`, `P3132–P3136`); F34. |
| Clima, carbono e metas | Totais atuais, CSV e metas descritas como indisponíveis. | Inventário reproduzível, emissões brutas separadas de reduções e compensações, projetos, metas, consolidações e relatórios com memória de cálculo e revisão. O Daton não atua como mercado de créditos nem promete forecast genérico. | F09/F29 (`P3042–P3050`, `P0771–P0776`); DAT-V2-R08-002 (`P9851–P9865`); cálculos e relatórios em `P10451–P10456`. |
| Tendências e anomalias | “análise preditiva inexistente” e capacidade futura. | Explicações de variações, tendências e anomalias em casos delimitados, com fontes, critérios e validação humana. Probabilidades, intervalos e precisão exigem contrato e avaliação próprios. | F09, F23, F29, F32 e F36; casos delimitados em `P9676`, `P9802`, `P9856` e `P9910`. |
| Formulários | Modelos internos sob habilitação; formulários externos indisponíveis. | Modelos versionados, condicionais, validação, público, respostas e destino, incluindo distribuição externa delimitada por processos aprovados. Não promete link público irrestrito, QR Code ou iframe genérico. | F33 (`P3320–P3392`), especialmente estado final em `P3337–P3358` e requisitos externos em `P3379–P3382`. |
| Pessoas e PDI | Cargos, lacunas e treinamento; PDI tratado como futuro. | PDI conectado a cargos, competências, lacunas, objetivos, ações de desenvolvimento, treinamentos e eficácia. Folha, ponto, recrutamento e LMS completo continuam em sistemas especializados. | F19/F20/F37; DAT-V2-R07-007 (`P8093–P8115`, sobretudo `P8113`). |
| Reuniões e RAC | Comitês apoiados por registros, sem atas integradas. | Agenda, reunião, ata, decisões, responsáveis, ações e análise crítica conectados à memória decisória. | F31; definição em `P0402`; requisitos de reuniões e RAC em `P9868–P9874`. |
| Ações e pendências | Resposta repetida de que não havia módulo genérico de tarefas. | Ações vinculadas ao processo de origem, com responsável, prazo, prioridade, evidência, estados, cobranças, filtros, relatórios e operações em lote limitadas a mudanças seguras. | F02/F03/F15/F16 (`P0137–P0151`); execução transversal descrita em `P0310`. |
| Stakeholders e materialidade | Pesquisa pública e matriz tratadas como externas. | Formulários externos delimitados, públicos, períodos, respostas, evidências e decisão de materialidade com revisão humana. | F18/F30/F33 (`P0153`, `P0158`, `P0168` e `P3320–P3392`). |
| Documentação institucional | Manual do estado operacional, flags e bloco JSON de roadmap. | Visão do produto completo: dados confiáveis, decisões explicáveis, execução conectada, IA supervisionada e integrações por contrato. | Direção F01–F38 resumida em `P0310`; grupos de capacidades em `P0521–P0545`. |
| Continuidade e recuperação | Objetivos de recuperação eram apresentados com números sem compromisso aprovado no MasterProduct. | Política de backup e restauração com responsabilidades, testes e objetivos de recuperação sujeitos a definição e validação contratual, sem inventar periodicidade, retenção ou SLA. | Regra de não inventar números em `P3765`; decisão de definir objetivos aprovados em `P3793–P3794`. |

## Fronteiras comerciais preservadas

- O Daton não substitui ERP financeiro, contabilidade, bancos, folha, ponto, recrutamento, ATS, LMS completo ou sistema especializado de SST.
- O produto não concede certificações, não declara conformidade jurídica e não promete MFA, SOC 2, ISO 27001, algoritmo de criptografia, versão de TLS ou SLA sem fonte contratual.
- GRI e outros referenciais podem ser configurados e governados, mas não são oferecidos como pacotes oficiais universais nem como declaração automática de conformidade.
- OCR, API pública, OAuth universal, fornecedores específicos, formatos universais de exportação, forecast genérico, probabilidades e precisão não foram inferidos de capacidades mais amplas.
- Canais de contato, acesso por voucher e suporte permanecem descritos de forma factual, pois a visão do produto não transforma comunicações operacionais em promessa de entrega.

## Conservação e resultado

- `faqData.ts`: 244 perguntas revisadas e preservadas.
- `faqs.ts`: 151 perguntas revisadas e preservadas.
- Total: 395 entradas.
- Perguntas comuns: 146, com respostas idênticas nas duas bases.
- Nenhum ID, pergunta, tag, slot de categoria ou posição foi alterado; títulos e descrições textuais foram ajustados sem mudar a estrutura de navegação.
- A página `Documentacao.tsx` teve somente copy alterada; autenticação, navegação, componentes, estrutura e estilos foram preservados.

O MasterProduct também registra que seu conteúdo é uma especificação do estado desejado, e não prova de implementação (`P0018`, `P0021`, `P0041`, `P0052` e `P0073`). Nesta landing, essa distinção foi aplicada como linguagem comercial do produto completo, evitando transformar detalhes internos de rollout em texto público.
