export const FAQ_categories = [
    {
        title: "Casos de Uso Práticos",
        items: [
            {
                q: "Como fazer meu primeiro inventário de emissões?",
                a: "Para fazer seu primeiro inventário: 1) Acesse 'Inventário GEE' no menu, 2) Clique em 'Novo Inventário', 3) Defina o período (geralmente ano fiscal), 4) Configure limites organizacionais, 5) Adicione fontes de emissão por escopo, 6) Insira dados de atividade, 7) Revise cálculos automáticos, 8) Gere relatório final. O Assistente IA pode guiá-lo em cada etapa."
            },
            {
                q: "Como preparar relatório para auditoria externa?",
                a: "Para auditoria: 1) Acesse 'Relatórios' > 'GHG Protocol', 2) Selecione período auditado, 3) Verifique completude de dados (mínimo 95%), 4) Exporte dados brutos e memória de cálculo, 5) Gere relatório de verificação com evidências, 6) Exporte planilha Excel detalhada, 7) Prepare documentação suporte (notas fiscais, medidores). Use tags de qualidade para rastrear evidências."
            },
            {
                q: "Como usar o Daton para ISO 14001?",
                a: "O Daton suporta ISO 14001: 1) Use módulo 'Licenças' para controlar requisitos legais, 2) Configure 'Aspectos Ambientais' em Meio Ambiente, 3) Defina objetivos e metas mensuráveis, 4) Use 'Gestão de Tarefas' para planos de ação, 5) Configure indicadores de desempenho, 6) Gere relatórios de análise crítica, 7) Use alertas para não-conformidades. Integre com auditorias internas."
            },
            {
                q: "Como integrar Daton com sistema ERP?",
                a: "Integração com ERP: 1) Acesse 'Configurações' > 'Integrações', 2) Use API REST do Daton (documentação em /api/docs), 3) Configure webhook para sincronização em tempo real, 4) Mapeie campos ERP para campos Daton, 5) Use CSV/Excel para importação batch inicial, 6) Configure automação para dados financeiros, 7) Teste integração em ambiente sandbox. Suporte para SAP, TOTVS, Protheus."
            },
            {
                q: "Como treinar equipe no Daton?",
                a: "Plano de treinamento: 1) Comece com 'Vídeos e Tutoriais' desta Central, 2) Faça tour guiado na plataforma (15min), 3) Crie usuários com permissões adequadas, 4) Realize workshop de 2h para equipe principal, 5) Use casos práticos da empresa, 6) Configure projetos piloto, 7) Agende Q&A semanal inicial, 8) Compartilhe esta Central de Ajuda. Certificação disponível em plano Enterprise."
            },
            {
                q: "Como migrar dados de outro sistema?",
                a: "Migração de dados: 1) Exporte dados do sistema antigo em CSV/Excel, 2) Use templates Daton em 'Importação', 3) Mapeie colunas corretamente, 4) Valide dados antes de importar, 5) Importe em lotes pequenos (máx 5.000 linhas), 6) Verifique integridade pós-importação, 7) Use API para volumes grandes (>50k linhas), 8) Mantenha backup do sistema antigo. Serviço de migração assistida disponível."
            },
            {
                q: "Como criar workflow de aprovação de licenças?",
                a: "Configure workflow: 1) Acesse 'Configurações' > 'Workflows', 2) Crie novo workflow 'Aprovação de Licenças', 3) Defina etapas (Solicitação > Análise Técnica > Aprovação Gerencial > Aprovação Diretoria), 4) Atribua responsáveis por etapa, 5) Configure prazos (SLA), 6) Ative notificações automáticas, 7) Defina regras de escalação, 8) Teste workflow com licença fictícia."
            },
            {
                q: "Como monitorar conformidade em tempo real?",
                a: "Monitoramento em tempo real: 1) Configure Dashboard de Conformidade, 2) Ative alertas para vencimentos (30/60/90 dias), 3) Use scoring de risco da IA, 4) Configure KPIs de conformidade, 5) Ative notificações push, 6) Use widget de 'Licenças Críticas', 7) Configure relatório semanal automático, 8) Integre com calendário institucional. Painel executivo disponível."
            },
            {
                q: "Como preparar relatório para investidores ESG?",
                a: "Relatório para investidores: 1) Use template 'Relatório Executivo ESG', 2) Inclua métricas financeiras ESG (ROI, investimentos), 3) Adicione análise de materialidade, 4) Mostre evolução temporal (3-5 anos), 5) Inclua benchmarking setorial, 6) Adicione análise preditiva, 7) Destaque iniciativas e resultados, 8) Exporte em PDF executivo. Use dados do Dashboard ESG Financeiro."
            },
            {
                q: "Como usar Daton para certificações (B Corp, etc)?",
                a: "Para certificações: 1) Use módulo 'GRI Standards' como base, 2) Configure indicadores específicos da certificação, 3) Use 'Casos de Uso' para mapear requisitos, 4) Colete evidências documentais, 5) Use scoring e análise preditiva, 6) Gere relatórios customizados, 7) Acompanhe progresso com metas, 8) Prepare documentação final. Suporte para B Corp, ISO 14001, LEED, GBC Brasil."
            },
            {
                q: "Como configurar Daton para múltiplas unidades?",
                a: "Gestão multi-unidades: 1) Configure 'Empresas' para cada unidade/planta, 2) Use estrutura hierárquica (Holding > Subsidiárias), 3) Configure usuários com acesso específico, 4) Ative consolidação automática, 5) Use tags geográficas, 6) Configure centros de custos por unidade, 7) Gere relatórios consolidados e individuais, 8) Use Dashboard corporativo. Suporte para holdings e grupos empresariais."
            },
            {
                q: "Como fazer benchmarking setorial?",
                a: "Benchmarking: 1) Acesse 'Análise' > 'Benchmarking', 2) Selecione setor (CNAE), 3) Compare indicadores-chave (intensidade carbono, água, resíduos), 4) Use dados anônimos de mercado, 5) Identifique gaps de desempenho, 6) Configure alertas para desvios, 7) Exporte relatório comparativo, 8) Use IA para insights de melhoria. Base de dados de 500+ empresas brasileiras."
            },
            {
                q: "Como usar Daton para due diligence ESG?",
                a: "Due diligence ESG: 1) Crie projeto específico de DD, 2) Use checklist de due diligence, 3) Carregue documentos para análise IA, 4) Avalie riscos ambientais e sociais, 5) Verifique conformidade legal, 6) Analise passivos ambientais, 7) Gere scoring de risco, 8) Exporte relatório executivo. Template para M&A disponível."
            },
            {
                q: "Como criar plano de ação ESG?",
                a: "Plano de ação ESG: 1) Use módulo 'Planos de Ação', 2) Defina objetivos SMART, 3) Use metodologia 5W2H, 4) Vincule a metas e indicadores, 5) Atribua responsáveis e prazos, 6) Estime custos e ROI, 7) Configure marcos (milestones), 8) Acompanhe progresso no Dashboard, 9) Use IA para recomendações. Template ESG disponível."
            },
            {
                q: "Como vincular ESG a bônus de executivos?",
                a: "KPIs ESG em remuneração: 1) Defina metas ESG mensuráveis, 2) Configure indicadores no Dashboard, 3) Estabeleça pesos por meta (ex: 20% redução emissões), 4) Use scoring automático, 5) Integre com RH, 6) Configure relatório trimestral, 7) Use análise preditiva para forecast, 8) Exporte dados para comitê. Alinhado com melhores práticas de governança."
            },
            {
                q: "Como usar IA para identificar oportunidades de melhoria?",
                a: "Oportunidades com IA: 1) Use Assistente IA para análise de dados, 2) Pergunte 'Quais as principais oportunidades de redução de emissões?', 3) Analise anomalias e outliers, 4) Use análise preditiva para cenários, 5) Compare com benchmarks, 6) Receba insights proativos semanais, 7) Priorize ações por ROI, 8) Implemente quick wins identificados pela IA."
            },
            {
                q: "Como calcular pegada de carbono de produtos?",
                a: "Pegada de produto: 1) Use módulo 'LCA' (Life Cycle Assessment), 2) Mapeie ciclo de vida (berço ao túmulo), 3) Calcule emissões por etapa (matéria-prima, produção, transporte, uso, descarte), 4) Use fatores de emissão específicos, 5) Aloque emissões proporcionalmente, 6) Gere PCR (Product Carbon Footprint), 7) Compare produtos, 8) Use para rotulagem ambiental."
            },
            {
                q: "Como monitorar fornecedores ESG?",
                a: "Gestão de fornecedores: 1) Configure cadastro de fornecedores, 2) Defina critérios ESG (emissões Escopo 3, certificações), 3) Colete dados via formulário, 4) Avalie performance ESG, 5) Use scoring de risco, 6) Configure auditorias periódicas, 7) Integre com procurement, 8) Gere relatório de cadeia de suprimentos. Questionnaire ESG disponível."
            },
            {
                q: "Como preparar para rating ESG (S&P, MSCI)?",
                a: "Preparação para rating: 1) Use checklist do rating desejado, 2) Mapeie indicadores requeridos, 3) Colete dados históricos (3-5 anos), 4) Valide qualidade de dados, 5) Prepare evidências documentais, 6) Use simulador de score, 7) Identifique gaps críticos, 8) Gere relatório pré-rating. Templates para CDP, S&P, MSCI, ISS disponíveis."
            },
            {
                q: "Como usar Daton em comitês ESG?",
                a: "Suporte a comitês: 1) Configure Dashboard executivo, 2) Gere relatórios mensais automáticos, 3) Use métricas de decisão (KPIs, ROI), 4) Prepare apresentações executivas, 5) Compartilhe insights da IA, 6) Acompanhe deliberações e prazos, 7) Use análise de cenários, 8) Exporte atas com dados. Template de governança ESG disponível."
            }
        ]
    },
    {
        title: "Glossário ESG & Financeiro",
        items: [
            {
                q: "O que é tCO2e (toneladas de CO2 equivalente)?",
                a: "tCO2e é a unidade padrão para medir emissões de gases de efeito estufa. Converte todos os GEE (CO2, CH4, N2O, HFCs, etc.) em uma métrica comum, baseando-se no potencial de aquecimento global (GWP) de cada gás em relação ao CO2. Por exemplo: 1 tonelada de metano (CH4) = 25 tCO2e."
            },
            {
                q: "O que são Escopo 1, 2 e 3?",
                a: "Classificação do GHG Protocol: Escopo 1 = emissões diretas da empresa (combustão, processos, veículos próprios). Escopo 2 = emissões indiretas de energia comprada (eletricidade, vapor). Escopo 3 = outras emissões indiretas na cadeia de valor (fornecedores, transporte terceirizado, resíduos, viagens). Escopo 3 geralmente representa 70-90% das emissões totais."
            },
            {
                q: "O que é GHG Protocol?",
                a: "GHG Protocol é o padrão internacional mais usado para quantificar e gerenciar emissões de gases de efeito estufa. Desenvolvido pelo WRI e WBCSD, estabelece metodologia para inventários corporativos e de produtos. É base para ISO 14064 e diversos programas de reporte como CDP."
            },
            {
                q: "O que é Materialidade em ESG?",
                a: "Materialidade é o processo de identificar e priorizar temas ESG mais relevantes para o negócio e stakeholders. Considera impacto financeiro (materialidade financeira) e impacto no mundo (materialidade de impacto/dupla). Orienta estratégia ESG e disclosure. Base para relatórios GRI e SASB."
            },
            {
                q: "O que é Stakeholder?",
                a: "Stakeholder é qualquer parte interessada afetada ou que afeta as atividades da organização: funcionários, clientes, fornecedores, investidores, comunidade, governo, ONGs. Engajamento de stakeholders é pilar da gestão ESG e essencial para análise de materialidade."
            },
            {
                q: "O que é Due Diligence ESG?",
                a: "Due diligence ESG é processo de avaliação de riscos e oportunidades ambientais, sociais e de governança de uma empresa, comum em M&A, investimentos e concessão de crédito. Inclui análise de conformidade legal, passivos ambientais, questões trabalhistas, litígios, reputação e gestão ESG."
            },
            {
                q: "O que é Rating ESG?",
                a: "Rating ESG é avaliação quantitativa da performance ESG de uma empresa, realizada por agências especializadas (MSCI, S&P, Sustainalytics, ISS). Considera métricas, disclosure, controvérsias e gestão. Influencia decisões de investidores, custo de capital e reputação. Escala varia por agência (ex: AAA-CCC no MSCI)."
            },
            {
                q: "O que são TCFD, SASB e IIRC?",
                a: "TCFD (Task Force on Climate-related Financial Disclosures) = framework para disclosure de riscos climáticos financeiros. SASB (Sustainability Accounting Standards Board) = padrões de reporte de sustentabilidade por setor. IIRC (International Integrated Reporting Council) = framework de reporte integrado conectando valor financeiro e não-financeiro. Convergem no ISSB."
            },
            {
                q: "O que é Carbon Pricing?",
                a: "Carbon pricing (precificação de carbono) atribui valor monetário às emissões de CO2, internalizando custos ambientais. Principais mecanismos: taxa de carbono (imposto fixo por tCO2e) e cap-and-trade (mercado de permissões). Usado para incentivo à redução de emissões e transição energética. Preço varia de US$ 5 a US$ 150/tCO2e globalmente."
            },
            {
                q: "Qual a diferença entre Offset e Insetting?",
                a: "Offset = compensação de emissões comprando créditos de projetos externos (ex: reflorestamento na Amazônia). Insetting = redução/remoção de emissões dentro da própria cadeia de valor (ex: agricultura regenerativa de fornecedores). Insetting é preferível por impacto direto e resiliência da cadeia."
            },
            {
                q: "O que é Economia Circular?",
                a: "Economia circular é modelo econômico que visa eliminar resíduos, mantendo produtos, materiais e recursos em uso pelo máximo de tempo. Contrasta com economia linear (extrair-produzir-descartar). Princípios: design regenerativo, compartilhamento, reuso, reparo, remanufatura, reciclagem. Reduz extração de recursos e emissões."
            },
            {
                q: "O que é LCA (Life Cycle Assessment)?",
                a: "LCA (Avaliação de Ciclo de Vida) é metodologia para avaliar impactos ambientais de um produto/serviço ao longo de todo seu ciclo: extração de matéria-prima, produção, distribuição, uso e descarte (berço ao túmulo). Quantifica emissões, consumo de água, energia, geração de resíduos. Norma ISO 14040."
            },
            {
                q: "O que é Science Based Targets (SBTi)?",
                a: "Science Based Targets (SBTi) são metas de redução de emissões alinhadas com a ciência climática (limitar aquecimento a 1,5°C). Validadas pela iniciativa SBTi (CDP, WRI, WWF, UNGC). Empresas comprometem reduzir emissões Escopo 1, 2 e 3 em linha com cenários climáticos do IPCC. Mais de 5.000 empresas globalmente."
            },
            {
                q: "Diferença entre Net Zero e Carbon Neutral?",
                a: "Carbon Neutral = equilibrar emissões com compensações (offsets), sem necessariamente reduzir. Pode ser anual. Net Zero = reduzir emissões drasticamente (90%+) alinhado à ciência (SBTi) e compensar apenas residuais inevitáveis. Prazo até 2050. Net Zero é mais ambicioso e exige descarbonização profunda."
            },
            {
                q: "O que é DRE (Demonstração do Resultado do Exercício)?",
                a: "DRE é demonstrativo contábil que apresenta receitas, custos e despesas de um período, resultando no lucro ou prejuízo. Estrutura: Receita Bruta → Deduções → Receita Líquida → CMV → Lucro Bruto → Despesas Operacionais → EBITDA → Juros e Impostos → Lucro Líquido. Obrigatória anualmente."
            },
            {
                q: "O que é EBITDA?",
                a: "EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization) = Lucro antes de juros, impostos, depreciação e amortização. Mede performance operacional pura, excluindo efeitos de estrutura de capital, regime fiscal e investimentos. Facilita comparação entre empresas e setores."
            },
            {
                q: "O que é ROI (Retorno sobre Investimento)?",
                a: "ROI mede rentabilidade de um investimento. Fórmula: ROI = (Ganho - Custo) / Custo x 100%. Em ESG, mede retorno financeiro de iniciativas sustentáveis."
            },
            {
                q: "O que é Payback?",
                a: "Payback é tempo necessário para recuperar investimento inicial através dos retornos gerados. Fórmula simples: Payback = Investimento Inicial / Fluxo de Caixa Anual."
            },
            {
                q: "Diferença entre CAPEX e OPEX?",
                a: "CAPEX (Capital Expenditure) = investimentos em ativos de longo prazo (máquinas, imóveis, TI). OPEX (Operational Expenditure) = despesas operacionais do dia a dia (salários, aluguel, insumos). Em ESG: painel solar é CAPEX, energia comprada é OPEX."
            },
            {
                q: "O que é Fluxo de Caixa?",
                a: "Fluxo de caixa registra todas as entradas e saídas de dinheiro em período determinado. Componentes: Fluxo Operacional, Fluxo de Investimento (CAPEX), Fluxo de Financiamento."
            },
            {
                q: "O que é Conciliação Bancária?",
                a: "Conciliação bancária é processo de comparar registros contábeis da empresa com extratos bancários, identificando e ajustando diferenças. Garante acurácia do saldo de caixa."
            },
            {
                q: "O que é Plano de Contas?",
                a: "Plano de Contas é estrutura hierárquica que classifica todas as contas contábeis: Ativo, Passivo, Patrimônio Líquido, Receitas, Custos e Despesas."
            },
            {
                q: "O que é Centro de Custos?",
                a: "Centro de Custos é unidade organizacional que acumula custos (departamento, projeto, produto). Em ESG, centros de custos são vinculados a pilares (Ambiental, Social, Governança) para rastreamento de investimentos."
            },
            {
                q: "O que é Lançamento Contábil?",
                a: "Lançamento contábil registra fato econômico pelo método das partidas dobradas: débito em uma conta, crédito em outra."
            },
            {
                q: "Diferença entre Regime de Competência e Regime de Caixa?",
                a: "Competência = reconhece receita/despesa quando ocorre o fato gerador, independente de pagamento. Caixa = reconhece apenas quando há entrada/saída de dinheiro."
            }
        ]
    },
    {
        title: "Vídeos e Tutoriais",
        items: [
            {
                q: "Tour completo da plataforma (5min)",
                a: "Vídeo introdutório apresentando todos os módulos do Daton: Dashboard principal, Inventário GEE, Módulo Financeiro, Assistente IA, Gestão de Licenças, Relatórios, Configurações. Ideal para novos usuários. [Em breve]"
            },
            {
                q: "Como fazer seu primeiro inventário GEE (10min)",
                a: "Tutorial passo-a-passo: criação de inventário, definição de limites organizacionais, cadastro de fontes de emissão Escopo 1/2/3, inserção de dados de atividade, revisão de fatores de emissão, cálculo automático, geração de relatório GHG Protocol. [Em breve]"
            },
            {
                q: "Configuração inicial passo-a-passo (15min)",
                a: "Guia completo de setup: criação de empresa, configuração de usuários e permissões, definição de ano fiscal, customização de dashboard, configuração de notificações, importação de dados iniciais, integração com sistemas. [Em breve]"
            },
            {
                q: "Módulo Financeiro do zero (12min)",
                a: "Tutorial financeiro: configuração de plano de contas, cadastro de contas bancárias, registro de contas a pagar/receber, lançamentos contábeis, centros de custos ESG, vinculação financeiro-ESG, geração de DRE e fluxo de caixa. [Em breve]"
            },
            {
                q: "Usando o Assistente IA (8min)",
                a: "Como maximizar o Assistente IA: tipos de perguntas efetivas, upload de documentos, análise contextual, pedidos de análise preditiva, interpretação de insights, comandos avançados. [Em breve]"
            },
            {
                q: "Criando relatórios GRI (15min)",
                a: "Relatório GRI completo: análise de materialidade, seleção de indicadores, preenchimento de conteúdos gerais (GRI 2), indicadores temáticos (GRI 300), vinculação de dados automáticos, revisão de completude, exportação para relatório de sustentabilidade. [Em breve]"
            },
            {
                q: "Integrações e API (10min)",
                a: "Guia técnico: autenticação API, endpoints principais, integração com ERP (SAP, TOTVS), webhooks para sincronização, importação batch via CSV/Excel, automações com Zapier/Make. [Em breve]"
            },
            {
                q: "Análise preditiva na prática (7min)",
                a: "Usando análise preditiva: previsão de emissões futuras, cálculo de probabilidade de atingir metas, identificação de anomalias, scoring de risco de conformidade. [Em breve]"
            },
            {
                q: "Dashboard customizado (6min)",
                a: "Personalize seu dashboard: seleção de widgets, configuração de KPIs, filtros e períodos, gráficos customizados, dashboard financeiro ESG. [Em breve]"
            },
            {
                q: "Gestão de tarefas e aprovações (9min)",
                a: "Workflow completo: criação de tarefas, atribuição de responsáveis, definição de prazos, configuração de workflow de aprovação, notificações automáticas. [Em breve]"
            },
            {
                q: "Como acessar material de treinamento?",
                a: "Todos os vídeos estarão disponíveis em breve no Centro de Treinamento Daton. Entre em contato com suporte (suporte@daton.com.br) para agendar demonstração ao vivo personalizada, workshop de onboarding ou treinamento customizado."
            }
        ]
    },
    {
        title: "Primeiros Passos",
        items: [
            {
                q: "Como criar minha conta?",
                a: "Clique no botão 'Criar Conta' na página inicial. Preencha seus dados (nome, e-mail, senha) e confirme seu e-mail através do link enviado. Após a confirmação, você terá acesso completo à plataforma."
            },
            {
                q: "Como configurar minha empresa na plataforma?",
                a: "Após fazer login, acesse Configurações > Perfil da Empresa. Preencha informações como nome, CNPJ, endereço, setor de atuação e porte. Esses dados serão usados nos relatórios e cálculos de emissões."
            },
            {
                q: "Quais são os primeiros passos após o login?",
                a: "Após o primeiro login, você verá um tour interativo guiado. Recomendamos: 1) Configurar o perfil da empresa, 2) Convidar usuários da equipe, 3) Explorar o dashboard principal, 4) Iniciar pela seção de Documentos para fazer upload de dados, 5) Acessar os tutoriais específicos de cada módulo."
            },
            {
                q: "Como funciona o sistema de permissões?",
                a: "A plataforma possui 4 níveis de acesso: Administrador (acesso total), Gerente (visualização e edição sem configurações críticas), Analista (visualização e edição limitada) e Visualizador (somente leitura). As permissões podem ser configuradas por módulo em Gestão de Usuários."
            },
            {
                q: "Como convidar outros usuários?",
                a: "Acesse Gestão de Usuários no menu lateral, clique em 'Convidar Usuário', preencha o e-mail e selecione o nível de permissão. O usuário receberá um e-mail com link de ativação."
            },
            {
                q: "Onde encontro os tutoriais interativos?",
                a: "Os tutoriais estão disponíveis no ícone de interrogação (?) no canto superior direito. Você também pode acessar tutoriais específicos clicando no ícone de ajuda em cada módulo."
            }
        ]
    },
    {
        title: "Dashboard e Visualizações",
        items: [
            {
                q: "Como interpretar os gráficos do dashboard?",
                a: "Cada gráfico possui um ícone de informação (i) que explica a métrica. Os gráficos de emissões mostram totais por escopo e tendências temporais. Passe o mouse sobre os elementos para ver detalhes. Use os filtros de período no topo para análises temporais."
            },
            {
                q: "Como personalizar widgets?",
                a: "Clique no ícone de engrenagem no canto superior direito do dashboard. Você pode adicionar, remover ou reordenar widgets arrastando-os. Cada usuário pode ter suas próprias visualizações personalizadas."
            },
            {
                q: "Como exportar dados do dashboard?",
                a: "Use o botão 'Exportar' no topo do dashboard. Formatos disponíveis: PDF (relatório visual completo), Excel (dados brutos para análise) ou PNG (imagem do dashboard)."
            },
            {
                q: "Quais métricas são calculadas automaticamente?",
                a: "A plataforma calcula automaticamente: emissões totais de GEE por escopo, intensidade de carbono, percentual de resíduos reciclados, índice de conformidade, progresso de metas, taxa de não conformidades, score ESG geral e KPIs específicos de cada módulo."
            },
            {
                q: "Como criar dashboards customizados?",
                a: "Acesse Dashboard > Novo Dashboard Customizado. Escolha os widgets desejados, configure filtros padrão, defina o período de análise e salve com um nome. Você pode criar múltiplos dashboards para diferentes públicos."
            },
            {
                q: "O que é o Dashboard Financeiro?",
                a: "O Dashboard Financeiro integra métricas financeiras e ESG em uma única visualização. Mostra: fluxo de caixa com categorização ESG, ROI de investimentos sustentáveis, despesas por pilar ESG, previsões de custo-carbono."
            },
            {
                q: "Como usar o Dashboard ESG Financeiro?",
                a: "Mostra a conexão entre performance financeira e ESG: custos ambientais vs economia gerada, investimentos em iniciativas sociais vs retorno em reputação, gastos em governança vs redução de riscos."
            },
            {
                q: "Como customizar KPIs no dashboard?",
                a: "Acesse Dashboard > Configurar KPIs. Crie KPIs customizados com fórmulas próprias, defina metas e limites com alertas visuais, escolha tipo de visualização e configure cores por faixa de desempenho."
            },
            {
                q: "Como compartilhar dashboards com stakeholders?",
                a: "Dashboards podem ser compartilhados via: Link público (somente leitura), Agendamento de envios (PDF por e-mail), Exportação (PDF, PowerPoint, imagem), Embedding (iframe com autenticação) e Acesso temporário (link com prazo)."
            }
        ]
    },
    {
        title: "Inventário de Emissões (GEE)",
        items: [
            {
                q: "Quais metodologias de cálculo são suportadas?",
                a: "GHG Protocol (Escopo 1, 2 e 3), ISO 14064-1:2018, e metodologias do IPCC. Todos os fatores de emissão são atualizados conforme bases oficiais (IPCC, EPA, DEFRA, SEEG Brasil)."
            },
            {
                q: "Como adicionar fontes de emissão?",
                a: "Acesse Inventário GEE > Fontes de Emissão > Adicionar Fonte. Selecione o escopo, categoria, tipo de combustível/atividade e unidade de medida. Preencha os dados manualmente ou importe via planilha."
            },
            {
                q: "Quais escopos são calculados?",
                a: "Escopo 1: Emissões diretas. Escopo 2: Emissões indiretas de energia elétrica comprada. Escopo 3: Outras emissões indiretas. A plataforma calcula todos os 15 categorias do Escopo 3 conforme GHG Protocol."
            },
            {
                q: "Como importar dados de consumo?",
                a: "Use Documentos > Upload de Arquivos ou Inventário GEE > Importar Dados. Aceitamos Excel, CSV e PDF (com extração IA). A IA pode extrair automaticamente dados de contas de energia e notas fiscais."
            },
            {
                q: "Como calcular emissões de transporte?",
                a: "Acesse Inventário GEE > Transporte. Cadastre veículos, tipo de combustível, consumo médio e distâncias percorridas. Para frota própria (Escopo 1), use dados de abastecimento. Para transporte terceirizado (Escopo 3), use km rodados ou gasto com frete."
            },
            {
                q: "O que são fatores de emissão?",
                a: "Fatores de emissão são coeficientes que convertem atividade (ex: litros de diesel) em emissões de CO2e. A plataforma usa bases oficiais: IPCC, EPA, DEFRA, MCT/SEEG (Brasil)."
            },
            {
                q: "Como registrar projetos de carbono?",
                a: "Acesse Inventário GEE > Projetos de Redução/Compensação. Cadastre projetos de eficiência energética, energia renovável, reflorestamento ou compra de créditos."
            },
            {
                q: "Como gerar relatórios de inventário?",
                a: "Acesse Inventário GEE > Relatórios. Selecione o período, escopos desejados e formato (PDF executivo, Excel detalhado, ou padrão GHG Protocol)."
            }
        ]
    },
    {
        title: "Gestão de Resíduos",
        items: [
            {
                q: "Como cadastrar tipos de resíduos?",
                a: "Acesse Resíduos > Tipos de Resíduos > Adicionar. Informe nome, classe (I, II-A, II-B), código ABNT, descrição e unidade de medida."
            },
            {
                q: "Como registrar destinação de resíduos?",
                a: "Acesse Resíduos > Destinação. Selecione o tipo de resíduo, quantidade, fornecedor/destinatário, tipo de destinação e anexe MTR ou certificado. O sistema calcula automaticamente % de reciclagem."
            },
            {
                q: "O que é PGRS e como criar um?",
                a: "PGRS (Plano de Gerenciamento de Resíduos Sólidos) é obrigatório conforme Política Nacional de Resíduos Sólidos. O sistema gera automaticamente um PGRS baseado em seus dados de geração e destinação."
            },
            {
                q: "Como gerenciar fornecedores de resíduos?",
                a: "Acesse Resíduos > Fornecedores. Cadastre empresas de coleta, transporte e destinação final. O sistema alerta quando licenças estão próximas do vencimento."
            },
            {
                q: "Quais relatórios de resíduos estão disponíveis?",
                a: "Geração total por tipo e período, % de reciclagem/destinação adequada, ranking de resíduos mais gerados, evolução temporal, PGRS completo, MTRs por fornecedor, indicadores de economia circular."
            }
        ]
    },
    {
        title: "Licenciamento",
        items: [
            {
                q: "Como cadastrar licenças ambientais?",
                a: "Acesse Licenciamento > Licenças > Adicionar. Preencha: tipo de licença, número do processo, órgão emissor, data de emissão, validade, condicionantes e anexe o documento PDF."
            },
            {
                q: "Como acompanhar prazos de renovação?",
                a: "O dashboard de Licenciamento mostra um timeline com todas as licenças e seus status. Alertas automáticos são enviados 90, 60 e 30 dias antes do vencimento."
            },
            {
                q: "Quais tipos de licença são suportados?",
                a: "LP (Prévia), LI (Instalação), LO (Operação), LAS (Ambiental Simplificada), AAF (Autorização Ambiental de Funcionamento), Outorgas de Água, Autorização de Supressão Vegetal e outras customizáveis."
            },
            {
                q: "Como anexar documentos às licenças?",
                a: "Use a seção 'Documentos Relacionados' para fazer upload de PDFs, imagens ou outros arquivos. Sem limite de arquivos."
            },
            {
                q: "Como receber alertas de vencimento?",
                a: "Alertas automáticos nos prazos: 90, 60, 30, 15 e 7 dias antes do vencimento. Configure destinatários em Configurações > Notificações > Licenciamento."
            }
        ]
    },
    {
        title: "Metas de Sustentabilidade",
        items: [
            {
                q: "Como criar metas ESG?",
                a: "Acesse Metas > Nova Meta. Defina: nome, categoria ESG, indicador, valor atual, valor alvo, prazo, responsável e plano de ação."
            },
            {
                q: "Como acompanhar progresso de metas?",
                a: "O dashboard de Metas mostra cards com % de progresso, status e gráficos de evolução. Alertas automáticos notificam quando uma meta está atrasada."
            },
            {
                q: "Quais tipos de metas posso definir?",
                a: "Ambientais: redução de emissões GEE, consumo de energia/água, % reciclagem. Sociais: diversidade, treinamentos, segurança do trabalho. Governança: compliance, auditorias, políticas. Metas customizadas também são suportadas."
            },
            {
                q: "Como vincular metas a indicadores?",
                a: "Ao criar uma meta, selecione um indicador existente ou crie um customizado. A meta será automaticamente atualizada conforme os dados forem inseridos."
            },
            {
                q: "Como criar metas financeiras ESG?",
                a: "Defina metas que combinam performance financeira e ESG: ROI de projetos sustentáveis, redução de custos ambientais, investimento ESG, custo-carbono."
            },
            {
                q: "Como a análise preditiva ajuda no atingimento de metas?",
                a: "A IA prevê: probabilidade de atingir a meta, data estimada de conclusão, ações corretivas recomendadas e simulações de cenários."
            },
            {
                q: "Como calcular ROI de metas ESG?",
                a: "Considera investimento inicial (CAPEX + OPEX), economia gerada, benefícios intangíveis e riscos evitados. A plataforma gera análise de payback, TIR e VPL automaticamente."
            },
            {
                q: "Como criar metas SMART?",
                a: "O sistema guia você a criar metas Específicas, Mensuráveis, Atingíveis, Relevantes e Temporais. O assistente valida cada critério e sugere melhorias."
            }
        ]
    },
    {
        title: "Gestão de Stakeholders",
        items: [
            {
                q: "Como cadastrar partes interessadas?",
                a: "Acesse Stakeholders > Cadastro. Adicione grupos, nível de influência, interesses principais e canais de comunicação."
            },
            {
                q: "Como realizar análise de materialidade?",
                a: "Acesse Stakeholders > Materialidade > Nova Análise. Defina temas ESG relevantes, envie pesquisas para stakeholders avaliarem importância, e o sistema gera a matriz de materialidade automaticamente."
            }
        ]
    },
    {
        title: "Documentos e Dados",
        items: [
            {
                q: "Como fazer upload de documentos?",
                a: "Acesse Documentos > Upload ou arraste e solte arquivos na área de upload. Aceitamos PDF, Excel, Word, CSV e imagens. Tamanho máximo: 50MB por arquivo."
            },
            {
                q: "Como funciona a extração automática por IA?",
                a: "Após upload de PDF/Excel, a IA identifica e extrai automaticamente dados relevantes. A extração leva 30-120 segundos conforme tamanho. Precisão superior a 95%."
            },
            {
                q: "Quais formatos de arquivo são aceitos?",
                a: "Documentos: PDF, Word, Excel, PowerPoint. Dados: CSV, TXT, JSON. Imagens: JPG, JPEG, PNG, TIFF. Tamanho máximo: 50MB por arquivo."
            },
            {
                q: "Como organizar documentos em pastas?",
                a: "Crie pastas e subpastas hierárquicas. Mova documentos arrastando ou usando menu contextual. Use tags para categorização cruzada."
            },
            {
                q: "Como funciona a extração IA de notas fiscais?",
                a: "Upload de NF-e (XML ou PDF) e a IA extrai dados do fornecedor, itens, impostos, totais, CFOP e sugere categorização ESG automática. Taxa de precisão: >95%."
            },
            {
                q: "Como funciona a validação automática de dados?",
                a: "O sistema valida consistência, duplicatas, regras de negócio, limites e integridade referencial. Dados inválidos são sinalizados para revisão."
            }
        ]
    },
    {
        title: "Relatórios Integrados",
        items: [
            {
                q: "Quais relatórios estão disponíveis?",
                a: "GRI Standards, TCFD, TNFD, IFRS S1/S2, CDP, Inventário GHG Protocol, Relatório de Sustentabilidade customizado e relatórios gerenciais por módulo."
            },
            {
                q: "Como gerar relatório de sustentabilidade?",
                a: "Acesse Relatórios > Novo Relatório. Selecione padrão, ano de referência, idioma e seções. O sistema pré-preenche indicadores com dados já inseridos."
            },
            {
                q: "Quais indicadores GRI são cobertos?",
                a: "GRI Universal Standards 2021 completo. Séries 200 (Econômicos), 300 (Ambientais), 400 (Sociais). Cobertura de 80%+ dos indicadores."
            },
            {
                q: "Em quais formatos posso exportar relatórios?",
                a: "PDF, Word, Excel, PowerPoint, HTML, JSON, CSV e iXBRL."
            },
            {
                q: "Como agendar envio automático de relatórios?",
                a: "Configure frequência (diário a trimestral), destinatários, formato, conteúdo e horário de envio."
            }
        ]
    },
    {
        title: "Formulários Customizados",
        items: [
            {
                q: "Como criar formulários próprios?",
                a: "Use o editor drag-and-drop para adicionar campos com validações e lógica condicional."
            },
            {
                q: "Como compartilhar formulários externamente?",
                a: "Gere link público, envie por e-mail, incorpore via iframe ou compartilhe QR Code."
            },
            {
                q: "Como analisar respostas de formulários?",
                a: "Veja dashboard com estatísticas: total de respostas, taxa de conclusão, tempo médio, gráficos por pergunta. Exporte em Excel."
            }
        ]
    },
    {
        title: "Integrações e API",
        items: [
            {
                q: "Quais integrações estão disponíveis?",
                a: "ERP (SAP, TOTVS, Protheus), Contabilidade (Contábil, Questor), RH (Sênior, RM), Energia (concessionárias via API), IoT, Cloud Storage, Zapier/Make para 5.000+ apps. API REST completa."
            },
            {
                q: "Existe API para integração?",
                a: "Sim. API REST completa com autenticação OAuth 2.0, CRUD de todos os módulos, upload de documentos, extração de relatórios e webhooks para eventos."
            },
            {
                q: "Como automatizar coleta de dados?",
                a: "Use integrações ou API para coletar dados automaticamente de sistemas ERP, concessionárias de energia/água, sensores IoT, folhas de ponto de RH, notas fiscais eletrônicas."
            }
        ]
    },
    {
        title: "Segurança e Privacidade",
        items: [
            {
                q: "Como são protegidos meus dados?",
                a: "Criptografia AES-256 em repouso e TLS 1.3 em trânsito. Autenticação multi-fator (MFA). Logs de auditoria. Conformidade com LGPD, ISO 27001 e SOC 2. Testes de penetração anuais."
            },
            {
                q: "Qual política de backup?",
                a: "Backups automáticos: diários (últimos 30 dias), semanais (últimos 3 meses), mensais (último ano). RTO de 4 horas, RPO de 24 horas."
            },
            {
                q: "Como funciona controle de acesso?",
                a: "RBAC (Role-Based Access Control) com 4 níveis padrão + perfis customizados. Timeout automático após 30 min de inatividade."
            },
            {
                q: "Posso exportar todos meus dados?",
                a: "Sim, portabilidade garantida (LGPD). Exporte em JSON estruturado, Excel consolidado ou ZIP com todos os documentos."
            },
            {
                q: "Como deletar minha conta?",
                a: "Acesse Configurações > Conta > Excluir Conta. Ação irreversível após 30 dias de carência. Recomendamos exportar dados antes."
            }
        ]
    },
    {
        title: "Assistente IA",
        items: [
            {
                q: "Como usar o Assistente IA?",
                a: "Clique no ícone de chat (canto inferior direito). Faça perguntas em linguagem natural como: 'Quais foram minhas emissões totais em 2024?' ou 'Gere um relatório de resíduos do último trimestre'."
            },
            {
                q: "Que tipos de perguntas a IA responde?",
                a: "Consultas de dados, análise preditiva, recomendações de melhoria, geração de relatórios, análise de documentos, cálculos ESG, benchmarking, tendências e insights."
            },
            {
                q: "A IA pode gerar relatórios customizados?",
                a: "Sim. Peça como: 'Crie relatório de emissões Escopo 1 e 2 comparando 2023 vs 2024'. A IA compila dados, gera gráficos e formatação profissional em PDF/Excel."
            },
            {
                q: "Como a IA identifica riscos?",
                a: "Analisa: licenças próximas do vencimento, emissões acima de limites, metas em risco de não atingimento, anomalias em dados, oportunidades de economia."
            },
            {
                q: "A IA tem acesso a todos os meus dados?",
                a: "A IA acessa apenas dados que você tem permissão de visualizar. Dados são processados de forma segura e criptografada. Conformidade com LGPD."
            }
        ]
    },
    {
        title: "Gestão de Tarefas",
        items: [
            {
                q: "Como criar uma nova tarefa?",
                a: "Acesse Tarefas > Nova Tarefa. Preencha título, descrição, tipo, prioridade, responsável(is), prazo e vincule a licença, meta ou projeto relacionado."
            },
            {
                q: "Como definir prioridades de tarefas?",
                a: "4 níveis: Urgente (vermelho, prazo <24h), Alta (laranja, <1 semana), Média (amarelo, <1 mês), Baixa (verde, pode ser reagendada)."
            },
            {
                q: "Como funciona o workflow de aprovação?",
                a: "Configure níveis de aprovação, SLAs de resposta, ações de timeout e notificações. Histórico completo fica registrado."
            },
            {
                q: "Como ver tarefas atrasadas?",
                a: "Acesse Tarefas > Filtros > Atrasadas. Alertas automáticos são enviados para responsável, gestor e escalação conforme configuração."
            },
            {
                q: "Como fazer bulk actions em tarefas?",
                a: "Selecione múltiplas tarefas e use menu 'Ações em Lote': atribuir responsável, alterar prioridade, adicionar/remover tags, reagendar prazos, concluir ou deletar em lote."
            }
        ]
    },
    {
        title: "Água e Efluentes",
        items: [
            {
                q: "Como registrar consumo de água?",
                a: "Acesse Ambiental > Água > Novo Registro. Informe período, fonte, volume consumido, unidade/localização e anexe contas de água."
            },
            {
                q: "Como categorizar fontes de água?",
                a: "Sistema usa categorização GRI 303: água superficial, subterrânea, do mar, produzida, de terceiros, de reúso e da chuva."
            },
            {
                q: "Como calcular intensidade hídrica?",
                a: "Intensidade hídrica = Consumo total de água (m3) / Unidade de produção. Configure denominador em Configurações > Água."
            },
            {
                q: "Como monitorar efluentes?",
                a: "Acesse Ambiental > Efluentes. Informe volume descartado, destino, qualidade (DBO, DQO, pH, metais pesados) e anexe laudos. Sistema alerta se parâmetros excedem limites legais."
            },
            {
                q: "Como gerar relatório de água (GRI 303)?",
                a: "Acesse Ambiental > Água > Relatório GRI 303. Sistema compila automaticamente todos os indicadores 303-1 a 303-5."
            },
            {
                q: "Como definir metas de redução de consumo?",
                a: "Acesse Metas > Nova Meta > Categoria: Água. Defina baseline, meta, prazo e plano de ação. IA pode sugerir metas realistas baseadas em benchmark do setor."
            }
        ]
    },
    {
        title: "Análise Preditiva",
        items: [
            {
                q: "O que é análise preditiva no Daton?",
                a: "Usa inteligência artificial e machine learning para prever comportamentos futuros. Quanto mais dados históricos (ideal 12+ meses), maior a precisão."
            },
            {
                q: "Como funciona a previsão de emissões?",
                a: "Identifica tendências, detecta sazonalidade, considera variáveis exógenas e aplica modelos estatísticos (ARIMA, Prophet, redes neurais) para gerar previsão pontual + intervalo de confiança."
            },
            {
                q: "O que é scoring de risco de conformidade?",
                a: "Score 0-100 baseado em: licenças vencendo (30%), condicionantes não atendidas (25%), emissões acima de limites (20%), tarefas críticas atrasadas (15%), auditorias com NC (10%)."
            },
            {
                q: "Quantos dados históricos são necessários?",
                a: "Mínimo: 3 meses. Recomendado: 12+ meses. Ideal: 24+ meses."
            },
            {
                q: "Qual a precisão das previsões?",
                a: "Varia conforme quantidade de dados, consistência, horizonte temporal e complexidade. Sistema reporta erro médio percentual (MAPE) e R2."
            }
        ]
    },
    {
        title: "Integração Financeiro-ESG",
        items: [
            {
                q: "O que é a integração Financeiro-ESG?",
                a: "Conexão entre dados financeiros e indicadores ESG. Permite rastrear custos de iniciativas ambientais, calcular ROI de projetos sustentáveis e gerar relatórios integrados."
            },
            {
                q: "Como vincular despesas a pilares ESG?",
                a: "Ao cadastrar conta a pagar/receber, use campo 'Categoria ESG': Ambiental, Social ou Governança. Também vincule a 'Projeto ESG' específico."
            },
            {
                q: "Como calcular ROI de iniciativas ambientais?",
                a: "Acesse Financeiro > Análise ESG > ROI de Projetos. Sistema calcula investimento, retorno financeiro, retorno ambiental, payback e ROI %."
            },
            {
                q: "Como criar orçamentos ESG?",
                a: "Acesse Financeiro > Orçamentos > Novo Orçamento ESG. Distribua budget entre pilares, projetos e centros de custo com breakdown mensal."
            }
        ]
    },
    {
        title: "GRI Standards Detalhado",
        items: [
            {
                q: "O que são os GRI Standards?",
                a: "Diretrizes mais usadas mundialmente para relatórios de sustentabilidade: GRI 2 (Conteúdos Gerais), GRI 3 (Tópicos Materiais), GRI 200 (Econômicos), GRI 300 (Ambientais), GRI 400 (Sociais)."
            },
            {
                q: "Quais indicadores GRI o Daton cobre?",
                a: "GRI 2, 201, 203-204, 302, 303, 305, 306, 308, 401-405. Cobertura 80%+ indicadores ambientais e governança."
            },
            {
                q: "Como fazer análise de materialidade GRI?",
                a: "Acesse Relatórios > GRI > Materialidade. Liste stakeholders, avalie tópicos em importância para stakeholders e impacto no negócio. Matriz gerada automaticamente."
            },
            {
                q: "Como gerar relatório GRI completo?",
                a: "Acesse Relatórios > GRI > Relatório Completo. Selecione ano, opção (Core ou Comprehensive), indicadores, revise dados pré-populados, complete campos narrativos e exporte em Word ou PDF."
            },
            {
                q: "Qual a diferença entre GRI Core e Comprehensive?",
                a: "Core (Essencial): indicadores-chave, mais acessível para empresas iniciantes. Comprehensive (Abrangente): reporte detalhado e completo, preferido por grandes empresas e líderes ESG."
            }
        ]
    }
];
