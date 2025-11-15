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
  },
  {
    id: "modulo-financeiro",
    title: "Módulo Financeiro",
    icon: "DollarSign",
    description: "Gestão financeira integrada com ESG",
    questions: [
      {
        id: "acessar-dashboard-financeiro",
        question: "Como acessar o dashboard financeiro?",
        answer: "Acesse Financeiro > Dashboard no menu lateral. O dashboard apresenta visão consolidada de: contas a pagar e receber, fluxo de caixa, saldos bancários, despesas por categoria, análise de rentabilidade e alertas financeiros. Use os filtros de período (mês, trimestre, ano) no topo para análises temporais específicas.",
        tags: ["financeiro", "dashboard", "visão geral", "kpis"],
        relatedQuestions: ["cadastrar-contas-pagar", "relatorios-financeiros"]
      },
      {
        id: "cadastrar-contas-pagar",
        question: "Como cadastrar contas a pagar?",
        answer: "Acesse Financeiro > Contas a Pagar > Nova Conta. Preencha: fornecedor, valor, data de vencimento, categoria de despesa, forma de pagamento, centro de custo e, opcionalmente, vincule a um projeto ESG. Você pode anexar notas fiscais (PDF/imagem) e configurar recorrência para despesas fixas. Aprovações podem ser requeridas conforme workflow configurado.",
        tags: ["contas a pagar", "despesas", "fornecedores", "pagamentos"],
        relatedQuestions: ["fluxo-aprovacoes-financeiro", "vincular-despesas-esg"]
      },
      {
        id: "cadastrar-contas-receber",
        question: "Como cadastrar contas a receber?",
        answer: "Acesse Financeiro > Contas a Receber > Nova Conta. Informe: cliente, valor, data de vencimento, forma de recebimento, categoria de receita e projeto relacionado. Sistema permite parcelamento automático e envio de lembretes de cobrança por e-mail. Ao confirmar recebimento, o valor é automaticamente lançado no fluxo de caixa.",
        tags: ["contas a receber", "receitas", "clientes", "recebimentos"],
        relatedQuestions: ["fluxo-caixa-previsao", "cadastrar-contas-pagar"]
      },
      {
        id: "plano-contas-configurar",
        question: "O que é o Plano de Contas e como configurar?",
        answer: "O Plano de Contas é a estrutura que organiza todas as transações contábeis por categoria (ativos, passivos, receitas, despesas). Acesse Financeiro > Configurações > Plano de Contas. Você pode usar o plano padrão brasileiro ou customizar criando contas e subcontas. Cada conta possui código, nome, tipo e nível hierárquico. Essencial para relatórios contábeis precisos.",
        tags: ["plano de contas", "contabilidade", "configuração", "categorias"],
        relatedQuestions: ["lancamentos-contabeis", "relatorios-financeiros"]
      },
      {
        id: "lancamentos-contabeis",
        question: "Como fazer lançamentos contábeis?",
        answer: "Acesse Financeiro > Lançamentos > Novo Lançamento. Informe: data, histórico, débito (conta + valor), crédito (conta + valor), documento de origem e centro de custo. O sistema valida que débito = crédito. Lançamentos podem ser aprovados por contador antes de finalizar. Suporta lançamentos de ajuste, provisão, depreciação e reclassificação.",
        tags: ["lançamentos", "contabilidade", "débito", "crédito"],
        relatedQuestions: ["plano-contas-configurar", "relatorios-financeiros"]
      },
      {
        id: "centros-custo-esg",
        question: "O que são Centros de Custos ESG?",
        answer: "Centros de Custos ESG permitem rastrear investimentos e despesas relacionados a iniciativas ambientais, sociais e de governança. Acesse Financeiro > Centros de Custo > Novo Centro ESG. Crie centros como 'Energia Renovável', 'Gestão de Resíduos', 'Treinamento Diversidade'. Ao categorizar transações, você consegue calcular ROI de projetos ESG e gerar relatórios integrados.",
        tags: ["centros de custo", "esg", "projetos", "investimentos"],
        relatedQuestions: ["vincular-despesas-esg", "roi-projetos-esg"]
      },
      {
        id: "fluxo-aprovacoes-financeiro",
        question: "Como funciona o fluxo de aprovações financeiras?",
        answer: "Configure workflows em Financeiro > Configurações > Aprovações. Defina regras por: valor (ex: >R$10k requer aprovação do diretor), categoria de despesa ou centro de custo. Aprovadores recebem notificações por e-mail/app. Histórico completo de aprovações, rejeições e justificativas fica registrado. Possibilita aprovações em múltiplos níveis (gerente → diretor → CFO).",
        tags: ["aprovações", "workflow", "controle", "governança"],
        relatedQuestions: ["cadastrar-contas-pagar", "alertas-financeiros"]
      },
      {
        id: "vincular-despesas-esg",
        question: "Como vincular despesas a iniciativas ESG?",
        answer: "Ao cadastrar contas a pagar/receber, use o campo 'Categoria ESG' para classificar em: Ambiental (ex: tratamento efluentes), Social (ex: programas sociais) ou Governança (ex: auditoria). Você também pode vincular ao 'Projeto ESG' específico. Isso permite análises de custo-benefício, cálculo de ROI ESG e relatórios integrados mostrando impacto financeiro das iniciativas sustentáveis.",
        tags: ["esg", "despesas", "categorização", "projetos"],
        relatedQuestions: ["centros-custo-esg", "roi-projetos-esg"]
      },
      {
        id: "roi-projetos-esg",
        question: "Como calcular o ROI de projetos ESG?",
        answer: "Acesse Financeiro > Análise ESG > ROI de Projetos. Selecione o projeto e período. O sistema calcula: investimento total (CAPEX + OPEX), economias geradas (redução energia, multas evitadas, eficiência), receitas adicionais (créditos de carbono, novos clientes) e retorno percentual. Também mostra payback period e impactos não-financeiros (tCO2e evitadas, % de reciclagem).",
        tags: ["roi", "retorno", "análise", "investimentos"],
        relatedQuestions: ["vincular-despesas-esg", "centros-custo-esg"]
      },
      {
        id: "alertas-financeiros",
        question: "O que são alertas financeiros inteligentes?",
        answer: "O sistema monitora continuamente e gera alertas para: 1) Contas próximas do vencimento (7, 3, 1 dia antes), 2) Despesas ESG acima do orçado, 3) Fluxo de caixa negativo projetado, 4) Oportunidades de economia detectadas pela IA, 5) Inconsistências em lançamentos contábeis. Configure criticidade e destinatários em Financeiro > Configurações > Alertas.",
        tags: ["alertas", "notificações", "monitoramento", "inteligência"],
        relatedQuestions: ["fluxo-aprovacoes-financeiro", "fluxo-caixa-previsao"]
      },
      {
        id: "exportar-gri-financeiro",
        question: "Como exportar dados financeiros para GRI?",
        answer: "Acesse Financeiro > Relatórios > Exportar para GRI. Selecione indicadores: GRI 201 (Performance Econômica), GRI 203 (Impactos Econômicos Indiretos), GRI 204 (Práticas de Compras). O sistema formata automaticamente os dados conforme padrões GRI, incluindo: valor econômico direto gerado/distribuído, investimentos em infraestrutura, proporção de gastos com fornecedores locais. Exporta em Excel compatível com relatórios de sustentabilidade.",
        tags: ["gri", "exportação", "relatórios", "sustentabilidade"],
        relatedQuestions: ["relatorios-financeiros", "vincular-despesas-esg"]
      },
      {
        id: "relatorio-rentabilidade",
        question: "Como interpretar o relatório de rentabilidade?",
        answer: "O Relatório de Rentabilidade (Financeiro > Relatórios > Rentabilidade) mostra: margem bruta, margem líquida, EBITDA, ROE (Return on Equity), ROA (Return on Assets) por período. Analisa rentabilidade por: produto/serviço, centro de custo, projeto ESG e cliente. Gráficos de tendência mostram evolução temporal. Use para identificar operações mais lucrativas e áreas de melhoria.",
        tags: ["rentabilidade", "margens", "ebitda", "indicadores"],
        relatedQuestions: ["relatorios-financeiros", "roi-projetos-esg"]
      },
      {
        id: "fluxo-caixa-previsao",
        question: "Como funciona a previsão de fluxo de caixa?",
        answer: "A IA analisa histórico de recebimentos/pagamentos e contas futuras cadastradas para projetar fluxo de caixa em 30, 60 e 90 dias. Acesse Financeiro > Fluxo de Caixa > Projeção. Visualize: entradas esperadas, saídas previstas, saldo projetado e probabilidade de déficit. Sistema identifica períodos críticos e sugere ações (negociar prazos, antecipar recebíveis). Atualizado em tempo real conforme novos lançamentos.",
        tags: ["fluxo de caixa", "previsão", "projeção", "ia"],
        relatedQuestions: ["alertas-financeiros", "cadastrar-contas-receber"]
      },
      {
        id: "relatorios-financeiros",
        question: "Quais relatórios financeiros estão disponíveis?",
        answer: "Relatórios disponíveis: 1) DRE (Demonstração do Resultado do Exercício), 2) Balanço Patrimonial, 3) Fluxo de Caixa (realizado e projetado), 4) Contas a Pagar/Receber (aging), 5) Rentabilidade por Centro de Custo/Projeto, 6) Análise de Despesas ESG, 7) Indicadores Financeiros (liquidez, endividamento), 8) Razão Contábil, 9) Conciliação Bancária. Todos exportáveis em PDF/Excel.",
        tags: ["relatórios", "dre", "balanço", "análises"],
        relatedQuestions: ["plano-contas-configurar", "exportar-gri-financeiro"]
      },
      {
        id: "configurar-bancos",
        question: "Como configurar bancos e contas bancárias?",
        answer: "Acesse Financeiro > Configurações > Contas Bancárias > Nova Conta. Cadastre: banco, agência, conta, tipo (corrente/poupança/investimento), saldo inicial e responsável. Você pode configurar múltiplas contas e definir uma como principal. Para integrações automáticas de extrato (OFX/API), contate o suporte para configuração específica do seu banco.",
        tags: ["bancos", "contas bancárias", "configuração", "saldos"],
        relatedQuestions: ["conciliacao-bancaria", "cadastrar-contas-pagar"]
      },
      {
        id: "conciliacao-bancaria",
        question: "Como fazer conciliação bancária?",
        answer: "Acesse Financeiro > Conciliação Bancária. 1) Faça upload do extrato (OFX, PDF ou CSV), 2) O sistema identifica automaticamente lançamentos correspondentes, 3) Confirme matches sugeridos ou vincule manualmente, 4) Identifique diferenças (lançamentos no sistema não no extrato ou vice-versa), 5) Faça ajustes necessários. Ao final, o saldo conciliado deve bater com extrato. Histórico completo de conciliações é mantido.",
        tags: ["conciliação", "extrato", "bancário", "saldos"],
        relatedQuestions: ["configurar-bancos", "lancamentos-contabeis"]
      },
      {
        id: "calcular-indicadores-financeiros",
        question: "Como calcular indicadores financeiros?",
        answer: "Acesse Financeiro > Indicadores. O sistema calcula automaticamente: Liquidez (corrente, seca, imediata), Endividamento (geral, composição, grau), Rentabilidade (ROE, ROA, margem líquida), Atividade (giro de estoque, prazo médio) e Investimentos ESG. Cada indicador possui tooltip explicativo com fórmula, interpretação e benchmark do setor. Compare períodos para análise de tendências.",
        tags: ["indicadores", "índices", "análise", "performance"],
        relatedQuestions: ["relatorio-rentabilidade", "relatorios-financeiros"]
      },
      {
        id: "integrar-dados-financeiros-esg",
        question: "Como integrar dados financeiros nos relatórios ESG?",
        answer: "A integração é automática quando você categoriza transações com tags ESG. Acesse Relatórios > Integrado Financeiro-ESG para ver: investimentos ambientais vs. economia gerada, custos sociais vs. impacto em comunidades, despesas de governança vs. redução de riscos. Dashboards mostram correlação entre investimento ESG e performance financeira. Dados podem ser exportados para relatórios anuais de sustentabilidade.",
        tags: ["integração", "esg", "relatórios", "correlação"],
        relatedQuestions: ["vincular-despesas-esg", "exportar-gri-financeiro"]
      },
      {
        id: "filtros-periodo-financeiro",
        question: "Como usar filtros de período nos relatórios financeiros?",
        answer: "Todos os relatórios financeiros possuem filtros de período no topo: Mês (selecione específico ou mês atual), Trimestre (Q1, Q2, Q3, Q4), Semestre, Ano, Período Customizado (defina data inicial e final), Comparativo (ex: 2024 vs. 2023). Você pode salvar filtros favoritos para acesso rápido. Dados são atualizados em tempo real conforme filtro selecionado.",
        tags: ["filtros", "período", "datas", "análise temporal"],
        relatedQuestions: ["relatorios-financeiros", "acessar-dashboard-financeiro"]
      }
    ]
  },
  {
    id: "assistente-ia",
    title: "Assistente IA (Daton AI Chat)",
    icon: "Bot",
    description: "Assistente inteligente com análise preditiva",
    questions: [
      {
        id: "usar-assistente-ia",
        question: "Como usar o Assistente IA do Daton?",
        answer: "Clique no ícone de chat (🤖) no canto inferior direito em qualquer página. O Assistente IA é contextual: entende em qual módulo você está e adapta respostas. Faça perguntas em linguagem natural como 'Qual foi nossa emissão total em 2024?' ou 'Mostre alertas de licenças vencendo'. Suporta comandos de voz (clique no microfone) e pode executar ações como gerar relatórios ou criar tarefas.",
        tags: ["ia", "assistente", "chat", "ajuda"],
        relatedQuestions: ["tipos-perguntas-ia", "analise-contextual"]
      },
      {
        id: "tipos-perguntas-ia",
        question: "Que tipos de perguntas posso fazer à IA?",
        answer: "Você pode perguntar sobre: 1) **Dados**: 'Quais foram minhas emissões no Q1?', 2) **Análises**: 'Compare resíduos 2023 vs 2024', 3) **Previsões**: 'Vamos atingir a meta de carbono neutro?', 4) **Tutoriais**: 'Como cadastrar licença?', 5) **Ações**: 'Crie relatório GRI 305', 'Agende tarefa de renovação', 6) **Insights**: 'Identifique oportunidades de redução de custos ESG'. A IA aprende com uso e melhora respostas.",
        tags: ["perguntas", "comandos", "queries", "consultas"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "upload-documentos-ia",
        question: "Como fazer upload de documentos para análise?",
        answer: "No chat da IA, clique no ícone de anexo (📎) ou arraste arquivos (PDF, Excel, imagens, Word). A IA pode: extrair dados de notas fiscais, ler relatórios ambientais, analisar contratos de fornecedores, processar planilhas de consumo, interpretar laudos técnicos. Após upload, pergunte 'Extraia os valores desta nota fiscal' ou 'Resuma este relatório de auditoria'. OCR automático para documentos escaneados.",
        tags: ["upload", "documentos", "ocr", "extração"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-dados-acesso"]
      },
      {
        id: "analise-contextual",
        question: "O que é análise contextual por página?",
        answer: "A IA adapta respostas baseada na página atual. Exemplo: se você está em 'Emissões GEE' e pergunta 'mostre o total do mês', ela entende que você quer emissões (não financeiro). Em 'Licenciamento', 'o que vence este mês?' retorna licenças. Em 'Dashboard Financeiro', mesma pergunta mostra contas a pagar. Isso torna conversação mais natural e reduz ambiguidade. Você pode desativar em Configurações > IA > Modo Contextual.",
        tags: ["contexto", "página", "inteligência", "adaptação"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      },
      {
        id: "analises-preditivas-ia",
        question: "Como pedir análises preditivas?",
        answer: "Pergunte: 'Preveja emissões para próximos 6 meses', 'Qual probabilidade de atingir meta X?', 'Identifique tendências de consumo de água', 'Quais licenças têm risco de atraso?'. A IA usa machine learning em dados históricos (mínimo 3 meses) para projetar cenários futuros. Respostas incluem: valor previsto, intervalo de confiança (ex: 95%), fatores influenciadores e recomendações de ação. Precisão melhora com mais dados históricos.",
        tags: ["preditivo", "previsão", "machine learning", "tendências"],
        relatedQuestions: ["ia-calcula-previsoes", "insights-proativos"]
      },
      {
        id: "ia-analisa-dados-financeiros",
        question: "Quais dados financeiros a IA pode analisar?",
        answer: "A IA acessa: contas a pagar/receber, lançamentos contábeis, fluxo de caixa, centros de custo, projetos ESG, orçamentos, indicadores financeiros e transações bancárias. Exemplos de análises: 'Identifique despesas anômalas', 'Compare rentabilidade por projeto', 'Projete déficit de caixa', 'Calcule ROI de iniciativa X', 'Mostre maiores fornecedores', 'Analise custo-benefício de investimento sustentável'. Respeita permissões do usuário.",
        tags: ["financeiro", "análise", "dados", "transações"],
        relatedQuestions: ["tipos-perguntas-ia", "analises-preditivas-ia"]
      },
      {
        id: "ia-calcula-previsoes",
        question: "Como a IA calcula previsões de emissões?",
        answer: "Algoritmo: 1) Coleta histórico de emissões por fonte e escopo (mínimo 3 meses, ideal 12+), 2) Identifica padrões sazonais (ex: maior consumo energético no verão), 3) Aplica modelos de séries temporais (ARIMA, Prophet), 4) Considera variáveis externas (crescimento produção, projetos de eficiência), 5) Gera previsão com intervalo de confiança. Quanto mais dados e contexto fornecidos, maior a precisão. Modelos são retreinados mensalmente.",
        tags: ["emissões", "previsão", "algoritmo", "metodologia"],
        relatedQuestions: ["analises-preditivas-ia", "precisao-previsoes"]
      },
      {
        id: "insights-proativos",
        question: "O que são insights proativos?",
        answer: "A IA monitora continuamente seus dados e envia insights sem você pedir: 'Detectamos aumento de 15% em consumo de água na unidade X', 'Oportunidade: trocar fornecedor Y pode economizar R$50k/ano', 'Alerta: tendência atual indica que meta Z não será atingida', 'Sugestão: antecipar renovação de licença evita multa de R$100k'. Configure frequência e canais (in-app, e-mail) em Configurações > IA > Insights Proativos.",
        tags: ["insights", "proativo", "alertas", "recomendações"],
        relatedQuestions: ["analises-preditivas-ia", "ia-identifica-riscos"]
      },
      {
        id: "ia-identifica-riscos",
        question: "Como a IA identifica riscos de conformidade?",
        answer: "Sistema de scoring analisa: 1) Licenças próximas do vencimento (peso alto), 2) Condicionantes não atendidas, 3) Tarefas críticas atrasadas, 4) Emissões acima de limites legais, 5) Auditorias com não-conformidades, 6) Prazos de relatórios obrigatórios. IA atribui score 0-100 (0=crítico, 100=conforme) e classifica risco: Baixo, Médio, Alto, Crítico. Dashboard de Riscos mostra ranking e planos de mitigação sugeridos.",
        tags: ["riscos", "conformidade", "scoring", "alertas"],
        relatedQuestions: ["insights-proativos", "scoring-risco-licencas"]
      },
      {
        id: "relatorios-customizados-ia",
        question: "Posso pedir relatórios customizados à IA?",
        answer: "Sim! Exemplos: 'Crie relatório de emissões Escopo 1 e 2 do último trimestre em PDF', 'Gere dashboard comparando água vs energia por unidade', 'Extraia dados de resíduos para apresentação executiva', 'Monte relatório financeiro-ESG para conselho'. A IA estrutura dados conforme solicitado, aplica visualizações apropriadas e exporta em formato desejado (PDF, Excel, PPT). Você pode salvar templates de relatórios frequentes.",
        tags: ["relatórios", "customização", "geração", "exportação"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-analisa-dados-financeiros"]
      },
      {
        id: "ia-probabilidade-metas",
        question: "Como a IA analisa probabilidade de atingir metas?",
        answer: "Para cada meta, a IA: 1) Compara progresso atual vs. trajetória necessária, 2) Analisa velocidade de avanço (tendência), 3) Considera sazonalidade e fatores externos, 4) Avalia ações planejadas no plano de ação, 5) Calcula probabilidade (ex: 68% de chance de atingir meta até prazo). Se probabilidade <50%, sugere ações corretivas específicas. Atualiza análise semanalmente conforme novos dados.",
        tags: ["metas", "probabilidade", "previsão", "análise"],
        relatedQuestions: ["analises-preditivas-ia", "insights-proativos"]
      },
      {
        id: "ia-dados-acesso",
        question: "A IA tem acesso a todos os meus dados?",
        answer: "**Segurança primeiro**: A IA acessa apenas dados que você tem permissão de visualizar (conforme seu nível de acesso). Dados são processados de forma segura e criptografada. Conversas com IA não são compartilhadas entre usuários. Em configurações, você pode limitar módulos acessíveis pela IA. Dados sensíveis (senhas, tokens API) nunca são acessados. Conformidade com LGPD: você pode solicitar exclusão do histórico de chat a qualquer momento.",
        tags: ["privacidade", "segurança", "acesso", "lgpd"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "scoring-risco-licencas",
        question: "Como funciona o scoring de risco de licenças?",
        answer: "Cada licença recebe score 0-100 baseado em: Dias até vencimento (peso 40%), Histórico de renovações (pontual/atrasada, peso 20%), Complexidade do processo (peso 15%), Dependências críticas (peso 15%), Condicionantes pendentes (peso 10%). Score <30 = Crítico (ação imediata), 30-50 = Alto, 50-70 = Médio, >70 = Baixo risco. IA sugere quando iniciar processo de renovação baseado em tempo médio histórico do órgão emissor.",
        tags: ["licenças", "risco", "score", "conformidade"],
        relatedQuestions: ["ia-identifica-riscos", "insights-proativos"]
      },
      {
        id: "ia-ferramentas-acesso",
        question: "Quais ferramentas/tools a IA tem acesso?",
        answer: "A IA pode executar: 1) **Consultas**: ler dados de emissões, resíduos, licenças, financeiro, tarefas, 2) **Cálculos**: indicadores GRI, ROI, previsões, tendências, 3) **Ações**: criar tarefas, agendar lembretes, gerar relatórios, exportar dados, 4) **Análises**: comparações temporais, benchmarking, identificar anomalias, 5) **Integrações**: consultar APIs externas (clima, índices ESG). Lista completa em Ajuda > IA > Ferramentas Disponíveis.",
        tags: ["ferramentas", "tools", "capacidades", "funções"],
        relatedQuestions: ["tipos-perguntas-ia", "relatorios-customizados-ia"]
      },
      {
        id: "melhorar-respostas-ia",
        question: "Como melhorar a qualidade das respostas da IA?",
        answer: "**Dicas**: 1) Seja específico ('emissões Escopo 2 de janeiro' vs 'emissões'), 2) Forneça contexto ('compare Q1 2024 vs Q1 2023'), 3) Use termos técnicos corretos quando possível, 4) Quebre perguntas complexas em partes, 5) Avalie respostas (👍/👎) para treinar o modelo, 6) Mantenha dados atualizados e completos, 7) Configure preferências de resposta (detalhada/resumida) em Configurações > IA. A IA aprende com feedbacks da sua empresa.",
        tags: ["qualidade", "otimização", "dicas", "treinamento"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      }
    ]
  },
  {
    id: "gestao-tarefas",
    title: "Gestão de Tarefas",
    icon: "CheckSquare",
    description: "Organize e acompanhe atividades ESG",
    questions: [
      {
        id: "criar-tarefa",
        question: "Como criar uma nova tarefa?",
        answer: "Acesse Tarefas > Nova Tarefa. Preencha: título, descrição detalhada, tipo (manutenção, monitoramento, relatório, conformidade), prioridade (baixa/média/alta/urgente), responsável(is), prazo, recorrência (se aplicável) e vincule a licença, meta ou projeto relacionado. Você pode adicionar checklists internos, anexar arquivos e definir dependências entre tarefas. Notificações automáticas são enviadas aos responsáveis.",
        tags: ["tarefas", "criar", "novo", "atividades"],
        relatedQuestions: ["definir-prioridades", "atribuir-responsaveis"]
      },
      {
        id: "definir-prioridades",
        question: "Como definir prioridades de tarefas?",
        answer: "Sistema de 4 níveis: **Urgente** (vermelho, crítico para conformidade, prazo <24h), **Alta** (laranja, impacto significativo, prazo <1 semana), **Média** (amarelo, importante mas não urgente, prazo <1 mês), **Baixa** (verde, pode ser reagendada). Use a Matriz de Eisenhower: Urgente+Importante = Urgente, Não urgente+Importante = Alta, Urgente+Não importante = Média, Não urgente+Não importante = Baixa. IA pode sugerir prioridades baseada em contexto.",
        tags: ["prioridades", "urgência", "classificação", "níveis"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "workflow-aprovacao-tarefas",
        question: "Como funciona o workflow de aprovação?",
        answer: "Configure em Tarefas > Configurações > Workflows. Defina: 1) Quando requer aprovação (ex: tarefas >R$10k, tarefas críticas de conformidade), 2) Níveis de aprovação (analista → gerente → diretor), 3) SLA de resposta por nível, 4) Ação se timeout (escalar, aprovar auto, rejeitar). Aprovadores recebem notificações, podem aprovar/rejeitar com comentários. Histórico completo fica registrado. Integrável com sistemas externos via API.",
        tags: ["workflow", "aprovação", "processos", "governança"],
        relatedQuestions: ["criar-tarefa", "atribuir-responsaveis"]
      },
      {
        id: "atribuir-responsaveis",
        question: "Como atribuir responsáveis?",
        answer: "Na criação/edição de tarefa, campo 'Responsáveis' permite selecionar um ou mais usuários. Para tarefas complexas, defina: 'Responsável Principal' (accountable) e 'Colaboradores' (informados/consultados). Responsáveis recebem notificações de: atribuição, mudanças, prazos próximos. Você pode atribuir equipes inteiras (ex: time de meio ambiente) e delegar internamente. Relatórios mostram carga de trabalho por pessoa.",
        tags: ["responsáveis", "atribuição", "delegação", "usuários"],
        relatedQuestions: ["criar-tarefa", "workflow-aprovacao-tarefas"]
      },
      {
        id: "configurar-prazos-lembretes",
        question: "Como configurar prazos e lembretes?",
        answer: "Ao criar tarefa, defina 'Data de Vencimento'. Sistema calcula automaticamente dias restantes. Configure lembretes em Tarefas > Configurações > Notificações: 1) Lembrete padrão (7, 3, 1 dia antes), 2) Lembretes customizados (ex: 2 semanas antes para tarefas complexas), 3) Canais (e-mail, push, SMS para urgentes), 4) Escalonamento automático se não concluída no prazo. Lembretes respeitam horário comercial configurado.",
        tags: ["prazos", "lembretes", "notificações", "alertas"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "tags-tarefas",
        question: "O que são tags de tarefas?",
        answer: "Tags são rótulos customizáveis para categorizar tarefas além dos campos padrão. Exemplos: #auditoria, #ISO14001, #licença-vencendo, #economia-circular, #urgente-conselho. Use tags para: filtrar tarefas rapidamente, criar views personalizadas, gerar relatórios por tag, configurar automações ('se tag #urgente, notificar diretor'). Crie/gerencie tags em Tarefas > Configurações > Tags. Tags com # são automaticamente reconhecidas em descrições.",
        tags: ["tags", "categorias", "filtros", "organização"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      },
      {
        id: "vincular-tarefas-metas-licencas",
        question: "Como vincular tarefas a metas ou licenças?",
        answer: "Ao criar/editar tarefa, use campos 'Vincular a': Meta ESG (selecione da lista de metas ativas), Licença (escolha licença específica), Projeto (vincule a projeto ESG ou iniciativa). Vínculo permite: rastrear progresso de metas via tarefas concluídas, ver todas tarefas relacionadas a uma licença, calcular % de conclusão de projetos, gerar relatórios integrados. Dashboard mostra visão consolidada: meta → tarefas → status.",
        tags: ["vínculos", "metas", "licenças", "projetos"],
        relatedQuestions: ["criar-tarefa", "filtros-tarefas"]
      },
      {
        id: "tarefas-atrasadas",
        question: "Como ver tarefas atrasadas?",
        answer: "Acesse Tarefas > Filtros > Atrasadas. Visualize lista ordenada por: dias de atraso, prioridade ou impacto. Dashboard mostra: total de tarefas atrasadas, por responsável, por tipo, tendência (aumentando/diminuindo). Alertas automáticos são enviados para: responsável (diário até conclusão), gestor do responsável (após 3 dias) e escalação (após 7 dias conforme configuração). Use análise de causa-raiz em Relatórios > Tarefas para identificar gargalos recorrentes.",
        tags: ["atrasadas", "vencidas", "atraso", "pendências"],
        relatedQuestions: ["definir-prioridades", "configurar-prazos-lembretes"]
      },
      {
        id: "relatorios-produtividade",
        question: "Como gerar relatórios de produtividade?",
        answer: "Acesse Tarefas > Relatórios > Produtividade. Métricas disponíveis: 1) Taxa de conclusão por pessoa/equipe, 2) Tempo médio de execução por tipo de tarefa, 3) % de tarefas concluídas no prazo, 4) Carga de trabalho (tarefas ativas por pessoa), 5) Gargalos (tarefas frequentemente atrasadas), 6) Evolução temporal (tarefas criadas vs concluídas). Filtre por período, departamento, projeto. Exporta em Excel/PDF para apresentações.",
        tags: ["relatórios", "produtividade", "métricas", "performance"],
        relatedQuestions: ["tarefas-atrasadas", "filtros-tarefas"]
      },
      {
        id: "filtros-tarefas",
        question: "Como usar filtros de tarefas?",
        answer: "Painel de filtros (lado esquerdo da tela): Status (a fazer, em andamento, concluída), Prioridade (urgente, alta, média, baixa), Responsável (selecione usuários), Prazo (hoje, esta semana, este mês, atrasadas), Tags (#auditoria, etc), Tipo (manutenção, relatório, conformidade), Vínculo (meta, licença, projeto). Combine múltiplos filtros. Salve combinações como 'Views Favoritas' (ex: 'Minhas Urgentes', 'Auditorias Pendentes'). Filtros são persistentes entre sessões.",
        tags: ["filtros", "busca", "views", "organização"],
        relatedQuestions: ["tags-tarefas", "tarefas-atrasadas"]
      },
      {
        id: "notificacoes-tarefas",
        question: "Como receber notificações de tarefas?",
        answer: "Configure em Configurações > Notificações > Tarefas. Opções: 1) Nova atribuição (imediato), 2) Prazo próximo (7, 3, 1 dia antes), 3) Tarefa atrasada (diário), 4) Mudanças em tarefas que você acompanha, 5) Conclusão de dependências. Escolha canais: In-app (sempre ativo), E-mail (configurável por tipo), Push (mobile), SMS (apenas urgentes). Configure horário de notificações (ex: sem notificações após 18h). Resumos diários/semanais disponíveis.",
        tags: ["notificações", "alertas", "comunicação", "lembretes"],
        relatedQuestions: ["configurar-prazos-lembretes", "criar-tarefa"]
      },
      {
        id: "bulk-actions-tarefas",
        question: "Como fazer bulk actions em tarefas?",
        answer: "Selecione múltiplas tarefas (checkbox à esquerda) e use menu 'Ações em Lote': 1) Atribuir responsável em massa, 2) Alterar prioridade de várias tarefas, 3) Adicionar/remover tags simultaneamente, 4) Reagendar prazos (ex: +7 dias em todas), 5) Concluir múltiplas tarefas, 6) Exportar selecionadas, 7) Deletar em lote (requer confirmação). Histórico de bulk actions fica registrado. Útil para ajustes pós-planejamento ou reorganizações.",
        tags: ["bulk", "massa", "múltiplas", "ações"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      }
    ]
  },
  {
    id: "agua-efluentes",
    title: "Água e Efluentes",
    icon: "Droplet",
    description: "Gestão de recursos hídricos",
    questions: [
      {
        id: "registrar-consumo-agua",
        question: "Como registrar consumo de água?",
        answer: "Acesse Ambiental > Água > Novo Registro. Informe: período (mês/ano), fonte (rede pública, poço, captação superficial, reúso, chuva), volume consumido (m³), unidade/localização, medidor (se aplicável) e anexe contas de água ou relatórios de medição. Para múltiplas fontes, crie registros separados. Sistema calcula automaticamente: consumo total, intensidade hídrica (m³/unidade produzida), % por fonte e comparações temporais.",
        tags: ["água", "consumo", "registro", "volume"],
        relatedQuestions: ["categorizar-fontes-agua", "calcular-intensidade-hidrica"]
      },
      {
        id: "categorizar-fontes-agua",
        question: "Como categorizar fontes de água?",
        answer: "Sistema usa categorização GRI 303: 1) **Água superficial** (rios, lagos), 2) **Água subterrânea** (poços), 3) **Água do mar**, 4) **Água produzida** (subproduto de processos), 5) **Água de terceiros** (rede pública, fornecedores), 6) **Água de reúso** (tratada e reutilizada), 7) **Água da chuva** (captação pluvial). Cada fonte possui impacto e custo diferentes. Configure preços por fonte em Configurações > Água para análises financeiras.",
        tags: ["fontes", "categorias", "tipos", "origem"],
        relatedQuestions: ["registrar-consumo-agua", "gri-303-relatorio"]
      },
      {
        id: "calcular-intensidade-hidrica",
        question: "Como calcular intensidade hídrica?",
        answer: "Intensidade hídrica = Consumo total de água (m³) / Unidade de produção (ton, peças, R$ receita). Acesse Ambiental > Água > Indicadores. Configure denominador em Configurações > Água > Unidade de Produção (ex: toneladas produzidas, m² construídos, número de funcionários). Sistema calcula automaticamente e mostra evolução temporal. Benchmark com setor permite identificar se sua intensidade está acima/abaixo da média. Meta comum: reduzir X% ao ano.",
        tags: ["intensidade", "indicadores", "eficiência", "produtividade"],
        relatedQuestions: ["registrar-consumo-agua", "metas-reducao-agua"]
      },
      {
        id: "reuso-agua",
        question: "O que é reúso de água?",
        answer: "Reúso é tratar efluentes (água usada) para reutilização em processos que não exigem água potável: irrigação, limpeza, torres de resfriamento, descargas. Benefícios: reduz captação de água nova (economia financeira e ambiental), diminui descarga de efluentes, melhora sustentabilidade. No sistema: registre água de reúso como fonte separada, calcule % de reúso (água reutilizada / água total), compare custo reúso vs captação nova. Essencial para GRI 303 e certificações.",
        tags: ["reúso", "reutilização", "tratamento", "economia"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "monitorar-efluentes",
        question: "Como monitorar efluentes?",
        answer: "Acesse Ambiental > Efluentes > Novo Registro. Informe: volume descartado (m³), destino (rede pública, corpo hídrico, solo, tratamento próprio), qualidade (DBO, DQO, pH, metais pesados conforme análises laboratoriais), data de coleta e anexe laudos. Sistema alerta se parâmetros excedem limites legais (CONAMA, legislação estadual). Configure limites em Configurações > Efluentes > Padrões de Qualidade. Histórico permite acompanhar eficiência do tratamento.",
        tags: ["efluentes", "descarte", "qualidade", "tratamento"],
        relatedQuestions: ["reuso-agua", "gri-303-relatorio"]
      },
      {
        id: "gri-303-relatorio",
        question: "Como gerar relatório de água (GRI 303)?",
        answer: "Acesse Ambiental > Água > Relatório GRI 303. Sistema compila automaticamente: 303-1 (Interações com água), 303-2 (Gestão de impactos), 303-3 (Retirada de água por fonte), 303-4 (Descarga de água por destino e qualidade), 303-5 (Consumo de água total e intensidade). Dados vêm dos registros de consumo e efluentes. Exporta em Excel formatado conforme padrões GRI. Inclui notas explicativas, metodologia de cálculo e contexto operacional. Pronto para relatório de sustentabilidade.",
        tags: ["gri 303", "relatório", "água", "sustentabilidade"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "metas-reducao-agua",
        question: "Como definir metas de redução de consumo?",
        answer: "Acesse Metas > Nova Meta > Categoria: Água. Defina: baseline (ex: consumo 2023 = 10.000 m³/ano), meta (ex: reduzir 20% até 2026 = 8.000 m³/ano), prazo e plano de ação (instalar torneiras automáticas, reúso, conscientização). Sistema calcula progresso automaticamente baseado em novos registros mensais. Dashboard mostra: % concluído, projeção se manter tendência atual, ações pendentes. IA pode sugerir metas realistas baseadas em benchmark do setor.",
        tags: ["metas", "redução", "objetivos", "economia"],
        relatedQuestions: ["calcular-intensidade-hidrica", "registrar-consumo-agua"]
      },
      {
        id: "importar-dados-medidores",
        question: "Como importar dados de medidores?",
        answer: "Se você possui medidores inteligentes ou hidrometria digital: 1) Exporte dados do sistema de medição (geralmente CSV, Excel), 2) Acesse Ambiental > Água > Importar Dados, 3) Mapeie colunas (data, volume, medidor ID), 4) Valide preview, 5) Importe. Sistema aceita importações em lote (múltiplos medidores/meses). Para integrações automáticas via API (leitura direta dos medidores), contate suporte técnico. Template de importação disponível para download.",
        tags: ["importação", "medidores", "automação", "dados"],
        relatedQuestions: ["registrar-consumo-agua", "vincular-agua-custos"]
      },
      {
        id: "vincular-agua-custos",
        question: "Como vincular água a custos?",
        answer: "Configure preços em Configurações > Água > Custos. Defina: 1) Tarifa por m³ para cada fonte (rede pública, poço, reúso), 2) Custos de tratamento de efluentes, 3) Custos de outorga, 4) Custos de energia para bombeamento. Sistema calcula automaticamente: custo total mensal, custo por unidade produzida, economia gerada por reúso. Dados integram-se ao módulo Financeiro. Útil para análises de ROI de projetos de eficiência hídrica e decisões de investimento.",
        tags: ["custos", "financeiro", "tarifas", "economia"],
        relatedQuestions: ["calcular-intensidade-hidrica", "reuso-agua"]
      },
      {
        id: "qualidade-agua-monitoramento",
        question: "Como monitorar qualidade da água?",
        answer: "Para água captada e efluentes, registre parâmetros de qualidade em Ambiental > Água/Efluentes > Qualidade. Parâmetros comuns: pH, turbidez, DBO, DQO, sólidos suspensos, coliformes, metais pesados, temperatura. Anexe laudos laboratoriais. Sistema compara com: limites de captação (CONAMA 357), padrões de potabilidade (Portaria 2914), limites de descarte (CONAMA 430). Alertas automáticos se fora dos padrões. Essencial para conformidade com outorgas e licenças ambientais.",
        tags: ["qualidade", "análise", "parâmetros", "conformidade"],
        relatedQuestions: ["monitorar-efluentes", "registrar-consumo-agua"]
      }
    ]
  },
  {
    id: "analise-preditiva",
    title: "Análise Preditiva",
    icon: "TrendingUp",
    description: "Previsões e insights avançados",
    questions: [
      {
        id: "o-que-e-analise-preditiva",
        question: "O que é análise preditiva no Daton?",
        answer: "Análise preditiva usa inteligência artificial e machine learning para prever comportamentos futuros baseados em dados históricos. No Daton: prevê emissões de GEE, consumo de recursos (água, energia), probabilidade de atingir metas, riscos de não-conformidade, tendências financeiras ESG. Algoritmos detectam padrões, sazonalidades e anomalias que humanos dificilmente identificariam. Quanto mais dados históricos (ideal 12+ meses), maior a precisão. Acesse via Dashboard > Análise Preditiva ou pergunte à IA.",
        tags: ["preditivo", "ia", "machine learning", "previsão"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "previsao-emissoes",
        question: "Como funciona a previsão de emissões?",
        answer: "Sistema coleta histórico de emissões por escopo e fonte (mínimo 3 meses). Algoritmo: 1) Identifica tendências (crescimento linear, exponencial), 2) Detecta sazonalidade (ex: maior consumo energético no verão), 3) Considera variáveis exógenas (aumento produção, mudanças operacionais), 4) Aplica modelos estatísticos (ARIMA, Prophet, redes neurais), 5) Gera previsão pontual + intervalo de confiança (ex: 450 ± 50 tCO2e, confiança 95%). Acesse Emissões > Análise Preditiva > Próximos 6 meses.",
        tags: ["emissões", "previsão", "ghg", "carbono"],
        relatedQuestions: ["o-que-e-analise-preditiva", "detectar-anomalias"]
      },
      {
        id: "scoring-risco-conformidade",
        question: "O que é scoring de risco de conformidade?",
        answer: "Score 0-100 que indica nível de risco de não-conformidade legal/normativa. Fatores analisados (pesos): Licenças vencendo/vencidas (30%), Condicionantes não atendidas (25%), Emissões acima de limites (20%), Tarefas críticas atrasadas (15%), Auditorias com NC (10%). IA atualiza score diariamente. Classificação: 0-30 (Crítico - ação imediata), 31-50 (Alto - priorizar), 51-70 (Médio - monitorar), 71-100 (Baixo - sob controle). Dashboard de Conformidade mostra score + plano de mitigação sugerido.",
        tags: ["risco", "conformidade", "score", "alertas"],
        relatedQuestions: ["probabilidade-atingir-metas", "detectar-anomalias"]
      },
      {
        id: "probabilidade-atingir-metas",
        question: "Como calcular probabilidade de atingir metas?",
        answer: "Para cada meta, IA: 1) Compara progresso atual (ex: 30% concluído) vs ideal (ex: deveria estar em 50% do tempo decorrido), 2) Calcula velocidade de progresso (tendência), 3) Considera sazonalidade e plano de ação restante, 4) Projeta cenários (otimista, realista, pessimista), 5) Retorna probabilidade (ex: 68% de atingir meta até prazo). Se <50%, sistema alerta e sugere ações corretivas específicas. Acesse Metas > [Selecione Meta] > Análise Preditiva. Atualiza semanalmente.",
        tags: ["metas", "probabilidade", "objetivos", "previsão"],
        relatedQuestions: ["o-que-e-analise-preditiva", "scoring-risco-conformidade"]
      },
      {
        id: "interpretar-intervalos-confianca",
        question: "Como interpretar intervalos de confiança?",
        answer: "Intervalo de confiança expressa incerteza da previsão. Exemplo: 'Emissão prevista: 450 tCO2e (intervalo 95%: 400-500)' significa: há 95% de chance do valor real ficar entre 400-500 tCO2e. Intervalos maiores = maior incerteza (poucos dados históricos, alta variabilidade). Intervalos menores = previsão mais precisa. Use nível de confiança conforme criticidade: 90% (decisões operacionais), 95% (planejamento estratégico), 99% (conformidade regulatória). Sistema mostra intervalos graficamente.",
        tags: ["intervalo", "confiança", "estatística", "incerteza"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "detectar-anomalias",
        question: "O que são anomalias nas emissões?",
        answer: "Anomalia = valor significativamente diferente do padrão esperado. Sistema detecta: 1) **Anomalias pontuais** (pico isolado, ex: consumo energético 200% maior em 1 mês), 2) **Mudanças de tendência** (aumento gradual inesperado), 3) **Outliers sazonais** (valor alto mesmo considerando sazonalidade). IA aprende padrão normal e alerta quando desvio >2 desvios-padrão. Útil para: detectar erros de medição, identificar ineficiências, antecipar problemas. Acesse Dashboard > Anomalias Detectadas.",
        tags: ["anomalias", "outliers", "desvios", "alertas"],
        relatedQuestions: ["previsao-emissoes", "detectar-tendencias"]
      },
      {
        id: "dados-historicos-necessarios",
        question: "Quantos dados históricos são necessários?",
        answer: "**Mínimo**: 3 meses (para previsões básicas de curto prazo). **Recomendado**: 12+ meses (captura sazonalidade anual completa). **Ideal**: 24+ meses (maior precisão, detecta ciclos multi-anuais). Quanto mais dados, melhor o modelo aprende padrões. Para análises preditivas complexas (ex: impacto de múltiplas variáveis), mínimo de 18 meses. Sistema indica qualidade da previsão: 'Baixa confiança' (<6 meses), 'Média' (6-12), 'Alta' (>12). Importe históricos antigos em Dados > Importação.",
        tags: ["dados", "histórico", "período", "requisitos"],
        relatedQuestions: ["o-que-e-analise-preditiva", "precisao-previsoes"]
      },
      {
        id: "detectar-tendencias",
        question: "Como a IA detecta tendências?",
        answer: "Tendência = direção geral dos dados ao longo do tempo (crescimento, decrescimento, estabilidade). IA usa: 1) **Regressão linear/não-linear** (ajusta linha de tendência), 2) **Médias móveis** (suaviza flutuações), 3) **Decomposição de séries temporais** (separa tendência, sazonalidade, ruído), 4) **Testes estatísticos** (verifica se tendência é significativa). Classifica: Crescente (📈), Decrescente (📉), Estável (➡️). Mostra percentual de mudança (ex: +15%/ano). Acesse Análise > Tendências por Indicador.",
        tags: ["tendências", "evolução", "crescimento", "análise"],
        relatedQuestions: ["previsao-emissoes", "detectar-anomalias"]
      },
      {
        id: "usar-preditiva-planejamento",
        question: "Como usar análise preditiva para planejamento?",
        answer: "**Casos de uso**: 1) **Orçamento**: preveja custos futuros de energia, água, gestão de resíduos para planejar budget, 2) **Metas**: avalie viabilidade de metas antes de comprometer-se publicamente, 3) **Conformidade**: antecipe quando licenças precisam ser renovadas baseado em tempo médio histórico, 4) **Investimentos**: simule impacto de projetos ESG antes de implementar (ex: 'se instalar painéis solares, redução de emissões projetada'), 5) **Relatórios**: inclua seções de projeções em relatórios anuais.",
        tags: ["planejamento", "estratégia", "orçamento", "decisões"],
        relatedQuestions: ["o-que-e-analise-preditiva", "probabilidade-atingir-metas"]
      },
      {
        id: "precisao-previsoes",
        question: "Qual a precisão das previsões?",
        answer: "Precisão varia conforme: 1) **Quantidade de dados** (>12 meses = maior precisão), 2) **Consistência** (operações estáveis preveem melhor que voláteis), 3) **Horizonte temporal** (próximos 3 meses mais preciso que 12 meses), 4) **Complexidade** (emissões Escopo 1 mais previsível que Escopo 3). Sistema reporta: erro médio percentual (MAPE, ex: 8%), R² (ajuste do modelo, ideal >0,8). Validação: compare previsões passadas vs valores reais. Recalibração automática mensal melhora precisão continuamente.",
        tags: ["precisão", "acurácia", "erro", "validação"],
        relatedQuestions: ["previsao-emissoes", "interpretar-intervalos-confianca"]
      }
    ]
  },
  {
    id: "integracao-financeiro-esg",
    title: "Integração Financeiro-ESG",
    icon: "Link",
    description: "Conecte performance financeira e ESG",
    questions: [
      {
        id: "o-que-e-integracao-financeiro-esg",
        question: "O que é a integração Financeiro-ESG?",
        answer: "É a conexão entre dados financeiros (despesas, investimentos, receitas) e indicadores ESG (emissões, impacto social, governança). Permite: rastrear custos de iniciativas ambientais, calcular ROI de projetos sustentáveis, vincular despesas a pilares ESG, analisar correlação entre investimento ESG e performance financeira, gerar relatórios integrados para stakeholders. Essencial para demonstrar valor financeiro da sustentabilidade e tomar decisões baseadas em custo-benefício real.",
        tags: ["integração", "esg", "financeiro", "roi"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "vincular-despesas-pilares-esg",
        question: "Como vincular despesas a pilares ESG?",
        answer: "Ao cadastrar conta a pagar/receber (Financeiro > Nova Conta), use campo 'Categoria ESG': **Ambiental** (ex: tratamento efluentes, energia renovável, gestão resíduos), **Social** (ex: programas sociais, treinamentos, saúde e segurança), **Governança** (ex: auditorias, compliance, sistemas de controle). Também vincule a 'Projeto ESG' específico. Sistema agrega automaticamente: total investido por pilar, % do budget ESG, evolução temporal. Essencial para relatórios GRI 201, SASB e investidores ESG.",
        tags: ["despesas", "categorização", "pilares", "esg"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "visualizar-custos-pilar"]
      },
      {
        id: "visualizar-custos-pilar",
        question: "Como visualizar custos por pilar ESG?",
        answer: "Acesse Financeiro > Dashboard ESG ou Relatórios > Custos ESG. Visualizações: 1) **Gráfico de pizza**: % investido em cada pilar (Ambiental, Social, Governança), 2) **Linha temporal**: evolução de investimentos por pilar, 3) **Comparativo**: budget planejado vs gasto real, 4) **Drill-down**: clique em pilar para ver projetos específicos e despesas detalhadas. Exporta em Excel/PDF. Útil para: comunicação com conselho, relatórios de sustentabilidade, decisões de alocação de recursos.",
        tags: ["custos", "visualização", "pilares", "análise"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "dashboard-esg-financeiro",
        question: "O que é o Dashboard ESG Financeiro?",
        answer: "Painel integrado (Financeiro > Dashboard ESG) que mostra: 1) **Investimentos ESG**: total e por pilar (E, S, G), 2) **ROI de projetos**: retorno financeiro + impacto ambiental/social, 3) **Economia gerada**: redução de custos por eficiência (energia, água, resíduos), 4) **Riscos mitigados**: valor de multas evitadas, custos de não-conformidade prevenidos, 5) **Indicadores financeiros ESG**: intensidade de carbono por R$ receita, investimento social por funcionário. Atualizações em tempo real, filtros de período.",
        tags: ["dashboard", "esg", "financeiro", "kpis"],
        relatedQuestions: ["visualizar-custos-pilar", "calcular-roi-ambientais"]
      },
      {
        id: "calcular-roi-ambientais",
        question: "Como calcular ROI de iniciativas ambientais?",
        answer: "Acesse Financeiro > Análise ESG > ROI de Projetos. Selecione projeto ambiental (ex: 'Instalação Painéis Solares'). Sistema calcula: **Investimento** (CAPEX + OPEX), **Retorno Financeiro** (economia energia, créditos carbono, incentivos fiscais), **Retorno Ambiental** (tCO2e evitadas, água economizada), **Payback** (tempo para recuperar investimento), **ROI %** (retorno total / investimento). Compara cenário com/sem projeto. Gera relatório executivo para justificar investimentos sustentáveis ao board.",
        tags: ["roi", "retorno", "ambiental", "projetos"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "rastrear-investimentos-esg"]
      },
      {
        id: "relatorios-integrados-financeiro-esg",
        question: "Como gerar relatórios integrados?",
        answer: "Acesse Relatórios > Integrado Financeiro-ESG. Relatórios disponíveis: 1) **Performance ESG vs Financeira**: correlaciona investimento ESG com lucratividade/receita, 2) **GRI 201 Completo**: valor econômico gerado/distribuído + contexto ESG, 3) **Investidores ESG**: métricas financeiras + ratings ESG + iniciativas, 4) **Custo-Benefício**: análise detalhada ROI de cada iniciativa ESG, 5) **Executivo**: resumo 1 página para board. Customizável, exporta PDF/PPT. Inclui gráficos, tabelas e narrativa explicativa.",
        tags: ["relatórios", "integrados", "esg", "financeiro"],
        relatedQuestions: ["dashboard-esg-financeiro", "exportar-dados-integrados-gri"]
      },
      {
        id: "rastrear-investimentos-esg",
        question: "Como rastrear investimentos ESG?",
        answer: "Configure centros de custo ESG (Financeiro > Centros de Custo > Tipo: ESG). Crie centros como: 'Energia Renovável', 'Gestão Resíduos', 'Programas Sociais', 'Compliance e Auditoria'. Ao lançar despesas, vincule ao centro correto. Sistema rastreia: total investido por centro, evolução temporal, % do investimento total, comparativo com orçamento. Dashboard mostra ranking de investimentos. Útil para: prestação de contas, análise de priorização, decisões de budget futuro.",
        tags: ["investimentos", "rastreamento", "centros de custo", "esg"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "calcular-roi-ambientais"]
      },
      {
        id: "estimar-impacto-carbono-despesas",
        question: "Como estimar impacto de carbono de despesas?",
        answer: "Para despesas específicas (energia, combustível, viagens, compras), sistema estima emissões associadas usando fatores de emissão: Energia elétrica (tCO2e/MWh da matriz local), Combustíveis (tCO2e/litro), Viagens (tCO2e/km por tipo de transporte), Compras (fatores médios por categoria Escopo 3). Acesse Financeiro > Despesas > [Selecione] > Impacto de Carbono. Visualize: emissões estimadas, % do total de emissões, custo por tCO2e. Útil para priorizar ações de redução com maior impacto financeiro-ambiental.",
        tags: ["carbono", "emissões", "despesas", "escopo 3"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "calcular-roi-ambientais"]
      },
      {
        id: "usar-projetos-esg-transacoes",
        question: "Como usar projetos ESG em transações?",
        answer: "Crie projetos em Projetos > Novo Projeto ESG. Exemplos: 'Neutralização Carbono 2024', 'Programa Inclusão', 'ISO 14001 Certificação'. Ao cadastrar transações financeiras (despesas, receitas), vincule ao projeto. Sistema agrega: custo total do projeto, orçamento restante, % concluído (via tarefas vinculadas), ROI parcial, impactos ambientais/sociais. Dashboard de Projetos mostra portfolio completo. Facilita: gestão de múltiplas iniciativas, relatórios por projeto, análise comparativa de eficiência.",
        tags: ["projetos", "transações", "vinculação", "gestão"],
        relatedQuestions: ["rastrear-investimentos-esg", "calcular-roi-ambientais"]
      },
      {
        id: "exportar-dados-integrados-gri",
        question: "Como exportar dados integrados para GRI?",
        answer: "Acesse Financeiro > Relatórios > Exportar para GRI. Selecione indicadores: **GRI 201** (Performance Econômica: valor gerado/distribuído), **GRI 203** (Impactos Econômicos Indiretos: investimentos infraestrutura/comunidade), **GRI 204** (Práticas de Compras: % fornecedores locais). Sistema formata automaticamente com dados financeiros categorizados por ESG. Inclui: breakdown por pilar, investimentos em sustentabilidade, economia gerada, impactos indiretos. Exporta Excel/PDF compatível com relatórios anuais de sustentabilidade integrados.",
        tags: ["gri", "exportação", "integrado", "relatórios"],
        relatedQuestions: ["relatorios-integrados-financeiro-esg", "vincular-despesas-pilares-esg"]
      },
      {
        id: "analise-custo-beneficio-acoes-esg",
        question: "Como analisar custo-benefício de ações ESG?",
        answer: "Ferramentas em Análise > Custo-Benefício ESG: 1) **Comparar cenários**: com/sem investimento ESG (ex: continuar combustível fóssil vs migrar energia solar), 2) **Calcular NPV** (Valor Presente Líquido) considerando benefícios tangíveis (economia) e intangíveis (reputação, atração talentos), 3) **Análise de sensibilidade**: como mudanças em premissas (ex: preço energia +10%) afetam ROI, 4) **Payback simples e descontado**, 5) **Risco-retorno**: probabilidade de sucesso vs retorno esperado. Gera relatório executivo para decisão.",
        tags: ["custo-benefício", "análise", "decisão", "investimentos"],
        relatedQuestions: ["calcular-roi-ambientais", "o-que-e-integracao-financeiro-esg"]
      },
      {
        id: "criar-orcamentos-esg",
        question: "Como criar orçamentos ESG?",
        answer: "Acesse Financeiro > Orçamentos > Novo Orçamento ESG. Defina: 1) **Ano/Período** fiscal, 2) **Pilares**: distribua budget entre Ambiental, Social, Governança (ex: 50% Ambiental, 30% Social, 20% Governança), 3) **Projetos**: aloque valores específicos (ex: R$500k para painéis solares), 4) **Centros de custo**: detalhamento fino, 5) **Breakdown mensal**: distribua ao longo do ano. Sistema monitora execução vs planejado, alertas de estouro, realoca budget se aprovado. Comparativo multi-anual mostra evolução de investimentos ESG.",
        tags: ["orçamentos", "budget", "planejamento", "alocação"],
        relatedQuestions: ["rastrear-investimentos-esg", "visualizar-custos-pilar"]
      }
    ]
  },
  {
    id: "gri-standards-detalhado",
    title: "GRI Standards Detalhado",
    icon: "BookOpen",
    description: "Relatórios GRI completos",
    questions: [
      {
        id: "o-que-sao-gri-standards",
        question: "O que são os GRI Standards?",
        answer: "GRI (Global Reporting Initiative) Standards são as diretrizes mais usadas mundialmente para relatórios de sustentabilidade. Estrutura: **GRI 2** (Conteúdos Gerais: perfil organizacional, governança), **GRI 3** (Tópicos Materiais: identificação e gestão), **GRI 200** (Econômicos: ex: 201 performance econômica), **GRI 300** (Ambientais: ex: 305 emissões, 306 resíduos), **GRI 400** (Sociais: ex: 401 emprego, 403 saúde e segurança). Padrão ouro para transparência ESG, usado em 90%+ dos relatórios globais.",
        tags: ["gri", "standards", "relatórios", "sustentabilidade"],
        relatedQuestions: ["indicadores-gri-daton", "gri-core-vs-comprehensive"]
      },
      {
        id: "indicadores-gri-daton",
        question: "Quais indicadores GRI o Daton cobre?",
        answer: "**GRI 2** (perfil, estratégia, governança - via configurações empresa), **GRI 201** (performance econômica - módulo financeiro), **GRI 203-204** (impactos econômicos, compras - financeiro ESG), **GRI 302** (energia - registros consumo), **GRI 303** (água - gestão hídrica), **GRI 305** (emissões GEE - inventário completo), **GRI 306** (resíduos - gestão resíduos), **GRI 308** (avaliação ambiental fornecedores - em desenvolvimento), **GRI 401-405** (emprego, relações trabalhistas, diversidade - RH). Cobertura 80%+ indicadores ambientais e governança.",
        tags: ["indicadores", "cobertura", "módulos", "gri"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "analise-materialidade-gri",
        question: "Como fazer análise de materialidade GRI?",
        answer: "Análise de materialidade identifica tópicos ESG mais relevantes para seu negócio e stakeholders. No Daton: 1) Acesse Relatórios > GRI > Materialidade, 2) Liste stakeholders (acionistas, clientes, funcionários, comunidade, reguladores), 3) Avalie tópicos GRI em 2 dimensões: **Importância para stakeholders** (1-5) e **Impacto no negócio** (1-5), 4) Matriz de materialidade mostra tópicos prioritários (alto em ambos), 5) Documente processo conforme GRI 3. Use pesquisas, workshops, benchmarking setorial.",
        tags: ["materialidade", "análise", "tópicos", "stakeholders"],
        relatedQuestions: ["o-que-sao-gri-standards", "preencher-indicadores-gri"]
      },
      {
        id: "preencher-indicadores-gri",
        question: "Como preencher indicadores GRI?",
        answer: "Acesse Relatórios > GRI > Indicadores. Selecione indicador (ex: GRI 305-1 Emissões diretas). Sistema: 1) **Coleta dados** automaticamente de módulos (emissões vêm de Inventário GEE), 2) **Apresenta template** conforme padrão GRI (tabelas, unidades corretas), 3) **Permite edição** de campos narrativos (contexto, metodologia, limitações), 4) **Valida completude** (alerta campos obrigatórios faltantes), 5) **Salva histórico** para comparações anuais. Alguns indicadores (ex: impactos sociais qualitativos) requerem input manual via formulários guiados.",
        tags: ["preencher", "formulários", "dados", "indicadores"],
        relatedQuestions: ["indicadores-gri-daton", "gerar-relatorio-gri-completo"]
      },
      {
        id: "gri-2-conteudos-gerais",
        question: "O que é GRI 2 (Conteúdos Gerais)?",
        answer: "GRI 2 cobre informações organizacionais base: **2-1 a 2-5** (perfil: nome, natureza, localização, propriedade, cadeia valor), **2-6 a 2-8** (atividades, trabalhadores, governança), **2-9 a 2-21** (estrutura e composição governança, delegação, conflitos interesse, remuneração), **2-22 a 2-28** (estratégia sustentabilidade, políticas, engajamento stakeholders), **2-29** (abordagem de engajamento). No Daton: configure em Configurações > Perfil Empresa e Governança. Dados pré-populam relatório GRI automaticamente.",
        tags: ["gri 2", "conteúdos gerais", "perfil", "governança"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "reportar-gri-305",
        question: "Como reportar GRI 305 (Emissões)?",
        answer: "GRI 305 requer: **305-1** (Emissões diretas Escopo 1), **305-2** (Emissões indiretas energéticas Escopo 2), **305-3** (Outras indiretas Escopo 3), **305-4** (Intensidade de emissões), **305-5** (Redução de emissões), **305-6** (Emissões de substâncias destruidoras ozônio), **305-7** (NOx, SOx e outras). No Daton: dados vêm do Inventário GEE automaticamente. Acesse Relatórios > GRI 305, revise dados, adicione contexto (metodologia, fatores emissão usados, exclusões), exporte seção formatada para relatório anual.",
        tags: ["gri 305", "emissões", "ghg", "carbono"],
        relatedQuestions: ["reportar-gri-303", "preencher-indicadores-gri"]
      },
      {
        id: "reportar-gri-303",
        question: "Como reportar GRI 303 (Água)?",
        answer: "GRI 303 cobre: **303-1** (Interações com água como recurso compartilhado: contexto local, estresse hídrico), **303-2** (Gestão impactos relacionados à descarga água), **303-3** (Retirada de água por fonte: superficial, subterrânea, mar, terceiros, chuva), **303-4** (Descarga de água por destino e qualidade: rede, corpo hídrico, padrões), **303-5** (Consumo de água total e intensidade). No Daton: Ambiental > Água > Relatório GRI 303 compila tudo automaticamente. Adicione contexto sobre regiões de estresse hídrico (ferramenta WRI Aqueduct).",
        tags: ["gri 303", "água", "recursos hídricos", "efluentes"],
        relatedQuestions: ["reportar-gri-305", "reportar-gri-306"]
      },
      {
        id: "reportar-gri-306",
        question: "Como reportar GRI 306 (Resíduos)?",
        answer: "GRI 306 requer: **306-1** (Geração de resíduos e impactos: contexto, tipos gerados), **306-2** (Gestão de impactos: hierarquia resíduos, circularidade), **306-3** (Resíduos gerados por tipo e composição), **306-4** (Resíduos não destinados à disposição final: reciclagem, reúso, compostagem), **306-5** (Resíduos destinados à disposição final: aterro, incineração). No Daton: Resíduos > Relatório GRI 306 agrega dados de registros. Breakdown automático por tipo de resíduo e destinação. Anexe MTRs como evidências.",
        tags: ["gri 306", "resíduos", "economia circular", "destinação"],
        relatedQuestions: ["reportar-gri-303", "reportar-gri-305"]
      },
      {
        id: "gerar-relatorio-gri-completo",
        question: "Como gerar relatório GRI completo?",
        answer: "Acesse Relatórios > GRI > Relatório Completo. 1) **Selecione ano** de reporte, 2) **Escolha opção** (Core ou Comprehensive), 3) **Selecione indicadores** (materiais identificados na análise de materialidade), 4) **Revise dados** pré-populados de cada módulo, 5) **Complete campos narrativos** (contexto, metodologia, limitações, ações futuras), 6) **Adicione anexos** (políticas, certificações, pareceres externos), 7) **Exporte** em formato Word editável ou PDF formatado. Inclui índice GRI, sumário executivo e tabelas de conteúdo.",
        tags: ["relatório completo", "geração", "exportação", "gri"],
        relatedQuestions: ["o-que-sao-gri-standards", "gri-core-vs-comprehensive"]
      },
      {
        id: "exportar-dados-relatorio-sustentabilidade",
        question: "Como exportar dados para relatório de sustentabilidade?",
        answer: "Além do GRI completo, você pode exportar dados específicos: 1) **Dashboard executivo**: métricas-chave ESG em 1 página (PDF/PPT), 2) **Seções específicas**: apenas emissões, apenas social, etc (Word/Excel), 3) **Gráficos e visualizações**: imagens alta resolução para design gráfico do relatório, 4) **Tabelas de dados**: Excel com todos os números para equipe editorial, 5) **Histórico multi-anual**: evolução 3-5 anos para análise de tendências. Formatos customizáveis. API disponível para integração com ferramentas de publicação.",
        tags: ["exportação", "relatório", "sustentabilidade", "formatos"],
        relatedQuestions: ["gerar-relatorio-gri-completo", "preencher-indicadores-gri"]
      },
      {
        id: "gri-core-vs-comprehensive",
        question: "Qual a diferença entre GRI Core e Comprehensive?",
        answer: "**GRI Core** (Essencial): reporta informações essenciais sobre impactos econômicos, ambientais e sociais. Menos detalhes, mais acessível para empresas iniciantes ou menores. Cobre indicadores-chave de tópicos materiais. **GRI Comprehensive** (Abrangente): reporte detalhado e completo. Todas as divulgações de GRI 2, todos os indicadores de gestão (ex: 3-3) para cada tópico material, informações adicionais contextuais. Preferido por grandes empresas, listadas e líderes ESG. No Daton, escolha na geração do relatório conforme maturidade ESG e expectativas de stakeholders.",
        tags: ["core", "comprehensive", "níveis", "diferenças"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "vincular-dados-financeiros-gri",
        question: "Como vincular dados financeiros ao GRI?",
        answer: "Indicadores GRI econômicos (200) requerem dados financeiros: **GRI 201-1** (valor econômico direto gerado/distribuído: receitas, custos operacionais, salários, impostos, investimentos comunitários) vem de DRE e balanço. **GRI 203** (investimentos infraestrutura, impactos sociais) vem de projetos ESG financeiros. **GRI 204** (práticas compras, % fornecedores locais) vem de contas a pagar categorizadas. No Daton, integração automática: Financeiro > Relatórios > GRI Econômico compila e formata. Valide com contador antes de publicar.",
        tags: ["financeiro", "econômico", "gri 201", "integração"],
        relatedQuestions: ["reportar-gri-305", "gerar-relatorio-gri-completo"]
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
