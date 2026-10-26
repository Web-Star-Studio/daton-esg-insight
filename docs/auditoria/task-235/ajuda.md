# Auditoria da Central de Ajuda — task 235

## Escopo e conservação

A revisão cobriu `src/data/faqData.ts`, `src/data/faqs.ts` e os textos da página `src/pages/Documentacao.tsx`. Foram preservados os IDs, a ordem, a quantidade de categorias, a quantidade de perguntas e a estrutura visual.

- `faqData.ts`: 244 perguntas antes e 244 depois.
- `faqs.ts`: 151 perguntas antes e 151 depois.
- 146 perguntas aparecem nas duas bases e receberam respostas consistentes.
- Total conservado: 395 entradas de pergunta, correspondentes a 249 perguntas distintas.

`Documentacao.tsx` conserva a autenticação legada pelo Supabase e todas as seções condicionais. Por isso, parte da cópia corrigida permanece visível apenas quando essa autenticação considera a pessoa logada; a lógica não foi alterada.

## Revisão 2 — reclassificação com o MasterProduct

Esta segunda revisão confrontou a copy corrigida com o `DATON_Master_Product_and_Delivery_Specification_v0.1` e com o retrato das 43 tasks das sprints 5 e 8 em 23/10/2026. O MasterProduct se apresenta como rascunho controlado e separa capacidade, requisito e evidência de entrega (`P0018`, `P0021`, `P0041`, `P0052` e `P0073`). Portanto, uma função documentada para V2.0 ou V3.0 foi tratada como roadmap até existir task entregue e merge correspondente. A numeração V2.0/V3.0 abaixo é a versão do roadmap do MasterProduct, não o nome informal do repositório atual.

| Claim reclassificada | Classificação anterior | Classificação corrigida | Evidência de produto e entrega |
| --- | --- | --- | --- |
| Assistente contextual e ações pelo chat | Indisponível, sem registrar direção futura. | A consulta atual permanece somente leitura. Contexto com fontes é roadmap V3.0; ações confirmadas são planejadas e ainda não entregues. | F36; DAT-V3-R12-002 e DAT-V3-R12-005 (`P3542–P3604`, `P8620–P8678`, `P8797–P8855`); task 211 em triagem, sem merge. |
| Extração de documentos e mapeamento por IA | Tratados apenas como inexistentes. | Indisponíveis hoje e planejados para V3.0 com origem, confiança e confirmação humana. OCR, notas fiscais, formatos e precisão não são garantidos. | F36; DAT-V3-R12-003 (`P8679–P8737`); nenhuma task R12 ativa nas sprints consultadas. |
| Previsão, machine learning e anomalias | Seção inteira tratada como fora do produto. | Previsão genérica, probabilidades e modelo de ML continuam sem evidência específica. O roadmap V3.0 cita tendências e anomalias somente em casos delimitados. | F09, F23, F29 e F35; R12 (`P9676`, `P9802`, `P9856`, `P9910`); sem task específica. |
| Conectores, webhooks e jobs | Tratados apenas como integração inexistente. | Indisponíveis hoje e planejados na V2.0 com contratos, autoridade por campo, retry e reconciliação. API pública, OAuth, marcas e conectores específicos continuam sem compromisso. | DAT-V2-R11-001 (`P0406`, `P8502–P8560`); task 205 em triagem, sem merge. |
| Relatórios, BI e distribuição | Tratados apenas como exportações locais de cada módulo. | As saídas atuais continuam por módulo. Catálogo governado, BI, linhagem e distribuição são planejados na V2.0; PDF, Word, PowerPoint, HTML e iXBRL não estão garantidos. | F31/F32; DAT-V2-R09-002 (`P3246–P3317`, `P8384–P8442`); task 203 em triagem, sem merge. |
| Formulários externos | Classificados como inexistentes. | Formulários internos estão entregues sob habilitação; formulários externos delimitados são roadmap V2.0. Link público genérico, QR Code e iframe não são capacidades atuais. | F33 (`P3320–P3392`); task 125 entregue, PR #580, merge `db409581d74752b232449527f2495ef4b27c43b1`; sem task específica para a extensão externa. |
| Reuniões, atas, decisões e RAC | Comitês limitados às ferramentas atuais. | Ferramentas atuais continuam válidas; integração transversal de reuniões, atas, decisões e RAC é planejada. | F31/R09 (`P9868–P9874`); task 202 em triagem, sem merge. |
| PDI | Tratado junto a folha, ponto e outros limites de Pessoas. | PDI é planejado, mas indisponível hoje. Folha, ponto, recrutamento e LMS permanecem fronteiras externas; SST tem apenas controles adjacentes, sem módulo completo. | F19, F20, F21 e F37/R07 (`P8093–P8115`, sobretudo `P8113`); task 198 em triagem, sem merge. |
| Projetos e compensações de carbono | Tratados apenas como inexistentes. | Aparecem no estado desejado do produto, mas sem versão ou task que confirme um marco de entrega. Créditos negociáveis continuam sem promessa. | F29 (`P3042–P3050`); direção futura sem marco de entrega confirmado. |
| Cálculos, consolidação, publicação ESG e metas | Tratados apenas como inexistentes. | As bases e cálculos por atividade atuais estão entregues sob habilitação. Cálculos reproduzíveis transversais, consolidação, revisão, publicação governada e metas são roadmap V2.0; pacote GRI e publicação automática não são prometidos. | F29/F30; R08 (`P8266–P8314`, `P3116`, `P3134`, `P3156–P3158`); task 124 entregue, merge `c4744d07377958eb986ac009105bbf0da6ef4642`; tasks 200 e 201 em triagem. |
| Importação por planilha | Disponível apenas em destinos habilitados. | Classificação mantida como entregue; a sugestão de mapeamento por IA é uma extensão futura distinta. | F04/F18/F33/F34; R05/R12 (`P3394–P3466`, `P8679–P8737`); task 126 entregue, PR #575, merge `faa24675633ea66db18286946a36fa6a4711d519`. |
| Segurança | Certificações e tecnologias sem prova foram removidas. | Classificação mantida: o MasterProduct descreve contratos de segurança e privacidade, mas não comprova MFA, SOC 2, ISO 27001, AES-256 ou TLS 1.3 como garantias do produto. | F05/F38; R01/R06 (`P0648–P0666`, `P3764–P3825`); sem evidência específica de certificação ou tecnologia. |

