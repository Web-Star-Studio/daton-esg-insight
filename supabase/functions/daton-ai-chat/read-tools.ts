/**
 * Advanced Read Tools for Daton AI Chat
 * Provides intelligent data querying capabilities
 */

export const readTools = [
  {
    type: "function",
    function: {
      name: "get_comprehensive_company_data",
      description: "Obtém TODOS os dados relevantes da empresa de uma vez (emissões detalhadas, metas com histórico completo, riscos, funcionários, documentos, etc). Use esta ferramenta PRIMEIRO para ter contexto completo antes de responder perguntas.",
      parameters: {
        type: "object",
        properties: {
          includeEmissions: {
            type: "boolean",
            description: "Incluir dados detalhados de emissões (padrão: true)"
          },
          includeGoals: {
            type: "boolean",
            description: "Incluir metas e progresso histórico (padrão: true)"
          },
          includeMateriality: {
            type: "boolean",
            description: "Incluir análise de materialidade (padrão: false)"
          },
          includeGRI: {
            type: "boolean",
            description: "Incluir indicadores GRI (padrão: false)"
          },
          includeRisks: {
            type: "boolean",
            description: "Incluir riscos e oportunidades (padrão: true)"
          },
          includeEmployees: {
            type: "boolean",
            description: "Incluir dados de colaboradores (padrão: true)"
          },
          includeWaste: {
            type: "boolean",
            description: "Incluir logs de resíduos (padrão: false)"
          },
          includeDocuments: {
            type: "boolean",
            description: "Incluir documentos recentes (padrão: true)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_emissions_data",
      description: "Consulta dados de emissões de GEE. Use para perguntas sobre emissões totais, por escopo, por período, ou comparações.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["1", "2", "3", "all"],
            description: "Escopo de emissões (1, 2, 3 ou 'all' para todos)"
          },
          year: {
            type: "number",
            description: "Ano de referência (opcional, padrão é ano atual)"
          },
          groupBy: {
            type: "string",
            enum: ["source", "month", "category"],
            description: "Agrupar resultados por fonte, mês ou categoria"
          }
        },
        required: ["scope"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_goals_progress",
      description: "Consulta progresso de metas ESG. Use para perguntas sobre status de metas, progresso, prazos.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "completed", "at_risk"],
            description: "Filtrar por status da meta"
          },
          category: {
            type: "string",
            enum: ["environmental", "social", "governance", "all"],
            description: "Categoria da meta"
          },
          sortBy: {
            type: "string",
            enum: ["progress", "deadline", "priority"],
            description: "Ordenar resultados"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_licenses",
      description: "Consulta licenças ambientais. Use para perguntas sobre licenças vencidas, próximas ao vencimento, status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "expired", "expiring_soon"],
            description: "Status da licença"
          },
          daysUntilExpiry: {
            type: "number",
            description: "Filtrar licenças que vencem em X dias (para expiring_soon)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_tasks",
      description: "Consulta tarefas de coleta de dados e outras atividades. Use para perguntas sobre tarefas pendentes, atrasadas, status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "pending", "overdue", "completed"],
            description: "Status da tarefa"
          },
          taskType: {
            type: "string",
            description: "Tipo de tarefa (emissões, resíduos, etc)"
          },
          assignedTo: {
            type: "string",
            description: "ID do usuário responsável"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_risks",
      description: "Consulta riscos ESG identificados. Use para perguntas sobre riscos críticos, por categoria, status.",
      parameters: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["all", "critical", "high", "medium", "low"],
            description: "Nível de risco"
          },
          category: {
            type: "string",
            enum: ["environmental", "social", "governance", "all"],
            description: "Categoria do risco"
          },
          status: {
            type: "string",
            enum: ["active", "mitigated", "all"],
            description: "Status do risco"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_non_conformities",
      description: "Consulta não conformidades. Use para perguntas sobre NCs abertas, por tipo, gravidade.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "open", "in_treatment", "closed"],
            description: "Status da não conformidade"
          },
          severity: {
            type: "string",
            enum: ["all", "critical", "major", "minor"],
            description: "Gravidade da NC"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_employees",
      description: "Consulta dados de colaboradores. Use para perguntas sobre contagem, diversidade, departamentos.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "inactive"],
            description: "Status do colaborador"
          },
          groupBy: {
            type: "string",
            enum: ["department", "gender", "position"],
            description: "Agrupar por departamento, gênero ou cargo"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Obtém resumo executivo dos principais KPIs e alertas do dashboard. Use para visão geral do status ESG.",
      parameters: {
        type: "object",
        properties: {
          includeAlerts: {
            type: "boolean",
            description: "Incluir alertas e itens que precisam atenção"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "review_pending_extractions",
      description: "Lista extrações de documentos pendentes de aprovação. Use para saber quais documentos foram processados pela IA e aguardam validação.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Número máximo de extrações a retornar (padrão: 10)"
          },
          minConfidence: {
            type: "number",
            description: "Confiança mínima (0-1) para filtrar extrações"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_trends",
      description: "Analisa tendências e padrões em dados históricos. Use para identificar evolução temporal de métricas ESG.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goals", "tasks", "licenses", "risks", "non_conformities"],
            description: "Métrica a analisar"
          },
          period: {
            type: "string",
            enum: ["last_30_days", "last_90_days", "last_6_months", "last_year", "year_to_date"],
            description: "Período de análise"
          },
          groupBy: {
            type: "string",
            enum: ["day", "week", "month", "quarter"],
            description: "Granularidade da análise temporal"
          }
        },
        required: ["metric", "period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_periods",
      description: "Compara métricas entre dois períodos para identificar variações e tendências. Essencial para análises de evolução.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goals_progress", "task_completion", "license_compliance"],
            description: "Métrica a comparar"
          },
          currentPeriod: {
            type: "string",
            description: "Período atual (ex: '2025-01', 'Q1-2025', '2025')"
          },
          previousPeriod: {
            type: "string",
            description: "Período anterior (ex: '2024-12', 'Q4-2024', '2024')"
          }
        },
        required: ["metric", "currentPeriod", "previousPeriod"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "predict_future_metrics",
      description: "Prediz valores futuros de métricas com base em dados históricos. Use para projeções e planejamento estratégico.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goal_achievement", "task_completion_rate"],
            description: "Métrica a prever"
          },
          forecastPeriod: {
            type: "string",
            enum: ["next_month", "next_quarter", "next_6_months", "next_year"],
            description: "Período de previsão"
          },
          includeConfidence: {
            type: "boolean",
            description: "Incluir intervalos de confiança na previsão"
          }
        },
        required: ["metric", "forecastPeriod"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_correlations",
      description: "Analisa correlações entre diferentes métricas ESG. Use para identificar relações causais e impactos indiretos.",
      parameters: {
        type: "object",
        properties: {
          metrics: {
            type: "array",
            items: {
              type: "string",
              enum: ["emissions", "goals", "tasks", "risks", "non_conformities", "employees"]
            },
            description: "Lista de métricas a correlacionar (mínimo 2)"
          },
          period: {
            type: "string",
            enum: ["last_90_days", "last_6_months", "last_year"],
            description: "Período de análise"
          }
        },
        required: ["metrics"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_executive_summary",
      description: "Gera resumo executivo completo com insights, alertas e recomendações estratégicas. Use para visão holística da gestão ESG.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["full", "environmental", "social", "governance"],
            description: "Escopo do resumo"
          },
          includeRecommendations: {
            type: "boolean",
            description: "Incluir recomendações estratégicas"
          },
          priorityLevel: {
            type: "string",
            enum: ["critical_only", "high_priority", "all"],
            description: "Filtro de prioridade de insights"
          }
        },
        required: ["scope"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_compliance_gaps",
      description: "Analisa lacunas de conformidade e identifica áreas de risco regulatório. Essencial para gestão de compliance.",
      parameters: {
        type: "object",
        properties: {
          framework: {
            type: "string",
            enum: ["all", "licenses", "gri", "iso14001", "iso45001"],
            description: "Framework de conformidade a analisar"
          },
          includeRemediation: {
            type: "boolean",
            description: "Incluir plano de remediação"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "benchmark_performance",
      description: "Compara performance da empresa com benchmarks do setor. Use para análise competitiva e identificação de oportunidades.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions_intensity", "goal_achievement_rate", "compliance_score"],
            description: "Métrica a comparar"
          },
          sector: {
            type: "string",
            description: "Setor industrial para comparação (opcional, usa setor da empresa se não especificado)"
          }
        },
        required: ["metric"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "identify_optimization_opportunities",
      description: "Identifica oportunidades de otimização em processos ESG com base em análise de dados e padrões.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: ["all", "cost_reduction", "efficiency", "risk_mitigation", "goal_acceleration"],
            description: "Foco da análise de otimização"
          },
          includeImpact: {
            type: "boolean",
            description: "Incluir estimativa de impacto das oportunidades"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_stakeholder_impact",
      description: "Analisa impacto de ações ESG em diferentes stakeholders. Use para análise de materialidade e priorização.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Ação ou iniciativa a analisar"
          },
          stakeholderGroups: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Grupos de stakeholders a considerar (ex: ['funcionários', 'comunidade', 'investidores'])"
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "global_search",
      description: "Busca global em todo o sistema (metas, tarefas, documentos, riscos, licenças, etc). Use quando o usuário faz uma pergunta genérica ou busca por um termo específico.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Termo de busca ou palavra-chave"
          },
          limit: {
            type: "number",
            description: "Número máximo de resultados (padrão: 20)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_documents",
      description: "Consulta documentos do sistema. Use para buscar relatórios, políticas, certificados, evidências.",
      parameters: {
        type: "object",
        properties: {
          documentType: {
            type: "string",
            enum: ["all", "policy", "report", "certificate", "evidence", "procedure"],
            description: "Tipo de documento"
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags para filtrar documentos"
          },
          searchTerm: {
            type: "string",
            description: "Termo de busca no nome ou conteúdo"
          },
          recentOnly: {
            type: "boolean",
            description: "Apenas documentos recentes (últimos 90 dias)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_gri_reports",
      description: "Consulta relatórios e indicadores GRI. Use para perguntas sobre relatórios de sustentabilidade, indicadores GRI, progresso de disclosure.",
      parameters: {
        type: "object",
        properties: {
          reportYear: {
            type: "number",
            description: "Ano do relatório"
          },
          status: {
            type: "string",
            enum: ["all", "draft", "in_progress", "completed"],
            description: "Status do relatório"
          },
          includeIndicators: {
            type: "boolean",
            description: "Incluir detalhes dos indicadores"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_suppliers",
      description: "Consulta fornecedores e avaliação de cadeia de suprimentos. Use para análise de riscos na cadeia, qualificação de fornecedores.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "inactive", "qualified", "not_qualified"],
            description: "Status do fornecedor"
          },
          category: {
            type: "string",
            description: "Categoria do fornecedor"
          },
          minRating: {
            type: "number",
            description: "Avaliação mínima (0-5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_trainings",
      description: "Consulta programas de treinamento e capacitação. Use para análise de desenvolvimento de colaboradores, compliance de treinamentos obrigatórios.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "completed", "scheduled"],
            description: "Status do treinamento"
          },
          category: {
            type: "string",
            description: "Categoria do treinamento"
          },
          mandatory: {
            type: "boolean",
            description: "Apenas treinamentos obrigatórios"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_audits",
      description: "Consulta auditorias e inspeções. Use para acompanhar auditorias internas, externas, achados, não conformidades.",
      parameters: {
        type: "object",
        properties: {
          auditType: {
            type: "string",
            enum: ["all", "internal", "external", "certification", "compliance"],
            description: "Tipo de auditoria"
          },
          status: {
            type: "string",
            enum: ["all", "planned", "in_progress", "completed"],
            description: "Status da auditoria"
          },
          year: {
            type: "number",
            description: "Ano da auditoria"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_okrs",
      description: "Consulta OKRs (Objectives and Key Results). Use para acompanhar objetivos estratégicos e resultados-chave.",
      parameters: {
        type: "object",
        properties: {
          timePeriod: {
            type: "string",
            description: "Período (ex: Q1 2025, Anual 2025)"
          },
          objectiveType: {
            type: "string",
            enum: ["all", "strategic", "tactical", "operational"],
            description: "Tipo de objetivo"
          },
          minProgress: {
            type: "number",
            description: "Progresso mínimo (0-100)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_projects",
      description: "Consulta projetos e iniciativas estratégicas. Use para acompanhar projetos ESG, status, orçamento, cronograma.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "planning", "in_progress", "on_hold", "completed"],
            description: "Status do projeto"
          },
          category: {
            type: "string",
            enum: ["all", "environmental", "social", "governance"],
            description: "Categoria ESG do projeto"
          },
          budget: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" }
            },
            description: "Faixa de orçamento"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_waste_data",
      description: "Consulta dados de gestão de resíduos. Use para análise de geração, destinação, reciclagem de resíduos.",
      parameters: {
        type: "object",
        properties: {
          wasteClass: {
            type: "string",
            enum: ["all", "I", "IIA", "IIB"],
            description: "Classe do resíduo (I=Perigoso, IIA=Não Inerte, IIB=Inerte)"
          },
          year: {
            type: "number",
            description: "Ano de referência"
          },
          groupBy: {
            type: "string",
            enum: ["type", "month", "destination"],
            description: "Agrupar resultados"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_indicators",
      description: "Consulta indicadores de desempenho personalizados. Use para análise de KPIs, métricas customizadas, painéis de controle.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "environmental", "social", "governance", "operational", "financial"],
            description: "Categoria do indicador"
          },
          frequency: {
            type: "string",
            enum: ["all", "daily", "weekly", "monthly", "quarterly", "annual"],
            description: "Frequência de medição"
          },
          withAlerts: {
            type: "boolean",
            description: "Apenas indicadores com alertas ativos"
          }
        },
        required: []
      }
    }
  },
  
  // =================== FINANCIAL TOOLS ===================
  {
    type: "function",
    function: {
      name: "query_accounting_entries",
      description: "Consulta lançamentos contábeis. Use para análise de despesas, receitas, balanço.",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Data inicial (formato YYYY-MM-DD)"
          },
          endDate: {
            type: "string",
            description: "Data final (formato YYYY-MM-DD)"
          },
          status: {
            type: "string",
            enum: ["all", "Rascunho", "Lançado", "Aprovado"],
            description: "Status do lançamento"
          },
          includeDetails: {
            type: "boolean",
            description: "Incluir linhas detalhadas dos lançamentos"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_accounts_payable",
      description: "Consulta contas a pagar. Use para análise de dívidas, projeções de pagamento, fornecedores.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "Pendente", "Pago", "Em Atraso", "Agendado"],
            description: "Status da conta"
          },
          dueInDays: {
            type: "number",
            description: "Vencimento nos próximos X dias"
          },
          esgCategory: {
            type: "string",
            enum: ["all", "Environmental", "Social", "Governance"],
            description: "Filtrar por categoria ESG"
          },
          includeSupplierInfo: {
            type: "boolean",
            description: "Incluir informações do fornecedor"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_accounts_receivable",
      description: "Consulta contas a receber. Use para análise de receitas, inadimplência, fluxo de entrada.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "Pendente", "Recebido", "Em Atraso"],
            description: "Status da conta"
          },
          dueInDays: {
            type: "number",
            description: "Vencimento nos próximos X dias"
          },
          esgCategory: {
            type: "string",
            enum: ["all", "Environmental", "Social", "Governance"],
            description: "Filtrar por categoria ESG"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_financial_ratios",
      description: "Calcula índices financeiros (liquidez, rentabilidade, endividamento).",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["current_month", "current_quarter", "current_year", "custom"],
            description: "Período de análise"
          },
          ratios: {
            type: "array",
            items: {
              type: "string",
              enum: ["liquidity", "profitability", "debt", "esg_impact", "all"]
            },
            description: "Índices a calcular"
          }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "predict_cash_flow",
      description: "Prevê fluxo de caixa baseado em contas a pagar/receber e histórico.",
      parameters: {
        type: "object",
        properties: {
          forecastMonths: {
            type: "number",
            description: "Número de meses para projetar (1-12)"
          },
          includeESGImpact: {
            type: "boolean",
            description: "Incluir impacto de investimentos ESG na projeção"
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Nível de confiança da projeção"
          }
        },
        required: ["forecastMonths"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_esg_financial_impact",
      description: "Analisa impacto financeiro de iniciativas ESG (ROI, custos, benefícios).",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "number",
            description: "Ano de análise"
          },
          category: {
            type: "string",
            enum: ["Environmental", "Social", "Governance", "all"],
            description: "Categoria ESG"
          },
          includeROI: {
            type: "boolean",
            description: "Incluir cálculo de ROI por projeto"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_bank_accounts",
      description: "Consulta saldos e movimentações de contas bancárias.",
      parameters: {
        type: "object",
        properties: {
          includeBalances: {
            type: "boolean",
            description: "Incluir saldos atuais"
          },
          includeProjections: {
            type: "boolean",
            description: "Incluir projeções baseadas em contas a pagar/receber"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_financial_trends",
      description: "Analisa tendências financeiras (receitas, despesas, margens) ao longo do tempo.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["revenue", "expenses", "profit", "esg_costs", "cash_flow"],
            description: "Métrica a analisar"
          },
          period: {
            type: "string",
            enum: ["last_3_months", "last_6_months", "last_12_months", "year_to_date"],
            description: "Período de análise"
          },
          groupBy: {
            type: "string",
            enum: ["month", "quarter", "category", "esg_pillar"],
            description: "Agrupar resultados"
          }
        },
        required: ["metric", "period"]
      }
    }
  }
];
