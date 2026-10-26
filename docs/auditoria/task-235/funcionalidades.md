> **Histórico do PR 104.** Este documento registra a análise anterior de implementação e roadmap. O critério comercial vigente foi alterado pela pessoa responsável em 26/10/2026; consulte o [posicionamento pelo MasterProduct](README.md).

# Auditoria de copy — Funcionalidades

Escopo: `src/pages/Funcionalidades.tsx`.

A auditoria comparou as promessas da landing page com o código atual, o MasterProduct e as sprints. A [reclassificação de capacidades futuras](masterproduct.md) integra esta revisão 2. A estrutura da página, a ordem das seções, a quantidade de cards, os ícones, as classes e os estilos foram preservados. As mudanças abaixo são exclusivamente de texto, salvo a correção dos links do simulador inexistente para o painel atual.

## Hero e proposta geral

- **Antes:** prometia “funcionalidades completas”, “automação inteligente”, 30+ módulos, visão 360° e monitoramento 24/7, sem fonte que sustentasse os números ou a disponibilidade uniforme.
- **Depois:** apresenta gestão integrada de qualidade, pessoas, ambiente e governança, com responsabilidades, prazos, registros e evidências. Os três números viraram qualidades verificáveis: integração, rastreabilidade e configuração de acessos.
- **Motivo:** retirar absolutos e métricas promocionais não comprovadas e descrever o valor transversal efetivamente entregue.
- **Evidências:** `docs/02-visao-do-produto.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md` e registros de telas em `lib/authz/src/screens/domains/`.

## ESG e sustentabilidade