As respostas afetadas agora apresentam primeiro o estado disponível e, em seguida, a direção de evolução aplicável, sem códigos internos ou data de entrega. Menções genéricas no MasterProduct não foram convertidas em promessa. A [matriz permanente](masterproduct.md) reúne as classificações e referências; a extração integral dos anexos não foi incluída no repositório da landing.

## Alterações por grupo

| Grupo | Antes | Depois | Motivo e evidência |
| --- | --- | --- | --- |
| Entrada e primeiros passos | Cadastro livre, confirmação de e-mail, tour e planos comerciais. | Voucher gratuito emitido pela Daton, configuração da organização e convites por e-mail. | O fluxo atual não tem cadastro livre, trial ou planos. Evidência: `docs/architecture/registration-vouchers.md`. |
| Acesso e segurança | Papéis incorretos, MFA, AES-256, TLS 1.3, SOC 2, ISO 27001, backup diário e suporte 24/7. | bcrypt, JWT e autorização por organização, papel, módulo e filial; RPO 24h e RTO 4h apresentados como objetivos operacionais. | Remove certificações, tecnologias e SLA não comprovados. Evidências: autenticação/autorização da v2 e `docs/12-plano-de-ambientes-e-deploy.md`. |
| Daton AI | Upload e OCR, análise contextual da página, previsão, anomalias, scoring, relatórios e escrita de tarefas. | Perguntas e seis ferramentas de consulta atuais; extração, contexto com fontes e ações supervisionadas identificados como evolução planejada. | Evidência: `docs/security/daton-ai.md`. |
| Integrações e migração | API REST pública, OAuth, webhooks, SAP, TOTVS, Protheus, Zapier, IoT e sincronização em tempo real. | Importação habilitada por empresa/destino, com prévia e rejeitos; conectores/webhooks futuros, sem API pública ou marcas garantidas. | Evidência: `docs/architecture/data-imports.md` e código de configuração de destinos. |
| Clima e emissões | Inventário em tempo real, biblioteca universal, LCA, créditos, previsões e relatórios prontos. | Fontes dos Escopos 1, 2 e 3, fatores versionados, dados de atividade, cálculos, totais e CSV quando habilitado. | Mantém a base atual; projetos/compensações são direção futura sem marco. LCA e forecast continuam sem evidência específica. |
| ESG e referenciais | GRI, CDP, SASB, TCFD e ratings prontos, publicação e simulador de nota. | Referenciais livres cadastrados pela administração, temas, respostas, evidências, iniciativas e relato em rascunho. | Hoje não fornece pacote oficial nem publica o relato final. Revisão e publicação humanas são planejadas V2.0. |
| Água e resíduos | Medidores, IoT, efluentes, qualidade da água, PGRS e GRI gerados automaticamente. | Lançamentos de água e resíduos nos domínios habilitados, importação opt-in, MTR/CDF e exportações disponíveis; limites de efluentes e qualidade explícitos. | Evidência: `docs/architecture/sustainability-data.md`. |
| Pessoas | SST, ponto, folha, PDI e carreira. | Base atual de colaboradores, competências e treinamentos; PDI planejado, sem confundir com ponto/folha ou SST completa. | Evidência: `docs/architecture/people-training-records.md`. |
| Qualidade e fornecedores | Workflows genéricos, scorecards de IA e integrações de compras. | Processos, não conformidades, causa, contenção, planos, eficácia, auditorias, homologação, documentos e avaliações. | Reflete os fluxos atuais sem prometer automações externas. |
| Formulários | Links públicos, QR Code, iframe e dashboards de pesquisa. | Modelos internos versionados atuais; formulários externos delimitados planejados, sem link público genérico entregue. | Evidência: `docs/architecture/internal-forms.md`. |
| Financeiro | Módulo completo com contas, bancos, conciliação, DRE, fluxo de caixa, orçamento, ROI e integração ESG. | Seções mantidas como explicação dos limites; cada resposta indica o conceito ou o sistema externo apropriado. | Não existe módulo financeiro na v2. As respostas evitam sugerir telas ou procedimentos fictícios. |
| Análise preditiva | Modelos, previsões, confiança, anomalias e acurácia prometida. | Seção renomeada para limites e respostas específicas sobre o que não é calculado. | Hoje não há motor preditivo. Casos de tendências/anomalias são planejados V3.0, sem previsão genérica garantida. |
| Suporte | Chat, telefone, e-mails não confirmados, horários e SLA. | `/app/ajuda`, widget Feedback para dúvida/problema/ideia e `contato@daton.com.br`. | São os canais presentes no produto e na landing atual. |
| Página Documentação | Números promocionais, conformidade automática, API-first, endpoint fictício e módulos inexistentes. | Texto factual sobre módulos, habilitação por empresa, importação por planilha, controles de acesso e limites de integração. | A estrutura e a autenticação legada foram preservadas; somente a copy foi alterada. |

