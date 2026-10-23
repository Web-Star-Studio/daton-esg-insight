# Auditoria de copy — Funcionalidades

Escopo: `src/pages/Funcionalidades.tsx`.

A auditoria comparou as promessas da landing page com o produto Daton v2. A estrutura da página, a ordem das seções, a quantidade de cards, os ícones, as classes e os estilos foram preservados. As mudanças abaixo são exclusivamente de texto, salvo a correção dos links do simulador inexistente para o painel atual.

## Hero e proposta geral

- **Antes:** prometia “funcionalidades completas”, “automação inteligente”, 30+ módulos, visão 360° e monitoramento 24/7, sem fonte que sustentasse os números ou a disponibilidade uniforme.
- **Depois:** apresenta gestão integrada de qualidade, pessoas, ambiente e governança, com responsabilidades, prazos, registros e evidências. Os três números viraram qualidades verificáveis: integração, rastreabilidade e configuração de acessos.
- **Motivo:** retirar absolutos e métricas promocionais não comprovadas e descrever o valor transversal efetivamente entregue.
- **Evidências:** `docs/02-visao-do-produto.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md` e registros de telas em `lib/authz/src/screens/domains/`.

## ESG e sustentabilidade

- **Antes:** misturava capacidades reais com monitoramento em tempo real, fatores sempre atualizados, economia circular, créditos de carbono, ROI ambiental, certificações internacionais, metas ESG e uma gestão genérica de stakeholders.
- **Depois:** detalha inventário GEE por escopos com fatores versionados, emissões calculadas, totais e CSV; licenças, condicionantes e obrigações; resíduos com transportador, destinador, MTR e CDF; temas, respostas, evidências, iniciativas, ODS e relatos em rascunho; LAIA e controles; e cadastro compartilhado de terceiros e partes interessadas.
- **Motivo:** créditos, compensação, certificações, metas climáticas e publicação de relatos não existem no escopo atual. Os cards foram mantidos e passaram a mostrar domínios implementados.
- **Evidências:** `docs/architecture/sustainability-reporting.md`, `docs/architecture/sustainability-data.md`, `docs/architecture/external-actors.md` e `docs/architecture/documents-compliance-audits.md`.

## Qualidade e processos

- **Antes:** declarava conformidade completa com ISO 9001, 14001 e 45001, avaliação quantitativa de riscos, relatórios automáticos de auditoria, dashboards em tempo real, alertas automáticos e análise estatística.
- **Depois:** descreve processos, documentos, auditorias e não conformidades do SGQ; riscos por probabilidade e impacto, tratamento, revisão e eficácia; não conformidades com contenção, causa, plano e eficácia; auditorias com planejamento, checklist, constatações, evidências e ações; e indicadores com metas, tolerâncias, semáforos, tendências e lançamentos pendentes.
- **Motivo:** remover garantia de conformidade normativa e automações não demonstradas, mantendo o copy no nível dos fluxos realmente disponíveis.
- **Evidências:** `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `docs/02-visao-do-produto.md`, telas de Governança e Indicadores e inventário `artifacts/web/src/data/delivered-features.generated.ts`.

## Pessoas, competências e aprendizagem

- **Antes:** anunciava avaliação 360°, PDI, carreira e sucessão, recrutamento e seleção, banco de talentos, ponto biométrico, absenteísmo, produtividade e integração com folha. O card de treinamentos também prometia trilhas personalizadas e ROI.
- **Depois:** os cinco slots cobrem colaboradores e competências; treinamentos, turmas, conclusão, certificados e eficácia; cargos e obrigatoriedades; programa anual e indicadores; e comunicação e engajamento.
- **Motivo:** o Daton v2 registra a estrutura organizacional, exigências do cargo, lacunas, aprendizagem e evidências. Ele não é folha, sistema de ponto, recrutamento ou plataforma de carreira.
- **Evidências:** `docs/architecture/people-training-records.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `lib/authz/src/screens/domains/aprendizagem.ts` e `docs/architecture/communication.md`.

