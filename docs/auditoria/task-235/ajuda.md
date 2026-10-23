# Auditoria da Central de Ajuda — task 235

## Escopo e conservação

A revisão cobriu `src/data/faqData.ts`, `src/data/faqs.ts` e os textos da página `src/pages/Documentacao.tsx`. Foram preservados os IDs, a ordem, a quantidade de categorias, a quantidade de perguntas e a estrutura visual.

- `faqData.ts`: 244 perguntas antes e 244 depois.
- `faqs.ts`: 151 perguntas antes e 151 depois.
- 146 perguntas aparecem nas duas bases e receberam respostas consistentes.
- Total conservado: 395 entradas de pergunta, correspondentes a 249 perguntas distintas.

`Documentacao.tsx` conserva a autenticação legada pelo Supabase e todas as seções condicionais. Por isso, parte da cópia corrigida permanece visível apenas quando essa autenticação considera a pessoa logada; a lógica não foi alterada.

## Alterações por grupo

| Grupo | Antes | Depois | Motivo e evidência |
| --- | --- | --- | --- |
| Entrada e primeiros passos | Cadastro livre, confirmação de e-mail, tour e planos comerciais. | Voucher gratuito emitido pela Daton, configuração da organização e convites por e-mail. | O fluxo atual não tem cadastro livre, trial ou planos. Evidência: `docs/architecture/registration-vouchers.md`. |
| Acesso e segurança | Papéis incorretos, MFA, AES-256, TLS 1.3, SOC 2, ISO 27001, backup diário e suporte 24/7. | bcrypt, JWT e autorização por organização, papel, módulo e filial; RPO 24h e RTO 4h apresentados como objetivos operacionais. | Remove certificações, tecnologias e SLA não comprovados. Evidências: autenticação/autorização da v2 e `docs/12-plano-de-ambientes-e-deploy.md`. |
| Daton AI | Upload e OCR, análise contextual da página, previsão, anomalias, scoring, relatórios e escrita de tarefas. | Perguntas em texto e seis ferramentas de consulta somente leitura aos dados autorizados, com limites explícitos. | Evidência: `docs/security/daton-ai.md`. |
| Integrações e migração | API REST pública, OAuth, webhooks, SAP, TOTVS, Protheus, Zapier, IoT e sincronização em tempo real. | Sem integração pública pronta; importação assistida por planilha apenas por empresa e destino habilitados, com prévia e rejeitos. | Evidência: `docs/architecture/data-imports.md` e código de configuração de destinos. |
| Clima e emissões | Inventário em tempo real, biblioteca universal, LCA, créditos, previsões e relatórios prontos. | Fontes dos Escopos 1, 2 e 3, fatores versionados, dados de atividade, cálculos, totais e CSV quando habilitado. | Limita o texto às capacidades atuais do módulo Clima; remove LCA, compensação e forecast. |
| ESG e referenciais | GRI, CDP, SASB, TCFD e ratings prontos, publicação e simulador de nota. | Referenciais livres cadastrados pela administração, temas, respostas, evidências, iniciativas e relato em rascunho. | O Daton organiza o trabalho, mas não fornece pacote oficial nem publica o relato final. |
| Água e resíduos | Medidores, IoT, efluentes, qualidade da água, PGRS e GRI gerados automaticamente. | Lançamentos de água e resíduos nos domínios habilitados, importação opt-in, MTR/CDF e exportações disponíveis; limites de efluentes e qualidade explícitos. | Evidência: `docs/architecture/sustainability-data.md`. |
| Pessoas | SST, ponto, folha, PDI e carreira. | Colaboradores, cargos, competências, lacunas, turmas, conclusão, eficácia e certificado. | Evidência: `docs/architecture/people-training-records.md`. |
| Qualidade e fornecedores | Workflows genéricos, scorecards de IA e integrações de compras. | Processos, não conformidades, causa, contenção, planos, eficácia, auditorias, homologação, documentos e avaliações. | Reflete os fluxos atuais sem prometer automações externas. |
| Formulários | Links públicos, QR Code, iframe e dashboards de pesquisa. | Modelos internos versionados, campos e regras, respostas vinculadas à versão e CSV quando habilitado. | Evidência: `docs/architecture/internal-forms.md`. |
| Financeiro | Módulo completo com contas, bancos, conciliação, DRE, fluxo de caixa, orçamento, ROI e integração ESG. | Seções mantidas como explicação dos limites; cada resposta indica o conceito ou o sistema externo apropriado. | Não existe módulo financeiro na v2. As respostas evitam sugerir telas ou procedimentos fictícios. |
| Análise preditiva | Modelos, previsões, confiança, anomalias e acurácia prometida. | Seção renomeada para limites e respostas específicas sobre o que não é calculado. | A v2 não executa análise preditiva; a IA é somente de consulta. |
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
