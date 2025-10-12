/**
 * FAQ Data
 * Centralized FAQ content organized by categories
 */

import { FAQCategory } from "@/types/faq";

export const faqCategories: FAQCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    icon: "Rocket",
    description: "Comece sua jornada na plataforma",
    questions: [
      {
        id: "criar-conta",
        question: "Como criar minha conta?",
        answer: "Para criar sua conta, clique no botão 'Criar Conta' na página inicial. Preencha seus dados (nome, e-mail, senha) e confirme seu e-mail através do link enviado. Após a confirmação, você terá acesso completo à plataforma.",
        tags: ["conta", "cadastro", "registro", "email"],
        relatedQuestions: ["configurar-empresa", "convidar-usuarios"]
      },
      {
        id: "configurar-empresa",
        question: "Como configurar minha empresa na plataforma?",
        answer: "Após fazer login, acesse Configurações > Perfil da Empresa. Preencha informações como nome, CNPJ, endereço, setor de atuação e porte. Esses dados serão usados nos relatórios e cálculos de emissões. Você também pode fazer upload do logotipo da empresa nesta seção.",
        tags: ["empresa", "configuração", "perfil", "cnpj"],
        relatedQuestions: ["criar-conta", "permissoes"]
      },
      {
        id: "primeiros-passos-login",
        question: "Quais são os primeiros passos após o login?",
        answer: "Após o primeiro login, você verá um tour interativo guiado. Recomendamos: 1) Configurar o perfil da empresa, 2) Convidar usuários da equipe, 3) Explorar o dashboard principal, 4) Iniciar pela seção de Documentos para fazer upload de dados, 5) Acessar os tutoriais específicos de cada módulo.",
        tags: ["tutorial", "onboarding", "guia", "início"],
        relatedQuestions: ["configurar-empresa", "tutoriais"]
      },
      {
        id: "permissoes",
        question: "Como funciona o sistema de permissões?",
        answer: "A plataforma possui 4 níveis de acesso: Administrador (acesso total), Gerente (visualização e edição sem configurações críticas), Analista (visualização e edição limitada) e Visualizador (somente leitura). As permissões podem ser configuradas por módulo em Gestão de Usuários.",
        tags: ["permissões", "acesso", "usuários", "roles"],
        relatedQuestions: ["convidar-usuarios", "gestao-usuarios"]
      },
      {
        id: "convidar-usuarios",
        question: "Como convidar outros usuários?",
        answer: "Acesse Gestão de Usuários no menu lateral, clique em 'Convidar Usuário', preencha o e-mail e selecione o nível de permissão. O usuário receberá um e-mail com link de ativação. Você pode gerenciar, editar ou remover usuários a qualquer momento.",
        tags: ["usuários", "convite", "equipe", "time"],
        relatedQuestions: ["permissoes", "gestao-usuarios"]
      },
      {
        id: "tutoriais",
        question: "Onde encontro os tutoriais interativos?",
        answer: "Os tutoriais estão disponíveis no ícone de interrogação (?) no canto superior direito. Você também pode acessar tutoriais específicos clicando no ícone de ajuda em cada módulo. Oferecemos tutoriais em vídeo, guias passo-a-passo e documentação completa.",
        tags: ["tutorial", "ajuda", "guia", "vídeos"],
        relatedQuestions: ["primeiros-passos-login", "suporte"]
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard e Visualizações",
    icon: "BarChart3",
    description: "Entenda seus indicadores e métricas",
    questions: [
      {
        id: "interpretar-graficos",
        question: "Como interpretar os gráficos do dashboard?",
        answer: "Cada gráfico possui um ícone de informação (i) que explica a métrica. Os gráficos de emissões mostram totais por escopo e tendências temporais. Os gráficos de resíduos apresentam destinação e reciclagem. Passe o mouse sobre os elementos para ver detalhes. Use os filtros de período no topo para análises temporais.",
        tags: ["dashboard", "gráficos", "métricas", "visualização"],
        relatedQuestions: ["exportar-dashboard", "metricas-automaticas"]
      },
      {
        id: "personalizar-widgets",
        question: "Como personalizar widgets?",
        answer: "Clique no ícone de engrenagem no canto superior direito do dashboard. Você pode adicionar, remover ou reordenar widgets arrastando-os. É possível criar dashboards customizados salvando suas configurações favoritas. Cada usuário pode ter suas próprias visualizações personalizadas.",
        tags: ["dashboard", "widgets", "personalização", "customização"],
        relatedQuestions: ["interpretar-graficos", "dashboards-customizados"]
      },
      {
        id: "exportar-dashboard",
        question: "Como exportar dados do dashboard?",
        answer: "Use o botão 'Exportar' no topo do dashboard. Você pode exportar em PDF (relatório visual completo), Excel (dados brutos para análise) ou PNG (imagem do dashboard). Os exports incluem todos os filtros e períodos selecionados.",
        tags: ["exportar", "pdf", "excel", "dados"],
        relatedQuestions: ["interpretar-graficos", "relatorios"]
      },
      {
        id: "metricas-automaticas",
        question: "Quais métricas são calculadas automaticamente?",
        answer: "A plataforma calcula automaticamente: emissões totais de GEE por escopo, intensidade de carbono, percentual de resíduos reciclados, índice de conformidade, progresso de metas, taxa de não conformidades, score ESG geral e KPIs específicos de cada módulo. Todos os cálculos seguem metodologias internacionais.",
        tags: ["métricas", "cálculos", "kpi", "automatização"],
        relatedQuestions: ["interpretar-graficos", "metodologias"]
      },
      {
        id: "dashboards-customizados",
        question: "Como criar dashboards customizados?",
        answer: "Acesse Dashboard > Novo Dashboard Customizado. Escolha os widgets desejados, configure filtros padrão, defina o período de análise e salve com um nome. Você pode criar múltiplos dashboards para diferentes públicos (executivo, operacional, regulatório).",
        tags: ["dashboard", "customização", "widgets", "personalização"],
        relatedQuestions: ["personalizar-widgets", "exportar-dashboard"]
      }
    ]
  },
  {
    id: "inventario-gee",
    title: "Inventário de Emissões (GEE)",
    icon: "Cloud",
    description: "Cálculo e gestão de emissões de gases de efeito estufa",
    questions: [
      {
        id: "metodologias",
        question: "Quais metodologias de cálculo são suportadas?",
        answer: "A plataforma suporta GHG Protocol (Escopo 1, 2 e 3), ISO 14064-1:2018, e metodologias do IPCC. Você pode escolher a metodologia nas configurações do inventário. Todos os fatores de emissão são atualizados conforme bases oficiais (IPCC, EPA, DEFRA, SEEG Brasil).",
        tags: ["metodologia", "ghg protocol", "iso 14064", "ipcc"],
        relatedQuestions: ["fatores-emissao", "escopos"]
      },
      {
        id: "adicionar-fontes",
        question: "Como adicionar fontes de emissão?",
        answer: "Acesse Inventário GEE > Fontes de Emissão > Adicionar Fonte. Selecione o escopo (1, 2 ou 3), categoria (combustão estacionária, móvel, fugitivas, etc.), tipo de combustível/atividade e unidade de medida. Preencha os dados de consumo manualmente ou importe via planilha.",
        tags: ["fontes", "emissões", "cadastro", "escopo"],
        relatedQuestions: ["escopos", "importar-dados"]
      },
      {
        id: "escopos",
        question: "Quais escopos são calculados?",
        answer: "**Escopo 1**: Emissões diretas (combustão, processos, fugitivas). **Escopo 2**: Emissões indiretas de energia elétrica comprada. **Escopo 3**: Outras emissões indiretas (transporte terceirizado, viagens, resíduos, fornecedores). A plataforma calcula todos os 15 categorias do Escopo 3 conforme GHG Protocol.",
        tags: ["escopo", "escopo 1", "escopo 2", "escopo 3"],
        relatedQuestions: ["metodologias", "adicionar-fontes"]
      },
      {
        id: "importar-dados",
        question: "Como importar dados de consumo?",
        answer: "Use Documentos > Upload de Arquivos ou Inventário GEE > Importar Dados. Aceitamos Excel (.xlsx), CSV e PDF (com extração IA). Faça download do template de importação para garantir formatação correta. A IA pode extrair automaticamente dados de contas de energia e notas fiscais.",
        tags: ["importação", "planilha", "upload", "dados"],
        relatedQuestions: ["adicionar-fontes", "extracao-ia"]
      },
      {
        id: "emissoes-transporte",
        question: "Como calcular emissões de transporte?",
        answer: "Acesse Inventário GEE > Transporte. Cadastre veículos (próprios ou terceirizados), tipo de combustível, consumo médio e distâncias percorridas. Para frota própria (Escopo 1), use dados de abastecimento. Para transporte terceirizado (Escopo 3), use km rodados ou gasto com frete. A plataforma calcula automaticamente usando fatores de emissão específicos por tipo de veículo.",
        tags: ["transporte", "veículos", "frota", "logística"],
        relatedQuestions: ["escopos", "adicionar-fontes"]
      },
      {
        id: "fatores-emissao",
        question: "O que são fatores de emissão?",
        answer: "Fatores de emissão são coeficientes que convertem atividade (ex: litros de diesel) em emissões de CO2e. A plataforma usa bases oficiais atualizadas: IPCC (global), EPA (EUA), DEFRA (UK), MCT/SEEG (Brasil). Você pode visualizar e personalizar fatores em Configurações > Fatores de Emissão.",
        tags: ["fatores", "cálculo", "coeficientes", "emissões"],
        relatedQuestions: ["metodologias", "adicionar-fontes"]
      },
      {
        id: "projetos-carbono",
        question: "Como registrar projetos de carbono?",
        answer: "Acesse Inventário GEE > Projetos de Redução/Compensação. Cadastre projetos de eficiência energética, energia renovável, reflorestamento ou compra de créditos. Informe reduções estimadas ou certificadas, status do projeto e documentação. Os projetos aparecem separadamente no inventário e nos relatórios.",
        tags: ["projetos", "compensação", "créditos", "redução"],
        relatedQuestions: ["metas", "relatorios-inventario"]
      },
      {
        id: "relatorios-inventario",
        question: "Como gerar relatórios de inventário?",
        answer: "Acesse Inventário GEE > Relatórios. Selecione o período, escopos desejados e formato (PDF executivo, Excel detalhado, ou padrão GHG Protocol). O relatório inclui: totais por escopo e categoria, gráficos de evolução temporal, fontes mais relevantes, comparação com períodos anteriores e metodologia aplicada.",
        tags: ["relatórios", "inventário", "ghg protocol", "exportar"],
        relatedQuestions: ["metodologias", "escopos"]
      }
    ]
  },
  {
    id: "residuos",
    title: "Gestão de Resíduos",
    icon: "Trash2",
    description: "Controle de geração, destinação e reciclagem",
    questions: [
      {
        id: "cadastrar-residuos",
        question: "Como cadastrar tipos de resíduos?",
        answer: "Acesse Resíduos > Tipos de Resíduos > Adicionar. Informe nome, classe (I, II-A, II-B), código ABNT, descrição e unidade de medida (kg, ton, m³, L). Você pode também importar tipos de resíduos via planilha Excel usando o template disponível.",
        tags: ["resíduos", "cadastro", "tipos", "classificação"],
        relatedQuestions: ["destinacao-residuos", "pgrs"]
      },
      {
        id: "destinacao-residuos",
        question: "Como registrar destinação de resíduos?",
        answer: "Acesse Resíduos > Destinação. Selecione o tipo de resíduo, quantidade gerada, fornecedor/destinatário, tipo de destinação (reciclagem, compostagem, aterro, coprocessamento, etc.), data e anexe MTR ou certificado. O sistema calcula automaticamente % de reciclagem e destinação adequada.",
        tags: ["destinação", "reciclagem", "mtr", "fornecedor"],
        relatedQuestions: ["cadastrar-residuos", "fornecedores-residuos"]
      },
      {
        id: "pgrs",
        question: "O que é PGRS e como criar um?",
        answer: "PGRS (Plano de Gerenciamento de Resíduos Sólidos) é obrigatório conforme Política Nacional de Resíduos Sólidos. Acesse Resíduos > PGRS > Novo Plano. O sistema gera automaticamente um PGRS baseado em seus dados de geração e destinação, incluindo: diagnóstico, metas de redução, ações de minimização, responsáveis e indicadores de monitoramento.",
        tags: ["pgrs", "plano", "pnrs", "regulatório"],
        relatedQuestions: ["cadastrar-residuos", "destinacao-residuos"]
      },
      {
        id: "fornecedores-residuos",
        question: "Como gerenciar fornecedores de resíduos?",
        answer: "Acesse Resíduos > Fornecedores. Cadastre empresas de coleta, transporte e destinação final. Registre licenças ambientais, tipos de resíduos aceitos, validade de documentos e avaliações de desempenho. O sistema alerta quando licenças estão próximas do vencimento.",
        tags: ["fornecedores", "transportadores", "licenças", "gestão"],
        relatedQuestions: ["destinacao-residuos", "licenciamento"]
      },
      {
        id: "relatorios-residuos",
        question: "Quais relatórios de resíduos estão disponíveis?",
        answer: "Relatórios disponíveis: 1) Geração total por tipo e período, 2) % de reciclagem/destinação adequada, 3) Ranking de resíduos mais gerados, 4) Evolução temporal, 5) PGRS completo, 6) MTRs por fornecedor, 7) Indicadores de economia circular. Todos exportáveis em PDF ou Excel.",
        tags: ["relatórios", "indicadores", "análise", "exportar"],
        relatedQuestions: ["destinacao-residuos", "pgrs"]
      }
    ]
  },
  {
    id: "licenciamento",
    title: "Licenciamento Ambiental",
    icon: "FileCheck",
    description: "Controle de licenças e autorizações",
    questions: [
      {
        id: "cadastrar-licencas",
        question: "Como cadastrar licenças ambientais?",
        answer: "Acesse Licenciamento > Licenças > Adicionar. Preencha: tipo de licença (LP, LI, LO, AAF, etc.), número do processo, órgão emissor, data de emissão, validade, condicionantes e anexe o documento PDF. O sistema calcula automaticamente dias restantes para vencimento.",
        tags: ["licenças", "cadastro", "lo", "li", "lp"],
        relatedQuestions: ["tipos-licenca", "alertas-vencimento"]
      },
      {
        id: "acompanhar-prazos",
        question: "Como acompanhar prazos de renovação?",
        answer: "O dashboard de Licenciamento mostra um timeline com todas as licenças e seus status (vigente, próxima do vencimento, vencida). Você recebe alertas automáticos por e-mail 90, 60 e 30 dias antes do vencimento. Acesse Licenciamento > Calendário para visão mensal.",
        tags: ["prazos", "renovação", "vencimento", "calendário"],
        relatedQuestions: ["cadastrar-licencas", "alertas-vencimento"]
      },
      {
        id: "tipos-licenca",
        question: "Quais tipos de licença são suportados?",
        answer: "A plataforma suporta: LP (Prévia), LI (Instalação), LO (Operação), LAS (Ambiental Simplificada), AAF (Autorização Ambiental de Funcionamento), Outorgas de Água, Autorização de Supressão Vegetal, Licenças Estaduais/Municipais específicas e outras autorizações customizáveis.",
        tags: ["tipos", "licenças", "lo", "li", "lp", "aaf"],
        relatedQuestions: ["cadastrar-licencas", "acompanhar-prazos"]
      },
      {
        id: "anexar-documentos-licencas",
        question: "Como anexar documentos às licenças?",
        answer: "Ao cadastrar ou editar uma licença, use a seção 'Documentos Relacionados' para fazer upload de PDFs, imagens ou outros arquivos. Você pode anexar: licença original, condicionantes, relatórios de atendimento, pareceres técnicos e correspondências com órgãos ambientais. Não há limite de arquivos.",
        tags: ["documentos", "anexos", "upload", "arquivos"],
        relatedQuestions: ["cadastrar-licencas", "upload-documentos"]
      },
      {
        id: "alertas-vencimento",
        question: "Como receber alertas de vencimento?",
        answer: "Alertas automáticos são enviados por e-mail e notificações na plataforma nos prazos: 90, 60, 30, 15 e 7 dias antes do vencimento. Configure destinatários dos alertas em Configurações > Notificações > Licenciamento. Você também pode gerar relatórios de licenças a vencer no período.",
        tags: ["alertas", "notificações", "vencimento", "e-mail"],
        relatedQuestions: ["acompanhar-prazos", "cadastrar-licencas"]
      }
    ]
  },
  {
    id: "metas",
    title: "Metas de Sustentabilidade",
    icon: "Target",
    description: "Defina e acompanhe objetivos ESG",
    questions: [
      {
        id: "criar-metas",
        question: "Como criar metas ESG?",
        answer: "Acesse Metas > Nova Meta. Defina: nome da meta, categoria ESG (ambiental, social, governança), indicador (ex: redução de emissões), valor atual, valor alvo, prazo (data), responsável e plano de ação. Você pode vincular múltiplas ações a uma meta e monitorar progresso em tempo real.",
        tags: ["metas", "objetivos", "esg", "kpi"],
        relatedQuestions: ["acompanhar-progresso", "tipos-metas"]
      },
      {
        id: "acompanhar-progresso",
        question: "Como acompanhar progresso de metas?",
        answer: "O dashboard de Metas mostra cards com % de progresso de cada meta, status (no prazo, atrasada, concluída) e gráficos de evolução. Você pode registrar atualizações periódicas, adicionar comentários e anexar evidências. Alertas automáticos notificam quando uma meta está atrasada.",
        tags: ["progresso", "acompanhamento", "status", "monitoramento"],
        relatedQuestions: ["criar-metas", "relatorios-metas"]
      },
      {
        id: "tipos-metas",
        question: "Quais tipos de metas posso definir?",
        answer: "**Ambientais**: redução de emissões GEE, consumo de energia/água, % reciclagem, fontes renováveis. **Sociais**: diversidade, treinamentos, segurança do trabalho, satisfação de colaboradores. **Governança**: compliance, auditorias, políticas implementadas, transparência. Você também pode criar metas customizadas para qualquer indicador.",
        tags: ["tipos", "categorias", "ambiental", "social", "governança"],
        relatedQuestions: ["criar-metas", "vincular-indicadores"]
      },
      {
        id: "vincular-indicadores",
        question: "Como vincular metas a indicadores?",
        answer: "Ao criar uma meta, selecione um indicador existente da plataforma (ex: Total de emissões GEE, % resíduos reciclados) ou crie um indicador customizado. A meta será automaticamente atualizada conforme os dados forem inseridos no sistema. Isso garante rastreamento em tempo real do progresso.",
        tags: ["indicadores", "kpi", "métricas", "vinculação"],
        relatedQuestions: ["criar-metas", "acompanhar-progresso"]
      },
      {
        id: "relatorios-metas",
        question: "Como gerar relatórios de metas?",
        answer: "Acesse Metas > Relatórios. Gere relatórios consolidados com: visão geral de todas as metas, % de atingimento, metas atrasadas, ações concluídas vs pendentes, gráficos de evolução temporal e análise de desvios. Exporte em PDF executivo ou Excel para análise detalhada.",
        tags: ["relatórios", "análise", "exportar", "consolidado"],
        relatedQuestions: ["acompanhar-progresso", "criar-metas"]
      }
    ]
  },
  {
    id: "stakeholders",
    title: "Gestão de Stakeholders",
    icon: "Users",
    description: "Engajamento e análise de materialidade",
    questions: [
      {
        id: "cadastrar-stakeholders",
        question: "Como cadastrar partes interessadas?",
        answer: "Acesse Stakeholders > Cadastro. Adicione grupos (colaboradores, clientes, fornecedores, comunidade, investidores, etc.), nível de influência, interesses principais e canais de comunicação. Você pode segmentar stakeholders por projeto ou tema específico.",
        tags: ["stakeholders", "partes interessadas", "cadastro", "grupos"],
        relatedQuestions: ["analise-materialidade", "engajamento"]
      },
      {
        id: "analise-materialidade",
        question: "Como realizar análise de materialidade?",
        answer: "Acesse Stakeholders > Materialidade > Nova Análise. 1) Defina temas ESG relevantes (lista pré-configurada ou customizada), 2) Envie pesquisas para stakeholders avaliarem importância, 3) Equipe interna avalia impacto no negócio, 4) Sistema gera matriz de materialidade automaticamente plotando temas por relevância vs impacto.",
        tags: ["materialidade", "análise", "temas", "pesquisa"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "engajamento",
        question: "Como gerenciar engajamento de stakeholders?",
        answer: "Use Stakeholders > Plano de Engajamento para: definir frequência e canais de comunicação, agendar reuniões/eventos, registrar feedbacks recebidos, acompanhar solicitações e reclamações, e medir satisfação. O sistema gera cronograma de engajamento e alerta sobre ações pendentes.",
        tags: ["engajamento", "comunicação", "relacionamento", "plano"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "pesquisas",
        question: "Como enviar pesquisas de materialidade?",
        answer: "Acesse Stakeholders > Pesquisas > Nova Pesquisa. Configure temas ESG, escala de avaliação, idioma e público-alvo. A plataforma gera link único para cada grupo de stakeholders. As respostas são coletadas anonimamente e consolidadas automaticamente na matriz de materialidade. Você pode exportar respostas brutas para análises adicionais.",
        tags: ["pesquisas", "questionários", "materialidade", "engajamento"],
        relatedQuestions: ["analise-materialidade", "engajamento"]
      }
    ]
  },
  {
    id: "qualidade",
    title: "Qualidade (SGQ)",
    icon: "Award",
    description: "Sistema de Gestão da Qualidade",
    questions: [
      {
        id: "mapear-processos",
        question: "Como mapear processos?",
        answer: "Acesse Qualidade > Processos > Mapeamento. Use o editor visual para criar fluxogramas de processos. Defina: nome do processo, responsável, entradas/saídas, indicadores de desempenho, documentos relacionados e riscos. Você pode exportar mapas em BPMN, PDF ou imagem.",
        tags: ["processos", "mapeamento", "bpmn", "fluxograma"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      },
      {
        id: "nao-conformidades",
        question: "Como registrar não conformidades?",
        answer: "Acesse Qualidade > Não Conformidades > Registrar. Preencha: descrição da NC, severidade (crítica, maior, menor), área/processo afetado, causa raiz (use 5 Porquês ou Ishikawa), responsável e evidências. Após análise, crie um plano de ação 5W2H vinculado. O sistema rastreia status até resolução e verificação de eficácia.",
        tags: ["não conformidade", "nc", "qualidade", "causa raiz"],
        relatedQuestions: ["planos-acao", "auditorias"]
      },
      {
        id: "planos-acao",
        question: "Como criar planos de ação (5W2H)?",
        answer: "Planos de ação podem ser criados vinculados a NCs, auditorias ou riscos. Defina: O que (ação), Por que (justificativa), Quem (responsável), Quando (prazo), Onde (local), Como (método), Quanto custa. Acompanhe progresso, anexe evidências e registre eficácia da ação implementada.",
        tags: ["plano de ação", "5w2h", "ações", "correção"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      },
      {
        id: "auditorias",
        question: "Como gerenciar auditorias?",
        answer: "Acesse Qualidade > Auditorias. Planeje auditorias (internas, externas, de fornecedores) definindo: escopo, norma aplicável (ISO 9001, 14001, 45001, etc.), auditores, cronograma e checklist. Durante a auditoria, registre constatações (conformidades, NCs, observações). Gere relatório automático ao final e vincule ações corretivas.",
        tags: ["auditoria", "iso 9001", "checklist", "conformidade"],
        relatedQuestions: ["nao-conformidades", "planos-acao"]
      },
      {
        id: "controle-documentos-sgq",
        question: "Como controlar documentos do SGQ?",
        answer: "Use Qualidade > Documentos. Faça upload de procedimentos, instruções, formulários e registros. O sistema controla versões, fluxo de aprovação, distribuição, treinamentos associados e datas de revisão. Alertas automáticos notificam quando um documento precisa ser revisado.",
        tags: ["documentos", "procedimentos", "controle", "versão"],
        relatedQuestions: ["mapear-processos", "auditorias"]
      },
      {
        id: "avaliar-fornecedores",
        question: "Como avaliar fornecedores?",
        answer: "Acesse Qualidade > Fornecedores > Avaliação. Defina critérios de avaliação (qualidade, prazo, atendimento, preço, ESG), peso de cada critério e periodicidade. Registre avaliações com pontuação e evidências. O sistema calcula score geral e classifica fornecedores (A, B, C). Gere relatórios de desempenho e histórico.",
        tags: ["fornecedores", "avaliação", "qualificação", "homologação"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      }
    ]
  },
  {
    id: "social",
    title: "Social (Pessoas)",
    icon: "Heart",
    description: "Gestão de pessoas e bem-estar",
    questions: [
      {
        id: "gerenciar-funcionarios",
        question: "Como gerenciar funcionários?",
        answer: "Acesse Social > Colaboradores. Cadastre informações de cada colaborador: dados pessoais, cargo, departamento, data de admissão, tipo de contrato, salário (opcional), benefícios e documentos. O sistema permite acompanhar histórico de treinamentos, avaliações de desempenho, férias e indicadores sociais.",
        tags: ["colaboradores", "funcionários", "rh", "gestão"],
        relatedQuestions: ["treinamentos", "seguranca-trabalho"]
      },
      {
        id: "treinamentos",
        question: "Como registrar treinamentos?",
        answer: "Acesse Social > Treinamentos > Registrar. Crie programas de treinamento (NR, técnicos, comportamentais, ESG), defina carga horária, instrutores e periodicidade. Registre participantes, notas/avaliações e emita certificados. O sistema alerta sobre reciclagens vencidas e calcula horas de treinamento per capita.",
        tags: ["treinamentos", "capacitação", "desenvolvimento", "certificados"],
        relatedQuestions: ["gerenciar-funcionarios", "pdi"]
      },
      {
        id: "seguranca-trabalho",
        question: "Como acompanhar segurança do trabalho?",
        answer: "Use Social > Segurança do Trabalho para: registrar acidentes/incidentes, investigar causas, definir ações preventivas, acompanhar taxa de frequência e gravidade, gerenciar EPIs, controlar CAT, realizar DDS (Diálogo Diário de Segurança) e manter PPRA/PCMSO atualizados.",
        tags: ["segurança", "sst", "acidentes", "epi"],
        relatedQuestions: ["gerenciar-funcionarios", "treinamentos"]
      },
      {
        id: "ponto-frequencia",
        question: "Como gerenciar ponto e frequência?",
        answer: "A plataforma oferece integração básica com sistemas de ponto. Você pode importar dados de ponto via API ou planilha para análises de: absenteísmo, horas extras, banco de horas e produtividade. Gere relatórios de frequência por período, departamento ou projeto.",
        tags: ["ponto", "frequência", "absenteísmo", "horas extras"],
        relatedQuestions: ["gerenciar-funcionarios", "integracoes"]
      },
      {
        id: "pdi",
        question: "Como criar PDIs (Planos de Desenvolvimento)?",
        answer: "Acesse Social > Desenvolvimento > PDI. Defina objetivos de desenvolvimento para cada colaborador, competências a desenvolver, ações (treinamentos, mentorias, projetos), prazos e indicadores de sucesso. Acompanhe progresso em reuniões periódicas (1:1) e registre feedbacks.",
        tags: ["pdi", "desenvolvimento", "carreira", "competências"],
        relatedQuestions: ["treinamentos", "gerenciar-funcionarios"]
      }
    ]
  },
  {
    id: "governanca",
    title: "Governança",
    icon: "Shield",
    description: "Riscos, compliance e políticas",
    questions: [
      {
        id: "gerenciar-riscos",
        question: "Como gerenciar riscos corporativos?",
        answer: "Acesse Governança > Riscos > Matriz de Riscos. Identifique riscos por categoria (operacional, financeiro, regulatório, ESG, reputacional), avalie probabilidade e impacto, calcule criticidade automaticamente e defina controles mitigadores. Monitore riscos residuais e revise periodicamente a matriz.",
        tags: ["riscos", "matriz", "criticidade", "controles"],
        relatedQuestions: ["compliance", "matriz-riscos"]
      },
      {
        id: "compliance",
        question: "Como garantir compliance?",
        answer: "Use Governança > Compliance para: mapear requisitos legais aplicáveis (ambientais, trabalhistas, fiscais, setoriais), avaliar grau de atendimento, definir responsáveis, criar planos de adequação e receber alertas sobre mudanças regulatórias. O sistema consolida status de compliance geral da organização.",
        tags: ["compliance", "regulatório", "leis", "normas"],
        relatedQuestions: ["gerenciar-riscos", "politicas"]
      },
      {
        id: "politicas",
        question: "Como gerenciar políticas internas?",
        answer: "Acesse Governança > Políticas. Faça upload de políticas (código de conduta, antissuborno, diversidade, ambiental, etc.), defina público-alvo, controle versões e distribua para ciência. Colete assinaturas digitais e rastreie leitura. Alertas automáticos notificam sobre revisões obrigatórias.",
        tags: ["políticas", "código de conduta", "governança", "distribuição"],
        relatedQuestions: ["compliance", "controle-documentos-sgq"]
      },
      {
        id: "matriz-riscos",
        question: "Como configurar matriz de riscos?",
        answer: "Acesse Governança > Configurações > Matriz de Riscos. Personalize escalas de probabilidade (1-5) e impacto (1-5), defina níveis de criticidade (baixo, médio, alto, crítico) e cores associadas. A matriz pode seguir ISO 31000, COSO ERM ou metodologia própria. Você também pode criar matrizes específicas por área.",
        tags: ["matriz", "riscos", "configuração", "iso 31000"],
        relatedQuestions: ["gerenciar-riscos", "compliance"]
      }
    ]
  },
  {
    id: "documentos",
    title: "Documentos e Dados",
    icon: "FileText",
    description: "Upload, extração IA e organização",
    questions: [
      {
        id: "upload-documentos",
        question: "Como fazer upload de documentos?",
        answer: "Acesse Documentos > Upload. Arraste arquivos ou clique para selecionar. Suportamos PDF, Excel, Word, imagens (JPG, PNG), CSV e TXT. Após upload, classifique o documento (tipo, categoria, período de referência) e adicione tags para busca. Documentos grandes são processados em background.",
        tags: ["upload", "documentos", "arquivos", "importação"],
        relatedQuestions: ["extracao-ia", "formatos-aceitos"]
      },
      {
        id: "extracao-ia",
        question: "Como funciona a extração IA de dados?",
        answer: "Nosso sistema usa IA avançada para extrair automaticamente dados de documentos como: contas de luz (consumo, tarifa, demanda), notas fiscais de combustível, relatórios de resíduos, folhas de ponto, etc. Após upload, a IA processa o documento, identifica campos relevantes e pré-preenche formulários. Você revisa e confirma antes de salvar.",
        tags: ["ia", "extração", "ocr", "automação"],
        relatedQuestions: ["upload-documentos", "revisar-extracoes"]
      },
      {
        id: "revisar-extracoes",
        question: "Como revisar extrações automáticas?",
        answer: "Acesse Documentos > Extrações Pendentes. Você verá lista de documentos processados pela IA. Clique em 'Revisar' para ver campos extraídos lado a lado com o documento original. Corrija valores se necessário, confirme ou rejeite a extração. Feedbacks melhoram continuamente o modelo de IA.",
        tags: ["revisão", "validação", "extração", "conferência"],
        relatedQuestions: ["extracao-ia", "upload-documentos"]
      },
      {
        id: "importar-planilhas",
        question: "Como importar dados via planilha?",
        answer: "Cada módulo oferece templates de importação. Acesse a seção desejada (ex: Inventário GEE, Resíduos) e clique em 'Importar Dados'. Baixe o template Excel, preencha conforme instruções, faça upload e mapeie colunas. O sistema valida dados e mostra erros antes de importar definitivamente.",
        tags: ["importação", "planilha", "excel", "templates"],
        relatedQuestions: ["upload-documentos", "formatos-aceitos"]
      },
      {
        id: "formatos-aceitos",
        question: "Quais formatos de arquivo são aceitos?",
        answer: "**Documentos**: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx). **Dados estruturados**: CSV, TXT, JSON. **Imagens**: JPG, JPEG, PNG, TIFF. **Tamanho máximo**: 50MB por arquivo. Para arquivos maiores, comprima ou entre em contato com suporte.",
        tags: ["formatos", "arquivos", "tipos", "extensões"],
        relatedQuestions: ["upload-documentos", "importar-planilhas"]
      },
      {
        id: "organizar-documentos",
        question: "Como organizar documentos em pastas?",
        answer: "Acesse Documentos > Explorador. Crie pastas e subpastas hierárquicas para organizar documentos (ex: Emissões/2024, Resíduos/MTRs). Mova documentos arrastando ou usando menu contextual. Use tags adicionais para categorização cruzada. A busca funciona em todas pastas simultaneamente.",
        tags: ["pastas", "organização", "estrutura", "categorias"],
        relatedQuestions: ["upload-documentos", "buscar-documentos"]
      }
    ]
  },
  {
    id: "relatorios",
    title: "Relatórios Integrados",
    icon: "FileBarChart",
    description: "Padrões GRI, TCFD, SASB e customizados",
    questions: [
      {
        id: "relatorios-disponiveis",
        question: "Quais relatórios estão disponíveis?",
        answer: "A plataforma gera relatórios em múltiplos padrões: **GRI Standards** (Universal, Setoriais), **TCFD** (Riscos Climáticos), **TNFD** (Natureza), **IFRS S1/S2** (Sustentabilidade), **CDP** (Carbon, Water, Forests), **Inventário GHG Protocol**, **Relatório de Sustentabilidade customizado** e relatórios gerenciais por módulo.",
        tags: ["relatórios", "gri", "tcfd", "padrões", "frameworks"],
        relatedQuestions: ["gerar-relatorio", "indicadores-gri"]
      },
      {
        id: "gerar-relatorio",
        question: "Como gerar relatório de sustentabilidade?",
        answer: "Acesse Relatórios > Novo Relatório. Selecione: padrão (GRI, TCFD, customizado), ano de referência, idioma e seções a incluir. O sistema pré-preenche indicadores com dados já inseridos na plataforma. Você pode editar textos, adicionar narrativas, inserir imagens e personalizar layout. Exporte em PDF, Word ou HTML.",
        tags: ["relatórios", "sustentabilidade", "gerar", "exportar"],
        relatedQuestions: ["relatorios-disponiveis", "personalizar-templates"]
      },
      {
        id: "exportar-pdf",
        question: "Como exportar relatórios em PDF?",
        answer: "Após gerar o relatório, clique em 'Exportar' > 'PDF'. Escolha formato (A4, carta), orientação (retrato/paisagem), qualidade de imagens e inclusão de anexos. O PDF é gerado com sumário interativo, marca d'água (opcional) e metadados. Você pode salvar, compartilhar ou publicar diretamente no site institucional.",
        tags: ["exportar", "pdf", "download", "publicar"],
        relatedQuestions: ["gerar-relatorio", "personalizar-templates"]
      },
      {
        id: "personalizar-templates",
        question: "Como personalizar templates de relatórios?",
        answer: "Acesse Relatórios > Configurações > Templates. Edite templates existentes ou crie novos. Você pode: personalizar cores e logotipos, adicionar/remover seções, reordenar indicadores, definir textos padrão (mensagem do CEO, sobre a empresa), configurar headers/footers e salvar múltiplas versões (executivo, completo, regulatório).",
        tags: ["templates", "personalização", "layout", "design"],
        relatedQuestions: ["gerar-relatorio", "exportar-pdf"]
      },
      {
        id: "indicadores-gri",
        question: "Quais indicadores GRI são cobertos?",
        answer: "Cobrimos todos os **GRI Universal Standards 2021**: GRI 2 (Disclosures gerais), GRI 3 (Tópicos materiais). **Série 200 (Econômicos)**: Desempenho, presença mercado, impactos indiretos, práticas de compras. **Série 300 (Ambientais)**: Materiais, energia, água, emissões, resíduos, biodiversidade, fornecedores. **Série 400 (Sociais)**: Emprego, relações, SST, treinamento, diversidade, não discriminação, direitos humanos.",
        tags: ["gri", "indicadores", "standards", "esg"],
        relatedQuestions: ["relatorios-disponiveis", "gerar-relatorio"]
      }
    ]
  },
  {
    id: "formularios",
    title: "Formulários Customizados",
    icon: "ClipboardList",
    description: "Crie pesquisas e coleta de dados",
    questions: [
      {
        id: "criar-formularios",
        question: "Como criar formulários próprios?",
        answer: "Acesse Formulários > Novo Formulário. Use o editor drag-and-drop para adicionar campos: texto, múltipla escolha, caixas de seleção, escalas, datas, upload de arquivos, etc. Configure validações, lógica condicional (mostrar campo X se resposta Y), design e página de agradecimento. Pré-visualize antes de publicar.",
        tags: ["formulários", "pesquisas", "criação", "editor"],
        relatedQuestions: ["tipos-campos", "compartilhar-formularios"]
      },
      {
        id: "compartilhar-formularios",
        question: "Como compartilhar formulários externamente?",
        answer: "Após criar um formulário, clique em 'Compartilhar'. Você pode: gerar link público, enviar por e-mail (lista de contatos), incorporar via iframe em sites, compartilhar QR Code ou restringir acesso (somente usuários autenticados). Controle período de recebimento de respostas e limite de submissões.",
        tags: ["compartilhar", "link", "público", "externo"],
        relatedQuestions: ["criar-formularios", "analisar-respostas"]
      },
      {
        id: "analisar-respostas",
        question: "Como analisar respostas de formulários?",
        answer: "Acesse Formulários > Respostas. Veja dashboard com estatísticas: total de respostas, taxa de conclusão, tempo médio, gráficos por pergunta (distribuição, médias, nuvem de palavras). Exporte respostas em Excel para análises avançadas ou visualize individualmente. Filtre por período, origem ou segmento.",
        tags: ["respostas", "análise", "estatísticas", "dashboard"],
        relatedQuestions: ["compartilhar-formularios", "criar-formularios"]
      },
      {
        id: "tipos-campos",
        question: "Quais tipos de campos são suportados?",
        answer: "**Texto**: curto, longo (parágrafo), e-mail, URL, número. **Escolha**: múltipla escolha (radio), caixas de seleção (checkbox), dropdown. **Escala**: numérica (1-5, 1-10), Likert, NPS. **Data/Hora**: calendário, hora. **Arquivos**: upload de documentos/imagens. **Avançados**: matriz, ranking, localização, assinatura digital.",
        tags: ["campos", "tipos", "perguntas", "opções"],
        relatedQuestions: ["criar-formularios", "validacoes"]
      }
    ]
  },
  {
    id: "integracoes",
    title: "Integrações e API",
    icon: "Plug",
    description: "Conecte sistemas externos",
    questions: [
      {
        id: "integracoes-disponiveis",
        question: "Quais integrações estão disponíveis?",
        answer: "Integrações nativas: **ERP** (SAP, TOTVS, Protheus), **Contabilidade** (Contábil, Questor), **RH** (Sênior, RM), **Energia** (concessionárias via API), **IoT** (sensores de consumo), **Cloud Storage** (Google Drive, OneDrive, Dropbox). Integrações via **Zapier/Make** para 5.000+ apps. API REST completa para integrações customizadas.",
        tags: ["integrações", "api", "erp", "conectores"],
        relatedQuestions: ["api-integracao", "automatizar-coleta"]
      },
      {
        id: "conectar-sistemas",
        question: "Como conectar sistemas externos?",
        answer: "Acesse Configurações > Integrações > Adicionar Integração. Selecione o sistema desejado, forneça credenciais de acesso (API key, OAuth), configure mapeamento de campos e periodicidade de sincronização (tempo real, diária, semanal). Teste a conexão e ative. Logs detalhados mostram sincronizações e eventuais erros.",
        tags: ["conexão", "sistemas", "sincronização", "configuração"],
        relatedQuestions: ["integracoes-disponiveis", "api-integracao"]
      },
      {
        id: "api-integracao",
        question: "Existe API para integração?",
        answer: "Sim! Nossa API REST completa está documentada em [https://api.plataforma.com/docs]. Endpoints para: autenticação OAuth 2.0, CRUD de todos os módulos (emissões, resíduos, metas, etc.), upload de documentos, extração de relatórios e webhooks para eventos. Rate limits: 1000 requests/hora (plano Pro), 10.000/hora (Enterprise).",
        tags: ["api", "rest", "documentação", "endpoints"],
        relatedQuestions: ["integracoes-disponiveis", "automatizar-coleta"]
      },
      {
        id: "automatizar-coleta",
        question: "Como automatizar coleta de dados?",
        answer: "Use integrações ou API para coletar dados automaticamente de: sistemas ERP (consumos de materiais), concessionárias de energia/água (leituras mensais), sensores IoT (tempo real), folhas de ponto de RH (horas trabalhadas), notas fiscais eletrônicas (compras e vendas). Configure regras de transformação e validação antes de importar.",
        tags: ["automação", "coleta", "integração", "dados"],
        relatedQuestions: ["integracoes-disponiveis", "api-integracao"]
      }
    ]
  },
  {
    id: "seguranca",
    title: "Segurança e Privacidade",
    icon: "Lock",
    description: "Proteção de dados e compliance LGPD",
    questions: [
      {
        id: "protecao-dados",
        question: "Como são protegidos meus dados?",
        answer: "Usamos criptografia AES-256 em repouso e TLS 1.3 em trânsito. Dados hospedados em nuvem AWS/Google Cloud (datacenter no Brasil). Autenticação multi-fator (MFA) obrigatória para admins. Logs de auditoria rastreiam todos os acessos e alterações. Conformidade com LGPD, ISO 27001 e SOC 2. Testes de penetração anuais.",
        tags: ["segurança", "criptografia", "proteção", "lgpd"],
        relatedQuestions: ["backup", "controle-acesso"]
      },
      {
        id: "backup",
        question: "Qual política de backup?",
        answer: "**Backups automáticos**: diários (últimos 30 dias), semanais (últimos 3 meses), mensais (último ano). **Retenção**: dados retidos por 7 anos conforme regulamentações. **Redundância**: backups replicados em 3 regiões geográficas distintas. **Recuperação**: RTO de 4 horas, RPO de 24 horas. Você pode solicitar exportação completa a qualquer momento.",
        tags: ["backup", "recuperação", "retenção", "dados"],
        relatedQuestions: ["protecao-dados", "exportar-dados"]
      },
      {
        id: "controle-acesso",
        question: "Como funciona controle de acesso?",
        answer: "**Autenticação**: e-mail/senha + MFA (opcional para usuários, obrigatório para admins). **Autorização**: RBAC (Role-Based Access Control) com 4 níveis padrão + perfis customizados. **Auditoria**: logs de login, alterações, exports e acessos a dados sensíveis. **Sessões**: timeout automático após 30 min de inatividade. **IPs permitidos**: restrinja acesso por faixa de IP (Enterprise).",
        tags: ["acesso", "autenticação", "mfa", "permissões"],
        relatedQuestions: ["protecao-dados", "permissoes"]
      },
      {
        id: "exportar-dados",
        question: "Posso exportar todos meus dados?",
        answer: "Sim! Você tem direito à portabilidade (LGPD). Acesse Configurações > Exportar Dados. Selecione módulos, período e formato (JSON estruturado, Excel consolidado ou ZIP com todos os documentos). A exportação é processada em background e você recebe link de download por e-mail. Dados incluem: registros, uploads, relatórios e metadados.",
        tags: ["exportação", "portabilidade", "lgpd", "dados"],
        relatedQuestions: ["backup", "deletar-conta"]
      },
      {
        id: "deletar-conta",
        question: "Como deletar minha conta?",
        answer: "Acesse Configurações > Conta > Excluir Conta. **ATENÇÃO**: Esta ação é irreversível! Todos os dados serão permanentemente deletados após 30 dias (período de carência). Antes de deletar, recomendamos exportar seus dados. Se houver obrigações legais de retenção (ex: auditorias), dados serão anonimizados mas preservados conforme lei.",
        tags: ["deletar", "exclusão", "lgpd", "conta"],
        relatedQuestions: ["exportar-dados", "backup"]
      }
    ]
  },
  {
    id: "suporte",
    title: "Suporte e Contato",
    icon: "HelpCircle",
    description: "Tire dúvidas e reporte problemas",
    questions: [
      {
        id: "contato-suporte",
        question: "Como entrar em contato com suporte?",
        answer: "**Chat ao vivo**: Disponível no ícone de chat (canto inferior direito) em horário comercial. **E-mail**: suporte@plataforma.com (resposta em até 24h úteis). **Telefone**: 0800-XXX-XXXX (Seg-Sex, 9h-18h BRT). **Tickets**: Abra via Ajuda > Novo Ticket. **WhatsApp Business**: +55 11 9XXXX-XXXX (clientes Enterprise).",
        tags: ["suporte", "contato", "ajuda", "atendimento"],
        relatedQuestions: ["horarios-atendimento", "documentacao"]
      },
      {
        id: "horarios-atendimento",
        question: "Quais são os horários de atendimento?",
        answer: "**Suporte básico** (chat, e-mail, tickets): Segunda a Sexta, 9h às 18h (horário de Brasília), exceto feriados nacionais. **Suporte prioritário** (Enterprise): 24x7 com SLA de resposta de 2 horas para issues críticos. **Base de conhecimento e tutoriais**: Disponíveis 24x7 online.",
        tags: ["horários", "atendimento", "disponibilidade", "sla"],
        relatedQuestions: ["contato-suporte", "reportar-bugs"]
      },
      {
        id: "documentacao",
        question: "Existe documentação técnica?",
        answer: "Sim! Acesse nossa **Central de Ajuda**: [https://ajuda.plataforma.com]. Inclui: tutoriais passo-a-passo com vídeos, guias de melhores práticas por módulo, FAQ completo, documentação de API, templates de importação, glossário ESG, casos de uso e webinars gravados. Conteúdo atualizado mensalmente.",
        tags: ["documentação", "tutoriais", "guias", "ajuda"],
        relatedQuestions: ["tutoriais", "api-integracao"]
      },
      {
        id: "reportar-bugs",
        question: "Como reportar bugs?",
        answer: "Acesse Ajuda > Reportar Problema. Descreva: o que você estava fazendo, comportamento esperado vs observado, mensagens de erro (screenshot), navegador/dispositivo usado. Bugs críticos (sistema inacessível, perda de dados) são priorizados. Você recebe atualizações por e-mail sobre resolução. Há um programa de recompensas para bugs de segurança.",
        tags: ["bugs", "problemas", "erros", "reportar"],
        relatedQuestions: ["contato-suporte", "sugerir-melhorias"]
      },
      {
        id: "sugerir-melhorias",
        question: "Como sugerir melhorias?",
        answer: "Adoramos feedback! Use Ajuda > Sugestões ou vote em ideias existentes no nosso **Portal de Ideias**: [https://ideias.plataforma.com]. Sugestões mais votadas são priorizadas no roadmap. Você pode acompanhar status (em análise, planejado, desenvolvimento, concluído). Contribuidores ativos recebem reconhecimento e early access a features.",
        tags: ["sugestões", "melhorias", "feedback", "roadmap"],
        relatedQuestions: ["contato-suporte", "reportar-bugs"]
      }
    ]
  }
];

// Helper function to search across all FAQs
export const searchFAQs = (query: string): FAQCategory[] => {
  if (!query.trim()) return faqCategories;

  const lowerQuery = query.toLowerCase();
  
  return faqCategories
    .map(category => ({
      ...category,
      questions: category.questions.filter(q =>
        q.question.toLowerCase().includes(lowerQuery) ||
        q.answer.toLowerCase().includes(lowerQuery) ||
        q.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    }))
    .filter(category => category.questions.length > 0);
};