## Dados, documentos, formulários, IA e compliance

- **Antes:** prometia backup automático, formulários com integração genérica e relatórios customizados, IA com OCR, extração, classificação e predição, além de monitoramento de mudanças legais.
- **Depois:** informa versões, revisão, aprovação, distribuição e ciência de documentos; modelos de formulário versionados, regras, respostas, anexos e CSV; assistente que consulta somente os dados autorizados e revalida o acesso; e compliance com legislações, requisitos por filial, licenças, prazos, anexos e evidências.
- **Motivo:** deixar claros os limites do produto. O assistente não extrai documentos nem prevê resultados, formulários não oferecem integrações genéricas, e o sistema não monitora alterações legislativas por conta própria.
- **Evidências:** `docs/architecture/internal-forms.md`, `docs/security/daton-ai.md`, `docs/architecture/documents-compliance-audits.md` e fluxos de Documentação do v2.

## Estratégia e governança

- **Antes:** os cards anunciavam BSC, quatro perspectivas, mapas estratégicos, OKRs, check-ins, conselhos, comitês, atas e deliberações, além de uma gestão genérica de projetos.
- **Depois:** os mesmos quatro slots apresentam planejamento estratégico com contexto, SWOT, objetivos, riscos e planos; indicadores e metas; processos do SGQ e análise crítica; e Projeto e Desenvolvimento com entradas, etapas, saídas, revisão, verificação, validação, mudanças, responsáveis e prazos.
- **Motivo:** BSC, OKRs e gestão de conselhos não existem no produto atual. Projeto e Desenvolvimento tem um fluxo específico alinhado ao item 8.3 da ISO 9001.
- **Evidências:** `docs/02-visao-do-produto.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `docs/architecture/action-plans-and-projects.md` e `artifacts/web/src/data/delivered-features.generated.ts`.

## Benefícios, dados e integrações

- **Antes:** prometia recomendações automáticas, relatórios GRI/SASB/CDP e conectores prontos para SAP, Oracle, Dynamics, Power BI, Tableau, APIs e webhooks.
- **Depois:** destaca consulta assistida somente leitura, dados rastreáveis, gestão integrada e adoção progressiva. Os três slots de integração agora informam importação por planilha nos destinos habilitados, exportações disponíveis por módulo e avaliação de integrações sob demanda.
- **Motivo:** não há conectores genéricos nem templates prontos para esses referenciais no v2. Importação e exportação existem, mas variam por destino e módulo.
- **Evidências:** `docs/architecture/data-imports.md`, `docs/architecture/sustainability-reporting.md`, `docs/security/daton-ai.md` e implementações de exportação por domínio.

## Disponibilidade e acessos

- **Antes:** a página apresentava todas as capacidades como disponíveis da mesma forma para qualquer cliente e pessoa.
- **Depois:** o parágrafo existente em “Por que escolher o Daton?” informa que a disponibilidade varia conforme módulos habilitados e permissões.
- **Motivo:** várias capacidades têm ativação gradual por organização e todas respeitam autorização e abrangência.
- **Evidências:** chaves de ativação documentadas nos arquivos de arquitetura e matriz de autorização em `docs/architecture/access-grants.md`.

## CTAs do simulador

- **Antes:** cinco links convidavam a abrir um simulador que não faz parte da landing page nem do Daton v2.
- **Depois:** exatamente esses cinco destinos foram corrigidos como exceção informacional: os rótulos são “Acessar painel” e âncoras externas substituem o Link interno e o clique usa `window.location.href = PAINEL_URL`, apontando para `https://painel.daton.com.br`. Os CTAs de contato passaram a “Solicitar demonstração” e “Conhecer módulos”, sem afirmar que o formulário agenda um horário.
- **Motivo:** remover uma promessa e um destino inexistentes, levando a pessoa ao sistema atual sem criar novo fluxo.
- **Evidências:** `AGENTS.md` do repositório e `src/config/externalApp.ts`.