## Decisões editoriais

- Conceitos estáveis do glossário foram mantidos ou atualizados sem transformá-los em promessa de recurso do Daton.
- O exemplo fixo de equivalência do metano foi removido porque o potencial de aquecimento depende da referência metodológica adotada.
- Números de precisão, cobertura, volume, prazo, mercado e redução de tempo sem fonte contratual foram removidos.
- Recursos condicionados por feature flag são descritos como disponíveis apenas quando habilitados para a empresa e, quando aplicável, para o destino.
- Títulos de vídeos com duração inventada foram transformados em perguntas de disponibilidade, preservando IDs e temas.
- O Portal do Fornecedor foi distinguido de um questionário ESG externo: o portal existe para atender solicitações e enviar documentos.
- Perguntas sobre capacidades inexistentes foram preservadas para não quebrar busca, IDs ou navegação; as respostas agora esclarecem o limite de forma direta.

## Referências principais da v2

- `docs/security/daton-ai.md`
- `docs/architecture/registration-vouchers.md`
- `docs/architecture/data-imports.md`
- `docs/architecture/internal-forms.md`
- `docs/architecture/sustainability-data.md`
- `docs/architecture/sustainability-reporting.md`
- `docs/architecture/people-training-records.md`
- `docs/architecture/record-contracts.md`
- `docs/12-plano-de-ambientes-e-deploy.md`


## Referências conceituais conferidas

As definições de escopos e os avisos sobre versões dos referenciais foram conferidos em fontes primárias: [GHG Protocol](https://ghgprotocol.org/sites/default/files/ghgp/standards/ghg-protocol-revised.pdf), [IFRS — ISSB e TCFD](https://www.ifrs.org/sustainability/tcfd/) e [GRI — Universal Standards](https://www.globalreporting.org/standards/standards-development/universal-standards/). A referência a essas entidades explica conceitos; não anuncia certificação ou conteúdo oficial pré-carregado no Daton.

## Ajustes antes do merge — 26/10/2026

Restauradas as definições de economia circular, regimes de competência/caixa, fluxo de caixa, conciliação e plano de contas nas duas bases, sem apresentar esses controles como funções do Daton. A ajuda no painel deriva o destino da configuração central.
