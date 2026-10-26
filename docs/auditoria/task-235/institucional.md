> **Histórico do PR 104.** Este documento registra a análise anterior de implementação e roadmap. O critério comercial vigente foi alterado pela pessoa responsável em 26/10/2026; consulte o [posicionamento pelo MasterProduct](README.md).

> Revisão 2: as mudanças institucionais abaixo permanecem. A reauditoria com MasterProduct e sprints está em [masterproduct.md](masterproduct.md); ela reclassifica capacidades futuras sem validar certificações, números ou garantias institucionais.

# Comparativo institucional e componentes de apoio

Revisão: 23/10/2026. As referências ao sistema atual usam o repositório `Web-Star-Studio/Daton`, commit `1f07bd8046e183139f8189f11c7310c8d9553ce5`. Nenhum dado desse sistema foi alterado.

Os textos abaixo são trechos literais. O diff do PR é a referência completa.

## Posicionamento da plataforma e metadados

Arquivo: `index.html`.

O produto atual reúne qualidade, ESG e compliance; não há perfil oficial Lovable a atribuir à Daton. A tag twitter:site foi removida, sem inventar um perfil.

Evidência: `lib/authz/src/screens/domains; artifacts/web/src/App.tsx`.

| Antes | Depois |
| --- | --- |
| Daton - Plataforma ESG Inteligente | Daton - Gestão da Qualidade, ESG e Compliance |
| Plataforma SaaS B2B de ponta para gestão ESG, focada no mercado brasileiro | Gestão da qualidade, ESG e compliance com documentos, indicadores, treinamentos, fornecedores e planos de ação em um só painel. |
| &lt;meta name="twitter:site" content="@lovable_dev" /> | Tag twitter:site removida: não há perfil oficial confirmado. |

## Rodapé

Arquivo: `src/components/landing/heimdall/PublicFooter.tsx`.

O resumo passa a representar a amplitude real do sistema, além do recorte ESG.

Evidência: `lib/authz/src/screens/domains`.

| Antes | Depois |
| --- | --- |
| Plataforma ESG para transformar dados em decisões estratégicas nas<br>            frentes Ambiental, Social e Governança. | Gestão da qualidade, ESG e compliance para conectar documentos,<br>            pessoas, indicadores e ações em um só painel. |

## Contato e demonstração

Arquivo: `src/pages/Contato.tsx`.

O formulário só chama preventDefault e não envia nem agenda. Foi mantido, com aviso explícito e o contato institucional já publicado nos Termos. Retirada promessa de resposta em 24h.

Evidência: `landing: src/pages/Contato.tsx:19-22; src/pages/Termos.tsx`.

| Antes | Depois |
| --- | --- |
| Vamos construir sua operação ESG com clareza e execução. | Vamos conectar qualidade, ESG e compliance na sua operação. |
| Agende uma demonstração personalizada e veja como transformar<br>              Ambiental, Social e Governança em decisões práticas no dia a dia da<br>              sua empresa. | Conheça os módulos do Daton e converse sobre as necessidades da<br>              sua empresa pelo e-mail contato@daton.com.br. |
| Solicite sua demonstração | Fale com a equipe Daton |
| Preencha os dados e retornamos em até 24h úteis. | Este formulário ainda não envia solicitações. Para solicitar uma demonstração, escreva para contato@daton.com.br. |
| Agendar demonstração | Formulário demonstrativo |

## Canais de ajuda

Arquivo: `src/pages/FAQ.tsx`.

O painel tem Central de Ajuda; endereços plataforma.com e 0800 eram placeholders. Corrigidos destinos, preservando controles e ícones.

Evidência: `artifacts/web/src/pages/app/ajuda.tsx; artifacts/web/src/components/layout/AppLayout.tsx`.

| Antes | Depois |
| --- | --- |
| <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4"> | <Button variant="outline" className="h-auto min-h-[44px] flex-col gap-2 py-4" onClick={() => { window.location.href = "https://painel.daton.com.br/app/ajuda"; }}> |
| Chat ao vivo | Ajuda no painel |
| Seg-Sex, 9h-18h | Acesso ao painel |
| mailto:suporte@plataforma.com | mailto:contato@daton.com.br |
| Resposta em 24h | Contato Daton |
| tel:0800-xxx-xxxx | /contato |
| >Telefone< | >Contato< |
| 0800-XXX-XXXX | Página de contato |
| https://ajuda.plataforma.com | /documentacao |
| Guias completos | Orientações |

