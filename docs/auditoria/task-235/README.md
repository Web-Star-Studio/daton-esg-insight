# Task 235 — Posicionamento comercial pelo MasterProduct

Revisão de 26/10/2026. Base da comparação: `3de3f70fe65be07d48088ce6d40c66cef241c097`, a main após o PR 104. Branch: `codex/task-235-promessa-masterproduct`.

## Direção aprovada

A pessoa responsável esclareceu que a landing é **a promessa comercial do produto para o início do marketing**. A fonte editorial passa a ser a visão integral do MasterProduct, e não o inventário de funcionalidades implementadas. Esta decisão substitui o critério comercial das revisões anteriores.

A redação apresenta benefícios e capacidades finais de dados, processos, automação, análise, relato, integrações e IA assistida. Ausência no código atual deixa de vetar uma capacidade assumida pelo documento. Termos internos como V2/V3, sprints, feature flags, “ainda indisponível” e “planejado” saem da oferta.

Isso não amplia o escopo para hipóteses ou promessas que o próprio Master não assume: substituição de ERP/folha/ponto/recrutamento, certificações, pacotes universais de frameworks, marcas de conectores, precisão de previsões, SLA ou declaração automática de conformidade. As confirmações e decisões humanas dos fluxos permanecem como parte da proposta de valor.

## Comparativos e justificativas

| Recorte | Mudança de posicionamento | Evidência principal |
| --- | --- | --- |
| Início e Ambiental | De cadastro condicionado a módulos para monitoramentos, cálculos, alertas, metas e relato conectados | F26/F27/F29/F30/F34 |
| Pessoas | De competências atuais e PDI indisponível para ciclo de competências, desenvolvimento, aprendizagem e comunicação | F19/F20/F21; P8113 |
| Governança | De registros atuais para reuniões, atas, decisões, ações, RAC e BI conectados | F06–F09/F15/F31/F32 |
| IA | De consulta somente leitura para contexto, fontes, extração, mapeamento, propostas e ações confirmadas | F36; DAT-V3-R12-002 a 005 |
| Dados e integrações | De saídas atuais e conectores indisponíveis para importação, reconciliação, relatórios, BI e sincronização | F32/F34/F35 |
| Institucional e metadados | De descrição centrada na implementação para gestão integrada, automação e inteligência com evidências | P0307–P0310; F01–F38 |
| Ajuda e Documentação | De catálogo de limitações para explicação da proposta de produto, mantendo os conceitos e as fronteiras reais | F01–F38 e regras por domínio |

Detalhamento com antes, depois, motivo e F-ID/localizadores:

- [PDF comercial com fotos de antes/depois e justificativas — 22 páginas](relatorio-comercial-masterproduct.pdf).
- [Catálogo de funcionalidades](comercial-funcionalidades.md).
- [Ambiental, Social, Governança e Tecnologia](comercial-ambiental.md).
- [FAQ e Documentação](comercial-ajuda.md).
- [Institucional e critério comercial](comercial-institucional.md).

## Preservação do site

A quantidade e a ordem dos elementos, classes, estilos, imagens, ícones, IDs, navegação e comportamento são preservados. O catálogo mantém 5 grupos e 24 cards; as bases de ajuda mantêm 244 + 151 entradas. Textos podem gerar novas quebras de linha, verificadas em navegador headless isolado.

Os limites reais de canais continuam factuais: o formulário de contato sem envio direciona ao e-mail institucional, os controles legados preservam seu comportamento, e as páginas de acesso e privacidade continuam descrevendo os respectivos fluxos. A revisão não implementa funcionalidades no sistema nem publica a landing.

## Validação

Tipos app/Node, build, os 3 testes existentes e lint dos fontes alterados aprovados. A revisão independente não encontrou promessas fora do MasterProduct após os refinamentos. A verificação de estrutura preserva JSX, atributos visuais, ícones e IDs.

