# Task 235 — Auditoria dos textos da landing Daton

Revisão de 23/10/2026, preparada para aprovação de merge e publicação manual pelo Lovable.

A landing `daton.com.br` apresentava capacidades da versão anterior e promessas sem implementação no sistema atual, hospedado em `painel.daton.com.br`. Esta revisão compara o conteúdo institucional com o código atual, o MasterProduct v0.1 e as sprints V1.0/V2.0. Corrige somente textos, metadados e destinos informacionais incorretos.

- Repositório da landing: `Web-Star-Studio/daton-esg-insight`, base `bc3e42195e0f328026a3e1cb29027b5f339a0eed`.
- Sistema consultado, somente leitura: `Web-Star-Studio/Daton`, commit `1f07bd8046e183139f8189f11c7310c8d9553ce5`.
- Branch: `codex/task-235-auditoria-copy-landing`.
- Nenhuma mudança de schema, API, dados do sistema ou infraestrutura. Não houve merge nem publicação nesta entrega.

## Revisão 2: completude do produto

A primeira passagem considerava o código atual. A pedido da pessoa responsável, a reauditoria incorporou o MasterProduct anexo à sprint V1.0 (id 5), seu recorte executivo, guias de novidades e 43 tasks das sprints V1.0/V2.0. **Ausência atual não significa ausência no produto futuro.** PDI, reuniões/atas, BI/relatórios, conectores, extração assistida, formulários externos, compensações, metas reproduzíveis e publicação ESG têm evolução planejada. Projetos/compensações constam do estado desejado F29, sem versão/task de entrega confirmada. A landing agora informa esse estado nos textos existentes, sem anunciar disponibilidade.

A [matriz MasterProduct e sprints](masterproduct.md) registra referências F/R, versões, parágrafos e status. As 23 tasks V1.0 estão entregues; as 20 da Sprint 2 ainda não tinham merge registrado em 23/10/2026. O nome informal do repositório atual não equivale ao marco futuro V2.0. Esta revisão substitui as conclusões anteriores que confundiam ausência no código com exclusão do produto.

## O que mudou e por quê

| Página/seção | O que estava anunciado | O que passa a ser informado | Por quê |
| --- | --- | --- | --- |
| Início e rodapé | ESG em tempo real, conformidade automatizada, saúde ocupacional | Gestão da qualidade, ESG, pessoas, competências, treinamentos e dados rastreáveis | Representa o produto atual e retira recursos não comprovados |
| Soluções e Ambiental | Créditos de carbono, frameworks prontos, predição, SLA e métricas promocionais | Inventários GEE, fatores versionados, registros ambientais, evidências e relatos em rascunho | Inventário existe; compensações constam da direção futura; metas reproduzíveis e publicação estão planejadas V2.0. Créditos negociáveis e garantias continuam sem respaldo |
| Social e Pessoas | Avaliação 360, PDI, carreira, recrutamento, ponto, folha e SST | Colaboradores, cargos, competências, lacunas, turmas, certificados, eficácia e comunicação | Base atual de pessoas e aprendizagem; PDI planejado V2.0. Folha, ponto e recrutamento não são substituídos |
| Qualidade e Governança | Conformidade ISO completa, conselhos, atas, BSC/OKRs, estatística e alertas genéricos | SGQ, documentos, riscos, SWOT, indicadores, auditorias, não conformidades, análise crítica e ações | Base implementada; agenda, atas e decisões integradas planejadas V2.0. BSC/OKRs e gestão especializada de conselhos sem evidência |
| IA | OCR, extração documental, previsões, scoring e ações automáticas | Orientação e consultas somente leitura aos dados autorizados | Hoje não recebe arquivos nem altera registros. Extração e especialistas planejados V3.0; ações confirmadas em triagem na Sprint 2 |
| Integrações | SAP, Oracle, TOTVS, Power BI, API pública, OAuth e webhooks | Importação por planilha nos destinos habilitados, exportações por módulo e avaliação de necessidades | Conectores/webhooks e catálogo de relatórios/BI planejados V2.0, sem API pública ou marcas garantidas |
| Segurança e Sobre Nós | MFA, RLS, TLS/AES em versões específicas, SOC 2, ISO 27001, LGPD total | Senhas protegidas, JWT, autorização por empresa/papel/módulo/filial e históricos por fluxo | Evita anunciar certificações, protocolos ou garantias não demonstrados |
| Ajuda/FAQ/Documentação | Fluxos de telas inexistentes, financeiro, vídeos com duração inventada, suporte 24/7 | Orientações reais, limites explícitos, vídeos indisponíveis e canais existentes | Corrige o roteiro operacional e preserva os mesmos temas, IDs e opções |
| Cadastro e Termos | Cadastro livre e acesso indistinto | Nova empresa com código gratuito emitido pela Daton; acesso por convite e permissões | Reflete a decisão e o fluxo de voucher da v2 |
| Contato | Agendamento e retorno em 24h por um formulário sem envio | Aviso de formulário demonstrativo e contato institucional por e-mail | O formulário atual não envia nem agenda; sua integração ficou fora desta revisão textual |
| Privacidade e Termos | Data de atualização mudando a cada visita e descrição apenas ESG | Data fixa desta edição e descrição de qualidade, ESG e compliance conforme módulos | Evita apresentar cada visita como revisão da política; cláusulas jurídicas foram preservadas |
| Componentes sem montagem atual | Estatísticas de resultado e notícias/parcerias fictícias | Fatos do produto, sem números de desempenho ou eventos inventados | Evita reintroduzir conteúdo antigo em uma futura reutilização; nenhum componente foi inserido na página |