## Segurança e armazenamento

Arquivo: `src/pages/Seguranca.tsx`.

Retiradas certificações, SLA de incidentes, MFA e versões específicas de criptografia sem comprovação. Sessão usa JWT em armazenamento local; não foi encontrado mecanismo de consentimento/analytics por cookies nesta landing.

Evidência: `artifacts/api-server/src/middlewares/auth.ts; artifacts/api-server/src/services/organizations/registration.ts; artifacts/web/src/lib/api.ts; docs/security/autorizacao.md`.

| Antes | Depois |
| --- | --- |
| Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256). | O acesso ao painel usa HTTPS, e as conexões com o banco de dados usam SSL. |
| Sistema de permissões baseado em papéis (RBAC) com autenticação multifator disponível. | O acesso é validado por organização, papel, módulo e abrangência de filiais. |
| Monitoramento Contínuo | Registros de Segurança |
| Detecção de ameaças em tempo real e logs de auditoria completos. | Eventos de acesso e segurança são registrados. Os históricos de negócio dependem do fluxo e do módulo. |
| Hospedagem em data centers certificados SOC 2 Type II e ISO 27001. | O sistema usa serviços de nuvem para a API, o banco de dados e o armazenamento de arquivos. |
| Senhas armazenadas com hash bcrypt e políticas de complexidade obrigatórias. | Senhas são protegidas com hash bcrypt. Cada pessoa acessa o painel com suas próprias credenciais. |
| Resposta a Incidentes | Bloqueio de Acesso |
| Plano de resposta a incidentes 24/7 com notificação dentro de 72 horas. | A administração pode bloquear contas para impedir novos acessos e preservar os registros existentes. |
| Segurança e Cookies | Segurança e Armazenamento |
| Política de Cookies | Armazenamento no Navegador |
| Utilizamos cookies para melhorar sua experiência na plataforma. Os tipos de cookies que usamos incluem: | A landing page institucional e o painel são aplicações distintas. O navegador pode guardar dados necessários ao funcionamento de cada aplicação: |
| Cookies Essenciais | Sessão no Painel |
| Necessários para o funcionamento básico da plataforma, como autenticação e preferências de sessão. <br>                  Não podem ser desabilitados. | O painel guarda o token de acesso no armazenamento local do navegador. <br>                  A sessão do sistema não é compartilhada automaticamente com esta landing page. |
| Cookies de Desempenho | Dados de Uso |
| Coletam informações sobre como você usa a plataforma, ajudando-nos a melhorar a experiência. <br>                  Dados são anonimizados. | O painel registra acessos e operações autenticadas para acompanhar o uso e a segurança. <br>                  Isso não equivale a cookies de análise anônima nesta página. |
| Cookies Funcionais | Preferências Locais |
| Permitem que a plataforma lembre suas preferências, como idioma e configurações de visualização. | As preferências disponíveis em cada aplicação podem ser mantidas no navegador. Limpar esses dados pode exigir novo acesso ou configuração. |
| Certificações e Compliance | Controles Aplicados |
| Nossa plataforma está em conformidade com: | Os controles técnicos do sistema incluem: |
| LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018) | Acesso aos dados limitado à organização e às permissões da pessoa |
| ISO 27001 - Sistema de Gestão de Segurança da Informação | Validação de papéis, módulos e abrangência de filiais no servidor |
| SOC 2 Type II - Controles de Segurança e Disponibilidade | Arquivos protegidos por regras de acesso |
| OWASP Top 10 - Melhores práticas de segurança web | Senhas protegidas e possibilidade de bloqueio de contas |

## Privacidade — descrição técnica

Arquivo: `src/pages/Privacidade.tsx`.

Escopo técnico atualizado, data da edição fixada e alegação ampla de monitoramento substituída pelos controles documentados. As cláusulas legais e contatos foram preservados.

