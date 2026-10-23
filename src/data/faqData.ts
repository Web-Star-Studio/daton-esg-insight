/**
 * FAQ Data
 * Centralized FAQ content organized by categories
 */

import { FAQCategory } from "@/types/faq";

export const faqCategories: FAQCategory[] = [
  {
    id: "use-cases",
    title: "Casos de Uso Práticos",
    icon: "Lightbulb",
    description: "Exemplos reais de uso da plataforma",
    questions: [
      {
        id: "uc-1",
        question: "Como fazer meu primeiro inventário de emissões?",
        answer: "No módulo Clima, cadastre as fontes dos Escopos 1, 2 e 3, informe os dados de atividade e associe os fatores de emissão versionados. O Daton calcula as emissões e consolida os totais; a disponibilidade depende da habilitação do módulo para sua empresa.",
        tags: ["inventário", "ghg", "iniciante", "tutorial"]
      },
      {
        id: "uc-2",
        question: "Como preparar relatório para auditoria externa?",
        answer: "Revise os lançamentos e fatores usados no período, confira as evidências anexadas aos registros e exporte os dados disponíveis em CSV. O Daton organiza a rastreabilidade, mas a validação e o relatório formal da auditoria continuam sob responsabilidade da organização e do auditor.",
        tags: ["auditoria", "conformidade", "relatório", "verificação"]
      },
      {
        id: "uc-3",
        question: "Como usar o Daton para ISO 14001?",
        answer: "Use os cadastros de aspectos e impactos ambientais, requisitos legais, objetivos, indicadores, documentos, auditorias, não conformidades e planos de ação para reunir evidências do sistema de gestão. O Daton apoia a operação; não concede nem garante certificação ISO 14001.",
        tags: ["iso14001", "sga", "gestão ambiental", "normas"]
      },
      {
        id: "uc-4",
        question: "Como integrar Daton com sistema ERP?",
        answer: "O Daton ainda não oferece integração pronta com ERP, API pública, OAuth ou webhooks. Quando habilitada para a empresa e para o destino desejado, a importação assistida por planilha permite trazer dados em lotes controlados.",
        tags: ["integração", "erp", "api", "automação"]
      },
      {
        id: "uc-5",
        question: "Como treinar equipe no Daton?",
        answer: "Comece pela Central de Ajuda em /app/ajuda, defina os acessos de cada pessoa e pratique os fluxos usados pela empresa. Para dúvidas, use o widget Feedback no menu inferior do painel ou escreva para contato@daton.com.br.",
        tags: ["treinamento", "onboarding", "capacitação", "equipe"]
      },
      {
        id: "uc-6",
        question: "Como migrar dados de outro sistema?",
        answer: "Exporte os dados de origem, revise qualidade e correspondência dos campos e use a importação assistida por planilha nos destinos habilitados para sua empresa. Não há API pública nem limites universais de volume; valide o resultado de cada lote antes de seguir.",
        tags: ["migração", "importação", "dados", "transição"]
      },
      {
        id: "uc-7",
        question: "Como criar workflow de aprovação de licenças?",
        answer: "O Daton não possui um construtor genérico de workflows ou aprovação em múltiplas etapas para licenças. É possível cadastrar licenças, condicionantes, obrigações, responsáveis, prazos, evidências e acompanhar as pendências quando esses recursos estiverem habilitados.",
        tags: ["workflow", "aprovação", "licenças", "automação"]
      },
      {
        id: "uc-8",
        question: "Como monitorar conformidade em tempo real?",
        answer: "Acompanhe licenças, condicionantes, obrigações, requisitos e pendências pelos painéis e listas disponíveis. Os dados refletem os registros feitos no sistema; não há monitoramento externo em tempo real, notificações push, scoring de IA ou integração automática com calendário.",
        tags: ["conformidade", "monitoramento", "alertas", "tempo real"]
      },
      {
        id: "uc-9",
        question: "Como preparar relatório para investidores ESG?",
        answer: "Cadastre um referencial ESG, organize temas, respostas, evidências, indicadores e iniciativas e use o relato em rascunho como base de trabalho. A edição final, as métricas financeiras, o benchmarking e a publicação do relatório são feitos fora do Daton.",
        tags: ["investidores", "relatório", "esg", "financeiro"]
      },
      {
        id: "uc-10",
        question: "Como usar Daton para certificações (B Corp, etc)?",
        answer: "Cadastre os requisitos aplicáveis, reúna evidências, acompanhe indicadores, auditorias, não conformidades e planos de ação. O Daton não traz modelos prontos nem garante atendimento a B Corp, LEED, GRI ou outras certificações; a organização deve configurar o referencial e validar os critérios oficiais.",
        tags: ["certificação", "b-corp", "iso", "acreditação"]
      },
      {
        id: "uc-11",
        question: "Como configurar Daton para múltiplas unidades?",
        answer: "Cadastre as filiais da organização e atribua o acesso conforme papel, módulo e filial. Registros que possuem vínculo com filial podem ser filtrados por essa estrutura; o Daton não modela holdings ou empresas independentes em uma única organização.",
        tags: ["multi-site", "unidades", "consolidação", "grupos"]
      },
      {
        id: "uc-12",
        question: "Como fazer benchmarking setorial?",
        answer: "O Daton não oferece base de mercado nem benchmarking setorial automático. Você pode exportar indicadores do próprio ambiente e compará-los externamente com fontes e critérios escolhidos pela organização.",
        tags: ["benchmarking", "comparação", "setor", "mercado"]
      },
      {
        id: "uc-13",
        question: "Como usar Daton para due diligence ESG?",
        answer: "Use documentos, requisitos, auditorias, fornecedores, indicadores e planos de ação para organizar as evidências disponíveis. O Daton não executa due diligence automaticamente, não lê documentos com IA e não produz scoring ou parecer de M&A.",
        tags: ["due diligence", "m&a", "risco", "avaliação"]
      },
      {
        id: "uc-14",
        question: "Como criar plano de ação ESG?",
        answer: "Crie um plano de ação, descreva o objetivo, defina responsáveis e prazos e detalhe as ações necessárias. Indicadores e iniciativas ESG podem apoiar o acompanhamento, mas custos, ROI e recomendações automáticas de IA não são calculados pelo Daton.",
        tags: ["plano de ação", "5w2h", "planejamento", "esg"]
      },
      {
        id: "uc-15",
        question: "Como vincular ESG a bônus de executivos?",
        answer: "O Daton não administra remuneração ou bônus. A organização pode acompanhar indicadores e metas operacionais no sistema e usar os dados exportados em seu processo externo de remuneração, com regras e validação próprias.",
        tags: ["remuneração", "bonus", "kpi", "governança"]
      },
      {
        id: "uc-16",
        question: "Como usar IA para identificar oportunidades de melhoria?",
        answer: "O Daton AI responde perguntas de consulta sobre dados autorizados da organização usando seis ferramentas de leitura. Ele não detecta anomalias, faz previsões, gera scoring, prioriza por ROI nem cria tarefas; confirme os dados e decida as ações no fluxo do módulo correspondente.",
        tags: ["ia", "oportunidades", "melhoria", "otimização"]
      },
      {
        id: "uc-17",
        question: "Como calcular pegada de carbono de produtos?",
        answer: "O Daton calcula inventários organizacionais de Escopos 1, 2 e 3 a partir de fontes, fatores e dados de atividade. Não possui módulo de avaliação de ciclo de vida ou pegada de produto.",
        tags: ["produto", "lca", "pegada", "carbono"]
      },
      {
        id: "uc-18",
        question: "Como monitorar fornecedores ESG?",
        answer: "Cadastre fornecedores, documentos e requisitos, acompanhe vencimentos, homologação e avaliações e registre planos quando necessário. O Portal do Fornecedor permite atender solicitações e enviar documentos; não há questionário ESG externo, integração com compras ou scoring ESG automático.",
        tags: ["fornecedores", "cadeia", "escopo3", "supply chain"]
      },
      {
        id: "uc-19",
        question: "Como preparar para rating ESG (S&P, MSCI)?",
        answer: "Cadastre como referencial os temas e perguntas do rating que sua organização está autorizada a usar, reúna respostas e evidências e acompanhe lacunas. O Daton não fornece templates oficiais, simulador de nota ou previsão do resultado.",
        tags: ["rating", "esg", "cdp", "msci"]
      },
      {
        id: "uc-20",
        question: "Como usar Daton em comitês ESG?",
        answer: "Use indicadores, iniciativas, evidências, SWOT, processos e registros de análise crítica para preparar a pauta e acompanhar decisões por meio de planos de ação. O Daton não gera apresentações ou atas automaticamente e não possui gestão específica de conselhos.",
        tags: ["comitê", "governança", "decisão", "executivo"]
      }
    ]
  },
  {
    id: "glossary",
    title: "Glossário ESG & Financeiro",
    icon: "BookMarked",
    description: "Termos técnicos explicados",
    questions: [
      {
        id: "glos-1",
        question: "O que é tCO2e (toneladas de CO2 equivalente)?",
        answer: "tCO2e é a unidade que expressa diferentes gases de efeito estufa em uma medida comum, aplicando o potencial de aquecimento global correspondente a cada gás e à referência metodológica adotada.",
        tags: ["métrica", "ghg", "unidade", "carbono"]
      },
      {
        id: "glos-2",
        question: "O que são Escopo 1, 2 e 3?",
        answer: "No GHG Protocol, o Escopo 1 reúne emissões diretas; o Escopo 2, emissões indiretas da energia adquirida; e o Escopo 3, outras emissões indiretas da cadeia de valor. A relevância de cada escopo depende das atividades da organização.",
        tags: ["escopo", "ghg protocol", "inventário", "classificação"]
      },
      {
        id: "glos-3",
        question: "O que é GHG Protocol?",
        answer: "GHG Protocol é o padrão internacional mais usado para quantificar e gerenciar emissões de gases de efeito estufa. Desenvolvido pelo WRI e WBCSD, estabelece metodologia para inventários corporativos e de produtos. É base para ISO 14064 e diversos programas de reporte como CDP.",
        tags: ["metodologia", "protocolo", "padrão", "inventário"]
      },
      {
        id: "glos-4",
        question: "O que é Materialidade em ESG?",
        answer: "Materialidade é o processo de identificar e priorizar temas ESG mais relevantes para o negócio e stakeholders. Considera impacto financeiro (materialidade financeira) e impacto no mundo (materialidade de impacto/dupla). Orienta estratégia ESG e disclosure. Base para relatórios GRI e SASB.",
        tags: ["materialidade", "esg", "estratégia", "stakeholder"]
      },
      {
        id: "glos-5",
        question: "O que é Stakeholder?",
        answer: "Stakeholder é qualquer parte interessada afetada ou que afeta as atividades da organização: funcionários, clientes, fornecedores, investidores, comunidade, governo, ONGs. Engajamento de stakeholders é pilar da gestão ESG e essencial para análise de materialidade.",
        tags: ["stakeholder", "partes interessadas", "engajamento", "esg"]
      },
      {
        id: "glos-6",
        question: "O que é Due Diligence ESG?",
        answer: "Due diligence ESG é processo de avaliação de riscos e oportunidades ambientais, sociais e de governança de uma empresa, comum em M&A, investimentos e concessão de crédito. Inclui análise de conformidade legal, passivos ambientais, questões trabalhistas, litígios, reputação e gestão ESG.",
        tags: ["due diligence", "risco", "m&a", "avaliação"]
      },
      {
        id: "glos-7",
        question: "O que é Rating ESG?",
        answer: "Rating ESG é avaliação quantitativa da performance ESG de uma empresa, realizada por agências especializadas (MSCI, S&P, Sustainalytics, ISS). Considera métricas, disclosure, controvérsias e gestão. Influencia decisões de investidores, custo de capital e reputação. Escala varia por agência (ex: AAA-CCC no MSCI).",
        tags: ["rating", "avaliação", "esg", "investidores"]
      },
      {
        id: "glos-8",
        question: "O que são TCFD, SASB e IIRC?",
        answer: "TCFD estruturou recomendações para divulgação de riscos climáticos; SASB desenvolveu padrões setoriais de sustentabilidade; e IIRC desenvolveu o relato integrado. Seus trabalhos foram incorporados ou sucedidos por estruturas atuais, por isso a organização deve consultar as versões vigentes.",
        tags: ["tcfd", "sasb", "iirc", "frameworks"]
      },
      {
        id: "glos-9",
        question: "O que é Carbon Pricing?",
        answer: "Precificação de carbono atribui valor monetário às emissões para apoiar políticas ou decisões. Pode usar tributo, mercado regulado ou preço interno; o Daton não calcula nem negocia esse valor.",
        tags: ["precificação", "carbono", "mercado", "economia"]
      },
      {
        id: "glos-10",
        question: "Qual a diferença entre Offset e Insetting?",
        answer: "Offset compensa emissões por meio de reduções ou remoções fora do limite direto da organização. Insetting promove reduções ou remoções dentro da cadeia de valor; ambos exigem critérios, rastreabilidade e verificação adequados.",
        tags: ["offset", "insetting", "compensação", "neutralização"]
      },
      {
        id: "glos-11",
        question: "O que é Economia Circular?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["circular", "resíduos", "sustentabilidade", "modelo"]
      },
      {
        id: "glos-12",
        question: "O que é LCA (Life Cycle Assessment)?",
        answer: "LCA (Avaliação de Ciclo de Vida) é metodologia para avaliar impactos ambientais de um produto/serviço ao longo de todo seu ciclo: extração de matéria-prima, produção, distribuição, uso e descarte (berço ao túmulo). Quantifica emissões, consumo de água, energia, geração de resíduos. Norma ISO 14040.",
        tags: ["lca", "ciclo de vida", "produto", "impacto"]
      },
      {
        id: "glos-13",
        question: "O que é Science Based Targets (SBTi)?",
        answer: "Science Based Targets são metas corporativas de redução de emissões alinhadas à ciência climática e avaliadas segundo os critérios da iniciativa SBTi. O Daton pode guardar indicadores e ações de acompanhamento, mas não valida metas perante a SBTi.",
        tags: ["sbti", "meta", "clima", "ciência"]
      },
      {
        id: "glos-14",
        question: "Diferença entre Net Zero e Carbon Neutral?",
        answer: "Neutralidade de carbono costuma equilibrar emissões de um limite definido com reduções e compensações. Net zero exige redução profunda das emissões em toda a cadeia e neutralização das emissões residuais conforme o padrão adotado.",
        tags: ["net zero", "carbon neutral", "neutralização", "meta"]
      },
      {
        id: "glos-15",
        question: "O que é DRE (Demonstração do Resultado do Exercício)?",
        answer: "DRE é demonstrativo contábil que apresenta receitas, custos e despesas de um período, resultando no lucro ou prejuízo. Estrutura: Receita Bruta → Deduções → Receita Líquida → CMV → Lucro Bruto → Despesas Operacionais → EBITDA → Juros e Impostos → Lucro Líquido. Obrigatória anualmente.",
        tags: ["dre", "contabilidade", "financeiro", "lucro"]
      },
      {
        id: "glos-16",
        question: "O que é EBITDA?",
        answer: "EBITDA representa o resultado antes de juros, impostos, depreciação e amortização. É um indicador financeiro calculado fora do Daton a partir de dados contábeis revisados.",
        tags: ["ebitda", "financeiro", "indicador", "performance"]
      },
      {
        id: "glos-17",
        question: "O que é ROI (Retorno sobre Investimento)?",
        answer: "ROI compara o ganho líquido ao custo do investimento. O resultado depende do período e das premissas adotadas; o Daton não calcula ROI automaticamente.",
        tags: ["roi", "retorno", "investimento", "financeiro"]
      },
      {
        id: "glos-18",
        question: "O que é Payback?",
        answer: "Payback é o tempo estimado para recuperar um investimento com os fluxos gerados. O Daton não calcula payback simples ou descontado.",
        tags: ["payback", "investimento", "análise", "retorno"]
      },
      {
        id: "glos-19",
        question: "Diferença entre CAPEX e OPEX?",
        answer: "CAPEX são gastos capitalizados em ativos de longo prazo; OPEX são despesas operacionais do período. A classificação contábil deve ser feita no sistema financeiro, conforme as políticas da organização.",
        tags: ["capex", "opex", "investimento", "despesa"]
      },
      {
        id: "glos-20",
        question: "O que é Fluxo de Caixa?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["fluxo de caixa", "liquidez", "financeiro", "gestão"]
      },
      {
        id: "glos-21",
        question: "O que é Conciliação Bancária?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["conciliação", "banco", "contabilidade", "auditoria"]
      },
      {
        id: "glos-22",
        question: "O que é Plano de Contas?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["plano de contas", "contabilidade", "classificação", "estrutura"]
      },
      {
        id: "glos-23",
        question: "O que é Centro de Custos?",
        answer: "Centro de custos é uma unidade de classificação usada para acumular e analisar gastos por área, atividade ou projeto. O Daton não administra centros de custos.",
        tags: ["centro de custos", "controle", "gestão", "custos"]
      },
      {
        id: "glos-24",
        question: "O que é Lançamento Contábil?",
        answer: "Lançamento contábil registra um fato econômico nas contas correspondentes, segundo as regras contábeis adotadas. O Daton não mantém escrituração contábil.",
        tags: ["lançamento", "contabilidade", "débito", "crédito"]
      },
      {
        id: "glos-25",
        question: "Diferença entre Regime de Competência e Regime de Caixa?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["competência", "caixa", "contabilidade", "regime"]
      }
    ]
  },
  {
    id: "videos",
    title: "Vídeos e Tutoriais",
    icon: "Video",
    description: "Estado atual dos materiais de orientação",
    questions: [
      {
        id: "vid-1",
        question: "Há um vídeo de apresentação da plataforma?",
        answer: "Este vídeo ainda não está disponível. Para conhecer a plataforma atual, use a Central de Ajuda em /app/ajuda e navegue pelos módulos liberados para sua empresa.",
        tags: ["vídeo", "tour", "introdução", "overview"]
      },
      {
        id: "vid-2",
        question: "Há tutorial para o primeiro inventário GEE?",
        answer: "Este vídeo ainda não está disponível. No módulo Clima habilitado, cadastre fontes dos Escopos 1, 2 e 3, fatores versionados e dados de atividade para obter os cálculos e totais.",
        tags: ["vídeo", "inventário", "ghg", "tutorial"]
      },
      {
        id: "vid-3",
        question: "Há tutorial de configuração inicial?",
        answer: "Este vídeo ainda não está disponível. A ativação começa com o voucher gratuito emitido pela Daton; depois, o administrador configura a organização, filiais, pessoas e permissões.",
        tags: ["vídeo", "configuração", "setup", "admin"]
      },
      {
        id: "vid-4",
        question: "Há tutorial de módulo financeiro?",
        answer: "O Daton não possui módulo financeiro. Este tutorial não faz parte da plataforma atual.",
        tags: ["vídeo", "financeiro", "contabilidade", "tutorial"]
      },
      {
        id: "vid-5",
        question: "Há tutorial do Assistente IA?",
        answer: "Este vídeo ainda não está disponível. O Daton AI aceita perguntas em texto e consulta somente dados autorizados; não recebe arquivos, não faz previsões e não altera registros.",
        tags: ["vídeo", "ia", "assistente", "tutorial"]
      },
      {
        id: "vid-6",
        question: "Há tutorial de relatórios GRI?",
        answer: "O Daton não oferece um gerador GRI pronto. Referenciais ESG podem ser cadastrados livremente para organizar temas, respostas e evidências; o relato permanece em rascunho para edição e validação externas.",
        tags: ["vídeo", "gri", "relatório", "sustentabilidade"]
      },
      {
        id: "vid-7",
        question: "Há tutorial de integrações e API?",
        answer: "O Daton não disponibiliza API pública, webhooks nem conectores prontos com ERP ou automação. A importação assistida por planilha existe apenas para destinos e empresas habilitados.",
        tags: ["vídeo", "api", "integração", "técnico"]
      },
      {
        id: "vid-8",
        question: "Há tutorial de análise preditiva?",
        answer: "O Daton não possui análise preditiva, previsão de emissões, detecção de anomalias ou scoring de risco. Este tutorial não faz parte da plataforma atual.",
        tags: ["vídeo", "preditivo", "análise", "ia"]
      },
      {
        id: "vid-9",
        question: "Há tutorial de personalização do Início?",
        answer: "O Início pode permitir que cada pessoa organize widgets, quando o recurso estiver habilitado para a empresa. Não há editor livre de gráficos nem dashboard financeiro.",
        tags: ["vídeo", "dashboard", "customização", "kpi"]
      },
      {
        id: "vid-10",
        question: "Há tutorial de tarefas e aprovações?",
        answer: "O Daton acompanha planos de ação, ações e responsáveis nos fluxos dos módulos. Não possui um construtor genérico de aprovação ou automações configuráveis entre etapas.",
        tags: ["vídeo", "tarefas", "workflow", "aprovação"]
      },
      {
        id: "vid-11",
        question: "Como acessar material de treinamento?",
        answer: "Consulte a Central de Ajuda em /app/ajuda. Para dúvidas ou orientação, use o widget Feedback no menu inferior do painel ou escreva para contato@daton.com.br; não há certificação, chat ou central telefônica contratada.",
        tags: ["treinamento", "contato", "suporte", "workshop"]
      }
    ]
  },
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    icon: "Rocket",
    description: "Comece sua jornada na plataforma",
    questions: [
      {
        id: "criar-conta",
        question: "Como criar minha conta?",
        answer: "O acesso de uma nova empresa começa com um voucher gratuito emitido pela Daton. Depois da ativação, administradores podem convidar pessoas por e-mail; não há cadastro livre, período de teste ou escolha de plano na landing page.",
        tags: ["conta", "cadastro", "registro", "email"],
        relatedQuestions: ["configurar-empresa", "convidar-usuarios"]
      },
      {
        id: "configurar-empresa",
        question: "Como configurar minha empresa na plataforma?",
        answer: "Após ativar o voucher, complete os dados da organização, cadastre filiais e estrutura organizacional e configure usuários e permissões. Os módulos visíveis dependem da habilitação da empresa e do acesso concedido.",
        tags: ["empresa", "configuração", "perfil", "cnpj"],
        relatedQuestions: ["criar-conta", "permissoes"]
      },
      {
        id: "primeiros-passos-login",
        question: "Quais são os primeiros passos após o login?",
        answer: "Confira os dados da organização, cadastre filiais e pessoas, defina permissões e comece pelos módulos liberados para a empresa. A Central de Ajuda fica em /app/ajuda.",
        tags: ["tutorial", "onboarding", "guia", "início"],
        relatedQuestions: ["configurar-empresa", "tutoriais"]
      },
      {
        id: "permissoes",
        question: "Como funciona o sistema de permissões?",
        answer: "O acesso combina organização, papel, módulo e, quando aplicável, filial. Os papéis são administrador da plataforma, administrador da organização, operador e analista; o analista tem acesso somente para leitura.",
        tags: ["permissões", "acesso", "usuários", "roles"],
        relatedQuestions: ["convidar-usuarios", "gestao-usuarios"]
      },
      {
        id: "convidar-usuarios",
        question: "Como convidar outros usuários?",
        answer: "Um administrador da organização informa o e-mail e os acessos da pessoa. O convite é enviado por e-mail com um link para concluir a entrada no ambiente.",
        tags: ["usuários", "convite", "equipe", "time"],
        relatedQuestions: ["permissoes", "gestao-usuarios"]
      },
      {
        id: "tutoriais",
        question: "Onde encontro os tutoriais interativos?",
        answer: "A ajuda atual fica em /app/ajuda. O Daton não oferece tour interativo em cada tela; dúvidas, problemas e ideias podem ser enviados pelo widget Feedback no menu inferior.",
        tags: ["tutorial", "ajuda", "guia", "vídeos"],
        relatedQuestions: ["primeiros-passos-login", "suporte"]
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard e Visualizações",
    icon: "BarChart3",
    description: "Entenda painéis, indicadores e limites de exportação",
    questions: [
      {
        id: "interpretar-graficos",
        question: "Como interpretar os gráficos do dashboard?",
        answer: "Leia o título, período, unidade e filtros exibidos em cada painel. Os gráficos refletem os registros acessíveis à pessoa; para conferir um valor, consulte a lista ou exportação do módulo de origem.",
        tags: ["dashboard", "gráficos", "métricas", "visualização"],
        relatedQuestions: ["exportar-dashboard", "metricas-automaticas"]
      },
      {
        id: "personalizar-widgets",
        question: "Como personalizar widgets?",
        answer: "Quando o Início personalizável estiver habilitado para a empresa, cada pessoa pode escolher e organizar os widgets disponíveis para o seu acesso. A lista de widgets depende dos módulos liberados.",
        tags: ["dashboard", "widgets", "personalização", "customização"],
        relatedQuestions: ["interpretar-graficos", "dashboards-customizados"]
      },
      {
        id: "exportar-dashboard",
        question: "Como exportar dados do dashboard?",
        answer: "Não há exportação geral do dashboard em PDF, imagem ou planilha. Use as exportações oferecidas pelo módulo de origem, como CSV em recursos habilitados.",
        tags: ["exportar", "pdf", "excel", "dados"],
        relatedQuestions: ["interpretar-graficos", "relatorios"]
      },
      {
        id: "metricas-automaticas",
        question: "Quais métricas são calculadas automaticamente?",
        answer: "Cada módulo calcula apenas as métricas previstas pelo seu fluxo, como totais de emissões a partir de fontes e fatores. O Daton não produz um score ESG geral nem indicadores financeiros automáticos.",
        tags: ["métricas", "cálculos", "kpi", "automatização"],
        relatedQuestions: ["interpretar-graficos", "metodologias"]
      },
      {
        id: "dashboards-customizados",
        question: "Como criar dashboards customizados?",
        answer: "O Daton não possui um construtor livre de dashboards. Quando habilitado, o Início permite organizar widgets previamente disponíveis para a pessoa.",
        tags: ["dashboard", "customização", "widgets", "personalização"],
        relatedQuestions: ["personalizar-widgets", "exportar-dashboard"]
      },
      {
        id: "dashboard-financeiro",
        question: "O que é o Dashboard Financeiro?",
        answer: "O Daton não possui dashboard nem módulo financeiro.",
        tags: ["dashboard", "financeiro", "esg", "integração", "roi"],
        relatedQuestions: ["dashboard-esg-financeiro", "metricas-financeiras"]
      },
      {
        id: "dashboard-esg-financeiro",
        question: "Como usar o Dashboard ESG Financeiro?",
        answer: "O Daton não possui dashboard ESG financeiro nem relaciona automaticamente custos, retorno e desempenho ESG.",
        tags: ["esg", "financeiro", "dashboard", "análise", "impacto"],
        relatedQuestions: ["dashboard-financeiro", "integracao-financeiro-esg"]
      },
      {
        id: "customizar-kpis",
        question: "Como customizar KPIs no dashboard?",
        answer: "Cadastre e acompanhe indicadores no módulo apropriado. O dashboard não aceita fórmulas livres, cores ou faixas configuradas pela pessoa.",
        tags: ["kpi", "customização", "métricas", "indicadores", "fórmulas"],
        relatedQuestions: ["metricas-automaticas", "dashboards-customizados"]
      },
      {
        id: "compartilhar-dashboards",
        question: "Como compartilhar dashboards com stakeholders?",
        answer: "O Daton não cria links públicos, iframes ou envios agendados de dashboards. Compartilhe apenas exportações autorizadas dos módulos, respeitando a política da organização.",
        tags: ["compartilhamento", "dashboard", "exportar", "stakeholders", "link"],
        relatedQuestions: ["exportar-dashboard", "dashboards-customizados"]
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
        answer: "O módulo Clima organiza fontes dos Escopos 1, 2 e 3, fatores de emissão versionados, dados de atividade e cálculos de CO2e. A organização deve conferir a fonte e a versão metodológica de cada fator usado.",
        tags: ["metodologia", "ghg protocol", "iso 14064", "ipcc"],
        relatedQuestions: ["fatores-emissao", "escopos"]
      },
      {
        id: "adicionar-fontes",
        question: "Como adicionar fontes de emissão?",
        answer: "No módulo Clima habilitado, cadastre a fonte, classifique-a no escopo e na categoria aplicável, selecione ou registre o fator versionado e informe os dados de atividade.",
        tags: ["fontes", "emissões", "cadastro", "escopo"],
        relatedQuestions: ["escopos", "importar-dados"]
      },
      {
        id: "escopos",
        question: "Quais escopos são calculados?",
        answer: "O módulo contempla fontes dos Escopos 1, 2 e 3. Os totais dependem das fontes, fatores e dados efetivamente cadastrados; a cobertura não é preenchida automaticamente.",
        tags: ["escopo", "escopo 1", "escopo 2", "escopo 3"],
        relatedQuestions: ["metodologias", "adicionar-fontes"]
      },
      {
        id: "importar-dados",
        question: "Como importar dados de consumo?",
        answer: "Use a importação assistida por planilha somente quando o destino correspondente estiver habilitado para sua empresa. Não há extração automática de PDF, conta de energia ou nota fiscal por IA.",
        tags: ["importação", "planilha", "upload", "dados"],
        relatedQuestions: ["adicionar-fontes", "extracao-ia"]
      },
      {
        id: "emissoes-transporte",
        question: "Como calcular emissões de transporte?",
        answer: "Cadastre uma fonte de emissão de transporte com o escopo, a categoria, o fator e o dado de atividade adequados. A classificação entre frota própria e cadeia de valor deve seguir a metodologia adotada pela organização.",
        tags: ["transporte", "veículos", "frota", "logística"],
        relatedQuestions: ["escopos", "adicionar-fontes"]
      },
      {
        id: "fatores-emissao",
        question: "O que são fatores de emissão?",
        answer: "Fatores de emissão convertem um dado de atividade em emissões estimadas. No Daton, registre a fonte, unidade, vigência e versão do fator para preservar a rastreabilidade do cálculo.",
        tags: ["fatores", "cálculo", "coeficientes", "emissões"],
        relatedQuestions: ["metodologias", "adicionar-fontes"]
      },
      {
        id: "projetos-carbono",
        question: "Como registrar projetos de carbono?",
        answer: "O Daton não gerencia créditos, compensações ou projetos de carbono. Iniciativas de redução podem ser acompanhadas como iniciativas, indicadores e planos de ação, sem contabilização de créditos.",
        tags: ["projetos", "compensação", "créditos", "redução"],
        relatedQuestions: ["metas", "relatorios-inventario"]
      },
      {
        id: "relatorios-inventario",
        question: "Como gerar relatórios de inventário?",
        answer: "O módulo apresenta totais calculados por escopo e permite exportar dados em CSV quando habilitado. A elaboração e validação do relatório formal do inventário são externas ao Daton.",
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
        answer: "No módulo Resíduos habilitado, cadastre o tipo de resíduo e sua classificação, unidade e demais campos solicitados pela empresa.",
        tags: ["resíduos", "cadastro", "tipos", "classificação"],
        relatedQuestions: ["destinacao-residuos", "pgrs"]
      },
      {
        id: "destinacao-residuos",
        question: "Como registrar destinação de resíduos?",
        answer: "Registre o lançamento, a quantidade, a destinação e o responsável aplicável e anexe MTR e CDF quando disponíveis. A cobrança em pendências depende da ativação e reconciliação do domínio para a empresa.",
        tags: ["destinação", "reciclagem", "mtr", "fornecedor"],
        relatedQuestions: ["cadastrar-residuos", "fornecedores-residuos"]
      },
      {
        id: "pgrs",
        question: "O que é PGRS e como criar um?",
        answer: "PGRS é o plano de gerenciamento de resíduos sólidos aplicável à organização conforme seus requisitos legais. O Daton organiza registros, documentos e ações, mas não gera automaticamente um PGRS.",
        tags: ["pgrs", "plano", "pnrs", "regulatório"],
        relatedQuestions: ["cadastrar-residuos", "destinacao-residuos"]
      },
      {
        id: "fornecedores-residuos",
        question: "Como gerenciar fornecedores de resíduos?",
        answer: "Cadastre o fornecedor e seus documentos no módulo de Fornecedores e relacione as informações necessárias aos registros de resíduos. Não há portal ou integração automática com transportadores e destinadores.",
        tags: ["fornecedores", "transportadores", "licenças", "gestão"],
        relatedQuestions: ["destinacao-residuos", "licenciamento"]
      },
      {
        id: "relatorios-residuos",
        question: "Quais relatórios de resíduos estão disponíveis?",
        answer: "Consulte os lançamentos, quantidades, destinos e documentos registrados e use a exportação disponível no módulo. PGRS e indicadores regulatórios prontos não são gerados automaticamente.",
        tags: ["relatórios", "indicadores", "análise", "exportar"],
        relatedQuestions: ["destinacao-residuos", "pgrs"]
      }
    ]
  },
  {
    id: "licenciamento",
    title: "Licenciamento",
    icon: "FileCheck",
    description: "Controle de licenças e autorizações",
    questions: [
      {
        id: "cadastrar-licencas",
        question: "Como cadastrar licenças ambientais?",
        answer: "Cadastre a licença ou documento regulatório com órgão, número, datas, filial e anexos. Quando habilitado, registre também condicionantes, obrigações recorrentes e requisitos relacionados.",
        tags: ["licenças", "cadastro", "lo", "li", "lp"],
        relatedQuestions: ["tipos-licenca", "alertas-vencimento"]
      },
      {
        id: "acompanhar-prazos",
        question: "Como acompanhar prazos de renovação?",
        answer: "Use as datas e o status do cadastro e acompanhe as pendências geradas pelos recursos regulatórios habilitados. Os avisos dependem da configuração de cobranças da organização.",
        tags: ["prazos", "renovação", "vencimento", "calendário"],
        relatedQuestions: ["cadastrar-licencas", "alertas-vencimento"]
      },
      {
        id: "tipos-licenca",
        question: "Quais tipos de licença são suportados?",
        answer: "O cadastro aceita os tipos definidos pela organização, sem limitar o uso a uma lista fixa de siglas. Registre a classificação e os dados conforme o documento e o requisito aplicável.",
        tags: ["tipos", "licenças", "lo", "li", "lp", "aaf"],
        relatedQuestions: ["cadastrar-licencas", "acompanhar-prazos"]
      },
      {
        id: "anexar-documentos-licencas",
        question: "Como anexar documentos às licenças?",
        answer: "Use a área de anexos do registro para incluir as evidências permitidas. Limites e formatos dependem da configuração de armazenamento; não há promessa de arquivos ilimitados.",
        tags: ["documentos", "anexos", "upload", "arquivos"],
        relatedQuestions: ["cadastrar-licencas", "upload-documentos"]
      },
      {
        id: "alertas-vencimento",
        question: "Como receber alertas de vencimento?",
        answer: "Vencimentos podem aparecer em Suas Pendências e nas cobranças configuradas quando o recurso regulatório estiver habilitado e reconciliado para a empresa. Não há uma sequência universal de 90, 60, 30, 15 e 7 dias.",
        tags: ["alertas", "notificações", "vencimento", "e-mail"],
        relatedQuestions: ["acompanhar-prazos", "cadastrar-licencas"]
      }
    ]
  },
  {
    id: "metas",
    title: "Metas de Sustentabilidade",
    icon: "Target",
    description: "Acompanhe objetivos com indicadores, iniciativas e planos",
    questions: [
      {
        id: "criar-metas",
        question: "Como criar metas ESG?",
        answer: "O Daton não possui um cadastro genérico de metas ESG. Use indicadores, iniciativas e planos de ação para registrar objetivos, responsáveis, prazos e acompanhamento nos módulos disponíveis.",
        tags: ["metas", "objetivos", "esg", "kpi"],
        relatedQuestions: ["acompanhar-progresso", "tipos-metas"]
      },
      {
        id: "acompanhar-progresso",
        question: "Como acompanhar progresso de metas?",
        answer: "Acompanhe valores de indicadores, iniciativas e ações relacionadas. O Daton não calcula um percentual universal de progresso ou previsão automática de conclusão.",
        tags: ["progresso", "acompanhamento", "status", "monitoramento"],
        relatedQuestions: ["criar-metas", "relatorios-metas"]
      },
      {
        id: "tipos-metas",
        question: "Quais tipos de metas posso definir?",
        answer: "Não há um módulo único de metas. A organização pode representar seus objetivos com indicadores, iniciativas e planos de ação ambientais, sociais, de governança ou qualidade.",
        tags: ["tipos", "categorias", "ambiental", "social", "governança"],
        relatedQuestions: ["criar-metas", "vincular-indicadores"]
      },
      {
        id: "vincular-indicadores",
        question: "Como vincular metas a indicadores?",
        answer: "Não existe vínculo genérico de meta com indicador. Registre o objetivo na iniciativa ou plano correspondente e acompanhe o indicador relacionado conforme o processo definido pela organização.",
        tags: ["indicadores", "kpi", "métricas", "vinculação"],
        relatedQuestions: ["criar-metas", "acompanhar-progresso"]
      },
      {
        id: "relatorios-metas",
        question: "Como gerar relatórios de metas?",
        answer: "O Daton não gera relatório específico de metas. Consulte indicadores, iniciativas e planos e exporte os dados oferecidos pelos módulos para compor uma análise externa.",
        tags: ["relatórios", "análise", "exportar", "consolidado"],
        relatedQuestions: ["acompanhar-progresso", "criar-metas"]
      },
      {
        id: "metas-financeiras-esg",
        question: "Como criar metas financeiras ESG?",
        answer: "O Daton não possui módulo financeiro nem cadastro específico de metas financeiras ESG.",
        tags: ["metas", "financeiro", "esg", "roi", "investimento"],
        relatedQuestions: ["criar-metas", "roi-projetos-esg"]
      },
      {
        id: "analise-preditiva-metas",
        question: "Como a análise preditiva ajuda no atingimento de metas?",
        answer: "O Daton não faz análise preditiva, simulação de cenários ou cálculo de probabilidade de atingir metas.",
        tags: ["preditivo", "ia", "análise", "previsão", "probabilidade"],
        relatedQuestions: ["acompanhar-progresso", "analise-preditiva"]
      },
      {
        id: "roi-metas",
        question: "Como calcular ROI de metas ESG?",
        answer: "O Daton não calcula ROI, payback, TIR ou VPL. Use os registros operacionais exportados como insumo para uma análise financeira externa.",
        tags: ["roi", "retorno", "investimento", "análise", "financeiro"],
        relatedQuestions: ["metas-financeiras-esg", "roi-projetos-esg"]
      },
      {
        id: "metas-smart",
        question: "Como criar metas SMART?",
        answer: "O Daton não valida automaticamente os critérios SMART. Você pode descrever um objetivo específico, indicador mensurável, responsável e prazo em uma iniciativa ou plano de ação.",
        tags: ["smart", "metas", "metodologia", "planejamento", "objetivos"],
        relatedQuestions: ["criar-metas", "tipos-metas"]
      }
    ]
  },
  {
    id: "stakeholders",
    title: "Gestão de Stakeholders",
    icon: "Users",
    description: "Cadastro e organização de partes interessadas",
    questions: [
      {
        id: "cadastrar-stakeholders",
        question: "Como cadastrar partes interessadas?",
        answer: "Quando o cadastro de terceiros e partes interessadas estiver habilitado, registre a pessoa ou organização uma vez e use o vínculo nos módulos disponíveis.",
        tags: ["stakeholders", "partes interessadas", "cadastro", "grupos"],
        relatedQuestions: ["analise-materialidade", "engajamento"]
      },
      {
        id: "analise-materialidade",
        question: "Como realizar análise de materialidade?",
        answer: "Cadastre um referencial ESG e organize seus temas, perguntas, respostas e evidências. O Daton não envia pesquisa nem gera matriz de materialidade automaticamente.",
        tags: ["materialidade", "análise", "temas", "pesquisa"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "engajamento",
        question: "Como gerenciar engajamento de stakeholders?",
        answer: "Registre partes interessadas e use campanhas de comunicação, quando habilitadas, para definir público e acompanhar confirmação de leitura. O Daton não mede sentimento nem oferece pesquisa pública de engajamento.",
        tags: ["engajamento", "comunicação", "relacionamento", "plano"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "pesquisas",
        question: "Como enviar pesquisas de materialidade?",
        answer: "O Daton não envia pesquisas públicas de materialidade. Cadastre o referencial, seus temas e respostas e reúna as evidências obtidas pelo processo conduzido pela organização.",
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
        answer: "Cadastre o processo, defina responsável, entradas, saídas, interações, indicadores e documentos relacionados. Use a análise crítica e os planos de ação para acompanhar mudanças e melhorias.",
        tags: ["processos", "mapeamento", "bpmn", "fluxograma"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      },
      {
        id: "nao-conformidades",
        question: "Como registrar não conformidades?",
        answer: "Registre a não conformidade, descreva causa e contenção, associe um plano de ação e acompanhe a verificação de eficácia. Os acessos dependem do papel e do módulo concedido.",
        tags: ["não conformidade", "nc", "qualidade", "causa raiz"],
        relatedQuestions: ["planos-acao", "auditorias"]
      },
      {
        id: "planos-acao",
        question: "Como criar planos de ação (5W2H)?",
        answer: "Crie o plano no contexto do registro aplicável, defina responsável e prazo e detalhe as ações. Acompanhe status, evidências e eficácia quando o fluxo oferecer esses campos; custos e ROI não são calculados.",
        tags: ["plano de ação", "5w2h", "ações", "correção"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      },
      {
        id: "auditorias",
        question: "Como gerenciar auditorias?",
        answer: "Planeje auditorias e checklists, registre constatações e acompanhe os desdobramentos. Recursos de programa de auditoria e abertura de não conformidade dependem da habilitação para a empresa.",
        tags: ["auditoria", "iso 9001", "checklist", "conformidade"],
        relatedQuestions: ["nao-conformidades", "planos-acao"]
      },
      {
        id: "controle-documentos-sgq",
        question: "Como controlar documentos do SGQ?",
        answer: "Use o módulo Documentos para cadastrar e controlar documentos, versões, aprovações e acessos conforme o fluxo disponível. Anexos também podem existir em registros específicos; não há OCR ou leitura automática por IA.",
        tags: ["documentos", "procedimentos", "controle", "versão"],
        relatedQuestions: ["mapear-processos", "auditorias"]
      },
      {
        id: "avaliar-fornecedores",
        question: "Como avaliar fornecedores?",
        answer: "Cadastre fornecedores, documentos e requisitos, acompanhe homologação e avaliações e use planos de ação quando necessário. O Daton não oferece integração automática com compras nem scoring por IA.",
        tags: ["fornecedores", "avaliação", "qualificação", "homologação"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      }
    ]
  },
  {
    id: "social",
    title: "Social (Pessoas)",
    icon: "Heart",
    description: "Cadastros, competências e treinamentos",
    questions: [
      {
        id: "gerenciar-funcionarios",
        question: "Como gerenciar funcionários?",
        answer: "Cadastre colaboradores, vínculo com conta, cargo, filial e demais dados organizacionais. O módulo também apoia competências, lacunas e treinamentos, sem substituir sistemas de folha, ponto ou recrutamento.",
        tags: ["colaboradores", "funcionários", "rh", "gestão"],
        relatedQuestions: ["treinamentos", "seguranca-trabalho"]
      },
      {
        id: "treinamentos",
        question: "Como registrar treinamentos?",
        answer: "Cadastre treinamentos, turmas, participantes e conclusão. Quando habilitado, o histórico conserva o cargo e o instrutor do evento, permite avaliar eficácia e emitir certificado associado à conclusão.",
        tags: ["treinamentos", "capacitação", "desenvolvimento", "certificados"],
        relatedQuestions: ["gerenciar-funcionarios", "pdi"]
      },
      {
        id: "seguranca-trabalho",
        question: "Como acompanhar segurança do trabalho?",
        answer: "O Daton não possui gestão de SST, saúde ocupacional, ponto, folha, carreira ou PDI. O módulo Pessoas cobre cadastros, cargos, competências, lacunas e treinamentos.",
        tags: ["segurança", "sst", "acidentes", "epi"],
        relatedQuestions: ["gerenciar-funcionarios", "treinamentos"]
      },
      {
        id: "ponto-frequencia",
        question: "Como gerenciar ponto e frequência?",
        answer: "O Daton não possui gestão de SST, saúde ocupacional, ponto, folha, carreira ou PDI. O módulo Pessoas cobre cadastros, cargos, competências, lacunas e treinamentos.",
        tags: ["ponto", "frequência", "absenteísmo", "horas extras"],
        relatedQuestions: ["gerenciar-funcionarios", "integracoes"]
      },
      {
        id: "pdi",
        question: "Como criar PDIs (Planos de Desenvolvimento)?",
        answer: "O Daton não possui gestão de SST, saúde ocupacional, ponto, folha, carreira ou PDI. O módulo Pessoas cobre cadastros, cargos, competências, lacunas e treinamentos.",
        tags: ["pdi", "desenvolvimento", "carreira", "competências"],
        relatedQuestions: ["treinamentos", "gerenciar-funcionarios"]
      }
    ]
  },
  {
    id: "governanca",
    title: "Governança",
    icon: "Shield",
    description: "Riscos, requisitos, documentos e controles",
    questions: [
      {
        id: "gerenciar-riscos",
        question: "Como gerenciar riscos corporativos?",
        answer: "Use a matriz de riscos e oportunidades da organização para registrar contexto, probabilidade, impacto, controles, responsáveis e ações. A avaliação depende dos critérios definidos pela empresa; não há scoring por IA.",
        tags: ["riscos", "matriz", "criticidade", "controles"],
        relatedQuestions: ["compliance", "matriz-riscos"]
      },
      {
        id: "compliance",
        question: "Como garantir compliance?",
        answer: "Cadastre legislações, requisitos, aplicabilidade, licenças, condicionantes e obrigações conforme os recursos habilitados, atribua responsáveis e acompanhe evidências e pendências. O sistema apoia o controle, mas não garante conformidade jurídica.",
        tags: ["compliance", "regulatório", "leis", "normas"],
        relatedQuestions: ["gerenciar-riscos", "politicas"]
      },
      {
        id: "politicas",
        question: "Como gerenciar políticas internas?",
        answer: "Cadastre e controle políticas no módulo Documentos, com versões, aprovações e acessos. Campanhas de comunicação podem registrar confirmação de leitura quando habilitadas; não há assinatura digital nativa.",
        tags: ["políticas", "código de conduta", "governança", "distribuição"],
        relatedQuestions: ["compliance", "controle-documentos-sgq"]
      },
      {
        id: "matriz-riscos",
        question: "Como configurar matriz de riscos?",
        answer: "Use a matriz de riscos e oportunidades da organização para registrar contexto, probabilidade, impacto, controles, responsáveis e ações. A avaliação depende dos critérios definidos pela empresa; não há scoring por IA.",
        tags: ["matriz", "riscos", "configuração", "iso 31000"],
        relatedQuestions: ["gerenciar-riscos", "compliance"]
      }
    ]
  },
  {
    id: "documentos",
    title: "Documentos e Dados",
    icon: "FileText",
    description: "Documentos, anexos e importação estruturada",
    questions: [
      {
        id: "upload-documentos",
        question: "Como fazer upload de documentos?",
        answer: "Use o módulo Documentos para cadastrar e controlar documentos, versões, aprovações e acessos conforme o fluxo disponível. Anexos também podem existir em registros específicos; não há OCR ou leitura automática por IA.",
        tags: ["upload", "documentos", "arquivos", "importação"],
        relatedQuestions: ["extracao-ia", "formatos-aceitos"]
      },
      {
        id: "extracao-ia",
        question: "Como funciona a extração IA de dados?",
        answer: "O Daton não extrai dados de documentos com IA ou OCR. Anexe o arquivo como evidência e registre ou importe os dados estruturados no módulo aplicável, quando a importação estiver habilitada.",
        tags: ["ia", "extração", "ocr", "automação"],
        relatedQuestions: ["upload-documentos", "revisar-extracoes"]
      },
      {
        id: "revisar-extracoes",
        question: "Como revisar extrações automáticas?",
        answer: "O Daton não realiza extração automática de documentos. Revise os dados digitados ou a prévia da importação por planilha antes de confirmar o lote.",
        tags: ["revisão", "validação", "extração", "conferência"],
        relatedQuestions: ["extracao-ia", "upload-documentos"]
      },
      {
        id: "importar-planilhas",
        question: "Como importar dados via planilha?",
        answer: "A importação assistida por planilha está disponível somente para empresas e destinos habilitados. Baixe o modelo do destino, preencha os campos, envie para a prévia, corrija os rejeitos e confirme o lote; alguns destinos exigem módulos adicionais ativos.",
        tags: ["importação", "planilha", "excel", "templates"],
        relatedQuestions: ["upload-documentos", "formatos-aceitos"]
      },
      {
        id: "formatos-aceitos",
        question: "Quais formatos de arquivo são aceitos?",
        answer: "Os formatos aceitos variam conforme o tipo de anexo e o módulo. Consulte o seletor do registro antes do envio; não há um limite universal de 50 MB nem suporte garantido a todos os formatos de escritório e imagem.",
        tags: ["formatos", "arquivos", "tipos", "extensões"],
        relatedQuestions: ["upload-documentos", "importar-planilhas"]
      },
      {
        id: "organizar-documentos",
        question: "Como organizar documentos em pastas?",
        answer: "Use o módulo Documentos para cadastrar e controlar documentos, versões, aprovações e acessos conforme o fluxo disponível. Anexos também podem existir em registros específicos; não há OCR ou leitura automática por IA.",
        tags: ["pastas", "organização", "estrutura", "categorias"],
        relatedQuestions: ["upload-documentos", "buscar-documentos"]
      },
      {
        id: "upload-documentos-financeiros",
        question: "Como fazer upload de documentos financeiros?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["financeiro", "documentos", "notas fiscais", "upload", "ia"],
        relatedQuestions: ["extracao-ia-notas-fiscais", "upload-documentos"]
      },
      {
        id: "extracao-ia-notas-fiscais",
        question: "Como funciona a extração IA de notas fiscais?",
        answer: "O Daton não extrai dados de documentos com IA ou OCR. Anexe o arquivo como evidência e registre ou importe os dados estruturados no módulo aplicável, quando a importação estiver habilitada.",
        tags: ["ia", "notas fiscais", "extração", "nfe", "automação"],
        relatedQuestions: ["upload-documentos-financeiros", "extracao-ia"]
      },
      {
        id: "ocr-documentos",
        question: "Como funciona o OCR de documentos?",
        answer: "O Daton não extrai dados de documentos com IA ou OCR. Anexe o arquivo como evidência e registre ou importe os dados estruturados no módulo aplicável, quando a importação estiver habilitada.",
        tags: ["ocr", "reconhecimento", "digitalização", "scanner", "ia"],
        relatedQuestions: ["extracao-ia", "upload-documentos"]
      },
      {
        id: "validacao-automatica-dados",
        question: "Como funciona a validação automática de dados?",
        answer: "Formulários e rotas validam os campos e regras previstos no fluxo. A importação por planilha exibe prévia e rejeitos antes da confirmação; o Daton não detecta anomalias históricas nem valida o conteúdo de documentos com IA.",
        tags: ["validação", "dados", "qualidade", "consistência", "automação"],
        relatedQuestions: ["revisar-extracoes", "importar-planilhas"]
      }
    ]
  },
  {
    id: "relatorios",
    title: "Relatórios Integrados",
    icon: "FileBarChart",
    description: "Limites de relatórios e exportações",
    questions: [
      {
        id: "relatorios-disponiveis",
        question: "Quais relatórios estão disponíveis?",
        answer: "Cada módulo oferece suas próprias listas, indicadores e exportações. Referenciais ESG são livres e o relato permanece em rascunho; o Daton não entrega relatórios prontos GRI, TCFD, TNFD, IFRS, CDP ou GHG Protocol.",
        tags: ["relatórios", "gri", "tcfd", "padrões", "frameworks"],
        relatedQuestions: ["gerar-relatorio", "indicadores-gri"]
      },
      {
        id: "gerar-relatorio",
        question: "Como gerar relatório de sustentabilidade?",
        answer: "O Daton permite cadastrar referenciais ESG livres, organizar temas, respostas, evidências e iniciativas e manter um relato em rascunho. Não há pacote GRI pronto, cálculo automático de indicadores GRI ou publicação final pelo sistema.",
        tags: ["relatórios", "sustentabilidade", "gerar", "exportar"],
        relatedQuestions: ["relatorios-disponiveis", "personalizar-templates"]
      },
      {
        id: "exportar-pdf",
        question: "Como exportar relatórios em PDF?",
        answer: "As exportações dependem de cada módulo e, nos recursos atuais habilitados, são principalmente em CSV. O Daton não gera PDF, Word ou PowerPoint, não agenda envios e não oferece editor de templates de relatório.",
        tags: ["exportar", "pdf", "download", "publicar"],
        relatedQuestions: ["gerar-relatorio", "personalizar-templates"]
      },
      {
        id: "personalizar-templates",
        question: "Como personalizar templates de relatórios?",
        answer: "As exportações dependem de cada módulo e, nos recursos atuais habilitados, são principalmente em CSV. O Daton não gera PDF, Word ou PowerPoint, não agenda envios e não oferece editor de templates de relatório.",
        tags: ["templates", "personalização", "layout", "design"],
        relatedQuestions: ["gerar-relatorio", "exportar-pdf"]
      },
      {
        id: "indicadores-gri",
        question: "Quais indicadores GRI são cobertos?",
        answer: "O Daton permite cadastrar referenciais ESG livres, organizar temas, respostas, evidências e iniciativas e manter um relato em rascunho. Não há pacote GRI pronto, cálculo automático de indicadores GRI ou publicação final pelo sistema.",
        tags: ["gri", "indicadores", "standards", "esg"],
        relatedQuestions: ["relatorios-disponiveis", "gerar-relatorio"]
      },
      {
        id: "relatorios-financeiros-integrados",
        question: "O que são relatórios financeiros integrados?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["relatórios", "financeiro", "integrado", "esg", "ir"],
        relatedQuestions: ["gerar-relatorio", "dashboard-esg-financeiro"]
      },
      {
        id: "exportar-multiplos-formatos",
        question: "Em quais formatos posso exportar relatórios?",
        answer: "As exportações dependem de cada módulo e, nos recursos atuais habilitados, são principalmente em CSV. O Daton não gera PDF, Word ou PowerPoint, não agenda envios e não oferece editor de templates de relatório.",
        tags: ["exportar", "formatos", "pdf", "excel", "word", "html"],
        relatedQuestions: ["exportar-pdf", "gerar-relatorio"]
      },
      {
        id: "agendar-relatorios",
        question: "Como agendar envio automático de relatórios?",
        answer: "As exportações dependem de cada módulo e, nos recursos atuais habilitados, são principalmente em CSV. O Daton não gera PDF, Word ou PowerPoint, não agenda envios e não oferece editor de templates de relatório.",
        tags: ["agendamento", "automação", "relatórios", "envio", "e-mail"],
        relatedQuestions: ["gerar-relatorio", "compartilhar-dashboards"]
      },
      {
        id: "relatorios-comparativos",
        question: "Como gerar relatórios comparativos ano a ano?",
        answer: "As exportações dependem de cada módulo e, nos recursos atuais habilitados, são principalmente em CSV. O Daton não gera PDF, Word ou PowerPoint, não agenda envios e não oferece editor de templates de relatório.",
        tags: ["comparativo", "análise", "temporal", "evolução", "tendências"],
        relatedQuestions: ["gerar-relatorio", "dashboards-customizados"]
      }
    ]
  },
  {
    id: "formularios",
    title: "Formulários Customizados",
    icon: "ClipboardList",
    description: "Modelos internos versionados e respostas",
    questions: [
      {
        id: "criar-formularios",
        question: "Como criar formulários próprios?",
        answer: "Quando Formulários Internos estiver habilitado, administradores criam modelos versionados com campos e regras; as respostas preservam a versão usada e podem ser exportadas em CSV. Não há link público, QR Code ou incorporação externa genérica.",
        tags: ["formulários", "pesquisas", "criação", "editor"],
        relatedQuestions: ["tipos-campos", "compartilhar-formularios"]
      },
      {
        id: "compartilhar-formularios",
        question: "Como compartilhar formulários externamente?",
        answer: "Quando Formulários Internos estiver habilitado, administradores criam modelos versionados com campos e regras; as respostas preservam a versão usada e podem ser exportadas em CSV. Não há link público, QR Code ou incorporação externa genérica.",
        tags: ["compartilhar", "link", "público", "externo"],
        relatedQuestions: ["criar-formularios", "analisar-respostas"]
      },
      {
        id: "analisar-respostas",
        question: "Como analisar respostas de formulários?",
        answer: "Quando Formulários Internos estiver habilitado, administradores criam modelos versionados com campos e regras; as respostas preservam a versão usada e podem ser exportadas em CSV. Não há link público, QR Code ou incorporação externa genérica.",
        tags: ["respostas", "análise", "estatísticas", "dashboard"],
        relatedQuestions: ["compartilhar-formularios", "criar-formularios"]
      },
      {
        id: "tipos-campos",
        question: "Quais tipos de campos são suportados?",
        answer: "Os Formulários Internos habilitados oferecem os tipos de campo e regras apresentados no construtor. Modelos publicados são versionados para que cada resposta preserve a estrutura vigente no momento do preenchimento.",
        tags: ["campos", "tipos", "perguntas", "opções"],
        relatedQuestions: ["criar-formularios", "validacoes"]
      }
    ]
  },
  {
    id: "integracoes",
    title: "Integrações e API",
    icon: "Plug",
    description: "Limites atuais de integrações e importações",
    questions: [
      {
        id: "integracoes-disponiveis",
        question: "Quais integrações estão disponíveis?",
        answer: "O Daton não disponibiliza API pública, OAuth, webhooks ou conectores prontos com ERP, BI, IoT e automação. A importação por planilha existe apenas nos destinos habilitados para cada empresa.",
        tags: ["integrações", "api", "erp", "conectores"],
        relatedQuestions: ["api-integracao", "automatizar-coleta"]
      },
      {
        id: "conectar-sistemas",
        question: "Como conectar sistemas externos?",
        answer: "O Daton não disponibiliza API pública, OAuth, webhooks ou conectores prontos com ERP, BI, IoT e automação. A importação por planilha existe apenas nos destinos habilitados para cada empresa.",
        tags: ["conexão", "sistemas", "sincronização", "configuração"],
        relatedQuestions: ["integracoes-disponiveis", "api-integracao"]
      },
      {
        id: "api-integracao",
        question: "Existe API para integração?",
        answer: "O Daton não disponibiliza API pública, OAuth, webhooks ou conectores prontos com ERP, BI, IoT e automação. A importação por planilha existe apenas nos destinos habilitados para cada empresa.",
        tags: ["api", "rest", "documentação", "endpoints"],
        relatedQuestions: ["integracoes-disponiveis", "automatizar-coleta"]
      },
      {
        id: "automatizar-coleta",
        question: "Como automatizar coleta de dados?",
        answer: "O Daton não disponibiliza API pública, OAuth, webhooks ou conectores prontos com ERP, BI, IoT e automação. A importação por planilha existe apenas nos destinos habilitados para cada empresa.",
        tags: ["automação", "coleta", "integração", "dados"],
        relatedQuestions: ["integracoes-disponiveis", "api-integracao"]
      }
    ]
  },
  {
    id: "seguranca",
    title: "Segurança e Privacidade",
    icon: "Lock",
    description: "Autenticação, autorização e continuidade operacional",
    questions: [
      {
        id: "protecao-dados",
        question: "Como são protegidos meus dados?",
        answer: "Senhas são protegidas com bcrypt, sessões usam JWT e o acesso é controlado por organização, papel, módulo e, quando aplicável, filial. O Daton não anuncia MFA, SOC 2, ISO 27001 ou uma versão específica de TLS como certificações garantidas.",
        tags: ["segurança", "criptografia", "proteção", "lgpd"],
        relatedQuestions: ["backup", "controle-acesso"]
      },
      {
        id: "backup",
        question: "Qual política de backup?",
        answer: "O plano operacional prevê objetivo de ponto de recuperação de 24 horas e objetivo de recuperação de 4 horas. Esses objetivos não representam garantia contratual de periodicidade, retenção ou SLA.",
        tags: ["backup", "recuperação", "retenção", "dados"],
        relatedQuestions: ["protecao-dados", "exportar-dados"]
      },
      {
        id: "controle-acesso",
        question: "Como funciona controle de acesso?",
        answer: "Senhas são protegidas com bcrypt, sessões usam JWT e o acesso é controlado por organização, papel, módulo e, quando aplicável, filial. O Daton não anuncia MFA, SOC 2, ISO 27001 ou uma versão específica de TLS como certificações garantidas.",
        tags: ["acesso", "autenticação", "mfa", "permissões"],
        relatedQuestions: ["protecao-dados", "permissoes"]
      },
      {
        id: "exportar-dados",
        question: "Posso exportar todos meus dados?",
        answer: "Use as exportações disponíveis em cada módulo. Não há um botão único para exportar todo o ambiente; pedidos adicionais podem ser encaminhados para contato@daton.com.br.",
        tags: ["exportação", "portabilidade", "lgpd", "dados"],
        relatedQuestions: ["backup", "deletar-conta"]
      },
      {
        id: "deletar-conta",
        question: "Como deletar minha conta?",
        answer: "Solicite a desativação ou exclusão pelos canais da organização ou escreva para contato@daton.com.br. A execução depende das obrigações legais, retenções aplicáveis e validação administrativa.",
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
        answer: "Use a Central de Ajuda em /app/ajuda e o widget Feedback no menu inferior do painel para enviar dúvida, problema ou ideia. Também é possível escrever para contato@daton.com.br; não há chat, WhatsApp, 0800 ou SLA de atendimento publicado.",
        tags: ["suporte", "contato", "ajuda", "atendimento"],
        relatedQuestions: ["horarios-atendimento", "documentacao"]
      },
      {
        id: "horarios-atendimento",
        question: "Quais são os horários de atendimento?",
        answer: "Use a Central de Ajuda em /app/ajuda e o widget Feedback no menu inferior do painel para enviar dúvida, problema ou ideia. Também é possível escrever para contato@daton.com.br; não há chat, WhatsApp, 0800 ou SLA de atendimento publicado.",
        tags: ["horários", "atendimento", "disponibilidade", "sla"],
        relatedQuestions: ["contato-suporte", "reportar-bugs"]
      },
      {
        id: "documentacao",
        question: "Existe documentação técnica?",
        answer: "Use a Central de Ajuda em /app/ajuda e o widget Feedback no menu inferior do painel para enviar dúvida, problema ou ideia. Também é possível escrever para contato@daton.com.br; não há chat, WhatsApp, 0800 ou SLA de atendimento publicado.",
        tags: ["documentação", "tutoriais", "guias", "ajuda"],
        relatedQuestions: ["tutoriais", "api-integracao"]
      },
      {
        id: "reportar-bugs",
        question: "Como reportar bugs?",
        answer: "Use a Central de Ajuda em /app/ajuda e o widget Feedback no menu inferior do painel para enviar dúvida, problema ou ideia. Também é possível escrever para contato@daton.com.br; não há chat, WhatsApp, 0800 ou SLA de atendimento publicado.",
        tags: ["bugs", "problemas", "erros", "reportar"],
        relatedQuestions: ["contato-suporte", "sugerir-melhorias"]
      },
      {
        id: "sugerir-melhorias",
        question: "Como sugerir melhorias?",
        answer: "Use a Central de Ajuda em /app/ajuda e o widget Feedback no menu inferior do painel para enviar dúvida, problema ou ideia. Também é possível escrever para contato@daton.com.br; não há chat, WhatsApp, 0800 ou SLA de atendimento publicado.",
        tags: ["sugestões", "melhorias", "feedback", "roadmap"],
        relatedQuestions: ["contato-suporte", "reportar-bugs"]
      }
    ]
  },
  {
    id: "modulo-financeiro",
    title: "Limites do Escopo Financeiro",
    icon: "DollarSign",
    description: "O que permanece fora do Daton",
    questions: [
      {
        id: "acessar-dashboard-financeiro",
        question: "Como acessar o dashboard financeiro?",
        answer: "O Daton não possui dashboard financeiro. Consulte valores e vencimentos no sistema financeiro da organização; no Daton, acompanhe apenas os registros operacionais dos módulos disponíveis.",
        tags: ["financeiro", "dashboard", "visão geral", "kpis"],
        relatedQuestions: ["cadastrar-contas-pagar", "relatorios-financeiros"]
      },
      {
        id: "cadastrar-contas-pagar",
        question: "Como cadastrar contas a pagar?",
        answer: "O Daton não cadastra contas a pagar, vencimentos, pagamentos ou baixas bancárias. Use o sistema financeiro da organização.",
        tags: ["contas a pagar", "despesas", "fornecedores", "pagamentos"],
        relatedQuestions: ["fluxo-aprovacoes-financeiro", "vincular-despesas-esg"]
      },
      {
        id: "cadastrar-contas-receber",
        question: "Como cadastrar contas a receber?",
        answer: "O Daton não cadastra contas a receber, cobranças ou liquidações. Use o sistema financeiro ou contábil adotado pela organização.",
        tags: ["contas a receber", "receitas", "clientes", "recebimentos"],
        relatedQuestions: ["fluxo-caixa-previsao", "cadastrar-contas-pagar"]
      },
      {
        id: "plano-contas-configurar",
        question: "O que é o Plano de Contas e como configurar?",
        answer: "Plano de contas é a hierarquia usada para classificar registros contábeis. O Daton não cria nem administra essa estrutura; configure-a no sistema contábil da organização.",
        tags: ["plano de contas", "contabilidade", "configuração", "categorias"],
        relatedQuestions: ["lancamentos-contabeis", "relatorios-financeiros"]
      },
      {
        id: "lancamentos-contabeis",
        question: "Como fazer lançamentos contábeis?",
        answer: "O Daton não registra débitos, créditos ou partidas contábeis. Faça os lançamentos no sistema contábil responsável pelos livros da organização.",
        tags: ["lançamentos", "contabilidade", "débito", "crédito"],
        relatedQuestions: ["plano-contas-configurar", "relatorios-financeiros"]
      },
      {
        id: "centros-custo-esg",
        question: "O que são Centros de Custos ESG?",
        answer: "Centro de custos é uma classificação financeira que pode ser usada pela organização para acompanhar gastos relacionados a iniciativas ESG. O Daton não cadastra centros de custos nem recebe lançamentos financeiros.",
        tags: ["centros de custo", "esg", "projetos", "investimentos"],
        relatedQuestions: ["vincular-despesas-esg", "roi-projetos-esg"]
      },
      {
        id: "fluxo-aprovacoes-financeiro",
        question: "Como funciona o fluxo de aprovações financeiras?",
        answer: "O Daton não possui aprovação de pagamentos, alçadas ou segregação de funções financeiras. Esse fluxo deve permanecer no sistema financeiro da organização.",
        tags: ["aprovações", "workflow", "controle", "governança"],
        relatedQuestions: ["cadastrar-contas-pagar", "alertas-financeiros"]
      },
      {
        id: "vincular-despesas-esg",
        question: "Como vincular despesas a iniciativas ESG?",
        answer: "O Daton não recebe despesas nem transações financeiras. Relacione a iniciativa ao identificador usado pelo sistema financeiro e consolide essa associação fora do Daton.",
        tags: ["esg", "despesas", "categorização", "projetos"],
        relatedQuestions: ["centros-custo-esg", "roi-projetos-esg"]
      },
      {
        id: "roi-projetos-esg",
        question: "Como calcular o ROI de projetos ESG?",
        answer: "O Daton não calcula ROI de projetos. Registre iniciativas, indicadores e ações no sistema e combine os dados exportados com custos e benefícios no processo financeiro da organização.",
        tags: ["roi", "retorno", "análise", "investimentos"],
        relatedQuestions: ["vincular-despesas-esg", "centros-custo-esg"]
      },
      {
        id: "alertas-financeiros",
        question: "O que são alertas financeiros inteligentes?",
        answer: "O Daton não emite alertas financeiros, de caixa ou de vencimento de contas. Alertas existentes pertencem aos fluxos operacionais e às pendências habilitadas.",
        tags: ["alertas", "notificações", "monitoramento", "inteligência"],
        relatedQuestions: ["fluxo-aprovacoes-financeiro", "fluxo-caixa-previsao"]
      },
      {
        id: "exportar-gri-financeiro",
        question: "Como exportar dados financeiros para GRI?",
        answer: "O Daton não armazena dados financeiros para exportação GRI. Reúna esses dados no sistema contábil e incorpore-os externamente ao relato validado pela organização.",
        tags: ["gri", "exportação", "relatórios", "sustentabilidade"],
        relatedQuestions: ["relatorios-financeiros", "vincular-despesas-esg"]
      },
      {
        id: "relatorio-rentabilidade",
        question: "Como interpretar o relatório de rentabilidade?",
        answer: "O Daton não gera relatório de rentabilidade. Analise receitas, custos, margens e premissas no sistema financeiro ou ferramenta de BI responsável.",
        tags: ["rentabilidade", "margens", "ebitda", "indicadores"],
        relatedQuestions: ["relatorios-financeiros", "roi-projetos-esg"]
      },
      {
        id: "fluxo-caixa-previsao",
        question: "Como funciona a previsão de fluxo de caixa?",
        answer: "O Daton não projeta fluxo de caixa. Use dados financeiros conciliados e premissas aprovadas no sistema de planejamento da organização.",
        tags: ["fluxo de caixa", "previsão", "projeção", "ia"],
        relatedQuestions: ["alertas-financeiros", "cadastrar-contas-receber"]
      },
      {
        id: "relatorios-financeiros",
        question: "Quais relatórios financeiros estão disponíveis?",
        answer: "Não há relatórios financeiros no Daton. As exportações existentes contêm dados operacionais dos respectivos módulos.",
        tags: ["relatórios", "dre", "balanço", "análises"],
        relatedQuestions: ["plano-contas-configurar", "exportar-gri-financeiro"]
      },
      {
        id: "configurar-bancos",
        question: "Como configurar bancos e contas bancárias?",
        answer: "O Daton não armazena bancos, contas, saldos ou credenciais bancárias. Faça essa configuração apenas no sistema financeiro autorizado.",
        tags: ["bancos", "contas bancárias", "configuração", "saldos"],
        relatedQuestions: ["conciliacao-bancaria", "cadastrar-contas-pagar"]
      },
      {
        id: "conciliacao-bancaria",
        question: "Como fazer conciliação bancária?",
        answer: "O Daton não importa extratos nem concilia movimentações bancárias. Use o sistema contábil ou financeiro da organização.",
        tags: ["conciliação", "extrato", "bancário", "saldos"],
        relatedQuestions: ["configurar-bancos", "lancamentos-contabeis"]
      },
      {
        id: "calcular-indicadores-financeiros",
        question: "Como calcular indicadores financeiros?",
        answer: "O Daton não calcula margem, EBITDA, liquidez ou outros indicadores financeiros. Calcule-os externamente a partir de dados contábeis revisados.",
        tags: ["indicadores", "índices", "análise", "performance"],
        relatedQuestions: ["relatorio-rentabilidade", "relatorios-financeiros"]
      },
      {
        id: "integrar-dados-financeiros-esg",
        question: "Como integrar dados financeiros nos relatórios ESG?",
        answer: "Exporte os dados operacionais disponíveis e combine-os externamente com dados financeiros validados. O Daton não faz essa integração nem publica o relatório final.",
        tags: ["integração", "esg", "relatórios", "correlação"],
        relatedQuestions: ["vincular-despesas-esg", "exportar-gri-financeiro"]
      },
      {
        id: "filtros-periodo-financeiro",
        question: "Como usar filtros de período nos relatórios financeiros?",
        answer: "Como não há relatórios financeiros no Daton, não existem filtros desse tipo. Use os filtros do sistema financeiro da organização.",
        tags: ["filtros", "período", "datas", "análise temporal"],
        relatedQuestions: ["relatorios-financeiros", "acessar-dashboard-financeiro"]
      }
    ]
  },
  {
    id: "assistente-ia",
    title: "Assistente IA (Daton AI Chat)",
    icon: "Bot",
    description: "Consultas em texto, somente leitura e com acesso autorizado",
    questions: [
      {
        id: "usar-assistente-ia",
        question: "Como usar o Assistente IA do Daton?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["ia", "assistente", "chat", "ajuda"],
        relatedQuestions: ["tipos-perguntas-ia", "analise-contextual"]
      },
      {
        id: "tipos-perguntas-ia",
        question: "Que tipos de perguntas posso fazer à IA?",
        answer: "Pergunte sobre os dados que o Daton AI consegue consultar para sua organização, como contagens, listas e resumos dos domínios autorizados. Ele não analisa arquivos, prevê cenários, calcula scores ou altera registros.",
        tags: ["perguntas", "comandos", "queries", "consultas"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "upload-documentos-ia",
        question: "Como fazer upload de documentos para análise?",
        answer: "O Daton AI não recebe arquivos. Anexos pertencem aos registros dos módulos; o assistente consulta somente os dados estruturados autorizados para a organização.",
        tags: ["upload", "documentos", "ocr", "extração"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-dados-acesso"]
      },
      {
        id: "analise-contextual",
        question: "O que é análise contextual por página?",
        answer: "O Daton AI usa o histórico da conversa e as ferramentas de consulta autorizadas. Ele não lê automaticamente a página aberta nem muda o escopo de acesso conforme a tela.",
        tags: ["contexto", "página", "inteligência", "adaptação"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      },
      {
        id: "analises-preditivas-ia",
        question: "Como pedir análises preditivas?",
        answer: "O Daton AI não executa análises preditivas. Ele pode consultar dados autorizados e descrevê-los em texto; previsões e simulações devem ser feitas externamente com método validado pela organização.",
        tags: ["limites da ia", "previsão", "consulta", "tendências"],
        relatedQuestions: ["ia-calcula-previsoes", "insights-proativos"]
      },
      {
        id: "ia-analisa-dados-financeiros",
        question: "Quais dados financeiros a IA pode analisar?",
        answer: "O Daton não possui módulo financeiro, contábil, bancário ou de orçamento. Dados operacionais podem ser exportados dos módulos que oferecem essa opção para análise em um sistema financeiro externo.",
        tags: ["financeiro", "análise", "dados", "transações"],
        relatedQuestions: ["tipos-perguntas-ia", "analises-preditivas-ia"]
      },
      {
        id: "ia-calcula-previsoes",
        question: "Como a IA calcula previsões de emissões?",
        answer: "O Daton não oferece análise preditiva, detecção de anomalias, intervalos de confiança, forecast ou scoring de risco. O Daton AI consulta dados autorizados e responde em texto, sem executar esses cálculos.",
        tags: ["emissões", "previsão", "algoritmo", "metodologia"],
        relatedQuestions: ["analises-preditivas-ia", "precisao-previsoes"]
      },
      {
        id: "insights-proativos",
        question: "O que são insights proativos?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["insights", "proativo", "alertas", "recomendações"],
        relatedQuestions: ["analises-preditivas-ia", "ia-identifica-riscos"]
      },
      {
        id: "ia-identifica-riscos",
        question: "Como a IA identifica riscos de conformidade?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["riscos", "conformidade", "scoring", "alertas"],
        relatedQuestions: ["insights-proativos", "scoring-risco-licencas"]
      },
      {
        id: "relatorios-customizados-ia",
        question: "Posso pedir relatórios customizados à IA?",
        answer: "O Daton AI pode resumir em texto os dados que suas ferramentas autorizadas retornam. Ele não gera PDF, planilha, gráfico ou relatório final e não substitui a revisão da organização.",
        tags: ["relatórios", "customização", "geração", "exportação"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-analisa-dados-financeiros"]
      },
      {
        id: "ia-probabilidade-metas",
        question: "Como a IA analisa probabilidade de atingir metas?",
        answer: "O Daton não oferece análise preditiva, detecção de anomalias, intervalos de confiança, forecast ou scoring de risco. O Daton AI consulta dados autorizados e responde em texto, sem executar esses cálculos.",
        tags: ["metas", "probabilidade", "previsão", "análise"],
        relatedQuestions: ["analises-preditivas-ia", "insights-proativos"]
      },
      {
        id: "ia-dados-acesso",
        question: "A IA tem acesso a todos os meus dados?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["privacidade", "segurança", "acesso", "lgpd"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "scoring-risco-licencas",
        question: "Como funciona o scoring de risco de licenças?",
        answer: "O Daton não oferece análise preditiva, detecção de anomalias, intervalos de confiança, forecast ou scoring de risco. O Daton AI consulta dados autorizados e responde em texto, sem executar esses cálculos.",
        tags: ["licenças", "risco", "score", "conformidade"],
        relatedQuestions: ["ia-identifica-riscos", "insights-proativos"]
      },
      {
        id: "ia-ferramentas-acesso",
        question: "Quais ferramentas/tools a IA tem acesso?",
        answer: "O Daton AI recebe perguntas em texto e usa seis ferramentas de consulta somente leitura sobre dados autorizados. Ele não altera registros, recebe arquivos, prevê resultados, gera scoring ou cria relatórios finais; revise as respostas antes de decidir.",
        tags: ["ferramentas", "tools", "capacidades", "funções"],
        relatedQuestions: ["tipos-perguntas-ia", "relatorios-customizados-ia"]
      },
      {
        id: "melhorar-respostas-ia",
        question: "Como melhorar a qualidade das respostas da IA?",
        answer: "Informe o domínio, período e recorte desejados, use nomes que existam no cadastro e faça uma pergunta por vez. Confira a resposta nos registros de origem, especialmente antes de tomar uma decisão.",
        tags: ["qualidade", "otimização", "dicas", "treinamento"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      }
    ]
  },
  {
    id: "gestao-tarefas",
    title: "Gestão de Tarefas",
    icon: "CheckSquare",
    description: "Ações e responsáveis nos fluxos dos módulos",
    questions: [
      {
        id: "criar-tarefa",
        question: "Como criar uma nova tarefa?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["tarefas", "criar", "novo", "atividades"],
        relatedQuestions: ["definir-prioridades", "atribuir-responsaveis"]
      },
      {
        id: "definir-prioridades",
        question: "Como definir prioridades de tarefas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["prioridades", "urgência", "classificação", "níveis"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "workflow-aprovacao-tarefas",
        question: "Como funciona o workflow de aprovação?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["workflow", "aprovação", "processos", "governança"],
        relatedQuestions: ["criar-tarefa", "atribuir-responsaveis"]
      },
      {
        id: "atribuir-responsaveis",
        question: "Como atribuir responsáveis?",
        answer: "Nos planos e ações que oferecem essa opção, selecione uma conta ativa da mesma organização. A elegibilidade do responsável pode ser apenas registrada ou efetivamente exigida, conforme a configuração do ambiente.",
        tags: ["responsáveis", "atribuição", "delegação", "usuários"],
        relatedQuestions: ["criar-tarefa", "workflow-aprovacao-tarefas"]
      },
      {
        id: "configurar-prazos-lembretes",
        question: "Como configurar prazos e lembretes?",
        answer: "Defina o prazo no plano, ação ou registro correspondente. Pendências e cobranças dependem do módulo, da habilitação da empresa e das regras configuradas; não há lembretes genéricos em qualquer tarefa.",
        tags: ["prazos", "lembretes", "notificações", "alertas"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "tags-tarefas",
        question: "O que são tags de tarefas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["tags", "categorias", "filtros", "organização"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      },
      {
        id: "vincular-tarefas-metas-licencas",
        question: "Como vincular tarefas a metas ou licenças?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["vínculos", "metas", "licenças", "projetos"],
        relatedQuestions: ["criar-tarefa", "filtros-tarefas"]
      },
      {
        id: "tarefas-atrasadas",
        question: "Como ver tarefas atrasadas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["atrasadas", "vencidas", "atraso", "pendências"],
        relatedQuestions: ["definir-prioridades", "configurar-prazos-lembretes"]
      },
      {
        id: "relatorios-produtividade",
        question: "Como gerar relatórios de produtividade?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["relatórios", "produtividade", "métricas", "performance"],
        relatedQuestions: ["tarefas-atrasadas", "filtros-tarefas"]
      },
      {
        id: "filtros-tarefas",
        question: "Como usar filtros de tarefas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["filtros", "busca", "views", "organização"],
        relatedQuestions: ["tags-tarefas", "tarefas-atrasadas"]
      },
      {
        id: "notificacoes-tarefas",
        question: "Como receber notificações de tarefas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["notificações", "alertas", "comunicação", "lembretes"],
        relatedQuestions: ["configurar-prazos-lembretes", "criar-tarefa"]
      },
      {
        id: "bulk-actions-tarefas",
        question: "Como fazer bulk actions em tarefas?",
        answer: "O Daton acompanha ações dentro de planos e fluxos dos módulos, com responsáveis, prazos e status. Não há módulo genérico de tarefas, aprovação configurável, ações em massa ou relatório de produtividade.",
        tags: ["bulk", "massa", "múltiplas", "ações"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      }
    ]
  },
  {
    id: "agua-efluentes",
    title: "Água e Limites de Efluentes",
    icon: "Droplet",
    description: "Lançamentos de água e recursos fora do escopo",
    questions: [
      {
        id: "registrar-consumo-agua",
        question: "Como registrar consumo de água?",
        answer: "Quando o domínio de recursos estiver habilitado, crie um lançamento com período, quantidade, unidade, fonte e vínculos solicitados. A cobrança em pendências depende da configuração da empresa.",
        tags: ["água", "consumo", "registro", "volume"],
        relatedQuestions: ["categorizar-fontes-agua", "calcular-intensidade-hidrica"]
      },
      {
        id: "categorizar-fontes-agua",
        question: "Como categorizar fontes de água?",
        answer: "Use as opções disponíveis no cadastro do lançamento e mantenha a classificação coerente com o controle ambiental da organização. O Daton não infere a fonte automaticamente.",
        tags: ["fontes", "categorias", "tipos", "origem"],
        relatedQuestions: ["registrar-consumo-agua", "gri-303-relatorio"]
      },
      {
        id: "calcular-intensidade-hidrica",
        question: "Como calcular intensidade hídrica?",
        answer: "O Daton registra volumes de água, mas não calcula universalmente intensidade por produção ou receita. Exporte os lançamentos e divida pelo denominador validado pela organização.",
        tags: ["intensidade", "indicadores", "eficiência", "produtividade"],
        relatedQuestions: ["registrar-consumo-agua", "metas-reducao-agua"]
      },
      {
        id: "reuso-agua",
        question: "O que é reúso de água?",
        answer: "Reúso é o aproveitamento de água já utilizada após tratamento compatível com o novo uso. O Daton pode registrar lançamentos, mas não projeta nem certifica o sistema de tratamento.",
        tags: ["reúso", "reutilização", "tratamento", "economia"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "monitorar-efluentes",
        question: "Como monitorar efluentes?",
        answer: "O Daton não possui cadastro ou monitoramento de efluentes. Registros de água cobrem lançamentos de consumo quando o domínio estiver habilitado.",
        tags: ["efluentes", "descarte", "qualidade", "tratamento"],
        relatedQuestions: ["reuso-agua", "gri-303-relatorio"]
      },
      {
        id: "gri-303-relatorio",
        question: "Como gerar relatório de água (GRI 303)?",
        answer: "Exporte os lançamentos de água disponíveis e use-os como insumo para um relato externo. O Daton não calcula nem publica um relatório GRI 303 pronto.",
        tags: ["gri 303", "relatório", "água", "sustentabilidade"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "metas-reducao-agua",
        question: "Como definir metas de redução de consumo?",
        answer: "Registre o objetivo em um indicador, iniciativa ou plano de ação e acompanhe os lançamentos de água. O Daton não projeta a tendência nem calcula a chance de atingir a meta.",
        tags: ["metas", "redução", "objetivos", "economia"],
        relatedQuestions: ["calcular-intensidade-hidrica", "registrar-consumo-agua"]
      },
      {
        id: "importar-dados-medidores",
        question: "Como importar dados de medidores?",
        answer: "A importação de lançamentos de água por planilha depende da habilitação explícita do destino para a empresa. O Daton não se conecta diretamente a medidores ou IoT.",
        tags: ["importação", "medidores", "automação", "dados"],
        relatedQuestions: ["registrar-consumo-agua", "vincular-agua-custos"]
      },
      {
        id: "vincular-agua-custos",
        question: "Como vincular água a custos?",
        answer: "O Daton não vincula consumo a tarifas ou contas. Exporte os volumes e associe-os aos custos no sistema financeiro da organização.",
        tags: ["custos", "financeiro", "tarifas", "economia"],
        relatedQuestions: ["calcular-intensidade-hidrica", "reuso-agua"]
      },
      {
        id: "qualidade-agua-monitoramento",
        question: "Como monitorar qualidade da água?",
        answer: "O Daton não registra parâmetros laboratoriais nem monitora qualidade da água. Use o sistema e o processo técnico apropriados para esse controle.",
        tags: ["qualidade", "análise", "parâmetros", "conformidade"],
        relatedQuestions: ["monitorar-efluentes", "registrar-consumo-agua"]
      }
    ]
  },
  {
    id: "analise-preditiva",
    title: "Limites da Análise Preditiva",
    icon: "TrendingUp",
    description: "Capacidades que o Daton não executa",
    questions: [
      {
        id: "o-que-e-analise-preditiva",
        question: "O que é análise preditiva no Daton?",
        answer: "O Daton não oferece análise preditiva. O Daton AI consulta dados autorizados e os resume em texto, sem treinar modelos, projetar séries ou calcular probabilidades.",
        tags: ["limites", "ia", "consulta", "previsão"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "previsao-emissoes",
        question: "Como funciona a previsão de emissões?",
        answer: "O Daton não prevê emissões futuras. O módulo Clima calcula os totais dos dados cadastrados; projeções devem ser feitas externamente com premissas documentadas.",
        tags: ["emissões", "previsão", "ghg", "carbono"],
        relatedQuestions: ["o-que-e-analise-preditiva", "detectar-anomalias"]
      },
      {
        id: "scoring-risco-conformidade",
        question: "O que é scoring de risco de conformidade?",
        answer: "Scoring é uma forma de resumir risco segundo critérios definidos. O Daton não calcula score de conformidade por IA; use os status, prazos e evidências registrados para a avaliação responsável.",
        tags: ["risco", "conformidade", "score", "alertas"],
        relatedQuestions: ["probabilidade-atingir-metas", "detectar-anomalias"]
      },
      {
        id: "probabilidade-atingir-metas",
        question: "Como calcular probabilidade de atingir metas?",
        answer: "O Daton não calcula probabilidade de atingir objetivos. Compare externamente a evolução dos indicadores com o valor e o prazo definidos.",
        tags: ["metas", "probabilidade", "objetivos", "previsão"],
        relatedQuestions: ["o-que-e-analise-preditiva", "scoring-risco-conformidade"]
      },
      {
        id: "interpretar-intervalos-confianca",
        question: "Como interpretar intervalos de confiança?",
        answer: "Intervalo de confiança expressa a incerteza de uma estimativa estatística. O Daton não gera previsões nem intervalos de confiança.",
        tags: ["intervalo", "confiança", "estatística", "incerteza"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "detectar-anomalias",
        question: "O que são anomalias nas emissões?",
        answer: "Anomalia é um valor que foge do padrão esperado e precisa ser investigado. O Daton não detecta anomalias automaticamente; confira lançamentos, unidades e fatores ao revisar variações.",
        tags: ["anomalias", "outliers", "desvios", "alertas"],
        relatedQuestions: ["previsao-emissoes", "detectar-tendencias"]
      },
      {
        id: "dados-historicos-necessarios",
        question: "Quantos dados históricos são necessários?",
        answer: "Não há requisito de histórico porque o Daton não executa previsões. Para análises externas, escolha o período conforme o método, a sazonalidade e a qualidade dos dados disponíveis.",
        tags: ["dados", "histórico", "período", "requisitos"],
        relatedQuestions: ["o-que-e-analise-preditiva", "precisao-previsoes"]
      },
      {
        id: "detectar-tendencias",
        question: "Como a IA detecta tendências?",
        answer: "O Daton AI não detecta tendências ou anomalias. Ele pode consultar registros autorizados; qualquer tendência deve ser calculada e validada no método de análise escolhido.",
        tags: ["tendências", "evolução", "crescimento", "análise"],
        relatedQuestions: ["previsao-emissoes", "detectar-anomalias"]
      },
      {
        id: "usar-preditiva-planejamento",
        question: "Como usar análise preditiva para planejamento?",
        answer: "O Daton não oferece análise preditiva. Para planejar, use indicadores e históricos exportados, explicite premissas e valide os cenários em ferramenta apropriada.",
        tags: ["planejamento", "estratégia", "orçamento", "decisões"],
        relatedQuestions: ["o-que-e-analise-preditiva", "probabilidade-atingir-metas"]
      },
      {
        id: "precisao-previsoes",
        question: "Qual a precisão das previsões?",
        answer: "Não há medida de precisão porque o Daton não produz previsões. Resultados de modelos externos devem informar método, dados, erro e limitações.",
        tags: ["precisão", "acurácia", "erro", "validação"],
        relatedQuestions: ["previsao-emissoes", "interpretar-intervalos-confianca"]
      }
    ]
  },
  {
    id: "integracao-financeiro-esg",
    title: "Limites da Integração Financeiro-ESG",
    icon: "Link",
    description: "Separação entre dados operacionais e financeiros",
    questions: [
      {
        id: "o-que-e-integracao-financeiro-esg",
        question: "O que é a integração Financeiro-ESG?",
        answer: "A integração financeiro-ESG seria a associação entre valores contábeis e resultados de sustentabilidade. O Daton não faz essa associação; dados financeiros permanecem no sistema responsável e os dados operacionais podem ser exportados separadamente.",
        tags: ["integração", "esg", "financeiro", "roi"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "vincular-despesas-pilares-esg",
        question: "Como vincular despesas a pilares ESG?",
        answer: "O Daton não possui módulo financeiro nem vincula despesas, transações, orçamentos ou retornos a pilares ESG. Exporte os dados operacionais disponíveis e faça a análise financeira no sistema apropriado.",
        tags: ["despesas", "categorização", "pilares", "esg"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "visualizar-custos-pilar"]
      },
      {
        id: "visualizar-custos-pilar",
        question: "Como visualizar custos por pilar ESG?",
        answer: "O Daton não recebe custos por pilar. Classifique e visualize esses valores no sistema financeiro, usando critérios definidos e validados pela organização.",
        tags: ["custos", "visualização", "pilares", "análise"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "dashboard-esg-financeiro",
        question: "O que é o Dashboard ESG Financeiro?",
        answer: "Esse dashboard não existe no Daton. Use o sistema financeiro para custos e investimentos e os módulos do Daton para indicadores, iniciativas e ações operacionais.",
        tags: ["dashboard", "esg", "financeiro", "kpis"],
        relatedQuestions: ["visualizar-custos-pilar", "calcular-roi-ambientais"]
      },
      {
        id: "calcular-roi-ambientais",
        question: "Como calcular ROI de iniciativas ambientais?",
        answer: "O Daton não possui módulo financeiro nem vincula despesas, transações, orçamentos ou retornos a pilares ESG. Exporte os dados operacionais disponíveis e faça a análise financeira no sistema apropriado.",
        tags: ["roi", "retorno", "ambiental", "projetos"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "rastrear-investimentos-esg"]
      },
      {
        id: "relatorios-integrados-financeiro-esg",
        question: "Como gerar relatórios integrados?",
        answer: "O Daton não gera relatório integrado financeiro-ESG. Combine externamente os dados operacionais exportados com informações financeiras validadas e revise a narrativa antes da publicação.",
        tags: ["relatórios", "integrados", "esg", "financeiro"],
        relatedQuestions: ["dashboard-esg-financeiro", "exportar-dados-integrados-gri"]
      },
      {
        id: "rastrear-investimentos-esg",
        question: "Como rastrear investimentos ESG?",
        answer: "Acompanhe a execução operacional como iniciativas, indicadores e ações no Daton e registre valores no sistema financeiro. A conciliação entre os dois controles é externa.",
        tags: ["investimentos", "rastreamento", "centros de custo", "esg"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "calcular-roi-ambientais"]
      },
      {
        id: "estimar-impacto-carbono-despesas",
        question: "Como estimar impacto de carbono de despesas?",
        answer: "O Daton calcula emissões a partir de fontes, fatores versionados e dados de atividade, não do valor monetário de despesas. Cadastre o dado físico adequado no módulo Clima.",
        tags: ["carbono", "emissões", "despesas", "escopo 3"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "calcular-roi-ambientais"]
      },
      {
        id: "usar-projetos-esg-transacoes",
        question: "Como usar projetos ESG em transações?",
        answer: "O Daton não registra transações financeiras. Use iniciativas e planos para a execução operacional e associe seus identificadores no sistema financeiro, se a organização precisar desse vínculo.",
        tags: ["projetos", "transações", "vinculação", "gestão"],
        relatedQuestions: ["rastrear-investimentos-esg", "calcular-roi-ambientais"]
      },
      {
        id: "exportar-dados-integrados-gri",
        question: "Como exportar dados integrados para GRI?",
        answer: "Não há exportação integrada financeiro-GRI. Reúna externamente os dados financeiros e os registros ESG exportados e valide o conteúdo conforme o referencial adotado.",
        tags: ["gri", "exportação", "integrado", "relatórios"],
        relatedQuestions: ["relatorios-integrados-financeiro-esg", "vincular-despesas-pilares-esg"]
      },
      {
        id: "analise-custo-beneficio-acoes-esg",
        question: "Como analisar custo-benefício de ações ESG?",
        answer: "Exporte os resultados operacionais e compare-os externamente com custos e benefícios verificados. O Daton não calcula VPL, TIR, payback, sensibilidade ou risco-retorno.",
        tags: ["custo-benefício", "análise", "decisão", "investimentos"],
        relatedQuestions: ["calcular-roi-ambientais", "o-que-e-integracao-financeiro-esg"]
      },
      {
        id: "criar-orcamentos-esg",
        question: "Como criar orçamentos ESG?",
        answer: "O Daton não cria ou acompanha orçamento. Planeje valores, centros de custo e execução no sistema financeiro e use iniciativas e planos do Daton para acompanhar as entregas operacionais.",
        tags: ["orçamentos", "budget", "planejamento", "alocação"],
        relatedQuestions: ["rastrear-investimentos-esg", "visualizar-custos-pilar"]
      }
    ]
  },
  {
    id: "gri-standards-detalhado",
    title: "GRI Standards e Limites do Daton",
    icon: "BookOpen",
    description: "Referenciais livres e relato em rascunho",
    questions: [
      {
        id: "o-que-sao-gri-standards",
        question: "O que são os GRI Standards?",
        answer: "Os GRI Standards são padrões para relato público dos impactos de uma organização. No Daton, podem ser representados como um referencial livre; a seleção, interpretação e validação permanecem com a organização.",
        tags: ["gri", "standards", "relatórios", "sustentabilidade"],
        relatedQuestions: ["indicadores-gri-daton", "gri-core-vs-comprehensive"]
      },
      {
        id: "indicadores-gri-daton",
        question: "Quais indicadores GRI o Daton cobre?",
        answer: "O Daton não traz uma lista GRI pré-configurada nem promete cobertura de indicadores. Um administrador pode cadastrar os temas e perguntas aplicáveis como referencial ESG.",
        tags: ["indicadores", "cobertura", "módulos", "gri"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "analise-materialidade-gri",
        question: "Como fazer análise de materialidade GRI?",
        answer: "Conduza a materialidade segundo a versão e os critérios oficiais do referencial adotado. No Daton, cadastre os temas e perguntas, registre respostas e evidências e mantenha o relato em rascunho; a pesquisa e a validação metodológica são externas.",
        tags: ["materialidade", "análise", "tópicos", "stakeholders"],
        relatedQuestions: ["o-que-sao-gri-standards", "preencher-indicadores-gri"]
      },
      {
        id: "preencher-indicadores-gri",
        question: "Como preencher indicadores GRI?",
        answer: "Cadastre o conteúdo aplicável como tema ou pergunta do referencial ESG e registre a resposta e suas evidências. O Daton não pré-carrega indicadores GRI, não coleta respostas automaticamente e não valida completude segundo o padrão.",
        tags: ["preencher", "formulários", "dados", "indicadores"],
        relatedQuestions: ["indicadores-gri-daton", "gerar-relatorio-gri-completo"]
      },
      {
        id: "gri-2-conteudos-gerais",
        question: "O que é GRI 2 (Conteúdos Gerais)?",
        answer: "GRI 2 reúne divulgações gerais sobre a organização e suas práticas de relato, atividades, governança, políticas e engajamento. O Daton não fornece esse conteúdo pronto.",
        tags: ["gri 2", "conteúdos gerais", "perfil", "governança"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "reportar-gri-305",
        question: "Como reportar GRI 305 (Emissões)?",
        answer: "Use os dados revisados do módulo Clima como insumo e registre respostas e evidências no referencial configurado. A organização deve aplicar os requisitos vigentes do GRI 305 e elaborar o relato final externamente.",
        tags: ["gri 305", "emissões", "ghg", "carbono"],
        relatedQuestions: ["reportar-gri-303", "preencher-indicadores-gri"]
      },
      {
        id: "reportar-gri-303",
        question: "Como reportar GRI 303 (Água)?",
        answer: "Use os lançamentos de água revisados como insumo e registre respostas e evidências no referencial. A organização deve validar escopo, contexto hídrico e requisitos vigentes do GRI 303.",
        tags: ["gri 303", "água", "recursos hídricos", "efluentes"],
        relatedQuestions: ["reportar-gri-305", "reportar-gri-306"]
      },
      {
        id: "reportar-gri-306",
        question: "Como reportar GRI 306 (Resíduos)?",
        answer: "Use lançamentos, destinações, MTRs e CDFs revisados como evidência do referencial. A classificação e o relato final conforme o GRI 306 são responsabilidade da organização.",
        tags: ["gri 306", "resíduos", "economia circular", "destinação"],
        relatedQuestions: ["reportar-gri-303", "reportar-gri-305"]
      },
      {
        id: "gerar-relatorio-gri-completo",
        question: "Como gerar relatório GRI completo?",
        answer: "O Daton não gera relatório GRI completo. Ele organiza temas, respostas, evidências e um relato em rascunho, que deve ser revisado, diagramado e publicado externamente.",
        tags: ["relatório completo", "geração", "exportação", "gri"],
        relatedQuestions: ["o-que-sao-gri-standards", "gri-core-vs-comprehensive"]
      },
      {
        id: "exportar-dados-relatorio-sustentabilidade",
        question: "Como exportar dados para relatório de sustentabilidade?",
        answer: "Use as exportações oferecidas pelos módulos e as respostas do referencial como insumos. O relato permanece em rascunho e não há exportação final automática em PDF ou Word.",
        tags: ["exportação", "relatório", "sustentabilidade", "formatos"],
        relatedQuestions: ["gerar-relatorio-gri-completo", "preencher-indicadores-gri"]
      },
      {
        id: "gri-core-vs-comprehensive",
        question: "Qual a diferença entre GRI Core e Comprehensive?",
        answer: "Core e Comprehensive eram opções de conformidade de versões anteriores dos GRI Standards. Para um relato atual, consulte os critérios vigentes; o Daton não classifica automaticamente o nível de conformidade.",
        tags: ["core", "comprehensive", "níveis", "diferenças"],
        relatedQuestions: ["o-que-sao-gri-standards", "gerar-relatorio-gri-completo"]
      },
      {
        id: "vincular-dados-financeiros-gri",
        question: "Como vincular dados financeiros ao GRI?",
        answer: "O Daton não armazena dados financeiros. Reúna-os no sistema contábil e relacione-os externamente às divulgações aplicáveis, com validação da organização.",
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
