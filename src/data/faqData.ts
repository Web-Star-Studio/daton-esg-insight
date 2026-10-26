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
        answer: "No módulo Clima, cadastre fontes dos Escopos 1, 2 e 3, associe fatores de emissão versionados e informe os dados de atividade. O Daton calcula as emissões, preserva a memória de cálculo e consolida os resultados para análise e relato.",
        tags: ["inventário", "ghg", "iniciante", "tutorial"]
      },
      {
        id: "uc-2",
        question: "Como preparar relatório para auditoria externa?",
        answer: "Reúna lançamentos, fatores, documentos e evidências com rastreabilidade de origem e revisão. O Daton organiza o dossiê e os relatórios de apoio, enquanto a conclusão formal permanece sob responsabilidade da organização e do auditor independente.",
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
        answer: "O Daton integra dados por importações assistidas e por conectores governados, definidos com contrato de campos, fonte, frequência, autoridade, retentativas e reconciliação. Cada integração é delimitada ao sistema aprovado; a oferta não pressupõe API pública, OAuth universal ou marcas específicas.",
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
        answer: "A migração combina importação assistida, prévia, validação de rejeitos, reversão e mapeamento de campos. Para documentos, a extração assistida propõe valores com trecho de origem e confiança, sempre submetidos à revisão humana antes da confirmação.",
        tags: ["migração", "importação", "dados", "transição"]
      },
      {
        id: "uc-7",
        question: "Como criar workflow de aprovação de licenças?",
        answer: "Organize licenças, condicionantes, obrigações, responsáveis, prazos, evidências e decisões em um fluxo rastreável. Estados, papéis e cobranças orientam a execução sem transformar o produto em um construtor irrestrito de workflows.",
        tags: ["workflow", "aprovação", "licenças", "automação"]
      },
      {
        id: "uc-8",
        question: "Como monitorar conformidade em tempo real?",
        answer: "O Daton consolida prazos, pendências, indicadores, evidências e desvios em painéis e relatórios governados. A atualização acompanha os registros e a frequência definida para cada integração. Alertas e análises assistidas destacam situações que merecem atenção, com rastreabilidade até o registro de origem.",
        tags: ["conformidade", "monitoramento", "alertas", "tempo real"]
      },
      {
        id: "uc-9",
        question: "Como preparar relatório para investidores ESG?",
        answer: "Configure o referencial aplicável, organize temas, respostas, indicadores, evidências e iniciativas e consolide o relato com revisão e publicação governadas. O Daton apoia diferentes estruturas de reporte, sem prometer pacotes oficiais universais de GRI, CDP, SASB ou TCFD.",
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
        answer: "Use documentos, requisitos, auditorias, fornecedores, indicadores e planos para estruturar a due diligence. A extração assistida ajuda a localizar e mapear evidências com fonte e confiança, mas a avaliação, o scoring e o parecer de M&A permanecem decisões especializadas.",
        tags: ["due diligence", "m&a", "risco", "avaliação"]
      },
      {
        id: "uc-14",
        question: "Como criar plano de ação ESG?",
        answer: "Crie o plano de ação, defina objetivo, responsáveis, prazos, prioridades e evidências e acompanhe sua execução até a verificação de eficácia. Indicadores e iniciativas conectam a ação ao resultado ESG; custos e retorno financeiro continuam no sistema responsável.",
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
        answer: "O Daton AI combina contexto, fontes autorizadas e histórico para explicar variações, resumir evidências e sugerir próximos passos. Em casos delimitados, destaca tendências e anomalias; ações de baixo risco só avançam após prévia e confirmação da pessoa.",
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
        answer: "Cadastre fornecedores, documentos e requisitos, acompanhe homologação, avaliações, pendências e planos de ação e use formulários externos delimitados para coletar informações. O resultado permanece explicável e revisável, sem depender de um score opaco ou de integração específica com compras.",
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
        answer: "Prepare pautas com indicadores, iniciativas, evidências, SWOT e processos; registre reuniões, atas, decisões, responsáveis e ações e conecte a análise crítica ao acompanhamento posterior. Assim, o comitê mantém memória decisória e rastreabilidade.",
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
        answer: "Economia circular busca eliminar desperdícios e poluição, manter produtos e materiais em uso e regenerar sistemas naturais. O Daton registra resíduos e sua destinação, mas não oferece um módulo específico de circularidade.",
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
        answer: "Fluxo de caixa acompanha entradas e saídas de dinheiro em um período. O Daton não possui módulo financeiro; use as exportações disponíveis como insumos para análise no sistema financeiro da organização.",
        tags: ["fluxo de caixa", "liquidez", "financeiro", "gestão"]
      },
      {
        id: "glos-21",
        question: "O que é Conciliação Bancária?",
        answer: "Conciliação bancária compara os registros financeiros da organização com o extrato do banco para identificar diferenças. O Daton não executa essa conciliação; ela deve ser feita no sistema financeiro da organização.",
        tags: ["conciliação", "banco", "contabilidade", "auditoria"]
      },
      {
        id: "glos-22",
        question: "O que é Plano de Contas?",
        answer: "Plano de contas é a estrutura que organiza as contas usadas para classificar os registros contábeis. Sua configuração e manutenção ficam no sistema contábil da organização; o Daton não administra esse cadastro.",
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
        answer: "O regime de competência reconhece receitas e despesas no período em que ocorrem, independentemente do pagamento. O regime de caixa considera o recebimento ou pagamento. Esses controles pertencem ao sistema contábil ou financeiro da organização; o Daton não os executa.",
        tags: ["competência", "caixa", "contabilidade", "regime"]
      }
    ]
  },
  {
    id: "videos",
    title: "Vídeos e Tutoriais",
    icon: "Video",
    description: "Conteúdos de apresentação e orientação",
    questions: [
      {
        id: "vid-1",
        question: "Há um vídeo de apresentação da plataforma?",
        answer: "Esta página ainda não disponibiliza um vídeo de apresentação. Conheça a proposta do Daton nas páginas de soluções e na Central de Ajuda.",
        tags: ["vídeo", "tour", "introdução", "overview"]
      },
      {
        id: "vid-2",
        question: "Há tutorial para o primeiro inventário GEE?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. O conteúdo do primeiro inventário cobre Escopos 1, 2 e 3, fatores versionados, dados de atividade, memória de cálculo, consolidação e revisão.",
        tags: ["vídeo", "inventário", "ghg", "tutorial"]
      },
      {
        id: "vid-3",
        question: "Há tutorial de configuração inicial?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. A configuração inicial abrange ativação, organização, filiais, pessoas, papéis, permissões e primeiros registros.",
        tags: ["vídeo", "configuração", "setup", "admin"]
      },
      {
        id: "vid-4",
        question: "Há tutorial de módulo financeiro?",
        answer: "O Daton não é um ERP financeiro. Custos, contas, bancos, contabilidade e orçamento permanecem no sistema financeiro da organização, enquanto o Daton acompanha a execução operacional e os resultados ESG.",
        tags: ["vídeo", "financeiro", "contabilidade", "tutorial"]
      },
      {
        id: "vid-5",
        question: "Há tutorial do Assistente IA?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. O Assistente IA combina contexto e fontes, extração assistida, explicações, sugestões e ações confirmadas.",
        tags: ["vídeo", "ia", "assistente", "tutorial"]
      },
      {
        id: "vid-6",
        question: "Há tutorial de relatórios GRI?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. A jornada de relato abrange referencial, respostas, evidências, indicadores, consolidação, revisão e publicação governadas.",
        tags: ["vídeo", "gri", "relatório", "sustentabilidade"]
      },
      {
        id: "vid-7",
        question: "Há tutorial de integrações e API?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. Integrações usam importações assistidas e conectores governados por fonte, campos, frequência, autoridade e reconciliação.",
        tags: ["vídeo", "api", "integração", "técnico"]
      },
      {
        id: "vid-8",
        question: "Há tutorial de análise preditiva?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. As análises assistidas cobrem tendências, variações e anomalias delimitadas, com fontes e validação humana, sem forecast genérico.",
        tags: ["vídeo", "preditivo", "análise", "ia"]
      },
      {
        id: "vid-9",
        question: "Há tutorial de personalização do Início?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. A personalização do Início organiza widgets e recortes conforme responsabilidades e acesso.",
        tags: ["vídeo", "dashboard", "customização", "kpi"]
      },
      {
        id: "vid-10",
        question: "Há tutorial de tarefas e aprovações?",
        answer: "Consulte a Central de Ajuda e os canais oficiais para verificar os vídeos publicados. A gestão de ações cobre responsáveis, prazos, prioridades, vínculos, evidências, cobranças e eficácia.",
        tags: ["vídeo", "tarefas", "workflow", "aprovação"]
      },
      {
        id: "vid-11",
        question: "Como acessar material de treinamento?",
        answer: "Consulte a Central de Ajuda para conteúdos por tema. Para dúvidas, problemas ou ideias, use o widget Feedback no painel ou escreva para contato@daton.com.br.",
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
        answer: "Após ativar o voucher, complete os dados da organização, cadastre filiais e estrutura organizacional e configure pessoas, papéis e permissões. Cada pessoa vê somente os módulos e registros autorizados para sua responsabilidade.",
        tags: ["empresa", "configuração", "perfil", "cnpj"],
        relatedQuestions: ["criar-conta", "permissoes"]
      },
      {
        id: "primeiros-passos-login",
        question: "Quais são os primeiros passos após o login?",
        answer: "Confira os dados da organização, cadastre filiais e pessoas, defina permissões e comece pelos processos prioritários da empresa. A Central de Ajuda fica em /app/ajuda.",
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
        answer: "A Central de Ajuda fica em /app/ajuda e organiza orientações por tema. Dúvidas, problemas e ideias também podem ser enviados pelo widget Feedback no menu inferior.",
        tags: ["tutorial", "ajuda", "guia", "vídeos"],
        relatedQuestions: ["primeiros-passos-login", "suporte"]
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard e Visualizações",
    icon: "BarChart3",
    description: "Entenda painéis, indicadores e relatórios governados",
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
        answer: "Cada pessoa organiza os widgets disponíveis para suas responsabilidades e acessos, criando uma visão de trabalho focada em pendências, indicadores e próximos passos.",
        tags: ["dashboard", "widgets", "personalização", "customização"],
        relatedQuestions: ["interpretar-graficos", "dashboards-customizados"]
      },
      {
        id: "exportar-dashboard",
        question: "Como exportar dados do dashboard?",
        answer: "Dashboards se conectam ao catálogo governado de relatórios e exportações. A saída preserva filtros, período, origem e permissão; os formatos dependem do relatório definido, sem promessa universal de PDF, imagem ou planilha.",
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
        answer: "O Daton oferece painéis e widgets governados por domínio, com filtros, métricas e rastreabilidade até a origem. A composição respeita o catálogo aprovado, evitando fórmulas livres sem controle.",
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
        answer: "Use uma visão governada para relacionar indicadores ESG a resultados financeiros autorizados, preservando fonte, período e critérios de acesso. Transações e contabilidade permanecem no sistema financeiro responsável, enquanto a publicação e a interpretação dos dados passam por revisão humana.",
        tags: ["esg", "financeiro", "dashboard", "análise", "impacto"],
        relatedQuestions: ["dashboard-financeiro", "integracao-financeiro-esg"]
      },
      {
        id: "customizar-kpis",
        question: "Como customizar KPIs no dashboard?",
        answer: "Defina indicadores, metas, fórmulas e dimensões conforme o domínio e use-os em painéis e relatórios governados. Cada KPI mantém regra, fonte, período e responsável para que o resultado seja reproduzível.",
        tags: ["kpi", "customização", "métricas", "indicadores", "fórmulas"],
        relatedQuestions: ["metricas-automaticas", "dashboards-customizados"]
      },
      {
        id: "compartilhar-dashboards",
        question: "Como compartilhar dashboards com stakeholders?",
        answer: "Distribua relatórios e painéis pelos canais e formatos aprovados, preservando filtros, permissões e rastreabilidade. Compartilhamento público irrestrito e incorporação genérica não fazem parte da oferta.",
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
        answer: "No módulo Clima, cadastre a fonte, classifique-a no escopo e na categoria aplicável, selecione ou registre o fator versionado e informe os dados de atividade.",
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
        answer: "Use importação assistida com modelo, prévia, rejeitos, confirmação e reversão. Quando a origem for documental, o Daton pode propor o mapeamento com trecho de origem e confiança para revisão humana, sem depender de uma tecnologia OCR específica.",
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
        answer: "Registre projetos e iniciativas de redução ou compensação com objetivos, responsáveis, indicadores, evidências e relação com o inventário. Emissões brutas, reduções e compensações permanecem separadas; o Daton não atua como mercado de créditos.",
        tags: ["projetos", "compensação", "créditos", "redução"],
        relatedQuestions: ["metas", "relatorios-inventario"]
      },
      {
        id: "relatorios-inventario",
        question: "Como gerar relatórios de inventário?",
        answer: "Consolide cálculos, memória, fatores, fontes, períodos e totais por escopo em relatórios reproduzíveis. A revisão preserva a linhagem dos dados e prepara o inventário para validação e divulgação governada.",
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
        answer: "No módulo Resíduos, cadastre o tipo de resíduo, sua classificação, unidade, origem e demais campos definidos pela empresa.",
        tags: ["resíduos", "cadastro", "tipos", "classificação"],
        relatedQuestions: ["destinacao-residuos", "pgrs"]
      },
      {
        id: "destinacao-residuos",
        question: "Como registrar destinação de resíduos?",
        answer: "Registre o lançamento, a quantidade, a destinação e o responsável aplicável e anexe MTR e CDF quando disponíveis. Pendências e cobranças conectam prazos e responsabilidades ao acompanhamento do processo.",
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
        answer: "Cadastre transportadores e destinadores como fornecedores, controle documentos, homologação e avaliações e relacione-os aos registros de resíduos. O portal apoia solicitações e envio de documentos; integrações operacionais dependem de contrato específico.",
        tags: ["fornecedores", "transportadores", "licenças", "gestão"],
        relatedQuestions: ["destinacao-residuos", "licenciamento"]
      },
      {
        id: "relatorios-residuos",
        question: "Quais relatórios de resíduos estão disponíveis?",
        answer: "Acompanhe geração, classificação, destinação, fornecedores, MTRs, CDFs, metas e indicadores em relatórios governados. Cada número mantém vínculo com os lançamentos e documentos que o sustentam.",
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
        answer: "Cadastre licenças e documentos regulatórios com órgão, número, datas, filial, anexos, condicionantes, obrigações recorrentes e requisitos relacionados.",
        tags: ["licenças", "cadastro", "lo", "li", "lp"],
        relatedQuestions: ["tipos-licenca", "alertas-vencimento"]
      },
      {
        id: "acompanhar-prazos",
        question: "Como acompanhar prazos de renovação?",
        answer: "Acompanhe vencimentos, condicionantes e obrigações em pendências, painéis e cobranças configuradas por responsabilidade e frequência.",
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
        answer: "Use a área de anexos do registro para incluir as evidências autorizadas. Formatos e tamanhos seguem o contrato apresentado no envio; a oferta não pressupõe arquivos ou armazenamento ilimitados.",
        tags: ["documentos", "anexos", "upload", "arquivos"],
        relatedQuestions: ["cadastrar-licencas", "upload-documentos"]
      },
      {
        id: "alertas-vencimento",
        question: "Como receber alertas de vencimento?",
        answer: "Configure cobranças por responsabilidade, canal e frequência para acompanhar vencimentos e obrigações. Os avisos seguem a regra definida pela organização, em vez de uma sequência fixa universal.",
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
        answer: "Crie metas ESG com indicador, linha de base, alvo, período, unidade, responsável e método de consolidação. O Daton mantém o cálculo reproduzível e conecta a meta a iniciativas, planos e evidências.",
        tags: ["metas", "objetivos", "esg", "kpi"],
        relatedQuestions: ["acompanhar-progresso", "tipos-metas"]
      },
      {
        id: "acompanhar-progresso",
        question: "Como acompanhar progresso de metas?",
        answer: "Acompanhe realizado, alvo, período, tendência e ações relacionadas em uma visão reproduzível. O Daton explica a origem dos valores e destaca variações que merecem revisão.",
        tags: ["progresso", "acompanhamento", "status", "monitoramento"],
        relatedQuestions: ["criar-metas", "relatorios-metas"]
      },
      {
        id: "tipos-metas",
        question: "Quais tipos de metas posso definir?",
        answer: "Defina metas ambientais, sociais, de governança, qualidade ou operação usando indicadores, unidades e períodos adequados. A estrutura é transversal, mas cada meta preserva a regra do domínio que a sustenta.",
        tags: ["tipos", "categorias", "ambiental", "social", "governança"],
        relatedQuestions: ["criar-metas", "vincular-indicadores"]
      },
      {
        id: "vincular-indicadores",
        question: "Como vincular metas a indicadores?",
        answer: "Associe a meta ao indicador que representa seu resultado, documente linha de base, fórmula, alvo e período e conecte iniciativas e ações responsáveis pela evolução.",
        tags: ["indicadores", "kpi", "métricas", "vinculação"],
        relatedQuestions: ["criar-metas", "acompanhar-progresso"]
      },
      {
        id: "relatorios-metas",
        question: "Como gerar relatórios de metas?",
        answer: "Consolide metas, realizado, desvios, responsáveis e ações em relatórios governados, com filtros por período, unidade e tema e rastreabilidade até os dados de origem.",
        tags: ["relatórios", "análise", "exportar", "consolidado"],
        relatedQuestions: ["acompanhar-progresso", "criar-metas"]
      },
      {
        id: "metas-financeiras-esg",
        question: "Como criar metas financeiras ESG?",
        answer: "Defina a meta ESG e seus indicadores reproduzíveis no Daton e relacione resultados financeiros autorizados por uma integração governada. Orçamento, contabilidade e transações permanecem no sistema financeiro responsável.",
        tags: ["metas", "financeiro", "esg", "roi", "investimento"],
        relatedQuestions: ["criar-metas", "roi-projetos-esg"]
      },
      {
        id: "analise-preditiva-metas",
        question: "Como a análise preditiva ajuda no atingimento de metas?",
        answer: "O Daton apoia metas com tendências, explicações de variação e anomalias em casos delimitados. Não promete uma probabilidade universal de atingimento, forecast genérico ou recomendação automática sem critérios definidos.",
        tags: ["preditivo", "ia", "análise", "previsão", "probabilidade"],
        relatedQuestions: ["acompanhar-progresso", "analise-preditiva"]
      },
      {
        id: "roi-metas",
        question: "Como calcular ROI de metas ESG?",
        answer: "Calcule e valide custos, benefícios e premissas no sistema financeiro responsável. Os resultados autorizados podem alimentar o Daton por integração governada para contextualizar metas e indicadores; a plataforma não substitui o cálculo financeiro de ROI, payback, TIR ou VPL.",
        tags: ["roi", "retorno", "investimento", "análise", "financeiro"],
        relatedQuestions: ["metas-financeiras-esg", "roi-projetos-esg"]
      },
      {
        id: "metas-smart",
        question: "Como criar metas SMART?",
        answer: "Estruture metas específicas, mensuráveis, atribuídas, relevantes e temporais, com indicador, linha de base, alvo, responsável e prazo. O registro desses critérios preserva a rastreabilidade do acompanhamento.",
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
        answer: "Cadastre pessoas e organizações interessadas uma vez, classifique sua relação e reutilize o vínculo nos processos, comunicações, formulários e evidências aplicáveis.",
        tags: ["stakeholders", "partes interessadas", "cadastro", "grupos"],
        relatedQuestions: ["analise-materialidade", "engajamento"]
      },
      {
        id: "analise-materialidade",
        question: "Como realizar análise de materialidade?",
        answer: "Configure temas e critérios, distribua formulários externos aos públicos delimitados, consolide respostas e evidências e registre a decisão de materialidade com revisão humana.",
        tags: ["materialidade", "análise", "temas", "pesquisa"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "engajamento",
        question: "Como gerenciar engajamento de stakeholders?",
        answer: "Organize partes interessadas, campanhas, públicos, confirmações de leitura, formulários e ações decorrentes. O Daton preserva o histórico do engajamento sem inferir sentimento ou opinião não declarada.",
        tags: ["engajamento", "comunicação", "relacionamento", "plano"],
        relatedQuestions: ["cadastrar-stakeholders", "pesquisas"]
      },
      {
        id: "pesquisas",
        question: "Como enviar pesquisas de materialidade?",
        answer: "Crie formulários externos delimitados para o processo de materialidade, defina público, período e perguntas e consolide as respostas com rastreabilidade até a análise e a decisão final.",
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
        answer: "Registre a não conformidade, descreva causa e contenção, associe responsáveis e plano de ação e acompanhe evidências e verificação de eficácia até o encerramento.",
        tags: ["não conformidade", "nc", "qualidade", "causa raiz"],
        relatedQuestions: ["planos-acao", "auditorias"]
      },
      {
        id: "planos-acao",
        question: "Como criar planos de ação (5W2H)?",
        answer: "Crie o plano no contexto do registro, defina responsável, prazo, prioridade, ações e evidências e acompanhe status e eficácia. Custos e retorno financeiro permanecem no sistema responsável.",
        tags: ["plano de ação", "5w2h", "ações", "correção"],
        relatedQuestions: ["nao-conformidades", "auditorias"]
      },
      {
        id: "auditorias",
        question: "Como gerenciar auditorias?",
        answer: "Planeje programas, auditorias e checklists, defina objeto e equipe, registre constatações e abra não conformidades e planos de ação com rastreabilidade.",
        tags: ["auditoria", "iso 9001", "checklist", "conformidade"],
        relatedQuestions: ["nao-conformidades", "planos-acao"]
      },
      {
        id: "controle-documentos-sgq",
        question: "Como controlar documentos do SGQ?",
        answer: "Controle documentos, versões, aprovações, acessos e vigência. A extração assistida pode propor campos e correspondências com fonte e confiança, sempre para revisão humana antes da confirmação.",
        tags: ["documentos", "procedimentos", "controle", "versão"],
        relatedQuestions: ["mapear-processos", "auditorias"]
      },
      {
        id: "avaliar-fornecedores",
        question: "Como avaliar fornecedores?",
        answer: "Defina critérios de homologação e avaliação, acompanhe documentos, requisitos, resultados e planos de ação e colete informações por formulários delimitados. Integrações com compras dependem de contrato específico.",
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
        answer: "Gerencie colaboradores, contas, cargos, competências, lacunas, treinamentos e planos de desenvolvimento. Folha, ponto, recrutamento e um LMS completo permanecem nos sistemas especializados.",
        tags: ["colaboradores", "funcionários", "rh", "gestão"],
        relatedQuestions: ["treinamentos", "seguranca-trabalho"]
      },
      {
        id: "treinamentos",
        question: "Como registrar treinamentos?",
        answer: "Cadastre treinamentos, turmas, participantes e conclusões, preserve cargo e instrutor do evento, avalie eficácia, emita certificados e conecte o resultado às competências e ao PDI.",
        tags: ["treinamentos", "capacitação", "desenvolvimento", "certificados"],
        relatedQuestions: ["gerenciar-funcionarios", "pdi"]
      },
      {
        id: "seguranca-trabalho",
        question: "Como acompanhar segurança do trabalho?",
        answer: "Conecte inspeções, ambiente operacional, ocorrências, treinamentos e planos de ação para acompanhar controles relacionados à segurança. O Daton não substitui um sistema completo de SST ou saúde ocupacional.",
        tags: ["segurança", "sst", "acidentes", "epi"],
        relatedQuestions: ["gerenciar-funcionarios", "treinamentos"]
      },
      {
        id: "ponto-frequencia",
        question: "Como gerenciar ponto e frequência?",
        answer: "Ponto, frequência, banco de horas e folha permanecem no sistema de RH. Quando houver integração aprovada, a troca de dados segue contrato de campos, fonte, frequência e autoridade, sem duplicar o controle no Daton.",
        tags: ["ponto", "frequência", "absenteísmo", "horas extras"],
        relatedQuestions: ["gerenciar-funcionarios", "integracoes"]
      },
      {
        id: "pdi",
        question: "Como criar PDIs (Planos de Desenvolvimento)?",
        answer: "Crie o PDI a partir de cargo, competências e lacunas, defina objetivos, ações de desenvolvimento, responsáveis, prazos e treinamentos e acompanhe sua evolução e eficácia.",
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
        answer: "Registre riscos e oportunidades com contexto, probabilidade, impacto, controles, responsáveis e ações. Análises assistidas podem explicar variações e inconsistências em casos delimitados, sem substituir os critérios e a decisão da organização.",
        tags: ["riscos", "matriz", "criticidade", "controles"],
        relatedQuestions: ["compliance", "matriz-riscos"]
      },
      {
        id: "compliance",
        question: "Como garantir compliance?",
        answer: "Organize legislações, requisitos, aplicabilidade, licenças, condicionantes, obrigações, responsáveis, evidências e pendências. O Daton apoia o controle e a decisão, sem garantir conformidade jurídica.",
        tags: ["compliance", "regulatório", "leis", "normas"],
        relatedQuestions: ["gerenciar-riscos", "politicas"]
      },
      {
        id: "politicas",
        question: "Como gerenciar políticas internas?",
        answer: "Controle políticas, versões, aprovações, acessos e vigência e use comunicações para distribuir o conteúdo e registrar confirmação de leitura. Assinatura digital depende de solução ou integração específica.",
        tags: ["políticas", "código de conduta", "governança", "distribuição"],
        relatedQuestions: ["compliance", "controle-documentos-sgq"]
      },
      {
        id: "matriz-riscos",
        question: "Como configurar matriz de riscos?",
        answer: "Configure escalas e critérios, registre probabilidade, impacto, controles, responsáveis e ações e acompanhe mudanças ao longo do tempo. Explicações assistidas preservam a fonte e não substituem a avaliação humana.",
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
        answer: "Cadastre documentos, versões, aprovações, vigência e acessos e anexe evidências aos registros relacionados. A extração assistida propõe dados com origem e confiança para revisão antes da confirmação.",
        tags: ["upload", "documentos", "arquivos", "importação"],
        relatedQuestions: ["extracao-ia", "formatos-aceitos"]
      },
      {
        id: "extracao-ia",
        question: "Como funciona a extração IA de dados?",
        answer: "A extração assistida identifica trechos relevantes e propõe campos ou correspondências com fonte, confiança e explicação. A pessoa revisa lado a lado, corrige e confirma antes que qualquer dado seja persistido.",
        tags: ["ia", "extração", "ocr", "automação"],
        relatedQuestions: ["upload-documentos", "revisar-extracoes"]
      },
      {
        id: "revisar-extracoes",
        question: "Como revisar extrações automáticas?",
        answer: "Compare documento, trecho de origem e valor proposto, avalie a confiança, corrija o que for necessário e confirme somente os dados validados. A revisão humana é parte obrigatória do fluxo.",
        tags: ["revisão", "validação", "extração", "conferência"],
        relatedQuestions: ["extracao-ia", "upload-documentos"]
      },
      {
        id: "importar-planilhas",
        question: "Como importar dados via planilha?",
        answer: "Baixe ou associe o modelo do destino, envie a planilha, revise o mapeamento sugerido, confira a prévia e os rejeitos e confirme o lote. O processo preserva linhagem e permite reversão controlada.",
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
        answer: "Organize documentos por tipo, processo, versão, vigência, responsável e vínculos com registros. Busca, permissões e histórico ajudam a localizar a evidência correta sem perder seu contexto.",
        tags: ["pastas", "organização", "estrutura", "categorias"],
        relatedQuestions: ["upload-documentos", "buscar-documentos"]
      },
      {
        id: "upload-documentos-financeiros",
        question: "Como fazer upload de documentos financeiros?",
        answer: "Documentos financeiros permanecem no sistema responsável pelo processo contábil ou transacional. Quando um tipo documental fizer parte de um contrato de integração, o Daton pode receber campos e evidências autorizados com origem, confiança e confirmação humana, sem prometer OCR ou formatos universais.",
        tags: ["financeiro", "documentos", "notas fiscais", "upload", "ia"],
        relatedQuestions: ["extracao-ia-notas-fiscais", "upload-documentos"]
      },
      {
        id: "extracao-ia-notas-fiscais",
        question: "Como funciona a extração IA de notas fiscais?",
        answer: "A extração documental assistida pode propor campos quando o tipo documental estiver definido no processo, sempre com trecho de origem, confiança e confirmação humana. A oferta não garante nota fiscal, OCR ou precisão universal sem contrato específico.",
        tags: ["ia", "notas fiscais", "extração", "nfe", "automação"],
        relatedQuestions: ["upload-documentos-financeiros", "extracao-ia"]
      },
      {
        id: "ocr-documentos",
        question: "Como funciona o OCR de documentos?",
        answer: "O Daton usa extração documental assistida orientada a fonte, confiança e revisão humana. A capacidade não depende da promessa de uma tecnologia OCR específica nem dispensa a validação da pessoa.",
        tags: ["ocr", "reconhecimento", "digitalização", "scanner", "ia"],
        relatedQuestions: ["extracao-ia", "upload-documentos"]
      },
      {
        id: "validacao-automatica-dados",
        question: "Como funciona a validação automática de dados?",
        answer: "Campos, regras e contratos validam formato, obrigatoriedade e consistência; importações exibem prévia e rejeitos. Em casos delimitados, análises assistidas destacam anomalias com explicação, sem validar automaticamente a veracidade de um documento.",
        tags: ["validação", "dados", "qualidade", "consistência", "automação"],
        relatedQuestions: ["revisar-extracoes", "importar-planilhas"]
      }
    ]
  },
  {
    id: "relatorios",
    title: "Relatórios Integrados",
    icon: "FileBarChart",
    description: "Relatórios, revisão, publicação e exportações",
    questions: [
      {
        id: "relatorios-disponiveis",
        question: "Quais relatórios estão disponíveis?",
        answer: "O catálogo governado reúne relatórios operacionais, gerenciais, ESG, qualidade e conformidade, com filtros, linhagem, qualidade e acesso controlado. Referenciais específicos são configurados conforme a necessidade da organização.",
        tags: ["relatórios", "gri", "tcfd", "padrões", "frameworks"],
        relatedQuestions: ["gerar-relatorio", "indicadores-gri"]
      },
      {
        id: "gerar-relatorio",
        question: "Como gerar relatório de sustentabilidade?",
        answer: "Organize referenciais, temas, respostas, indicadores, evidências e iniciativas, consolide o conteúdo e conduza revisão e publicação governadas. O Daton não substitui a interpretação oficial nem fornece pacote universal de um padrão específico.",
        tags: ["relatórios", "sustentabilidade", "gerar", "exportar"],
        relatedQuestions: ["relatorios-disponiveis", "personalizar-templates"]
      },
      {
        id: "exportar-pdf",
        question: "Como exportar relatórios em PDF?",
        answer: "Escolha o relatório e a saída definida no catálogo governado. Formatos, filtros e distribuição seguem o contrato de cada relatório; PDF não é uma promessa universal para toda tela.",
        tags: ["exportar", "pdf", "download", "publicar"],
        relatedQuestions: ["gerar-relatorio", "personalizar-templates"]
      },
      {
        id: "personalizar-templates",
        question: "Como personalizar templates de relatórios?",
        answer: "Defina modelos governados com seções, campos, filtros e identidade aprovados para cada finalidade. A personalização preserva consistência, revisão e linhagem, em vez de um editor irrestrito de layout.",
        tags: ["templates", "personalização", "layout", "design"],
        relatedQuestions: ["gerar-relatorio", "exportar-pdf"]
      },
      {
        id: "indicadores-gri",
        question: "Quais indicadores GRI são cobertos?",
        answer: "Cadastre os conteúdos e indicadores aplicáveis como um referencial da organização, conecte dados e evidências e acompanhe completude e revisão. O Daton não promete um pacote GRI oficial ou universal.",
        tags: ["gri", "indicadores", "standards", "esg"],
        relatedQuestions: ["relatorios-disponiveis", "gerar-relatorio"]
      },
      {
        id: "relatorios-financeiros-integrados",
        question: "O que são relatórios financeiros integrados?",
        answer: "Relatórios integrados conectam resultados financeiros validados a indicadores, iniciativas e evidências ESG. O sistema financeiro continua responsável por transações e contabilidade; uma integração governada traz os dados autorizados para consolidação, revisão humana e publicação controlada no Daton.",
        tags: ["relatórios", "financeiro", "integrado", "esg", "ir"],
        relatedQuestions: ["gerar-relatorio", "dashboard-esg-financeiro"]
      },
      {
        id: "exportar-multiplos-formatos",
        question: "Em quais formatos posso exportar relatórios?",
        answer: "Cada relatório declara formatos, filtros, versão e regras de acesso no catálogo governado. A oferta não garante PDF, Word, PowerPoint, HTML ou iXBRL para todos os conteúdos.",
        tags: ["exportar", "formatos", "pdf", "excel", "word", "html"],
        relatedQuestions: ["exportar-pdf", "gerar-relatorio"]
      },
      {
        id: "agendar-relatorios",
        question: "Como agendar envio automático de relatórios?",
        answer: "Defina o relatório, os filtros, a periodicidade, o público e o canal aprovado. A distribuição programada preserva permissões, versão e rastreabilidade.",
        tags: ["agendamento", "automação", "relatórios", "envio", "e-mail"],
        relatedQuestions: ["gerar-relatorio", "compartilhar-dashboards"]
      },
      {
        id: "relatorios-comparativos",
        question: "Como gerar relatórios comparativos ano a ano?",
        answer: "Compare períodos, unidades e recortes com a mesma regra de cálculo e rastreie cada resultado até sua origem. O catálogo governado preserva versão, filtros e linhagem para tornar a comparação reproduzível.",
        tags: ["comparativo", "análise", "temporal", "evolução", "tendências"],
        relatedQuestions: ["gerar-relatorio", "dashboards-customizados"]
      }
    ]
  },
  {
    id: "formularios",
    title: "Formulários Customizados",
    icon: "ClipboardList",
    description: "Modelos internos e externos com respostas versionadas",
    questions: [
      {
        id: "criar-formularios",
        question: "Como criar formulários próprios?",
        answer: "Crie modelos internos versionados com campos, regras e vínculos ao processo. Cada resposta preserva a versão usada e pode alimentar registros e relatórios com rastreabilidade.",
        tags: ["formulários", "pesquisas", "criação", "editor"],
        relatedQuestions: ["tipos-campos", "compartilhar-formularios"]
      },
      {
        id: "compartilhar-formularios",
        question: "Como compartilhar formulários externamente?",
        answer: "Distribua formulários externos somente para públicos e processos aprovados, com período, finalidade e regras definidos. A oferta não pressupõe link público irrestrito, QR Code ou iframe genérico.",
        tags: ["compartilhar", "link", "público", "externo"],
        relatedQuestions: ["criar-formularios", "analisar-respostas"]
      },
      {
        id: "analisar-respostas",
        question: "Como analisar respostas de formulários?",
        answer: "Consolide respostas por formulário, versão, período e público, exporte os dados autorizados e conecte os resultados ao processo, à evidência e à decisão correspondente.",
        tags: ["respostas", "análise", "estatísticas", "dashboard"],
        relatedQuestions: ["compartilhar-formularios", "criar-formularios"]
      },
      {
        id: "tipos-campos",
        question: "Quais tipos de campos são suportados?",
        answer: "Use campos e regras definidos no construtor, com versões imutáveis após publicação. A estrutura pode atender formulários internos e externos delimitados, preservando o contexto de cada resposta.",
        tags: ["campos", "tipos", "perguntas", "opções"],
        relatedQuestions: ["criar-formularios", "validacoes"]
      }
    ]
  },
  {
    id: "integracoes",
    title: "Integrações e API",
    icon: "Plug",
    description: "Importações e integrações governadas por contrato",
    questions: [
      {
        id: "integracoes-disponiveis",
        question: "Quais integrações estão disponíveis?",
        answer: "O Daton combina importações assistidas, conectores, webhooks e rotinas governadas. Cada integração nasce de um contrato com sistema, campos, fonte, frequência, autoridade, idempotência, retentativas e reconciliação; marcas específicas dependem do escopo contratado.",
        tags: ["integrações", "api", "erp", "conectores"],
        relatedQuestions: ["api-integracao", "automatizar-coleta"]
      },
      {
        id: "conectar-sistemas",
        question: "Como conectar sistemas externos?",
        answer: "Defina o sistema de origem, campos, frequência, autoridade e tratamento de falhas. O conector aprovado registra idempotência, retentativas, reconciliação e trilha de execução para manter os dados confiáveis.",
        tags: ["conexão", "sistemas", "sincronização", "configuração"],
        relatedQuestions: ["integracoes-disponiveis", "api-integracao"]
      },
      {
        id: "api-integracao",
        question: "Existe API para integração?",
        answer: "As integrações são oferecidas por contratos e conectores governados conforme o caso de uso. O produto não pressupõe uma API pública ou OAuth universal; interfaces e credenciais são definidas para cada sistema aprovado.",
        tags: ["api", "rest", "documentação", "endpoints"],
        relatedQuestions: ["integracoes-disponiveis", "automatizar-coleta"]
      },
      {
        id: "automatizar-coleta",
        question: "Como automatizar coleta de dados?",
        answer: "Automatize a coleta com conectores aprovados ou use importação assistida quando essa for a melhor fonte. Frequência, autoridade, validação, retentativas e reconciliação são definidas por contrato, sem prometer ERP, concessionária, IoT ou marca específica.",
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
        answer: "A política de continuidade define backups, restauração, responsabilidades e critérios de recuperação. Periodicidade, retenção, testes e objetivos de recuperação estão sujeitos a definição e validação na política e no contrato aplicáveis ao ambiente.",
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
    title: "Dados Financeiros e ESG",
    icon: "DollarSign",
    description: "Fronteiras transacionais e integração governada",
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
        answer: "Mantenha despesas e transações no sistema financeiro autoritativo. Uma integração governada pode trazer o identificador e o resultado autorizado, com fonte e período, para relacioná-los à iniciativa ESG e compor análises e relatos sob revisão humana.",
        tags: ["esg", "despesas", "categorização", "projetos"],
        relatedQuestions: ["centros-custo-esg", "roi-projetos-esg"]
      },
      {
        id: "roi-projetos-esg",
        question: "Como calcular o ROI de projetos ESG?",
        answer: "Calcule e valide custos, benefícios e premissas no sistema financeiro responsável. Uma integração governada pode trazer o resultado autorizado para relacioná-lo à iniciativa, aos indicadores e às evidências no Daton; a plataforma não substitui o cálculo financeiro de ROI.",
        tags: ["roi", "retorno", "análise", "investimentos"],
        relatedQuestions: ["vincular-despesas-esg", "centros-custo-esg"]
      },
      {
        id: "alertas-financeiros",
        question: "O que são alertas financeiros inteligentes?",
        answer: "O Daton não emite alertas financeiros, de caixa ou de vencimento de contas. Seus alertas e cobranças acompanham prazos, obrigações e ações dos processos operacionais.",
        tags: ["alertas", "notificações", "monitoramento", "inteligência"],
        relatedQuestions: ["fluxo-aprovacoes-financeiro", "fluxo-caixa-previsao"]
      },
      {
        id: "exportar-gri-financeiro",
        question: "Como exportar dados financeiros para GRI?",
        answer: "Mantenha os dados contábeis no sistema autoritativo e disponibilize resultados validados ao Daton por uma integração governada. Relacione-os às divulgações configuradas, consolide o conteúdo e submeta o relato à revisão humana segundo o referencial adotado.",
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
        answer: "Mantenha transações e contabilidade no sistema financeiro autoritativo. Uma integração governada traz resultados autorizados, com fonte, período e regra de autoridade, para relacioná-los a indicadores, iniciativas e divulgações e compor o relato sob revisão humana.",
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
    description: "Contexto, fontes, análises e ações confirmadas",
    questions: [
      {
        id: "usar-assistente-ia",
        question: "Como usar o Assistente IA do Daton?",
        answer: "Converse em linguagem natural com um assistente contextual que apresenta fontes, limites e explicações. Ele consulta dados autorizados, sugere próximos passos e só executa ações de baixo risco depois de mostrar a prévia e receber confirmação.",
        tags: ["ia", "assistente", "chat", "ajuda"],
        relatedQuestions: ["tipos-perguntas-ia", "analise-contextual"]
      },
      {
        id: "tipos-perguntas-ia",
        question: "Que tipos de perguntas posso fazer à IA?",
        answer: "Pergunte por registros, contagens, resumos, tendências, variações, evidências e próximos passos dentro do seu acesso. O assistente também apoia extração documental e ações confirmadas, sempre com fonte e limites explícitos.",
        tags: ["perguntas", "comandos", "queries", "consultas"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "upload-documentos-ia",
        question: "Como fazer upload de documentos para análise?",
        answer: "Associe o documento ao processo aplicável. O assistente identifica trechos e propõe campos com origem e confiança; a pessoa revisa, corrige e confirma antes de persistir os dados.",
        tags: ["upload", "documentos", "ocr", "extração"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-dados-acesso"]
      },
      {
        id: "analise-contextual",
        question: "O que é análise contextual por página?",
        answer: "A análise contextual considera a página ou o registro em foco, o histórico relevante e as fontes autorizadas. A resposta mostra de onde veio a informação, explicita limites e evita misturar organizações ou permissões.",
        tags: ["contexto", "página", "inteligência", "adaptação"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      },
      {
        id: "analises-preditivas-ia",
        question: "Como pedir análises preditivas?",
        answer: "Peça explicações de variações, tendências e anomalias nos casos cobertos pelo produto. O Daton não promete previsão genérica, probabilidade universal, simulação livre ou um modelo de machine learning sem contrato de dados e avaliação próprios.",
        tags: ["limites da ia", "previsão", "consulta", "tendências"],
        relatedQuestions: ["ia-calcula-previsoes", "insights-proativos"]
      },
      {
        id: "ia-analisa-dados-financeiros",
        question: "Quais dados financeiros a IA pode analisar?",
        answer: "A IA pode explicar e relacionar resultados financeiros autorizados que tenham sido disponibilizados por integração governada, sempre dentro das permissões e com indicação das fontes. Ela não substitui contabilidade, conciliação bancária, orçamento nem decisões financeiras da organização.",
        tags: ["financeiro", "análise", "dados", "transações"],
        relatedQuestions: ["tipos-perguntas-ia", "analises-preditivas-ia"]
      },
      {
        id: "ia-calcula-previsoes",
        question: "Como a IA calcula previsões de emissões?",
        answer: "O Daton explica variações e detecta anomalias em casos climáticos delimitados, com fontes e validação. A oferta não inclui forecast universal de emissões nem intervalos de confiança sem método, dados e avaliação específicos.",
        tags: ["emissões", "previsão", "algoritmo", "metodologia"],
        relatedQuestions: ["analises-preditivas-ia", "precisao-previsoes"]
      },
      {
        id: "insights-proativos",
        question: "O que são insights proativos?",
        answer: "Insights proativos destacam variações, tendências, anomalias e pendências relevantes, explicam as fontes e sugerem próximos passos. A pessoa mantém o controle sobre a decisão e confirma qualquer ação proposta.",
        tags: ["insights", "proativo", "alertas", "recomendações"],
        relatedQuestions: ["analises-preditivas-ia", "ia-identifica-riscos"]
      },
      {
        id: "ia-identifica-riscos",
        question: "Como a IA identifica riscos de conformidade?",
        answer: "O assistente reúne requisitos, prazos, evidências e inconsistências para explicar situações de risco em casos delimitados. Ele não declara conformidade jurídica nem substitui os critérios e a decisão da organização.",
        tags: ["riscos", "conformidade", "scoring", "alertas"],
        relatedQuestions: ["insights-proativos", "scoring-risco-licencas"]
      },
      {
        id: "relatorios-customizados-ia",
        question: "Posso pedir relatórios customizados à IA?",
        answer: "Peça ao assistente uma composição baseada em fontes autorizadas e encaminhe o conteúdo ao catálogo governado de relatórios para revisão, versão e publicação. A saída final respeita os formatos e controles definidos para cada relatório.",
        tags: ["relatórios", "customização", "geração", "exportação"],
        relatedQuestions: ["tipos-perguntas-ia", "ia-analisa-dados-financeiros"]
      },
      {
        id: "ia-probabilidade-metas",
        question: "Como a IA analisa probabilidade de atingir metas?",
        answer: "O Daton relaciona metas, realizado, tendências, variações e ações para apoiar a decisão. Não promete uma probabilidade universal de atingimento ou forecast genérico sem método e avaliação específicos.",
        tags: ["metas", "probabilidade", "previsão", "análise"],
        relatedQuestions: ["analises-preditivas-ia", "insights-proativos"]
      },
      {
        id: "ia-dados-acesso",
        question: "A IA tem acesso a todos os meus dados?",
        answer: "Não. O assistente respeita organização, papel, módulo, filial e demais permissões da pessoa. Cada consulta e ação usa somente fontes autorizadas e mantém rastreabilidade do contexto utilizado.",
        tags: ["privacidade", "segurança", "acesso", "lgpd"],
        relatedQuestions: ["usar-assistente-ia", "upload-documentos-ia"]
      },
      {
        id: "scoring-risco-licencas",
        question: "Como funciona o scoring de risco de licenças?",
        answer: "O Daton organiza prazos, requisitos, evidências e inconsistências e pode explicar sinais de risco em casos delimitados. Não produz um score genérico nem uma declaração automática de conformidade.",
        tags: ["licenças", "risco", "score", "conformidade"],
        relatedQuestions: ["ia-identifica-riscos", "insights-proativos"]
      },
      {
        id: "ia-ferramentas-acesso",
        question: "Quais ferramentas/tools a IA tem acesso?",
        answer: "O assistente usa um catálogo governado de consultas, extrações, análises e ações de baixo risco. Cada ferramenta declara fonte, permissão e limite; ações mostram prévia, exigem confirmação e registram o resultado.",
        tags: ["ferramentas", "tools", "capacidades", "funções"],
        relatedQuestions: ["tipos-perguntas-ia", "relatorios-customizados-ia"]
      },
      {
        id: "melhorar-respostas-ia",
        question: "Como melhorar a qualidade das respostas da IA?",
        answer: "Informe domínio, período, unidade e recorte, use nomes presentes nos cadastros e peça uma análise por vez. Confira as fontes apresentadas e confirme ações somente depois de revisar a prévia.",
        tags: ["qualidade", "otimização", "dicas", "treinamento"],
        relatedQuestions: ["usar-assistente-ia", "tipos-perguntas-ia"]
      }
    ]
  },
  {
    id: "gestao-tarefas",
    title: "Gestão de Tarefas",
    icon: "CheckSquare",
    description: "Ações, responsáveis, prazos e acompanhamento",
    questions: [
      {
        id: "criar-tarefa",
        question: "Como criar uma nova tarefa?",
        answer: "Crie uma ação no contexto do plano, desvio, auditoria, meta, reunião ou iniciativa correspondente, com responsável, prazo, prioridade, evidências e critério de conclusão.",
        tags: ["tarefas", "criar", "novo", "atividades"],
        relatedQuestions: ["definir-prioridades", "atribuir-responsaveis"]
      },
      {
        id: "definir-prioridades",
        question: "Como definir prioridades de tarefas?",
        answer: "Defina prioridade segundo impacto, urgência, prazo e contexto do processo. O Daton preserva o critério e ajuda a ordenar pendências sem substituir a decisão da equipe.",
        tags: ["prioridades", "urgência", "classificação", "níveis"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "workflow-aprovacao-tarefas",
        question: "Como funciona o workflow de aprovação?",
        answer: "Ações seguem estados, papéis e aprovações previstos no processo de origem. Transições e decisões ficam registradas para que a execução seja rastreável.",
        tags: ["workflow", "aprovação", "processos", "governança"],
        relatedQuestions: ["criar-tarefa", "atribuir-responsaveis"]
      },
      {
        id: "atribuir-responsaveis",
        question: "Como atribuir responsáveis?",
        answer: "Selecione uma pessoa ativa e autorizada da mesma organização. O Daton valida a elegibilidade, registra a atribuição e conecta o responsável às cobranças e ao histórico da ação.",
        tags: ["responsáveis", "atribuição", "delegação", "usuários"],
        relatedQuestions: ["criar-tarefa", "workflow-aprovacao-tarefas"]
      },
      {
        id: "configurar-prazos-lembretes",
        question: "Como configurar prazos e lembretes?",
        answer: "Defina o prazo no plano, ação ou registro correspondente e configure quem será cobrado, por qual canal e com que frequência. A cobrança preserva o contexto e a responsabilidade da pendência.",
        tags: ["prazos", "lembretes", "notificações", "alertas"],
        relatedQuestions: ["criar-tarefa", "tarefas-atrasadas"]
      },
      {
        id: "tags-tarefas",
        question: "O que são tags de tarefas?",
        answer: "Tags são classificações controladas que ajudam a agrupar ações por tema, processo ou iniciativa. Use o vocabulário definido pela organização para manter filtros e relatórios consistentes.",
        tags: ["tags", "categorias", "filtros", "organização"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      },
      {
        id: "vincular-tarefas-metas-licencas",
        question: "Como vincular tarefas a metas ou licenças?",
        answer: "Crie a ação no contexto da meta, licença, obrigação ou plano correspondente. O vínculo preserva a origem, o responsável e o efeito esperado no acompanhamento.",
        tags: ["vínculos", "metas", "licenças", "projetos"],
        relatedQuestions: ["criar-tarefa", "filtros-tarefas"]
      },
      {
        id: "tarefas-atrasadas",
        question: "Como ver tarefas atrasadas?",
        answer: "Use pendências e filtros por prazo, responsável, prioridade e contexto para localizar ações vencidas. Cobranças configuradas ajudam a acompanhar o tratamento.",
        tags: ["atrasadas", "vencidas", "atraso", "pendências"],
        relatedQuestions: ["definir-prioridades", "configurar-prazos-lembretes"]
      },
      {
        id: "relatorios-produtividade",
        question: "Como gerar relatórios de produtividade?",
        answer: "Use relatórios governados para acompanhar volume, prazo, conclusão e eficácia das ações por período, responsável e processo. A leitura deve considerar complexidade e contexto, sem virar ranking automático de pessoas.",
        tags: ["relatórios", "produtividade", "métricas", "performance"],
        relatedQuestions: ["tarefas-atrasadas", "filtros-tarefas"]
      },
      {
        id: "filtros-tarefas",
        question: "Como usar filtros de tarefas?",
        answer: "Filtre ações por responsável, prazo, status, prioridade, origem, unidade e tema. Os filtros preservam o contexto do processo e podem alimentar relatórios aprovados.",
        tags: ["filtros", "busca", "views", "organização"],
        relatedQuestions: ["tags-tarefas", "tarefas-atrasadas"]
      },
      {
        id: "notificacoes-tarefas",
        question: "Como receber notificações de tarefas?",
        answer: "Configure quem será cobrado, por qual canal e com que frequência para cada tipo de pendência. A pessoa pode ajustar a frequência permitida sem perder a responsabilidade registrada.",
        tags: ["notificações", "alertas", "comunicação", "lembretes"],
        relatedQuestions: ["configurar-prazos-lembretes", "criar-tarefa"]
      },
      {
        id: "bulk-actions-tarefas",
        question: "Como fazer bulk actions em tarefas?",
        answer: "Ações em lote são limitadas a operações seguras e autorizadas, com prévia do impacto, validação e registro do resultado. Mudanças sensíveis continuam individuais.",
        tags: ["bulk", "massa", "múltiplas", "ações"],
        relatedQuestions: ["filtros-tarefas", "criar-tarefa"]
      }
    ]
  },
  {
    id: "agua-efluentes",
    title: "Água e Recursos Hídricos",
    icon: "Droplet",
    description: "Medições, indicadores e controles ambientais",
    questions: [
      {
        id: "registrar-consumo-agua",
        question: "Como registrar consumo de água?",
        answer: "Registre período, quantidade, unidade, fonte, local e vínculos relevantes. Os lançamentos alimentam indicadores, metas, pendências e relatórios com rastreabilidade.",
        tags: ["água", "consumo", "registro", "volume"],
        relatedQuestions: ["categorizar-fontes-agua", "calcular-intensidade-hidrica"]
      },
      {
        id: "categorizar-fontes-agua",
        question: "Como categorizar fontes de água?",
        answer: "Classifique captação, aquisição, reúso ou outra fonte conforme o catálogo e o controle ambiental da organização. A categoria fica vinculada ao lançamento e aos relatórios correspondentes.",
        tags: ["fontes", "categorias", "tipos", "origem"],
        relatedQuestions: ["registrar-consumo-agua", "gri-303-relatorio"]
      },
      {
        id: "calcular-intensidade-hidrica",
        question: "Como calcular intensidade hídrica?",
        answer: "Defina o indicador de intensidade com numerador, denominador, unidade, período e regra de consolidação. O Daton combina os volumes de água com o denominador validado para produzir um resultado reproduzível.",
        tags: ["intensidade", "indicadores", "eficiência", "produtividade"],
        relatedQuestions: ["registrar-consumo-agua", "metas-reducao-agua"]
      },
      {
        id: "reuso-agua",
        question: "O que é reúso de água?",
        answer: "Reúso é o aproveitamento de água já utilizada após tratamento compatível com o novo uso. Registre a fonte, o volume e a destinação para acompanhar o resultado; a conformidade do tratamento exige validação técnica própria.",
        tags: ["reúso", "reutilização", "tratamento", "economia"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "monitorar-efluentes",
        question: "Como monitorar efluentes?",
        answer: "Efluentes exigem cadastro, parâmetros e controles técnicos próprios que não fazem parte da oferta definida. O Daton cobre lançamentos, indicadores, metas e evidências relacionados ao consumo de água.",
        tags: ["efluentes", "descarte", "qualidade", "tratamento"],
        relatedQuestions: ["reuso-agua", "gri-303-relatorio"]
      },
      {
        id: "gri-303-relatorio",
        question: "Como gerar relatório de água (GRI 303)?",
        answer: "Use lançamentos revisados, indicadores, contexto hídrico e evidências no referencial configurado e conduza consolidação e revisão governadas. A organização aplica os requisitos oficiais vigentes do GRI 303.",
        tags: ["gri 303", "relatório", "água", "sustentabilidade"],
        relatedQuestions: ["registrar-consumo-agua", "monitorar-efluentes"]
      },
      {
        id: "metas-reducao-agua",
        question: "Como definir metas de redução de consumo?",
        answer: "Defina linha de base, indicador, alvo, período e responsável e conecte iniciativas e ações de redução. O Daton acompanha realizado, tendência e desvios com regra reproduzível.",
        tags: ["metas", "redução", "objetivos", "economia"],
        relatedQuestions: ["calcular-intensidade-hidrica", "registrar-consumo-agua"]
      },
      {
        id: "importar-dados-medidores",
        question: "Como importar dados de medidores?",
        answer: "Importe leituras por planilha com prévia e rejeitos ou use um conector aprovado. Integrações com medidores e IoT dependem de contrato de campos, frequência, autoridade e reconciliação.",
        tags: ["importação", "medidores", "automação", "dados"],
        relatedQuestions: ["registrar-consumo-agua", "vincular-agua-custos"]
      },
      {
        id: "vincular-agua-custos",
        question: "Como vincular água a custos?",
        answer: "Mantenha tarifas, contas e transações no sistema financeiro autoritativo. Uma integração governada pode relacionar o resultado de custo autorizado aos volumes, períodos e indicadores de água no Daton, com fonte e critérios rastreáveis.",
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
    title: "Análises e Inteligência",
    icon: "TrendingUp",
    description: "Análises delimitadas com fontes e validação",
    questions: [
      {
        id: "o-que-e-analise-preditiva",
        question: "O que é análise preditiva no Daton?",
        answer: "No Daton, análises assistidas explicam variações, tendências e anomalias em casos delimitados, com fontes e validação humana. A oferta não promete forecast genérico, probabilidades universais ou um modelo único de machine learning.",
        tags: ["limites", "ia", "consulta", "previsão"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "previsao-emissoes",
        question: "Como funciona a previsão de emissões?",
        answer: "O Daton apoia análise climática com tendências, variações e anomalias rastreáveis. Projeções de emissões exigem método, premissas, dados e avaliação próprios e não são prometidas como forecast universal.",
        tags: ["emissões", "previsão", "ghg", "carbono"],
        relatedQuestions: ["o-que-e-analise-preditiva", "detectar-anomalias"]
      },
      {
        id: "scoring-risco-conformidade",
        question: "O que é scoring de risco de conformidade?",
        answer: "Scoring resume sinais segundo critérios definidos. O Daton explica prazos, evidências e inconsistências em casos delimitados, mas não cria um score genérico nem declara conformidade automaticamente.",
        tags: ["risco", "conformidade", "score", "alertas"],
        relatedQuestions: ["probabilidade-atingir-metas", "detectar-anomalias"]
      },
      {
        id: "probabilidade-atingir-metas",
        question: "Como calcular probabilidade de atingir metas?",
        answer: "Acompanhe linha de base, realizado, alvo, tendência e ações com cálculos reproduzíveis. O Daton não promete uma probabilidade universal de atingimento sem método e avaliação específicos.",
        tags: ["metas", "probabilidade", "objetivos", "previsão"],
        relatedQuestions: ["o-que-e-analise-preditiva", "scoring-risco-conformidade"]
      },
      {
        id: "interpretar-intervalos-confianca",
        question: "Como interpretar intervalos de confiança?",
        answer: "Intervalo de confiança expressa a incerteza de uma estimativa estatística. Quando um caso analítico exigir esse recurso, método, amostra, erro e interpretação deverão ser declarados; ele não é uma métrica universal do produto.",
        tags: ["intervalo", "confiança", "estatística", "incerteza"],
        relatedQuestions: ["previsao-emissoes", "precisao-previsoes"]
      },
      {
        id: "detectar-anomalias",
        question: "O que são anomalias nas emissões?",
        answer: "Anomalia é um valor que foge do padrão esperado e merece investigação. Em casos climáticos delimitados, o Daton compara o comportamento, destaca o desvio, apresenta as fontes e pede validação humana.",
        tags: ["anomalias", "outliers", "desvios", "alertas"],
        relatedQuestions: ["previsao-emissoes", "detectar-tendencias"]
      },
      {
        id: "dados-historicos-necessarios",
        question: "Quantos dados históricos são necessários?",
        answer: "A quantidade depende do caso, da frequência, da sazonalidade e da qualidade dos dados. Cada análise declara o período usado e seus limites; o Daton não aplica um mínimo universal.",
        tags: ["dados", "histórico", "período", "requisitos"],
        relatedQuestions: ["o-que-e-analise-preditiva", "precisao-previsoes"]
      },
      {
        id: "detectar-tendencias",
        question: "Como a IA detecta tendências?",
        answer: "O Daton compara períodos e recortes definidos, identifica mudanças consistentes e explica as fontes usadas. A análise é delimitada ao domínio e não equivale a forecast genérico.",
        tags: ["tendências", "evolução", "crescimento", "análise"],
        relatedQuestions: ["previsao-emissoes", "detectar-anomalias"]
      },
      {
        id: "usar-preditiva-planejamento",
        question: "Como usar análise preditiva para planejamento?",
        answer: "Use tendências, variações, anomalias, metas e cenários definidos para orientar o planejamento. Premissas e limites ficam explícitos, e a decisão continua com a organização.",
        tags: ["planejamento", "estratégia", "orçamento", "decisões"],
        relatedQuestions: ["o-que-e-analise-preditiva", "probabilidade-atingir-metas"]
      },
      {
        id: "precisao-previsoes",
        question: "Qual a precisão das previsões?",
        answer: "Não há uma taxa universal. Cada caso analítico precisa declarar dados, método, amostra, erro, validação e limites antes que qualquer medida de desempenho seja apresentada.",
        tags: ["precisão", "acurácia", "erro", "validação"],
        relatedQuestions: ["previsao-emissoes", "interpretar-intervalos-confianca"]
      }
    ]
  },
  {
    id: "integracao-financeiro-esg",
    title: "Integração Financeiro-ESG",
    icon: "Link",
    description: "Resultados autorizados conectados ao desempenho ESG",
    questions: [
      {
        id: "o-que-e-integracao-financeiro-esg",
        question: "O que é a integração Financeiro-ESG?",
        answer: "Integração financeiro-ESG relaciona resultados financeiros validados a indicadores e iniciativas de sustentabilidade. O sistema financeiro permanece autoritativo para transações e contabilidade, enquanto conectores governados trazem resultados autorizados, com linhagem, para análise e relato no Daton.",
        tags: ["integração", "esg", "financeiro", "roi"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "vincular-despesas-pilares-esg",
        question: "Como vincular despesas a pilares ESG?",
        answer: "Classifique despesas e transações no sistema financeiro responsável. Uma integração governada pode trazer o identificador e o resultado autorizado para relacioná-los ao pilar, à iniciativa e aos indicadores ESG no Daton, com fonte e período rastreáveis.",
        tags: ["despesas", "categorização", "pilares", "esg"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "visualizar-custos-pilar"]
      },
      {
        id: "visualizar-custos-pilar",
        question: "Como visualizar custos por pilar ESG?",
        answer: "Mantenha a classificação contábil no sistema financeiro autoritativo e disponibilize agregados ou resultados aprovados por integração governada. O Daton pode relacioná-los aos pilares e indicadores ESG em visões e relatórios com fonte, período e acesso controlados.",
        tags: ["custos", "visualização", "pilares", "análise"],
        relatedQuestions: ["vincular-despesas-pilares-esg", "dashboard-esg-financeiro"]
      },
      {
        id: "dashboard-esg-financeiro",
        question: "O que é o Dashboard ESG Financeiro?",
        answer: "É uma visão governada que relaciona resultados financeiros autorizados a indicadores, iniciativas e ações ESG. Transações e contabilidade permanecem no sistema financeiro responsável; o Daton apresenta os recortes contratados com fonte, período, qualidade e acesso controlados.",
        tags: ["dashboard", "esg", "financeiro", "kpis"],
        relatedQuestions: ["visualizar-custos-pilar", "calcular-roi-ambientais"]
      },
      {
        id: "calcular-roi-ambientais",
        question: "Como calcular ROI de iniciativas ambientais?",
        answer: "Calcule e valide custos, benefícios e premissas no sistema financeiro responsável. O resultado autorizado pode alimentar o Daton por integração governada para contextualizar a iniciativa e seus indicadores ambientais; a plataforma não substitui o cálculo financeiro de ROI.",
        tags: ["roi", "retorno", "ambiental", "projetos"],
        relatedQuestions: ["o-que-e-integracao-financeiro-esg", "rastrear-investimentos-esg"]
      },
      {
        id: "relatorios-integrados-financeiro-esg",
        question: "Como gerar relatórios integrados?",
        answer: "Conecte resultados financeiros autorizados aos indicadores, iniciativas e evidências ESG por uma integração governada. O catálogo de relatórios consolida fontes, períodos e critérios; a organização revisa a narrativa e controla a publicação final.",
        tags: ["relatórios", "integrados", "esg", "financeiro"],
        relatedQuestions: ["dashboard-esg-financeiro", "exportar-dados-integrados-gri"]
      },
      {
        id: "rastrear-investimentos-esg",
        question: "Como rastrear investimentos ESG?",
        answer: "Registre valores e transações no sistema financeiro e acompanhe iniciativas, indicadores e ações no Daton. Conectores governados podem relacionar identificadores e resultados autorizados, preservando fonte, período e reconciliação entre os controles.",
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
        answer: "Registre a transação no sistema financeiro autoritativo e use o identificador da iniciativa ou do projeto ESG para estabelecer o vínculo. Uma integração governada pode trazer esse identificador e resultados autorizados ao Daton sem transformar a plataforma em sistema transacional financeiro.",
        tags: ["projetos", "transações", "vinculação", "gestão"],
        relatedQuestions: ["rastrear-investimentos-esg", "calcular-roi-ambientais"]
      },
      {
        id: "exportar-dados-integrados-gri",
        question: "Como exportar dados integrados para GRI?",
        answer: "Relacione resultados financeiros validados, recebidos por integração governada, às divulgações e evidências do referencial configurado. O catálogo consolida a saída prevista, e a organização revisa os critérios e o conteúdo antes da publicação.",
        tags: ["gri", "exportação", "integrado", "relatórios"],
        relatedQuestions: ["relatorios-integrados-financeiro-esg", "vincular-despesas-pilares-esg"]
      },
      {
        id: "analise-custo-beneficio-acoes-esg",
        question: "Como analisar custo-benefício de ações ESG?",
        answer: "Calcule e valide custos, benefícios e premissas no sistema financeiro responsável. Resultados autorizados podem alimentar o Daton por integração governada para comparação com indicadores e ações ESG; a plataforma não substitui cálculos financeiros de VPL, TIR, payback, sensibilidade ou risco-retorno.",
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
    title: "Referenciais e Relato ESG",
    icon: "BookOpen",
    description: "Referenciais, evidências, revisão e publicação governada",
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
        answer: "Conduza a materialidade segundo a versão e os critérios oficiais do referencial adotado. No Daton, configure temas e perguntas, distribua formulários aos públicos delimitados, consolide respostas e evidências e registre a decisão com revisão humana.",
        tags: ["materialidade", "análise", "tópicos", "stakeholders"],
        relatedQuestions: ["o-que-sao-gri-standards", "preencher-indicadores-gri"]
      },
      {
        id: "preencher-indicadores-gri",
        question: "Como preencher indicadores GRI?",
        answer: "Cadastre o conteúdo aplicável como tema, pergunta ou indicador do referencial, conecte fontes e evidências e acompanhe completude e revisão. O Daton não pré-carrega um pacote GRI oficial nem declara conformidade automaticamente.",
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
        answer: "Use os dados revisados do módulo Clima, conecte cálculos, respostas e evidências ao referencial configurado e conduza consolidação, revisão e publicação governadas. A organização aplica os requisitos oficiais vigentes do GRI 305.",
        tags: ["gri 305", "emissões", "ghg", "carbono"],
        relatedQuestions: ["reportar-gri-303", "preencher-indicadores-gri"]
      },
      {
        id: "reportar-gri-303",
        question: "Como reportar GRI 303 (Água)?",
        answer: "Conecte lançamentos, indicadores, contexto hídrico e evidências ao referencial e conduza consolidação, revisão e publicação governadas. A organização valida escopo e requisitos oficiais vigentes do GRI 303.",
        tags: ["gri 303", "água", "recursos hídricos", "efluentes"],
        relatedQuestions: ["reportar-gri-305", "reportar-gri-306"]
      },
      {
        id: "reportar-gri-306",
        question: "Como reportar GRI 306 (Resíduos)?",
        answer: "Conecte lançamentos, destinações, MTRs e CDFs revisados ao referencial e conduza consolidação, revisão e publicação governadas. A organização valida a classificação e os requisitos oficiais vigentes do GRI 306.",
        tags: ["gri 306", "resíduos", "economia circular", "destinação"],
        relatedQuestions: ["reportar-gri-303", "reportar-gri-305"]
      },
      {
        id: "gerar-relatorio-gri-completo",
        question: "Como gerar relatório GRI completo?",
        answer: "Configure o referencial aplicável, reúna indicadores, respostas e evidências e conduza consolidação, revisão e publicação governadas. O Daton não fornece um pacote GRI oficial universal nem substitui a validação dos critérios vigentes.",
        tags: ["relatório completo", "geração", "exportação", "gri"],
        relatedQuestions: ["o-que-sao-gri-standards", "gri-core-vs-comprehensive"]
      },
      {
        id: "exportar-dados-relatorio-sustentabilidade",
        question: "Como exportar dados para relatório de sustentabilidade?",
        answer: "Use o catálogo governado para consolidar dados, respostas e evidências, aplicar filtros e gerar a saída definida para o relatório. Formato, versão, revisão e distribuição seguem o contrato de cada publicação.",
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
        answer: "Mantenha os registros contábeis no sistema autoritativo e disponibilize resultados validados por integração governada. No Daton, relacione-os às divulgações configuradas com fonte, período e evidências, submetendo o conteúdo à validação da organização.",
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