- **Antes:** misturava capacidades reais com monitoramento em tempo real, fatores sempre atualizados, economia circular, créditos de carbono, ROI ambiental, certificações internacionais, metas ESG e uma gestão genérica de stakeholders.
- **Depois:** detalha inventário GEE por escopos com fatores versionados, emissões calculadas, totais e CSV; licenças, condicionantes e obrigações; resíduos com transportador, destinador, MTR e CDF; temas, respostas, evidências, iniciativas, ODS e relatos em rascunho; LAIA e controles; e cadastro compartilhado de terceiros e partes interessadas.
- **Motivo:** créditos certificados e garantias não têm evidência específica. Projetos/compensações separados das emissões constam da direção futura F29, sem versão/task confirmada. Metas reproduzíveis e publicação humana fazem parte da evolução V2.0 (#200/#201 em triagem); os parágrafos existentes agora distinguem esse planejamento da base atual. Os cards foram mantidos.
- **Evidências:** `docs/architecture/sustainability-reporting.md`, `docs/architecture/sustainability-data.md`, `docs/architecture/external-actors.md` e `docs/architecture/documents-compliance-audits.md`.

## Qualidade e processos

- **Antes:** declarava conformidade completa com ISO 9001, 14001 e 45001, avaliação quantitativa de riscos, relatórios automáticos de auditoria, dashboards em tempo real, alertas automáticos e análise estatística.
- **Depois:** descreve processos, documentos, auditorias e não conformidades do SGQ; riscos por probabilidade e impacto, tratamento, revisão e eficácia; não conformidades com contenção, causa, plano e eficácia; auditorias com planejamento, checklist, constatações, evidências e ações; e indicadores com metas, tolerâncias, semáforos, tendências e lançamentos pendentes.
- **Motivo:** remover garantia de conformidade normativa e automações não demonstradas, mantendo o copy no nível dos fluxos realmente disponíveis.
- **Evidências:** `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `docs/02-visao-do-produto.md`, telas de Governança e Indicadores e inventário `artifacts/web/src/data/delivered-features.generated.ts`.

## Pessoas, competências e aprendizagem

- **Antes:** anunciava avaliação 360°, PDI, carreira e sucessão, recrutamento e seleção, banco de talentos, ponto biométrico, absenteísmo, produtividade e integração com folha. O card de treinamentos também prometia trilhas personalizadas e ROI.
- **Depois:** os cinco slots cobrem colaboradores e competências; treinamentos, turmas, conclusão, certificados e eficácia; cargos e obrigatoriedades; programa anual e indicadores; e comunicação e engajamento.
- **Motivo:** o Daton v2 registra a estrutura organizacional, exigências do cargo, lacunas, aprendizagem e evidências. Não substitui folha, ponto ou recrutamento (limite explícito do Master); carreira, sucessão e avaliação 360° continuam sem evidência específica. PDI consta da task #198 em triagem e foi reinserido como planejado V2.0, sem afirmar entrega.
- **Evidências:** `docs/architecture/people-training-records.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `lib/authz/src/screens/domains/aprendizagem.ts` e `docs/architecture/communication.md`.

## Dados, documentos, formulários, IA e compliance

- **Antes:** prometia backup automático, formulários com integração genérica e relatórios customizados, IA com OCR, extração, classificação e predição, além de monitoramento de mudanças legais.
- **Depois:** informa versões, revisão, aprovação, distribuição e ciência de documentos; modelos de formulário versionados, regras, respostas, anexos e CSV; assistente que consulta somente os dados autorizados e revalida o acesso; e compliance com legislações, requisitos por filial, licenças, prazos, anexos e evidências.
- **Motivo:** deixar claros os limites do produto. Hoje o assistente não extrai documentos nem prevê resultados; a extração assistida com fonte e revisão humana é planejada V3.0 (R12-003), e ações confirmadas estão em triagem (#211). Formulários externos estão previstos F33/V2.0; isso não comprova links públicos genéricos atuais. Monitoramento legislativo e previsões específicas não foram anunciados.
- **Evidências:** `docs/architecture/internal-forms.md`, `docs/security/daton-ai.md`, `docs/architecture/documents-compliance-audits.md` e fluxos de Documentação do v2.

## Estratégia e governança

- **Antes:** os cards anunciavam BSC, quatro perspectivas, mapas estratégicos, OKRs, check-ins, conselhos, comitês, atas e deliberações, além de uma gestão genérica de projetos.
- **Depois:** os mesmos quatro slots apresentam planejamento estratégico com contexto, SWOT, objetivos, riscos e planos; indicadores e metas; processos do SGQ e análise crítica; e Projeto e Desenvolvimento com entradas, etapas, saídas, revisão, verificação, validação, mudanças, responsáveis e prazos.
- **Motivo:** BSC, OKRs e gestão especializada de conselhos não têm evidência específica no Master. Agenda, atas e decisões integradas são planejadas F31/V2.0 (#202 em triagem), e o parágrafo de Processos e Análise Crítica informa essa evolução. Projeto e Desenvolvimento mantém o fluxo específico do SGQ.
- **Evidências:** `docs/02-visao-do-produto.md`, `docs/contexto-sistema/01-CONTEXTO-DO-SISTEMA.md`, `docs/architecture/action-plans-and-projects.md` e `artifacts/web/src/data/delivered-features.generated.ts`.

## Benefícios, dados e integrações

- **Antes:** prometia recomendações automáticas, relatórios GRI/SASB/CDP e conectores prontos para SAP, Oracle, Dynamics, Power BI, Tableau, APIs e webhooks.
- **Depois:** destaca consulta assistida somente leitura, dados rastreáveis, gestão integrada e adoção progressiva. Os três slots de integração agora informam importação por planilha nos destinos habilitados, exportações disponíveis por módulo e conectores planejados para V2.0, condicionados ao contrato de cada integração. Catálogo de relatórios e BI também aparece como planejado.
- **Motivo:** importações e saídas por módulo existem. Conectores/webhooks (#205) e catálogo/BI (#203) são planejados V2.0, ambos em triagem, sem marcas, API pública, OAuth ou formatos universais garantidos. Referenciais configuráveis não equivalem a pacotes prontos.
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