A habilitação por empresa e as permissões foram explicitadas em parágrafos já existentes. A auditoria comprova a implementação e suas condições de disponibilidade; não presume que todos os módulos estejam liberados para todas as empresas em produção.

A matriz versionada [MasterProduct e sprints](masterproduct.md) e as evidências deste diretório são a referência permanente da auditoria. O PDF de aprovação da revisão 2 foi entregue na conversa: 27 páginas, fotos antes/depois, justificativas por seção, mapa dos 24 cards e matriz do MasterProduct nas páginas 21 a 23. Ele substitui a edição baseada somente no código.

## Comparativos detalhados

- [MasterProduct e sprints: atual, planejado, em revisão, não objetivo ou sem evidência](masterproduct.md).
- [Funcionalidades: antes, depois, motivo e evidência por grupo](funcionalidades.md).
- [Ambiental, Social, Governança e Tecnologia](ambiental-social.md).
- [FAQ e Documentação, incluindo recursos ausentes](ajuda.md).
- [Trechos literais de páginas institucionais, segurança, contato e metadados](institucional.md).

A matriz de roadmap usa o anexo da sprint e os status do backlog; não reproduz o documento integral. As referências de implementação desses documentos apontam para arquivos do [repositório do sistema atual](https://github.com/Web-Star-Studio/Daton/tree/1f07bd8046e183139f8189f11c7310c8d9553ce5).

## Preservação do design e da hierarquia

Permanecem iguais a ordem dos elementos renderizados, classes, estilos inline, imagens, ícones e IDs dos 18 arquivos TypeScript/TSX alterados. A página Funcionalidades mantém 5 grupos e 24 cards. A FAQ mantém 244 perguntas, a Documentação mantém 151 e as 146 perguntas comuns têm respostas idênticas. Dez títulos de vídeos agora perguntam pela disponibilidade e não anunciam durações fictícias.

Os comprimentos e quebras de linha mudam naturalmente com o novo texto. Textos de cards e botões foram encurtados quando necessário para caber no layout existente, sem alterar fonte, espaçamento ou CSS.

As exceções informacionais de navegação são explícitas: cinco links que anunciavam simulador passam a acessar o painel por âncoras externas e `window.location.href`, conforme o AGENTS.md; os controles da ajuda deixam de apontar a chat inerte, e-mail/telefone/domínio de exemplo e usam ajuda no painel, e-mail institucional, contato e documentação. A aparência e a quantidade dos controles foram preservadas.

## Validação e evidências

| Verificação | Resultado |
| --- | --- |
| TypeScript do frontend e configuração Node | Aprovado com `tsc --noEmit -p tsconfig.app.json` e `-p tsconfig.node.json` |
| Testes existentes | 3/3 aprovados em `npm run test` |
| Build de produção | Aprovado em `npm run build` |
| ESLint de todos os arquivos TS/TSX alterados | Aprovado |
| Estrutura visual por AST (normaliza Link como âncora HTML) | [18 arquivos sem diferenças de elementos/atributos visuais](evidencias/estrutura.json) |
| Consistência das FAQs | [244 + 151 entradas, 146 comuns, zero divergências e IDs preservados](evidencias/faq-consistencia.json) |
| Navegação e interação | [Menu móvel, acesso ao painel, busca/accordion/estado vazio da FAQ, canais de suporte e aviso do formulário](evidencias/interacoes.json) |
| Chromium isolado headless | [12 rotas em 1440×1000 e 375×812, antes/depois: zero erros de execução e zero overflow horizontal](evidencias/paginas.json) |
| Revisão independente | Três achados materiais corrigidos: bloco de segurança antigo, Portal do Fornecedor e linguagem absoluta |
| Diff | `git diff --check` aprovado |

Capturas salvas e examinadas:

- [Comparativo antes/depois no celular](evidencias/comparativo-mobile.webp).
- [Comparativo antes/depois no desktop](evidencias/comparativo-desktop.webp).
- [Busca da FAQ com explicação do limite financeiro](evidencias/faq-busca-mobile.png).

Os comparativos acima são versionados. Os PNGs completos da execução original foram salvos localmente; o comando abaixo reproduz as capturas em `/tmp/daton-task-235-capturas`, sem depender desses arquivos temporários.

Para repetir as capturas com um Playwright disponível no ambiente:

```bash
npm run dev -- --host 127.0.0.1 --port 5186
# Em outro terminal, com Playwright instalado/disponível:
node docs/auditoria/task-235/capturar.cjs /tmp/daton-task-235-capturas http://127.0.0.1:5186
# Se o runtime estiver fora do projeto, informe PLAYWRIGHT_MODULE.
# Para um Chromium já instalado, informe PLAYWRIGHT_CHROMIUM_EXECUTABLE.
node docs/auditoria/task-235/conferir-estrutura.cjs
```

## Limitações preexistentes registradas

- `npm run lint` geral já falha na base por quatro escapes em duas funções legadas de `supabase/functions/`; essa pasta foi preservada conforme o AGENTS.md.
- O [CI da própria base](https://github.com/Web-Star-Studio/daton-esg-insight/actions/runs/39852202451) já falha no passo `Run tests with coverage`: o workflow chama `npm run test:coverage`, script ausente no `package.json`. A correção do workflow não foi incluída em uma entrega estritamente textual.
- O formulário de contato não envia solicitações. Agora isso é declarado na própria página, com o e-mail institucional como canal existente.
- Alguns CTAs dos cards ambientais e da seção técnica de documentação são inertes. A auditoria não implementa novas ações.
- Documentação ainda condiciona parte do conteúdo à sessão Supabase da v1, diferente da autenticação do painel v2. Seus textos foram corrigidos sem alterar o fluxo.
- Na publicação consultada, `/funcionalidades` redirecionou para `/ambiental`; as duas páginas foram revisadas. Regras de hospedagem/publicação não foram alteradas.
- Dados societários, destinatários institucionais e cláusulas jurídicas não foram reinventados nem tratados como certificados pelo código. A aprovação editorial e a publicação permanecem com a pessoa responsável.

## Próximo passo humano

Revisar os comparativos e o diff, aprovar o merge e publicar pelo Lovable. O conteúdo proposto está preparado, sem publicação automática por esta task.

## Conferência antes do merge — 26/10/2026

Corrigidos verbetes com respostas deslocadas, qualificado o controle condicional por filial e retirada a chamada residual de agendamento. Links ao painel preservam cliques com modificadores; o selo 5W2H mantém o valor durante a animação. A publicação será feita pela pessoa responsável no Lovable. O formulário e os CTAs legados documentados continuam com os limites já informados.

Validação complementar: [checks de pré-merge](evidencias/pre-merge.json), [economia circular](evidencias/faq-circular.png), [regimes de competência/caixa](evidencias/faq-regimes.png) e [segurança no celular](evidencias/seguranca-mobile.png). Build, tipos app/Node, 3 testes e lint dos fontes alterados aprovados.