Evidência: `docs/architecture/product-monitoring.md; docs/security/daton-ai.md`.

| Antes | Depois |
| --- | --- |
| Última atualização: {new Date().toLocaleDateString('pt-BR')} | Última atualização: 23/10/2026 |
| Fornecer e melhorar nossos serviços de gestão ESG | Fornecer e melhorar nossos serviços de qualidade, ESG e compliance |
| Processar relatórios de sustentabilidade e compliance | Organizar registros, indicadores e evidências dos módulos disponíveis |
| incluindo criptografia, controle de acesso e monitoramento contínuo de segurança. | incluindo proteção de credenciais, controle de acesso e registro de eventos de segurança. |

## Termos — serviço e acesso

Arquivo: `src/pages/Termos.tsx`.

Descrição compatível com módulos habilitados e permissões; cadastro de nova empresa exige código gratuito. Cláusulas de responsabilidade e foro preservadas. Data fixa evita apresentar toda visita como nova revisão.

Evidência: `docs/architecture/registration-vouchers.md; docs/architecture/sustainability-reporting.md`.

| Antes | Depois |
| --- | --- |
| Última atualização: {new Date().toLocaleDateString('pt-BR')} | Última atualização: 23/10/2026 |
| A Daton fornece uma plataforma de gestão ESG (Environmental, Social and Governance) que <br>              permite às empresas: | A Daton fornece uma plataforma de gestão da qualidade, ESG (Environmental, Social and Governance) e compliance que, conforme os módulos habilitados e as permissões, permite às empresas: |
| Gerar relatórios de compliance ambiental e social | Organizar registros, documentos e evidências de compliance |
| Gerenciar inventários de emissões de GEE | Estruturar inventários de emissões de GEE nos módulos habilitados |
| Para utilizar nossos serviços, você deve criar uma conta. Você é responsável por: | O acesso usa uma conta individual. Novas empresas precisam de um código de acesso gratuito emitido pela equipe Daton; pessoas convidadas acessam pelo convite recebido. Você é responsável por: |

## Sobre Nós e diferenciais

Arquivo: `src/pages/SobreNos.tsx`.

Substituídas promessas de RH amplo, financeiro, predição, frameworks prontos, RLS e compliance total por capacidades observadas no v2.

Evidência: `docs/architecture/people-training-records.md; docs/architecture/sustainability-reporting.md; docs/security/daton-ai.md; docs/architecture/supplier-status.md`.

