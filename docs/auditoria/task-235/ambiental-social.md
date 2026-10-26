# Auditoria de copy — Ambiental, Social, Governança e Tecnologia

Data: 2026-10-23
Escopo: `esgAreas.ts`, `ESGAreaTemplate.tsx` e `ESGAmbiental.tsx`
Revisão 2: código + MasterProduct + sprints; [matriz de reclassificação](masterproduct.md).
Critério: alinhar a landing ao Daton atual e à evolução explicitamente planejada sem alterar estrutura, ordem, componentes, estilos ou comportamento.

## Alterações

| Área | Antes | Depois | Motivo | Evidência no v2 |
| --- | --- | --- | --- | --- |
| Chamadas ESG | Monitoramento “em tempo real”, conformidade automatizada, saúde ocupacional, diversidade e inteligência corporativa | Registro rastreável de emissões, resíduos, recursos e requisitos; pessoas, competências, treinamentos e comunicação; riscos, auditorias, indicadores e processos | Retira resultados e domínios que o produto não comprova e informa que recursos dependem de habilitação e permissão | `docs/architecture/sustainability-data.md`; `docs/architecture/people-training-records.md`; `docs/architecture/communication.md`; schemas e telas de governança |
| Emissões GEE | Inventário automatizado, fatores sempre atualizados e simulação de redução | Inventário por filial e fonte, fatores versionados com fonte, totais por escopo e CSV | O v2 calcula inventários dos escopos 1/2/3 com proveniência e exporta CSV; projetos/compensações são direção futura F29 sem marco confirmado; metas reproduzíveis são planejadas V2.0 (#201 em triagem); simulador não tem evidência | `docs/architecture/sustainability-reporting.md`, introdução, modelo de dados e seção “Clima e Carbono” |
| Resíduos e licenças | Circularidade, eficiência operacional, alertas proativos e dashboard regulatório | Tipos/classes, MTR/CDF, movimentações/destinação; licenças, condicionantes, prazos, obrigações e evidências | Substitui conclusões analíticas por registros existentes e preserva a ressalva de ativação por módulo | `docs/architecture/sustainability-data.md`; `docs/architecture/documents-compliance-audits.md` |
| Pessoas | Avaliação 360, PDI, saúde ocupacional e absenteísmo | Colaboradores, cargos, competências, lacunas e histórico | Esses são os cadastros e controles presentes; PDI é planejado V2.0 (#198 em triagem). Ponto, folha e recrutamento não são objetivos de substituição; avaliação 360, carreira, saúde ocupacional e absenteísmo não têm evidência específica | `docs/architecture/people-training-records.md`; schemas de colaboradores, cargos e competências |
| Treinamentos | LMS, trilhas e avaliação genérica de impacto | Turmas, participantes, conclusões, certificado e avaliação versionada de eficácia | Descreve o fluxo efetivamente implementado e a preservação dos eventos de conclusão | `docs/architecture/people-training-records.md`, regras, endpoints e interface |
| Comunicação | Segurança e engajamento com métricas ocupacionais | Campanhas, público por regras, visualização, ciência e consultas | Mantém o slot com uma capacidade social real do produto | `docs/architecture/communication.md`, estados Enviado → Visualizado → Ciente e regras de consulta |
| Governança | Conselhos, comitês, atas, políticas, mapas estratégicos e OKRs | Riscos e oportunidades, auditorias, não conformidades, SWOT, KPI, processos e análise crítica | Agenda, atas e decisões integradas estão planejadas F31/V2.0 (#202 em triagem), agora explicitadas nos parágrafos. Conselhos especializados, BSC e OKR não têm evidência específica | `lib/db/src/schema/governance-system.ts`, `swot.ts`, `kpi.ts`, `strategic-plans.ts`; páginas de Governança e Indicadores |
| IA | Predição, ML, NLP, extração documental, alertas e ação automática | Assistente contextual, consultas em linguagem natural e ferramentas somente para leitura, limitadas aos acessos autorizados | Hoje consulta sem extrair arquivos ou alterar registros. Extração com confirmação é planejada V3.0/R12-003; ações confirmadas (#211) em triagem. Anomalias V3 por caso não comprovam previsão genérica | `docs/security/daton-ai.md`; configuração `AI_DATA_TOOLS_ENABLED` e módulos excluídos do panorama |
| Arquitetura | Serverless, edge, RLS e cache multicamada | Aplicação web, API Express/OpenAPI, PostgreSQL e registros vinculados à organização | Troca escolhas de infraestrutura não comprovadas pela arquitetura documentada | `CLAUDE.md`; `lib/api-spec/openapi.yaml`; `artifacts/api-server`; `lib/db` |
| Segurança | AES-256 “militar”, TLS 1.3, MFA, RLS e “compliance nativo LGPD” | Senha protegida, JWT, papéis, permissões por módulo, organização, filial e histórico onde disponível | Remove certificações, protocolos e controles não demonstrados; mantém autenticação e autorização existentes | `CLAUDE.md`, seção Authentication & Authorization; middleware de autorização e contratos de registro |
| Integrações | PDF/imagens, API pública para ERP/BI, webhooks e sincronização | Importação por planilha com prévia/rejeitos/reversão e exportações por módulo | API interna não comprova API pública. Conectores/webhooks são planejados V2.0 (#205 em triagem), sem marcas ou formatos universais garantidos | `docs/architecture/data-imports.md`; exports dos módulos; `lib/api-spec/openapi.yaml` |
| Métricas | 6+ frameworks, 12+ módulos, implantação em 48h, 99,9% uptime, milhões de registros, respostas em menos de 5s | Web, perfis/autorização, dados por empresa e histórico conforme o módulo | Não há fonte verificável para os números ou SLA; os mesmos quatro slots passam a comunicar fatos qualitativos | Arquitetura e autorização descritas no repositório v2 |
| Hero e seção técnica | “Tudo o que precisa”, IA/automação/conformidade integradas e “infraestrutura de classe mundial” | Gestão integrada, ressalva de módulos/permissões e tecnologia para organizar acesso, dados e histórico | Reduz afirmações absolutas e alinha a expectativa ao rollout por feature flags | Documentos de arquitetura dos módulos e variáveis de ativação |

## Limites mantidos

- Nenhum pacote pronto GRI/CDP/SASB/TCFD foi anunciado. Hoje os referenciais têm nome e edição livres, e o relato permanece rascunho; revisão/publicação humana está planejada F30/V2.0 (#200 em triagem).
- Projetos e compensações separados das emissões aparecem como direção futura F29, sem versão/task confirmada; metas reproduzíveis são planejadas V2.0. Não foram prometidos créditos negociáveis/certificados, net zero, SBTi, cenários ou saldos não especificados.
- Nenhuma certificação, SLA, volume ou prazo de implantação foi afirmado.
- A quantidade e a ordem dos cards, itens e métricas foram preservadas; só o conteúdo textual mudou.

## Observação fora do escopo textual

O botão “Entre em contato” nos cards não possui ação associada. A correção exige mudança de comportamento e, por isso, não foi feita nesta task textual.

## Refinos de revisão

A revisão independente retirou os absolutos “total rastreabilidade” e “gestão completa”. A revisão em 375 px encurtou os valores dos cards inferiores para “Org.” e “Trilha”, mantendo o tamanho da fonte e todos os estilos, para que os novos textos caibam nos espaços originais.