- [Estrutura visual](evidencias/comercial/estrutura.json).
- [Consistência de 244 + 151 entradas e 146 respostas comuns](evidencias/comercial/faq-consistencia.json).
- [48 capturas: 12 rotas, dois viewports, antes/depois, HTTP 200 e sem erro/overflow horizontal](evidencias/comercial/paginas.json).
- Comparativos [desktop](evidencias/comercial/comparativo-desktop.webp) e [celular](evidencias/comercial/comparativo-mobile.webp).
- Exemplos da ajuda: [extração assistida](evidencias/comercial/faq-extracao.png) e [dados financeiros como insumos ESG](evidencias/comercial/faq-financeiro-esg.png).

A barra fixa dos heros Social/Governança já encobre parte do subtítulo em 375 px na base; seu CSS foi preservado. O formulário de contato sem envio, os controles legados e a sessão antiga da Documentação mantêm os limites registrados. O CI herdava o script de cobertura ausente; a correção complementar foi autorizada antes do merge.

### Complemento autorizado para o merge — 26/10/2026

O CI passa a instalar o provider V8 na mesma versão do Vitest, executar `test:coverage`, publicar relatórios JSON/LCOV/HTML como artefato do GitHub e checar explicitamente os projetos TypeScript da aplicação e das configurações. O lint fica bloqueante para o código ativo da landing e suas configurações; `supabase/` continua como arquivo legado, intacto. O workflow usa Node 22 e libera o build somente depois dessas verificações. A descoberta dos testes fica restrita a `src/`, sem incluir cópias temporárias da auditoria.

Na revisão automática, foram refinados quatro esclarecimentos nas duas bases de FAQ: atualização conforme registros e frequência das integrações, critérios SMART sem validação automática prometida, ausência de vídeo nesta página e objetivos de recuperação sujeitos a definição e validação contratual. Os Termos preservam a descrição comercial, explicitando escopo contratado e permissões de acesso. O inventário continua apresentado conforme a visão do MasterProduct, sem voltar à limitação de implantação atual. Os links do simulador já haviam sido corrigidos no PR 104; este PR preserva os destinos da base `3de3f70f`.

O PDF versionado registra a revisão comercial anterior a este complemento; as novas precisões e a correção do CI ficam documentadas aqui. Design, hierarquia e comportamento continuam preservados.

Evidências do complemento: [resolução dos itens da revisão](revisao-pre-merge.md), [instalação limpa e verificações locais](evidencias/comercial/ci-local.json), [10 capturas headless do build](evidencias/comercial/pre-merge-visual.json), [desktop](evidencias/comercial/pre-merge-desktop.webp) e [celular](evidencias/comercial/pre-merge-mobile.webp).

O `bun.lock` também foi sincronizado com o manifesto. O binário antigo `bun.lockb` foi retirado para manter um único lockfile do Bun. A instalação congelada, os tipos, os testes com cobertura e o build passaram com Bun 1.4.4; o CI passa a verificar o build em instalações limpas tanto com npm quanto com Bun.

## Fonte e rastreabilidade

MasterProduct v0.1, de 05/09/2026, anexo da sprint V1.0 — Data-Complete Daton, id 5. SHA-256 do DOCX: `457550f1b1f58bd62f05e491b4cc5526ab075e6d5991c4b571141f06d8c5b219`. Os anexos permanecem no backlog autenticado. Os localizadores P usados nos comparativos correspondem aos parágrafos não vazios da extração da auditoria.

A matriz, os comparativos e as evidências versionados documentam esta decisão editorial. O PDF comercial acompanha a revisão para aprovação visual. Os documentos anteriores permanecem como histórico, sem reger esta proposta.

## Histórico

- [Revisão técnica anterior e validações do PR 104](historico-revisao-tecnica.md).
- [Matriz anterior de estado atual e roadmap](masterproduct.md).
- O PR 104 foi mergeado na main em `3de3f70f`. Esta revisão comercial está no [PR 105](https://github.com/Web-Star-Studio/daton-esg-insight/pull/105), conforme solicitado, sem merge automático.

## Aprovação e publicação

Revisar os textos comerciais e o PDF, aprovar o novo PR e, após o merge autorizado, publicar manualmente pelo Lovable. Não houve publicação nesta revisão.