| Antes | Depois |
| --- | --- |
| Dados abertos, rastreabilidade total e auditabilidade em cada processo. | Dados organizados, histórico de registros e clareza nos fluxos de gestão. |
| Auditoria completa de ações | Histórico nos fluxos de gestão |
| Rastreabilidade de dados ponta a ponta | Registros com origem e responsáveis |
| Logs imutáveis de operações | Evidências e versões por módulo |
| Onboarding guiado e progressivo | Acesso por convite ou código |
| Automações invisíveis ao usuário | Pendências com origem e responsável |
| IA explicável e auditável | IA para consultas autorizadas |
| Privacidade por design (LGPD) | Controle de acesso por empresa |
| Governança ética de algoritmos | Respostas da IA sujeitas a revisão |
| O Daton ESG Insight reúne em um único ambiente os módulos necessários para gerenciar o desempenho ambiental, social, de qualidade e de cadeia de fornecedores da sua organização. | O Daton reúne qualidade, pessoas, fornecedores e dados ESG em um único painel. Os recursos disponíveis dependem dos módulos habilitados e das permissões de cada pessoa. |
| Indicadores de diversidade e inclusão, gestão de treinamentos, segurança do trabalho e programas de impacto comunitário. | Colaboradores, cargos, competências, treinamentos, certificados e avaliação de eficácia. |
| Homologação, avaliação de desempenho, portal de autoatendimento e monitoramento de riscos ESG na cadeia. | Homologação, avaliação de desempenho, portal do fornecedor e controle de requisitos documentais. |
| Assistente de IA contextual, extração automática de documentos, alertas preditivos e recomendações acionáveis. | Assistente de IA para orientação e consulta aos dados autorizados, com alterações realizadas nas telas do sistema. |
| indicadores financeiros | indicadores de desempenho |
| IA que trabalha por você | IA para apoiar consultas |
| Extração automática de documentos e alertas proativos. | Orientação e consulta contextual aos dados do sistema. |
| Cálculos de emissões, classificação de documentos e sugestões inteligentes para que sua equipe foque no que importa: estratégia. | O assistente consulta pendências, indicadores e registros permitidos, em modo somente leitura. A equipe revisa as respostas e realiza as ações no sistema. |
| Relatórios GRI, SASB e TCFD gerados automaticamente. | Referenciais, requisitos e evidências organizados por período. |
| Dados já validados e auditáveis, prontos para envio a reguladores e stakeholders com um clique. | Os recursos ESG permitem registrar respostas e evidências e estruturar relatos de trabalho em rascunho, quando habilitados. |
| Segurança enterprise | Acesso controlado |
| Criptografia AES-256 e isolamento por empresa. | Credenciais protegidas e acesso por organização. |
| Row Level Security, RBAC granular com quatro níveis de permissão e conformidade total com a LGPD. | O servidor valida organização, papel, módulo e abrangência de acesso para cada operação. |
| Equipe especializada em ESG e qualidade. | Converse com a equipe Daton. |
| Profissionais que entendem o contexto regulatório brasileiro e acompanham sua jornada de maturidade. | Use o canal Feedback no painel para dúvidas, problemas e ideias, ou entre em contato pelo e-mail institucional. |
| Monitoramento em tempo real | Acompanhamento operacional |
| Indicadores e metas atualizados minuto a minuto. | Indicadores, metas e pendências por período. |
| Dashboards dinâmicos com alertas configuráveis, não apenas relatórios no fechamento do mês. | Os painéis apresentam os dados registrados nos módulos e ajudam a acompanhar desvios e próximos passos. |

## Proposta de valor (componente sem montagem atual)

Arquivo: `src/components/landing/heimdall/ValueProposition.tsx`.

Corrige conteúdo dormente sem inserir novas seções; evita que promessas antigas retornem em reutilização.

Evidência: `docs/architecture/sustainability-reporting.md; docs/security/daton-ai.md`.

| Antes | Depois |
| --- | --- |
| Identifique oportunidades de otimização em seus processos ESG com análise de dados em tempo real. | Acompanhe indicadores e pendências para identificar oportunidades de melhoria nos processos. |
| Sistema de alertas proativos e gestão automatizada de licenças para evitar não-conformidades. | Acompanhe licenças, renovações e vencimentos por filial, com registros e evidências. |
| Relatórios automatizados | Referenciais e evidências ESG |
| Geração instantânea de relatórios GRI, SASB e TCFD com dados validados e auditáveis. | Organize referenciais, requisitos e evidências em relatos de trabalho em rascunho, quando habilitados. |
| Cálculo automático de emissões conforme GHG Protocol com fatores de emissão atualizados. | Estruture inventários por escopo com fontes, fatores versionados e cálculo rastreável, quando habilitados. |
| Algoritmos de machine learning para previsões e recomendações acionáveis. | Consulte registros, indicadores e pendências autorizados com o assistente, em modo somente leitura. |

## Tecnologia (componente sem montagem atual)

Arquivo: `src/components/landing/heimdall/TechStack3D.tsx`.

Troca ML e processamento em tempo real por consulta autorizada e dados organizados.

Evidência: `docs/security/daton-ai.md; DEPLOYMENT.md`.

| Antes | Depois |
| --- | --- |
| Virtual Intelligence | Assistente Daton AI |
| AI Engine | Consulta contextual |
| Análise preditiva e recomendações inteligentes com machine learning avançado. | Orientação sobre o produto e consulta, em modo somente leitura, aos dados autorizados. |
| Data Core | Dados organizados |
| Processing Hub | Gestão por organização |
| Processamento em tempo real de milhares de pontos de dados ESG. | Registros, indicadores e evidências dos módulos disponíveis para cada empresa. |

## Estatísticas (componente sem montagem atual)

Arquivo: `src/components/landing/heimdall/StatsGrid.tsx`.

Percentuais, desempenho e SLA não têm estudo que os sustente. Mesmos seis slots agora apresentam fatos: 3 escopos, 17 ODS, 3 tipos de feedback, painel, 5W2H e conta individual.

Evidência: `docs/architecture/sustainability-reporting.md; artifacts/web/src/components/feedback/FeedbackWidget.tsx; docs/architecture/action-plans-and-projects.md`.

| Antes | Depois |
| --- | --- |
| { value: '70', suffix: '%', label: 'Redução de tempo', description: 'Em processos manuais de coleta de dados' } | { value: '3', suffix: '', label: 'Escopos de emissão', description: 'Inventários GEE nos módulos habilitados' } |
| { value: '40', suffix: '+', label: 'Indicadores ESG', description: 'Monitorados automaticamente' } | { value: '17', suffix: '', label: 'ODS como referência', description: 'Leitura de iniciativas ESG por objetivo' } |
| { value: '99', suffix: '.9%', label: 'Precisão', description: 'Nos cálculos de emissões GEE' } | { value: '3', suffix: '', label: 'Tipos de feedback', description: 'Problema, ideia ou dúvida no painel' } |
| { value: '15', label: 'Minutos', description: 'Para configuração inicial' } | { value: '1', label: 'Painel integrado', description: 'Acesso aos módulos da organização' } |
| { value: '24', suffix: '/7', label: 'Monitoramento', description: 'Alertas em tempo real' } | { value: '5', suffix: 'W2H', label: 'Planos de ação', description: 'Ações com responsáveis e prazos' } |
| { value: '3', suffix: 'x', label: 'Mais rápido', description: 'Geração de relatórios' } | { value: '1', suffix: '', label: 'Conta individual', description: 'Permissões definidas para cada pessoa' } |
| Resultados comprovados | Capacidades do produto |
| Dados que demonstram nosso impacto | Recursos para organizar a gestão |

## Novidades (componente sem montagem atual)

Arquivo: `src/components/landing/heimdall/NewsTicker.tsx`.

Retiradas datas/eventos/parcerias fictícios. Os quatro slots descrevem capacidades, sem apresentá-las como notícia datada.

Evidência: `docs/security/daton-ai.md; docs/architecture/data-imports.md; docs/architecture/sustainability-data.md`.

| Antes | Depois |
| --- | --- |
| { date: 'Dec 2024', title: 'Plataforma Daton lança módulo de IA para análise preditiva de emissões', category: 'Product' } | { date: 'Produto', title: 'Daton AI orienta e consulta dados conforme as permissões de acesso', category: 'Inteligência Artificial' } |
| { date: 'Nov 2024', title: 'Parceria estratégica com principais certificadoras ESG do Brasil', category: 'Partnership' } | { date: 'Qualidade', title: 'Documentos, auditorias e planos de ação apoiam os fluxos do SGQ', category: 'Gestão' } |
| { date: 'Oct 2024', title: 'Novo dashboard de monitoramento em tempo real para gestão de resíduos', category: 'Feature' } | { date: 'Ambiental', title: 'Registros de resíduos e evidências de destinação nos módulos habilitados', category: 'Operação' } |
| { date: 'Sep 2024', title: 'Integração nativa com sistemas ERP e plataformas de compliance', category: 'Integration' } | { date: 'Dados', title: 'Importação assistida por planilha para os destinos habilitados', category: 'Importação' } |
| UPDATES | PRODUTO |

## Revisão independente — bloco “Seus dados, sua soberania”

O parágrafo final de Sobre Nós também anunciava RLS, TLS 1.3, AES-256, logs completos e LGPD Compliant. Foi substituído por validação no servidor por organização, papel, módulo e filiais, senhas protegidas com bcrypt, sessões JWT e controles próprios de cada fluxo. Os quatro badges agora são “Senhas protegidas”, “Sessões autenticadas”, “Acesso por empresa” e “Papéis e permissões”. A quantidade e a aparência foram preservadas. Evidências: `artifacts/api-server/src/middlewares/auth.ts`, `artifacts/api-server/src/services/organizations/registration.ts` e `docs/security/autorizacao.md` do v2.
